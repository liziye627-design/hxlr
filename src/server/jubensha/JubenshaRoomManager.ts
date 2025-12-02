import type { Server } from 'socket.io';
import type {
  JubenshaRoom,
  JubenshaPlayer,
  JubenshaScript,
  JubenshaRole,
  JubenshaClue,
  JubenshaDialogue,
  GameStage,
  RoomStateView,
  CreateRoomPayload,
  JoinRoomPayload,
} from './types.js';
import { DEMO_SCRIPTS } from './demoScripts.js';

const STAGES: GameStage[] = ['SCRIPT', 'INTRO', 'CLUE', 'DISCUSSION', 'VOTE', 'TRUTH'];

export class JubenshaRoomManager {
  private rooms: Map<string, JubenshaRoom> = new Map();
  private userToRoom: Map<string, string> = new Map(); // username -> roomId
  private io: Server;

  constructor(io: Server) {
    this.io = io;
  }

  // 创建房间
  createRoom(payload: CreateRoomPayload, socketId: string): JubenshaRoom {
    const { numPerson, username } = payload;
    
    if (numPerson < 2) {
      throw new Error('房间至少需要2人');
    }
    
    if (this.userToRoom.has(username)) {
      throw new Error(`${username} 已在其他房间中，请先退出`);
    }

    const roomId = this.generateId('room');
    const playerId = this.generateId('player');

    const player: JubenshaPlayer = {
      playerId,
      playerRoomId: 0,
      userId: username,
      userName: username,
      roleId: null,
      role: null,
      roomId,
      isMaster: true,
      movementPoint: 1,
      readyStatus: 0,
    };

    const room: JubenshaRoom = {
      roomId,
      size: numPerson,
      stage: 'SCRIPT',
      stageIndex: 0,
      scriptId: null,
      script: null,
      players: [player],
      clues: [],
      roles: [],
      discoveredClues: new Map(),
      dialogues: [],
      votes: new Map(),
      createdAt: new Date().toISOString(),
    };

    this.rooms.set(roomId, room);
    this.userToRoom.set(username, roomId);

    return room;
  }

  // 加入房间
  joinRoom(payload: JoinRoomPayload, socketId: string): JubenshaRoom {
    const { roomId, username } = payload;
    
    const room = this.rooms.get(roomId);
    if (!room) {
      throw new Error('房间不存在');
    }

    if (this.userToRoom.has(username)) {
      const existingRoomId = this.userToRoom.get(username);
      if (existingRoomId !== roomId) {
        throw new Error(`${username} 已在其他房间中，请先退出`);
      }
      // 已在此房间，返回房间信息
      return room;
    }

    if (room.players.length >= room.size) {
      throw new Error('房间已满');
    }

    if (room.stageIndex > 0) {
      throw new Error('游戏已开始，无法加入');
    }

    const playerId = this.generateId('player');
    const playerRoomId = this.getNextPlayerRoomId(room);

    const player: JubenshaPlayer = {
      playerId,
      playerRoomId,
      userId: username,
      userName: username,
      roleId: null,
      role: null,
      roomId,
      isMaster: false,
      movementPoint: 1,
      readyStatus: 0,
    };

    room.players.push(player);
    this.userToRoom.set(username, roomId);

    this.broadcastRoomState(roomId);
    return room;
  }

  // 退出房间
  exitRoom(roomId: string, username: string): void {
    const room = this.rooms.get(roomId);
    if (!room) return;

    const playerIndex = room.players.findIndex(p => p.userName === username);
    if (playerIndex === -1) return;

    const player = room.players[playerIndex];
    const wasMaster = player.isMaster;

    room.players.splice(playerIndex, 1);
    this.userToRoom.delete(username);

    if (room.players.length === 0) {
      this.rooms.delete(roomId);
      return;
    }

    // 如果房主离开，转移房主
    if (wasMaster && room.players.length > 0) {
      room.players[0].isMaster = true;
      room.stageIndex = 0;
      room.stage = 'SCRIPT';
      room.players.forEach(p => p.readyStatus = 0);
    }

    this.broadcastRoomState(roomId);
  }

