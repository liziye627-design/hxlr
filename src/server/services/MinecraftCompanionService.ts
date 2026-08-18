import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { supabase } from '../supabase.js';

export type MinecraftBootstrapBot = {
  id: string;
  enabled?: boolean;
  displayName?: string;
  workingDir: string;
  command: string;
  arguments: string[];
};

export type MinecraftBootstrapConfig = {
  pclPath: string;
  gameRoot: string;
  versionName: string;
  instanceModsDir?: string;
  modManifestPath: string;
  mindcraftRoot?: string;
  serverHost: string;
  serverPort: number;
  launchWaitSeconds?: number;
  defaultProfiles?: string[];
  bots: MinecraftBootstrapBot[];
};

export type MinecraftNormalizedEvent = {
  type: 'chat' | 'join' | 'leave' | 'death' | 'craft' | 'loot' | 'combat' | 'goal' | 'warning' | 'system';
  speaker?: string;
  content: string;
  importance: number;
  tags: string[];
  tsIndex: number;
};

export type MinecraftLogIngestionInput = {
  agentId: string;
  userId?: string | null;
  sessionId?: string | null;
  worldId?: string | null;
  botProfile?: string | null;
  rawLog: string;
  gameMode?: 'mc';
};

export type MinecraftPathCandidateSource =
  | 'explicit'
  | 'version-local'
  | 'version-nested'
  | 'root-shared';

export type MinecraftPathCandidate = {
  path: string;
  source: MinecraftPathCandidateSource;
  exists: boolean;
  score: number;
  versionScoped: boolean;
  reason: string;
};

export type MinecraftPathDetection = {
  pclConfigPath: string;
  launchRoots: string[];
  selectedGameRoot: string | null;
  versionCandidates: string[];
  selectedVersion: string | null;
  pclExecutableCandidates: Array<{
    path: string;
    exists: boolean;
  }>;
  modsCandidates: MinecraftPathCandidate[];
  resolvedModsDir: string | null;
  warnings: string[];
};

export type MinecraftBootstrapPrerequisites = {
  pclExecutableReady: boolean;
  gameRootReady: boolean;
  versionReady: boolean;
  modsDirPinned: boolean;
  mindcraftRootExists: boolean;
  modManifestExists: boolean;
  mindcraftDependenciesInstalled: boolean;
  mindcraftKeysConfigured: boolean;
  botProfilesReady: boolean;
};

export type MinecraftBootstrapRecommendation = {
  config: MinecraftBootstrapConfig;
  warnings: string[];
  prerequisites: MinecraftBootstrapPrerequisites;
};

export type MinecraftManagedModStatus = {
  id: string;
  required: boolean;
  sourcePath: string;
  sourceExists: boolean;
  targetFileName: string;
  targetPath: string;
  targetExists: boolean;
  sha256?: string | null;
};

export type MinecraftManagedModsStatus = {
  manifestPath: string;
  manifestExists: boolean;
  modsDir: string | null;
  configuredModsCount: number;
  items: MinecraftManagedModStatus[];
};

export type MinecraftPrepareResult = {
  ok: true;
  configPath: string;
  configWritten: boolean;
  configReused: boolean;
  modsDir: string;
  modsDirCreated: boolean;
  modsDirExists: boolean;
  receiptPath: string;
  readyToBootstrap: boolean;
  prerequisites: MinecraftBootstrapPrerequisites;
  warnings: string[];
};

const repoRoot = path.resolve(process.cwd());
const mindcraftProviderKeyMap = {
  openai: 'OPENAI_API_KEY',
  azure: 'OPENAI_API_KEY',
  gemini: 'GEMINI_API_KEY',
  anthropic: 'ANTHROPIC_API_KEY',
  claude: 'ANTHROPIC_API_KEY',
  replicate: 'REPLICATE_API_KEY',
  groq: 'GROQCLOUD_API_KEY',
  groqcloud: 'GROQCLOUD_API_KEY',
  huggingface: 'HUGGINGFACE_API_KEY',
  qwen: 'QWEN_API_KEY',
  xai: 'XAI_API_KEY',
  mistral: 'MISTRAL_API_KEY',
  deepseek: 'DEEPSEEK_API_KEY',
  glhf: 'GHLF_API_KEY',
  hyperbolic: 'HYPERBOLIC_API_KEY',
  novita: 'NOVITA_API_KEY',
  openrouter: 'OPENROUTER_API_KEY',
  cerebras: 'CEREBRAS_API_KEY',
  mercury: 'MERCURY_API_KEY',
} as const;

