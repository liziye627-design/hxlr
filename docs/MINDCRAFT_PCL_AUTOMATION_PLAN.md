# Mindcraft + PCL Automation Plan

Last reviewed: 2026-03-16

## Goal

Add the third game mode as a Minecraft companion experience that can:

1. Prepare a local PCL-managed Minecraft instance.
2. Copy our mod into the correct `mods` folder.
3. Start the launcher or target instance on Windows.
4. Start one or more AI Minecraft roles based on `mindcraft`.

## Final v1 Decision

Do not make a custom bridge mod a hard prerequisite for v1.

The stable v1 path is:

1. PCL launches the pinned Minecraft client instance.
2. The human player opens the world to LAN on the configured port.
3. Mindcraft runs as an external Node.js runtime from `third_party/mindcraft`.
4. The product manages only:
   - pinned instance detection
   - optional mod sync
   - launcher bootstrap
   - companion profile bootstrap
   - log extraction and memory writeback

This matches upstream Mindcraft more closely and removes an unnecessary blocker from the one-click launch path.

## Full Automation Decision

There are now two separate decisions:

### v1.5 Product Decision

Ship a polished "one-click bootstrap" on top of the current client flow:

1. Detect and pin the PCL instance automatically.
2. Verify or sync the required mod files from a local manifest.
3. Launch PCL automatically.
4. Surface an explicit warmup state for the selected companion profile.
5. Wait for the Minecraft world to become reachable on the configured localhost port.
6. Start Mindcraft as an external runtime and attach the selected companion profile.

This is the correct near-term product route because it matches upstream Mindcraft and reuses the current local setup.

### v2 Architecture Decision

If the product requirement becomes "no human LAN/world exposure step at all", the architecture should move toward a local world/server host flow:

1. Start a dedicated local world or server automatically.
2. Connect the human client to that world.
3. Connect Mindcraft bots to the same world.
4. Keep mod sync as a separate concern from world hosting.

This is the only route that can credibly claim fully automatic world availability without relying on a manual LAN step inside the Minecraft client UI.

### What We Will Not Do

- Do not make client decompilation the main path.
- Do not treat a custom gameplay bridge mod as the only way to ship Minecraft companion mode.
- Do not claim "full auto" on the current client + manual LAN path.

## What Mindcraft Actually Provides

`mindcraft-bots/mindcraft` is not a packaged PCL modpack.

It is an open-source framework for AI Minecraft bots built around external Node.js bot clients. The bots connect to a Minecraft world as players and can be configured with different profiles / roles. The upstream README also mentions:

- multiple bots and profile-based behavior
- support for connecting to local or remote Minecraft servers
- an optional companion path called `MineCollab` for multiplayer-style integration

That means our local integration should treat Mindcraft as an external bot runtime, not as a direct replacement for the Minecraft launcher.

## Verified References

- Mindcraft repository: <https://github.com/mindcraft-bots/mindcraft>
- Mindcraft README: <https://github.com/mindcraft-bots/mindcraft/blob/main/README.md>
- Mindcraft FAQ: <https://github.com/mindcraft-bots/mindcraft/blob/main/FAQ.md>

Key verified upstream points from the README:

- Mindcraft supports multiple bots.
- Bots are configured through profiles.
- Bots can connect to a localhost server.
- The project references `MineCollab` as a multiplayer companion path.

Key verified upstream point from the FAQ:

- Mindcraft officially supports client-side mods only; gameplay-changing mod support is not the primary integration path.

## Local Machine Findings

### PCL configuration

- PCL config file:
  - `C:\Users\llwxy\AppData\Roaming\PCLCE\config.v1.json`
- PCL auth profiles:
  - `C:\Users\llwxy\AppData\Roaming\.pclce\profiles.json`
- Confirmed local launcher executable:
  - `C:\Users\llwxy\Desktop\PCL2_CE_Release_x64.exe`
- Confirmed launcher process name after boot:
  - `PCL2_CE_Release_x64`

### Current launcher roots

From `config.v1.json`, the configured launch root is:

- `C:\Users\llwxy\Downloads\.minecraft`

### Current discovered instance

- `C:\Users\llwxy\Downloads\.minecraft\versions\GD656极致生电整合包-1.21.4`

### Current detection result

The repo now exposes a local detection pass before bootstrap.

Run:

- `npm run mc:detect`
- `npm run mc:init-config`
- `npm run mc:prepare`
- `npm run mc:launch`

Current verified output on this machine:

- detected PCL config:
  - `C:\Users\llwxy\AppData\Roaming\PCLCE\config.v1.json`
- detected launcher root:
  - `C:\Users\llwxy\Downloads\.minecraft`
- detected version:
  - `GD656极致生电整合包-1.21.4`
