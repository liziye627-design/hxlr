import type { Server } from 'socket.io';
import { ScriptStateMachine } from './ScriptStateMachine.js';
import type {
  ScriptRoomState,
  ScriptPlayer,
  CreateScriptRoomPayload,
  JoinScriptRoomPayload,
} from './types.js';

export class ScriptRoomManager {
  private rooms: Map<string, ScriptRoomState> = new Map();
  private stateMachines: Map<string, ScriptStateMachine> = new Map();
  private io: Server;

  constructor(io: Server) {
    this.io = io;
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

    this.broadcastRoomState(roomId);
    return room;
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

