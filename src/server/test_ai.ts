
import { AIAgent } from './AIAgent';
import { AIPersona } from './AIPersonaSystem';
import { RoomState, RoomPlayer } from './types';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

import { AI_PERSONAS } from './AIPersonaSystem';

// Mock Data
const mockPersona = AI_PERSONAS.logic_machine;

const mockPlayer: RoomPlayer = {
    id: 'ai-player-1',
    name: 'AI玩家1',
    role: 'seer', // Test as Seer
    position: 1,
    is_alive: true,
    type: 'ai',
    isOnline: true,
    socketId: null,
    hasActedNight: false,
    hasVoted: false,
    speechHistory: [],
    isAI: true
};

const mockPlayers: RoomPlayer[] = [
    mockPlayer,
    {
        id: 'player-2',
        name: '玩家2',
        role: 'werewolf',
        position: 2,
        is_alive: true,
        type: 'user',
        isOnline: true,
        socketId: 'socket-2',
        hasActedNight: false,
        hasVoted: false,
        speechHistory: [
            {
                position: 2,
                round: 1,
                phase: 'DAY_DISCUSS',
                content: '我是预言家，昨晚验了3号是金水。',
                timestamp: new Date().toISOString(),
                isAI: false
            }
        ],
        isAI: false
    },
    {
        id: 'player-3',
        name: '玩家3',
        role: 'villager',
        position: 3,
        is_alive: true,
        type: 'user',
        isOnline: true,
        socketId: 'socket-3',
        hasActedNight: false,
        hasVoted: false,
        speechHistory: [],
        isAI: false
    }
];

const mockGameState: RoomState = {
    id: 'test-room',
    name: '测试房间',
    hostId: 'host-id',
    phase: 'DAY_DISCUSS', // Test Day Discussion
    players: mockPlayers,
    currentRound: 1,
    nightActions: [],
    votes: [],
    timer: 60,
    winner: null,
    gameLog: [],
    sheriffId: null,
    witchPotions: { antidote: true, poison: true }
};

async function runTest() {
    console.log('Starting AI Agent Test...');

    const agent = new AIAgent(mockPlayer, mockPersona, mockGameState);

    console.log(`Testing as Role: ${mockPlayer.role}`);
    console.log(`Current Phase: ${mockGameState.phase}`);

    try {
        const decision = await agent.makeDecision();
        console.log('Decision Result:', JSON.stringify(decision, null, 2));
    } catch (error) {
        console.error('Test Failed:', error);
    }
}

runTest();
