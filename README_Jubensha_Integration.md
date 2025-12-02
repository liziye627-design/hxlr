# 集成说明：AI剧本杀功能

## 内容概述
- 后端：FastAPI + WebSocket，端口 `8010`
- 前端：Next.js 应用，开发端口 `3001`

## 快速启动
1. 安装前端依赖：在 `jubensha-ai-master/frontend` 运行 `npm install`
2. 配置后端环境：在 `jubensha-ai-master/backend` 复制 `.env.example` 为 `.env` 并填入必要变量
3. 如需前端环境变量：在 `jubensha-ai-master/frontend` 复制 `.env.local.example` 为 `.env.local`
4. 在项目根目录运行 `./start_jubensha.ps1`

## 访问地址
- 前端开发页：`http://localhost:3001`
- 后端接口文档：`http://localhost:8010/docs`

## 注意事项
- 后端要求 Python `>=3.13`
- 数据库默认配置为 PostgreSQL，可通过 `.env` 修改
- 前端默认使用 `NEXT_PUBLIC_API_URL=http://localhost:8010/api`
