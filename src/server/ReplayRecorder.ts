import { RoomState, ReplayEvent, ReplayData } from './types';

export class ReplayRecorder {
    private events: ReplayEvent[] = [];
    private startTime: number = Date.now();
    private roomId: string;

    constructor(roomId: string) {
        this.roomId = roomId;
    }

    public addEvent(type: ReplayEvent['type'], payload: any) {
        this.events.push({
            timestamp: Date.now(),
            type,
            payload: JSON.parse(JSON.stringify(payload)), // Deep copy to prevent reference issues
        });
    }

    public getReplayData(roomState: RoomState): ReplayData {
        return {
            roomId: this.roomId,
            roomName: roomState.name,
            startTime: this.startTime,
            endTime: Date.now(),
            players: roomState.players.map(p => ({
                id: p.id,
                name: p.name,
                role: p.role || 'unknown',
                position: p.position,
                avatar: (p.persona as any)?.avatar_url
            })),
            events: this.events,
            winner: roomState.winner
        };
    }
}
