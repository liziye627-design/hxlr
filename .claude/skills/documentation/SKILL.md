---
name: documentation
description: 文档编写和维护指南
category: development
tags: [documentation, best-practices, technical-writing]
priority: medium
---

# 文档指南

## 概述

提供编写清晰、维护性强的技术文档的方法和最佳实践。

## 文档类型

### 1. 代码文档

#### 注释原则
```javascript
// ❌ 不好 - 注释重复代码
// 将 x 加 1
x = x + 1;

// ✓ 好 - 解释为什么，不是是什么
// 使用 +1 而非递增以符合业务规则要求
x = x + 1;
```

#### 函数文档
```javascript
/**
 * 计算折扣价格
 *
 * @param {number} originalPrice - 原始价格
 * @param {number} discountRate - 折扣率 (0-1)
 * @param {number} maxDiscount - 最大折扣金额
 * @returns {number} 折后价格
 * @throws {Error} 如果折扣率超出范围
 *
 * @example
 * calculateDiscount(100, 0.2, 15)  // 返回 85
 * calculateDiscount(100, 0.3, 15)  // 返回 85 (不超过最大折扣)
 */
function calculateDiscount(originalPrice, discountRate, maxDiscount) {
  if (discountRate < 0 || discountRate > 1) {
    throw new Error('折扣率必须在 0-1 之间');
  }

  const discount = Math.min(
    originalPrice * discountRate,
    maxDiscount
  );

  return originalPrice - discount;
}
```

### 2. README

#### 标准结构
```markdown
# 项目名称

简短描述项目的功能和目的。

## 目录
- [功能特性](#功能特性)
- [安装](#安装)
- [使用](#使用)
- [API 文档](#api-文档)
- [贡献](#贡献)

## 功能特性
- 功能 1
- 功能 2

## 安装
\`\`\`bash
npm install my-project
\`\`\`

## 使用
\`\`\`javascript
import myProject from 'my-project';
myProject.doSomething();
\`\`\`

## API 文档
详见 [API.md](./API.md)

## 贡献
欢迎贡献！请阅读 [CONTRIBUTING.md](./CONTRIBUTING.md)
```

### 3. API 文档

#### 端点文档
```markdown
## 创建用户

创建新用户账户。

### 请求
\`\`\`http
POST /api/users
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "securepassword123"
}
\`\`\`

### 参数
| 参数 | 类型 | 必需 | 描述 |
|------|------|------|------|
| name | string | 是 | 用户全名 (2-100 字符) |
| email | string | 是 | 邮箱地址，必须唯一 |
| password | string | 是 | 密码 (最少 8 字符) |

### 响应
\`\`\`json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "name": "John Doe",
  "email": "john@example.com",
  "createdAt": "2024-01-01T00:00:00Z"
}
\`\`\`

### 错误响应
\`\`\`json
{
  "error": "Email already exists"
}
\`\`\`
\`\`\`http
HTTP 409 Conflict
\`\`\`
```

### 4. 架构文档

#### 系统设计
```markdown
## 系统架构

### 组件
- **API Gateway**: 路由和认证
- **Service A**: 业务逻辑
- **Database**: 数据存储
- **Cache**: Redis 缓存

### 数据流
\`\`\`
Client -> API Gateway -> Service A -> Database
                           -> Cache
\`\`\`

### 技术栈
- 后端: Node.js, Express
- 数据库: PostgreSQL
- 缓存: Redis
```

## 写作最佳实践

### 1. 受众分析
- 新手 vs 专家
- 开发者 vs 用户
- 内部 vs 外部

### 2. 清晰表达
```markdown
# ❌ 不清晰
该函数处理数据并返回结果。

# ✓ 清晰
该函数接收用户输入数据，进行验证和转换，然后返回格式化的 JSON 响应。
```

### 3. 示例代码
```markdown
## 使用示例

### 基础用法
\`\`\`javascript
const client = new APIClient();
const result = await client.getData();
console.log(result);
\`\`\`

### 高级配置
\`\`\`javascript
const client = new APIClient({
  timeout: 5000,
  retries: 3,
  headers: {
    'X-Custom-Header': 'value'
  }
});
\`\`\`
```

### 4. 故障排除
```markdown
## 常见问题

### 连接失败
**问题**: 无法连接到 API

**解决方案**:
1. 检查网络连接
2. 验证 API 密钥
3. 确认 API 服务状态

\`\`\`bash
# 测试连接
curl https://api.example.com/health
\`\`\`
```

## 文档工具

### 1. 生成工具
```bash
# JavaScript (JSDoc)
npm install -g jsdoc
jsdoc src/**/*.js

# Python (Sphinx)
pip install sphinx
sphinx-quickstart

# API 文档
npm install -g @redocly/cli
redocly build-spec openapi.yaml
```

### 2. Markdown 扩展
```markdown
## 代码块语法高亮
\`\`\`javascript
const x = 'Hello';
\`\`\`

## 表格
| 名称 | 类型 | 描述 |
|------|------|------|
| id   | int  | 主键   |

## 任务列表
- [x] 已完成
- [ ] 待完成
```

## 维护策略

### 1. 版本控制
```markdown
# Changelog 格式
## [1.2.0] - 2024-01-15

### Added
- 新增用户认证功能
- 支持批量导入

### Changed
- 更新 API 端点路径
- 改进错误处理

### Fixed
- 修复登录超时问题
```

### 2. 过期检查
```bash
# 定期审查文档
- 删除过期内容
- 更新示例代码
- 验证链接有效性
```

### 3. 反馈收集
```markdown
## 文档反馈

发现错误或有改进建议？
- 提交 Issue
- 发送 Pull Request
- 联系文档团队
```

## 文档模板

### 项目模板
```markdown
# [项目名称]

[项目徽章]

[项目描述]

## 快速开始
\`\`\`bash
# 安装
npm install

# 运行
npm start
\`\`\`

## 文档
- [入门指南](./docs/getting-started.md)
- [API 参考](./docs/api.md)
- [部署指南](./docs/deployment.md)

## 许可证
[MIT License](./LICENSE)
```

### API 模板
```markdown
# API 参考文档

## 认证
所有 API 请求需要有效的认证令牌。

\`\`\`http
Authorization: Bearer YOUR_TOKEN
\`\`\`

## 端点

### [GET] /users
获取所有用户列表。

#### 响应示例
\`\`\`json
[...]
\`\`\`
```

## 最佳实践清单

- [ ] 文档与代码同步更新
- [ ] 包含实际可运行的示例
- [ ] 使用清晰一致的语言
- [ ] 定期审查和更新
- [ ] 收集用户反馈
- [ ] 提供故障排除指南
- [ ] 链接保持有效
- [ ] 适当使用视觉元素

## 参考资源

- [Google 技术写作指南](https://developers.google.com/tech-writing)
- [Write the Docs](https://www.writethedocs.org/)
- [文档即代码](https://www.writethedocs.org/guide/docs-as-code/)
- [API 文档最佳实践](https://swagger.io/resources/articles/best-practices-in-api-documentation/)
