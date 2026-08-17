# 剧本杀 LLM Agent 配置指南

## 环境变量配置

在 `.env` 文件中添加以下配置：

```env
# ============================================
# 剧本杀 LLM Agent 配置
# ============================================

# LLM 提供商: openai | anthropic | qwen | deepseek | custom
VITE_LLM_PROVIDER=openai

# API Key (必填)
VITE_LLM_API_KEY=your-api-key-here

# API Base URL (可选，用于代理或自定义端点)
VITE_LLM_BASE_URL=https://api.openai.com

# 模型名称
VITE_LLM_MODEL=gpt-4o-mini

# 温度参数 (0-1，越高越随机)
VITE_LLM_TEMPERATURE=0.8

# 最大Token数
VITE_LLM_MAX_TOKENS=1000
```

## 支持的 LLM 提供商

### 1. OpenAI
```env
VITE_LLM_PROVIDER=openai
VITE_LLM_API_KEY=sk-xxx
VITE_LLM_MODEL=gpt-4o-mini
```

### 2. Anthropic Claude
```env
VITE_LLM_PROVIDER=anthropic
VITE_LLM_API_KEY=sk-ant-xxx
VITE_LLM_MODEL=claude-3-sonnet-20240229
```

### 3. 通义千问 (Qwen)
```env
VITE_LLM_PROVIDER=qwen
VITE_LLM_API_KEY=sk-xxx
VITE_LLM_BASE_URL=https://dashscope.aliyuncs.com
VITE_LLM_MODEL=qwen-turbo
```

### 4. DeepSeek
```env
VITE_LLM_PROVIDER=deepseek
VITE_LLM_API_KEY=sk-xxx
VITE_LLM_MODEL=deepseek-chat
```

### 5. 自定义/代理
```env
VITE_LLM_PROVIDER=custom
VITE_LLM_API_KEY=your-key
VITE_LLM_BASE_URL=https://your-proxy.com
VITE_LLM_MODEL=your-model
```

## 命运修正系统 (Fate Correction)

### 核心逻辑
- **不硬性拒绝玩家**：使用"是的，但是..."而非"你不能这么做"
- **收束性叙事**：无论玩家如何操作，最终都会回到剧本主线

### 修正策略

#### 1. 精神干预 (Mental Interference)
当玩家试图逃跑或做出偏离行为时，描述头痛、幻觉等症状。

#### 2. 强制断片 (Memory Blackout)
利用角色的精神状态，描述记忆断层和时间跳跃。

#### 3. 情感羁绊 (Emotional Anchor)
利用对其他角色的执念、愧疚感拉回玩家。

#### 4. 环境封锁 (Environmental Block)
利用浓雾、锁门、诡异氛围阻止离开。

## 各剧本角色配置

### 小丑回魂 (IT)
| 角色 | 修正偏好 | 当前目标 |
|------|----------|----------|
| 潘尼怀斯 | 精神干预 | 制造恐惧 |
| 比尔 | 情感羁绊 | 找到乔治 |
| 贝弗莉 | 情感羁绊 | 面对父亲 |
| 里奇 | 环境封锁 | 克服恐惧 |

### 第二十二条校规
| 角色 | 修正偏好 | 当前目标 |
|------|----------|----------|
| 李萱萱 | 精神干预 | 发现真相 |
| 谢雨晴 | 情感羁绊 | 隐藏秘密 |
| 皇甫青 | 环境封锁 | 调查学校 |
| 白衣恶灵 | 精神干预 | 让人记起名字 |

### 收获日 (Payday)
| 角色 | 修正偏好 | 当前目标 |
|------|----------|----------|
| 建筑师 | 情感羁绊 | 独吞赃款 |
| 重锤 | 环境封锁 | 拿到所有钱 |
| 幽灵 | 精神干预 | 带走硬盘 |
| 小丑 | 环境封锁 | 看烟花 |
| 车手 | 情感羁绊 | 拖延时间 |

### 病娇男孩的精分日记
| 角色 | 修正偏好 | 当前目标 |
|------|----------|----------|
| 星期一(宁浩) | 情感羁绊 | 永远的朋友 |
| 星期二 | 精神干预 | 完成小说 |
| 星期四 | 强制断片 | 继续游戏 |
| 星期天 | 精神干预 | 面对恐惧 |

## 使用示例

```typescript
import { useJubenshaAgent } from '@/hooks/useJubenshaAgent';

function MyGame() {
  const { initAgent, sendMessage, updatePhase } = useJubenshaAgent();

  // 初始化角色
  useEffect(() => {
    initAgent({
      characterId: 'monday',
      characterName: '星期一',
      scriptId: '病娇男孩的精分日记',
      traits: '稳重、温和、像大哥哥',
      hiddenSecret: '真实身份是宁浩',
      currentGoal: '照顾其他人格',
      missionObjective: '发现父母死亡真相'
    });
  }, []);

  // 更新游戏阶段
  const advancePhase = () => {
    updatePhase({
      phase: 'massacre',
      goal: '发现愿望与死亡的关系',
      objective: '检查星期一的日记',
      targetLocation: '客厅',
      currentClue: '父亲的死亡剪报'
    });
  };

  // 发送消息
  const handleSend = async (input: string) => {
    const response = await sendMessage(input);
    console.log(response);
  };
}
```

## 注意事项

1. **API Key 安全**：不要将 API Key 提交到代码仓库
2. **费用控制**：设置合理的 max_tokens 避免过高费用
3. **降级策略**：API 失败时自动使用本地逻辑
4. **角色一致性**：确保 Agent 始终保持角色性格
