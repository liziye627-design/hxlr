---
name: skill-creator-template-full
description: 完整的 SKILL.md 模板 - 包含所有章节和最佳实践
category: template
tags: [template, complete, standard, advanced]
---

# 完整 SKILL.md 模板

## 概述
标准的 SKILL.md 模板，包含所有规范要求的章节，适合创建功能完整的 Agent Skills。

## 使用指南

### 完整内容结构

### 1. Frontmatter（必须）

#### 必需字段
```yaml
---
name: skill-name              # 技能名称
description: skill-description   # 简短描述
category: skill-category       # 分类
tags: [tag1, tag2]        # 标签
```

#### 推荐字段
```yaml
---
priority: low | medium | high          # 优先级
compatibility:
  claude: true
  opencode: true
  github-copilot: true
  vscode: true
  allowed-tools:
  - tool-name-1
  - tool-name-2
metadata:
  key: value
```

### 2. 概述（必须）
```
# [技能名称]

## 概述
技能的详细描述...

## 使用场景
- 场景 1
- 场景 2
- 场景 3

## 操作流程

### 1. 主要流程
#### 第一步
[具体步骤说明]

#### 第二步
[具体步骤说明]

#### 第三步
[具体步骤说明]

### 2. 前提条件
- [前置条件 1]
- [前置条件 2]

### 3. 操作步骤
#### 第一步
[具体步骤说明]

#### 第二步
[具体步骤说明]

#### 第三步
[具体步骤说明]

### 3. 输出格式
#### 类型 1
[格式说明]

#### 类型 2
[格式说明]

### 4. 示例
#### 示例 1
[示例内容]

#### 示例 2
[示例内容]

### 5. 注意事项
- 注意点 1
- 注意点 2

### 6. 最佳实践
- 最佳实践 1
- 最佳实践 2

### 7. 故障排除
#### 问题 1
**原因**: ...
**解决方案**: ...

#### 问题 2
**原因**: ...
**解决方案**: ...

### 8. 相关技能
- 相关技能 1
- 相关技能 2

### 9. 参考资源
- 资源 1
- 资源 2

## 相关资源

### 官方文档
- [SKILL.md 规范](https://agentskills.io/specification)
- [OpenCode Skills](https://opencode.ai/docs/skills/)
- [Claude Skills](https://docs.claude.ai/docs/en/agents-and-tools/agent-skills/)

### 社区资源
- [Awesome Skills](https://github.com/VoltAgent/awesome-claude-skills)
- [Agent Skills](https://agent-skills.md/)

### 教程资源
- [OpenCode 开发指南](https://opencode.ai/docs/get-started)
- [Agent 开发最佳实践](https://skywork.ai/blog/ai-agent/claude-skills/)

## 附录

### 常见模式
- 开发类
- 测试类
- 调试类
- 文档类
- 自动化类
- Obsidian 类

### 模板版本
- v1.0.0 (基础）
- v2.0.0 (完整)
- v3.0.0 (Obsidian 集成)

### 更新日志
- v3.0.1 - 添加 RAG 功能
- v3.0.2 - 优化自动化
```

---

# 完整技能模板

---

name: example-full-skill
description: 完整的技能示例
category: development
tags: [advanced, example, demo]
priority: high
compatibility:
  claude: true
  opencode: true
  github-copilot: true
  vscode: true
allowed-tools:
  - web-search
  - filesystem
  - git
  - skill

---

# 高级数据处理技能

## 概述
一个功能完整的数据处理器，包含数据读取、解析、转换、输出功能。

## 概述
强大的数据处理能力，支持多种数据格式，自动化数据处理流程。

## 使用场景

### 场景 1：CSV 数据处理
读取 CSV 文件，提取数据，转换为其他格式。

### 场景 2：JSON API 集成
调用 API，处理返回数据，存储到数据库。

### 场景 3：批量文件操作
批量重命名、移动、删除文件。

### 场景 4：数据转换
JSON to YAML, XML to JSON 等

## 操作流程

### 1. 主要流程
初始化 → 读取数据 → 验证格式 → 转换数据 → 输出结果

### 2. 可选流程
添加错误处理 → 添加数据清洗 → 添加日志

### 3. 输出格式
JSON 数组、CSV、YAML、XML、数据库

### 4. 示例

#### 示例 1：CSV 处理
输入：
```csv
name,email,age
Alice,alice@example.com,25
Bob,bob@example.com,30
Charlie,charlie@example.com,35
```

输出：
```json
{
  "data": [
    { "name": "Alice", "email": "alice@example.com", "age": 25 }
  ]
}
```

#### 示例 2：API 集成
输入：
```bash
curl https://api.example.com/data
```

输出：
```json
{
  "processed_data": [ ]
}
```

### 5. 注意事项
- 数据隐私保护
- 错误处理
- 数据验证
- 性能优化

## 最佳实践

1. 使用异步处理
2. 流式处理大数据
3. 添加日志
4. 错误重试
5. 数据清理

## 故障排除

### 问题 1：数据格式错误
**原因**: 文件编码问题
**解决方案**: 自动检测编码，指定编码

### 问题 2：内存溢出
**原因**: 文件过大
**解决方案**: 流式处理，分批加载

### 问题 3：API 请求失败
**原因**: 网络问题
**解决方案**: 重试机制，超时设置

### 4. 相关技能
- obsidian-read
- obsidian-write
- obsidian-automation

## 参考资源

- 数据处理最佳实践
- SKILL.md 规范
- OpenCode Skills 文档
```

---

## 高级功能

### 批量处理
- 批量文件操作
- 批量数据转换
- 并行处理

### 高级数据处理
- 复杂数据结构
- 嵌套数据
- 嵌合数据

### 自动化
- 定时任务
- 自动清理
- 报告生成

## 性能优化

### 数据缓存
- 内存缓存
- 磁盘缓存
- Redis 缓存

### 错误恢复
- 断点续传
- 事务回滚
- 数据备份

## 技能列表

- data-processor
- text-analyzer
- api-integrator
- json-converter
- csv-parser
- file-manager

## 扩展功能

- 自定义转换器
- 插件系统
- 定时任务
- 通知系统

## 安全性

- 数据加密
- 访问控制
- 权限管理
- 数据脱敏
