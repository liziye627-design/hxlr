---
name: debugging
description: 调试技巧和问题排查
category: development
tags: [debugging, troubleshooting, problem-solving]
priority: high
---

# 调试指南

## 概述

提供系统化的调试方法、技巧和工具，帮助快速定位和解决问题。

## 调试流程

### 1. 问题定义
- 清晰描述问题
- 复现步骤
- 期望 vs 实际行为

### 2. 信息收集
- 错误消息
- 日志输出
- 环境信息

### 3. 假设验证
- 提出可能原因
- 设计测试用例
- 逐一验证

### 4. 解决方案
- 实施修复
- 验证效果
- 回归测试

## 调试技巧

### 打印调试
```javascript
// 基础打印
console.log('Variable:', variable);
console.log('Array:', JSON.stringify(array, null, 2));

// 条件打印
console.assert(condition, 'Assertion failed');

// 分组打印
console.group('Function: processData');
console.log('Input:', input);
console.log('Output:', output);
console.groupEnd();
```

### 断点调试
```javascript
// 浏览器/VSCode
debugger;

// Node.js
node inspect app.js
```

### 日志分析
```bash
# 查看最近日志
tail -f app.log

# 搜索错误
grep -i "error" app.log

# 时间范围
sed -n '1,100p' app.log
```

## 常见问题排查

### 性能问题
```javascript
// 性能测量
console.time('operation');
// ... 执行操作
console.timeEnd('operation');

// 性能分析
const start = Date.now();
const result = expensiveOperation();
console.log(`Duration: ${Date.now() - start}ms`);
```

### 内存泄漏
```javascript
// 检查对象引用
const obj = {};
let ref = obj;
// ref 保持引用，obj 不会被回收

// 解决方案
ref = null;  // 释放引用
```

### 异步问题
```javascript
// Promise 错误处理
fetch(url)
  .then(response => {
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    return response.json();
  })
  .catch(error => {
    console.error('Fetch failed:', error);
    throw error;  // 重新抛出或处理
  });

// Async/Await
async function fetchData() {
  try {
    const response = await fetch(url);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Failed:', error);
    throw error;
  }
}
```

## 工具使用

### 浏览器 DevTools
```javascript
// Console 命令
console.log()      // 打印
console.table()    // 表格显示
console.trace()    // 调用栈
console.memory     // 内存使用

// Elements 面板
$0 - 当前选中元素
$1 - 上一个选中元素

// 网络分析
Network > XHR/JS > Filter > Search
```

### Node.js 调试
```bash
# 内置调试器
node inspect script.js

# VSCode 调试
# 按 F5 或点击调试按钮

# Chrome DevTools
node --inspect script.js
# 然后在 chrome://inspect 连接
```

### 日志工具
```bash
# Journalctl (systemd)
journalctl -u service-name -f

# Docker logs
docker logs -f container-name

# PM2 logs
pm2 logs app-name
```

## 调试策略

### 二分法
1. 在中间位置添加日志
2. 确定问题在哪一半
3. 重复直到定位

### 最小化复现
```javascript
// 从复杂场景中提取最小可复现代码
function minimalReproduce() {
  // 只保留核心逻辑
  // 移除无关代码
  // 逐步恢复直到问题重现
}
```

### 回归测试
```bash
# 记录工作状态
git branch working-branch
git commit -am "working state"

# 尝试修复
# 如果失败，回到工作状态
git checkout working-branch
```

## 常见错误类型

### TypeError
```javascript
// 常见原因
null.method()           // null 调用方法
undefined.property      // 读取 undefined 属性
const wrongType = 5 + '5'  // '55' 而非 10

// 解决方案
if (obj && obj.method) {
  obj.method();
}
```

### ReferenceError
```javascript
// 变量未声明
myVariable;  // ReferenceError: myVariable is not defined

// 解决方案
const myVariable = 'value';
```

### SyntaxError
```javascript
// 语法错误
const obj = {;  // 缺少值

// 检查工具
eslint --fix file.js
```

## 性能分析

### CPU 分析
```javascript
// Chrome Performance 面板
1. 打开 DevTools > Performance
2. 点击 Record
3. 执行操作
4. 停止并分析
```

### 内存分析
```javascript
// Chrome Memory 面板
1. DevTools > Memory
2. Take Heap Snapshot
3. 比较快照查找泄漏
```

### 网络分析
```javascript
// Chrome Network 面板
- 瀑布图显示加载顺序
- 蓝色 = DNS，绿色 = TCP，灰色 = 等待
- Size vs Transferred 区分
```

## 最佳实践

1. **可复现性**
   - 记录详细步骤
   - 环境信息完整
   - 最小化测试用例

2. **日志管理**
   - 统一日志格式
   - 适当的日志级别
   - 敏感信息脱敏

3. **错误处理**
   - 不要忽略错误
   - 提供上下文信息
   - 错误边界处理

4. **工具使用**
   - 熟悉调试工具
   - 自动化测试
   - 性能监控

## 快速参考

### Node.js 调试命令
```
cont    - 继续执行
next    - 单步执行
step    - 进入函数
out     - 退出函数
watch   - 监视变量
backtrace - 调用栈
```

### VSCode 调试快捷键
```
F5      - 开始调试
F9      - 切换断点
F10     - 单步跳过
F11     - 单步进入
Shift+F11 - 单步退出
```

### Chrome DevTools 快捷键
```
Ctrl+Shift+I - 打开 DevTools
Ctrl+`        - Console
Ctrl+Shift+C - 元素检查
F12           - 上次打开的标签
```
