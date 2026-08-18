---
name: code-review
description: 代码审查和质量检查
category: development
tags: [code-review, quality, best-practices]
priority: high
---

# 代码审查指南

## 概述

提供代码审查的检查清单和最佳实践，确保代码质量。

## 审查清单

### 功能性
- [ ] 代码是否实现预期功能
- [ ] 边界条件是否处理
- [ ] 错误处理是否完善
- [ ] 是否考虑性能影响

### 代码质量
- [ ] 命名清晰明确
- [ ] 代码可读性好
- [ ] 避免重复代码 (DRY 原则)
- [ ] 适度注释，不过度也不过少

### 安全性
- [ ] 输入验证
- [ ] 输出编码
- [ ] SQL 注入防护
- [ ] XSS 防护
- [ ] 敏感数据处理

### 可维护性
- [ ] 模块化设计
- [ ] 单一职责
- [ ] 易于测试
- [ ] 文档完整

## 审查流程

### 1. 理解变更
- 阅读 PR 描述
- 查看相关 issue
- 理解变更目的

### 2. 检查代码
- 逐行审查
- 关注关键路径
- 检查边界情况

### 3. 测试验证
- 本地运行
- 测试用例覆盖
- 回归测试

### 4. 反馈建议
- 建设性评论
- 提供示例代码
- 讨论替代方案

## 常见问题

### 命名问题
```javascript
// ❌ 不好
const d = new Date();
const x = function() { ... };

// ✓ 好
const currentDate = new Date();
const calculateTotal = function() { ... };
```

### 复杂度问题
```javascript
// ❌ 不好 - 嵌套过深
if (condition1) {
  if (condition2) {
    if (condition3) {
      // ...
    }
  }
}

// ✓ 好 - 提前返回
if (!condition1) return;
if (!condition2) return;
if (!condition3) return;
```

### 错误处理
```javascript
// ❌ 不好 - 忽略错误
try {
  riskyOperation();
} catch (e) {
  // 什么都不做
}

// ✓ 好 - 处理错误
try {
  riskyOperation();
} catch (error) {
  logger.error('Operation failed', { error, context });
  throw new CustomError('Failed to complete operation', { cause: error });
}
```

## 代码风格

### JavaScript/TypeScript
- 使用 const/let（避免 var）
- 箭头函数用于简单回调
- 解构赋值提取数据
- 模板字符串

### Python
- PEP 8 风格指南
- 类型注解
- 文档字符串
- 理解上下文管理器

### 性能优化
- 避免不必要的计算
- 使用适当的数据结构
- 异步操作
- 缓存策略

## 审查示例

### 评论格式
```
**问题**: [简短描述问题]

**位置**: 文件:行号

**建议**: [具体建议]

**示例**:
```代码示例
```

**优先级**: 高/中/低
```

### 示例评论
```
**问题**: SQL 注入风险

**位置**: auth/login.js:45

**建议**: 使用参数化查询代替字符串拼接

**示例**:
```javascript
// 当前代码
const query = `SELECT * FROM users WHERE email = '${email}'`;

// 建议修改
const query = 'SELECT * FROM users WHERE email = ?';
db.execute(query, [email]);
```

**优先级**: 高
```

## 工具推荐

### 自动化工具
- ESLint - JavaScript 代码检查
- Pylint - Python 代码检查
- SonarQube - 代码质量分析
- Prettier - 代码格式化

### 安全检查
- Snyk - 依赖漏洞扫描
- npm audit - Node.js 依赖检查
- Bandit - Python 安全检查

## 最佳实践

1. **及时审查**
   - PR 创建后 24 小时内响应
   - 及时讨论问题

2. **礼貌沟通**
   - 尊重作者
   - 建设性反馈
   - 讨论而非命令

3. **关注重点**
   - 优先审查关键路径
   - 重大变更详细审查
   - 小改动快速审查

4. **持续改进**
   - 更新审查清单
   - 分享最佳实践
   - 从错误中学习

## 参考资源

- [Google 代码审查指南](https://google.github.io/eng-practices/review/)
- [GitHub 审查文档](https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/reviewing-changes-in-pull-requests)
- [代码审查最佳实践](https://smartbear.com/learn/code-review/best-practices-for-peer-code-review/)
