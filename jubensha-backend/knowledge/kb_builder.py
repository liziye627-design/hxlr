"""
剧本杀系统 - 知识库构建器
Knowledge Base Builder for Jubensha AI System

使用 Qdrant Vector DB 实现知识隔离
"""

import json
import hashlib
from typing import List, Dict, Any, Optional
from pathlib import Path

try:
    from qdrant_client import QdrantClient
    from qdrant_client.models import (
        Distance, VectorParams, PointStruct,
        Filter, FieldCondition, MatchAny
    )
    HAS_QDRANT = True
except ImportError:
    HAS_QDRANT = False

try:
    from openai import OpenAI
    HAS_OPENAI = True
except ImportError:
    HAS_OPENAI = False


class KnowledgeBuilder:
    """知识库构建器：为每个角色创建隔离的知识库"""
    
    def __init__(
        self,
        qdrant_url: str = "http://localhost:6333",
        api_key: Optional[str] = None,
        embedding_model: str = "text-embedding-3-small"
    ):
        """
        初始化知识库构建器
        
        Args:
            qdrant_url: Qdrant 服务地址
            api_key: OpenAI API Key（用于生成嵌入向量）
            embedding_model: 嵌入模型名称
        """
        if not HAS_QDRANT:
            raise ImportError("需要安装 qdrant-client: pip install qdrant-client")
        
        if not HAS_OPENAI:
            raise ImportError("需要安装 openai: pip install openai")
        
        self.qdrant = QdrantClient(url=qdrant_url)
        self.openai = OpenAI(api_key=api_key)
        self.embedding_model = embedding_model
        
        # 嵌入向量维度（text-embedding-3-small: 1536维）
        self.vector_size = 1536
        
        print(f"✓ 知识库构建器初始化完成")
        print(f"  Qdrant: {qdrant_url}")
        print(f"  嵌入模型: {embedding_model}")
    
    def create_character_collection(
        self,
        room_id: str,
        character_name: str
    ) -> str:
        """
        为角色创建独立的 Collection
        
        Args:
            room_id: 房间 ID
            character_name: 角色名称
            
        Returns:
            Collection 名称
        """
        collection_name = f"game_{room_id}_agent_{character_name}"
        
        # 检查是否已存在
        collections = self.qdrant.get_collections().collections
        existing = [c.name for c in collections]
        
        if collection_name in existing:
            print(f"⚠ Collection 已存在: {collection_name}")
            return collection_name
        
        # 创建新 Collection
        self.qdrant.create_collection(
            collection_name=collection_name,
            vectors_config=VectorParams(
                size=self.vector_size,
                distance=Distance.COSINE
            )
        )
        
        print(f"✓ 创建 Collection: {collection_name}")
        return collection_name
    
    def _generate_embedding(self, text: str) -> List[float]:
        """
        生成文本的嵌入向量
        
        Args:
            text: 输入文本
            
        Returns:
            嵌入向量
        """
        response = self.openai.embeddings.create(
            model=self.embedding_model,
            input=text
        )
        return response.data[0].embedding
    
    def _generate_point_id(self, text: str) -> int:
        """
        为文本生成唯一 ID（使用 hash）
        
        Args:
            text: 文本内容
            
        Returns:
            整数 ID
        """
        hash_obj = hashlib.md5(text.encode('utf-8'))
        return int(hash_obj.hexdigest()[:8], 16)
    
    def add_knowledge(
        self,
        collection_name: str,
        text: str,
        permission: str = "Public",
        knowledge_type: str = "fact",
        metadata: Optional[Dict] = None
    ) -> int:
        """
        添加知识到 Vector DB
        
        Args:
            collection_name: Collection 名称
            text: 文本内容
            permission: 权限标签（"Public" 或 "Private_角色名"）
            knowledge_type: 知识类型（"fact", "clue", "event"）
            metadata: 额外的元数据
            
        Returns:
            添加的 Point ID
        """
        # 生成嵌入向量
        vector = self._generate_embedding(text)
        
        # 生成 ID
        point_id = self._generate_point_id(text)
        
        # 构建 payload
        payload = {
            "content": text,
            "permission": permission,
            "type": knowledge_type
        }
        
        if metadata:
            payload.update(metadata)
        
        # 上传到 Qdrant
        point = PointStruct(
            id=point_id,
            vector=vector,
            payload=payload
        )
        
        self.qdrant.upsert(
            collection_name=collection_name,
            points=[point]
        )
        
        return point_id
    
    def add_knowledge_batch(
        self,
        collection_name: str,
        texts: List[str],
        permissions: List[str],
        knowledge_types: Optional[List[str]] = None
    ):
        """
        批量添加知识
        
        Args:
            collection_name: Collection 名称
            texts: 文本列表
            permissions: 权限列表
            knowledge_types: 知识类型列表（可选）
        """
        if knowledge_types is None:
            knowledge_types = ["fact"] * len(texts)
        
        points = []
        for text, permission, ktype in zip(texts, permissions, knowledge_types):
            vector = self._generate_embedding(text)
            point_id = self._generate_point_id(text)
            
            points.append(PointStruct(
                id=point_id,
                vector=vector,
                payload={
                    "content": text,
                    "permission": permission,
                    "type": ktype
                }
            ))
        
        self.qdrant.upsert(
            collection_name=collection_name,
            points=points
        )
        
        print(f"✓ 批量添加 {len(points)} 条知识到 {collection_name}")
    
    def search_knowledge(
        self,
        collection_name: str,
        query: str,
        permission_filter: List[str],
        limit: int = 3,
        score_threshold: float = 0.5
    ) -> List[Dict[str, Any]]:
        """
        搜索知识（带权限过滤）
        
        Args:
            collection_name: Collection 名称
            query: 查询文本
            permission_filter: 允许的权限列表（如 ["Public", "Private_李医生"]）
            limit: 返回结果数量
            score_threshold: 相似度阈值
            
        Returns:
            搜索结果列表
        """
        # 生成查询向量
        query_vector = self._generate_embedding(query)
        
        # 构建权限过滤器
        filter_condition = Filter(
            must=[
                FieldCondition(
                    key="permission",
                    match=MatchAny(any=permission_filter)
                )
            ]
        )
        
        # 执行搜索
        results = self.qdrant.search(
            collection_name=collection_name,
            query_vector=query_vector,
            query_filter=filter_condition,
            limit=limit,
            score_threshold=score_threshold
        )
        
        # 格式化结果
        formatted_results = []
        for hit in results:
            formatted_results.append({
                "content": hit.payload["content"],
                "score": hit.score,
                "type": hit.payload.get("type", "unknown"),
                "permission": hit.payload.get("permission", "Public")
            })
        
        return formatted_results
    
    def build_from_script(
        self,
        room_id: str,
        characters: List[Dict],
        scene: Dict,
        script_text: str
    ):
        """
        从解析的剧本构建知识库
        
        Args:
            room_id: 房间 ID
            characters: 角色列表（来自 character_profiler）
            scene: 场景配置（来自 scene_extractor）
            script_text: 原始剧本文本
        """
        print("\n" + "=" * 60)
        print("开始构建知识库...")
        print("=" * 60)
        
        # 为每个角色创建知识库
        for char in characters:
            char_name = char['Name']
            collection = self.create_character_collection(room_id, char_name)
            
            # 1. 添加公共知识（场景描述）
            public_knowledge = [
                scene.get('Environment_Desc', ''),
                f"当前场景：{scene.get('Scene_Name', '')}"
            ]
            
            for text in public_knowledge:
                if text.strip():
                    self.add_knowledge(
                        collection_name=collection,
                        text=text,
                        permission="Public",
                        knowledge_type="fact"
                    )
            
            # 2. 添加公共物品线索
            for obj in scene.get('Key_Objects', []):
                if obj.get('Permission') == 'Public':
                    clue_text = f"{obj['Item']}: {obj.get('State', '')}"
                    self.add_knowledge(
                        collection_name=collection,
                        text=clue_text,
                        permission="Public",
                        knowledge_type="clue"
                    )
            
            # 3. 添加角色私密知识
            private_knowledge = [
                char.get('Hidden_Secret', ''),
                f"我的性格：{', '.join(char.get('Personality_Tags', []))}",
                f"说话风格：{char.get('Speaking_Style', '')}"
            ]
            
            for text in private_knowledge:
                if text.strip():
                    self.add_knowledge(
                        collection_name=collection,
                        text=text,
                        permission=f"Private_{char_name}",
                        knowledge_type="fact"
                    )
            
            # 4. 添加角色专属物品
            for obj in scene.get('Key_Objects', []):
                if obj.get('Permission') == f'Private_{char_name}':
                    clue_text = f"{obj['Item']}: {obj.get('State', '')}"
                    self.add_knowledge(
                        collection_name=collection,
                        text=clue_text,
                        permission=f"Private_{char_name}",
                        knowledge_type="clue"
                    )
            
            print(f"✓ {char_name} 的知识库构建完成")
        
        print("=" * 60)
        print("✓ 所有知识库构建完成！")
        print("=" * 60)


