/**
 * Minecraft 数字人统一服务
 * 融合 Mindcraft (AI核心) + Figura (外观) + 任务执行
 */

import { MindcraftBridge, getMindcraftBridge } from './MindcraftBridge';
import { FiguraIntegration, getFiguraIntegration } from './FiguraIntegration';
import type {
  UnifiedAgentProfile,
  Task,
  TaskStatus,
  AgentRuntimeStatus,
  MinecraftWorldState,
  MindcraftBridgeConfig,
} from './types';

export interface DigitalHumanServiceConfig {
  /** Mindcraft 安装路径 */
  mindcraftRoot: string;
  /** Minecraft 根目录 */
  minecraftRoot: string;
  /** 服务器地址 */
  serverHost: string;
  /** 服务器端口 */
  serverPort: number;
  /** Minecraft 版本 */
  minecraftVersion: string;
}

export interface ServiceStatus {
  initialized: boolean;
  mindcraftInstalled: boolean;
  figuraInstalled: boolean;
  activeAgents: number;
  registeredAgents: number;
}

export interface AgentStartResult {
  success: boolean;
  agentId: string;
  error?: string;
  profilePath?: string;
}

/**
 * Minecraft 数字人服务
 */
export class MinecraftDigitalHumanService {
  private mindcraft: MindcraftBridge;
  private figura: FiguraIntegration;
  private config: DigitalHumanServiceConfig;
  private profiles: Map<string, UnifiedAgentProfile> = new Map();
  private activeAgents: Set<string> = new Set();

  constructor(config: DigitalHumanServiceConfig) {
    this.config = config;

    // 初始化子服务
    this.mindcraft = getMindcraftBridge({
      mindcraftRoot: config.mindcraftRoot,
      serverHost: config.serverHost,
      serverPort: config.serverPort,
      minecraftVersion: config.minecraftVersion,
    });

    this.figura = getFiguraIntegration(config.minecraftRoot);
  }

  /**
   * 初始化服务
   */
  async initialize(): Promise<{
    success: boolean;
    mindcraft: Awaited<ReturnType<MindcraftBridge['checkInstallation']>>;
    figura: Awaited<ReturnType<FiguraIntegration['checkInstallation']>>;
    errors: string[];
  }> {
    const errors: string[] = [];

    // 检查 Mindcraft 安装
    const mindcraftStatus = await this.mindcraft.checkInstallation();

    if (!mindcraftStatus.installed) {
      errors.push('Mindcraft is not installed');
    } else if (!mindcraftStatus.hasNodeModules) {
      errors.push('Mindcraft dependencies are not installed');
    }

    // 检查 Figura 安装
    const figuraStatus = await this.figura.checkInstallation();

    // 安装 Mindcraft 依赖
    if (mindcraftStatus.installed && !mindcraftStatus.hasNodeModules) {
      try {
        await this.mindcraft.installDependencies();
      } catch (error) {
        errors.push(`Failed to install Mindcraft dependencies: ${error}`);
      }
    }

    return {
      success: errors.length === 0,
      mindcraft: mindcraftStatus,
      figura: figuraStatus,
      errors,
    };
  }

  /**
   * 注册角色
   */
  async registerAgent(profile: UnifiedAgentProfile): Promise<{
    success: boolean;
    agentId: string;
    profilePath: string | null;
    figuraResult: Awaited<ReturnType<FiguraIntegration['installAvatar']>> | null;
    errors: string[];
  }> {
    const errors: string[] = [];
    let profilePath: string | null = null;
    let figuraResult: Awaited<ReturnType<FiguraIntegration['installAvatar']>> | null = null;

    // 生成 Mindcraft Profile
    try {
      profilePath = await this.mindcraft.generateProfile(profile);
    } catch (error) {
      errors.push(`Failed to generate Mindcraft profile: ${error}`);
    }

    // 安装 Figura 外观
    if (profile.figura) {
      try {
        figuraResult = await this.figura.installAvatar(profile.id, profile.figura);
        if (!figuraResult.success) {
          errors.push(...figuraResult.errors);
        }
      } catch (error) {
        errors.push(`Failed to install Figura avatar: ${error}`);
      }
    }

    // 注册到内存
    this.profiles.set(profile.id, profile);

    return {
      success: errors.length === 0,
      agentId: profile.id,
      profilePath,
      figuraResult,
      errors,
    };
  }

  /**
   * 批量注册角色
   */
  async registerAgents(profiles: UnifiedAgentProfile[]): Promise<{
    success: boolean;
    registered: string[];
    failed: string[];
    errors: Record<string, string[]>;
  }> {
    const registered: string[] = [];
    const failed: string[] = [];
    const errors: Record<string, string[]> = {};

    for (const profile of profiles) {
      const result = await this.registerAgent(profile);
      if (result.success) {
        registered.push(profile.id);
      } else {
        failed.push(profile.id);
        errors[profile.id] = result.errors;
      }
    }

    return {
      success: failed.length === 0,
      registered,
      failed,
      errors,
    };
  }

