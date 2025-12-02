"""
剧本杀 AI Agent - 核心状态机
Character Agent with LangGraph State Machine

基于 LangGraph 实现的角色 Agent，支持：
- 怀疑度追踪
- 目标导向决策
- RAG 知识检索
- 防御性对话
"""

from typing import TypedDict, Annotated, List, Dict, Any, Optional
import operator
import json

try:
    from langgraph.graph import StateGraph, END
    HAS_LANGGRAPH = True
except ImportError:
    HAS_LANGGRAPH = False
    print("警告：未安装 langgraph。请运行: pip install langgraph")

try:
    from openai import OpenAI
    HAS_OPENAI = True
except ImportError:
    HAS_OPENAI = False


class AgentState(TypedDict):
    """Agent 状态定义"""
    
    # 消息历史
    messages: Annotated[List[Dict], operator.add]
    
    # 角色配置
    character_config: Dict[str, Any]
    
    # 怀疑度矩阵 {角色名: 分数(0-100)}
    suspicion_scores: Dict[str, float]
    
    # 私有知识
    private_knowledge: List[str]
    
    # 目标列表
    goals: List[Dict[str, Any]]
    
    # 当前策略
    current_strategy: Optional[str]
    
    # RAG 检索结果
    retrieved_memories: List[Dict[str, Any]]


