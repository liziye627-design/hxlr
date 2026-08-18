/**
 * Minecraft 数字人 API 路由
 */

import { Router, type Request, type Response } from 'express';
import {
  getDigitalHumanService,
  convertAllProfiles,
  getMinecraftCapableProfiles,
  type UnifiedAgentProfile,
  type Task,
} from '@/services/minecraft';
import { AGENT_SHOWROOM } from '@/config/agentRoster';

const router = Router();

/**
 * GET /api/minecraft/status
 * 获取服务状态
 */
router.get('/status', async (req: Request, res: Response) => {
  try {
    const service = getDigitalHumanService();
    const status = service.getServiceStatus();
    res.json({
      success: true,
      data: status,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Service not initialized',
    });
  }
});

/**
 * GET /api/minecraft/agents
 * 获取所有支持 MC 模式的角色
 */
router.get('/agents', async (req: Request, res: Response) => {
  try {
    const profiles = getMinecraftCapableProfiles();
    res.json({
      success: true,
      data: profiles.map((p) => ({
        id: p.id,
        name: p.name,
        title: p.title,
        tagline: p.tagline,
        previewImage: p.previewImage,
        type: p.type,
        behaviors: p.behaviors,
        scoreSeed: p.scoreSeed,
      })),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/minecraft/agents/:agentId
 * 获取单个角色详情
 */
router.get('/agents/:agentId', async (req: Request, res: Response) => {
  try {
    const service = getDigitalHumanService();
    const status = service.getAgentStatus(req.params.agentId);

    if (!status.registered) {
      return res.status(404).json({
        success: false,
        error: 'Agent not found',
      });
    }

    res.json({
      success: true,
      data: status,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * POST /api/minecraft/agents/register
 * 注册所有角色
 */
router.post('/agents/register', async (req: Request, res: Response) => {
  try {
    const service = getDigitalHumanService();
    const profiles = convertAllProfiles();
    const result = await service.registerAgents(profiles);

    res.json({
      success: result.success,
      data: {
        registered: result.registered,
        failed: result.failed,
        errors: result.errors,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * POST /api/minecraft/agents/:agentId/start
 * 启动角色
 */
router.post('/agents/:agentId/start', async (req: Request, res: Response) => {
  try {
    const service = getDigitalHumanService();
    const result = await service.startAgent(req.params.agentId);

    res.json({
      success: result.success,
      data: result,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * POST /api/minecraft/agents/:agentId/stop
 * 停止角色
 */
router.post('/agents/:agentId/stop', async (req: Request, res: Response) => {
  try {
    const service = getDigitalHumanService();
    const result = await service.stopAgent(req.params.agentId);

    res.json({
      success: result.success,
      data: result,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * POST /api/minecraft/agents/:agentId/message
 * 发送消息给角色
 */
router.post('/agents/:agentId/message', async (req: Request, res: Response) => {
  try {
    const { message } = req.body;
    if (!message) {
      return res.status(400).json({
        success: false,
        error: 'Message is required',
      });
    }

    const service = getDigitalHumanService();
    const result = await service.sendMessage(req.params.agentId, message);

    res.json({
      success: result.success,
      data: result,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * POST /api/minecraft/agents/:agentId/task
 * 执行任务
 */
router.post('/agents/:agentId/task', async (req: Request, res: Response) => {
  try {
    const { type, target, quantity, position, priority } = req.body;

    if (!type) {
      return res.status(400).json({
        success: false,
        error: 'Task type is required',
      });
    }

    const service = getDigitalHumanService();
    const task = await service.executeTask(req.params.agentId, {
      type,
      target,
      quantity,
      position,
      priority: priority ?? 1,
    });

    res.json({
      success: task.status !== 'failed',
      data: task,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/minecraft/agents/:agentId/world
 * 获取世界状态
 */
router.get('/agents/:agentId/world', async (req: Request, res: Response) => {
  try {
    const service = getDigitalHumanService();
    const worldState = await service.getWorldState(req.params.agentId);

    res.json({
      success: true,
      data: worldState,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * POST /api/minecraft/initialize
 * 初始化服务
 */
router.post('/initialize', async (req: Request, res: Response) => {
  try {
    const { mindcraftRoot, minecraftRoot, serverHost, serverPort, minecraftVersion } = req.body;

    const service = getDigitalHumanService({
      mindcraftRoot: mindcraftRoot || 'third_party/mindcraft',
      minecraftRoot: minecraftRoot || process.env.MINECRAFT_ROOT || '',
      serverHost: serverHost || '127.0.0.1',
      serverPort: serverPort || 55916,
      minecraftVersion: minecraftVersion || '1.20.4',
    });

    const result = await service.initialize();

    res.json({
      success: result.success,
      data: result,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * POST /api/minecraft/shutdown
 * 关闭服务
 */
router.post('/shutdown', async (req: Request, res: Response) => {
  try {
    const service = getDigitalHumanService();
    await service.shutdown();

    res.json({
      success: true,
      message: 'Service shutdown successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;