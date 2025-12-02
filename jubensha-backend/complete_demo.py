"""
剧本杀完整演示 (Phase 1 + 2 + 3)
Complete Demo: Parsing + Knowledge + Agent

展示从剧本解析到 AI 对话的完整流程
"""

import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))

from parsers.character_profiler import CharacterProfiler
from parsers.scene_extractor import SceneExtractor
from knowledge.kb_builder import KnowledgeBuilder
from agents.character_agent import CharacterAgent


def run_complete_demo():
    """运行完整演示"""
    
    # 扩展剧本
    demo_script = """
    雷雨交加的夜晚，书房。
    李医生焦急地在房间里踱步，他不断地擦拭额头上的汗水。桌子上放着一份被撕碎的遗嘱。
    突然，管家老王推门进来，手里端着一杯红茶。老王面无表情，眼神阴冷。
    李医生吓了一跳，下意识地用身体挡住了桌子上的碎纸片，结结巴巴地说："老...老王，我不是让你去休息了吗？"
    老王微微一笑，声音沙哑："老爷生前最喜欢喝这茶，李医生，您不尝尝吗？"
    
    闪电照亮房间，李医生注意到老王的衣袖上有血迹。老王注意到李医生的目光，不动声色地将袖子拉下。
    "李医生，您看起来很紧张啊。是不是有什么心事？"老王缓缓问道。
    李医生强作镇定："没...没有，只是...只是老爷突然去世，我很难过。"
    """
    
    room_id = "game_room_001"
    
    print("=" * 80)
    print("🎭 剧本杀 AI 系统 - 完整演示 (Phase 1 + 2 + 3)")
    print("=" * 80)
    
    try:
        # ===== Phase 1: 剧本解析 =====
        print("\n" + "=" * 80)
        print("📖 Phase 1: 剧本解析")
        print("=" * 80)
        
        print("\n[1/2] 角色侧写...")
        profiler = CharacterProfiler()
        characters = profiler.analyze(demo_script)
        
        print(f"✓ 提取 {len(characters)} 个角色")
        for char in characters:
            print(f"  • {char['Name']}: {', '.join(char['Personality_Tags'][:2])}")
        
        print("\n[2/2] 场景提取...")
        extractor = SceneExtractor()
        scene = extractor.extract(demo_script)
        
        print(f"✓ 场景: {scene['Scene_Name']}")
        
        # ===== Phase 2: 知识库构建 =====
        print("\n" + "=" * 80)
        print("💾 Phase 2: 知识库构建")
        print("=" * 80)
        
        kb = KnowledgeBuilder()
        kb.build_from_script(room_id, characters, scene, demo_script)
        
        # ===== Phase 3: AI Agent 初始化 =====
        print("\n" + "=" * 80)
        print("🤖 Phase 3: AI Agent 初始化")
        print("=" * 80)
        
        agents = {}
        
        for char in characters[:2]:  # 创建前两个角色的 Agent
            char_name = char['Name']
            
            # 为 Agent 准备配置
            agent_config = {
                "agent_name": char_name,
                "system_prompt": f"""你是{char_name}。
性格：{', '.join(char['Personality_Tags'])}
说话风格：{char['Speaking_Style']}
当前情绪：{char['Current_Emotion']}
秘密：{char['Hidden_Secret']}

请在对话中体现你的性格和说话风格。
如果有人询问你的秘密，根据怀疑度采取不同策略。
""",
                "private_knowledge": [char['Hidden_Secret']],
                "personality_tags": char['Personality_Tags'],
                "speaking_style": char['Speaking_Style'],
                "goals": char.get('Goals', [])
            }
            
            agent = CharacterAgent(
                character_config=agent_config,
                kb_builder=kb,
                room_id=room_id
            )
            
            agents[char_name] = agent
        
        # ===== Phase 4: 互动对话演示 =====
        print("\n" + "=" * 80)
        print("💬 Phase 4: AI 对话演示")
        print("=" * 80)
        
        # 模拟侦探盘问
        detective_questions = [
            {
                "target": list(agents.keys())[0],  # 第一个角色
                "questions": [
                    "你昨晚 22:00 在哪里？",
                    "桌子上那份撕碎的遗嘱是怎么回事？",
                    "你知道老爷的遗嘱内容吗？"
                ]
            },
            {
                "target": list(agents.keys())[1] if len(agents) > 1 else list(agents.keys())[0],
                "questions": [
                    "你的衣袖上为什么有血迹？",
                    "你为什么要给李医生送茶？"
                ]
            }
        ]
        
        for scenario in detective_questions:
            target_name = scenario['target']
            agent = agents[target_name]
            
            print(f"\n{'='*80}")
            print(f"🎯 盘问对象：{target_name}")
            print(f"{'='*80}")
            
            for i, question in enumerate(scenario['questions'], 1):
                print(f"\n[Q{i}] 侦探: {question}")
                
                response = agent.respond("侦探", question)
                
                print(f"[A{i}] {target_name}: {response}")
                
                # 显示内部状态（调试）
                if hasattr(agent, 'initial_state'):
                    suspicion = agent.initial_state.get('suspicion_scores', {})
                    if suspicion:
                        print(f"     💭 怀疑度: {suspicion}")
        
        # ===== 总结 =====
        print("\n" + "=" * 80)
        print("✨ 演示完成！")
        print("=" * 80)
        
        print("\n🎉 核心功能展示：")
        print("  ✓ 剧本解析 → 提取角色和场景")
        print("  ✓ 知识库构建 → 独立 Vector DB")
        print("  ✓ AI Agent → 基于 LangGraph 的状态机")
        print("  ✓ 怀疑度引擎 → 动态追踪可信度")
        print("  ✓ 策略决策 → 诚实/欺骗/防守")
        print("  ✓ 自然对话 → 符合角色性格")
        
        # 保存配置
        Path("output").mkdir(exist_ok=True)
        
        with open("output/complete_demo.json", 'w', encoding='utf-8') as f:
            json.dump({
                "room_id": room_id,
                "characters": characters,
                "scene": scene,
                "agents_created": list(agents.keys())
            }, f, ensure_ascii=False, indent=2)
        
        print("\n📦 配置已保存: output/complete_demo.json")
        
        return agents
        
    except Exception as e:
        print(f"\n✗ 错误: {e}")
        import traceback
        traceback.print_exc()
        return None


if __name__ == "__main__":
    import os
    
    # 环境检查
    if not os.getenv("OPENAI_API_KEY"):
        print("=" * 80)
        print("⚠ 错误：未设置 OPENAI_API_KEY 环境变量")
        print("=" * 80)
        print("\n请先设置 API Key：")
        print("  PowerShell: $env:OPENAI_API_KEY=\"sk-...\"")
        print("  Linux/Mac:  export OPENAI_API_KEY=\"sk-...\"")
        print("=" * 80)
        exit(1)
    
    print("📌 确认事项：")
    print("  1. Qdrant 已启动（docker run -p 6333:6333 qdrant/qdrant）")
    print("  2. 已安装依赖（pip install -r requirements.txt）")
    print()
    
    input("按 Enter 开始演示...")
    
    result = run_complete_demo()
    
    if result:
        print("\n" + "=" * 80)
        print("🚀 下一步：")
        print("  → Phase 4: 构建 Web 接口（FastAPI + React）")
        print("  → 添加多人互动和 DM 控制功能")
        print("=" * 80)
