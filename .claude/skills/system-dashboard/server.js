#!/usr/bin/env node
/**
 * System Dashboard Server
 * 统一系统管理仪表板后端服务
 */

const express = require('express');
const WebSocket = require('ws');
const cors = require('cors');
const fs = require('fs').promises;
const path = require('path');
const os = require('os');

class SystemDashboard {
  constructor(config = {}) {
    this.app = express();
    this.config = {
      port: config.port || 8080,
      host: config.host || 'localhost',
      claudePath: config.claudePath || path.join(os.homedir(), '.claude'),
      ...config
    };

    this.wss = null;
    this.clients = new Set();
    this.startTime = Date.now();

    this.setupMiddleware();
    this.setupRoutes();
    this.setupWebSocket();
  }

  setupMiddleware() {
    this.app.use(cors());
    this.app.use(express.json());
    this.app.use(express.static('public'));

    // 日志中间件
    this.app.use((req, res, next) => {
      console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
      next();
    });
  }

  setupRoutes() {
    // API 状态
    this.app.get('/api/status', async (req, res) => {
      const status = await this.getSystemStatus();
      res.json(status);
    });

    // Skills 列表
    this.app.get('/api/skills', async (req, res) => {
      const { category, status } = req.query;
      const skills = await this.getSkills(category, status);
      res.json({ skills });
    });

    // MCP 服务器列表
    this.app.get('/api/mcp', async (req, res) => {
      const mcps = await this.getMcpServers();
      res.json({ servers: mcps });
    });

    // 系统信息
    this.app.get('/api/system', async (req, res) => {
      const info = await this.getSystemInfo();
      res.json(info);
    });

    // 配置文件
    this.app.get('/api/config', async (req, res) => {
      const config = await this.getConfig();
      res.json(config);
    });

    this.app.put('/api/config', async (req, res) => {
      await this.saveConfig(req.body);
      this.broadcast({ type: 'config-updated', data: req.body });
      res.json({ success: true });
    });
  }

  setupWebSocket() {
    this.wss = new WebSocket.Server({ noServer: this.app });

    this.wss.on('connection', (ws) => {
      console.log('New client connected');
      this.clients.add(ws);

      ws.on('message', (message) => {
        console.log('Received:', message);
      });

      ws.on('close', () => {
        console.log('Client disconnected');
        this.clients.delete(ws);
      });
    });
  }

  broadcast(data) {
    const message = JSON.stringify(data);
    this.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  }

  async getSystemStatus() {
    const skillsPath = path.join(this.config.claudePath, 'skills');
    const skills = await fs.readdir(skillsPath).catch(() => []);

    const categories = {
      obsidian: 0,
      agentdb: 0,
      github: 0,
      'flow-nexus': 0,
      sparc: 0
    };

    skills.forEach(skill => {
      if (skill.startsWith('obsidian') || skill.startsWith('defuddle') || skill.startsWith('json-canvas')) {
        categories.obsidian++;
      } else if (skill.startsWith('agentdb')) {
        categories.agentdb++;
      } else if (skill.startsWith('github')) {
        categories.github++;
      } else if (skill.startsWith('flow-nexus')) {
        categories['flow-nexus']++;
      } else if (skill.startsWith('sparc')) {
        categories.sparc++;
      }
    });

    return {
      skills: {
        total: skills.length,
        active: skills.length,
        categories
      },
      mcp: {
        total: 12,
        active: 9,
        ready: 3
      },
      system: {
        uptime: this.getUptime(),
        version: '1.0.0',
        platform: os.platform(),
        arch: os.arch()
      }
    };
  }

  async getSkills(category = null, status = null) {
    const skillsPath = path.join(this.config.claudePath, 'skills');
    const skillDirs = await fs.readdir(skillsPath).catch(() => []);

    let skills = [];

    for (const skillDir of skillDirs) {
      const skillPath = path.join(skillsPath, skillDir);
      const skillMdPath = path.join(skillPath, 'SKILL.md');

      if (!await fs.access(skillMdPath).catch(() => false)) {
        continue;
      }

      const skillCategory = this.categorizeSkill(skillDir);
      const skillStatus = 'active'; // 可以从配置文件读取

      if (category && skillCategory !== category) continue;
      if (status && skillStatus !== status) continue;

      const content = await fs.readFile(skillMdPath, 'utf-8').catch(() => '');
      const description = this.extractDescription(content);

      skills.push({
        name: skillDir,
        category: skillCategory,
        status: skillStatus,
        description,
        version: '1.0.0' // 可以从内容中提取
      });
    }

    return skills;
  }

