/**
 * Mindcraft 桥接服务
 * 负责与 Mindcraft 进程通信，管理 Bot 生命周期
 */

import { spawn, ChildProcess } from 'node:child_process';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import type {
  UnifiedAgentProfile,
  MindcraftBridgeConfig,
  AgentRuntimeStatus,
  Task,
  MinecraftWorldState,
} from './types';

export class MindcraftBridge {
  private process: ChildProcess | null = null;
  private config: MindcraftBridgeConfig;
  private profiles: Map<string, UnifiedAgentProfile> = new Map();
  private runtimeStatus: Map<string, AgentRuntimeStatus> = new Map();
  private messageCallbacks: Map<string, (message: string) => void> = new Map();
  private isStarting: boolean = false;

  constructor(config: MindcraftBridgeConfig) {
    this.config = config;
  }

  /**
   * 检查 Mindcraft 是否已安装
   */
  async checkInstallation(): Promise<{
    installed: boolean;
    hasNodeModules: boolean;
    hasKeysConfigured: boolean;
    version?: string;
  }> {
    const mainPath = path.join(this.config.mindcraftRoot, 'main.js');
    const nodeModulesPath = path.join(this.config.mindcraftRoot, 'node_modules');
    const keysPath = path.join(this.config.mindcraftRoot, 'keys.json');

    const [mainExists, nodeModulesExists, keysExists] = await Promise.all([
      fs.access(mainPath).then(() => true).catch(() => false),
      fs.access(nodeModulesPath).then(() => true).catch(() => false),
      fs.access(keysPath).then(() => true).catch(() => false),
    ]);

    let version: string | undefined;
    if (mainExists) {
      try {
        const packageJson = await fs.readFile(
          path.join(this.config.mindcraftRoot, 'package.json'),
          'utf-8'
        );
        version = JSON.parse(packageJson).version;
      } catch {
        // ignore
      }
    }

    return {
      installed: mainExists,
      hasNodeModules: nodeModulesExists,
      hasKeysConfigured: keysExists,
      version,
    };
  }

  /**
   * 安装 Mindcraft 依赖
   */
  async installDependencies(): Promise<void> {
    const { spawn } = await import('node:child_process');

    return new Promise((resolve, reject) => {
      const npmProcess = spawn('npm', ['install'], {
        cwd: this.config.mindcraftRoot,
        stdio: 'inherit',
        shell: true,
      });

      npmProcess.on('close', (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`npm install failed with code ${code}`));
        }
      });

