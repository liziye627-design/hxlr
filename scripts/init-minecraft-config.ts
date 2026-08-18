import {
  getMinecraftConfigPath,
  writeRecommendedMinecraftBootstrapConfig,
} from '../src/server/services/MinecraftCompanionService.ts';

function parseArgs(argv: string[]) {
  const parsed = {
    configPath: getMinecraftConfigPath(),
    overwrite: false,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === '--overwrite') {
      parsed.overwrite = true;
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
const result = writeRecommendedMinecraftBootstrapConfig(options.configPath, {
  overwrite: options.overwrite,
});

process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
if (!result.ok) {
  process.exitCode = 1;
}
