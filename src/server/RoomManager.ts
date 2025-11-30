import type { RoomState, RoomPlayer, CreateRoomPayload } from './types.js';
import { GameStateMachine } from './GameStateMachine.js';
import type { Server } from 'socket.io';
import { generatePersona, type AIPersona } from './AIPersonaSystem.js';
import { ReplayRecorder } from './ReplayRecorder.js';

export class RoomManager {
  private rooms: Map<string, RoomState> = new Map();
  private stateMachines: Map<string, GameStateMachine> = new Map();
  private replayRecorders: Map<string, ReplayRecorder> = new Map();
  private io: Server;

  // Role configuration based on player count
  private static ROLE_CONFIGS: Record<6 | 9 | 12, Record<string, number>> = {
    6: {
      werewolf: 2,
      villager: 2,
      seer: 1,
      witch: 1,
    },
    9: {
      werewolf: 3,
      villager: 3,
      seer: 1,
      witch: 1,
      hunter: 1,
    },
    12: {
      werewolf: 4,
      villager: 4,
      seer: 1,
      witch: 1,
      hunter: 1,
      guard: 1,
    },
  };

  constructor(io: Server) {
    this.io = io;
  }

  // Create a new room
  public createRoom(payload: CreateRoomPayload, socketId: string): RoomState {
    const roomId = this.generateRoomId();

    const hostPlayer: RoomPlayer = {
      id: this.generatePlayerId(),
      name: payload.playerName,
      type: 'user',
      is_alive: true,
      position: 1,
      socketId,
      isOnline: true,
      isAI: false,
      hasActedNight: false,
      hasVoted: false,
      speechHistory: [],
    };

    const room: RoomState = {
      id: roomId,
      name: payload.roomName,
      hostId: hostPlayer.id,
      phase: 'WAITING',
      players: [hostPlayer],
      currentRound: 1,
      nightActions: [],
      votes: [],
      timer: 0,
      winner: null,
      gameLog: [],
      sheriffId: null,
      witchPotions: {
        antidote: true,
        poison: true,
      },
      currentSpeakerOrder: [],
      currentSpeakerIndex: 0,
      currentSpeakerId: null,
      currentSpeakerDeadline: null,
      pendingLastWordsPlayerId: null,
      isSheriffElectionEnabled: true,
      isSheriffElectionDone: false,
      sheriffCandidates: [],
      sheriffVotes: [],
      aiThinkingIds: [],
      isPaused: false,
    };

    this.rooms.set(roomId, room);

    // Create recorder
    const recorder = new ReplayRecorder(roomId);
    this.replayRecorders.set(roomId, recorder);

    // Create state machine
    const fsm = new GameStateMachine(room, this.io, recorder, (updatedRoom) => {
      this.broadcastRoomState(roomId);
    });
    this.stateMachines.set(roomId, fsm);

    this.broadcastRoomState(roomId);

    return room;
  }

  // Join a room
  public joinRoom(
    roomId: string,
    playerName: string,
    socketId: string | null,
    isAI: boolean = false,
  ): RoomState {
    const room = this.rooms.get(roomId);
    if (!room) {
      throw new Error('Room not found');
    }

    if (room.phase !== 'WAITING') {
      throw new Error('Game already started');
    }

    if (room.players.length >= 12) {
      throw new Error('Room is full');
    }

    const player: RoomPlayer = {
      id: this.generatePlayerId(),
      name: playerName,
      type: isAI ? 'ai' : 'user',
      is_alive: true,
      position: room.players.length + 1,
      socketId,
      isOnline: !isAI, // AI玩家始终在线
      isAI,
      hasActedNight: false,
      hasVoted: false,
      speechHistory: [],
      persona: isAI ? this.generateAIPersona() : undefined,
    };

    room.players.push(player);
    this.broadcastRoomState(roomId);

    // 确保AI Agent动态创建
    const fsm = this.stateMachines.get(roomId);
    if (fsm) {
      fsm.refreshAIAgents();
    }

    return room;
  }

