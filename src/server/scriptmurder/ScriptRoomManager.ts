import type { Server } from 'socket.io';
import { ScriptStateMachine } from './ScriptStateMachine.js';
import type {
  ScriptRoomState,
  ScriptPlayer,
  CreateScriptRoomPayload,
  JoinScriptRoomPayload,
} from './types.js';
import { AgentOrchestrator } from '../jubensha/agents/AgentOrchestrator.js';
import { getScriptConfig } from '../../data/scriptConfigs.js';
import type { ScriptData, GameState, PlayerAction } from '../jubensha/types.js';

export class ScriptRoomManager {
  private rooms: Map<string, ScriptRoomState> = new Map();
  private stateMachines: Map<string, ScriptStateMachine> = new Map();
  private orchestrators: Map<string, AgentOrchestrator> = new Map();
  private io: Server;

  constructor(io: Server) {
    this.io = io;
  }

  public async handlePlayerAction(roomId: string, playerId: string, action: PlayerAction): Promise<void> {
    const orchestrator = this.orchestrators.get(roomId);
    if (!orchestrator) return;

    const response = await orchestrator.routePlayerAction(action);

    const room = this.rooms.get(roomId);
    if (room) {
      this.io.to(roomId).emit('agent_response', response);

      if (response.type === 'dialogue') {
        room.gameLog.push({
          round: room.currentRound,
          phase: room.phase,
          timestamp: new Date().toISOString(),
          event: 'Agent Dialogue',
          details: { content: response.content, metadata: response.metadata }
        });
      }
    }
  }

  public createRoom(payload: CreateScriptRoomPayload, socketId: string): ScriptRoomState {
    const roomId = this.generateRoomId();
    const host: ScriptPlayer = {
      id: this.generatePlayerId(),
      name: payload.playerName,
      type: 'user',
      is_alive: true,
      position: 1,
      socketId,
      isOnline: true,
      isAI: false,
      ap: 3,
    };

    const room: ScriptRoomState = {
      id: roomId,
      name: payload.roomName,
      hostId: host.id,
      phase: 'WAITING',
      players: [host],
      currentRound: 1,
      clues: [],
      publicClueIds: [],
      privateClues: {},
      suspects: {},
      votes: [],
      timer: 0,
      winner: null,
      gameLog: [],
      aiThinkingIds: [],
      isPaused: false,
    };

    this.rooms.set(roomId, room);

    const fsm = new ScriptStateMachine(room, this.io, () => {
      this.broadcastRoomState(roomId);
    });
    this.stateMachines.set(roomId, fsm);

    // Initialize Agent Orchestrator
    // TODO: Pass scriptId in payload. For now, defaulting to school-rule-22 if not found or parsing from somewhere.
    // Assuming we can get scriptId from payload in the future. For now, let's hardcode or pick first.
    const scriptId = 'school-rule-22'; // Default for now
    const scriptConfig = getScriptConfig(scriptId);

    if (scriptConfig) {
      // Map ScriptConfig to ScriptData
      const scriptData: ScriptData = {
        id: scriptConfig.scriptId,
        title: scriptConfig.intro.substring(0, 20), // Use intro as title for now
        scenes: [], // Populate if available
        characters: scriptConfig.characters.map((c: any) => ({
          id: c.id,
          name: c.name,
          role: c.role || 'Unknown',
          avatar: c.avatar || '',
          personality: c.personality || '',
          secrets: c.secrets || [],
          relationships: c.relationships || {},
        })),
        clues: scriptConfig.clues.map((c: any) => ({
          id: c.id,
          name: c.title,
          description: c.description,
          discovered: false,
        })),
        timeline: [],
      };

      // Map ScriptRoomState to GameState
      const gameState: GameState = {
        roomId: room.id,
        scriptId: scriptId,
        currentSceneId: 'default',
        currentPhase: 'investigation', // Map from room.phase
        discoveredClues: [],
        conversationHistory: [],
        timelineProgress: 0,
      };

      // Get handbook path from script config
      const handbookPath = scriptConfig.gameAssets?.handbookPath;

      const orchestrator = new AgentOrchestrator(scriptData, gameState, handbookPath);
      this.orchestrators.set(roomId, orchestrator);
    }

    // Add AI players for all characters in the script
    this.addAIPlayers(roomId, scriptConfig);

    this.broadcastRoomState(roomId);
    return room;
  }

