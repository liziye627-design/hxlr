import { AIAgentEnhanced } from './AIAgentEnhanced';
import { AIPersona, AI_PERSONAS } from './AIPersonaSystem';
import { RoomState, RoomPlayer } from './types';
import dotenv from 'dotenv';
// Load environment variables
dotenv.config();

// 1. 预检环境
if (!process.env.DEEPSEEK_API_KEY && !process.env.OPENAI_API_KEY) {
    console.error('❌ Error: Missing API Key in .env file');
    process.exit(1);
}

// Mock Data
const mockPersona = AI_PERSONAS.logic_machine; // 使用逻辑机器，看它能不能盘出伪逻辑

const mockPlayer: RoomPlayer = {
    id: 'ai-player-1',
    name: 'AI玩家1',
    role: 'seer',
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
        hasActedNight: true,
        hasVoted: false,
        speechHistory: [
            {
                position: 2,
                round: 1,
                phase: 'DAY_DISCUSS',
                content: '我是预言家，昨晚验了3号是金水。3号全场唯一金水，我警徽流先4后5。',
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
    phase: 'DAY_DISCUSS',
    players: mockPlayers,
    currentRound: 1,

    // 2. 注入历史行动：模拟昨晚发生的事情 (假设后端记录了这些)
    nightActions: [
        {
            playerId: 'ai-player-1',
            role: 'seer',
            actionType: 'check',
            targetId: 'player-2', // AI 昨晚验了 2号 (狼人)
        }
    ],

    votes: [],
    timer: 60,
    winner: null,
    gameLog: [],
    sheriffId: null,
    witchPotions: { antidote: true, poison: true }
};

async function runTest() {
    console.log('🤖 Starting AI Agent Test (Enhanced)...');
    console.log('-----------------------------------');
    console.log(`🎭 Role: ${mockPlayer.role}`);
    console.log(`🧠 Persona: ${mockPersona.name}`);
    console.log(`⏱️ Phase: ${mockGameState.phase}`);
    console.log('📜 Scenario: Player 2 (Werewolf) claims Seer. AI (Real Seer) checked Player 2 last night.');
    console.log('-----------------------------------');

    // 使用增强版 Agent
    const agent = new AIAgentEnhanced(mockPlayer, mockPersona, mockGameState);

    try {
        // 3. 测试发言生成
        console.log('Thinking...');
        const startTime = Date.now();

        // 如果是增强版，通常有 generateDaySpeech 方法
        const result = await agent.generateDaySpeech();

        const duration = (Date.now() - startTime) / 1000;
        console.log(`✅ Decision made in ${duration.toFixed(2)}s`);
        console.log('-----------------------------------');
        console.log('🗣️ Generated Speech:');
        console.log(result.speech);

        if (result.reasoning) {
            console.log('\n🤔 CoT Reasoning:');
            result.reasoning.forEach(step => {
                console.log(`  [Step ${step.step}] ${step.thought} -> ${step.conclusion}`);
            });
        }

        // 简单断言
        if (result.speech.includes('2') && (result.speech.includes('狼') || result.speech.includes('查杀') || result.speech.includes('悍跳') || result.speech.includes('铁狼'))) {
            console.log('\n✅ TEST PASSED: AI correctly identified Player 2 as the enemy.');
        } else {
            console.warn('\n⚠️ TEST WARNING: AI might have missed the counter-claim.');
        }

    } catch (error) {
        console.error('❌ Test Failed:', error);
    }
}

runTest();
