type MinecraftBootstrapPrerequisites = {
  pclExecutableReady: boolean;
  gameRootReady: boolean;
  versionReady: boolean;
  modsDirPinned: boolean;
  modManifestExists: boolean;
  mindcraftRootExists: boolean;
  mindcraftDependenciesInstalled: boolean;
  mindcraftKeysConfigured: boolean;
  botProfilesReady: boolean;
};

type MinecraftManagedModStatus = {
  id: string;
  required: boolean;
  sourcePath: string;
  sourceExists: boolean;
  targetFileName: string;
  targetPath: string;
  targetExists: boolean;
  sha256?: string | null;
};

export interface MinecraftBootstrapStatus {
  configPath: string;
  configExists: boolean;
  scriptPath: string;
  scriptExists: boolean;
  config: {
    pclPath: string;
    gameRoot: string;
    versionName: string;
    modManifestPath: string;
    instanceModsDir: string | null;
    serverHost: string;
    serverPort: number;
    defaultProfiles: string[];
    botCount: number;
  } | null;
  recommendation: {
    prerequisites: MinecraftBootstrapPrerequisites;
    warnings: string[];
  };
  detection: {
    pclConfigPath: string;
    launchRoots: string[];
    selectedGameRoot: string | null;
    versionCandidates: string[];
    selectedVersion: string | null;
    pclExecutableCandidates: Array<{
      path: string;
      exists: boolean;
    }>;
    modsCandidates: Array<{
      path: string;
      source: string;
      exists: boolean;
      score: number;
      versionScoped: boolean;
      reason: string;
    }>;
    resolvedModsDir: string | null;
    warnings: string[];
  };
  managedMods: {
    manifestPath: string;
    manifestExists: boolean;
    modsDir: string | null;
    configuredModsCount: number;
    items: MinecraftManagedModStatus[];
  };
}

export interface MinecraftPrepareResult {
  ok: boolean;
  readyToBootstrap: boolean;
  warnings: string[];
  modsDir: string;
  prerequisites: MinecraftBootstrapPrerequisites;
}

export interface MinecraftBootstrapRunResult {
  ok: boolean;
  dryRun: boolean;
  pclPath: string;
  gameRoot: string;
  versionName: string;
  modsDir: string;
  selectedProfiles: string[];
  launchedPcl: boolean;
  launchedBots: boolean;
  timestamp: string;
}

export interface MinecraftLaunchResponse {
  ok: boolean;
  prepare: MinecraftPrepareResult;
  bootstrap: {
    ok: boolean;
    stderr: string | null;
    requestedProfiles: string[];
    result: MinecraftBootstrapRunResult | null;
  };
}

function getApiBaseUrl() {
  return getApiUrl('').replace(/\/$/, '');
}

async function requestJson<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${getApiBaseUrl()}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers || {}),
    },
    ...init,
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const message =
      (data && typeof data === 'object' && ('details' in data || 'error' in data)
        ? String((data as { details?: string; error?: string }).details || (data as { error?: string }).error)
        : null) || `minecraft_backend_http_${response.status}`;
    throw new Error(message);
  }

  return data as T;
}

export const minecraftBootstrapApi = {
  getStatus() {
    return requestJson<MinecraftBootstrapStatus>('/api/minecraft/status');
  },
  prepare(payload?: { overwriteConfig?: boolean }) {
    return requestJson<MinecraftPrepareResult>('/api/minecraft/prepare', {
      method: 'POST',
      body: JSON.stringify(payload || {}),
    });
  },
  initConfig(payload?: { overwrite?: boolean }) {
    return requestJson<{
      ok: boolean;
      written: boolean;
      reusedExisting: boolean;
      configPath: string;
    }>('/api/minecraft/init-config', {
      method: 'POST',
      body: JSON.stringify(payload || {}),
    });
  },
  openModsFolder(payload?: { configPath?: string }) {
    return requestJson<{ ok: boolean; modsDir: string }>('/api/minecraft/open-mods-folder', {
      method: 'POST',
      body: JSON.stringify(payload || {}),
    });
  },
  launch(payload?: {
    profiles?: string[];
    skipLauncher?: boolean;
    skipBots?: boolean;
    dryRun?: boolean;
    overwriteConfig?: boolean;
  }) {
    return requestJson<MinecraftLaunchResponse>('/api/minecraft/launch', {
      method: 'POST',
      body: JSON.stringify(payload || {}),
    });
  },
  bootstrap(payload?: {
    profiles?: string[];
    skipLauncher?: boolean;
    skipBots?: boolean;
    dryRun?: boolean;
  }) {
    return requestJson<{
      ok: boolean;
      stderr: string | null;
      requestedProfiles: string[];
      result: MinecraftBootstrapRunResult | null;
    }>('/api/minecraft/bootstrap', {
      method: 'POST',
      body: JSON.stringify(payload || {}),
    });
  },
};
import { getApiUrl } from '@/lib/runtimeUrls';
