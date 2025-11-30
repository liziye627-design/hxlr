# Agent Enhancement Implementation Plan

## Goal
Create a robust "Persona-First" agent architecture where the AI companion's personality is the primary interface, and game role capabilities (Werewolf, Seer, etc.) are internal modules invoked by the agent. Ensure strict adherence to game rules (sequential speaking, time limits).

## Architecture: Persona + Role Composition

Instead of inheritance (e.g., `WerewolfAgent extends BaseAgent`), we will use composition.

### 1. Core Agent (`GameAgent`)
- **Responsibility**: Represents the "AI Companion". Handles personality, speaking style, memory, and the main LangGraph workflow.
- **Components**:
  - `PersonaProfile`: The static personality data (from frontend).
  - `RoleStrategy`: The dynamic game role logic.

### 2. Role Strategies (`IRoleStrategy`)
- **Responsibility**: Pure game logic. Decides *what* to do (e.g., "Vote for Player 3", "Check Player 5"), but not *how* to say it.
- **Implementations**:
  - `WerewolfStrategy`: Hunting, deception logic.
  - `SeerStrategy`: Information gathering logic.
  - `VillagerStrategy`: Deduction logic.
  - etc.

### 3. LangGraph Workflow
The graph will be: `Perceive -> Strategize (Role) -> Articulate (Persona) -> Act`

1.  **Perceive**: Update context.
2.  **Strategize**: Call `RoleStrategy.getStrategicIntent(context)`. Returns an intent (e.g., `Target: Player 3, Goal: Discredit`).
3.  **Articulate**: Call `PersonaProfile.generateSpeech(intent, context)`. Wraps the intent in the character's voice.
4.  **Act**: Return the final structured action.

## Proposed Changes

### 1. LangChain Integration
#### [NEW] src/lib/DeepSeekModel.ts
- Create `DeepSeekModel` wrapping the API for LangChain.

### 2. Strategy Pattern Implementation
#### [NEW] src/agents/strategies/types.ts
- Define `StrategicIntent` interface.

#### [NEW] src/agents/strategies/BaseStrategy.ts
#### [NEW] src/agents/strategies/WerewolfStrategy.ts
#### [NEW] src/agents/strategies/SeerStrategy.ts
- Implement role-specific logic.

### 3. Agent Refactoring
#### [MODIFY] src/agents/BaseAgent.ts -> src/agents/GameAgent.ts
- Rename and refactor to use `IRoleStrategy`.
- Implement the new `Strategize -> Articulate` flow.

#### [MODIFY] src/agents/AgentFactory.ts
- Update to instantiate `GameAgent` and inject the correct `RoleStrategy`.

### 4. Game Rules & UI
#### [MODIFY] src/pages/werewolf/GameRoom.tsx
- Ensure `moveToNextSpeaker` enforces sequential order (already done, verify).
- Add visual countdown timer for speaking limits.

## Verification Plan
- **Unit Test**: Verify `WerewolfStrategy` returns correct kill targets.
- **Integration Test**: Verify `GameAgent` produces speech that matches BOTH the persona (style) AND the strategy (content).
