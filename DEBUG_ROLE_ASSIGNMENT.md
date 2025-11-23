# 角色分配问题调试步骤

## 🐛 问题现象

角色卡片弹出后一直显示"正在分配角色..."，无法显示具体的角色信息。

## 🔍 调试步骤

### 第一步：打开浏览器控制台

1. 按F12打开开发者工具
2. 切换到Console标签
3. 清空之前的日志（点击🚫图标）

### 第二步：重新进入游戏

1. 刷新页面
2. 点击"狼人杀"菜单
3. 选择6人局
4. 选择至少5个AI人设
5. 点击"开始游戏"

### 第三步：查看控制台日志

**应该看到以下日志（按顺序）：**

```
=== 开始游戏 ===
选择的人数: 6
游戏配置: {id: "xxx", player_count: 6, role_config: {...}, ...}
选择的人设: [{id: "xxx", name: "逻辑大师", ...}, ...]

=== 初始化游戏 ===
传入的config: {id: "xxx", player_count: 6, role_config: {...}, ...}
传入的playerCount: 6
传入的personas: [{id: "xxx", name: "逻辑大师", ...}, ...]

游戏会话创建成功: xxx-xxx-xxx

=== 开始分配角色 ===
玩家数量: 6
角色配置: {werewolf: 2, villager: 2, seer: 1, witch: 1}
分配的角色数组: ["werewolf", "werewolf", "villager", "villager", "seer", "witch"]
角色数量: 6
打乱后的角色: ["seer", "werewolf", "villager", "witch", "werewolf", "villager"]

=== 用户角色分配 ===
用户角色: seer
用户角色类型: string
是否为undefined: false
是否为null: false
已调用setUserRole，等待状态更新...

角色分配完成，等待显示角色卡片

检测到角色已分配: seer
显示角色卡片
```

### 第四步：分析日志

#### 情况1：没有看到任何日志

**可能原因**：
- 页面没有正确加载
- JavaScript错误导致代码没有执行

**解决方法**：
1. 检查控制台是否有红色错误信息
2. 刷新页面重试
3. 清除浏览器缓存

#### 情况2：看到"开始游戏"但没有"初始化游戏"

**可能原因**：
- 路由跳转失败
- GameRoom组件没有加载

**解决方法**：
1. 检查URL是否变为`/werewolf/game`
2. 检查路由配置
3. 查看是否有路由错误

#### 情况3：看到"初始化游戏"但没有"开始分配角色"

**可能原因**：
- 游戏会话创建失败
- config为null或undefined

**解决方法**：
1. 检查`传入的config`的值
2. 如果为null，说明配置加载失败
3. 返回上一页，刷新后重试

#### 情况4：看到"开始分配角色"但角色数组为空

**可能原因**：
- role_config配置错误
- 角色配置中的数值都是0

**解决方法**：
1. 检查`角色配置`的值
2. 确认每个角色的数量大于0
3. 检查数据库中的配置数据

#### 情况5：看到"用户角色"为undefined

**可能原因**：
- 角色数组为空
- assignedRoles[0]不存在

**解决方法**：
1. 检查`分配的角色数组`
2. 确认数组长度大于0
3. 检查角色分配逻辑

#### 情况6：看到"已调用setUserRole"但没有"检测到角色已分配"

**可能原因**：
- useEffect没有触发
- userRole状态没有更新

**解决方法**：
1. 这是React状态更新的问题
2. 检查useEffect的依赖数组
3. 可能需要重启开发服务器

## 🔧 手动检查状态

在控制台输入以下命令检查状态：

```javascript
// 检查当前页面
console.log('当前URL:', window.location.href);

// 如果在GameRoom页面，检查状态
// 注意：这些变量只在React组件内部可用，可能无法直接访问
```

## 📊 常见问题和解决方案

### 问题1：角色配置为空

**日志特征**：
```
角色配置: {}
分配的角色数组: []
角色数量: 0
```

**原因**：数据库中没有对应人数的配置

**解决方案**：
1. 检查数据库`werewolf_game_configs`表
2. 确认有`player_count = 6`的记录
3. 如果没有，执行SQL插入配置：

```sql
INSERT INTO werewolf_game_configs (player_count, role_config, description)
VALUES (
  6,
  '{"werewolf": 2, "villager": 2, "seer": 1, "witch": 1}'::jsonb,
  '6人局标准配置'
);
```

### 问题2：config.role_config不是对象

**日志特征**：
```
角色配置: null
或
角色配置: undefined
```

**原因**：role_config字段解析失败

**解决方案**：
1. 检查数据库中role_config字段的类型（应该是jsonb）
2. 检查数据格式是否正确
3. 重新插入正确的配置

