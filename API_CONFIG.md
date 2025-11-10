# API配置说明

## DeepSeek AI模型配置

本项目使用DeepSeek-V3.1-Terminus模型，通过硅基流动平台提供的API服务。

### 配置信息

在`.env`文件中配置以下环境变量：

```env
# DeepSeek AI配置
VITE_DEEPSEEK_API_KEY=sk-ruihuswjdpqyjcaijqpnjazjjyqofjuiytkjfnvzlsnvegxf
VITE_DEEPSEEK_API_URL=https://api.siliconflow.cn/v1/chat/completions
VITE_DEEPSEEK_MODEL=deepseek-ai/DeepSeek-V3.1-Terminus
```

### API参数说明

#### 请求格式

```json
{
  "model": "deepseek-ai/DeepSeek-V3.1-Terminus",
  "messages": [
    {
      "role": "system",
      "content": "系统提示词"
    },
    {
      "role": "user",
      "content": "用户消息"
    }
  ],
  "temperature": 0.7,
  "max_tokens": 2000,
  "stream": false
}
```

#### 参数说明

- **model**: 模型名称，固定为`deepseek-ai/DeepSeek-V3.1-Terminus`
- **messages**: 对话消息数组
  - **role**: 角色类型（system/user/assistant）
  - **content**: 消息内容
- **temperature**: 温度参数，控制输出的随机性（0-1），默认0.7
- **max_tokens**: 最大生成token数，默认2000
- **stream**: 是否使用流式输出，默认false

#### 响应格式

普通响应：
```json
{
  "choices": [
    {
      "message": {
        "role": "assistant",
        "content": "AI回复内容"
      }
    }
  ]
}
```

流式响应：
```
data: {"choices":[{"delta":{"content":"AI"}}]}
data: {"choices":[{"delta":{"content":"回复"}}]}
data: {"choices":[{"delta":{"content":"内容"}}]}
data: [DONE]
```

### 使用示例

#### 普通对话

```typescript
import { aiService } from '@/services/ai';

const messages = [
  { role: 'user', content: '你好' }
];

const response = await aiService.chat(messages);
console.log(response); // AI的回复
```

#### 带AI伴侣的对话

```typescript
import { aiService } from '@/services/ai';

const companion = {
  name: '阿尔法',
  personality: { logical: 0.9, emotional: 0.3 },
  skills: ['分析', '推理']
};

const messages = [
  { role: 'user', content: '帮我分析一下这个局势' }
];

const response = await aiService.chat(messages, companion);
```

#### 流式对话

```typescript
import { aiService } from '@/services/ai';

const messages = [
  { role: 'user', content: '讲一个故事' }
];

await aiService.streamChat(messages, companion, (chunk) => {
  console.log(chunk); // 实时接收AI输出的片段
});
```

### 游戏场景专用方法

#### 狼人杀游戏

```typescript
const response = await aiService.werewolfStrategy(
  '当前游戏状态描述',
  companion,
  '玩家发言内容'
);
```

#### 剧本杀游戏

```typescript
const response = await aiService.scriptMurderInteraction(
  '剧本背景和线索',
  companion,
  '玩家提问或行动'
);
```

#### 数字冒险游戏

```typescript
const response = await aiService.adventureNarration(
  '当前故事上下文',
  '玩家选择或行动',
  companion
);
```

## 注意事项

1. **API密钥安全**：不要将API密钥提交到公共代码仓库
2. **请求频率**：注意API调用频率限制，避免过于频繁的请求
3. **错误处理**：所有API调用都包含错误处理，失败时返回友好的提示信息
4. **超时设置**：默认超时时间为60秒，适合长文本生成
5. **流式输出**：对于需要实时反馈的场景，建议使用流式输出

## 故障排查

### 常见问题

1. **API调用失败**
   - 检查网络连接
   - 确认API密钥是否正确
   - 查看浏览器控制台的错误信息

2. **响应速度慢**
   - 检查网络延迟
   - 考虑使用流式输出提升用户体验
   - 适当减少max_tokens参数

3. **输出质量不佳**
   - 调整temperature参数
   - 优化系统提示词
   - 提供更详细的上下文信息

## 更新日志

- **2025-01-10**: 初始配置，使用DeepSeek-V3.1-Terminus模型
- **2025-01-10**: 集成硅基流动平台API
- **2025-01-10**: 实现普通对话和流式对话功能
- **2025-01-10**: 添加游戏场景专用方法
