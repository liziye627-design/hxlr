"""
剧本杀系统 - 场景提取器
Scene Extractor for Jubensha AI System

从剧本中提取场景、物品和触发器
"""

import json
import os
from typing import Dict, Any

try:
    from openai import OpenAI
    HAS_OPENAI = True
except ImportError:
    HAS_OPENAI = False


class SceneExtractor:
    """场景提取器：从剧本中提取场景和可交互物品"""
    
    def __init__(self, api_key: str = None, model: str = "gpt-4"):
        if not HAS_OPENAI:
            raise ImportError("需要安装 openai 库")
        
        self.api_key = api_key or os.getenv("OPENAI_API_KEY")
        if not self.api_key:
            raise ValueError("必须提供 API key")
        
        self.client = OpenAI(api_key=self.api_key)
        self.model = model
        
        self.prompt_template = """# Role (角色)
你是剧本杀系统的"场景布景师"。

# Task (任务)
分析文本，提取场景信息和可交互物品。

# Output Format (纯 JSON，不要代码块)
{{
  "Scene_Name": "场景名称",
  "Environment_Desc": "环境描写（用于DM开场白）",
  "Atmosphere": "气氛标签（如：压抑、紧张、轻松）",
  "Key_Objects": [
    {{
      "Item": "物品名",
      "State": "当前状态",
      "Clue_Value": "High/Medium/Low",
      "Permission": "Public" or "Private_角色名"
    }}
  ],
  "Triggers": [
    {{
      "condition": "触发条件（如：玩家搜查桌子）",
      "event": "触发事件（如：发现撕碎的遗嘱）",
      "next_scene": "下一个场景（可选）"
    }}
  ]
}}

# Analysis Rules (分析规则)
1. **场景识别**：提取地点、时间、天气等环境因素
2. **物品权限**：
   - Public：所有人可见的线索
   - Private_角色名：只有特定角色才知道的信息
3. **线索价值判断**：
   - High：关键证据（如凶器、遗嘱）
   - Medium：辅助线索（如时间信息、位置）
   - Low：背景装饰（如家具、摆设）
4. **触发器创建**：识别可能的交互点和场景转换条件

# Input Text
{script_text}

# Important
- 只输出 JSON，不要包含 markdown 格式
- 确保所有字段都存在，如果没有触发器则 Triggers 为空数组
"""
    
    def extract(self, script_text: str) -> Dict[str, Any]:
        """
        提取场景信息
        
        Args:
            script_text: 剧本文本
            
        Returns:
            场景配置字典
        """
        prompt = self.prompt_template.format(script_text=script_text)
        
        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": "你是专业的剧本场景设计师。"},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.1
            )
            
            content = response.choices[0].message.content.strip()
            
            # 清理 markdown 包装
            if content.startswith("```"):
                lines = content.split("\n")
                content = "\n".join(lines[1:-1])
                if content.startswith("json"):
                    content = content[4:].strip()
            
            scene = json.loads(content)
            return scene
        
        except json.JSONDecodeError as e:
            print(f"JSON 解析失败: {e}")
            print(f"原始响应: {content}")
            raise
        except Exception as e:
            print(f"API 调用失败: {e}")
            raise
    
    def save_to_json(self, scene: Dict, output_path: str):
        """保存场景配置"""
        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(scene, f, ensure_ascii=False, indent=2)
        print(f"场景配置已保存到: {output_path}")


if __name__ == "__main__":
    demo_script = """
    雷雨交加的夜晚，书房。
    李医生焦急地在房间里踱步，他不断地擦拭额头上的汗水。桌子上放着一份被撕碎的遗嘱。
    突然，管家老王推门进来，手里端着一杯红茶。老王面无表情，眼神阴冷。
    """
    
    if not os.getenv("OPENAI_API_KEY"):
        print("错误：请设置 OPENAI_API_KEY 环境变量")
    else:
        try:
            extractor = SceneExtractor()
            
            print("正在提取场景信息...")
            scene = extractor.extract(demo_script)
            
            print("\n" + "=" * 60)
            print("场景配置：")
            print("=" * 60)
            print(json.dumps(scene, indent=2, ensure_ascii=False))
            
            extractor.save_to_json(scene, "scene_config.json")
            
        except Exception as e:
            print(f"执行失败: {e}")
