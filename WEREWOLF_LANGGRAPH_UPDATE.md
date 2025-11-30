# LangGraph Agent System Update

## 📅 Update Time: 2025-11-23

## 🎯 Objective
Optimize the Werewolf AI agents using LangGraph to enable more structured decision-making, role-specific behaviors, and inter-agent communication capabilities.

## 🛠️ Changes

### 1. Agent Architecture
- **LangGraph Integration**: Implemented `BaseAgent` using `@langchain/langgraph` to define a state machine for agent behavior.
- **State Machine**:
  - `Perceive`: Update internal game state.
  - `Think`: Use LLM to reason about the game.
  - `Decide`: Determine the next action (Speak, Vote, Skill).
  - `Act`: Execute the action.

### 2. File Structure
- Created `src/agents/` directory.
- **Base Class**: `src/agents/BaseAgent.ts` - Abstract base class with the core graph.
- **Types**: `src/agents/types.ts` - Shared type definitions.
- **Factory**: `src/agents/AgentFactory.ts` - Factory pattern for agent instantiation.
- **Role Agents**:
  - `src/agents/WerewolfAgent.ts`: Implements kill logic and deception.
  - `src/agents/VillagerAgent.ts`: Implements deduction logic.
  - `src/agents/SeerAgent.ts`: Implements check logic.
  - `src/agents/WitchAgent.ts`: Implements potion logic.
  - `src/agents/HunterAgent.ts`: Implements revenge logic.
  - `src/agents/GuardAgent.ts`: Implements protection logic.

### 3. Game Integration
- Modified `src/pages/werewolf/GameRoom.tsx`:
  - Replaced simple `handleAISpeech` with `agent.processTurn`.
  - Added `executeAINightActions` to handle AI skills during the night phase.
  - Initialized agents using `AgentFactory`.

### 4. Features Enabled
- **Role Skills**: Agents can now use their skills (Kill, Check, Save/Poison, Protect) based on the game phase.
- **Structured Output**: Agents output JSON actions for precise control.
- **Context Awareness**: Agents receive full game context including history and alive players.

## 📝 Next Steps
- **Inter-Agent Communication**: Enhance the `history` context to allow agents to reference specific previous speeches.
- **Complex Strategy**: Improve the prompts to support more advanced strategies (e.g., framing, teaming up).
- **Memory**: Implement long-term memory for agents across games (if desired).