type MindcraftProfileConfig = {
  name?: string;
  model?: string | { api?: string };
  embedding?: string | { api?: string };
  code_model?: string | { api?: string };
  vision_model?: string | { api?: string };
};

function resolveRepoPath(inputPath: string) {
  if (path.isAbsolute(inputPath)) {
    return inputPath;
  }

  return path.resolve(repoRoot, inputPath);
}

function hasSupabaseServerConfig() {
  return Boolean(process.env.VITE_SUPABASE_URL && process.env.VITE_SUPABASE_ANON_KEY);
}

function tryReadJsonFile<T>(filePath: string) {
  if (!fs.existsSync(filePath)) {
    return null;
  }

  return JSON.parse(fs.readFileSync(filePath, 'utf8')) as T;
}

export function getPclConfigPath() {
  return path.join(os.homedir(), 'AppData', 'Roaming', 'PCLCE', 'config.v1.json');
}

function loadRawPclConfig() {
  const pclConfigPath = getPclConfigPath();
  if (!fs.existsSync(pclConfigPath)) {
    return null;
  }

  return JSON.parse(fs.readFileSync(pclConfigPath, 'utf8')) as {
    LaunchFolders?: string;
  };
}

function parsePclLaunchFolders(rawValue: string | undefined) {
  if (!rawValue) {
    return [];
  }

  return rawValue
    .split('|')
    .map((entry) => entry.trim())
    .filter(Boolean)
    .map((entry) => {
      const segments = entry.split('>');
      return segments[segments.length - 1]?.trim();
    })
    .filter((value): value is string => Boolean(value))
    .map((value) => value.replace(/[\\\/]+$/, ''))
    .map((value) => resolveRepoPath(value));
}

