"""
剧本杀系统 - 端到端演示
End-to-End Demo for Jubensha Parsing System

展示从原始剧本到结构化配置的完整流程
"""

import json
import sys
from pathlib import Path

# 添加 parsers 目录到路径
sys.path.insert(0, str(Path(__file__).parent))

from parsers.character_profiler import CharacterProfiler
from parsers.scene_extractor import SceneExtractor


def run_full_demo():
    """运行完整的剧本解析演示"""
    
    # 示例剧本（来自技术规范）
    demo_script = """
    雷雨交加的夜晚，书房。
    李医生焦急地在房间里踱步，他不断地擦拭额头上的汗水。桌子上放着一份被撕碎的遗嘱。
    突然，管家老王推门进来，手里端着一杯红茶。老王面无表情，眼神阴冷。
    李医生吓了一跳，下意识地用身体挡住了桌子上的碎纸片，结结巴巴地说："老...老王，我不是让你去休息了吗？"
    老王微微一笑，声音沙哑："老爷生前最喜欢喝这茶，李医生，您不尝尝吗？"
    """
    
    print("=" * 70)
    print("剧本杀 AI 系统 - 解析层 Demo")
    print("=" * 70)
    print("\n输入剧本片段：")
    print("-" * 70)
    print(demo_script)
    print("-" * 70)
    
    try:
        # Step 1: 角色侧写
        print("\n[Step 1] 角色侧写分析...")
        print("正在调用 LLM...")
        
        profiler = CharacterProfiler()
        characters = profiler.analyze(demo_script)
        
        print(f"✓ 提取到 {len(characters)} 个角色：")
        for char in characters:
            name = char.get('Name', '未知')
            tags = ', '.join(char.get('Personality_Tags', []))
            print(f"  • {name}: {tags}")
            if 'Hidden_Secret' in char:
                print(f"    秘密: {char['Hidden_Secret'][:50]}...")
        
        # 保存角色配置
        profiler.save_to_json(characters, "output/characters.json")
        
        # Step 2: 场景提取
        print("\n[Step 2] 场景信息提取...")
        print("正在调用 LLM...")
        
        extractor = SceneExtractor()
        scene = extractor.extract(demo_script)
        
        print(f"✓ 场景: {scene.get('Scene_Name', '未知')}")
        print(f"  氛围: {scene.get('Atmosphere', '未知')}")
        print(f"  物品:")
        for obj in scene.get('Key_Objects', []):
            item = obj.get('Item', '未知')
            value = obj.get('Clue_Value', 'Unknown')
            permission = obj.get('Permission', 'Public')
            print(f"    • {item} (价值:{value}, 权限:{permission})")
        
        # 保存场景配置
        extractor.save_to_json(scene, "output/scene.json")
        
        # Step 3: 生成 Agent 配置
        print("\n[Step 3] 生成 Agent 配置...")
        
        game_config = {
            "scene_id": "scene_001",
            "scene_info": scene,
            "agents_config": []
        }
        
        # 为每个角色生成 Agent 配置
        for char in characters:
            agent_config = {
                "agent_name": char['Name'],
                "system_prompt": generate_system_prompt(char),
                "private_knowledge": [char.get('Hidden_Secret', '')],
                "personality_tags": char.get('Personality_Tags', []),
                "speaking_style": char.get('Speaking_Style', ''),
                "goals": char.get('Goals', [])
            }
            game_config["agents_config"].append(agent_config)
        
        # 保存完整配置
        with open("output/game_config.json", 'w', encoding='utf-8') as f:
            json.dump(game_config, f, ensure_ascii=False, indent=2)
        
        print("✓ Agent 配置生成完成")
        print(f"  生成了 {len(game_config['agents_config'])} 个 Agent")
        
        # Step 4: 展示配置预览
        print("\n[Step 4] 配置预览")
        print("-" * 70)
        print("Agent 配置示例（李医生）：")
        print("-" * 70)
        
        if game_config["agents_config"]:
            preview = game_config["agents_config"][0]
            print(f"名称: {preview['agent_name']}")
            print(f"性格: {', '.join(preview['personality_tags'])}")
            print(f"System Prompt:")
            print(preview['system_prompt'][:200] + "...")
        
        print("\n" + "=" * 70)
        print("✓ Demo 完成！所有配置已保存到 output/ 目录")
        print("=" * 70)
        
        print("\n生成的文件：")
        print("  • output/characters.json  - 角色侧写")
        print("  • output/scene.json       - 场景配置")
        print("  • output/game_config.json - 完整游戏配置")
        
        return game_config
        
    except Exception as e:
        print(f"\n✗ 错误: {e}")
        import traceback
        traceback.print_exc()
        return None


def generate_system_prompt(character: dict) -> str:
    """生成角色的 System Prompt"""
    
    name = character.get('Name', '未知角色')
    personality = ', '.join(character.get('Personality_Tags', []))
    style = character.get('Speaking_Style', '正常')
    secret = character.get('Hidden_Secret', '')
    
    prompt = f"""# 角色：{name}
你现在是"{name}"。

## 核心设定
- **性格**：{personality}
- **说话风格**：{style}
- **当前情绪**：{character.get('Current_Emotion', '平静')}

## 目标与动机
"""
    
    for goal in character.get('Goals', []):
        prompt += f"- [{goal.get('priority', 1)}] {goal.get('description', '')}\n"
        for sub in goal.get('sub_goals', []):
            prompt += f"  • {sub}\n"
    
    prompt += f"""
## 防御性规则（CRITICAL）
1. **绝对准则**：只能基于你的私有知识库回答，禁止编造事实。
2. **秘密保护**：你的秘密是"{secret}"。当被询问相关内容时：
   - 如果对方怀疑度 < 50：撒谎（编造合理借口）
   - 如果对方怀疑度 > 70：转移话题（"我不想谈这个"）
3. **记忆一致性**：每次回答前，先检索你的记忆库，确保前后不矛盾。

## 性格表现
请在对话中体现出你的性格特点：{personality}。
说话时使用风格：{style}。
"""
    
    return prompt


if __name__ == "__main__":
    import os
    
    # 创建输出目录
    Path("output").mkdir(exist_ok=True)
    
    # 检查 API Key
    if not os.getenv("OPENAI_API_KEY"):
        print("=" * 70)
        print("错误：未设置 OPENAI_API_KEY 环境变量")
        print("=" * 70)
        print("\n请执行以下步骤：")
        print("\n在 Windows PowerShell 中：")
        print('  $env:OPENAI_API_KEY="sk-your-key-here"')
        print("\n在 Linux/Mac 中：")
        print('  export OPENAI_API_KEY="sk-your-key-here"')
        print("\n或者在 Python 代码中直接设置：")
        print('  os.environ["OPENAI_API_KEY"] = "sk-your-key-here"')
        print("=" * 70)
    else:
        result = run_full_demo()
        
        if result:
            print("\n提示：您可以查看 output/ 目录中的 JSON 文件查看详细配置")