  categorizeSkill(name) {
    if (name.startsWith('obsidian') || name.startsWith('defuddle') || name.startsWith('json-canvas')) {
      return 'Obsidian';
    } else if (name.startsWith('agentdb')) {
      return 'AgentDB';
    } else if (name.startsWith('github')) {
      return 'GitHub';
    } else if (name.startsWith('flow-nexus')) {
      return 'Flow-Nexus';
    } else if (name.startsWith('sparc')) {
      return 'SPARC';
    } else if (name.startsWith('swarm') || name.includes('coordinator')) {
      return 'Swarm';
    } else if (name.startsWith('test') || name.startsWith('debugging') || name.startsWith('verification')) {
      return 'Testing';
    } else if (name.startsWith('learning') || name.startsWith('performance')) {
      return 'Learning';
    } else {
      return 'Other';
    }
  }

  extractDescription(content) {
    const lines = content.split('\n');
    for (const line of lines) {
      if (line.startsWith('# ')) {
        const desc = line.substring(2).trim();
        if (desc.length > 10 && desc.length < 200) {
          return desc;
        }
      }
    }
    return 'No description available';
  }

  async getMcpServers() {
    const settingsPath = path.join(this.config.claudePath, 'settings.local.json');
    const settings = await fs.readFile(settingsPath, 'utf-8').catch(() => '{}');
    const parsed = JSON.parse(settings);

    const enabledServers = parsed.enabledMcpjsonServers || [];

    const servers = [
      { name: 'claude-flow', status: 'active', type: 'stdio', command: 'npx', args: ['claude-flow@alpha'] },
      { name: 'ruv-swarm', status: 'active', type: 'stdio', command: 'npx', args: ['ruv-swarm@latest'] },
      { name: 'flow-nexus', status: 'active', type: 'stdio', command: 'npx', args: ['flow-nexus@latest'] },
      { name: 'fetch', status: 'active', type: 'npx', command: 'npx', args: ['-y', '@modelcontextprotocol/server-fetch'] },
      { name: 'memory', status: 'active', type: 'npx', command: 'npx', args: ['-y', '@modelcontextprotocol/server-memory'] },
      { name: 'filesystem', status: 'active', type: 'npx', command: 'npx', args: ['-y', '@modelcontextprotocol/server-filesystem'] },
      { name: 'github', status: 'active', type: 'npx', command: 'npx', args: ['-y', '@modelcontextprotocol/server-github'] },
      { name: 'obsidian', status: 'active', type: 'node', command: 'node', args: ['mcp-obsidian'] },
      { name: 'postgresql', status: 'ready', type: 'npx', command: 'npx', args: ['-y', '@modelcontextprotocol/server-postgres'] },
      { name: 'mysql', status: 'ready', type: 'uvx', command: 'uvx', args: ['mcp-server-mysql'] },
      { name: 'brave_search', status: 'ready', type: 'npx', command: 'npx', args: ['-y', '@modelcontextprotocol/server-brave-search'] }
    ];

    return servers.map(server => ({
      ...server,
      enabled: enabledServers.includes(server.name)
    }));
  }

  async getSystemInfo() {
    return {
      platform: os.platform(),
      arch: os.arch(),
      nodeVersion: process.version,
      uptime: this.getUptime(),
      memory: process.memoryUsage(),
      cpus: os.cpus(),
      hostname: os.hostname()
    };
  }

  async getConfig() {
    const configPath = path.join(__dirname, 'dashboard.config.json');
    const content = await fs.readFile(configPath, 'utf-8').catch(() => '{}');
    return JSON.parse(content);
  }

  async saveConfig(config) {
    const configPath = path.join(__dirname, 'dashboard.config.json');
    await fs.writeFile(configPath, JSON.stringify(config, null, 2));
  }

  getUptime() {
    const elapsed = Date.now() - this.startTime;
    const days = Math.floor(elapsed / 86400000);
    const hours = Math.floor((elapsed % 86400000) / 3600000);
    const minutes = Math.floor((elapsed % 3600000) / 60000);
    return `${days}d ${hours}h ${minutes}m`;
  }

  start() {
    this.server = this.app.listen(this.config.port, this.config.host, () => {
      console.log(`System Dashboard running at http://${this.config.host}:${this.config.port}`);
      console.log(`WebSocket server ready`);
    });

    // 定期广播状态更新
    setInterval(async () => {
      const status = await this.getSystemStatus();
      this.broadcast({ type: 'status-updated', data: status });
    }, 5000);
  }

  stop() {
    if (this.server) {
      this.server.close();
      console.log('System Dashboard stopped');
    }
    if (this.wss) {
      this.wss.close();
    }
  }
}

// 启动服务器
if (require.main === module) {
  const dashboard = new SystemDashboard();
  dashboard.start();

  process.on('SIGINT', () => {
    console.log('\nShutting down gracefully...');
    dashboard.stop();
    process.exit(0);
  });
}

module.exports = SystemDashboard;
