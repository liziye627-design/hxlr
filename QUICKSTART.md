# 次元阅关 - 快速启动指南

## 🚀 快速开始

### 1. 环境准备

确保已安装以下软件：
- Node.js >= 20
- npm >= 10 或 pnpm

### 2. 安装依赖

```bash
# 使用npm
npm install

# 或使用pnpm（推荐）
pnpm install
```

### 3. 配置环境变量

项目已预配置好所有必要的环境变量，包括：
- ✅ Supabase数据库连接
- ✅ DeepSeek AI API配置
- ✅ 应用ID配置

查看 `.env` 文件确认配置：
```env
VITE_APP_ID=app-7gn2vl8qe60x
VITE_SUPABASE_URL=https://backend.appmiaoda.com/projects/supabase245135090743558144
VITE_SUPABASE_ANON_KEY=***
VITE_API_ENV=production
VITE_DEEPSEEK_API_KEY=sk-ruihuswjdpqyjcaijqpnjazjjyqofjuiytkjfnvzlsnvegxf
VITE_DEEPSEEK_API_URL=https://api.siliconflow.cn/v1/chat/completions
VITE_DEEPSEEK_MODEL=deepseek-ai/DeepSeek-V3.1-Terminus
```

### 4. 启动开发服务器

```bash
# 使用npm
npm run dev -- --host 127.0.0.1

# 或使用pnpm
pnpm dev -- --host 127.0.0.1
```

### 5. 访问应用

打开浏览器访问：`http://127.0.0.1:5173`

## 📋 功能检查清单

启动后，你可以体验以下功能：

### ✅ 首页
- 查看三种游戏模式（狼人杀、剧本杀、数字冒险）
- 查看用户信息和等级
- 快速进入游戏

### ✅ AI伴侣中心
- 查看4个不同性格的AI伴侣
- 查看伴侣详细信息
- 解锁新的AI伴侣
- 开始与AI伴侣对话

### ✅ 狼人杀游戏
- 选择游戏模式（PVE/PVP）
- 选择AI伴侣
- 开始游戏
- 实时对话互动

### ✅ 剧本杀游戏
- 浏览6个初始剧本
- 查看剧本详情（难度、类型、评分）
- 选择AI主持人
- 开始剧本游戏

### ✅ 数字冒险
- 选择AI向导
- 开始文本冒险
- 通过对话推动故事发展

### ✅ 排行榜
- 查看战斗力排行榜
- 查看魅力排行榜
- 查看配合排行榜

## 🎮 快速体验流程

### 体验狼人杀
1. 点击首页的"AI狼人杀"卡片
2. 选择PVE模式
3. 选择AI伴侣（推荐：阿尔法）
4. 点击"开始游戏"
5. 在聊天框输入你的发言

### 体验剧本杀
1. 点击首页的"AI剧本杀"卡片
2. 选择一个剧本（推荐：午夜凶铃）
3. 选择AI主持人（推荐：暗影）
4. 点击"开始游戏"
5. 根据AI引导进行推理

### 体验数字冒险
1. 点击首页的"数字冒险"卡片
2. 选择AI向导（推荐：水蓝）
3. 点击"开始冒险"
4. 输入你的选择和行动

## 🔧 开发工具

### 代码检查
```bash
# 运行代码检查
npm run lint

# 或使用pnpm
pnpm lint
```

### 类型检查
```bash
# TypeScript类型检查已集成在lint命令中
pnpm lint
```

## 📚 相关文档

- [使用说明](./USAGE.md) - 详细的功能使用说明
- [API配置](./API_CONFIG.md) - DeepSeek AI API配置说明
- [项目总结](./PROJECT_SUMMARY.md) - 完整的项目技术文档
- [开发任务](./TODO.md) - 开发任务清单

## 🎯 核心特性

### AI对话系统
- 使用DeepSeek-V3.1-Terminus模型
- 支持普通对话和流式对话
- 针对不同游戏场景优化

### 数据持久化
- Supabase云数据库
- 实时数据同步
- 完整的用户数据管理

### 响应式设计
- 桌面优先设计
- 移动端完美适配
- 流畅的动画效果

### 深蓝+紫色主题
- 科技感十足的配色
- 渐变效果
- 暗色模式支持

## ⚠️ 注意事项

1. **网络连接**：需要稳定的网络连接以使用AI功能
2. **浏览器兼容**：建议使用Chrome、Firefox、Safari或Edge最新版本
3. **API密钥**：已配置好DeepSeek API密钥，可直接使用
4. **数据库**：已连接到Supabase云数据库，包含初始数据

## 🐛 常见问题

### Q: 启动失败？
A: 确保Node.js版本 >= 20，并且已正确安装依赖

### Q: AI回复很慢？
A: 这是正常现象，AI模型需要时间生成回复。可以尝试使用流式对话提升体验

### Q: 看不到初始数据？
A: 数据库已预置4个AI伴侣和6个剧本故事，刷新页面即可看到

### Q: 如何切换AI模型？
A: 修改`.env`文件中的`VITE_DEEPSEEK_MODEL`变量

## 📞 技术支持

如有问题，请查看：
1. 项目文档
2. 代码注释
3. 控制台错误信息

---

**祝你游戏愉快！** 🎮✨
