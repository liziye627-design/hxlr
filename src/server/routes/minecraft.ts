import { Router } from 'express';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import {
  getMinecraftBootstrapScriptPath,
  getMinecraftBootstrapStatus,
  ingestMinecraftLog,
  loadMinecraftBootstrapConfig,
  prepareMinecraftBootstrapEnvironment,
  writeRecommendedMinecraftBootstrapConfig,
} from '../services/MinecraftCompanionService.js';

const execFileAsync = promisify(execFile);
const router = Router();

function parseMinecraftBootstrapOutput(stdout: string) {
  const trimmed = stdout.trim();
  if (!trimmed) {
    return null;
  }

  const jsonStart = trimmed.indexOf('{');
  if (jsonStart === -1) {
    throw new Error('minecraft_bootstrap_no_json_output');
  }

  return JSON.parse(trimmed.slice(jsonStart));
}

async function runMinecraftBootstrapScript(options: {
  configPath: string;
  profiles?: string[];
  skipLauncher?: boolean;
  skipBots?: boolean;
  dryRun?: boolean;
}) {
  const config = loadMinecraftBootstrapConfig(options.configPath);
  const scriptPath = getMinecraftBootstrapScriptPath();

  if (!config) {
    return {
      ok: false as const,
      status: 404,
      body: {
        error: 'minecraft_config_missing',
        configPath: options.configPath,
      },
    };
  }

  const profiles = Array.isArray(options.profiles) ? options.profiles.map(String) : [];
  const args = [
    '-NoProfile',
    '-ExecutionPolicy',
    'Bypass',
    '-File',
    scriptPath,
    '-ConfigPath',
    options.configPath,
  ];

  if (profiles.length > 0) {
    args.push('-Profiles');
    args.push(...profiles);
  }

  if (options.skipLauncher) args.push('-SkipLauncher');
  if (options.skipBots) args.push('-SkipBots');
  if (options.dryRun) args.push('-DryRun');

  try {
    const { stdout, stderr } = await execFileAsync('powershell', args, {
      cwd: process.cwd(),
      windowsHide: true,
      maxBuffer: 1024 * 1024,
    });

    return {
      ok: true as const,
      status: 200,
      body: {
        ok: true,
        stderr: stderr || null,
        result: parseMinecraftBootstrapOutput(stdout),
        requestedProfiles: profiles.length > 0 ? profiles : config.defaultProfiles || [],
      },
    };
  } catch (error) {
    const details = error instanceof Error ? error.message : 'minecraft_bootstrap_failed';
    return {
      ok: false as const,
      status: 500,
      body: {
        error: 'minecraft_bootstrap_failed',
        details,
      },
    };
  }
}

router.get('/status', (_req, res) => {
  const status = getMinecraftBootstrapStatus();
  return res.json(status);
});

router.post('/init-config', (req, res) => {
  const configPath = String(req.body?.configPath || process.env.MINECRAFT_LOCAL_CONFIG || 'config/minecraft.local.json');
  const overwrite = Boolean(req.body?.overwrite);
  const result = writeRecommendedMinecraftBootstrapConfig(configPath, { overwrite });

  if (!result.ok) {
    return res.status(409).json(result);
  }

  return res.json(result);
});

router.post('/prepare', (req, res) => {
  const configPath = String(req.body?.configPath || process.env.MINECRAFT_LOCAL_CONFIG || 'config/minecraft.local.json');
  const overwriteConfig = Boolean(req.body?.overwriteConfig);
  const result = prepareMinecraftBootstrapEnvironment(configPath, { overwriteConfig });
  return res.json(result);
});

router.post('/open-mods-folder', async (req, res) => {
  const configPath = String(req.body?.configPath || process.env.MINECRAFT_LOCAL_CONFIG || 'config/minecraft.local.json');
  const prepare = prepareMinecraftBootstrapEnvironment(configPath, { overwriteConfig: false });

  try {
    await execFileAsync('explorer.exe', [prepare.modsDir], {
      cwd: process.cwd(),
      windowsHide: true,
      maxBuffer: 1024 * 256,
    });
  } catch (error) {
    const details = error instanceof Error ? error.message : 'minecraft_open_mods_folder_failed';
    return res.status(500).json({
      error: 'minecraft_open_mods_folder_failed',
      details,
      modsDir: prepare.modsDir,
    });
  }

  return res.json({
    ok: true,
    modsDir: prepare.modsDir,
  });
});

router.post('/bootstrap', async (req, res) => {
  const configPath = String(req.body?.configPath || process.env.MINECRAFT_LOCAL_CONFIG || 'config/minecraft.local.json');
  const profiles = Array.isArray(req.body?.profiles) ? req.body.profiles.map(String) : [];
  const bootstrap = await runMinecraftBootstrapScript({
    configPath,
    profiles,
    skipLauncher: Boolean(req.body?.skipLauncher),
    skipBots: Boolean(req.body?.skipBots),
    dryRun: Boolean(req.body?.dryRun),
  });

  return res.status(bootstrap.status).json(bootstrap.body);
});

router.post('/launch', async (req, res) => {
  const configPath = String(req.body?.configPath || process.env.MINECRAFT_LOCAL_CONFIG || 'config/minecraft.local.json');
  const overwriteConfig = Boolean(req.body?.overwriteConfig);
  const prepare = prepareMinecraftBootstrapEnvironment(configPath, { overwriteConfig });

  if (!prepare.readyToBootstrap) {
    return res.status(409).json({
      error: 'minecraft_launch_blocked',
      prepare,
    });
  }

  const profiles = Array.isArray(req.body?.profiles) ? req.body.profiles.map(String) : [];
  const bootstrap = await runMinecraftBootstrapScript({
    configPath,
    profiles,
    skipLauncher: Boolean(req.body?.skipLauncher),
    skipBots: Boolean(req.body?.skipBots),
    dryRun: Boolean(req.body?.dryRun),
  });

  if (!bootstrap.ok) {
    return res.status(bootstrap.status).json({
      ...bootstrap.body,
      prepare,
    });
  }

  return res.json({
    ok: true,
    prepare,
    bootstrap: bootstrap.body,
  });
});

router.post('/logs/ingest', async (req, res) => {
  const agentId = String(req.body?.agentId || '').trim();
  const rawLog = String(req.body?.rawLog || '');

  if (!agentId) {
    return res.status(400).json({ error: 'agent_id_required' });
  }

  if (!rawLog.trim()) {
    return res.status(400).json({ error: 'raw_log_required' });
  }

  try {
    const result = await ingestMinecraftLog({
      agentId,
      userId: req.body?.userId ? String(req.body.userId) : null,
      sessionId: req.body?.sessionId ? String(req.body.sessionId) : null,
      worldId: req.body?.worldId ? String(req.body.worldId) : null,
      botProfile: req.body?.botProfile ? String(req.body.botProfile) : null,
      rawLog,
      gameMode: 'mc',
    });

    return res.json(result);
  } catch (error) {
    const details = error instanceof Error ? error.message : 'minecraft_log_ingestion_failed';
    return res.status(500).json({
      error: 'minecraft_log_ingestion_failed',
      details,
    });
  }
});

export default router;