### 问题3：角色数量不匹配

**日志特征**：
```
玩家数量: 6
角色数量: 4  // 不等于6
```

**原因**：角色配置中的数量总和不等于玩家数量

**解决方案**：
1. 修改数据库配置，确保角色数量总和等于玩家数量
2. 例如6人局：2狼人 + 2平民 + 1预言家 + 1女巫 = 6

### 问题4：useEffect不触发

**日志特征**：
```
已调用setUserRole，等待状态更新...
// 之后没有任何日志
```

**原因**：React状态更新机制问题

**解决方案**：
1. 重启开发服务器：
   ```bash
   # 按Ctrl+C停止
   pnpm run dev
   ```
2. 清除浏览器缓存
3. 硬刷新页面（Ctrl+Shift+R）

## 🎯 预期的完整日志流程

```
1. 用户点击"开始游戏"
   ↓
2. Werewolf.tsx: === 开始游戏 ===
   ↓
3. 跳转到GameRoom页面
   ↓
4. GameRoom.tsx: === 初始化游戏 ===
   ↓
5. 创建游戏会话
   ↓
6. GameRoom.tsx: === 开始分配角色 ===
   ↓
7. 生成角色数组并打乱
   ↓
8. GameRoom.tsx: === 用户角色分配 ===
   ↓
9. 调用setUserRole
   ↓
10. useEffect检测到userRole变化
   ↓
11. GameRoom.tsx: 检测到角色已分配
   ↓
12. 调用setShowRoleCard(true)
   ↓
13. Dialog显示角色信息
```

## 💡 调试技巧

### 技巧1：使用React DevTools

1. 安装React DevTools浏览器扩展
2. 打开Components标签
3. 找到GameRoom组件
4. 查看State中的值：
   - userRole: 应该是角色字符串（如"werewolf"）
   - showRoleCard: 应该是true
   - players: 应该是玩家数组

### 技巧2：断点调试

1. 在Chrome DevTools的Sources标签
2. 找到GameRoom.tsx文件
3. 在以下位置设置断点：
   - 第193行：`setUserRole(userAssignedRole)`
   - 第83行：`setShowRoleCard(true)`
4. 刷新页面，逐步执行代码
5. 观察变量值的变化

### 技巧3：临时修改代码测试

在GameRoom.tsx的useEffect中添加强制显示：

```typescript
useEffect(() => {
  console.log('useEffect触发，userRole:', userRole);
  if (userRole !== null) {
    console.log('角色不为null，显示卡片');
    setShowRoleCard(true);
  } else {
    console.log('角色为null，不显示卡片');
  }
}, [userRole]);
```

## 📝 问题报告模板

如果问题仍然存在，请提供以下信息：

```
【环境信息】
浏览器：Chrome / Edge / Firefox / Safari
版本：________
操作系统：Windows / Mac / Linux

【控制台日志】
（粘贴完整的控制台输出）

【问题描述】
1. 选择的游戏配置：6人局 / 9人局 / 12人局
2. 选择的AI人设数量：________
3. 点击"开始游戏"后的现象：________
4. 角色卡片是否弹出：是 / 否
5. 卡片显示内容：________

【截图】
（如果可能，提供截图）

【已尝试的解决方法】
1. □ 刷新页面
2. □ 清除缓存
3. □ 重启浏览器
4. □ 检查控制台日志
5. □ 使用React DevTools
```

## 🚀 快速修复尝试

如果你想快速尝试修复，按以下顺序操作：

### 1. 硬刷新页面
```
Windows: Ctrl + Shift + R
Mac: Cmd + Shift + R
```

### 2. 清除浏览器缓存
```
Chrome: 设置 → 隐私和安全 → 清除浏览数据
选择"缓存的图片和文件"
```

### 3. 重启开发服务器
```bash
# 在终端按Ctrl+C停止
# 然后重新运行
cd /workspace/app-7gn2vl8qe60x
pnpm run dev
```

### 4. 检查数据库配置
```sql
-- 在Supabase控制台执行
SELECT * FROM werewolf_game_configs WHERE player_count = 6;
```

### 5. 重新插入配置（如果需要）
```sql
-- 删除旧配置
DELETE FROM werewolf_game_configs WHERE player_count = 6;

-- 插入新配置
INSERT INTO werewolf_game_configs (player_count, role_config, description)
VALUES (
  6,
  '{"werewolf": 2, "villager": 2, "seer": 1, "witch": 1}'::jsonb,
  '6人局标准配置'
);
```

---

**更新时间**: 2025-01-10  
**版本**: V4.1  
**状态**: 调试中