  private addAIPlayers(roomId: string, scriptConfig: any): void {
    if (!scriptConfig || !scriptConfig.characters) return;

    const room = this.rooms.get(roomId);
    if (!room) return;

    // Add AI player for each character
    scriptConfig.characters.forEach((character: any, index: number) => {
      const aiPlayer: ScriptPlayer = {
        id: `ai_${character.id}_${Date.now()}_${index}`,
        name: character.name,
        type: 'ai',
        is_alive: true,
        position: room.players.length + 1,
        socketId: null,
        isOnline: true,
        isAI: true,
        ap: 3,
      };
      room.players.push(aiPlayer);
    });

    this.broadcastRoomState(roomId);
  }

  public joinRoom(roomId: string, payload: JoinScriptRoomPayload, socketId: string | null): ScriptRoomState {
    const room = this.rooms.get(roomId);
    if (!room) throw new Error('Room not found');
    if (room.phase !== 'WAITING') throw new Error('Game already started');

    const player: ScriptPlayer = {
      id: this.generatePlayerId(),
      name: payload.playerName,
      type: payload.isAI ? 'ai' : 'user',
      is_alive: true,
      position: room.players.length + 1,
      socketId,
      isOnline: !payload.isAI,
      isAI: !!payload.isAI,
      ap: 3,
    };

    room.players.push(player);
    this.broadcastRoomState(roomId);
    return room;
  }

  public leaveRoom(roomId: string, playerId: string): void {
    const room = this.rooms.get(roomId);
    if (!room) return;
    room.players = room.players.filter(p => p.id !== playerId);
    if (room.hostId === playerId) {
      room.hostId = room.players[0]?.id || '';
    }
    this.broadcastRoomState(roomId);
  }

  public startScript(roomId: string, playerId: string): void {
    const room = this.rooms.get(roomId);
    if (!room) throw new Error('Room not found');
    if (room.hostId !== playerId) throw new Error('Only host can start');
    if (room.phase !== 'WAITING') throw new Error('Already started');
    const fsm = this.stateMachines.get(roomId);
    fsm?.startGame();
    this.broadcastRoomState(roomId);
  }

  private broadcastRoomState(roomId: string): void {
    const room = this.rooms.get(roomId);
    if (!room) return;
    for (const p of room.players) {
      if (!p.socketId) continue;
      const view = {
        roomId: room.id,
        roomName: room.name,
        myId: p.id,
        phase: room.phase,
        timer: room.timer,
        currentRound: room.currentRound,
        players: room.players.map(x => ({
          id: x.id,
          name: x.name,
          type: x.type,
          is_alive: x.is_alive,
          position: x.position,
          isOnline: x.isOnline,
        })),
        clues: room.clues.filter(c => c.isPublic || room.privateClues[p.id]?.includes(c.id)),
        publicClueIds: room.publicClueIds,
        suspects: room.suspects[p.id] || [],
        votes: room.votes,
        winner: room.winner,
        gameLog: room.gameLog,
      };
      this.io.to(p.socketId).emit('script_room_state', view);
    }
  }

  public getRoom(roomId: string): ScriptRoomState | undefined {
    return this.rooms.get(roomId);
  }

  public getStateMachine(roomId: string): ScriptStateMachine | undefined {
    return this.stateMachines.get(roomId);
  }

  public getAllRooms(): ScriptRoomState[] {
    return Array.from(this.rooms.values());
  }

  private generateRoomId(): string {
    return `script_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  }

  private generatePlayerId(): string {
    return `splayer_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  }
}