  // Leave a room
  public leaveRoom(roomId: string, playerId: string): void {
    const room = this.rooms.get(roomId);
    if (!room) return;

    // Remove player
    room.players = room.players.filter((p) => p.id !== playerId);

    // If host left, assign new host or destroy room
    if (room.hostId === playerId) {
      if (room.players.length > 0) {
        room.hostId = room.players[0].id;
      } else {
        this.destroyRoom(roomId);
        return;
      }
    }

    this.broadcastRoomState(roomId);
  }

  // Start game in a room
  public startGame(roomId: string, playerId: string): void {
    const room = this.rooms.get(roomId);
    if (!room) {
      throw new Error('Room not found');
    }

    if (room.hostId !== playerId) {
      throw new Error('Only host can start game');
    }

    if (room.phase !== 'WAITING') {
      throw new Error('Game already started');
    }

    // Assign roles
    this.assignRoles(room);

    // Start FSM
    const fsm = this.stateMachines.get(roomId);
    if (fsm) {
      fsm.refreshAIAgents();
      fsm.startGame();
    }

    this.broadcastRoleAssignments(roomId);
    this.broadcastRoomState(roomId);
  }

  // Assign roles to players
  private assignRoles(room: RoomState): void {
    const playerCount = room.players.length as 6 | 9 | 12;
    const config = RoomManager.ROLE_CONFIGS[playerCount];

    if (!config) {
      throw new Error(`Invalid player count: ${playerCount}`);
    }

    const roles: string[] = [];
    for (const [role, count] of Object.entries(config)) {
      for (let i = 0; i < count; i++) {
        roles.push(role);
      }
    }

    // Shuffle roles
    for (let i = roles.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [roles[i], roles[j]] = [roles[j], roles[i]];
    }

    // Assign to players
    room.players.forEach((player, index) => {
      player.role = roles[index] as any;
    });
  }

  // Handle player reconnection
  public reconnectPlayer(roomId: string, playerId: string, socketId: string): void {
    const room = this.rooms.get(roomId);
    if (!room) return;

    const player = room.players.find((p) => p.id === playerId);
    if (player) {
      player.socketId = socketId;
      player.isOnline = true;
      this.broadcastRoomState(roomId);
    }
  }

  // Broadcast room state to all players
  private broadcastRoomState(roomId: string): void {
    const room = this.rooms.get(roomId);
    if (!room) return;

    // 为每个玩家发送包含自己角色信息的room_state
    for (const player of room.players) {
      if (!player.socketId) continue; // 跳过AI（没有socketId）

      // 脱敏 gameLog：非预言家看不到 checkResults 细节
      const sanitizedLog = room.gameLog.map((log) => {
        if (log.event === 'Night actions resolved') {
          const { deaths, checkResults, saved, deathReasons } = (log.details || {}) as any;
          return {
            ...log,
            details: {
              deaths,
              saved,
              deathReasons,
              // 仅预言家保留 checkResults
              checkResults: player.role === 'seer' ? checkResults : undefined,
            },
          };
        }
        return log;
      });

      const isWerewolf = player.role === 'werewolf';
      const playerView = {
        roomId: room.id,
        roomName: room.name,
        hostId: room.hostId,
        myId: player.id,
        myRole: player.role, // 发送玩家自己的角色
        players: room.players.map((p) => ({
          id: p.id,
          name: p.name,
          type: p.type,
          is_alive: p.is_alive,
          position: p.position,
          isOnline: p.isOnline,
          hasActedNight: p.hasActedNight,
          hasVoted: p.hasVoted,
          role:
            // 只显示自己的角色、死亡或游戏结束时显示、狼人互看
            p.id === player.id || !p.is_alive || room.phase === 'GAME_OVER' || (isWerewolf && p.role === 'werewolf')
              ? p.role
              : undefined,
        })),
        phase: room.phase,
        timer: room.timer,
        currentRound: room.currentRound,
        currentSpeakerOrder: room.currentSpeakerOrder,
        currentSpeakerIndex: room.currentSpeakerIndex,
        currentSpeakerId: room.currentSpeakerId,
        winner: room.winner,
        gameLog: sanitizedLog,
        sheriffId: room.sheriffId,
        witchPotions: room.witchPotions,
        wolfChats: isWerewolf ? room.wolfChats : undefined,
      };

      this.io.to(player.socketId).emit('room_state', playerView);
      console.log(`发送room_state给 ${player.name}, 角色: ${player.role}`);
    }
  }

