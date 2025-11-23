# 狼人杀游戏 V4.0 开发进度

## 📋 用户需求

1. ✅ **角色分配**：每个人物都需要分配对应的角色
2. ✅ **角色卡片展示**：进入游戏后显示角色卡片
3. 🔧 **顺位发言系统**：按照狼人杀规则，玩家按顺位依次发言
4. 🔧 **角色技能系统**：实现各角色的技能功能
5. ⏳ **UI布局优化**：将角色左右两侧对称分布

## ✅ 已完成功能

### 1. 角色分配系统
- ✅ 随机角色分配算法
- ✅ 根据游戏配置分配角色（6/9/12人局）
- ✅ 用户和AI都有角色
- ✅ 角色信息存储在玩家对象中

### 2. 角色卡片展示
- ✅ 进入游戏后自动弹出角色卡片
- ✅ 显示角色Emoji图标
- ✅ 显示角色名称和说明
- ✅ 显示阵营信息（狼人/好人）
- ✅ 玩家列表中显示自己的角色
- ✅ "查看我的角色"按钮

### 3. 语音输入功能
- ✅ 浏览器语音识别（Chrome/Edge）
- ✅ 语音转文字
- ✅ 麦克风按钮
- ✅ 录音状态提示

### 4. 顺位发言系统（部分完成）
- ✅ 当前发言者状态管理
- ✅ 发言权限检查
- ✅ 自动切换到下一位发言者
- ✅ AI按顺序自动发言
- ⏳ UI显示当前发言者高亮
- ⏳ 发言倒计时

### 5. 角色技能系统（部分完成）
- ✅ 技能状态管理
- ✅ 预言家查验功能
- ✅ 女巫药水系统
- ✅ 守卫守护功能
- ✅ 狼人击杀功能
- ⏳ 技能UI界面
- ⏳ 猎人开枪功能

## 🔧 正在开发

### 顺位发言系统优化
**当前状态**：核心逻辑已实现，需要UI优化

**已实现**：
```typescript
// 发言顺序管理
const [currentSpeaker, setCurrentSpeaker] = useState<number>(1);

// 检查发言权限
const currentPlayer = players.find(p => p.position === currentSpeaker);
if (!currentPlayer || currentPlayer.type !== 'user') {
  toast({ title: '还没轮到你', description: `当前是${currentSpeaker}号位发言` });
  return;
}

// 自动切换发言者
const moveToNextSpeaker = async () => {
  let nextPosition = currentSpeaker + 1;
  if (nextPosition > playerCount) nextPosition = 1;
  
  const nextPlayer = players.find(p => p.position === nextPosition && p.is_alive);
  setCurrentSpeaker(nextPosition);
  
  if (nextPlayer?.type === 'ai') {
    await handleAISpeech(nextPlayer);
    setTimeout(() => moveToNextSpeaker(), 2000);
  }
};
```

**待完成**：
- [ ] 玩家列表中高亮显示当前发言者
- [ ] 添加发言倒计时
- [ ] 添加"跳过发言"按钮
- [ ] 优化AI发言间隔时间

### 角色技能系统
**当前状态**：技能逻辑已实现，需要UI界面

**已实现**：
```typescript
// 技能使用函数
const useSkill = async (targetId: string) => {
  switch (userRole) {
    case 'seer': // 预言家查验
      const isWerewolf = target.role === 'werewolf';
      toast({ title: '查验结果', description: `${target.name}是${isWerewolf ? '狼人' : '好人'}` });
      break;
    
    case 'witch': // 女巫用药
      if (selectedTarget === 'antidote' && witchPotions.antidote) {
        setWitchPotions(prev => ({ ...prev, antidote: false }));
      }
      break;
    
    case 'guard': // 守卫守护
      setNightActions(prev => ({ ...prev, guard: targetId }));
      break;
    
    case 'werewolf': // 狼人击杀
      setNightActions(prev => ({ ...prev, werewolf_kill: targetId }));
      break;
  }
};
```

**待完成**：
- [ ] 创建技能使用对话框UI
- [ ] 夜晚阶段自动弹出技能界面
- [ ] 显示可选目标列表
- [ ] 女巫药水选择界面
- [ ] 猎人开枪功能实现

## ⏳ 待开发功能

### 1. UI布局优化
**需求**：将玩家左右两侧对称分布

**设计方案**：
```
        [1号]
    [2号]   [6号]
  [3号]       [5号]
        [4号]
```

**实现计划**：
- [ ] 创建圆形布局组件
- [ ] 计算玩家位置坐标
- [ ] 使用绝对定位放置玩家卡片
- [ ] 添加连接线或圆形边框
- [ ] 响应式适配不同屏幕

### 2. 技能UI界面
**需求**：夜晚阶段显示技能使用界面

**设计方案**：
```
┌─────────────────────────┐
│   使用技能 - 预言家     │
├─────────────────────────┤
│ 请选择要查验的玩家：    │
│                         │
│ [2号] 逻辑大师          │
│ [3号] 情感玩家          │
│ [4号] 激进派            │
│ ...                     │
│                         │
│ [确定] [取消]           │
└─────────────────────────┘
```

**实现计划**：
- [ ] 创建SkillDialog组件
- [ ] 根据角色显示不同界面
- [ ] 女巫特殊界面（解药/毒药选择）
- [ ] 目标选择列表
- [ ] 技能确认和取消

