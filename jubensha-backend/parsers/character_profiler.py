"""
剧本杀系统 - 角色侧写提取器
Character Profiling Extractor for Jubensha AI System

基于 LLM 从剧本文本中提取角色画像
"""

import json
import os
from typing import List, Dict, Any

# 注意：需要安装 openai 库
# pip install openai
try:
    from openai import OpenAI
    HAS_OPENAI = True
except ImportError:
    HAS_OPENAI = False
    print("警告：未安装 openai 库。请运行: pip install openai")


class CharacterProfiler:
    """角色侧写器：从剧本中提取角色心理画像"""
    
    def __init__(self, api_key: str = None, model: str = "gpt-4"):
        """
        初始化侧写器
        
        Args:
            api_key: OpenAI API Key（如果为 None，从环境变量读取）
            model: 使用的模型名称
        """
        if not HAS_OPENAI:
            raise ImportError("需要安装 openai 库")
        
        self.api_key = api_key or os.getenv("OPENAI_API_KEY")
        if not self.api_key:
            raise ValueError("必须提供 API key 或设置 OPENAI_API_KEY 环境变量")
        
        self.client = OpenAI(api_key=self.api_key)
        self.model = model
        
        # Prompt 模板（来自您的技术规范）
        self.prompt_template = """# Role (角色)
你是剧本杀系统的"首席侧写师"。

# Task (任务)
阅读剧本片段，提取角色心理画像。

# Requirements (要求)
输出严格 JSON 格式（不要包含 markdown 代码块，只输出纯 JSON）：
{{
  "characters": [
    {{
      "Name": "角色姓名",
      "Personality_Tags": ["形容词1", "形容词2", "形容词3"],
      "Speaking_Style": "说话风格描述",
      "Hidden_Secret": "该角色试图隐藏的信息",
      "Current_Emotion": "当前情绪",
      "Goals": [
        {{
          "priority": 1,
          "description": "终极目标",
          "sub_goals": ["子目标1", "子目标2"]
        }}
      ],
      "Relationships": {{
        "其他角色名": "关系描述"
      }}
    }}
  ]
}}

# Analysis Rules (分析规则)
1. 从行为推测动机（如：擦汗 → 紧张）
2. 从对话推测性格（如：结巴 → 心虚）
3. 识别潜台词（如：遮挡物品 → 隐藏证据）
4. 基于剧情上下文推断角色隐藏的秘密
5.设定合理的目标层次结构

# Input Text (输入文本)
{script_text}

# Important (重要提示)
- 只输出 JSON，不要包含任何其他文字或 markdown 格式
- 确保 JSON 格式完全正确，可以被 Python json.loads() 解析
"""
    
    def analyze(self, script_text: str) -> List[Dict[str, Any]]:
        """
        分析剧本片段，提取角色列表
        
        Args:
            script_text: 剧本文本
            
        Returns:
            角色列表，每个角色包含性格、秘密、目标等信息
        """
        prompt = self.prompt_template.format(script_text=script_text)
        
        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": "你是专业的剧本分析师，擅长角色心理分析。"},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.1  # 降低随机性，提高一致性
            )
            
            content = response.choices[0].message.content.strip()
            
            # 清理可能的 markdown 代码块包装
            if content.startswith("```"):
                lines = content.split("\n")
                content = "\n".join(lines[1:-1])  # 移除首尾的 ``` 标记
                if content.startswith("json"):
                    content = content[4:].strip()
            
            # 解析 JSON
            result = json.loads(content)
            
            # 提取 characters 数组
            if isinstance(result, dict) and "characters" in result:
                characters = result["characters"]
            elif isinstance(result, list):
                characters = result
            else:
                characters = [result]
            
            return characters
        
        except json.JSONDecodeError as e:
            print(f"JSON 解析失败: {e}")
            print(f"原始响应: {content}")
            raise
        except Exception as e:
            print(f"API 调用失败: {e}")
            raise
    
    def save_to_json(self, characters: List[Dict], output_path: str):
        """
        保存角色配置到 JSON 文件
        
        Args:
            characters: 角色列表
            output_path: 输出文件路径
        """
        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(characters, f, ensure_ascii=False, indent=2)
        print(f"角色配置已保存到: {output_path}")


# 使用示例
if __name__ == "__main__":
    # 示例剧本片段（来自您的示例）
    demo_script = """
    雷雨交加的夜晚，书房。
    李医生焦急地在房间里踱步，他不断地擦拭额头上的汗水。桌子上放着一份被撕碎的遗嘱。
    突然，管家老王推门进来，手里端着一杯红茶。老王面无表情，眼神阴冷。
    李医生吓了一跳，下意识地用身体挡住了桌子上的碎纸片，结结巴巴地说："老...老王，我不是让你去休息了吗？"
    老王微微一笑，声音沙哑："老爷生前最喜欢喝这茶，李医生，您不尝尝吗？"
    """
    
    # 检查环境变量
    if not os.getenv("OPENAI_API_KEY"):
        print("错误：请设置 OPENAI_API_KEY 环境变量")
        print("或在代码中直接传入 api_key 参数")
        print("\n示例：")
        print('profiler = CharacterProfiler(api_key="sk-...")')
    else:
        try:
            profiler = CharacterProfiler()
            
            print("正在分析剧本...")
            characters = profiler.analyze(demo_script)
            
            print("\n" + "=" * 60)
            print("解析结果：")
            print("=" * 60)
            print(json.dumps(characters, indent=2, ensure_ascii=False))
            
            # 保存到文件
            profiler.save_to_json(characters, "character_profiles.json")
            
        except Exception as e:
            print(f"执行失败: {e}")
