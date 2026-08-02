# Build Log & Changelog

    - **`NightActionPanel.tsx`**: Replaced standard browser confirm dialogs with `ActionConfirmDialog`.
    - **`SheriffElectionPanel.tsx`**: Integrated the new dialog for election applications and voting.

### 3. Backend Integration (Phase 2)
**Goal**: Connect the frontend game logic with the Open-LLM-VTuber Python backend.

- **OpenLLMBridge (`src/services/OpenLLMBridge.ts`)**
    - **New Service**: Acts as a bridge to the Python Open-LLM-VTuber API (default port 12393).
    - **Capabilities**:
        - `generateResponse(messages)`: For standard LLM chat interaction.
        - `speak(text)`: For direct TTS/Motion control logic.
- **GodAIController (`src/server/GodAIController.ts`)**
    - **Integration**: Now utilizes `OpenLLMBridge` triggers.
    - **Feature**: Game phase transitions ("天黑请闭眼", etc.) and major events (wins/deaths) now trigger the VTuber to speak automatically via the bridge.

---
*Next Steps: Phase 3 - Live2D Canvas Integration & Model Configuration.*
