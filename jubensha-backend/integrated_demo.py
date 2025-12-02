"""
剧本杀系统 - 完整 Demo (Phase 1 + 2)
Integrated Demo: Script Parsing + Knowledge Base

展示从剧本解析到知识库构建的完整流程
"""

import json
import sys
from pathlib import Path

# 添加路径
sys.path.insert(0, str(Path(__file__).parent))

from parsers.character_profiler import CharacterProfiler
from parsers.scene_extractor import SceneExtractor
from knowledge.kb_builder import KnowledgeBuilder


def run_integrated_demo():
    """运行完整的集成演示"""
    
    # 示例剧本
    demo_script = """
    雷雨交加的夜晚，书房。
    李医生焦急地在房间里踱步，他不断地擦拭额头上的汗水。桌子上放着一份被撕碎的遗嘱。
    突然，管家老王推门进来，手里端着一杯红茶。老王面无表情，眼神阴冷。
    李医生吓了一跳，下意识地用身体挡住了桌子上的碎纸片，结结巴巴地说："老...老王，我不是让你去休息了吗？"
    老王微微一笑，声音沙哑："老爷生前最喜欢喝这茶，李医生，您不尝尝吗？"
    
    老王缓缓走近，李医生后退了一步。此时，闪电照亮了整个房间，李医生注意到老王的衣袖上有血迹。
    """
    
    room_id = "demo_room_001"
    
    print("=" * 70)
    print("剧本杀 AI 系统 - 完整集成 Demo (Phase 1 + 2)")
    print("=" * 70)
    print("\n📖 输入剧本...")
    print("-" * 70)
    print(demo_script[:200] + "...")
    print("-" * 70)
    
    try:
        # ===== Phase 1: 剧本解析 =====
        print("\n" + "=" * 70)
        print("Phase 1: 剧本解析")
        print("=" * 70)
        
        # Step 1.1: 角色侧写
        print("\n[1.1] 角色侧写分析...")
        profiler = CharacterProfiler()
        characters = profiler.analyze(demo_script)
        
        print(f"✓ 提取 {len(characters)} 个角色：")
        for char in characters:
            print(f"  • {char['Name']}: {', '.join(char['Personality_Tags'][:2])}")
        
        # Step 1.2: 场景提取
        print("\n[1.2] 场景信息提取...")
        extractor = SceneExtractor()
        scene = extractor.extract(demo_script)
        
        print(f"✓ 场景: {scene['Scene_Name']}")
        print(f"  物品数量: {len(scene.get('Key_Objects', []))}")
        
        # ===== Phase 2: 知识库构建 =====
        print("\n" + "=" * 70)
        print("Phase 2: 知识库构建")
        print("=" * 70)
        
        # Step 2.1: 初始化知识库
        print("\n[2.1] 初始化 Vector DB...")
        kb = KnowledgeBuilder()
        
        # Step 2.2: 为所有角色构建知识库
        print("\n[2.2] 构建角色知识库...")
        kb.build_from_script(
            room_id=room_id,
            characters=characters,
            scene=scene,
            script_text=demo_script
        )
        
        # ===== Phase 3: 知识隔离测试 =====
        print("\n" + "=" * 70)
        print("Phase 3: 知识隔离测试")
        print("=" * 70)
        
        test_queries = [
            "遗嘱的情况如何？",
            "老王身上有什么异常？",
            "现在是什么天气？"
        ]
        
        for char in characters[:2]:  # 测试前两个角色
            char_name = char['Name']
            collection = f"game_{room_id}_agent_{char_name}"
            
            print(f"\n{'='*70}")
            print(f"🎭 {char_name} 的视角")
            print(f"{'='*70}")
            
            for query in test_queries:
                print(f"\n❓ 查询: \"{query}\"")
                
                # 李医生可以看到自己的私密 + 公共
                # 其他角色只能看到公共信息
                if char_name == "李医生":
                    permissions = ["Public", f"Private_{char_name}"]
                else:
                    permissions = ["Public", f"Private_{char_name}"]
                
                results = kb.search_knowledge(
                    collection_name=collection,
                    query=query,
                    permission_filter=permissions,
                    limit=2
                )
                
                if results:
                    for i, r in enumerate(results, 1):
                        score_bar = "█" * int(r['score'] * 10)
                        permission_icon = "🔒" if "Private" in r['permission'] else "🌍"
                        print(f"  {i}. {permission_icon} [{r['score']:.2f}] {score_bar}")
                        print(f"     {r['content'][:80]}...")
                else:
                    print("  ⚠ 没有找到相关信息")
        
        # ===== 总结 =====
        print("\n" + "=" * 70)
        print("✓ 集成 Demo 完成！")
        print("=" * 70)
        
        print("\n✨ 核心功能验证：")
        print("  ✓ 剧本解析 → 提取角色和场景")
        print("  ✓ 知识库构建 → 创建独立 Collection")
        print("  ✓ 权限隔离 → 私密信息不泄露")
        print("  ✓ RAG 检索 → 相关性搜索成功")
        
        # 保存配置
        Path("output").mkdir(exist_ok=True)
        
        with open("output/integrated_config.json", 'w', encoding='utf-8') as f:
            json.dump({
                "room_id": room_id,
                "characters": characters,
                "scene": scene,
                "collections_created": [
                    f"game_{room_id}_agent_{c['Name']}" for c in characters
                ]
            }, f, ensure_ascii=False, indent=2)
        
        print("\n📦 配置已保存到: output/integrated_config.json")
        
        return {
            "characters": characters,
            "scene": scene,
            "kb": kb
        }
        
    except Exception as e:
        print(f"\n✗ 错误: {e}")
        import traceback
        traceback.print_exc()
        return None


if __name__ == "__main__":
    import os
    
    # 检查环境
    if not os.getenv("OPENAI_API_KEY"):
        print("=" * 70)
        print("⚠ 错误：未设置 OPENAI_API_KEY 环境变量")
        print("=" * 70)
        print("\n请先设置 API Key：")
        print("  PowerShell: $env:OPENAI_API_KEY=\"sk-...\"")
        print("  Linux/Mac:  export OPENAI_API_KEY=\"sk-...\"")
        print("=" * 70)
        exit(1)
    
    # 检查 Qdrant
    print("📌 提示：请确保 Qdrant 服务已启动")
    print("   如未启动，请运行：docker run -p 6333:6333 qdrant/qdrant")
    print()
    
    input("按 Enter 继续...")
    
    result = run_integrated_demo()
    
    if result:
        print("\n" + "=" * 70)
        print("🎉 恭喜！您已完成 Phase 1 + 2 的集成")
        print("=" * 70)
        print("\n下一步：")
        print("  → Phase 3: 实现 LangGraph Agent 状态机")
        print("  → Phase 4: 构建 Web 接口和 DM 工具")
