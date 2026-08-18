# 代码风格指南 - Coding Style Guide

> **目标**：任何人打开文件都能快速读懂并安全修改

本文档定义项目的代码风格规范，确保代码一致性、可读性和可维护性。

## 核心原则

### 1. 可读性优先
代码的阅读次数远多于编写次数。花时间让代码易读，是长期投资。

### 2. 一致性
保持代码风格一致。当有疑问时，遵循项目现有风格。

### 3. 明确性
代码应该自解释。好的代码不需要大量注释，好的命名胜过注释。

### 4. 简洁性
避免不必要的复杂。简单代码更容易理解和维护。

---

## 文件组织

### 文件大小限制
- **单个文件 < 500 行**
- 超过时考虑拆分

### 文件命名
```bash
# 小写、连字符分隔
user-service.ts
auth-controller.js
date-utils.test.ts

# 组件：PascalCase (React/Vue/Angular)
UserProfile.tsx
DataTable.vue
AuthService.ts

# 工具类：连字符 + .util
date.util.ts
string.util.ts
```

### 文件顺序
```typescript
// 1. 版权声明（可选）
// 2. 文档注释
/**
 * 用户认证服务
 * 负责用户登录、登出和会话管理
 */

// 3. 导入（分组、排序）
// 3.1 外部依赖
import React from 'react';
import { injectable } from 'tsyringe';

// 3.2 内部模块
import { User } from '@models/user';
import { Logger } from '@utils/logger';

// 3.3 类型导入
import type { UserInfo } from './types';

// 4. 常量定义
const MAX_LOGIN_ATTEMPTS = 3;
const SESSION_TIMEOUT = 3600;

// 5. 类型定义
interface LoginCredentials {
  username: string;
  password: string;
}

// 6. 函数/类定义
export class AuthService {
  // ...
}
```

---

## 命名规范

### 通用原则
- **见名知意**：名字应该描述"是什么"，而不是"怎么做"
- **避免缩写**：除通用缩写（id、url、api）外
- **避免单字母**：除循环变量和特定场景

### 变量命名
```typescript
// 小驼峰命名法 (camelCase)
let userName = 'john';
let isLoggedIn = true;
let maxRetryCount = 3;

// 布尔值：is/has/should/can
let isActive = true;
let hasPermission = false;
let shouldUpdate = true;
let canDelete = false;

// 集合：复数或加后缀
let users = [];
let userList = [];
let userMap = new Map();
```

### 常量命名
```typescript
// 大写下划线 (UPPER_SNAKE_CASE)
const MAX_CONNECTIONS = 100;
const DEFAULT_TIMEOUT = 30000;
const API_BASE_URL = 'https://api.example.com';

// 对象/数组：小驼峰（如不可变）
const config = {
  apiUrl: 'https://api.example.com',
  timeout: 30000
};
```

### 函数命名
```typescript
// 小驼峰，动词开头
function getUser(id: string) { }
function validateInput(input: string) { }
function calculateTotal(price: number, quantity: number) { }
function handleLogin(event: Event) { }

// 返回布尔的函数：is/has/should/can
function isValidEmail(email: string) { }
function hasPermission(user: User, resource: string) { }
function shouldRetry(error: Error) { }
```

### 类命名
```typescript
// 大驼峰 (PascalCase)，名词
class UserService { }
class AuthService { }
class DatabaseConnection { }

// 接口：大驼峰，可选 I 前缀
interface User { }
interface IUser { }  // 不推荐
interface IUserService { }  // 不推荐

// 类型别名：大驼峰
type UserInfo = User & { lastLogin: Date };
type EventHandler = (event: Event) => void;
```

### 枚举命名
```typescript
// 枚举名：大驼峰
enum UserRole {
  // 枚举值：大写下划线
  ADMIN,
  MODERATOR,
  USER
}

enum HttpStatus {
  OK = 200,
  BAD_REQUEST = 400,
  UNAUTHORIZED = 401
}
```

---

## 格式规范

### 缩进
- **统一使用**：2 空格 或 4 空格
- **不混用**：不要用 tab 和空格混排

### 行宽
- **最大 120 字符**：超过时换行

### 空格
```typescript
// 运算符两边加空格
let sum = a + b;
let result = count * 2;

// 逗号后加空格
function foo(a: number, b: number, c: number) { }

// 对象字面量：冒号后加空格
const obj = { name: 'John', age: 30 };

// 函数调用：无空格
foo(1, 2, 3);
Math.max(1, 2, 3);
```

### 大括号
```typescript
// 左括号不换行（K&R 风格）
function foo() {
  // ...
}

if (condition) {
  // ...
}

for (let i = 0; i < 10; i++) {
  // ...
}

// 对象字面量：左括号不换行
const obj = {
  name: 'John',
  age: 30
};
```

### 换行
```typescript
// 链式换行
const result = someVeryLongFunctionName()
  .then(result => anotherLongFunctionName(result))
  .then(finalResult => doSomething(finalResult));

// 参数换行：对齐
function someFunction(
  parameter1: string,
  parameter2: number,
  parameter3: boolean
) {
  // ...
}

// 对象换行：对齐
const config = {
  apiUrl: 'https://api.example.com',
  timeout: 30000,
  retryCount: 3
};
```

---

## 注释规范

### 何时使用注释
- **解释"为什么"**，不是"是什么"
- **复杂算法**的解释
- **临时解决方案**（标记 TODO）
- **公开 API**的文档

