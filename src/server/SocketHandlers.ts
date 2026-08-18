import type { Server, Socket } from 'socket.io';
import type { RoomManager } from './RoomManager.js';
import type {
  CreateRoomPayload,
  JoinRoomPayload,
  NightActionPayload,
  VotePayload,
  ChatMessagePayload,
} from './types.js';

export function registerSocketHandlers(io: Server, roomManager: RoomManager) {
  io.on('connection', (socket: Socket) => {
    console.log(`Client connected: ${socket.id}`);

    // Create room
    socket.on('create_room', (payload: CreateRoomPayload, callback) => {
      try {
        const room = roomManager.createRoom(payload, socket.id);

        // Join socket.io room
        socket.join(room.id);

        callback({ success: true, roomId: room.id, playerId: room.players[0].id });

        console.log(`Room created: ${room.id} by ${socket.id}`);
      } catch (error: any) {
        console.error('Error creating room:', error);
        callback({ success: false, error: error.message });
      }
    });

    // Join room
    socket.on('join_room', (payload: JoinRoomPayload, callback) => {
      try {
        const { roomId, playerName, isAI = false } = payload;

        const room = roomManager.joinRoom(
          roomId,
          playerName,
          isAI ? null : socket.id, // AI\u73a9\u5bb6\u4e0d\u9700\u8981socketId
          isAI,
        );

        // \u53ea\u6709\u771f\u4eba\u73a9\u5bb6\u52a0\u5165socket.io\u623f\u95f4
        if (!isAI) {
          socket.join(room.id);
        }

        const player = room.players.find((p) =>
          isAI ? p.name === playerName : p.socketId === socket.id,
        );
        callback({ success: true, roomId: room.id, playerId: player?.id });

        console.log(`${isAI ? 'AI' : 'Player'} joined room: ${room.id}`);
      } catch (error: any) {
        console.error('Error joining room:', error);
        callback({ success: false, error: error.message });
      }
    });

    // Leave room
    socket.on('leave_room', ({ roomId, playerId }) => {
      try {
        roomManager.leaveRoom(roomId, playerId);
        socket.leave(roomId);

        console.log(`Player ${playerId} left room: ${roomId}`);
      } catch (error) {
        console.error('Error leaving room:', error);
      }
    });

    // Start game
    socket.on('start_game', ({ roomId, playerId }, callback) => {
      try {
        roomManager.startGame(roomId, playerId);
        callback({ success: true });

        console.log(`Game started in room: ${roomId}`);
      } catch (error: any) {
        console.error('Error starting game:', error);
        callback({ success: false, error: error.message });
      }
    });

    // Night action
    socket.on(
      'night_action',
      (
        {
          roomId,
          playerId,
          action,
        }: {
          roomId: string;
          playerId: string;
          action: NightActionPayload;
        },
        callback,
      ) => {
        try {
          const fsm = roomManager.getStateMachine(roomId);
          if (!fsm) {
            throw new Error('Room not found');
          }

          fsm.submitNightAction({
            playerId,
            role: '', // Will be filled from player's actual role
            actionType: action.actionType,
            targetId: action.targetId,
          });

          callback({ success: true });

          console.log(`Night action submitted by ${playerId} in room ${roomId}`);
        } catch (error: any) {
          console.error('Error submitting night action:', error);
          callback({ success: false, error: error.message });
        }
      },
    );

    // Vote
    socket.on(
      'vote',
      (
        {
          roomId,
          playerId,
          targetId,
        }: {
          roomId: string;
          playerId: string;
          targetId: string;
        },
        callback,
      ) => {
        try {
          const fsm = roomManager.getStateMachine(roomId);
          if (!fsm) {
            throw new Error('Room not found');
          }

          fsm.submitVote(playerId, targetId);
          callback({ success: true });

          console.log(`Vote submitted by ${playerId} in room ${roomId}`);
        } catch (error: any) {
          console.error('Error submitting vote:', error);
          callback({ success: false, error: error.message });
        }
      },
    );

    // Hunter shoot
    socket.on(
      'hunter_shoot',
      (
        {
          roomId,
          playerId,
          targetId,
        }: {
          roomId: string;
          playerId: string;
          targetId: string;
        },
        callback,
      ) => {
        try {
          const fsm = roomManager.getStateMachine(roomId);
          if (!fsm) {
            throw new Error('Room not found');
          }

          fsm.submitHunterShoot(playerId, targetId);
          callback({ success: true });

          console.log(`Hunter shoot submitted by ${playerId} in room ${roomId}`);
        } catch (error: any) {
          console.error('Error submitting hunter shoot:', error);
          callback({ success: false, error: error.message });
        }
      },
    );

    // Badge transfer
    socket.on(
      'badge_transfer',
      (
        {
          roomId,
          playerId,
          targetId,
        }: {
          roomId: string;
          playerId: string;
          targetId: string;
        },
        callback,
      ) => {
        try {
          const fsm = roomManager.getStateMachine(roomId);
          if (!fsm) {
            throw new Error('Room not found');
          }

          fsm.submitBadgeTransfer(playerId, targetId);
          callback({ success: true });

          console.log(`Badge transfer submitted by ${playerId} in room ${roomId}`);
        } catch (error: any) {
          console.error('Error submitting badge transfer:', error);
          callback({ success: false, error: error.message });
        }
      },
    );

    // Chat message
    socket.on(
      'chat_message',
      ({ roomId, playerId, content }: { roomId: string; playerId: string; content: string }) => {
        try {
          const room = roomManager.getRoom(roomId);
          if (!room) return;

          const player = room.players.find((p) => p.id === playerId);
          if (!player) return;

          // Broadcast chat message to room
          io.to(roomId).emit('chat_message', {
            id: `msg_${Date.now()}`,
            senderId: playerId,
            senderName: player.name,
            content,
            timestamp: new Date().toISOString(),
            phase: room.phase,
          });
        } catch (error) {
          console.error('Error sending chat message:', error);
        }
      },
    );

    // Get room list
    socket.on('get_rooms', (callback) => {
      const rooms = roomManager.getAllRooms();
      callback({
        rooms: rooms
          .filter((r) => r.phase === 'WAITING')
          .map((r) => ({
            id: r.id,
            name: r.name,
            currentPlayers: r.players.length,
            maxPlayers: 12,
            phase: r.phase,
          })),
      });
    });

    // Disconnect
    socket.on('disconnect', () => {
      console.log(`Client disconnected: ${socket.id}`);

      // Handle player disconnect (mark as offline, don't remove)
      // This allows reconnection
      const rooms = roomManager.getAllRooms();
      for (const room of rooms) {
        const player = room.players.find((p) => p.socketId === socket.id);
        if (player) {
          player.isOnline = false;
          // Could add timeout to auto-leave if offline too long
        }
      }
    });
  });
}
