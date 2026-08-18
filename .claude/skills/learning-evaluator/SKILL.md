---
description: (project - Skill) Assessment system that evaluates user's mastery level (L1-L5) based on Bloom's Taxonomy, generates dynamic learning paths, and validates skills through real-world scenarios.
---

# Learning Evaluator Skill

## 概述
此技能是 "Cognos" Agent 的**考官与导航员**。它负责联网搜索最新学习路线，定义能力等级（Level 1-5），并根据用户的实际产出评估当前等级，动态调整每日学习计划。

## 核心能力 (Capabilities)

### 1. 动态学习路径生成 (Dynamic Path Generation)
利用 `websearch` 能力，实时抓取最新的技术路线图（Roadmap.sh, Official Docs, Top Courses）。

> **Trigger**: 用户输入 `@path-gen <主题> <目标>`
> **Action**: 
> 1. 搜索该领域公认的学习路线（如 "Solidity Developer Roadmap 2025"）。
> 2. 生成一个从 **Hello World** 到 **Mastery** 的阶段性路径。
> 3. 为每个阶段设定 "Exit Criteria" (准出标准)。

### 2. 能力等级评估体系 (Skill Leveling - Bloom's Taxonomy)
不使用模糊的 "熟悉/精通"，而是使用基于**布鲁姆分类法**的 5 级评估：

| 等级 | 定义 | 行为特征 | 评估方式 |
| :--- | :--- | :--- | :--- |
| **L1: 记忆 (Remember)** | 能复述概念 | "我知道 Gas 是什么" | 名词解释题 |
| **L2: 理解 (Understand)** | 能解释原理 | "我知道为什么写 Storage 贵" | 费曼解释 (ELI5) |
| **L3: 应用 (Apply)** | 能在Demo中用 | "我能写一个投票合约" | 完成小型 Demo |
| **L4: 分析 (Analyze)** | 能优化与排错 | "我能把这个合约 Gas 降低 20%" | Code Review / 优化任务 |
| **L5: 创造 (Create)** | 能构建复杂系统 | "我设计了一个新的借贷协议" | 完整项目开发 |

### 3. 每日学习历程生成 (Daily Journey)
基于当前等级，生成当天的 "Quest" (任务)：

> **Structure**:
> - **Input**: 今天的知识源（视频/文档 URL）。
> - **Mission**: 必须要完成的实战任务（不仅是看）。
> - **Boss Fight**: 今天的最终挑战（一个很难的自测题或代码挑战）。
> - **Loot**: 完成后获得的技能点（如 "Unlocked: ERC721 Minting"）。

## 常用指令 (Prompts)

### `@assess <主题>`
评估当前对某主题的掌握等级。
*示例*: `@assess Solidity Storage` -> Agent 会出题测试你是处于 L1 还是 L3，并给出升级建议。

### `@plan-day <主题> <可用时间>`
生成今天的学习历程。
*示例*: `@plan-day ZK-Rollup 4hours`
*输出*: 
1. **Search**: 搜索 ZK-Rollup 原理资料。
2. **Plan**: 
   - 0-1h: 理解 Validity Proof (达到 L2)。
   - 1-3h: 跑通 Circom Demo (达到 L3)。
   - 3-4h: 撰写对比 Optimistic Rollup 的文章 (达到 L4)。

### `@verify-mastery`
用户提交作品，Agent 进行终极审核。
*逻辑*: 检查代码质量、是否包含测试用例、文档是否清晰。只有通过才允许进入下一阶段。

## 结合学习流
1. **定级**: 用户开始新领域 -> `@assess` (初始为 L0)。
2. **规划**: `@path-gen` 生成路线图。
3. **执行**: 每日 `@plan-day`。
4. **升级**: 每周末 `@verify-mastery` 决定是否晋级下一章。