  /**
   * 启动角色
   */
  async startAgent(agentId: string): Promise<AgentStartResult> {
    const profile = this.profiles.get(agentId);
    if (!profile) {
      return {
        success: false,
        agentId,
        error: `Agent ${agentId} is not registered`,
      };
    }

    try {
      // 如果是第一个角色，启动 Mindcraft
      if (this.activeAgents.size === 0) {
        await this.mindcraft.start([agentId]);
      }

      this.activeAgents.add(agentId);

      return {
        success: true,
        agentId,
        profilePath: `profiles/${agentId}.json`,
      };
    } catch (error) {
      return {
        success: false,
        agentId,
        error: `Failed to start agent: ${error}`,
      };
    }
  }

  /**
   * 停止角色
   */
  async stopAgent(agentId: string): Promise<{ success: boolean; error?: string }> {
    if (!this.activeAgents.has(agentId)) {
      return {
        success: false,
        error: `Agent ${agentId} is not active`,
      };
    }

    this.activeAgents.delete(agentId);

    // 如果没有活跃角色，停止 Mindcraft
    if (this.activeAgents.size === 0) {
      await this.mindcraft.stop();
    }

    return { success: true };
  }

  /**
   * 发送消息
   */
  async sendMessage(agentId: string, message: string): Promise<{
    success: boolean;
    response?: string;
    error?: string;
  }> {
    if (!this.activeAgents.has(agentId)) {
      return {
        success: false,
        error: `Agent ${agentId} is not active`,
      };
    }

    try {
      const response = await this.mindcraft.sendMessage(agentId, message);
      return {
        success: true,
        response,
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to send message: ${error}`,
      };
    }
  }

  /**
   * 执行任务
   */
  async executeTask(
    agentId: string,
    task: Omit<Task, 'id' | 'status' | 'createdAt'>
  ): Promise<Task> {
    if (!this.activeAgents.has(agentId)) {
      const failedTask: Task = {
        ...task,
        id: crypto.randomUUID(),
        status: 'failed' as TaskStatus,
        createdAt: new Date().toISOString(),
        error: `Agent ${agentId} is not active`,
      };
      return failedTask;
    }

    return this.mindcraft.executeTask(agentId, task);
  }

  /**
   * 获取角色状态
   */
  getAgentStatus(agentId: string): {
    registered: boolean;
    active: boolean;
    profile?: UnifiedAgentProfile;
    runtime?: AgentRuntimeStatus;
  } {
    return {
      registered: this.profiles.has(agentId),
      active: this.activeAgents.has(agentId),
      profile: this.profiles.get(agentId),
      runtime: this.mindcraft.getRuntimeStatus(agentId),
    };
  }

  /**
   * 获取所有角色状态
   */
  getAllAgentStatus(): Array<{
    agentId: string;
    registered: boolean;
    active: boolean;
  }> {
    const result: Array<{ agentId: string; registered: boolean; active: boolean }> = [];

    for (const [agentId] of this.profiles) {
      result.push({
        agentId,
        registered: true,
        active: this.activeAgents.has(agentId),
      });
    }

    return result;
  }

  /**
   * 获取世界状态
   */
  async getWorldState(agentId: string): Promise<MinecraftWorldState | null> {
    return this.mindcraft.getWorldState(agentId);
  }

  /**
   * 获取服务状态
   */
  getServiceStatus(): ServiceStatus {
    return {
      initialized: true,
      mindcraftInstalled: this.mindcraft.isRunning(),
      figuraInstalled: true, // 需要实际检查
      activeAgents: this.activeAgents.size,
      registeredAgents: this.profiles.size,
    };
  }

  /**
   * 获取角色 Profile
   */
  getProfile(agentId: string): UnifiedAgentProfile | undefined {
    return this.profiles.get(agentId);
  }

  /**
   * 获取所有角色 Profiles
   */
  getAllProfiles(): UnifiedAgentProfile[] {
    return Array.from(this.profiles.values());
  }

  /**
   * 注销角色
   */
  async unregisterAgent(agentId: string): Promise<{ success: boolean; error?: string }> {
    // 先停止
    if (this.activeAgents.has(agentId)) {
      await this.stopAgent(agentId);
    }

    // 删除 Profile
    this.profiles.delete(agentId);

    // 卸载 Figura 外观
    await this.figura.uninstallAvatar(agentId);

    return { success: true };
  }

  /**
   * 关闭服务
   */
  async shutdown(): Promise<void> {
    // 停止所有角色
    await this.mindcraft.stop();

    // 清空状态
    this.activeAgents.clear();
  }
}

// 单例实例
let serviceInstance: MinecraftDigitalHumanService | null = null;

/**
 * 获取数字人服务实例
 */
export function getDigitalHumanService(
  config?: DigitalHumanServiceConfig
): MinecraftDigitalHumanService {
  if (!serviceInstance && config) {
    serviceInstance = new MinecraftDigitalHumanService(config);
  }
  if (!serviceInstance) {
    throw new Error(
      'MinecraftDigitalHumanService not initialized. Call with config first.'
    );
  }
  return serviceInstance;
}

/**
 * 初始化数字人服务
 */
export async function initializeDigitalHumanService(
  config: DigitalHumanServiceConfig
): Promise<MinecraftDigitalHumanService> {
  const service = getDigitalHumanService(config);
  await service.initialize();
  return service;
}