      npmProcess.on('error', (error) => {
        reject(error);
      });
    });
  }

  /**
   * 生成 Mindcraft Profile 文件
   */
  async generateProfile(profile: UnifiedAgentProfile): Promise<string> {
    const profilesDir = path.join(this.config.mindcraftRoot, 'profiles');
    await fs.mkdir(profilesDir, { recursive: true });

    // 构建 Mindcraft 兼容的 profile 格式
    const mindcraftProfile = {
      name: profile.name,
      model: profile.model,
      code_model: profile.code_model,
      vision_model: profile.vision_model,
      embedding: profile.embedding,
      speak_model: profile.speak_model,
      personality: profile.personality,
      examples: profile.examples,
      conversation_examples: [],
    };

    const profilePath = path.join(profilesDir, `${profile.id}.json`);
    await fs.writeFile(profilePath, JSON.stringify(mindcraftProfile, null, 2));

    this.profiles.set(profile.id, profile);
    return profilePath;
  }

  /**
   * 批量生成 Profiles
   */
  async generateProfiles(profiles: UnifiedAgentProfile[]): Promise<string[]> {
    const paths: string[] = [];
    for (const profile of profiles) {
      const profilePath = await this.generateProfile(profile);
      paths.push(profilePath);
    }
    return paths;
  }

  /**
   * 启动 Mindcraft 服务
   */
  async start(profileIds: string[]): Promise<void> {
    if (this.process || this.isStarting) {
      throw new Error('Mindcraft is already running or starting');
    }

    this.isStarting = true;

    return new Promise((resolve, reject) => {
      const profileArgs = profileIds.map((id) => `profiles/${id}.json`);

      this.process = spawn(
        'node',
        ['main.js', '--profiles', ...profileArgs],
        {
          cwd: this.config.mindcraftRoot,
          stdio: ['pipe', 'pipe', 'pipe'],
          env: {
            ...process.env,
            MINECRAFT_HOST: this.config.serverHost,
            MINECRAFT_PORT: String(this.config.serverPort),
          },
        }
      );

      let startupOutput = '';
      const startupTimeout = setTimeout(() => {
        reject(new Error('Mindcraft startup timeout'));
        this.isStarting = false;
      }, 60000);

      this.process.stdout?.on('data', (data: Buffer) => {
        const output = data.toString();
        startupOutput += output;
        console.log('[Mindcraft stdout]', output);

        // 检测启动成功标志
        if (output.includes('Bot spawned') || output.includes('logged in')) {
          clearTimeout(startupTimeout);
          this.isStarting = false;

          // 初始化运行时状态
          for (const profileId of profileIds) {
            this.runtimeStatus.set(profileId, {
              profileId,
              isActive: true,
              connectedToMinecraft: true,
              currentTask: null,
              lastActivity: new Date().toISOString(),
              messageCount: 0,
            });
          }

          resolve();
        }
      });

      this.process.stderr?.on('data', (data: Buffer) => {
        console.error('[Mindcraft stderr]', data.toString());
      });

      this.process.on('error', (error) => {
        clearTimeout(startupTimeout);
        this.isStarting = false;
        reject(error);
      });

      this.process.on('close', (code) => {
        clearTimeout(startupTimeout);
        this.isStarting = false;
        console.log(`[Mindcraft] Process exited with code ${code}`);
        this.process = null;

        // 更新所有运行时状态
        for (const [profileId, status] of this.runtimeStatus) {
          status.isActive = false;
          status.connectedToMinecraft = false;
        }
      });
    });
  }

  /**
   * 停止 Mindcraft 服务
   */
  async stop(): Promise<void> {
    if (!this.process) {
      return;
    }

    return new Promise((resolve) => {
      if (!this.process) {
        resolve();
        return;
      }

      this.process.on('close', () => {
        this.process = null;
        resolve();
      });

      // 发送停止信号
      this.process.kill('SIGTERM');

      // 强制超时
      setTimeout(() => {
        if (this.process) {
          this.process.kill('SIGKILL');
        }
        resolve();
      }, 5000);
    });
  }

  /**
   * 发送消息给指定 Bot
   * 通过 stdin 发送命令到 Mindcraft
   */
  async sendMessage(profileId: string, message: string): Promise<string> {
    if (!this.process || !this.process.stdin) {
      throw new Error('Mindcraft is not running');
    }

    const profile = this.profiles.get(profileId);
    if (!profile) {
      throw new Error(`Profile ${profileId} not found`);
    }

    // Mindcraft 通过游戏内聊天接收消息
    // 这里我们通过 stdin 发送命令格式
    const command = JSON.stringify({
      type: 'chat',
      botName: profile.name,
      message,
    });

    this.process.stdin.write(command + '\n');

    // 更新状态
    const status = this.runtimeStatus.get(profileId);
    if (status) {
      status.messageCount += 1;
      status.lastActivity = new Date().toISOString();
    }

    return `Message sent to ${profile.name}`;
  }

  /**
   * 获取运行时状态
   */
  getRuntimeStatus(profileId: string): AgentRuntimeStatus | undefined {
    return this.runtimeStatus.get(profileId);
  }

  /**
   * 获取所有运行时状态
   */
  getAllRuntimeStatus(): AgentRuntimeStatus[] {
    return Array.from(this.runtimeStatus.values());
  }

  /**
   * 获取世界状态 (从 Mindcraft 获取)
   */
  async getWorldState(profileId: string): Promise<MinecraftWorldState | null> {
    if (!this.process || !this.process.stdin) {
      return null;
    }

    // 发送获取状态命令
    return new Promise((resolve) => {
      // 简化实现：返回模拟状态
      // 实际实现需要解析 Mindcraft 的输出
      resolve({
        position: { x: 0, y: 64, z: 0 },
        gameMode: 'survival',
        health: 20,
        hunger: 20,
        time: 'day',
        nearbyPlayers: [],
        nearbyEntities: [],
        weather: 'clear',
        dimension: 'overworld',
      });
    });
  }

  /**
   * 执行任务
   */
  async executeTask(profileId: string, task: Omit<Task, 'id' | 'status' | 'createdAt'>): Promise<Task> {
    const newTask: Task = {
      ...task,
      id: crypto.randomUUID(),
      status: 'pending',
      createdAt: new Date().toISOString(),
    };

    if (!this.process || !this.process.stdin) {
      newTask.status = 'failed';
      newTask.error = 'Mindcraft is not running';
      return newTask;
    }

    // 发送任务命令
    const command = JSON.stringify({
      type: 'task',
      profileId,
      task: newTask,
    });

    this.process.stdin.write(command + '\n');

    // 更新运行时状态
    const status = this.runtimeStatus.get(profileId);
    if (status) {
      status.currentTask = { ...newTask, status: 'running' };
      status.lastActivity = new Date().toISOString();
    }

    return newTask;
  }

  /**
   * 注册消息回调
   */
  onMessage(profileId: string, callback: (message: string) => void): void {
    this.messageCallbacks.set(profileId, callback);
  }

  /**
   * 取消消息回调
   */
  offMessage(profileId: string): void {
    this.messageCallbacks.delete(profileId);
  }

  /**
   * 是否正在运行
   */
  isRunning(): boolean {
    return this.process !== null;
  }
}

// 单例实例
let bridgeInstance: MindcraftBridge | null = null;

export function getMindcraftBridge(config?: MindcraftBridgeConfig): MindcraftBridge {
  if (!bridgeInstance && config) {
    bridgeInstance = new MindcraftBridge(config);
  }
  if (!bridgeInstance) {
    throw new Error('MindcraftBridge not initialized. Call with config first.');
  }
  return bridgeInstance;
}