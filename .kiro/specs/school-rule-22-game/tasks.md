# Implementation Plan

## Phase 1: 核心数据结构与类型定义

- [ ] 1. 创建Script22类型定义
  - [ ] 1.1 创建 `src/data/script22/Script22Types.ts` 类型文件
    - 定义 Script22Config, Script22Character, PersonalityTraits, Secret, Relationship 接口
    - 定义 GamePhase, PsychologicalState, Emotion 类型
    - 定义 Script22Scene, InteractivePoint, Script22Clue 接口
    - _Requirements: 7.1, 7.2_
  - [ ] 1.2 编写属性测试：配置验证
    - **Property 15: Script Configuration Validation**
    - **Validates: Requirements 7.1, 7.2**

- [ ] 2. 创建Script22Config配置文件
  - [ ] 2.1 创建 `src/data/script22/Script22Config.ts` 剧本配置
    - 配置7个角色基础信息（李萱萱、皇甫青、姚青峰、吕思琦、叶冷星、谢雨晴、白穆）
    - 配置7个场景（教室、天台、办公室、厕所、宿舍、衣柜、纸箱）
    - 配置线索列表和发现条件
    - 配置游戏阶段序列
    - _Requirements: 1.1, 3.1_
  - [ ] 2.2 编写属性测试：角色初始化完整性
    - **Property 1: Character Initialization Completeness**
    - **Validates: Requirements 1.1, 5.1**

- [ ] 3. 创建Script22Personas角色人格配置
  - [ ] 3.1 创建 `src/data/script22/Script22Personas.ts` 人格配置
    - 李萱萱 Persona（扭曲的依恋）
    - 皇甫青 Persona（自我认知撕裂）
    - 姚青峰 Persona（恐惧与虚张声势）
    - 吕思琦 Persona（虚伪的完美）
    - 叶冷星 Persona（救赎与理智）
    - 谢雨晴 Persona（恶意的操控者）
    - 白穆 Persona（受害者的沉默）
    - _Requirements: 5.1, 5.5_
  - [ ] 3.2 编写属性测试：人格一致性响应模式
    - **Property 12: Personality-Consistent Response Patterns**
    - **Validates: Requirements 5.5**

- [ ] 4. Checkpoint - 确保所有测试通过
  - Ensure all tests pass, ask the user if questions arise.

## Phase 2: 游戏流程控制

- [ ] 5. 创建游戏状态机
  - [ ] 5.1 创建 `src/server/script22/Script22GameFlow.ts` 游戏流程控制器
    - 实现 GamePhase 状态转换逻辑
    - 实现 advancePhase() 方法
    - 实现 canTransition() 验证方法
    - _Requirements: 2.1, 2.2_
  - [ ] 5.2 编写属性测试：阶段转换正确性
    - **Property 3: Phase Transition Correctness**
    - **Validates: Requirements 2.1, 2.2**
  - [ ] 5.3 实现轮流发言机制
    - 实现 speakingOrder 管理
    - 实现 nextSpeaker() 方法
    - 实现发言状态追踪
    - _Requirements: 2.4_
  - [ ] 5.4 编写属性测试：轮流发言顺序
    - **Property 4: Round-Robin Speaking Order**
    - **Validates: Requirements 2.4**

- [ ] 6. 创建投票系统
  - [ ] 6.1 创建 `src/server/script22/VoteSystem.ts` 投票系统
    - 实现投票收集逻辑
    - 实现投票计算方法
    - 实现平票处理逻辑
    - _Requirements: 2.6_
  - [ ] 6.2 编写属性测试：投票计算正确性
    - **Property 5: Vote Calculation Correctness**
    - **Validates: Requirements 2.6**

- [ ] 7. Checkpoint - 确保所有测试通过
  - Ensure all tests pass, ask the user if questions arise.

## Phase 3: 场景与线索系统