  // 选择剧本
  chooseScript(roomId: string, scriptId: string): void {
    const room = this.rooms.get(roomId);
    if (!room) throw new Error('房间不存在');

    const script = DEMO_SCRIPTS.find(s => s.scriptId === scriptId);
    if (!script) throw new Error('剧本不存在');

    if (script.playerNum !== room.size) {
      throw new Error(`剧本需要 ${script.playerNum} 人，房间大小为 ${room.size} 人`);
    }

    room.scriptId = scriptId;
    room.script = script;
    room.roles = script.roles || [];
    room.clues = script.clues || [];

    this.broadcastRoomState(roomId);
  }

  // 开始游戏
  startGame(roomId: string): RoomStateView {
    const room = this.rooms.get(roomId);
    if (!room) throw new Error('房间不存在');
    if (!room.script) throw new Error('请先选择剧本');
    if (room.players.length !== room.size) {
      throw new Error(`需要 ${room.size} 名玩家，当前 ${room.players.length} 人`);
    }

    // 分配角色
    const roles = [...room.roles];
    room.players.forEach((player, index) => {
      if (roles[index]) {
        player.roleId = roles[index].roleId;
        player.role = roles[index];
      }
    });

    room.stageIndex = 1;
    room.stage = 'INTRO';

    this.broadcastRoomState(roomId);
    return this.getRoomStateView(roomId, room.players[0].userName);
  }

  // 玩家准备/进入下一阶段
  playerReady(roomId: string, username: string): void {
    const room = this.rooms.get(roomId);
    if (!room) throw new Error('房间不存在');

    const player = room.players.find(p => p.userName === username);
    if (!player) throw new Error('玩家不在房间中');

    player.readyStatus = room.stageIndex;

    // 检查是否所有玩家都准备好了
    const allReady = room.players.every(p => p.readyStatus >= room.stageIndex);
    if (allReady && room.stageIndex < 5) {
      room.stageIndex++;
      room.stage = STAGES[room.stageIndex];
      
      // 进入线索环节时重置行动点
      if (room.stage === 'CLUE') {
        room.players.forEach(p => p.movementPoint = 1);
      }
    }

    this.broadcastRoomState(roomId);
  }

  // 搜索线索
  checkClue(roomId: string, username: string, clueId: string): void {
    const room = this.rooms.get(roomId);
    if (!room) throw new Error('房间不存在');

    const player = room.players.find(p => p.userName === username);
    if (!player) throw new Error('玩家不在房间中');

    if (room.stage !== 'CLUE') {
      throw new Error('当前不是线索环节');
    }

    if (player.movementPoint <= 0) {
      throw new Error('行动点不足');
    }

    const clue = room.clues.find(c => c.clueId === clueId);
    if (!clue) throw new Error('线索不存在');

    // 检查线索是否已被发现
    if (room.discoveredClues.has(clueId)) {
      throw new Error('该线索已被其他玩家发现');
    }

    room.discoveredClues.set(clueId, {
      playerId: player.playerId,
      isPublic: false,
    });
    player.movementPoint--;

    this.broadcastRoomState(roomId);
  }

  // 公开线索
  publicClue(roomId: string, username: string, clueId: string): void {
    const room = this.rooms.get(roomId);
    if (!room) throw new Error('房间不存在');

    const player = room.players.find(p => p.userName === username);
    if (!player) throw new Error('玩家不在房间中');

    const clueInfo = room.discoveredClues.get(clueId);
    if (!clueInfo) throw new Error('线索未被发现');
    if (clueInfo.playerId !== player.playerId) {
      throw new Error('只能公开自己发现的线索');
    }

    clueInfo.isPublic = true;
    this.broadcastRoomState(roomId);
  }

  // 发送消息
  sendMessage(roomId: string, username: string, content: string): void {
    const room = this.rooms.get(roomId);
    if (!room) throw new Error('房间不存在');

    const player = room.players.find(p => p.userName === username);
    if (!player) throw new Error('玩家不在房间中');

    const dialogue: JubenshaDialogue = {
      dialogueId: this.generateId('msg'),
      roomId,
      playerId: player.playerId,
      playerName: player.userName,
      content,
      sendTime: new Date().toISOString(),
    };

    room.dialogues.push(dialogue);
    
    // 只保留最近100条消息
    if (room.dialogues.length > 100) {
      room.dialogues = room.dialogues.slice(-100);
    }

    this.io.to(roomId).emit('jubensha_message', dialogue);
  }

