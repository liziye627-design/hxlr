# Requirements Document

## Introduction

《第二十二条校规》是一款7人恐怖悬疑剧本杀游戏系统。系统需要实现完整的AI驱动角色扮演、场景管理、线索发现和游戏流程控制功能。玩家可以与7个AI角色进行自然对话互动，体验3-5小时的沉浸式剧本杀游戏。

## Glossary

- **Script22System**: 《第二十二条校规》剧本杀游戏系统
- **CharacterAgent**: AI驱动的角色代理，负责角色对话和行为
- **GamePhase**: 游戏阶段，包括介绍、阅读、讨论、搜证、指认、投票、揭晓
- **Persona**: 角色人格配置，定义角色的性格、秘密、关系和行为模式
- **MemorySystem**: 记忆系统，管理角色的公开记忆、私密记忆和共享记忆
- **ClueSystem**: 线索系统，管理线索的发现、展示和关联
- **SceneManager**: 场景管理器，控制场景切换和场景内交互
- **ForbiddenTopic**: 禁忌话题，角色不能主动透露的秘密信息
- **PsychologicalState**: 心理状态，包括恐惧等级、怀疑度等动态属性

## Requirements

### Requirement 1

**User Story:** As a player, I want to select and interact with AI-controlled characters, so that I can experience an immersive murder mystery game.

#### Acceptance Criteria

1. WHEN a player enters the game room THEN the Script22System SHALL display all 7 available characters with their basic information
2. WHEN a player sends a message to a character THEN the CharacterAgent SHALL respond within 5 seconds maintaining personality consistency
3. WHEN a character responds THEN the Script22System SHALL validate the response against the character's Persona constraints
4. WHEN a player asks about forbidden topics THEN the CharacterAgent SHALL deflect or provide evasive responses without revealing secrets
5. IF the CharacterAgent fails to respond within 10 seconds THEN the Script22System SHALL display a fallback response and log the error

### Requirement 2

**User Story:** As a game host, I want to manage game phases and flow, so that the game progresses smoothly through all stages.

#### Acceptance Criteria

1. WHEN a game starts THEN the Script22System SHALL initialize in INTRO phase and display the opening narration
2. WHEN the host advances the phase THEN the Script22System SHALL transition to the next GamePhase in sequence: INTRO → SCRIPT_READING → FREE_DISCUSSION → CLUE_SEARCH → ACCUSATION → VOTE → REVEAL
3. WHILE in SCRIPT_READING phase THEN the Script22System SHALL provide character scripts to players based on their selected roles
4. WHILE in FREE_DISCUSSION phase THEN the Script22System SHALL enable round-robin speaking order among characters
5. WHILE in CLUE_SEARCH phase THEN the Script22System SHALL allow players to investigate scenes and discover clues
6. WHEN all votes are cast in VOTE phase THEN the Script22System SHALL calculate and display voting results

### Requirement 3

**User Story:** As a player, I want to explore different scenes and discover clues, so that I can piece together the mystery.

#### Acceptance Criteria

1. WHEN a player enters a scene THEN the SceneManager SHALL display the scene description, atmosphere, and available interactions
2. WHEN a player investigates a location THEN the ClueSystem SHALL reveal clues based on discovery conditions
3. WHEN a clue is discovered THEN the Script22System SHALL add the clue to the player's clue panel and notify relevant characters
4. WHEN displaying a scene THEN the SceneManager SHALL load appropriate background assets and audio
5. IF a scene contains hidden clues THEN the ClueSystem SHALL only reveal clues when specific conditions are met

### Requirement 4

**User Story:** As a player, I want characters to remember our conversations and react to events, so that the game feels realistic.

#### Acceptance Criteria

1. WHEN a conversation occurs THEN the MemorySystem SHALL store the exchange in the character's memory
2. WHEN a character is asked about past events THEN the CharacterAgent SHALL retrieve and reference relevant memories
3. WHEN a significant event occurs THEN the MemorySystem SHALL update all affected characters' shared memories
4. WHILE a character responds THEN the CharacterAgent SHALL maintain consistency with previously stated information
5. IF memory conflicts are detected THEN the MemorySystem SHALL prioritize newer information and flag inconsistencies

### Requirement 5

**User Story:** As a player, I want each character to have a unique personality and psychological state, so that interactions feel authentic.

#### Acceptance Criteria

1. WHEN initializing a character THEN the Script22System SHALL load the complete Persona configuration including personality traits, secrets, and relationships
2. WHEN a character interacts THEN the CharacterAgent SHALL adjust responses based on current PsychologicalState (fear level, suspicion)
3. WHEN a threatening situation occurs THEN the PsychologicalState SHALL update fear levels accordingly
4. WHEN a character is accused THEN the PsychologicalState SHALL increase suspicion and modify defensive behaviors
5. WHILE generating responses THEN the CharacterAgent SHALL apply personality-consistent language patterns and emotional expressions

### Requirement 6

**User Story:** As a player, I want to see character interactions and reactions in real-time, so that the game feels dynamic.

#### Acceptance Criteria

1. WHEN one character speaks THEN other CharacterAgents SHALL generate contextual reactions within 3 seconds
2. WHEN a player makes an accusation THEN all CharacterAgents SHALL generate appropriate defensive or supportive responses
3. WHEN a clue is revealed publicly THEN affected CharacterAgents SHALL display visible reactions based on their secrets
4. WHILE in discussion phase THEN the Script22System SHALL enable AI characters to initiate conversations with each other
5. WHEN displaying character reactions THEN the Script22System SHALL show emotion indicators and speech bubbles

### Requirement 7

**User Story:** As a developer, I want the system to be extensible, so that new scripts can be added easily.

#### Acceptance Criteria

1. WHEN adding a new script THEN the Script22System SHALL accept configuration through standardized ScriptConfig interface
2. WHEN loading script data THEN the Script22System SHALL validate configuration against the schema
3. WHEN a script is loaded THEN the Script22System SHALL dynamically create CharacterAgents based on character definitions
4. WHERE custom game phases are defined THEN the Script22System SHALL support phase customization through configuration
5. WHEN serializing game state THEN the Script22System SHALL produce valid JSON that can be deserialized to restore the game

### Requirement 8

**User Story:** As a player, I want a clear and intuitive user interface, so that I can focus on the game experience.

#### Acceptance Criteria

1. WHEN entering the game room THEN the Script22System SHALL display the main game interface with scene view, character panel, chat area, and action panel
2. WHEN a phase changes THEN the Script22System SHALL display a phase transition animation and update UI elements
3. WHEN viewing character information THEN the Script22System SHALL show character cards with avatar, name, and relationship status
4. WHEN interacting with clues THEN the Script22System SHALL display clue details in a dedicated panel
5. WHILE in mobile view THEN the Script22System SHALL adapt layout for smaller screens while maintaining functionality
