import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import {
  getMinecraftBootstrapScriptPath,
  getMinecraftConfigPath,
  prepareMinecraftBootstrapEnvironment,
} from '../src/server/services/MinecraftCompanionService.ts';

const execFileAsync = promisify(execFile);

function parseJsonFromStdout(stdout: string) {
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

function parseArgs(argv: string[]) {
  const parsed = {
    configPath: getMinecraftConfigPath(),
    overwriteConfig: false,
    skipLauncher: false,
    skipBots: false,
    dryRun: false,
    profiles: [] as string[],
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === '--overwrite-config') {
      parsed.overwriteConfig = true;
      continue;
    }
    if (arg === '--skip-launcher') {
      parsed.skipLauncher = true;
      continue;
    }
    if (arg === '--skip-bots') {
      parsed.skipBots = true;
      continue;
    }
    if (arg === '--dry-run') {
      parsed.dryRun = true;
      continue;
    }
    if (arg === '--config' && argv[index + 1]) {
      parsed.configPath = argv[index + 1];
      index += 1;
      continue;
    }
    if (arg === '--profiles' && argv[index + 1]) {
      parsed.profiles = argv[index + 1]
        .split(',')
        .map((value) => value.trim())
        .filter(Boolean);
      index += 1;
    }
  }

  return parsed;
}

const options = parseArgs(process.argv.slice(2));
const prepare = prepareMinecraftBootstrapEnvironment(options.configPath, {
  overwriteConfig: options.overwriteConfig,
});

if (!prepare.readyToBootstrap) {
  process.stdout.write(
    `${JSON.stringify(
      {
        ok: false,
        error: 'minecraft_launch_blocked',
        prepare,
      },
      null,
      2,
    )}\n`,
  );
  process.exitCode = 1;
} else {
  const args = [
    '-NoProfile',
    '-ExecutionPolicy',
    'Bypass',
    '-File',
    getMinecraftBootstrapScriptPath(),
    '-ConfigPath',
    options.configPath,
  ];

  if (options.profiles.length > 0) {
    args.push('-Profiles', ...options.profiles);
  }
  if (options.skipLauncher) args.push('-SkipLauncher');
  if (options.skipBots) args.push('-SkipBots');
  if (options.dryRun) args.push('-DryRun');

  const { stdout, stderr } = await execFileAsync('powershell', args, {
    cwd: process.cwd(),
    windowsHide: true,
    maxBuffer: 1024 * 1024,
  });

  process.stdout.write(
    `${JSON.stringify(
      {
        ok: true,
        prepare,
        stderr: stderr || null,
        bootstrap: stdout ? parseJsonFromStdout(stdout) : null,
      },
      null,
      2,
    )}\n`,
  );
}
