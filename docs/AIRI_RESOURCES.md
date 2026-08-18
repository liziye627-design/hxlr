# AIRI Resources

Last checked: 2026-03-15

## Official Upstream

- Project AIRI repository: https://github.com/moeru-ai/airi
- Project AIRI docs: https://airi.moeru.ai/docs/en/
- AIRI desktop guide: https://airi.moeru.ai/docs/en/docs/overview/guide/tamagotchi/
- AIRI releases: https://github.com/moeru-ai/airi/releases
- unSpeech repository: https://github.com/moeru-ai/unspeech
- Project AIRI Hugging Face models: https://huggingface.co/proj-airi/models
- Project AIRI Hugging Face datasets: https://huggingface.co/proj-airi/datasets

## Why These Matter Here

Use these upstream resources for:

- avatar runtime reference
- Live2D / VRM switching reference
- server-backed TTS
- future Minecraft branch research

Do not use them as a replacement for:

- this repo's routing
- Werewolf state machine
- Jubensha state machine
- homepage shell

## Recommended Pull-In Targets

### Avatar / VTuber

- AIRI repo structure for model packaging
- AIRI desktop model guidance for Live2D / VRM
- Existing local `Open-LLM-VTuber` vendor folder as current runtime bridge

### Voice

- unSpeech for OpenAI-compatible TTS gateway
- Keep browser speech APIs only as dev fallback

### Future Roadmap

- AIRI Minecraft branch reference: https://github.com/moeru-ai/airi-minecraft

## Downloadable Assets Worth Tracking

These are the only upstream data/model assets currently worth tracking for this repo:

- `proj-airi/games-balatro-2024-yolo-ui-detection`
- `proj-airi/games-balatro-2024-ui-detection`
- `proj-airi/games-balatro-2024-entities-detection`

They are not immediate gameplay dependencies for Werewolf or Jubensha. Keep them as reference assets, not production requirements.

## Download Commands

If you have `huggingface-cli` installed:

```bash
huggingface-cli download proj-airi/games-balatro-2024-yolo-ui-detection --local-dir ./third_party/airi/balatro-ui-model
huggingface-cli download proj-airi/games-balatro-2024-ui-detection --repo-type dataset --local-dir ./third_party/airi/balatro-ui-dataset
huggingface-cli download proj-airi/games-balatro-2024-entities-detection --repo-type dataset --local-dir ./third_party/airi/balatro-entities-dataset
```

To run unSpeech locally:

```bash
git clone https://github.com/moeru-ai/unspeech.git
cd unspeech
go build -o ./result/unspeech ./cmd/unspeech
./result/unspeech
```

Default unSpeech API endpoint:

```text
http://localhost:5933/v1/audio/speech
```

## Local TTS Bridge Env

The local Node server now exposes:

- `GET /api/tts/status`
- `POST /api/tts/speak`

Recommended environment variables:

```text
TTS_PROVIDER=unspeech
TTS_PROVIDER_ENDPOINT=http://127.0.0.1:5933/v1/audio/speech
TTS_MODEL=tts-1
TTS_VOICE=alloy
TTS_RESPONSE_FORMAT=mp3
TTS_SPEED=1
```

If these are missing, the frontend falls back to browser `SpeechSynthesis`.

## Integration Mapping

- `src/config/aiPlayerModels.ts`
  Should store local runtime manifest metadata, not raw upstream repo details.
- `src/components/werewolf/AIVtuberObserver.tsx`
  Should consume local manifest and bridge into runtime.
- `src/services/TTSService.ts`
  Should move toward backend provider selection, with browser TTS as fallback.
- `Open-LLM-VTuber/`
  Keep as vendored runtime reference until a clearer AIRI-specific bridge is needed.