### 文档注释
```typescript
/**
 * 用户认证服务
 *
 * 负责处理用户登录、登出和会话管理。
 * 使用 JWT 进行无状态认证。
 *
 * @example
 * ```typescript
 * const auth = new AuthService();
 * const token = await auth.login('user', 'pass');
 * ```
 */
export class AuthService {
  /**
   * 用户登录
   *
   * @param credentials - 登录凭证
   * @returns JWT 访问令牌
   * @throws {AuthenticationError} 认证失败时抛出
   */
  async login(credentials: LoginCredentials): Promise<string> {
    // ...
  }
}
```

### 行内注释
```typescript
// ✅ 好：解释为什么
// 使用 setTimeout 而不是 delay，因为需要非阻塞等待
setTimeout(() => callback(), 1000);

// ❌ 差：重复代码
// 设置超时为 1000ms
setTimeout(() => callback(), 1000);
```

### TODO 注释
```typescript
// TODO: 实现刷新令牌机制
// FIXME: 这个查询有性能问题，需要优化
// HACK: 临时方案，等第三方 API 更新后移除
// NOTE: 这个顺序很重要，不要调换
```

---

## 函数设计

### 函数长度
- **理想 < 20 行**
- **最大 < 50 行**
- 超过时拆分

### 单一职责
```typescript
// ❌ 差：做太多事
function processUser(user: User) {
  // 验证
  if (!user.email) throw new Error('No email');
  // 保存
  db.save(user);
  // 发邮件
  email.send(user);
  // 记录日志
  log.info('User saved');
}

// ✅ 好：单一职责
function validateUser(user: User): void {
  if (!user.email) throw new Error('No email');
}

function saveUser(user: User): void {
  db.save(user);
}

function sendWelcomeEmail(user: User): void {
  email.send(user);
}

function processUser(user: User): void {
  validateUser(user);
  saveUser(user);
  sendWelcomeEmail(user);
  log.info('User saved');
}
```

### 参数数量
- **理想 0-2 个参数**
- **最多 3-4 个参数**
- 超过时使用对象

```typescript
// ❌ 差：参数太多
function createUser(
  name: string,
  email: string,
  age: number,
  address: string,
  phone: string
) { }

// ✅ 好：使用对象
interface CreateUserOptions {
  name: string;
  email: string;
  age: number;
  address: string;
  phone: string;
}

function createUser(options: CreateUserOptions) { }
```

### 返回值
```typescript
// ✅ 明确返回类型
function getUser(id: string): User | null {
  return db.find(id) || null;
}

// ✅ 早返回
function validate(input: string): boolean {
  if (!input) return false;
  if (input.length < 3) return false;
  if (input.length > 50) return false;
  return true;
}
```

---

## 错误处理

### 永不吞掉错误
```typescript
// ❌ 差：吞掉错误
try {
  doSomething();
} catch (error) {
  // 什么都不做
}

// ✅ 好：至少记录
try {
  doSomething();
} catch (error) {
  logger.error('Operation failed', error);
  throw error;  // 重新抛出或处理
}
```

### 使用特定错误类型
```typescript
// 自定义错误类
class ValidationError extends Error {
  constructor(field: string, value: unknown) {
    super(`Invalid ${field}: ${value}`);
    this.name = 'ValidationError';
  }
}

// 使用
if (!email) {
  throw new ValidationError('email', email);
}
```

### 边界条件检查
```typescript
function getUserById(id: string): User {
  // ✅ 检查输入
  if (!id) {
    throw new Error('ID is required');
  }

  const user = db.find(id);

  // ✅ 检查输出
  if (!user) {
    throw new Error(`User not found: ${id}`);
  }

  return user;
}
```

---

## 测试规范

### 测试命名
```typescript
// 格式：should + 期望结果 + when + 条件
describe('AuthService', () => {
  it('should return token when credentials are valid', () => {
    // ...
  });

  it('should throw error when credentials are invalid', () => {
    // ...
  });
});
```

### AAA 模式
```typescript
it('should calculate total', () => {
  // Arrange（准备）
  const price = 100;
  const quantity = 2;

  // Act（执行）
  const total = calculateTotal(price, quantity);

  // Assert（断言）
  expect(total).toBe(200);
});
```

### 测试覆盖
- **单元测试**：所有公共方法
- **集成测试**：关键业务流程
- **边界测试**：空值、极值、异常情况
- **目标覆盖率 > 80%**

---

## 工具配置

### 格式化工具（推荐）

#### Prettier
```json
{
  "semi": true,
  "singleQuote": true,
  "tabWidth": 2,
  "trailingComma": "es5",
  "printWidth": 120
}
```

#### ESLint
```json
{
  "rules": {
    "max-lines": ["error", { "max": 500 }],
    "max-lines-per-function": ["warn", { "max": 50 }],
    "complexity": ["warn", { "max": 10 }]
  }
}
```

### 代码审查清单

- [ ] 文件 < 500 行
- [ ] 函数 < 50 行
- [ ] 命名清晰
- [ ] 错误处理完整
- [ ] 有单元测试
- [ ] 有文档注释
- [ ] 格式化一致

---

## 相关资源

- [Conventional Commits](https://www.conventionalcommits.org/)
- [Keep a Changelog](https://keepachangelog.com/)
- [Prettier](https://prettier.io/)
- [ESLint](https://eslint.org/)