function listMinecraftVersions(gameRoot: string) {
  const versionsDir = path.join(gameRoot, 'versions');
  if (!fs.existsSync(versionsDir)) {
    return [];
  }

  return fs
    .readdirSync(versionsDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();
}

function getPclExecutableCandidates() {
  const home = os.homedir();
  const candidates = [
    path.join(home, 'Desktop', 'PCL2_CE_Release_x64.exe'),
    path.join(home, 'Desktop', 'PCL2.exe'),
    path.join(home, 'Downloads', 'PCL2_CE_Release_x64.exe'),
    path.join(home, 'AppData', 'Local', 'PCLCE', 'PCL2_CE_Release_x64.exe'),
  ];

  return candidates.map((candidate) => ({
    path: candidate,
    exists: fs.existsSync(candidate),
  }));
}

function buildModsCandidates(gameRoot: string, versionName: string | null, explicitModsDir?: string | null) {
  const candidates: MinecraftPathCandidate[] = [];

  if (explicitModsDir) {
    candidates.push({
      path: resolveRepoPath(explicitModsDir),
      source: 'explicit',
      exists: fs.existsSync(resolveRepoPath(explicitModsDir)),
      score: 100,
      versionScoped: true,
      reason: 'Configured explicitly in minecraft.local.json',
    });
  }

  if (versionName) {
    const versionPath = path.join(gameRoot, 'versions', versionName);
    candidates.push({
      path: path.join(versionPath, 'mods'),
      source: 'version-local',
      exists: fs.existsSync(path.join(versionPath, 'mods')),
      score: 90,
      versionScoped: true,
      reason: 'Matches PCL version-isolated instance layout',
    });
    candidates.push({
      path: path.join(versionPath, '.minecraft', 'mods'),
      source: 'version-nested',
      exists: fs.existsSync(path.join(versionPath, '.minecraft', 'mods')),
      score: 70,
      versionScoped: true,
      reason: 'Fallback for nested per-version Minecraft roots',
    });
  }

  candidates.push({
    path: path.join(gameRoot, 'mods'),
    source: 'root-shared',
    exists: fs.existsSync(path.join(gameRoot, 'mods')),
    score: 50,
    versionScoped: false,
    reason: 'Shared root mods directory fallback',
  });

  const deduped = new Map<string, MinecraftPathCandidate>();
  for (const candidate of candidates) {
    if (!deduped.has(candidate.path)) {
      deduped.set(candidate.path, candidate);
    }
  }

  return Array.from(deduped.values()).sort((left, right) => {
    if (right.exists !== left.exists) {
      return Number(right.exists) - Number(left.exists);
    }
    return right.score - left.score;
  });
}

export function detectMinecraftPaths(configPath = getMinecraftConfigPath()): MinecraftPathDetection {
  const config = loadMinecraftBootstrapConfig(configPath);
  const pclConfigPath = getPclConfigPath();
  const pclConfig = loadRawPclConfig();
  const launchRoots = parsePclLaunchFolders(pclConfig?.LaunchFolders);
  const configGameRoot = config?.gameRoot ? resolveRepoPath(config.gameRoot) : null;
  const selectedGameRoot =
    configGameRoot && fs.existsSync(configGameRoot)
      ? configGameRoot
      : launchRoots.find((candidate) => fs.existsSync(candidate)) || null;

  const versionCandidates = selectedGameRoot ? listMinecraftVersions(selectedGameRoot) : [];
  const selectedVersion =
    config?.versionName && versionCandidates.includes(config.versionName)
      ? config.versionName
      : versionCandidates[versionCandidates.length - 1] || null;

  const modsCandidates = selectedGameRoot
    ? buildModsCandidates(selectedGameRoot, selectedVersion, config?.instanceModsDir || null)
    : [];

  const warnings: string[] = [];
  if (!selectedGameRoot) {
    warnings.push('No Minecraft root could be resolved from local config or PCL config.');
  }
  if (selectedGameRoot && versionCandidates.length === 0) {
    warnings.push('Minecraft root exists, but no version directories were found.');
  }
  if (modsCandidates.length > 0 && !modsCandidates.some((candidate) => candidate.exists)) {
    warnings.push('No existing mods directory was found. The recommended candidate will need to be created.');
  }

  return {
    pclConfigPath,
    launchRoots,
    selectedGameRoot,
    versionCandidates,
    selectedVersion,
    pclExecutableCandidates: getPclExecutableCandidates(),
    modsCandidates,
    resolvedModsDir: modsCandidates[0]?.path || null,
    warnings,
  };
}

export function getMinecraftConfigPath() {
  return resolveRepoPath(process.env.MINECRAFT_LOCAL_CONFIG || 'config/minecraft.local.json');
}

export function getMinecraftConfigExamplePath() {
  return resolveRepoPath('config/minecraft.local.example.json');
}

export function getMinecraftBootstrapScriptPath() {
  return resolveRepoPath(process.env.MINECRAFT_BOOTSTRAP_SCRIPT || 'scripts/start-minecraft-companion.ps1');
}

export function getMindcraftSetupScriptPath() {
  return resolveRepoPath(process.env.MINECRAFT_MINDCRAFT_SETUP_SCRIPT || 'scripts/setup-mindcraft.ps1');
}

function getMindcraftKeysPath(resolvedMindcraftRoot: string) {
  return path.join(resolvedMindcraftRoot, 'keys.json');
}

function getMindcraftNodeModulesPath(resolvedMindcraftRoot: string) {
  return path.join(resolvedMindcraftRoot, 'node_modules');
}

function isConfiguredSecretValue(value: unknown) {
  if (typeof value !== 'string') {
    return false;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return false;
  }

  const normalized = trimmed.toLowerCase();
  if (
    normalized === 'your_api_key_here' ||
    normalized === 'replace_me' ||
    normalized === 'changeme' ||
    normalized === '<your-api-key>' ||
    normalized === '<api-key>'
  ) {
    return false;
  }

  return true;
}

function loadMindcraftKeysFile(resolvedMindcraftRoot: string) {
  const keysPath = getMindcraftKeysPath(resolvedMindcraftRoot);
  if (!fs.existsSync(keysPath)) {
    return null;
  }

  try {
    return JSON.parse(fs.readFileSync(keysPath, 'utf8')) as Record<string, string>;
  } catch {
    return null;
  }
}

function getMindcraftProfileProvider(
  modelConfig: MindcraftProfileConfig['model'],
  fallbackProvider?: string,
) {
  if (typeof modelConfig === 'object' && modelConfig && typeof modelConfig.api === 'string') {
    return modelConfig.api.trim().toLowerCase();
  }

  if (typeof modelConfig === 'string') {
    const normalized = modelConfig.trim().toLowerCase();
    if (normalized in mindcraftProviderKeyMap) {
      return normalized;
    }
  }

  return fallbackProvider?.trim().toLowerCase();
}

function getRequiredMindcraftKeyNamesForProfile(profilePath: string) {
  try {
    const profile = JSON.parse(fs.readFileSync(profilePath, 'utf8')) as MindcraftProfileConfig;
    const fallbackProvider =
      typeof profile.name === 'string' && profile.name.trim().toLowerCase() in mindcraftProviderKeyMap
        ? profile.name.trim().toLowerCase()
        : undefined;

    const providers = [
      getMindcraftProfileProvider(profile.model, fallbackProvider),
      getMindcraftProfileProvider(profile.embedding),
      getMindcraftProfileProvider(profile.code_model),
      getMindcraftProfileProvider(profile.vision_model),
    ].filter((provider): provider is keyof typeof mindcraftProviderKeyMap => {
      return Boolean(provider && provider in mindcraftProviderKeyMap);
    });

    return Array.from(new Set(providers)).map((provider) => mindcraftProviderKeyMap[provider]);
  } catch {
    return [] as string[];
  }
}

function hasConfiguredMindcraftKeyValue(
  keyName: string,
  resolvedMindcraftRoot: string,
  loadedKeysFile?: Record<string, string> | null,
) {
  const fileValue = loadedKeysFile?.[keyName];
  if (isConfiguredSecretValue(fileValue)) {
    return true;
  }

  return isConfiguredSecretValue(process.env[keyName]);
}

function resolveBotProfilePaths(bot: MinecraftBootstrapBot, resolvedMindcraftRoot: string) {
  const args = bot.arguments.map(String);
  const profilesFlagIndex = args.findIndex((arg) => arg === '--profiles');
  if (profilesFlagIndex === -1) {
    return [];
  }

  const relativeProfiles: string[] = [];
  for (let index = profilesFlagIndex + 1; index < args.length; index += 1) {
    const currentArg = args[index];
    if (currentArg.startsWith('--')) {
      break;
    }
    relativeProfiles.push(currentArg);
  }

  const workingDir = bot.workingDir ? resolveRepoPath(bot.workingDir) : resolvedMindcraftRoot;
  return relativeProfiles.map((profilePath) => {
    if (path.isAbsolute(profilePath)) {
      return profilePath;
    }
    return path.resolve(workingDir, profilePath);
  });
}

function getEnabledMinecraftBots(config: MinecraftBootstrapConfig) {
  return config.bots.filter((bot) => bot.enabled !== false);
}

export function loadMinecraftBootstrapConfig(configPath = getMinecraftConfigPath()): MinecraftBootstrapConfig | null {
  const resolvedConfigPath = resolveRepoPath(configPath);
  if (!fs.existsSync(resolvedConfigPath)) {
    return null;
  }

  const raw = fs.readFileSync(resolvedConfigPath, 'utf8');
  return JSON.parse(raw) as MinecraftBootstrapConfig;
}

function getMinecraftBootstrapTemplate() {
  const exampleConfig = loadMinecraftBootstrapConfig(getMinecraftConfigExamplePath());
  if (exampleConfig) {
    return exampleConfig;
  }

  return {
    pclPath: path.join(os.homedir(), 'Desktop', 'PCL2_CE_Release_x64.exe'),
    gameRoot: path.join(os.homedir(), 'Downloads', '.minecraft'),
    versionName: '',
    instanceModsDir: '',
    modManifestPath: 'config/minecraft.mod-manifest.example.json',
    mindcraftRoot: 'third_party/mindcraft',
    serverHost: '127.0.0.1',
    serverPort: 55916,
    launchWaitSeconds: 5,
    defaultProfiles: ['ren'],
    bots: [
      {
        id: 'ren',
        enabled: true,
        displayName: 'Ren',
        workingDir: 'third_party/mindcraft',
        command: 'node',
        arguments: ['main.js', '--profiles', 'profiles/companion-ren.json'],
      },
    ],
  } satisfies MinecraftBootstrapConfig;
}

export function buildRecommendedMinecraftBootstrapConfig(
  configPath = getMinecraftConfigPath(),
): MinecraftBootstrapRecommendation {
  const existingConfig = loadMinecraftBootstrapConfig(configPath);
  const detection = detectMinecraftPaths(configPath);
  const template = getMinecraftBootstrapTemplate();

  const detectedPclPath = detection.pclExecutableCandidates.find((candidate) => candidate.exists)?.path || null;
  const config: MinecraftBootstrapConfig = {
    pclPath: existingConfig?.pclPath || detectedPclPath || template.pclPath,
    gameRoot: existingConfig?.gameRoot || detection.selectedGameRoot || template.gameRoot,
    versionName: existingConfig?.versionName || detection.selectedVersion || template.versionName,
    instanceModsDir:
      existingConfig?.instanceModsDir ||
      detection.resolvedModsDir ||
      template.instanceModsDir ||
      path.join(template.gameRoot, 'mods'),
    modManifestPath: existingConfig?.modManifestPath || template.modManifestPath,
    mindcraftRoot: existingConfig?.mindcraftRoot || template.mindcraftRoot,
    serverHost: existingConfig?.serverHost || template.serverHost,
    serverPort: existingConfig?.serverPort || template.serverPort,
    launchWaitSeconds: existingConfig?.launchWaitSeconds || template.launchWaitSeconds || 5,
    defaultProfiles: existingConfig?.defaultProfiles?.length ? existingConfig.defaultProfiles : template.defaultProfiles,
    bots: existingConfig?.bots?.length ? existingConfig.bots : template.bots,
  };

  const resolvedPclPath = resolveRepoPath(config.pclPath);
  const resolvedGameRoot = resolveRepoPath(config.gameRoot);
  const resolvedModsDir = config.instanceModsDir ? resolveRepoPath(config.instanceModsDir) : null;
  const resolvedMindcraftRoot = config.mindcraftRoot ? resolveRepoPath(config.mindcraftRoot) : null;
  const resolvedModManifestPath = resolveRepoPath(config.modManifestPath);
  const resolvedMindcraftNodeModules =
    resolvedMindcraftRoot ? getMindcraftNodeModulesPath(resolvedMindcraftRoot) : null;
  const enabledBots = getEnabledMinecraftBots(config);
  const loadedKeysFile = resolvedMindcraftRoot ? loadMindcraftKeysFile(resolvedMindcraftRoot) : null;
  const resolvedBotProfiles = resolvedMindcraftRoot
    ? enabledBots.flatMap((bot) => resolveBotProfilePaths(bot, resolvedMindcraftRoot))
    : [];
  const botProfilesReady =
    resolvedMindcraftRoot !== null &&
    resolvedBotProfiles.length > 0 &&
    resolvedBotProfiles.every((profilePath) => fs.existsSync(profilePath));
  const requiredMindcraftKeys = Array.from(
    new Set(
      resolvedBotProfiles.flatMap((profilePath) => {
        if (!fs.existsSync(profilePath)) {
          return [];
        }
        return getRequiredMindcraftKeyNamesForProfile(profilePath);
      }),
    ),
  );
  const mindcraftKeysConfigured =
    requiredMindcraftKeys.length > 0 &&
    Boolean(
      resolvedMindcraftRoot &&
        requiredMindcraftKeys.every((keyName) =>
          hasConfiguredMindcraftKeyValue(keyName, resolvedMindcraftRoot, loadedKeysFile),
        ),
    );

  const prerequisites: MinecraftBootstrapPrerequisites = {
    pclExecutableReady: fs.existsSync(resolvedPclPath),
    gameRootReady: fs.existsSync(resolvedGameRoot),
    versionReady: Boolean(config.versionName),
    modsDirPinned: Boolean(resolvedModsDir),
    mindcraftRootExists: Boolean(resolvedMindcraftRoot && fs.existsSync(resolvedMindcraftRoot)),
    modManifestExists: fs.existsSync(resolvedModManifestPath),
    mindcraftDependenciesInstalled: Boolean(resolvedMindcraftNodeModules && fs.existsSync(resolvedMindcraftNodeModules)),
    mindcraftKeysConfigured,
    botProfilesReady,
  };

  const warnings = [...detection.warnings];
  if (!prerequisites.mindcraftRootExists) {
    warnings.push(`Mindcraft checkout is missing at ${resolvedMindcraftRoot ?? 'the configured mindcraftRoot'}.`);
  }
  if (!prerequisites.modManifestExists) {
    warnings.push(`Mod manifest is missing at ${resolvedModManifestPath}.`);
  }
  if (!prerequisites.mindcraftDependenciesInstalled) {
    warnings.push(`Mindcraft dependencies are missing. Run the setup flow in ${getMindcraftSetupScriptPath()}.`);
  }
  if (!prerequisites.mindcraftKeysConfigured) {
    const keySuffix = requiredMindcraftKeys.length > 0 ? ` Required keys: ${requiredMindcraftKeys.join(', ')}.` : '';
    warnings.push(`Mindcraft API keys are not configured for the enabled bot profiles.${keySuffix}`);
  }
  if (!prerequisites.botProfilesReady) {
    warnings.push('At least one enabled bot points to a missing Mindcraft profile file.');
  }

  return {
    config,
    warnings,
    prerequisites,
  };
}

export function writeRecommendedMinecraftBootstrapConfig(
  configPath = getMinecraftConfigPath(),
  options?: { overwrite?: boolean },
) {
  const resolvedConfigPath = resolveRepoPath(configPath);
  const recommendation = buildRecommendedMinecraftBootstrapConfig(configPath);
  if (fs.existsSync(resolvedConfigPath) && !options?.overwrite) {
    return {
      ok: true as const,
      written: false as const,
      reusedExisting: true as const,
      configPath: resolvedConfigPath,
      recommendation,
    };
  }

  fs.mkdirSync(path.dirname(resolvedConfigPath), { recursive: true });
  fs.writeFileSync(resolvedConfigPath, `${JSON.stringify(recommendation.config, null, 2)}\n`, 'utf8');

  return {
    ok: true as const,
    written: true as const,
    reusedExisting: false as const,
    configPath: resolvedConfigPath,
    recommendation,
  };
}

export function prepareMinecraftBootstrapEnvironment(
  configPath = getMinecraftConfigPath(),
  options?: { overwriteConfig?: boolean },
): MinecraftPrepareResult {
  const configWriteResult = writeRecommendedMinecraftBootstrapConfig(configPath, {
    overwrite: options?.overwriteConfig,
  });
  const recommendation = configWriteResult.recommendation;
  const resolvedConfigPath = resolveRepoPath(configPath);
  const resolvedModsDir = resolveRepoPath(recommendation.config.instanceModsDir || recommendation.config.gameRoot);
  const modsDirExistedBefore = fs.existsSync(resolvedModsDir);
  fs.mkdirSync(resolvedModsDir, { recursive: true });

  const resolvedGameRoot = resolveRepoPath(recommendation.config.gameRoot);
  const receiptRoot = path.join(resolvedGameRoot, '.codex-minecraft-bootstrap');
  fs.mkdirSync(receiptRoot, { recursive: true });
  const receiptPath = path.join(receiptRoot, 'prepare.json');

  const updatedPrerequisites: MinecraftBootstrapPrerequisites = {
    ...recommendation.prerequisites,
    modsDirPinned: true,
  };

  const readyToBootstrap =
    updatedPrerequisites.pclExecutableReady &&
    updatedPrerequisites.gameRootReady &&
    updatedPrerequisites.versionReady &&
    updatedPrerequisites.modsDirPinned &&
    updatedPrerequisites.modManifestExists &&
    updatedPrerequisites.mindcraftRootExists &&
    updatedPrerequisites.mindcraftDependenciesInstalled &&
    updatedPrerequisites.mindcraftKeysConfigured &&
    updatedPrerequisites.botProfilesReady;

  const result: MinecraftPrepareResult = {
    ok: true,
    configPath: resolvedConfigPath,
    configWritten: configWriteResult.written,
    configReused: configWriteResult.reusedExisting,
    modsDir: resolvedModsDir,
    modsDirCreated: !modsDirExistedBefore,
    modsDirExists: fs.existsSync(resolvedModsDir),
    receiptPath,
    readyToBootstrap,
    prerequisites: updatedPrerequisites,
    warnings: recommendation.warnings,
  };

  fs.writeFileSync(receiptPath, `${JSON.stringify(result, null, 2)}\n`, 'utf8');
  return result;
}

export function getMinecraftBootstrapStatus(configPath = getMinecraftConfigPath()) {
  const scriptPath = getMinecraftBootstrapScriptPath();
  const config = loadMinecraftBootstrapConfig(configPath);
  const resolvedConfigPath = resolveRepoPath(configPath);
  const detection = detectMinecraftPaths(configPath);
  const recommendation = buildRecommendedMinecraftBootstrapConfig(configPath);
  const resolvedManifestPath = resolveRepoPath(recommendation.config.modManifestPath);
  const manifest = tryReadJsonFile<{ mods?: Array<{ id?: string; source?: string; targetFileName?: string; sha256?: string; required?: boolean }> }>(
    resolvedManifestPath,
  );
  const resolvedModsDir = recommendation.config.instanceModsDir
    ? resolveRepoPath(recommendation.config.instanceModsDir)
    : detection.resolvedModsDir;
  const managedMods: MinecraftManagedModsStatus = {
    manifestPath: resolvedManifestPath,
    manifestExists: fs.existsSync(resolvedManifestPath),
    modsDir: resolvedModsDir,
    configuredModsCount: Array.isArray(manifest?.mods) ? manifest!.mods!.length : 0,
    items: Array.isArray(manifest?.mods)
      ? manifest!.mods!.map((mod, index) => {
          const sourcePath = resolveRepoPath(String(mod.source || ''));
          const targetFileName = String(mod.targetFileName || path.basename(sourcePath || `mod-${index}.jar`));
          const targetPath = resolvedModsDir ? path.join(resolvedModsDir, targetFileName) : targetFileName;
          return {
            id: String(mod.id || `mod-${index + 1}`),
            required: mod.required !== false,
            sourcePath,
            sourceExists: Boolean(mod.source) && fs.existsSync(sourcePath),
            targetFileName,
            targetPath,
            targetExists: resolvedModsDir ? fs.existsSync(targetPath) : false,
            sha256: mod.sha256 || null,
          };
        })
      : [],
  };

  return {
    configPath: resolvedConfigPath,
    configExists: fs.existsSync(resolvedConfigPath),
    scriptPath,
    scriptExists: fs.existsSync(scriptPath),
    config: config
      ? {
          pclPath: resolveRepoPath(config.pclPath),
          gameRoot: resolveRepoPath(config.gameRoot),
          versionName: config.versionName,
          modManifestPath: resolveRepoPath(config.modManifestPath),
          instanceModsDir: config.instanceModsDir ? resolveRepoPath(config.instanceModsDir) : null,
          serverHost: config.serverHost,
          serverPort: config.serverPort,
          defaultProfiles: config.defaultProfiles || [],
          botCount: config.bots.length,
        }
      : null,
    detection,
    managedMods,
    recommendation: {
      config: recommendation.config,
      prerequisites: recommendation.prerequisites,
      warnings: recommendation.warnings,
    },
  };
}

function normalizeLine(rawLine: string) {
  return rawLine.replace(/^\[[^\]]+\]\s*/, '').trim();
}