- ranked `mods` candidates:
  - `C:\Users\llwxy\Downloads\.minecraft\versions\GD656极致生电整合包-1.21.4\mods`
  - `C:\Users\llwxy\Downloads\.minecraft\versions\GD656极致生电整合包-1.21.4\.minecraft\mods`
  - `C:\Users\llwxy\Downloads\.minecraft\mods`

Important finding:

- the recommended pinned `mods` directory has now been created:
  - `C:\Users\llwxy\Downloads\.minecraft\versions\GD656极致生电整合包-1.21.4\mods`
- `config/minecraft.local.json` can now be generated automatically from the detection result
- `.codex-minecraft-bootstrap/prepare.json` is now written under the launcher root as a local receipt

### Important caveat

This instance does not currently expose a normal on-disk structure like:

- `mods/`
- `config/`
- `saves/`

under the expected root that was inspected.

This means one of the following is true:

1. The real game instance is stored elsewhere.
2. The instance is assembled dynamically at launch time.
3. PCL is using a non-standard per-version mapping that still needs to be discovered.

Launching PCL alone did not materialize any additional `mods`, `config`, or runtime instance directories under the inspected root. That means the mod injection step must target the resolved game instance rather than the launcher startup cache itself.

There is one strong local clue pointing to version-isolated mod folders:

- `C:\Users\llwxy\Downloads\PCL2_OPL_Guide_Links.md`

That guide uses the placeholder command:

- `dir "{verindie}mods" /b | clip`

This strongly suggests that PCL internally exposes a resolved per-version instance path, and the final mod injection target may be a version-specific `mods` folder rather than a single shared root-level folder.

### Current unknowns

- The final `mods` injection directory has not been confirmed yet.
- No public, verified PCL command-line automation interface has been identified yet.

## Product / Engineering Recommendation

Do not rely on decompiling the Minecraft client as the main integration path.

That is the wrong abstraction level for this feature because:

- Mindcraft works as external bot clients.
- Mod injection and launcher orchestration are separate concerns.
- Client decompilation is brittle and unnecessary for a first shipping version.

The correct architecture is:

1. A Windows bootstrap script prepares the launcher and mod.
2. Minecraft starts through PCL or through the resolved game instance.
3. Mindcraft bots start as separate Node.js processes with selected character profiles.

## Proposed Automation Flow

The future script should look like:

1. Resolve launcher and game root.
2. Resolve active version or accept it as an explicit parameter.
3. Resolve or create the correct `mods` directory.
4. Copy our mod jar into the target `mods` directory if it changed.
5. Start PCL or the target Minecraft instance.
6. Wait for the server / game world to become reachable.
7. Start one or more Mindcraft bot roles.

## Stable Mod Strategy

The stability target should be:

- every run launches against the same pinned Minecraft instance
- every run verifies that the required mod jar is present
- every run can repair drift automatically before launch

Recommended approach:

1. Pin one explicit PCL version name instead of "current active version".
2. Maintain a local mod manifest with:
   - file name
   - sha256
   - target version
   - loader type
   - install destination policy
3. Before launch:
   - verify the target instance exists
   - verify or create the resolved `mods` directory
   - compare current jar hash with manifest
   - copy or replace only when mismatch is detected
4. Write a local install receipt after each sync so we can detect drift fast.

This is more stable than relying on manual drag-and-drop into PCL.

## Memory / Knowledge Ingestion Strategy

The game logs should not be embedded raw.

Use a 4-stage pipeline:

1. Raw capture
   - collect bot stdout / stderr
   - collect game event logs
   - collect player chat and role actions
2. Structured extraction
   - convert raw text into normalized events
   - examples: `resource_gathered`, `combat_event`, `death`, `crafted_item`, `player_helped`, `goal_blocked`
3. Filtering and summarization
   - remove noise and repeated low-signal loops
   - keep only events useful for future teammate behavior
   - emit episodic summaries and lesson notes
4. Memory writeback
   - write structured summary chunks into the agent memory store
   - optionally generate embeddings for retrieval

## Existing Repo Support We Should Reuse

This repository already has partial memory support:

- migration scaffold:
  - `supabase/migrations/05_add_agent_feedback_memory.sql`
- structured feedback tables:
  - `agent_reviews`
  - `agent_review_suggestions`
  - `agent_memory_chunks`
  - `agent_memory_embeddings`
- server memory module:
  - `src/server/memory/AgentKnowledgeBase.ts`
- client/server DB integration:
  - `src/db/api.ts`

So this should extend the current memory system, not replace it.

## Required Schema Extension for MC Logs

The current `agent_memory_chunks.source_type` constraint only supports:

- `review`
- `suggestion`
- `session_note`

For Minecraft memory ingestion, add at least:

- `mc_event`
- `mc_summary`
- `mc_lesson`

