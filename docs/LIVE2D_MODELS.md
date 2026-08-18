# Live2D Models

Last updated: 2026-03-15

## Imported Models

The following Live2D models have been added to `Open-LLM-VTuber/live2d-models`:

- `haru`
- `hiyori`
- `mao_pro`
- `mark`
- `natori`
- `ren`
- `rice`
- `shizuku`
- `wanko`

Preview textures were copied into `Open-LLM-VTuber/avatars`.

## Source

Imported from:

- Live2D Cubism Web Samples
  https://github.com/Live2D/CubismWebSamples

Official upstream sample resource folders:

- `Samples/Resources/Haru`
- `Samples/Resources/Hiyori`
- `Samples/Resources/Mark`
- `Samples/Resources/Natori`
- `Samples/Resources/Ren`
- `Samples/Resources/Rice`
- `Samples/Resources/Wanko`

## License Note

These models are sample assets from Live2D Inc. They are not covered by the main MIT-style licenses used in most code repositories.

Relevant upstream notices:

- `CubismWebSamples/LICENSE.md`
- `Open-LLM-VTuber/LICENSE-Live2D.md`

Important:

- These models are safe as sample/demo assets inside this workspace.
- Commercial use may require additional permission depending on your business scale and usage scenario.
- Replace them with your own licensed production models before shipping at scale.

## Runtime Registration

The runtime model index is stored in:

- `Open-LLM-VTuber/model_dict.json`

The current game-side runtime mapping is stored in:

- `src/config/aiPlayerModels.ts`

## Default Assignments

Current default mapping in the app:

- `AI_A -> haru`
- `AI_B -> hiyori`
- `AI_C -> mark`
- `AI_D -> natori`
- `AI_E -> rice`
- `AI_F -> wanko`
- `USER_COMPANION -> ren`