export function normalizeMinecraftLog(rawLog: string): MinecraftNormalizedEvent[] {
  const lines = rawLog
    .split(/\r?\n/)
    .map((line) => normalizeLine(line))
    .filter(Boolean);

  return lines.map((line, index) => {
    const joinMatch = line.match(/^(.+?) joined the game$/i);
    if (joinMatch) {
      return { type: 'join', speaker: joinMatch[1], content: line, importance: 2, tags: ['presence'], tsIndex: index };
    }

    const leaveMatch = line.match(/^(.+?) left the game$/i);
    if (leaveMatch) {
      return { type: 'leave', speaker: leaveMatch[1], content: line, importance: 2, tags: ['presence'], tsIndex: index };
    }

    const deathMatch = line.match(/^(.+?) (?:was slain by|died|blew up|was shot by|fell from)/i);
    if (deathMatch) {
      return { type: 'death', speaker: deathMatch[1], content: line, importance: 5, tags: ['failure', 'combat'], tsIndex: index };
    }

    const craftMatch = line.match(/^(.+?) crafted (.+)$/i);
    if (craftMatch) {
      return { type: 'craft', speaker: craftMatch[1], content: line, importance: 4, tags: ['resource', 'craft'], tsIndex: index };
    }

    const lootMatch = line.match(/^(.+?) (?:picked up|collected|mined) (.+)$/i);
    if (lootMatch) {
      return { type: 'loot', speaker: lootMatch[1], content: line, importance: 3, tags: ['resource'], tsIndex: index };
    }

    const combatMatch = line.match(/^(.+?) (?:attacked|hit|damaged) (.+)$/i);
    if (combatMatch) {
      return { type: 'combat', speaker: combatMatch[1], content: line, importance: 4, tags: ['combat'], tsIndex: index };
    }

    const goalMatch = line.match(/(?:goal|task|objective)\s*[:\-]\s*(.+)$/i);
    if (goalMatch) {
      return { type: 'goal', content: line, importance: 5, tags: ['goal'], tsIndex: index };
    }

    const chatMatch = line.match(/^<([^>]+)>\s+(.+)$/);
    if (chatMatch) {
      const content = chatMatch[2];
      const importance = /(help|need|where|danger|come|watch|food|iron|diamond|bed|follow)/i.test(content) ? 4 : 2;
      return { type: 'chat', speaker: chatMatch[1], content, importance, tags: ['chat'], tsIndex: index };
    }

    if (/(warn|error|failed|exception)/i.test(line)) {
      return { type: 'warning', content: line, importance: 4, tags: ['warning'], tsIndex: index };
    }

    return { type: 'system', content: line, importance: 1, tags: ['system'], tsIndex: index };
  });
}