Recommended metadata fields for MC memory chunks:

- `world_id`
- `bot_profile`
- `task_id`
- `event_type`
- `importance`
- `participants`
- `resource_tags`
- `failure_reason`
- `position`

## Stable Runtime Recommendation

The most stable runtime model is:

1. PCL launches the human-facing client.
2. Mindcraft bots run as external Node.js processes.
3. The world is exposed through one controlled connection path.

Important upstream constraint from Mindcraft:

- basic MineCollab flow expects a supported version, then opening the world to LAN on port `55916`
- on Windows, Mindcraft documentation explicitly says it can run with `--no-launch-world`

That means the safest first product version is:

- keep the PCL client side stable
- do not automate Minecraft client internals too aggressively
- automate launcher start, mod sync, and bot bootstrap first
- treat world exposure as a separate explicit step unless we later add a more stable dedicated-server path

## Recommended Phase Split

### Phase A

- lock target version / mod manifest
- implement deterministic mod sync
- implement launcher bootstrap

### Phase B

- launch Mindcraft profiles for selected teammate roles
- verify local connection flow
- capture raw logs

### Phase C

- normalize logs into session events
- filter and summarize
- write memory chunks + embeddings into Supabase

### Phase D

- surface memory-backed teammate behavior in the product UI
- allow replay / review / improvement notes

## Proposed Script Surface

Suggested script:

- `scripts/start-minecraft-companion.ps1`

Suggested parameters:

- `-PclPath`
- `-GameRoot`
- `-VersionName`
- `-ModJarPath`
- `-MindcraftRoot`
- `-BotProfile`
- `-BotProfiles`
- `-ServerHost`
- `-ServerPort`
- `-SkipLauncher`
- `-DetectOnly`

Companion local helper:

- `scripts/init-minecraft-config.ts`
  - writes `config/minecraft.local.json` from the detected local PCL root and version
  - keeps the command idempotent unless overwrite is explicitly requested
- `scripts/prepare-minecraft-companion.ts`
  - initializes config if needed
  - creates the pinned `mods` directory
  - writes a `prepare.json` receipt
- `scripts/launch-minecraft-companion.ts`
  - runs the `prepare` step first
  - blocks launch if critical prerequisites are missing
  - is the intended base for a future one-click UI action

## Suggested Directory Contract

The implementation should avoid hard-coded random paths and use a small config file instead.

Suggested config:

- `config/minecraft.local.json`

Suggested fields:

- `pclPath`
- `gameRoot`
- `versionName`
- `modJarPath`
- `mindcraftRoot`
- `serverHost`
- `serverPort`
- `defaultProfiles`

## UI Follow-Up

The third game page should visually feel more product-grade by avoiding generic cards and small utility-looking controls.

Design direction for the Minecraft mode:

- large single primary entry
- clear world status
- selected teammate / bot profile summary
- one action to launch
- advanced setup hidden behind secondary controls

This keeps the page consumer-friendly while the heavier setup remains in the automation layer.

## Implementation Order

1. Discover and lock the real PCL executable path.
2. Discover the actual `mods` target for the selected Minecraft instance.
3. Vendor or submodule the Mindcraft runtime into a stable local path.
4. Add a local config file for Minecraft automation.
5. Implement the PowerShell bootstrap script.
6. Add one small server or frontend action to call the script.

## Phase 1 Slice Implemented

The first implementation slice now exists in this repo:

- local config example:
  - `config/minecraft.local.example.json`
- mod manifest example:
  - `config/minecraft.mod-manifest.example.json`
- bootstrap script:
  - `scripts/start-minecraft-companion.ps1`
- server route:
  - `src/server/routes/minecraft.ts`
- memory/log service:
  - `src/server/services/MinecraftCompanionService.ts`
- schema extension:
  - `supabase/migrations/06_add_minecraft_memory_pipeline.sql`

Current behavior:

- launcher/bootstrap can be invoked through the script or server route
- logs can be normalized into filtered events and memory chunks
- if Supabase is unavailable, ingestion now degrades gracefully with `persisted=false` instead of pretending success
- `third_party/mindcraft` is now vendored locally on stable tag `v0.1.3`
- `scripts/setup-mindcraft.ps1` now prepares the Mindcraft checkout, installs dependencies, and validates required keys for the active companion profile
- the default companion profile is `profiles/companion-ren.json`
- the current companion profile is aligned with the locally available `DEEPSEEK_API_KEY`
- `mc:launch` dry-run now succeeds without relying on a fake bridge-mod prerequisite

## Notes

- This should be treated as a new capability, not a quick script hack.
- The launcher path and version-local `mods` directory are now pinned on this machine.
- The next product-facing step is wiring the third game page to the new one-click launch flow.