# 使用示例
if __name__ == "__main__":
    import os
    
    # 检查依赖
    if not os.getenv("OPENAI_API_KEY"):
        print("错误：请设置 OPENAI_API_KEY 环境变量")
        exit(1)
    
    # 初始化知识库构建器
    kb = KnowledgeBuilder()
    
    # 测试创建 Collection
    room_id = "demo_room_001"
    collection = kb.create_character_collection(room_id, "李医生")
    
    # 测试添加知识
    print("\n测试添加知识...")
    
    kb.add_knowledge(
        collection_name=collection,
        text="老爷在 22:00 被发现死在书房。",
        permission="Public",
        knowledge_type="fact"
    )
    
    kb.add_knowledge(
        collection_name=collection,
        text="我在 21:50 篡改了遗嘱，把继承人从'张三'改成了'李四'。",
        permission="Private_李医生",
        knowledge_type="fact"
    )
    
    print("✓ 知识添加完成")
    
    # 测试检索（李医生视角）
    print("\n测试检索（李医生可以看到的信息）...")
    results = kb.search_knowledge(
        collection_name=collection,
        query="遗嘱的情况",
        permission_filter=["Public", "Private_李医生"],
        limit=3
    )
    
    print(f"找到 {len(results)} 条相关知识：")
    for i, r in enumerate(results, 1):
        print(f"\n{i}. (相似度: {r['score']:.2f}) [{r['permission']}]")
        print(f"   {r['content'][:100]}...")
    
    # 测试检索（其他角色视角 - 应该看不到私密信息）
    print("\n测试检索（其他角色视角，只能看到公共信息）...")
    results_other = kb.search_knowledge(
        collection_name=collection,
        query="遗嘱的情况",
        permission_filter=["Public"],  # 只能看公共信息
        limit=3
    )
    
    print(f"找到 {len(results_other)} 条相关知识：")
    for i, r in enumerate(results_other, 1):
        print(f"\n{i}. (相似度: {r['score']:.2f}) [{r['permission']}]")
        print(f"   {r['content'][:100]}...")
    
    print("\n✓ 知识库系统测试完成！")
