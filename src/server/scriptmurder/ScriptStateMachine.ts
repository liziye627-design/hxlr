import type { Server } from 'socket.io';
import type {
  ScriptRoomState,
  ScriptGamePhase,
  RevealCluePayload,
  AccusePayload,
  ScriptVotePayload,
  WhisperPayload,
  Clue,
  Suspect,
} from './types.js';

export class ScriptStateMachine {
  private room: ScriptRoomState;
  private io: Server;
  private onUpdate: () => void;
  private timerHandle: NodeJS.Timeout | null = null;

  constructor(room: ScriptRoomState, io: Server, onUpdate: () => void) {
    this.room = room;
    this.io = io;
    this.onUpdate = onUpdate;
  }

  public startGame(): void {
    this.room.phase = 'EVIDENCE_SEARCH';
    this.room.timer = 180;
    this.room.gameLog.push({
      round: this.room.currentRound,
      phase: this.room.phase,
      timestamp: new Date().toISOString(),
      event: 'Phase started',
      details: {},
    });
    this.scheduleTick();
    this.onUpdate();
    this.io.to(this.room.id).emit('script_event', { type: 'phase_change', phase: this.room.phase });
  }

  public revealClue(actorId: string, payload: RevealCluePayload): void {
    const clue = this.room.clues.find(c => c.id === payload.clueId);
    if (!clue) return;
    clue.isPublic = true;
    clue.discoveredBy = actorId;
    clue.discoveredAt = new Date().toISOString();
    if (!this.room.publicClueIds.includes(clue.id)) this.room.publicClueIds.push(clue.id);
    this.room.gameLog.push({
      round: this.room.currentRound,
      phase: this.room.phase,
      timestamp: new Date().toISOString(),
      event: 'Clue revealed',
      details: { clueId: clue.id, by: actorId },
    });
    this.onUpdate();
    this.io.to(this.room.id).emit('script_event', { type: 'clue_revealed', clueId: clue.id, by: actorId });
  }

  public submitAccusation(actorId: string, payload: AccusePayload): void {
    const suspects = this.room.suspects[actorId] || [];
    const existing = suspects.find(s => s.playerId === payload.targetId);
    if (existing) {
      existing.suspicion = Math.min(100, existing.suspicion + 15);
      if (payload.reason) existing.notes = [...(existing.notes || []), payload.reason];
    } else {
      const s: Suspect = { playerId: payload.targetId, suspicion: 25, notes: payload.reason ? [payload.reason] : [] };
      this.room.suspects[actorId] = [...suspects, s];
    }
    this.room.gameLog.push({
      round: this.room.currentRound,
      phase: this.room.phase,
      timestamp: new Date().toISOString(),
      event: 'Accusation',
      details: { by: actorId, targetId: payload.targetId, reason: payload.reason },
    });
    this.onUpdate();
    this.io.to(this.room.id).emit('script_event', { type: 'accusation', by: actorId, targetId: payload.targetId });
  }

  public submitVote(actorId: string, payload: ScriptVotePayload): void {
    const existing = this.room.votes.find(v => v.voterId === actorId);
    if (existing) existing.targetId = payload.targetId; else this.room.votes.push({ voterId: actorId, targetId: payload.targetId });
    this.room.gameLog.push({
      round: this.room.currentRound,
      phase: this.room.phase,
      timestamp: new Date().toISOString(),
      event: 'Vote',
      details: { by: actorId, targetId: payload.targetId },
    });
    this.onUpdate();
    this.io.to(this.room.id).emit('script_event', { type: 'vote_cast', by: actorId, targetId: payload.targetId });
  }

  public whisper(actorId: string, payload: WhisperPayload): void {
    const from = this.room.players.find(p => p.id === actorId);
    const to = this.room.players.find(p => p.id === payload.toPlayerId);
    if (!from || !to || !to.socketId) return;
    this.io.to(to.socketId).emit('script_whisper', { fromId: actorId, content: payload.content, timestamp: new Date().toISOString() });
  }

  public advancePhase(): void {
    const next = this.nextPhase(this.room.phase);
    this.room.phase = next;
    if (next === 'INTERROGATION') this.room.timer = 240;
    else if (next === 'ACCUSATION') this.room.timer = 120;
    else if (next === 'VOTE') this.room.timer = 90;
    else if (next === 'REVEAL') this.room.timer = 0;
    else if (next === 'GAME_OVER') this.room.timer = 0;
    if (next === 'REVEAL') this.resolveOutcome();
    this.room.gameLog.push({ round: this.room.currentRound, phase: this.room.phase, timestamp: new Date().toISOString(), event: 'Phase started', details: {} });
    this.scheduleTick();
    this.onUpdate();
    this.io.to(this.room.id).emit('script_event', { type: 'phase_change', phase: this.room.phase });
  }

  private nextPhase(phase: ScriptGamePhase): ScriptGamePhase {
    if (phase === 'EVIDENCE_SEARCH') return 'INTERROGATION';
    if (phase === 'INTERROGATION') return 'ACCUSATION';
    if (phase === 'ACCUSATION') return 'VOTE';
    if (phase === 'VOTE') return 'REVEAL';
    if (phase === 'REVEAL') return 'GAME_OVER';
    return phase;
  }

  private resolveOutcome(): void {
    const tally: Record<string, number> = {};
    for (const v of this.room.votes) tally[v.targetId] = (tally[v.targetId] || 0) + 1;
    const sorted = Object.entries(tally).sort((a, b) => b[1] - a[1]);
    const top = sorted[0];
    if (top) this.room.winner = 'culprit_identified'; else this.room.winner = null;
    this.io.to(this.room.id).emit('script_vote_result', { votes: this.room.votes, winner: this.room.winner });
  }

  private scheduleTick(): void {
    if (this.timerHandle) clearInterval(this.timerHandle);
    if (this.room.timer <= 0) return;
    this.timerHandle = setInterval(() => {
      if (this.room.isPaused) return;
      this.room.timer -= 1;
      if (this.room.timer % 5 === 0) this.io.to(this.room.id).emit('script_timer', { timer: this.room.timer });
      if (this.room.timer <= 0) {
        clearInterval(this.timerHandle!);
        this.timerHandle = null;
        this.advancePhase();
      }
    }, 1000);
  }

  public hostPause(actorId: string): void {
    if (actorId !== this.room.hostId) return;
    this.room.isPaused = true;
    this.io.to(this.room.id).emit('script_event', { type: 'paused' });
  }

  public hostResume(actorId: string): void {
    if (actorId !== this.room.hostId) return;
    this.room.isPaused = false;
    this.io.to(this.room.id).emit('script_event', { type: 'resumed' });
  }

  public destroy(): void {
    if (this.timerHandle) clearInterval(this.timerHandle);
  }
}

