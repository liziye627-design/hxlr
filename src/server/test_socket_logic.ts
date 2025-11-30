
import { RoomManager } from './RoomManager';
import { registerSocketHandlers } from './SocketHandlersEnhanced';
import { Server, Socket } from 'socket.io';
import { createServer } from 'http';
import { io as Client } from 'socket.io-client';

// Mock setup
const httpServer = createServer();
const io = new Server(httpServer);
const roomManager = new RoomManager(io);

registerSocketHandlers(io, roomManager);

httpServer.listen(0, () => {
    const port = (httpServer.address() as any).port;
    console.log(`Test server listening on port ${port}`);

    // Test 1: Create Room
    const client1 = Client(`http://localhost:${port}`);

    client1.on('connect', () => {
        console.log('Client 1 connected');
        client1.emit('create_room', { roomName: 'Test Room', playerName: 'Host' }, (res: any) => {
            console.log('Create Room Result:', res);
            if (res.success) {
                const roomId = res.roomId;
                const playerId = res.playerId;

                // Test 2: Reconnection
                const client2 = Client(`http://localhost:${port}`);
                client2.on('connect', () => {
                    console.log('Client 2 (Reconnecting) connected');
                    // Simulate reconnection with same playerId
                    client2.emit('join_room', { roomId, playerName: 'Host', playerId }, (res2: any) => {
                        console.log('Reconnection Result:', res2);

                        // Verify socket ID update (indirectly via functionality)
                        // Try to perform action with Client 2
                        client2.emit('vote', { roomId, targetId: 'some-target' }, (voteRes: any) => {
                            console.log('Vote Result (Client 2):', voteRes);

                            // Test 3: Spoofing (Client 3 tries to act as Player 1)
                            const client3 = Client(`http://localhost:${port}`);
                            client3.on('connect', () => {
                                console.log('Client 3 (Attacker) connected');
                                // Client 3 is NOT in the room, but tries to send vote for roomId
                                client3.emit('vote', { roomId, targetId: 'some-target' }, (spoofRes: any) => {
                                    console.log('Spoof Vote Result:', spoofRes);

                                    client1.close();
                                    client2.close();
                                    client3.close();
                                    io.close();
                                    httpServer.close();
                                });
                            });
                        });
                    });
                });
            }
        });
    });
});
