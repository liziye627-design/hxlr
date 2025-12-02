import type { RoomState, NightAction } from './types.js';
import type { Server } from 'socket.io';
import { ReplayRecorder } from './ReplayRecorder.js';

export class GameStateMachine {
  private room: RoomState;
  private io: Server;
  private recorder: ReplayRecorder;
  private onStateChange: (room: RoomState) => void;

  constructor(room: RoomState, io: Server, recorder: ReplayRecorder, onStateChange: (room: RoomState) => void) {
    this.room = room;
    this.io = io;
    this.recorder = recorder;
    this.onStateChange = onStateChange;
  }

  public refreshAIAgents(): void {}

  public startGame(): void {
    if (this.room.phase !== 'WAITING') return;
    this.room.phase = 'NIGHT';
    this.onStateChange(this.room);
  }

  public submitNightAction(action: NightAction): void {
    if (this.room.phase !== 'NIGHT') return;
    this.room.nightActions = this.room.nightActions.filter(a => a.playerId !== action.playerId);
    this.room.nightActions.push(action);
    const p = this.room.players.find(pl => pl.id === action.playerId);
    if (p) p.hasActedNight = true;
  }

  public submitVote(voterId: string, targetId: string): void {
    if (this.room.phase !== 'DAY_VOTE') return;
    this.room.votes = this.room.votes.filter(v => v.voterId !== voterId);
    if (targetId) this.room.votes.push({ voterId, targetId });
    const p = this.room.players.find(pl => pl.id === voterId);
    if (p) p.hasVoted = true;
  }

  public submitHunterShoot(playerId: string, targetId: string): void {
    if (this.room.phase !== 'HUNTER_SHOOT') return;
    const target = this.room.players.find(p => p.id === targetId);
    if (target && target.is_alive) target.is_alive = false;
  }

  public submitBadgeTransfer(playerId: string, targetId: string): void {
    if (this.room.phase !== 'BADGE_TRANSFER') return;
    if (this.room.sheriffId !== playerId) return;
    this.room.sheriffId = targetId;
  }

  public hostPauseGame(hostId: string): void {
    if (this.room.hostId !== hostId) return;
    this.room.isPaused = true;
    this.io.to(this.room.id).emit('game_paused', { by: hostId });
    this.onStateChange(this.room);
  }

  public hostResumeGame(hostId: string): void {
    if (this.room.hostId !== hostId) return;
    this.room.isPaused = false;
    this.io.to(this.room.id).emit('game_resumed', { by: hostId });
    this.onStateChange(this.room);
  }

  public hostForceSkip(hostId: string): void {
    if (this.room.hostId !== hostId) return;
    this.nextSpeaker();
  }

  public handleSpeechEnd(playerId: string): void {
    if (this.room.currentSpeakerId !== playerId) return;
    this.nextSpeaker();
  }

  public debugRestoreToDayDiscuss(speakerId?: string): void {
    this.room.phase = 'DAY_DISCUSS';
    this.room.currentSpeakerOrder = this.room.players.filter(p => p.is_alive).sort((a, b) => a.position - b.position).map(p => p.id);
    this.room.currentSpeakerIndex = 0;
    const targetId = speakerId || this.room.currentSpeakerOrder[0] || null;
    this.room.currentSpeakerId = targetId || null;
    this.io.to(this.room.id).emit('speaker_change', {
      speakerId: this.room.currentSpeakerId,
      deadline: null,
      orderIndex: this.room.currentSpeakerIndex,
      orderTotal: this.room.currentSpeakerOrder.length,
    });
    this.onStateChange(this.room);
  }

  private nextSpeaker(): void {
    const order = this.room.currentSpeakerOrder || [];
    const nextIndex = (this.room.currentSpeakerIndex || 0) + 1;
    if (nextIndex >= order.length) {
      this.room.phase = 'DAY_VOTE';
      this.onStateChange(this.room);
      return;
    }
    this.room.currentSpeakerIndex = nextIndex;
    this.room.currentSpeakerId = order[nextIndex] || null;
    this.io.to(this.room.id).emit('speaker_change', {
      speakerId: this.room.currentSpeakerId,
      deadline: null,
      orderIndex: this.room.currentSpeakerIndex,
      orderTotal: order.length,
    });
    this.onStateChange(this.room);
  }
}