  // 投票
  vote(roomId: string, username: string, targetRoleId: string): void {
    const room = this.rooms.get(roomId);
    if (!room) throw new Error('房间不存在');

    if (room.stage !== 'VOTE') {
      throw new Error('当前不是投票环节');
    }

    const player = room.players.find(p => p.userName === username);
    if (!player) throw new Error('玩家不在房间中');

    room.votes.set(player.playerId, targetRoleId);
    this.broadcastRoomState(roomId);
  }

  // 获取房间状态视图
  getRoomStateView(roomId: string, username: string): RoomStateView {
    const room = this.rooms.get(roomId);
    if (!room) throw new Error('房间不存在');

    const myPlayer = room.players.find(p => p.userName === username);
    const canShowTruth = room.stage === 'TRUTH';

    return {
      roomId: room.roomId,
      roomSize: room.size,
      stage: room.stage,
      stageIndex: room.stageIndex,
      scriptId: room.scriptId,
      scriptTitle: room.script?.title || null,
      players: room.players.map(p => ({
        playerId: p.playerId,
        playerRoomId: p.playerRoomId,
        name: p.userName,
        roleId: p.roleId,
        roleName: p.role?.roleName || null,
        isMaster: p.isMaster,
        isReady: p.readyStatus >= room.stageIndex,
      })),
      myPlayer: myPlayer ? {
        playerId: myPlayer.playerId,
        playerRoomId: myPlayer.playerRoomId,
        roleId: myPlayer.roleId,
        roleName: myPlayer.role?.roleName || null,
        background: myPlayer.role?.background || '',
        timeline: myPlayer.role?.timeline || '',
        task: myPlayer.role?.task || '',
        isMurder: myPlayer.role?.isMurder || false,
        movementPoint: myPlayer.movementPoint,
      } : null,
      roleInfo: room.roles.map(r => ({
        roleId: r.roleId,
        roleScriptId: r.roleScriptId,
        roleName: r.roleName,
        roleDescription: r.roleDescription,
      })),
      clueInfo: room.clues.map(c => {
        const discovered = room.discoveredClues.get(c.clueId);
        return {
          clueId: c.clueId,
          clueScriptId: c.clueScriptId,
          roleId: c.roleId,
          text: c.text,
          description: discovered ? c.clueDescription : '',
          discovered: !!discovered,
          isPublic: discovered?.isPublic || false,
          ownerId: discovered?.playerId || null,
        };
      }),
      dialogues: room.dialogues,
      murder: canShowTruth && room.script ? {
        roleId: room.script.murderId || '',
        roleName: room.roles.find(r => r.roleId === room.script?.murderId)?.roleName || '',
      } : null,
      canShowTruth,
    };
  }

  // 获取可选剧本列表
  getAvailableScripts(playerNum: number): JubenshaScript[] {
    return DEMO_SCRIPTS.filter(s => s.playerNum === playerNum);
  }

  // 获取所有房间列表
  getAllRooms(): Array<{ roomId: string; size: number; currentPlayers: number; stage: GameStage; scriptTitle: string | null }> {
    return Array.from(this.rooms.values()).map(room => ({
      roomId: room.roomId,
      size: room.size,
      currentPlayers: room.players.length,
      stage: room.stage,
      scriptTitle: room.script?.title || null,
    }));
  }

  getRoom(roomId: string): JubenshaRoom | undefined {
    return this.rooms.get(roomId);
  }

  private broadcastRoomState(roomId: string): void {
    const room = this.rooms.get(roomId);
    if (!room) return;

    room.players.forEach(player => {
      const view = this.getRoomStateView(roomId, player.userName);
      this.io.to(roomId).emit('jubensha_room_state', view);
    });
  }

  private getNextPlayerRoomId(room: JubenshaRoom): number {
    const usedIds = new Set(room.players.map(p => p.playerRoomId));
    for (let i = 0; i < room.size; i++) {
      if (!usedIds.has(i)) return i;
    }
    return room.players.length;
  }

  private generateId(prefix: string): string {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  }
}