### 3. 游戏流程完善
**待实现**：
- [ ] 夜晚阶段结算（处理击杀、守护、用药）
- [ ] 死亡公告
- [ ] 遗言系统
- [ ] 投票系统
- [ ] 胜利条件判定
- [ ] 游戏结算页面

### 4. 高级功能
**待实现**：
- [ ] 发言历史回顾
- [ ] 玩家笔记功能
- [ ] 游戏录像回放
- [ ] 数据统计分析
- [ ] 多房间支持
- [ ] 真人+AI混合对战

## 🐛 已知问题

### 1. 角色卡片弹出问题
**状态**：✅ 已修复

**解决方案**：
- 移除setTimeout延迟
- 修改Dialog打开条件为`showRoleCard && userRole !== null`
- 添加调试日志

### 2. 发言顺序混乱
**状态**：✅ 已修复

**解决方案**：
- 实现currentSpeaker状态管理
- 添加发言权限检查
- 实现自动切换逻辑

### 3. AI随机回复
**状态**：✅ 已修复

**解决方案**：
- 改为按顺序发言
- AI根据座位号依次发言
- 发言内容包含座位号信息

## 📊 开发进度统计

### 整体进度：60%

- ✅ 角色分配系统：100%
- ✅ 角色卡片展示：100%
- ✅ 语音输入功能：100%
- 🔧 顺位发言系统：70%
- 🔧 角色技能系统：50%
- ⏳ UI布局优化：0%
- ⏳ 游戏流程完善：30%

### 代码统计

- 总行数：~800行
- 组件数：1个主组件
- 状态管理：15个状态
- 函数数：~20个函数

## 🎯 下一步计划

### 优先级1：完成顺位发言UI
**预计时间**：1-2小时

**任务清单**：
- [ ] 玩家列表高亮当前发言者
- [ ] 添加"当前发言"标识
- [ ] 添加发言倒计时（可选）
- [ ] 优化AI发言间隔

### 优先级2：实现技能UI界面
**预计时间**：2-3小时

**任务清单**：
- [ ] 创建技能对话框组件
- [ ] 实现目标选择界面
- [ ] 女巫药水选择界面
- [ ] 夜晚阶段自动弹出
- [ ] 技能使用反馈

### 优先级3：优化UI布局
**预计时间**：3-4小时

**任务清单**：
- [ ] 设计圆形布局
- [ ] 实现玩家位置计算
- [ ] 创建玩家卡片组件
- [ ] 响应式适配
- [ ] 动画效果

### 优先级4：完善游戏流程
**预计时间**：4-5小时

**任务清单**：
- [ ] 夜晚结算系统
- [ ] 死亡公告
- [ ] 投票系统
- [ ] 胜利判定
- [ ] 游戏结算

## 💡 技术要点

### 1. 顺位发言实现

```typescript
// 核心状态
const [currentSpeaker, setCurrentSpeaker] = useState<number>(1);

// 发言权限检查
const canSpeak = () => {
  const currentPlayer = players.find(p => p.position === currentSpeaker);
  return currentPlayer?.type === 'user';
};

// 自动切换
const moveToNextSpeaker = async () => {
  let next = currentSpeaker + 1;
  if (next > playerCount) next = 1;
  setCurrentSpeaker(next);
  
  const nextPlayer = players.find(p => p.position === next);
  if (nextPlayer?.type === 'ai') {
    await handleAISpeech(nextPlayer);
    setTimeout(moveToNextSpeaker, 2000);
  }
};
```

### 2. 技能系统实现

```typescript
// 技能状态
const [showSkillDialog, setShowSkillDialog] = useState(false);
const [selectedTarget, setSelectedTarget] = useState<string | null>(null);
const [witchPotions, setWitchPotions] = useState({ antidote: true, poison: true });
const [nightActions, setNightActions] = useState<Record<string, any>>({});

// 技能使用
const useSkill = async (targetId: string) => {
  switch (userRole) {
    case 'seer':
      // 查验逻辑
      break;
    case 'witch':
      // 用药逻辑
      break;
    // ...
  }
};
```

### 3. 圆形布局实现

```typescript
// 计算玩家位置
const getPlayerPosition = (index: number, total: number) => {
  const angle = (2 * Math.PI * index) / total - Math.PI / 2;
  const radius = 200; // 圆形半径
  return {
    x: Math.cos(angle) * radius,
    y: Math.sin(angle) * radius,
  };
};
```

## 📝 测试清单

### 顺位发言测试
- [ ] 1号位开始发言
- [ ] 用户发言后自动切换到下一位
- [ ] AI按顺序自动发言
- [ ] 发言完一轮后重新开始
- [ ] 非当前发言者无法发言

### 技能系统测试
- [ ] 预言家查验正确
- [ ] 女巫药水使用正确
- [ ] 守卫守护生效
- [ ] 狼人击杀生效
- [ ] 技能只能使用一次

### UI布局测试
- [ ] 玩家位置正确
- [ ] 响应式适配
- [ ] 当前发言者高亮
- [ ] 动画流畅

## 🔗 相关文档

- [V3更新说明](./WEREWOLF_V3_UPDATE.md)
- [角色卡片修复说明](./ROLE_CARD_FIX.md)
- [快速测试指南](./QUICK_TEST_GUIDE.md)
- [功能清单](./FEATURE_CHECKLIST.md)

---

**更新时间**: 2025-01-10  
**版本**: V4.0-Alpha  
**状态**: 🔧 开发中  
**完成度**: 60%