export function selectInterestingMinecraftEvents(events: MinecraftNormalizedEvent[]) {
  return events.filter((event) => event.importance >= 3 || event.type === 'goal');
}

export function buildMinecraftMemoryChunks(events: MinecraftNormalizedEvent[]) {
  const topEvents = events
    .slice()
    .sort((left, right) => right.importance - left.importance || left.tsIndex - right.tsIndex)
    .slice(0, 10);

  const mcEvents = topEvents.map((event) => ({
    sourceType: 'mc_event' as const,
    content: event.speaker ? `${event.speaker}: ${event.content}` : event.content,
    metadata: {
      eventType: event.type,
      importance: event.importance,
      tags: event.tags,
      speaker: event.speaker ?? null,
    },
  }));

  const summary = topEvents
    .map((event) => {
      if (event.type === 'goal') return `Goal locked: ${event.content}`;
      if (event.type === 'death') return `Critical failure: ${event.content}`;
      if (event.type === 'craft') return `Resource progression: ${event.content}`;
      if (event.type === 'chat') return `Coordination moment: ${event.speaker}: ${event.content}`;
      return event.content;
    })
    .slice(0, 5)
    .join('\n');

  const lessonCandidates = topEvents
    .filter((event) => event.type === 'death' || event.type === 'warning' || event.type === 'goal')
    .map((event) => event.content);

  const summaryChunks = summary
    ? [
        {
          sourceType: 'mc_summary' as const,
          content: summary,
          metadata: {
            retainedEvents: topEvents.length,
          },
        },
      ]
    : [];

  const lessonChunks = lessonCandidates.length
    ? [
        {
          sourceType: 'mc_lesson' as const,
          content: lessonCandidates.slice(0, 3).join('\n'),
          metadata: {
            lessonCount: lessonCandidates.length,
          },
        },
      ]
    : [];

  return [...mcEvents, ...summaryChunks, ...lessonChunks];
}