  // Get player-specific view of room (hiding secret info)
  private getPlayerView(room: RoomState, playerId: string): any {
    const currentPlayer = room.players.find((p) => p.id === playerId);
    const isWerewolf = currentPlayer?.role === 'werewolf';

    return {
      roomId: room.id,
      roomName: room.name,
      hostId: room.hostId,
      phase: room.phase,
      timer: room.timer,
      currentRound: room.currentRound,
      myRole: currentPlayer?.role,
      myId: playerId,
      sheriffId: room.sheriffId,
      witchPotions: currentPlayer?.role === 'witch' ? room.witchPotions : undefined,
      players: room.players.map((p) => {
        // Determine if role should be visible
        let showRole = false;

        // Always show own role
        if (p.id === playerId) {
          showRole = true;
        }
        // Always show if dead or game over
        else if (!p.is_alive || room.phase === 'GAME_OVER') {
          showRole = true;
        }
        // ⭐ NEW: Werewolves can see their teammates
        else if (isWerewolf && p.role === 'werewolf') {
          showRole = true;
        }

        return {
          id: p.id,
          name: p.name,
          type: p.type,
          is_alive: p.is_alive,
          position: p.position,
          isOnline: p.isOnline,
          hasHunterShot: p.hasHunterShot,
          role: showRole ? p.role : undefined,
        };
      }),
      winner: room.winner,
      gameLog: room.gameLog,
    };
  }

  // Broadcast role assignments (privately)
  private broadcastRoleAssignments(roomId: string): void {
    const room = this.rooms.get(roomId);
    if (!room) return;

    // Send each player their role privately
    for (const player of room.players) {
      if (player.socketId && player.role) {
        this.io.to(player.socketId).emit('role_assign', {
          role: player.role,
        });

        console.log(`角色分配: ${player.name} -> ${player.role}`);
      }
    }
  }

  // Destroy a room
  private destroyRoom(roomId: string): void {
    const fsm = this.stateMachines.get(roomId);
    if (fsm) {
      fsm.destroy();
    }

    this.stateMachines.delete(roomId);
    this.rooms.delete(roomId);

    this.io.to(roomId).emit('room_destroyed');
  }

  // Get room by ID
  public getRoom(roomId: string): RoomState | undefined {
    return this.rooms.get(roomId);
  }

  // Get state machine for room
  public getStateMachine(roomId: string): GameStateMachine | undefined {
    return this.stateMachines.get(roomId);
  }

  // Get all rooms
  public getAllRooms(): RoomState[] {
    return Array.from(this.rooms.values());
  }

  // Generate unique room ID
  private generateRoomId(): string {
    return `room_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Generate unique player ID
  private generatePlayerId(): string {
    return `player_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Generate AI persona
  private generateAIPersona(): AIPersona {
    return generatePersona();
  }

  // Random select from array
  private randomSelect<T>(arr: T[], count: number): T[] {
    const shuffled = [...arr].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, count);
  }

  // Get replay data for a room
  public getReplayData(roomId: string): any {
    const room = this.rooms.get(roomId);
    const recorder = this.replayRecorders.get(roomId);

    if (!room || !recorder) {
      throw new Error('Room or recorder not found');
    }

    return recorder.getReplayData(room);
  }
}
