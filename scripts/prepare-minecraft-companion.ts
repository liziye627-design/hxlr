import {
  getMinecraftConfigPath,
  prepareMinecraftBootstrapEnvironment,
} from '../src/server/services/MinecraftCompanionService.ts';

function parseArgs(argv: string[]) {
  const parsed = {
    configPath: getMinecraftConfigPath(),
    overwriteConfig: false,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === '--overwrite-config') {
      parsed.overwriteConfig = true;
      continue;
    }

    if (arg === '--config' && argv[index + 1]) {
      parsed.configPath = argv[index + 1];
      index += 1;
    }
  }

  return parsed;
}

const options = parseArgs(process.argv.slice(2));
const result = prepareMinecraftBootstrapEnvironment(options.configPath, {
  overwriteConfig: options.overwriteConfig,
});

process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