- [ ] 8. 创建场景管理器
  - [ ] 8.1 创建 `src/server/script22/SceneManager.ts` 场景管理器
    - 实现场景加载和切换逻辑
    - 实现交互点管理
    - 实现场景状态追踪
    - _Requirements: 3.1, 3.4_
  - [ ] 8.2 编写属性测试：场景数据完整性
    - **Property 6: Scene Data Completeness**
    - **Validates: Requirements 3.1**

- [ ] 9. 创建线索系统
  - [ ] 9.1 创建 `src/server/script22/ClueSystem.ts` 线索系统
    - 实现线索发现条件检查
    - 实现线索状态管理
    - 实现线索与角色关联
    - _Requirements: 3.2, 3.3, 3.5_
  - [ ] 9.2 编写属性测试：线索发现条件执行
    - **Property 7: Clue Discovery Condition Enforcement**
    - **Validates: Requirements 3.2, 3.5**
  - [ ] 9.3 编写属性测试：线索面板一致性
    - **Property 8: Clue Panel Consistency**
    - **Validates: Requirements 3.3**

- [ ] 10. Checkpoint - 确保所有测试通过
  - Ensure all tests pass, ask the user if questions arise.

## Phase 4: AI角色代理系统

- [ ] 11. 创建记忆系统
  - [ ] 11.1 创建 `src/server/script22/MemorySystem.ts` 记忆系统
    - 实现公开记忆、私密记忆、共享记忆三层结构
    - 实现记忆存储和检索方法
    - 实现记忆冲突检测和解决
    - _Requirements: 4.1, 4.2, 4.3, 4.5_
  - [ ] 11.2 编写属性测试：记忆往返一致性
    - **Property 9: Memory Round-Trip Consistency**
    - **Validates: Requirements 4.1, 4.2**
  - [ ] 11.3 编写属性测试：共享记忆传播
    - **Property 10: Shared Memory Propagation**
    - **Validates: Requirements 4.3**

- [ ] 12. 创建心理状态系统
  - [ ] 12.1 创建 `src/server/script22/PsychStateManager.ts` 心理状态管理器
    - 实现恐惧等级更新逻辑
    - 实现怀疑度更新逻辑
    - 实现信任度管理
    - _Requirements: 5.2, 5.3, 5.4_
  - [ ] 12.2 编写属性测试：心理状态更新正确性
    - **Property 11: Psychological State Update Correctness**
    - **Validates: Requirements 5.3, 5.4**

- [ ] 13. 创建角色代理
  - [ ] 13.1 创建 `src/server/script22/Script22CharacterAgent.ts` 角色代理
    - 实现基于Persona的响应生成
    - 实现禁忌话题检测和过滤
    - 实现响应验证逻辑
    - _Requirements: 1.2, 1.3, 1.4, 5.5_
  - [ ] 13.2 编写属性测试：Persona约束验证
    - **Property 2: Persona Constraint Validation**
    - **Validates: Requirements 1.3, 1.4**
  - [ ] 13.3 实现AI反应系统
    - 实现角色间互动反应生成
    - 实现线索揭露反应生成
    - 实现指控反应生成
    - _Requirements: 6.1, 6.2, 6.3_
  - [ ] 13.4 编写属性测试：上下文反应生成
    - **Property 13: Contextual Reaction Generation**
    - **Validates: Requirements 6.1, 6.2**
  - [ ] 13.5 编写属性测试：线索揭露反应适当性
    - **Property 14: Clue Reveal Reaction Appropriateness**
    - **Validates: Requirements 6.3**

- [ ] 14. 创建角色代理工厂
  - [ ] 14.1 创建 `src/server/script22/CharacterAgentFactory.ts` 代理工厂
    - 实现基于配置动态创建代理
    - 实现代理池管理
    - _Requirements: 7.3_
  - [ ] 14.2 编写属性测试：动态代理创建
    - **Property 16: Dynamic Agent Creation**
    - **Validates: Requirements 7.3**

- [ ] 15. Checkpoint - 确保所有测试通过
  - Ensure all tests pass, ask the user if questions arise.

## Phase 5: 游戏状态管理与序列化

