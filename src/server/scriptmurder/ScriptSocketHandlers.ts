import type { Server, Socket } from 'socket.io';
import { ScriptRoomManager } from './ScriptRoomManager.js';
import type {
  CreateScriptRoomPayload,
  JoinScriptRoomPayload,
  RevealCluePayload,
  AccusePayload,
  ScriptVotePayload,
  WhisperPayload,
} from './types.js';
import type { PlayerAction } from '../jubensha/types.js';

const getPlayerBySocket = (roomManager: ScriptRoomManager, socketId: string) => {
  const rooms = roomManager.getAllRooms();
  for (const room of rooms) {
    const player = room.players.find(p => p.socketId === socketId);
    if (player) return { room, player };
  }
  return null;
};

export function registerScriptSocketHandlers(io: Server, roomManager: ScriptRoomManager) {
  io.on('connection', (socket: Socket) => {
    socket.on('create_script_room', (payload: CreateScriptRoomPayload, callback) => {
      try {
        const room = roomManager.createRoom(payload, socket.id);
        socket.join(room.id);
        callback({ success: true, roomId: room.id, playerId: room.players[0].id });
      } catch (e: any) {
        callback({ success: false, error: e.message });
      }
    });

    socket.on('join_script_room', (payload: JoinScriptRoomPayload, callback) => {
      try {
        const room = roomManager.joinRoom(payload.roomId, payload, payload.isAI ? null : socket.id);
        if (!payload.isAI) socket.join(room.id);
        const player = room.players.find(p => (payload.isAI ? p.name === payload.playerName : p.socketId === socket.id));
        callback({ success: true, roomId: room.id, playerId: player?.id });
      } catch (e: any) {
        callback({ success: false, error: e.message });
      }
    });

    socket.on('start_script', ({ roomId, playerId }, callback) => {
      const data = getPlayerBySocket(roomManager, socket.id);
      if (!data || data.room.id !== roomId || data.player.id !== playerId) return callback({ success: false, error: 'Auth failed' });
      try {
        roomManager.startScript(roomId, playerId);
        callback({ success: true });
      } catch (e: any) {
        callback({ success: false, error: e.message });
      }
    });

    socket.on('reveal_clue', ({ roomId, payload }: { roomId: string; payload: RevealCluePayload }, callback) => {
      const data = getPlayerBySocket(roomManager, socket.id);
      if (!data || data.room.id !== roomId) return callback({ success: false, error: 'Auth failed' });
      try {
        const fsm = roomManager.getStateMachine(roomId);
        fsm?.revealClue(data.player.id, payload);
        callback({ success: true });
      } catch (e: any) {
        callback({ success: false, error: e.message });
      }
    });

    socket.on('accuse', ({ roomId, payload }: { roomId: string; payload: AccusePayload }, callback) => {
      const data = getPlayerBySocket(roomManager, socket.id);
      if (!data || data.room.id !== roomId) return callback({ success: false, error: 'Auth failed' });
      try {
        const fsm = roomManager.getStateMachine(roomId);
        fsm?.submitAccusation(data.player.id, payload);
        callback({ success: true });
      } catch (e: any) {
        callback({ success: false, error: e.message });
      }
    });

    socket.on('script_vote', ({ roomId, payload }: { roomId: string; payload: ScriptVotePayload }, callback) => {
      const data = getPlayerBySocket(roomManager, socket.id);
      if (!data || data.room.id !== roomId) return callback({ success: false, error: 'Auth failed' });
      try {
        const fsm = roomManager.getStateMachine(roomId);
        fsm?.submitVote(data.player.id, payload);
        callback({ success: true });
      } catch (e: any) {
        callback({ success: false, error: e.message });
      }
    });

    socket.on('whisper', ({ roomId, payload }: { roomId: string; payload: WhisperPayload }) => {
      const data = getPlayerBySocket(roomManager, socket.id);
      if (!data || data.room.id !== roomId) return;
      const fsm = roomManager.getStateMachine(roomId);
      fsm?.whisper(data.player.id, payload);
    });

    socket.on('host_pause_script', ({ roomId, playerId }, callback) => {
      const data = getPlayerBySocket(roomManager, socket.id);
      if (!data || data.room.id !== roomId || data.player.id !== playerId) return callback({ success: false, error: 'Auth failed' });
      const fsm = roomManager.getStateMachine(roomId);
      fsm?.hostPause(playerId);
      callback({ success: true });
    });

    socket.on('host_resume_script', ({ roomId, playerId }, callback) => {
      const data = getPlayerBySocket(roomManager, socket.id);
      if (!data || data.room.id !== roomId || data.player.id !== playerId) return callback({ success: false, error: 'Auth failed' });
      const fsm = roomManager.getStateMachine(roomId);
      fsm?.hostResume(playerId);
      callback({ success: true });
    });

    socket.on('script_action', ({ roomId, action }: { roomId: string; action: PlayerAction }, callback) => {
      const data = getPlayerBySocket(roomManager, socket.id);
      if (!data || data.room.id !== roomId) return callback({ success: false, error: 'Auth failed' });
      try {
        roomManager.handlePlayerAction(roomId, data.player.id, action);
        callback({ success: true });
      } catch (e: any) {
        callback({ success: false, error: e.message });
      }
    });

    socket.on('get_script_rooms', (callback) => {
      const rooms = roomManager.getAllRooms();
      callback({
        rooms: rooms.filter(r => r.phase === 'WAITING').map(r => ({ id: r.id, name: r.name, currentPlayers: r.players.length, phase: r.phase })),
      });
    });

    socket.on('disconnect', () => {
      const data = getPlayerBySocket(roomManager, socket.id);
      if (data) {
        data.player.isOnline = false;
        io.to(data.room.id).emit('player_offline', { playerId: data.player.id });
      }
    });
  });
}

