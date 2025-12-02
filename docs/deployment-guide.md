# 部署指南

## 架构概览

```
前端 (Vercel)                    后端 (你的服务器)
traeapp-xxx.vercel.app  <--->   hxlr.lzyupupup.online
     |                                |
     |  WebSocket + HTTP API          |
     +--------------------------------+
```

## 一、前端配置 (Vercel)

### 1. 环境变量配置

在 Vercel 项目设置中添加环境变量：

```
VITE_API_URL=https://hxlr.lzyupupup.online
VITE_WS_URL=wss://hxlr.lzyupupup.online
VITE_LLM_API_KEY=your-openai-api-key (可选)
VITE_LLM_BASE_URL=https://api.openai.com (可选)
VITE_LLM_MODEL=gpt-4o-mini (可选)
```

### 2. 重新部署

添加环境变量后，在 Vercel 触发重新部署。

---

## 二、后端部署 (你的服务器)

### 方式一：使用 PM2 (推荐)

#### 1. 安装依赖

```bash
# 安装 Node.js (如果没有)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# 安装 PM2
npm install -g pm2
```

#### 2. 上传代码到服务器

```bash
# 在本地打包
cd app-7gn2vl8qe60x
npm run build

# 上传到服务器 (使用 scp 或其他方式)
scp -r dist/ user@your-server:/path/to/app/
scp -r src/server/ user@your-server:/path/to/app/
scp package.json user@your-server:/path/to/app/
```

#### 3. 在服务器上安装依赖

```bash
cd /path/to/app
npm install --production
```

#### 4. 创建 PM2 配置文件

在服务器上创建 `ecosystem.config.js`：

```javascript
module.exports = {
  apps: [{
    name: 'werewolf-game',
    script: 'src/server/index.ts',
    interpreter: 'npx',
    interpreter_args: 'tsx',
    env: {
      NODE_ENV: 'production',
      PORT: 5200,
      CORS_ORIGIN: 'https://traeapp-7gn2vl8qe60xp2ip-2jligvwuq-liiziyes-projects.vercel.app'
    }
  }]
};
```

#### 5. 启动服务

```bash
pm2 start ecosystem.config.js
pm2 save
pm2 startup  # 设置开机自启
```

---

### 方式二：使用 Docker

#### 1. 创建 Dockerfile

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 5200

CMD ["npx", "tsx", "src/server/index.ts"]
```

#### 2. 创建 docker-compose.yml

```yaml
version: '3.8'
services:
  werewolf-game:
    build: .
    ports:
      - "5200:5200"
    environment:
      - NODE_ENV=production
      - PORT=5200
      - CORS_ORIGIN=https://traeapp-7gn2vl8qe60xp2ip-2jligvwuq-liiziyes-projects.vercel.app
    restart: always
```

#### 3. 启动

```bash
docker-compose up -d
```

---

## 三、Nginx 反向代理配置

在服务器上配置 Nginx，将域名 `hxlr.lzyupupup.online` 代理到后端服务：

### 1. 安装 Nginx

```bash
sudo apt update
sudo apt install nginx
```

### 2. 配置 SSL 证书 (Let's Encrypt)

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d hxlr.lzyupupup.online
```

### 3. Nginx 配置文件

创建 `/etc/nginx/sites-available/werewolf-game`：

```nginx
server {
    listen 80;
    server_name hxlr.lzyupupup.online;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name hxlr.lzyupupup.online;

    ssl_certificate /etc/letsencrypt/live/hxlr.lzyupupup.online/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/hxlr.lzyupupup.online/privkey.pem;

    # HTTP API
    location /api {
        proxy_pass http://127.0.0.1:5200;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # WebSocket
    location /socket.io {
        proxy_pass http://127.0.0.1:5200;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 86400;
    }

    # 其他请求也代理到后端
    location / {
        proxy_pass http://127.0.0.1:5200;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### 4. 启用配置

```bash
sudo ln -s /etc/nginx/sites-available/werewolf-game /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

---

## 四、后端代码修改

需要修改后端代码以支持跨域：

### 修改 `src/server/index.ts`

确保 CORS 配置正确：

```typescript
const CORS_ORIGIN = process.env.CORS_ORIGIN || 'https://traeapp-7gn2vl8qe60xp2ip-2jligvwuq-liiziyes-projects.vercel.app';

const io = new Server(server, {
  cors: {
    origin: [CORS_ORIGIN, 'http://localhost:5173', 'http://127.0.0.1:5173'],
    methods: ['GET', 'POST'],
    credentials: true
  }
});

app.use(cors({
  origin: [CORS_ORIGIN, 'http://localhost:5173', 'http://127.0.0.1:5173'],
  credentials: true
}));
```

---

## 五、检查清单

- [ ] 服务器防火墙开放 5200 端口 (或只开放 80/443)
- [ ] Nginx 配置正确
- [ ] SSL 证书已安装
- [ ] PM2/Docker 服务已启动
- [ ] Vercel 环境变量已配置
- [ ] 测试 WebSocket 连接

---

## 六、常用命令

```bash
# PM2 管理
pm2 status           # 查看状态
pm2 logs             # 查看日志
pm2 restart all      # 重启服务
pm2 stop all         # 停止服务

# Nginx 管理
sudo systemctl status nginx
sudo systemctl restart nginx
sudo nginx -t        # 测试配置

# 查看端口
sudo netstat -tlnp | grep 5200
```
