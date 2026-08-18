/**
 * Minecraft 数字人 API 客户端
 * 前端调用的 API 封装
 */

import type { UnifiedAgentProfile, Task, MinecraftWorldState, AgentRuntimeStatus } from '@/services/minecraft';

const API_BASE = '/api/minecraft';

export interface MinecraftAgentSummary {
  id: string;
  name: string;
  title: string;
  tagline: string;
  previewImage: string;
  type: 'alpha' | 'aqua' | 'shadow' | 'rookie';
  behaviors?: {
    canMine: boolean;
    canBuild: boolean;
    canFight: boolean;
    canFollow: boolean;
    canExplore: boolean;
    preferredTasks: string[];
  };
  scoreSeed: {
    chemistry: number;
    deduction: number;
    clutch: number;
    ambience: number;
  };
}

export interface ServiceStatus {
  initialized: boolean;
  mindcraftInstalled: boolean;
  figuraInstalled: boolean;
  activeAgents: number;
  registeredAgents: number;
}

/**
 * 获取服务状态
 */
export async function getServiceStatus(): Promise<ServiceStatus> {
  const response = await fetch(`${API_BASE}/status`);
  const data = await response.json();
  if (!data.success) throw new Error(data.error);
  return data.data;
}

/**
 * 获取所有支持 MC 的角色
 */
export async function getMinecraftAgents(): Promise<MinecraftAgentSummary[]> {
  const response = await fetch(`${API_BASE}/agents`);
  const data = await response.json();
  if (!data.success) throw new Error(data.error);
  return data.data;
}

/**
 * 获取单个角色详情
 */
export async function getAgentDetails(agentId: string): Promise<{
  registered: boolean;
  active: boolean;
  profile?: UnifiedAgentProfile;
  runtime?: AgentRuntimeStatus;
}> {
  const response = await fetch(`${API_BASE}/agents/${agentId}`);
  const data = await response.json();
  if (!data.success) throw new Error(data.error);
  return data.data;
}

/**
 * 注册所有角色
 */
export async function registerAllAgents(): Promise<{
  registered: string[];
  failed: string[];
  errors: Record<string, string[]>;
}> {
  const response = await fetch(`${API_BASE}/agents/register`, { method: 'POST' });
  const data = await response.json();
  if (!data.success) throw new Error(data.error);
  return data.data;
}

/**
 * 启动角色
 */
export async function startAgent(agentId: string): Promise<{
  success: boolean;
  agentId: string;
  profilePath?: string;
  error?: string;
}> {
  const response = await fetch(`${API_BASE}/agents/${agentId}/start`, { method: 'POST' });
  const data = await response.json();
  return data.data;
}

/**
 * 停止角色
 */
export async function stopAgent(agentId: string): Promise<{ success: boolean; error?: string }> {
  const response = await fetch(`${API_BASE}/agents/${agentId}/stop`, { method: 'POST' });
  const data = await response.json();
  return data.data;
}

/**
 * 发送消息给角色
 */
export async function sendAgentMessage(
  agentId: string,
  message: string
): Promise<{ success: boolean; response?: string; error?: string }> {
  const response = await fetch(`${API_BASE}/agents/${agentId}/message`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message }),
  });
  const data = await response.json();
  return data.data;
}

/**
 * 执行任务
 */
export async function executeAgentTask(
  agentId: string,
  task: {
    type: 'mine' | 'build' | 'fight' | 'follow' | 'collect' | 'explore';
    target?: string;
    quantity?: number;
    position?: { x: number; y: number; z: number };
    priority?: number;
  }
): Promise<Task> {
  const response = await fetch(`${API_BASE}/agents/${agentId}/task`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(task),
  });
  const data = await response.json();
  return data.data;
}

/**
 * 获取世界状态
 */
export async function getWorldState(agentId: string): Promise<MinecraftWorldState | null> {
  const response = await fetch(`${API_BASE}/agents/${agentId}/world`);
  const data = await response.json();
  if (!data.success) throw new Error(data.error);
  return data.data;
}

/**
 * 初始化服务
 */
export async function initializeService(config?: {
  mindcraftRoot?: string;
  minecraftRoot?: string;
  serverHost?: string;
  serverPort?: number;
  minecraftVersion?: string;
}): Promise<{
  success: boolean;
  mindcraft: { installed: boolean; hasNodeModules: boolean; hasKeysConfigured: boolean };
  figura: { installed: boolean; avatarsPath: string | null; installedAvatars: string[] };
  errors: string[];
}> {
  const response = await fetch(`${API_BASE}/initialize`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(config || {}),
  });
  const data = await response.json();
  return data.data;
}

/**
 * 关闭服务
 */
export async function shutdownService(): Promise<void> {
  await fetch(`${API_BASE}/shutdown`, { method: 'POST' });
}