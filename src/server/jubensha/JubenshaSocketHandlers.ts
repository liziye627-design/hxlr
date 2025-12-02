import type { Server, Socket } from 'socket.io';
import { JubenshaRoomManager } from './JubenshaRoomManager.js';
import type {
  CreateRoomPayload,
  JoinRoomPayload,
  SendMessagePayload,
  CheckCluePayload,
  VotePayload,
} from './types.js';

export function registerJubenshaSocketHandlers(io: Server, roomManager: JubenshaRoomManager) {
  io.on('connection', (socket: Socket) => {
    let currentUsername: string | null = null;
    let currentRoomId: string | null = null;

    // 创建房间
    socket.on('jubensha_create_room', (payload: CreateRoomPayload, callback) => {
      try {
        const room = roomManager.createRoom(payload, socket.id);
        currentUsername = payload.username;
        currentRoomId = room.roomId;
        socket.join(room.roomId);
        
        const view = roomManager.getRoomStateView(room.roomId, payload.username);
        const scripts = roomManager.getAvailableScripts(payload.numPerson);
        
        callback({
          success: true,
          roomId: room.roomId,
          roomState: view,
          availableScripts: scripts.map(s => ({
            scriptId: s.scriptId,
            title: s.title,
            description: s.description,
            playerNum: s.playerNum,
          })),
        });
      } catch (e: any) {
        callback({ success: false, error: e.message });
      }
    });

    // 加入房间
    socket.on('jubensha_join_room', (payload: JoinRoomPayload, callback) => {
      try {
        const room = roomManager.joinRoom(payload, socket.id);
        currentUsername = payload.username;
        currentRoomId = room.roomId;
        socket.join(room.roomId);
        
        const view = roomManager.getRoomStateView(room.roomId, payload.username);
        const scripts = roomManager.getAvailableScripts(room.size);
        
        callback({
          success: true,
          roomId: room.roomId,
          roomState: view,
          availableScripts: scripts.map(s => ({
            scriptId: s.scriptId,
            title: s.title,
            description: s.description,
            playerNum: s.playerNum,
          })),
        });
      } catch (e: any) {
        callback({ success: false, error: e.message });
      }
    });

    // 退出房间
    socket.on('jubensha_exit_room', (payload: { roomId: string; username: string }, callback) => {
      try {
        roomManager.exitRoom(payload.roomId, payload.username);
        socket.leave(payload.roomId);
        currentUsername = null;
        currentRoomId = null;
        callback({ success: true });
      } catch (e: any) {
        callback({ success: false, error: e.message });
      }
    });

    // 选择剧本（房主）
    socket.on('jubensha_choose_script', (payload: { roomId: string; scriptId: string }, callback) => {
      try {
        roomManager.chooseScript(payload.roomId, payload.scriptId);
        callback({ success: true });
      } catch (e: any) {
        callback({ success: false, error: e.message });
      }
    });

    // 开始游戏
    socket.on('jubensha_start_game', (payload: { roomId: string }, callback) => {
      try {
        const view = roomManager.startGame(payload.roomId);
        callback({ success: true, roomState: view });
      } catch (e: any) {
        callback({ success: false, error: e.message });
      }
    });

    // 玩家准备/进入下一阶段
    socket.on('jubensha_ready', (payload: { roomId: string; username: string }, callback) => {
      try {
        roomManager.playerReady(payload.roomId, payload.username);
        callback({ success: true });
      } catch (e: any) {
        callback({ success: false, error: e.message });
      }
    });

    // 搜索线索
    socket.on('jubensha_check_clue', (payload: CheckCluePayload & { username: string }, callback) => {
      try {
        roomManager.checkClue(payload.roomId, payload.username, payload.clueId);
        callback({ success: true });
      } catch (e: any) {
        callback({ success: false, error: e.message });
      }
    });

    // 公开线索
    socket.on('jubensha_public_clue', (payload: { roomId: string; username: string; clueId: string }, callback) => {
      try {
        roomManager.publicClue(payload.roomId, payload.username, payload.clueId);
        callback({ success: true });
      } catch (e: any) {
        callback({ success: false, error: e.message });
      }
    });

    // 发送消息
    socket.on('jubensha_send_message', (payload: SendMessagePayload & { username: string }, callback) => {
      try {
        roomManager.sendMessage(payload.roomId, payload.username, payload.message);
        callback({ success: true });
      } catch (e: any) {
        callback({ success: false, error: e.message });
      }
    });

    // 投票
    socket.on('jubensha_vote', (payload: VotePayload & { username: string }, callback) => {
      try {
        roomManager.vote(payload.roomId, payload.username, payload.targetRoleId);
        callback({ success: true });
      } catch (e: any) {
        callback({ success: false, error: e.message });
      }
    });

    // 获取房间状态
    socket.on('jubensha_get_room_state', (payload: { roomId: string; username: string }, callback) => {
      try {
        const view = roomManager.getRoomStateView(payload.roomId, payload.username);
        callback({ success: true, roomState: view });
      } catch (e: any) {
        callback({ success: false, error: e.message });
      }
    });

    // 获取房间列表
    socket.on('jubensha_get_rooms', (callback) => {
      const rooms = roomManager.getAllRooms();
      callback({ success: true, rooms });
    });

    // 获取可用剧本
    socket.on('jubensha_get_scripts', (payload: { playerNum: number }, callback) => {
      const scripts = roomManager.getAvailableScripts(payload.playerNum);
      callback({
        success: true,
        scripts: scripts.map(s => ({
          scriptId: s.scriptId,
          title: s.title,
          description: s.description,
          playerNum: s.playerNum,
        })),
      });
    });

    // 断开连接
    socket.on('disconnect', () => {
      if (currentRoomId && currentUsername) {
        roomManager.exitRoom(currentRoomId, currentUsername);
      }
    });
  });
}