class CharacterAgent:
    """剧本杀角色 Agent"""
    
    def __init__(
        self,
        character_config: Dict,
        kb_builder,  # KnowledgeBuilder 实例
        room_id: str,
        api_key: Optional[str] = None
    ):
        """
        初始化 Agent
        
        Args:
            character_config: 角色配置（来自 Phase 1 解析）
            kb_builder: 知识库构建器实例
            room_id: 房间 ID
            api_key: OpenAI API Key
        """
        if not HAS_LANGGRAPH:
            raise ImportError("需要安装 langgraph")
        
        if not HAS_OPENAI:
            raise ImportError("需要安装 openai")
        
        self.character_name = character_config['agent_name']
        self.character_config = character_config
        self.kb = kb_builder
        self.room_id = room_id
        self.collection_name = f"game_{room_id}_agent_{self.character_name}"
        
        self.openai = OpenAI(api_key=api_key)
        
        # 初始化状态
        self.initial_state = AgentState(
            messages=[],
            character_config=character_config,
            suspicion_scores={},
            private_knowledge=character_config.get('private_knowledge', []),
            goals=character_config.get('goals', []),
            current_strategy=None,
            retrieved_memories=[]
        )
        
        # 构建 LangGraph
        self.graph = self._build_graph()
        
        print(f"✓ Agent '{self.character_name}' 初始化完成")
    
    def _build_graph(self) -> StateGraph:
        """构建 Agent 状态图"""
        
        workflow = StateGraph(AgentState)
        
        # 添加节点
        workflow.add_node("perceive", self._perceive_message)
        workflow.add_node("retrieve_memory", self._retrieve_knowledge)
        workflow.add_node("update_suspicion", self._update_suspicion)
        workflow.add_node("decide_strategy", self._decide_strategy)
        workflow.add_node("generate_response", self._generate_response)
        
        # 定义流程
        workflow.set_entry_point("perceive")
        workflow.add_edge("perceive", "retrieve_memory")
        workflow.add_edge("retrieve_memory", "update_suspicion")
        workflow.add_edge("update_suspicion", "decide_strategy")
        workflow.add_edge("decide_strategy", "generate_response")
        workflow.add_edge("generate_response", END)
        
        return workflow.compile()
    
    def _perceive_message(self, state: AgentState) -> Dict:
        """
        感知节点：接收并理解输入消息
        """
        # 这里可以添加消息预处理逻辑
        # 例如：提取关键信息、识别意图等
        return {}
    
    def _retrieve_knowledge(self, state: AgentState) -> Dict:
        """
        检索节点：从知识库中检索相关记忆
        """
        if not state['messages']:
            return {"retrieved_memories": []}
        
        latest_message = state['messages'][-1]
        query = latest_message.get('content', '')
        
        # 构建权限过滤器
        permissions = ["Public", f"Private_{self.character_name}"]
        
        # RAG 检索
        results = self.kb.search_knowledge(
            collection_name=self.collection_name,
            query=query,
            permission_filter=permissions,
            limit=3
        )
        
        return {"retrieved_memories": results}
    
    def _update_suspicion(self, state: AgentState) -> Dict:
        """
        怀疑度引擎：评估对方是否在说谎
        
        核心逻辑：
        1. 检索相关记忆
        2. 与对方声称进行对比
        3. 使用 LLM 评估冲突程度
        4. 更新怀疑度分数
        """
        if not state['messages']:
            return {}
        
        latest_message = state['messages'][-1]
        sender = latest_message.get('sender', 'Unknown')
        content = latest_message.get('content', '')
        
        # 跳过自己的消息
        if sender == self.character_name:
            return {}
        
        # 获取检索到的记忆
        memories = state.get('retrieved_memories', [])
        
        if not memories:
            return {}
        
        # 构建评估 Prompt
        memory_text = "\n".join([f"- {m['content']}" for m in memories])
        
        prompt = f"""你是"{self.character_name}"。

你的已知事实：
{memory_text}

对方（{sender}）声称：
"{content}"

基于你的记忆，评估对方是否在说谎。

请以 JSON 格式返回（不要包含 markdown）：
{{
  "conflict_score": <0-100的整数，100表示完全矛盾>,
  "reason": "简短的理由（一句话）"
}}
"""
        
        try:
            response = self.openai.chat.completions.create(
                model="gpt-4",
                messages=[
                    {"role": "system", "content": "你是专业的逻辑分析师。"},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.1
            )
            
            result_text = response.choices[0].message.content.strip()
            
            # 清理 markdown
            if result_text.startswith("```"):
                lines = result_text.split("\n")
                result_text = "\n".join(lines[1:-1])
                if result_text.startswith("json"):
                    result_text = result_text[4:].strip()
            
            result = json.loads(result_text)
            conflict_score = result.get('conflict_score', 0)
            
            # 更新怀疑度
            new_scores = state['suspicion_scores'].copy()
            current_score = new_scores.get(sender, 0)
            new_scores[sender] = min(100, current_score + conflict_score * 0.3)  # 阻尼因子
            
            print(f"  [{self.character_name}] 怀疑度更新: {sender} = {new_scores[sender]:.1f} (+{conflict_score*0.3:.1f})")
            
            return {"suspicion_scores": new_scores}
        
        except Exception as e:
            print(f"  错误：怀疑度评估失败 - {e}")
            return {}
    
    def _decide_strategy(self, state: AgentState) -> Dict:
        """
        策略决策节点：基于目标和怀疑度决定回应策略
        
        策略类型：
        - honest: 诚实回答
        - bluff: 欺骗/编造
        - defensive: 转移话题
        - evasive: 含糊其辞
        """
        if not state['messages']:
            return {"current_strategy": "honest"}
        
        latest_message = state['messages'][-1]
        sender = latest_message.get('sender', 'Unknown')
        
        # 获取怀疑度
        sender_suspicion = state['suspicion_scores'].get(sender, 0)
        
        # 获取当前最高优先级目标
        goals = state.get('goals', [])
        top_goal = goals[0] if goals else {}
        goal_desc = top_goal.get('description', '').lower()
        
        # 策略决策逻辑
        if "隐藏" in goal_desc or "隐瞒" in goal_desc:
            # 有秘密要隐藏
            if sender_suspicion > 70:
                strategy = "defensive"  # 高度怀疑 → 防守
            elif sender_suspicion > 40:
                strategy = "evasive"    # 中度怀疑 → 含糊
            else:
                strategy = "bluff"      # 低度怀疑 → 欺骗
        else:
            strategy = "honest"         # 无秘密 → 诚实
        
        print(f"  [{self.character_name}] 策略: {strategy} (怀疑度: {sender_suspicion:.1f})")
        
        return {"current_strategy": strategy}
    
    def _generate_response(self, state: AgentState) -> Dict:
        """
        生成回复节点：基于策略和记忆生成自然的回复
        """
        if not state['messages']:
            return {}
        
        latest_message = state['messages'][-1]
        sender = latest_message.get('sender', 'Unknown')
        content = latest_message.get('content', '')
        
        strategy = state.get('current_strategy', 'honest')
        memories = state.get('retrieved_memories', [])
        character_config = state['character_config']
        
        # 构建上下文
        memory_context = "\n".join([f"- {m['content']}" for m in memories[:2]])
        
        # 构建回复 Prompt
        system_prompt = character_config.get('system_prompt', '')
        
        strategy_instructions = {
            "honest": "诚实地回答，基于你的记忆提供真实信息。",
            "bluff": "编造一个合理的谎言来掩盖真相。确保谎言符合逻辑且难以被察觉。",
            "defensive": "转移话题或表示不愿谈论。使用'我不想谈这个'或'这不重要'等表达。",
            "evasive": "给出含糊的回答，既不完全承认也不完全否认。"
        }
        
        user_prompt = f"""{sender} 问你："{content}"

当前策略：{strategy}
{strategy_instructions[strategy]}

相关记忆：
{memory_context}

请以"{self.character_name}"的身份、使用你的说话风格回复（50字以内）：
"""
        
        try:
            response = self.openai.chat.completions.create(
                model="gpt-4",
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                temperature=0.7,  # 增加创造性
                max_tokens=150
            )
            
            reply = response.choices[0].message.content.strip()
            
            # 添加到消息历史
            new_message = {
                "sender": self.character_name,
                "content": reply,
                "strategy": strategy
            }
            
            print(f"  [{self.character_name}] 回复: {reply[:50]}...")
            
            return {"messages": [new_message]}
        
        except Exception as e:
            print(f"  错误：生成回复失败 - {e}")
            return {}
    
    def respond(self, sender: str, message: str) -> str:
        """
        对外接口：接收消息并生成回复
        
        Args:
            sender: 发送者名称
            message: 消息内容
            
        Returns:
            Agent 的回复
        """
        # 准备输入消息
        input_message = {
            "sender": sender,
            "content": message
        }
        
        # 执行状态图
        final_state = self.graph.invoke({
            **self.initial_state,
            "messages": [input_message]
        })
        
        # 提取回复
        if final_state.get('messages'):
            last_message = final_state['messages'][-1]
            if last_message.get('sender') == self.character_name:
                return last_message['content']
        
        return "（沉默）"


# 使用示例
if __name__ == "__main__":
    import os
    import sys
    from pathlib import Path
    
    # 添加路径
    sys.path.insert(0, str(Path(__file__).parent.parent))
    
    from knowledge.kb_builder import KnowledgeBuilder
    
    # 检查环境
    if not os.getenv("OPENAI_API_KEY"):
        print("错误：请设置 OPENAI_API_KEY 环境变量")
        exit(1)
    
    print("=" * 70)
    print("剧本杀 Agent 测试")
    print("=" * 70)
    
    # 初始化知识库
    kb = KnowledgeBuilder()
    
    # 模拟角色配置
    character_config = {
        "agent_name": "李医生",
        "system_prompt": """你是李医生，性格神经质、心虚。
说话风格：结巴，重复词语，语气慌张。
你必须隐藏篡改遗嘱的秘密。""",
        "private_knowledge": [
            "我在 21:50 篡改了遗嘱，把继承人从'张三'改成了'李四'。"
        ],
        "personality_tags": ["神经质", "心虚", "焦虑"],
        "speaking_style": "结巴，重复词语",
        "goals": [
            {
                "priority": 1,
                "description": "隐藏篡改遗嘱的事实",
                "sub_goals": ["转移话题", "编造借口"]
            }
        ]
    }
    
    room_id = "test_room"
    
    # 创建知识库
    collection = kb.create_character_collection(room_id, "李医生")
    
    # 添加知识
    kb.add_knowledge(collection, "老爷在 22:00 被发现死在书房。", "Public")
    kb.add_knowledge(
        collection,
        character_config['private_knowledge'][0],
        "Private_李医生"
    )
    
    # 初始化 Agent
    agent = CharacterAgent(
        character_config=character_config,
        kb_builder=kb,
        room_id=room_id
    )
    
    # 测试对话
    print("\n" + "=" * 70)
    print("对话测试")
    print("=" * 70)
    
    test_questions = [
        ("侦探", "李医生，你昨天晚上在哪里？"),
        ("侦探", "桌子上的遗嘱是怎么回事？"),
        ("老王", "医生，您知道老爷的遗嘱内容吗？")
    ]
    
    for sender, question in test_questions:
        print(f"\n{sender}: {question}")
        response = agent.respond(sender, question)
        print(f"{character_config['agent_name']}: {response}")
        print()
    
    print("=" * 70)
    print("✓ Agent 测试完成")
    print("=" * 70)
