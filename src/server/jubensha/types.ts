// Types for Script Murder Game System

export interface ScriptData {
    id: string;
    title: string;
    scenes: Scene[];
    characters: Character[];
    clues: Clue[];
    timeline: TimelineEvent[];
}

export interface Scene {
    id: string;
    name: string;
    description: string;
    backgroundUrl: string;
    bgmUrl?: string;
    atmosphere: string;
}

export interface Character {
    id: string;
    name: string;
    role: string;
    avatar: string;
    personality: string;
    secrets: string[];
    relationships: Record<string, string>;
}

export interface Clue {
    id: string;
    name: string;
    description: string;
    revealCondition?: string;
    discovered: boolean;
}

export interface TimelineEvent {
    id: string;
    sceneId: string;
    trigger: 'auto' | 'player_action' | 'time';
    action: 'scene_change' | 'narration' | 'character_dialogue' | 'clue_reveal';
    content: string;
}

export interface GameState {
    roomId: string;
    scriptId: string;
    currentSceneId: string;
    currentPhase: 'intro' | 'investigation' | 'confrontation' | 'resolution';
    discoveredClues: string[];
    conversationHistory: Message[];
    timelineProgress: number;
}

export interface Message {
    id: string;
    sender: string;
    senderType: 'player' | 'narrator' | 'character' | 'system';
    content: string;
    timestamp: number;
    metadata?: {
        characterId?: string;
        sceneId?: string;
        clueId?: string;
    };
}

export interface PlayerAction {
    type: 'story_progress' | 'ask_character' | 'investigate' | 'chat';
    characterId?: string;
    message?: string;
}

export interface AgentResponse {
    type: 'narration' | 'dialogue' | 'scene_change' | 'clue_reveal' | 'system';
    content: string;
    metadata?: {
        newSceneId?: string;
        characterId?: string;
        clueIds?: string[];
    };
}
