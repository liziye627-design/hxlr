# AIRI Integration Plan

## Goal

Integrate the useful parts of `Project AIRI` into this repository without importing a second full product stack.

This project is already an AI co-play platform with:

- Werewolf gameplay and multiplayer room logic
- Jubensha gameplay and room/state management
- Existing AI companion data model
- Existing Live2D / VTuber surface hooks
- Existing browser TTS / STT services
- A vendored `Open-LLM-VTuber` directory

The right approach is selective adoption, not full replacement.

## Current Local Baseline

Relevant existing pieces in this repo:

- `Open-LLM-VTuber/`
- `src/config/aiPlayerModels.ts`
- `src/components/werewolf/AIVtuberObserver.tsx`
- `src/pages/werewolf/MultiplayerGameRoom.tsx`
- `src/services/TTSService.ts`
- `src/services/STTService.ts`
- `src/server/scriptmurder/*`

This means the repository already has a partial avatar layer, voice layer, and gameplay orchestration layer.

## What To Reuse From AIRI

### 1. Avatar Layer

Use from AIRI:

- Better Live2D / VRM runtime conventions
- Model packaging and switching workflow
- Character asset organization
- Desktop companion presentation patterns

Apply to this repo:

- Standardize AI player avatar definitions beyond static `modelName`
- Add a unified `avatar_runtime` config per AI companion
- Support both `Live2D` and `VRM` as first-class options

Recommended target:

- Keep current React-side `AIVtuberObserver`
- Replace ad hoc model mapping with a richer manifest
- Treat AIRI as the asset/runtime reference, not the page shell

### 2. Voice Layer

Use from AIRI:

- `unSpeech` style TTS gateway pattern
- OpenAI-compatible speech service abstraction
- Better separation between speech synthesis provider and gameplay logic

Apply to this repo:

- Replace browser-only `SpeechSynthesis` as the primary production path
- Keep browser TTS only as fallback for local demo/dev
- Add server-side provider selection for different companions

Recommended target:

- `src/services/TTSService.ts` becomes a thin client adapter
- Real TTS runs through backend service endpoints
- Voice style maps from companion profile, not only player ID hash

### 3. Character / Persona Asset Layer

Use from AIRI:

- Character packaging structure
- Model asset directory conventions
- Emotion and motion mapping practices

Apply to this repo:

- Expand `src/config/aiPlayerModels.ts` into a manifest-driven system
- Add fields for:
  - `runtimeType`: `live2d | vrm | static`
  - `assetId`
  - `voiceProfile`
  - `emotionMap`
  - `animationProfile`
  - `supportedScenes`

Recommended target:

- One manifest shared by Werewolf, Jubensha, and later MC
- Same companion can appear across multiple game modes with different behavior profiles

### 4. Future MC Agent Layer

Use from AIRI:

- The game-agent architecture idea
- Tool-driven world interaction patterns

Apply to this repo:

- Only for the future Minecraft branch
- Do not mix this into Werewolf/Jubensha core logic right now

Recommended target:

- Create a separate `mc-agent` integration track later
- Keep current social-deduction and script-play systems isolated

## What Not To Import Directly

Do not directly merge these into the current app:

- AIRI's full app shell
- AIRI's full frontend routes/pages
- AIRI's entire desktop product UX
- Game-specific automation stacks that are unrelated to Werewolf/Jubensha
- Detection datasets or YOLO pipelines that do not map to current gameplay

Reason:

- This repository already has a product shell and gameplay state machines
- Full-stack merge would create duplicate routing, state, asset, and model systems
- Current priority is co-play presentation and voice quality, not replacing gameplay architecture

## Asset Download Guidance

### Priority Assets

Best near-term asset types for this project:

- Live2D models for AI companions
- VRM models for future 3D companion mode
- Voice model configs / TTS provider profiles
- Character portrait packs for room, roster, and replay UIs

### Low Priority Assets

Do not prioritize these yet:

- Factorio datasets
- Balatro detection datasets
- Game-specific detection assets unrelated to your product roadmap

Those are useful for AIRI's broader game-agent ecosystem, but they do not help Werewolf or Jubensha first.

## Recommended Integration Order

### Phase 1: Avatar Manifest Unification

Deliverables:

- New shared companion runtime manifest
- Refactor `aiPlayerModels.ts`
- Make `AIVtuberObserver` consume manifest config
- Add fallback chain: `live2d -> vrm -> static avatar`

Why first:

- Lowest integration risk
- Immediate visible product improvement
- Supports homepage, lobby, room, and replay surfaces

### Phase 2: Production Voice Pipeline

Deliverables:

- Server-backed TTS endpoint
- Companion-specific voice profiles
- Browser TTS fallback retained for local/dev mode
- Speech lifecycle events unified across Werewolf and Jubensha

Why second:

- Voice quality is central to “AI co-play”
- Current browser speech synthesis is not robust enough for production

### Phase 3: Companion Runtime Service

Deliverables:

- Shared service to load companion runtime metadata
- Scene-aware presentation policies
- Unified API for `room`, `lobby`, `homepage`, `replay`

Why third:

- Prevents duplicate logic across pages and game modes

### Phase 4: MC Branch Preparation

Deliverables:

- Separate architecture doc for Minecraft integration
- Reuse companion runtime + voice layer
- Keep gameplay agent logic isolated from Werewolf/Jubensha

Why fourth:

- It is roadmap work, not current homepage/platform stabilization work

## Concrete Next Tasks

1. Replace `src/config/aiPlayerModels.ts` with a manifest-based schema.
2. Add a backend-facing TTS provider abstraction.
3. Refactor `AIVtuberObserver.tsx` to consume runtime config, not hardcoded name mapping.
4. Add companion asset fields to the database model or a versioned local config source.
5. Keep `Open-LLM-VTuber` as a vendor/runtime dependency, not as the main product shell.

## Decision Summary

Use AIRI as:

- avatar runtime reference
- voice system reference
- asset packaging reference
- future MC agent reference

Do not use AIRI as:

- your main app shell
- your routing system
- your current gameplay core
- your homepage UX
