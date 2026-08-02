---
name: testing
description: 测试策略和实践指南
category: development
tags: [testing, tdd, quality-assurance]
priority: high
---

# 测试指南

## 概述

提供全面的测试策略、方法和最佳实践，确保代码质量。

## 测试金字塔

```
      /\
     /E2E\       - 端到端测试 (少量)
    /------\
   /集成测试\    - 集成测试 (适中)
  /----------\
 /  单元测试   \  - 单元测试 (大量)
/______________\
```

## 单元测试

### 原则
- 快速执行
- 独立运行
- 可重复
- 自我验证

### 示例

#### JavaScript (Jest)
```javascript
describe('Calculator', () => {
  test('adds two numbers', () => {
    const calc = new Calculator();
    expect(calc.add(2, 3)).toBe(5);
  });

  test('handles division by zero', () => {
    const calc = new Calculator();
    expect(() => calc.divide(5, 0)).toThrow('Cannot divide by zero');
  });
});
```

#### Python (pytest)
```python
def test_calculator_add():
    calc = Calculator()
    assert calc.add(2, 3) == 5

def test_calculator_divide_by_zero():
    calc = Calculator()
    with pytest.raises(ValueError, match="Cannot divide by zero"):
        calc.divide(5, 0)
```

### 最佳实践
- 一个测试一个断言
- 有意义的测试名称
- 使用测试数据工厂
- Mock 外部依赖

## 集成测试

### 目标
- 验证组件交互
- 测试数据库集成
- API 端点测试

### 示例

#### API 测试
```javascript
describe('User API', () => {
  test('creates a new user', async () => {
    const response = await request(app)
      .post('/api/users')
      .send({
        name: 'John Doe',
        email: 'john@example.com'
      })
      .expect(201);

    expect(response.body).toHaveProperty('id');
    expect(response.body.email).toBe('john@example.com');
  });

  test('returns 400 for invalid email', async () => {
    await request(app)
      .post('/api/users')
      .send({
        name: 'John',
        email: 'invalid-email'
      })
      .expect(400);
  });
});
```

#### 数据库测试
```python
@pytest.fixture
def db_session():
    session = create_test_session()
    yield session
    session.rollback()
    session.close()

def test_create_user(db_session):
    user = User(name='John', email='john@example.com')
    db_session.add(user)
    db_session.commit()

    retrieved = db_session.query(User).first()
    assert retrieved.name == 'John'
```

## 端到端测试

### 工具
- Cypress - Web 应用
- Playwright - 浏览器自动化
- Selenium - 传统选择

### 示例

#### Cypress
```javascript
describe('User Login', () => {
  beforeEach(() => {
    cy.visit('/login');
  });

  it('successfully logs in with valid credentials', () => {
    cy.get('[data-cy=email]').type('user@example.com');
    cy.get('[data-cy=password]').type('password123');
    cy.get('[data-cy=submit]').click();

    cy.url().should('include', '/dashboard');
    cy.contains('Welcome, User').should('be.visible');
  });

  it('shows error for invalid credentials', () => {
    cy.get('[data-cy=email]').type('user@example.com');
    cy.get('[data-cy=password]').type('wrongpassword');
    cy.get('[data-cy=submit]').click();

    cy.contains('Invalid credentials').should('be.visible');
  });
});
```

## 测试驱动开发 (TDD)

### 流程
1. 红 - 写一个失败的测试
2. 绿 - 写最简代码使测试通过
3. 重构 - 改进代码

### 示例
```javascript
// 1. 红 - 写测试
test('capitalize first letter', () => {
  expect(capitalize('hello')).toBe('Hello');
});

// 2. 绿 - 实现功能
function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

// 3. 重构 - 改进
function capitalize(str) {
  if (!str) return str;
  return str[0].toUpperCase() + str.slice(1);
}
```

## Mock 和 Stub

### Mock 外部服务
```javascript
jest.mock('./api');

import { fetchUser } from './api';

test('displays user data', async () => {
  fetchUser.mockResolvedValue({
    id: 1,
    name: 'John Doe'
  });

  const component = render(<UserProfile />);
  await waitFor(() => {
    expect(screen.getByText('John Doe')).toBeInTheDocument();
  });
});
```

### 测试数据工厂
```javascript
// factories/userFactory.js
export const buildUser = (overrides = {}) => ({
  id: faker.datatype.uuid(),
  name: faker.name.findName(),
  email: faker.internet.email(),
  ...overrides
});

// 使用
test('user greeting', () => {
  const user = buildUser({ name: 'Alice' });
  expect(greet(user)).toBe('Hello, Alice!');
});
```

## 测试覆盖率

### 配置覆盖率
```javascript
// jest.config.js
module.exports = {
  collectCoverage: true,
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  }
};
```

### 报告
```bash
# 生成覆盖率报告
npm test -- --coverage

# 查看详细报告
open coverage/lcov-report/index.html
```

## 性能测试

### 基准测试
```javascript
const Benchmark = require('benchmark');

const suite = new Benchmark.Suite();

suite
  .add('forEach', () => {
    [1, 2, 3].forEach(x => x * 2);
  })
  .add('for loop', () => {
    const arr = [1, 2, 3];
    for (let i = 0; i < arr.length; i++) {
      arr[i] * 2;
    }
  })
  .on('cycle', event => {
    console.log(String(event.target));
  })
  .run();
```

### 负载测试
```bash
# 使用 Apache Bench
ab -n 1000 -c 10 http://localhost:3000/api/users

# 使用 wrk
wrk -t4 -c100 -d30s http://localhost:3000/api/users
```

## 最佳实践

### 1. 测试命名
```javascript
// ✓ 清晰
test('should return 404 when user not found', () => {});

// ✗ 模糊
test('user test', () => {});
```

### 2. 测试组织
```javascript
describe('UserService', () => {
  describe('createUser', () => {
    it('should create a user with valid data');
    it('should throw error for duplicate email');
    it('should hash password');
  });

  describe('getUser', () => {
    it('should return user by ID');
    it('should return null for non-existent ID');
  });
});
```

### 3. 测试数据管理
```javascript
// 使用 fixture
beforeEach(() => {
  setupDatabase();
});

afterEach(() => {
  cleanupDatabase();
});

// 或使用 setup/teardown
beforeAll(() => {
  startTestServer();
});

afterAll(() => {
  stopTestServer();
});
```

## 持续集成

### GitHub Actions 配置
```yaml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
      - run: npm ci
      - run: npm test
      - run: npm run lint
      - uses: codecov/codecov-action@v2
```

## 参考资源

- [Jest 文档](https://jestjs.io/)
- [pytest 文档](https://docs.pytest.org/)
- [Cypress 文档](https://docs.cypress.io/)
- [测试最佳实践](https://testingjavascript.com/)