export async function ingestMinecraftLog(input: MinecraftLogIngestionInput) {
  const normalized = normalizeMinecraftLog(input.rawLog);
  const filtered = selectInterestingMinecraftEvents(normalized);
  const memoryChunks = buildMinecraftMemoryChunks(filtered);

  const result = {
    ok: true,
    rawLineCount: input.rawLog.split(/\r?\n/).filter(Boolean).length,
    normalizedCount: normalized.length,
    retainedCount: filtered.length,
    memoryChunkCount: memoryChunks.length,
    persisted: false,
  };

  if (!hasSupabaseServerConfig()) {
    return {
      ...result,
      memoryChunks,
      events: filtered,
    };
  }

  try {
    const ingestionId = crypto.randomUUID();

    const ingestionInsert = await supabase.from('minecraft_log_ingestions').insert({
      id: ingestionId,
      agent_id: input.agentId,
      user_id: input.userId || null,
      session_id: input.sessionId || null,
      world_id: input.worldId || null,
      bot_profile: input.botProfile || null,
      raw_line_count: result.rawLineCount,
      retained_event_count: result.retainedCount,
      raw_log: input.rawLog,
    });
    if (ingestionInsert.error) {
      throw ingestionInsert.error;
    }

    if (filtered.length > 0) {
      const eventsInsert = await supabase.from('minecraft_session_events').insert(
        filtered.map((event) => ({
          ingestion_id: ingestionId,
          agent_id: input.agentId,
          user_id: input.userId || null,
          session_id: input.sessionId || null,
          world_id: input.worldId || null,
          bot_profile: input.botProfile || null,
          event_type: event.type,
          content: event.content,
          importance: event.importance,
          speaker: event.speaker || null,
          event_tags: event.tags,
          metadata: {
            tsIndex: event.tsIndex,
          },
        })),
      );
      if (eventsInsert.error) {
        throw eventsInsert.error;
      }
    }

    if (memoryChunks.length > 0) {
      const memoryInsert = await supabase.from('agent_memory_chunks').insert(
        memoryChunks.map((chunk) => ({
          agent_id: input.agentId,
          user_id: input.userId || null,
          session_id: input.sessionId || null,
          game_mode: input.gameMode || 'mc',
          source_type: chunk.sourceType,
          content: chunk.content,
          metadata: {
            worldId: input.worldId || null,
            botProfile: input.botProfile || null,
            ...chunk.metadata,
          },
        })),
      );
      if (memoryInsert.error) {
        throw memoryInsert.error;
      }
    }

    return {
      ...result,
      persisted: true,
      ingestionId,
    };
  } catch (error) {
    const persistenceError = error instanceof Error ? error.message : 'minecraft_memory_persist_failed';
    return {
      ...result,
      persisted: false,
      persistenceError,
      memoryChunks,
      events: filtered,
    };
  }
}