- [ ] 16. 创建游戏状态管理器
  - [ ] 16.1 创建 `src/server/script22/Script22GameState.ts` 游戏状态管理
    - 实现完整游戏状态数据结构
    - 实现状态序列化和反序列化
    - 实现状态快照和恢复
    - _Requirements: 7.5_
  - [ ] 16.2 编写属性测试：游戏状态序列化往返
    - **Property 17: Game State Serialization Round-Trip**
    - **Validates: Requirements 7.5**

- [ ] 17. Checkpoint - 确保所有测试通过
  - Ensure all tests pass, ask the user if questions arise.

## Phase 6: Socket.IO事件处理

- [ ] 18. 创建Socket事件处理器
  - [ ] 18.1 创建 `src/server/script22/Script22SocketHandlers.ts` Socket处理器
    - 实现房间创建和加入事件
    - 实现角色选择事件
    - 实现消息发送事件
    - 实现阶段推进事件
    - 实现投票事件
    - _Requirements: 1.2, 2.2, 2.6_

- [ ] 19. 集成到主服务器
  - [ ] 19.1 更新 `src/server/index.ts` 集成Script22处理器
    - 注册Script22命名空间
    - 配置事件路由
    - _Requirements: 1.2_

## Phase 7: 前端界面组件

- [ ] 20. 创建游戏房间主界面
  - [ ] 20.1 创建 `src/pages/script22/Script22GameRoom.tsx` 游戏房间
    - 实现主布局（场景区、角色区、聊天区、操作区）
    - 实现Socket连接管理
    - 实现游戏状态同步
    - _Requirements: 8.1_

- [ ] 21. 创建场景展示组件
  - [ ] 21.1 创建 `src/components/script22/SceneView.tsx` 场景视图
    - 实现场景背景展示
    - 实现交互点渲染
    - 实现场景切换动画
    - _Requirements: 3.1, 3.4_

- [ ] 22. 创建角色卡片组件
  - [ ] 22.1 创建 `src/components/script22/CharacterCard.tsx` 角色卡片
    - 实现角色头像和信息展示
    - 实现心理状态指示器
    - 实现关系状态展示
    - _Requirements: 8.3_
  - [ ] 22.2 编写属性测试：角色卡片数据完整性
    - **Property 18: Character Card Data Completeness**
    - **Validates: Requirements 8.3**

- [ ] 23. 创建对话面板组件
  - [ ] 23.1 创建 `src/components/script22/ChatArea.tsx` 对话区域
    - 实现消息列表展示
    - 实现消息输入和发送
    - 实现角色反应气泡
    - _Requirements: 1.2, 6.5_

- [ ] 24. 创建操作面板组件
  - [ ] 24.1 创建 `src/components/script22/ActionPanel.tsx` 操作面板
    - 实现阶段指示器
    - 实现场景选择
    - 实现投票界面
    - _Requirements: 2.2, 2.6_

- [ ] 25. 创建线索面板组件
  - [ ] 25.1 创建 `src/components/script22/CluesPanel.tsx` 线索面板
    - 实现已发现线索列表
    - 实现线索详情展示
    - 实现线索关联展示
    - _Requirements: 3.3_

- [ ] 26. 创建阶段转换动画组件
  - [ ] 26.1 创建 `src/components/script22/PhaseTransition.tsx` 阶段转换
    - 实现阶段切换动画
    - 实现阶段说明展示
    - _Requirements: 8.2_

## Phase 8: 路由与集成

- [ ] 27. 配置路由
  - [ ] 27.1 更新 `src/routes.tsx` 添加Script22路由
    - 添加 /script22 路由
    - 添加 /script22/room/:roomId 路由
    - _Requirements: 8.1_

- [ ] 28. 更新剧本配置
  - [ ] 28.1 更新 `src/data/scriptConfigs.ts` 完善school-rule-22配置
    - 添加完整的角色配置
    - 添加完整的线索配置
    - 添加音频文件配置
    - _Requirements: 7.1_

- [ ] 29. Final Checkpoint - 确保所有测试通过
  - Ensure all tests pass, ask the user if questions arise.
