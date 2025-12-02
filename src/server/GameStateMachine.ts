import type { RoomState, GamePhase, NightAction, RoomPlayer } from './types.js';
import { AIAgentEnhanced } from './AIAgentEnhanced.js';
import { getAIPersona } from './AIPersonaSystem.js';
import type { Server } from 'socket.io';
import { ReplayRecorder } from './ReplayRecorder.js';

export class GameStateMachine {
  private room: RoomState;
  private phaseTimer: NodeJS.Timeout | null = null;
  private onStateChange: (room: RoomState) => void;
  private aiAgents: Map<string, AIAgentEnhanced> = new Map(); // AI Agent映射
  private io: Server; // Socket.IO server instance
  private recorder: ReplayRecorder;
  // AI发言预加载缓存
  private aiSpeechCache: Map<string, Promise<{ speech: string; reasoning: any[]; debugUpdates?: any[] }>> = new Map();

  // Phase durations in seconds
  private static PHASE_DURATIONS: Record<GamePhase, number> = {
    WAITING: 0,
    NIGHT: 60,
    DAY_MORNING_RESULT: 15,
    DAY_DISCUSS: 60, // Per speaker duration is dynamic, this is fallback
    DAY_VOTE: 45,
    DAY_DEATH_LAST_WORDS: 0,
    SHERIFF_ELECTION_DISCUSS: 60,
    SHERIFF_ELECTION_VOTE: 30,
    HUNTER_SHOOT: 30,
    BADGE_TRANSFER: 30,
    GAME_OVER: 0,
  };

  constructor(room: RoomState, io: Server, recorder: ReplayRecorder, onStateChange: (room: RoomState) => void) {
    this.room = room;
    this.io = io;
    this.recorder = recorder;
    this.onStateChange = onStateChange;
    this.initializeAIControllers();
  }

  // 初始化AI Agent
  private initializeAIControllers(): void {
    for (const player of this.room.players) {
      if (player.type === 'ai' && player.persona) {
        const personaConfig = getAIPersona(player.persona.id || 'friendly');
        if (personaConfig) {
          const agent = new AIAgentEnhanced(player, personaConfig, this.room);
          this.aiAgents.set(player.id, agent);
        }
      }
    }
  }

  // 动态刷新AI Agent（AI补位或重新分配身份后）
  public refreshAIAgents(): void {
    for (const player of this.room.players) {
      if (player.type === 'ai' && player.persona) {
        if (!this.aiAgents.has(player.id)) {
          const personaConfig = getAIPersona(player.persona.id || 'friendly');
          if (personaConfig) {
            const agent = new AIAgentEnhanced(player, personaConfig, this.room);
            this.aiAgents.set(player.id, agent);
          }
        } else {
          const agent = this.aiAgents.get(player.id)!;
          agent.updateGameState(this.room);
        }
      }
    }
  }

  // Start the game from WAITING phase
  public startGame(): void {
    if (this.room.phase !== 'WAITING') {
      throw new Error('Game already started');
    }
    this.transitionTo('NIGHT');
  }

  // Transition to a new phase
  private transitionTo(newPhase: GamePhase): void {
    this.clearTimer();

    // 阶段切换时清空AI发言缓存
    if (newPhase === 'NIGHT' || newPhase === 'DAY_VOTE' || newPhase === 'GAME_OVER') {
      this.clearAICache();
    }

    this.room.phase = newPhase;
    this.room.timer = GameStateMachine.PHASE_DURATIONS[newPhase];

    // Add to game log
    this.room.gameLog.push({
      round: this.room.currentRound,
      phase: newPhase,
      timestamp: new Date().toISOString(),
      event: `Phase transition to ${newPhase}`,
      details: {},
    });

    // Record replay event
    this.recorder.addEvent('phase', {
      phase: newPhase,
      round: this.room.currentRound,
    });

    // Execute phase-specific logic
    this.onPhaseEnter(newPhase);

    // Notify state change
    this.onStateChange(this.room);

    // Start timer if phase has duration (and not handled by custom logic like sequential speech)
    if (this.room.timer > 0 &&
      newPhase !== 'DAY_DISCUSS' &&
      newPhase !== 'SHERIFF_ELECTION_DISCUSS' &&
      newPhase !== 'DAY_DEATH_LAST_WORDS') {
      this.startTimer();
    }
  }

  // Called when entering a new phase
  private onPhaseEnter(phase: GamePhase): void {
    switch (phase) {
      case 'NIGHT':
        this.resetNightActions();
        // 夜晚采用顺序调度，禁用全局倒计时，由内部序列控制
        this.room.timer = 0;
        this.runNightSequence();
        break;
      case 'DAY_MORNING_RESULT':
        this.resolveNightActions();
        break;
      case 'DAY_DISCUSS':
        this.startDayDiscussion();
        break;
      case 'DAY_VOTE':
        this.resetVotes();
        // AI自动投票
        this.handleAIVotes();
        break;
      case 'DAY_DEATH_LAST_WORDS':
        // 遗言阶段逻辑，通常由外部触发设置 pendingLastWordsPlayerId
        if (this.room.pendingLastWordsPlayerId) {
          this.setCurrentSpeaker(this.room.pendingLastWordsPlayerId, 0);
        }
        break;
      case 'SHERIFF_ELECTION_DISCUSS':
        this.startSheriffElectionDiscussion();
        break;
      case 'SHERIFF_ELECTION_VOTE':
        this.startSheriffElectionVoting();
        break;
      case 'HUNTER_SHOOT':
      case 'BADGE_TRANSFER':
        break;
      case 'GAME_OVER':
        this.clearTimer();
        break;
    }
  }

  // Start countdown timer for current phase
  private startTimer(): void {
    this.phaseTimer = setInterval(() => {
      // 专为发言阶段：根据deadline驱动，避免双重触发导致时间跳快
      if (this.room.phase === 'DAY_DISCUSS' || this.room.phase === 'DAY_DEATH_LAST_WORDS') {
        const remaining = this.room.currentSpeakerDeadline
          ? Math.max(0, Math.ceil((this.room.currentSpeakerDeadline - Date.now()) / 1000))
          : 0;

        // Only broadcast if timer changed significantly or hit 0 (optional optimization)
        // For now, just update the internal timer without broadcasting full state every second
        this.room.timer = remaining;

        if (remaining <= 0) {
          const curId = this.room.currentSpeakerId;
          const curPlayer = curId ? this.room.players.find(p => p.id === curId) : null;
          const isAI = curPlayer?.type === 'ai';
          if (!isAI) {
            this.handleSpeakerTimeout();
          }
        }
        // this.onStateChange(this.room); // REMOVED: Prevent spamming room_state
        return;
      }

      // 其他阶段使用通用计时
      this.room.timer--;
      // this.onStateChange(this.room); // REMOVED: Prevent spamming room_state

      if (this.room.timer <= 0) {
        this.onTimerEnd();
      }
    }, 1000);
  }

  // Called when timer reaches 0
  private onTimerEnd(): void {
    this.clearTimer();

    switch (this.room.phase) {
      case 'NIGHT':
        this.transitionTo('DAY_MORNING_RESULT');
        break;
      case 'DAY_MORNING_RESULT':
        // Check for last words or go to discussion
        if (this.room.pendingLastWordsQueue && this.room.pendingLastWordsQueue.length > 0) {
          // TODO: Handle multiple last words if needed, for now just go to discussion
          // Ideally we pop from queue and enter LAST_WORDS phase
        }
        this.transitionTo('DAY_DISCUSS');
        break;
      case 'DAY_DISCUSS':
        // 发言阶段的定时器只用于当前发言者的倒计时，结束后切换到下一位发言者
        this.nextSpeaker();
        break;
      case 'DAY_VOTE':
        this.resolveVotes();
        // Check if we need to transition to special phases (handled in resolveVotes)
        if (this.room.phase === 'DAY_VOTE') {
          this.checkWinCondition();
          if (this.room.winner) {
            this.transitionTo('GAME_OVER');
          } else {
            this.room.currentRound++;
            this.transitionTo('NIGHT');
          }
        }
        break;
      case 'DAY_DEATH_LAST_WORDS':
        this.handleSpecialPhaseEnd();
        break;
      case 'HUNTER_SHOOT':
      case 'BADGE_TRANSFER':
        // If timer ends, skip action
        this.handleSpecialPhaseEnd();
        break;
    }
  }

  // --- Sequential Speaking Logic ---

  private startDayDiscussion(): void {
    this.room.currentSpeakerOrder = this.computeSpeakerOrder();
    this.room.currentSpeakerIndex = 0;
    // 重置当日发言标记
    for (const p of this.room.players) {
      if (p.is_alive) p.hasSpokenThisRound = false;
    }

    if (this.room.currentSpeakerOrder.length === 0) {
      this.transitionTo('DAY_VOTE');
      return;
    }

    // Start the first speaker
    const firstId = this.room.currentSpeakerOrder[0];
    const firstPlayer = this.room.players.find(p => p.id === firstId);
    const firstDuration = this.getSpeakerDuration(firstPlayer);
    this.setCurrentSpeaker(firstId, firstDuration);

    // Start a timer to check for speaker timeouts
    this.startTimer();
  }

  private computeSpeakerOrder(): string[] {
    const alivePlayers = this.room.players
      .filter(p => p.is_alive)
      .sort((a, b) => a.position - b.position);

    // 始终从1号位（position=1）开始
    const start = alivePlayers.findIndex(p => p.position === 1);
    if (start >= 0) {
      const ordered = [
        ...alivePlayers.slice(start),
        ...alivePlayers.slice(0, start)
      ];
      return ordered.map(p => p.id);
    }

    return alivePlayers.map(p => p.id);
  }

  private setCurrentSpeaker(playerId: string, durationSec: number = 60): void {
    this.room.currentSpeakerId = playerId;
    // 遗言或自定义0时长：不使用倒计时
    if (durationSec <= 0) {
      this.room.currentSpeakerDeadline = null;
      this.room.timer = 0;
    } else {
      this.room.currentSpeakerDeadline = Date.now() + durationSec * 1000;
      this.room.timer = durationSec; // Sync global timer for UI display
    }

    // Notify frontend
    this.io.to(this.room.id).emit('speaker_change', {
      speakerId: playerId,
      deadline: this.room.currentSpeakerDeadline,
      orderIndex: this.room.currentSpeakerIndex,
      orderTotal: this.room.currentSpeakerOrder.length
    });

    const player = this.room.players.find(p => p.id === playerId);
    if (player && player.type === 'ai') {
      // AI不使用倒计时，由模型完成发言后主动切换
      this.room.currentSpeakerDeadline = null;
      this.room.timer = 0;
      this.io.to(this.room.id).emit('speaker_change', {
        speakerId: playerId,
        deadline: this.room.currentSpeakerDeadline,
        orderIndex: this.room.currentSpeakerIndex,
        orderTotal: this.room.currentSpeakerOrder.length
      });
      this.onStateChange(this.room);
      this.handleAISpeakerTurn(player);
    }
  }

  private nextSpeaker(): void {
    console.log(`[NextSpeaker] currentIndex=${this.room.currentSpeakerIndex}, orderLength=${this.room.currentSpeakerOrder?.length}`);
    
    const nextIndex = this.room.currentSpeakerIndex + 1;

    if (nextIndex >= this.room.currentSpeakerOrder.length) {
      console.log(`[NextSpeaker] 所有人发言完毕，进入投票阶段`);
      this.transitionTo('DAY_VOTE');
      return;
    }

    this.room.currentSpeakerIndex = nextIndex;
    const nextId = this.room.currentSpeakerOrder[nextIndex];
    const nextPlayer = this.room.players.find(p => p.id === nextId);

    console.log(`[NextSpeaker] 下一个发言者: ${nextPlayer?.position}号 ${nextPlayer?.name} (${nextPlayer?.type})`);

    // Skip dead players (just in case)
    if (!nextPlayer || !nextPlayer.is_alive) {
      console.log(`[NextSpeaker] 跳过死亡玩家`);
      this.nextSpeaker();
      return;
    }

    const duration = this.getSpeakerDuration(nextPlayer);
    this.setCurrentSpeaker(nextId, duration);
  }

  private handleSpeakerTimeout(): void {
    if (this.room.currentSpeakerId) {
      this.io.to(this.room.id).emit('speech_timeout', { speakerId: this.room.currentSpeakerId });
      this.nextSpeaker();
    }
  }

  public handleSpeechEnd(playerId: string): void {
    console.log(`[SpeechEnd] playerId=${playerId}, currentSpeakerId=${this.room.currentSpeakerId}, phase=${this.room.phase}`);
    
    // 🔧 放宽检查：只要是发言阶段就允许推进
    if (this.room.phase !== 'DAY_DISCUSS' && this.room.phase !== 'DAY_DEATH_LAST_WORDS') {
      console.log(`[SpeechEnd] 跳过：不在发言阶段`);
      return;
    }
    
    // 标记玩家已发言
    const p = this.room.players.find(pl => pl.id === playerId);
    if (p) p.hasSpokenThisRound = true;
    
    // 遗言阶段特殊处理
    if (this.room.phase === 'DAY_DEATH_LAST_WORDS') {
      this.room.pendingLastWordsPlayerId = null;
      this.handleSpecialPhaseEnd();
      return;
    }
    
    // 只有当前发言者才能触发下一个
    if (this.room.currentSpeakerId !== playerId) {
      console.log(`[SpeechEnd] 跳过：不是当前发言者`);
      return;
    }
    
    this.nextSpeaker();
  }

  private async handleAISpeakerTurn(player: RoomPlayer): Promise<void> {
    console.log(`[AI Turn] 开始处理 ${player.position}号 ${player.name} 的发言`);
    
    if (!this.room.aiThinkingIds) this.room.aiThinkingIds = [];
    this.room.aiThinkingIds.push(player.id);
    this.io.to(this.room.id).emit('ai_thinking', { playerId: player.id, thinking: true });

    const agent = this.aiAgents.get(player.id);
    let speech = "";
    let hasStartedStreaming = false;
    
    if (!agent) {
      console.error(`[AI Turn] 错误：找不到 ${player.position}号 的AI代理`);
      speech = "我过。";
    }

    // 定义流式回调（在首个chunk到达时立即触发预加载）
    const onStream = (chunk: string) => {
      this.io.to(this.room.id).emit('ai_speech_chunk', {
        playerId: player.id,
        chunk: chunk
      });
      
      // 🚀 激进优化：首个chunk到达时立即开始预加载下一个AI
      if (!hasStartedStreaming) {
        hasStartedStreaming = true;
        this.prefetchNextAISpeech();
      }
    };

    if (agent) {
      try {
        let resultPromise: Promise<any>;

        // 检查缓存：如果有预加载的结果，直接使用
        if (this.aiSpeechCache.has(player.id)) {
          console.log(`[Cache Hit] ${player.position}号 使用预思考结果`);
          resultPromise = this.aiSpeechCache.get(player.id)!;
          this.aiSpeechCache.delete(player.id);

          // 停止预思考状态显示
          this.io.to(this.room.id).emit('ai_prefetching', {
            playerId: player.id,
            prefetching: false
          });
          
          // 缓存命中时也要触发预加载
          this.prefetchNextAISpeech();
        } else {
          console.log(`[Cache Miss] ${player.position}号 实时思考`);
          agent.updateGameState(this.room);
          // 传入流式回调
          resultPromise = agent.generateDaySpeech(onStream);
        }

        const result = await resultPromise;
        speech = result.speech;

        // 如果是缓存命中，模拟快速打字效果以保持一致体验
        if (!hasStartedStreaming && speech) {
          const chars = speech.split('');
          for (let i = 0; i < chars.length; i++) {
            this.io.to(this.room.id).emit('ai_speech_chunk', {
              playerId: player.id,
              chunk: chars[i]
            });
            // 每5个字符暂停一下，模拟打字效果
            if (i % 5 === 0) await this.delay(20);
          }
        }

        if (result.debugUpdates && result.debugUpdates.length > 0) {
          this.io.to(this.room.id).emit('ai_suspicion_update', {
            playerId: player.id,
            updates: result.debugUpdates,
            topTarget: result.debugUpdates[0]
          });
        }
      } catch (error) {
        console.error(`AI ${player.name} speech generation failed:`, error);
        speech = "我过。";
      }
    }

    this.room.aiThinkingIds = this.room.aiThinkingIds.filter(id => id !== player.id);
    this.io.to(this.room.id).emit('ai_thinking', { playerId: player.id, thinking: false });

    console.log(`[AI Turn] ${player.position}号 发言完成: "${speech?.substring(0, 30)}..."`);

    if (speech && speech.length > 0 && speech !== "我过。") {
      // 正常发言：广播消息，等待前端TTS结束后再推进
      this.broadcastChat(player.id, player.name, speech, 'speech');
      
      // 🔧 根据发言长度估算TTS时长，等待TTS播放完毕后再推进
      // 中文语速约 4-5 字/秒，加上缓冲
      const estimatedTTSDuration = Math.max(2000, speech.length * 200 + 1000);
      console.log(`[AI Turn] ${player.position}号 等待TTS播放 ${estimatedTTSDuration}ms`);
      await this.delay(estimatedTTSDuration);
    } else {
      // 发言失败或跳过：广播系统消息
      console.log(`[AI Turn] ${player.position}号 跳过发言`);
      this.broadcastSystemMessage(`${player.name} 跳过发言`);
      await this.delay(500);
    }
    
    // 推进到下一个发言者
    console.log(`[AI Turn] ${player.position}号 准备调用 handleSpeechEnd`);
    this.handleSpeechEnd(player.id);
    console.log(`[AI Turn] ${player.position}号 handleSpeechEnd 调用完成`);
  }
  
  // 广播系统消息
  private broadcastSystemMessage(message: string): void {
    const systemMessage = {
      id: `sys_${Date.now()}`,
      senderId: 'system',
      senderName: '系统',
      content: message,
      timestamp: new Date().toISOString(),
      phase: this.room.phase,
      type: 'system' as const
    };
    this.io.to(this.room.id).emit('chat_message', systemMessage);
  }

  // 预加载下一个AI的发言（激进版：预加载多个连续AI）
  private prefetchNextAISpeech(): void {
    const currentIndex = this.room.currentSpeakerIndex ?? 0;
    const speakerOrder = this.room.currentSpeakerOrder || [];

    // 🚀 激进预加载：预加载接下来最多2个AI玩家
    const MAX_PREFETCH = 2;
    let prefetchCount = 0;

    for (let offset = 1; offset <= 3 && prefetchCount < MAX_PREFETCH; offset++) {
      const targetIndex = currentIndex + offset;
      if (targetIndex >= speakerOrder.length) break;

      const targetPlayerId = speakerOrder[targetIndex];
      const targetPlayer = this.room.players.find(p => p.id === targetPlayerId);

      // 只对AI玩家预加载
      if (targetPlayer && targetPlayer.type === 'ai') {
        const agent = this.aiAgents.get(targetPlayerId);
        if (agent && !this.aiSpeechCache.has(targetPlayerId)) {
          console.log(`[Prefetch] ${targetPlayer.position}号 开始预思考 (offset=${offset})...`);

          // 更新游戏状态，确保AI看到最新的发言
          agent.updateGameState(this.room);

          // 异步开始思考，不阻塞当前流程
          const speechPromise = agent.generateDaySpeech().catch(error => {
            console.error(`[Prefetch] ${targetPlayer.position}号 预思考失败:`, error);
            return { speech: "我需要再观察观察。", reasoning: [] };
          });

          this.aiSpeechCache.set(targetPlayerId, speechPromise);

          // 前端显示预思考状态
          this.io.to(this.room.id).emit('ai_prefetching', {
            playerId: targetPlayerId,
            prefetching: true
          });

          prefetchCount++;
        }
      }
    }
  }

  // 清空AI发言缓存
  private clearAICache(): void {
    if (this.aiSpeechCache.size > 0) {
      console.log('[Cache] 清空AI发言缓存');
      this.aiSpeechCache.clear();
    }
  }

  // 获取发言时长（AI 与人类不同）
  private getSpeakerDuration(player?: RoomPlayer, defaultSec: number = 60): number {
    if (!player) return defaultSec;
    if (player.type === 'ai') {
      return 22; // AI 显示计时延长 10s（原为 12s）
    }
    return 60; // 人类 60s
  }

  // 夜晚顺序调度：根据人数配置执行序列
  private async runNightSequence(): Promise<void> {
    const hasGuard = this.room.players.some(p => p.role === 'guard');
    const order: Array<'guard' | 'werewolf' | 'seer' | 'witch' | 'hunter'> = hasGuard
      ? ['guard', 'werewolf', 'witch', 'seer', 'hunter']
      : ['werewolf', 'seer', 'witch', 'hunter'];

    // Helper to get players by role
    const playersByRole = (role: string) => this.room.players.filter(p => p.role === role && p.is_alive);

    // Step: Guard
    if (order[0] === 'guard') {
      for (const g of playersByRole('guard')) {
        const agent = this.aiAgents.get(g.id);
        if (agent) {
          agent.updateGameState(this.room);
          try {
            const decision = await agent.performNightAction();
            if (decision.actionType === 'protect' && decision.targetId) {
              this.submitNightAction({ playerId: g.id, role: 'guard', actionType: 'protect', targetId: decision.targetId });
            }
          } catch { }
        }
      }
      await this.delay(15000);
    }

    // Step: Werewolves (collect votes then resolve)
    for (const w of playersByRole('werewolf')) {
      const agent = this.aiAgents.get(w.id);
      if (agent) {
        agent.updateGameState(this.room);
        try {
          const decision = await agent.performNightAction();
          if (decision.actionType === 'kill' && decision.targetId) {
            this.submitNightAction({ playerId: w.id, role: 'werewolf', actionType: 'kill', targetId: decision.targetId });
          }
        } catch { }
      }
    }
    await this.resolveWerewolfVotingAsync();
    await this.delay(hasGuard ? 30000 : 15000);

    // Step: Seer
    for (const s of playersByRole('seer')) {
      const agent = this.aiAgents.get(s.id);
      if (agent) {
        agent.updateGameState(this.room);
        try {
          const decision = await agent.performNightAction();
          if (decision.actionType === 'check' && decision.targetId) {
            if (this.room.phase === 'NIGHT') {
              this.submitNightAction({ playerId: s.id, role: 'seer', actionType: 'check', targetId: decision.targetId });
            }
          }
        } catch { }
      }
    }
    // 首夜随机查验（若真人未行动）
    if (this.room.currentRound === 1) {
      for (const s of playersByRole('seer')) {
        const seerPlayer = s;
        if (!seerPlayer.hasActedNight) {
          const candidates = this.room.players.filter(p => p.is_alive && p.id !== seerPlayer.id);
          const target = candidates[Math.floor(Math.random() * Math.max(1, candidates.length))];
          if (target) {
            try {
              if (this.room.phase === 'NIGHT') {
                this.submitNightAction({ playerId: s.id, role: 'seer', actionType: 'check', targetId: target.id });
              }
            } catch (e) {
              console.warn('[Night] random seer check skipped (phase changed)');
            }
          }
        }
      }
    }
    await this.delay(hasGuard ? 15000 : 10000);

    // Step: Witch (hint kill target)
    const killAction = this.room.nightActions.find(a => a.actionType === 'kill');
    const killTargetId = killAction?.targetId || null;
    const killTarget = killTargetId ? this.room.players.find(p => p.id === killTargetId) : null;
    for (const w of playersByRole('witch')) {
      if (w.socketId && killTargetId) {
        this.io.to(w.socketId).emit('night_hint', {
          night_death: killTargetId,
          night_death_name: killTarget?.name,
          night_death_role: killTarget?.role,
          night_death_position: killTarget?.position,
        });
      }
      const agent = this.aiAgents.get(w.id);
      if (agent) {
        agent.updateGameState(this.room);
        try {
          const decision = await agent.performNightAction();
          if (decision.actionType === 'save' && decision.targetId) {
            this.submitNightAction({ playerId: w.id, role: 'witch', actionType: 'save', targetId: decision.targetId });
          } else if (decision.actionType === 'poison' && decision.targetId) {
            this.submitNightAction({ playerId: w.id, role: 'witch', actionType: 'poison', targetId: decision.targetId });
          }
        } catch { }
      }
    }
    // 首夜女巫按身份概率随机救（若真人未行动）
    if (this.room.currentRound === 1 && killTargetId) {
      for (const w of playersByRole('witch')) {
        const witchPlayer = w;
        if (!witchPlayer.hasActedNight && this.room.witchPotions.antidote) {
          const target = this.room.players.find(p => p.id === killTargetId);
          if (target) {
            const role = target.role || 'villager';
            const baseProbMap: Record<string, number> = {
              seer: 0.9,
              guard: 0.8,
              hunter: 0.75,
              villager: 0.5,
              werewolf: 0.05,
            };
            const prob = Math.min(0.98, (baseProbMap[role] ?? 0.5) + 0.15);
            if (Math.random() < prob) {
              try {
                if (this.room.phase === 'NIGHT') {
                  this.submitNightAction({ playerId: w.id, role: 'witch', actionType: 'save', targetId: target.id });
                }
              } catch (e) {
                console.warn('[Night] random witch save skipped (phase changed)');
              }
            }
          }
        }
      }
    }
    await this.delay(hasGuard ? 20000 : 15000);

    // Step: Hunter (status check delay)
    await this.delay(hasGuard ? 5000 : 3000);

    // Resolve and transition to morning
    this.transitionTo('DAY_MORNING_RESULT');
  }


  // --- Existing Logic (Refined) ---

  // Submit night action
  public submitNightAction(action: NightAction): void {
    if (this.room.phase !== 'NIGHT') {
      throw new Error('Cannot submit night action outside NIGHT phase');
    }

    // Witch validation
    const witchPlayer = this.room.players.find((p) => p.id === action.playerId);
    if (witchPlayer?.role === 'witch') {
      if (action.actionType === 'save' && !this.room.witchPotions?.antidote) {
        throw new Error('解药已使用');
      }
      if (action.actionType === 'poison' && !this.room.witchPotions?.poison) {
        throw new Error('毒药已使用');
      }
    }

    // Remove existing action from this player
    this.room.nightActions = this.room.nightActions.filter((a) => a.playerId !== action.playerId);

    // Add new action
    this.room.nightActions.push(action);

    // Mark player as acted
    const player = this.room.players.find((p) => p.id === action.playerId);
    if (player) {
      player.hasActedNight = true;
    }

    // Check if all players have acted
    this.checkAllPlayersActed();
  }

  // Submit vote
  public submitVote(voterId: string, targetId: string): void {
    if (this.room.phase !== 'DAY_VOTE') {
      throw new Error('Cannot submit vote outside DAY_VOTE phase');
    }

    // Remove existing vote from this player
    this.room.votes = this.room.votes.filter((v) => v.voterId !== voterId);

    // Add new vote（支持弃票：空目标不记录，但标记已投）
    if (targetId) {
      this.room.votes.push({ voterId, targetId });
    }

    // Mark player as voted
    const player = this.room.players.find((p) => p.id === voterId);
    if (player) {
      player.hasVoted = true;
    }

    // 公告投票（所有人可见）
    const voter = this.room.players.find(p => p.id === voterId);
    const target = targetId ? this.room.players.find(p => p.id === targetId) : null;
    this.room.gameLog.push({
      round: this.room.currentRound,
      phase: 'DAY_VOTE',
      timestamp: new Date().toISOString(),
      event: 'Vote cast',
      details: { voterId, voterName: voter?.name, targetId: targetId || '', targetName: target?.name || '弃票' },
    });
    this.io.to(this.room.id).emit('vote_cast', {
      voterId,
      voterName: voter?.name,
      targetId: targetId || '',
      targetName: target?.name || '弃票',
    });

    // 写入AI公共知识库
    try {
      const { pushKnowledge } = require('./AgentKnowledge.js');
      const aiAll = this.room.players.filter(p => p.type === 'ai');
      for (const a of aiAll) {
        pushKnowledge(this.room, a.id, { round: this.room.currentRound, phase: 'DAY_VOTE', type: 'vote_cast', targetId: targetId || '', targetName: target?.name || '弃票', text: `${voter?.name || ''} -> ${target?.name || '弃票'}` });
      }
    } catch { }

    // Check if all players have voted
    this.checkAllPlayersVoted();
  }

  // Submit hunter shoot action
  public submitHunterShoot(playerId: string, targetId: string): void {
    if (this.room.phase !== 'HUNTER_SHOOT') return;

    const target = this.room.players.find((p) => p.id === targetId);
    if (target && target.is_alive) {
      target.is_alive = false;
      const player = this.room.players.find((p) => p.id === playerId);
      if (player) player.hasHunterShot = true;

      this.room.gameLog.push({
        round: this.room.currentRound,
        phase: 'HUNTER_SHOOT',
        timestamp: new Date().toISOString(),
        event: 'Hunter shot player',
        details: { shooterId: playerId, targetId, targetName: target.name },
      });
    }

    this.handleSpecialPhaseEnd();
  }

  // Submit badge transfer
  public submitBadgeTransfer(playerId: string, targetId: string): void {
    if (this.room.phase !== 'BADGE_TRANSFER') return;

    if (this.room.sheriffId !== playerId) return;

    this.room.sheriffId = targetId;
    const target = this.room.players.find((p) => p.id === targetId);

    this.room.gameLog.push({
      round: this.room.currentRound,
      phase: 'BADGE_TRANSFER',
      timestamp: new Date().toISOString(),
      event: 'Badge transferred',
      details: { fromId: playerId, toId: targetId, toName: target?.name },
    });

    this.handleSpecialPhaseEnd();
  }

  // Handle end of special phases
  private handleSpecialPhaseEnd(): void {
    this.checkWinCondition();
    if (this.room.winner) {
      this.transitionTo('GAME_OVER');
      return;
    }

    if (this.checkPendingSpecialPhases()) {
      return;
    }

    // Default transitions
    const lastMainPhase = this.room.gameLog
      .map((l) => l.phase)
      .reverse()
      .find((p) => ['NIGHT', 'DAY_VOTE'].includes(p));

    if (lastMainPhase === 'NIGHT') {
      this.transitionTo('DAY_DISCUSS');
    } else {
      this.room.currentRound++;
      this.transitionTo('NIGHT');
    }
  }

  // Check for pending special actions (Hunter/Sheriff)
  private checkPendingSpecialPhases(): boolean {
    // 1. Check Sheriff
    if (this.room.sheriffId) {
      const sheriff = this.room.players.find((p) => p.id === this.room.sheriffId);
      if (sheriff && !sheriff.is_alive) {
        this.transitionTo('BADGE_TRANSFER');
        return true;
      }
    }

    // 2. Check Hunter (修复：被毒不能开枪)
    const deadHunter = this.room.players.find(
      (p) => !p.is_alive && p.role === 'hunter' && !p.hasHunterShot && p.deathReason !== 'poisoned',
    );
    if (deadHunter) {
      console.log(`[Hunter] ${deadHunter.name} 可以开枪 (死因: ${deadHunter.deathReason})`);
      this.transitionTo('HUNTER_SHOOT');
      return true;
    }

    return false;
  }

  // Check if all alive players have acted during night
  private checkAllPlayersActed(): void {
    // 只检查真人玩家，AI会自动行动
    const aliveUsers = this.room.players.filter((p) => p.is_alive && p.type === 'user');
    const allActed = aliveUsers.every((p) => p.hasActedNight);

    if (allActed && aliveUsers.length > 0) {
      // 夜晚由顺序调度控制，不在此处强制推进，避免打断守/狼/女巫/预言家流程
      if (this.room.phase !== 'NIGHT') {
        this.onTimerEnd();
      }
    }
  }

  // Check if all alive players have voted
  private checkAllPlayersVoted(): void {
    const alivePlayers = this.room.players.filter((p) => p.is_alive);
    const allVoted = alivePlayers.every((p) => p.hasVoted);

    if (allVoted && alivePlayers.length > 0) {
      // Auto-advance to next phase
      this.onTimerEnd();
    }
  }

  // Reset night action flags
  private resetNightActions(): void {
    this.room.nightActions = [];
    this.room.players.forEach((p) => {
      p.hasActedNight = false;
    });
  }

  // Reset vote flags
  private resetVotes(): void {
    this.room.votes = [];
    this.room.players.forEach((p) => {
      p.hasVoted = false;
    });
  }

  // Resolve night actions
  private resolveNightActions(): void {
    const actions = this.room.nightActions;

    let killTarget: string | null = null;
    let saveTarget: string | null = null;
    let poisonTarget: string | null = null;
    let protectTarget: string | null = null;
    const checkResults: { playerId: string; targetId: string; result: string }[] = [];

    // Process actions by priority
    for (const action of actions) {
      switch (action.actionType) {
        case 'kill':
          killTarget = action.targetId;
          break;
        case 'save':
          saveTarget = action.targetId;
          break;
        case 'poison':
          poisonTarget = action.targetId;
          break;
        case 'protect':
          protectTarget = action.targetId;
          break;
        case 'check':
          if (action.targetId) {
            const target = this.room.players.find((p) => p.id === action.targetId);
            const result = target?.role === 'werewolf' ? 'Werewolf' : 'Good person';
            checkResults.push({
              playerId: action.playerId,
              targetId: action.targetId,
              result,
            });
            const seer = this.room.players.find(p => p.id === action.playerId);
            if (seer?.socketId) {
              this.io.to(seer.socketId).emit('seer_check_result', {
                round: this.room.currentRound,
                targetId: action.targetId,
                targetName: target?.name,
                result,
              });
            }
            // AI 预言家：注入私有记忆提示
            const agent = this.aiAgents.get(action.playerId);
            if (agent && seer?.role === 'seer') {
              const hint = result === 'Werewolf'
                ? `Player ${target?.name} (${target?.id}) is a WOLF.`
                : `Player ${target?.name} (${target?.id}) is GOOD.`;
              try { (agent as any).addPrivateHint?.(hint); } catch { }
            }
            // 记忆：预言家查验
            try {
              const { pushKnowledge } = require('./AgentKnowledge.js');
              pushKnowledge(this.room, action.playerId, {
                round: this.room.currentRound,
                phase: this.room.phase,
                type: 'seer_check',
                targetId: action.targetId!,
                targetName: target?.name,
                result
              })
            } catch { }
          }
          break;
      }
    }

    // Consume potions
    if (saveTarget && this.room.witchPotions) {
      this.room.witchPotions.antidote = false;
    }
    if (poisonTarget && this.room.witchPotions) {
      this.room.witchPotions.poison = false;
    }

    // Determine who dies
    const deaths: Array<{ playerId: string; reason: 'killed' | 'poisoned' }> = [];

    // Kill resolution (修复奶穿规则)
    if (killTarget) {
      const isProtected = protectTarget === killTarget;
      const isSaved = saveTarget === killTarget;

      if (isProtected && isSaved) {
        // 同守同救 = 奶穿，死亡
        deaths.push({ playerId: killTarget, reason: 'killed' });
        console.log(`[Night] Player ${killTarget} - 奶穿（守卫+女巫同时作用）`);
      } else if (isProtected) {
        // 仅守护，存活
        console.log(`[Night] Player ${killTarget} - 被守卫守护，存活`);
      } else if (isSaved) {
        // 仅解药，存活
        console.log(`[Night] Player ${killTarget} - 被女巫救活，存活`);
      } else {
        // 没有保护，死亡
        deaths.push({ playerId: killTarget, reason: 'killed' });
      }
    }

    // Poison resolution (毒药强制死亡，不受守卫影响)
    if (poisonTarget) {
      // 去重检查：如果已经在 deaths 中，移除旧记录
      const existingIndex = deaths.findIndex(d => d.playerId === poisonTarget);
      if (existingIndex >= 0) {
        deaths.splice(existingIndex, 1);
      }
      deaths.push({ playerId: poisonTarget, reason: 'poisoned' });
    }

    // Apply deaths (记录死因)
    const deathPlayerIds: string[] = [];
    for (const death of deaths) {
      const player = this.room.players.find((p) => p.id === death.playerId);
      if (player) {
        player.is_alive = false;
        player.deathReason = death.reason;
        deathPlayerIds.push(death.playerId);
        // 记忆：记录死亡
        try {
          const { pushKnowledge } = require('./AgentKnowledge.js');
          const wolves = this.room.players.filter(p => p.role === 'werewolf' && p.type === 'ai')
          for (const w of wolves) {
            pushKnowledge(this.room, w.id, { round: this.room.currentRound, phase: this.room.phase, type: 'death', targetId: player.id, targetName: player.name })
          }
        } catch { }
      }
    }

    // Log results
    this.room.gameLog.push({
      round: this.room.currentRound,
      phase: 'DAY_MORNING_RESULT',
      timestamp: new Date().toISOString(),
      event: 'Night actions resolved',
      details: {
        deaths: deathPlayerIds,
        checkResults,
        saved: saveTarget && deathPlayerIds.includes(saveTarget) ? null : saveTarget,
        deathReasons: deaths,
      },
    });

    // Notify night result
    this.io.to(this.room.id).emit('night_result', { deaths: deathPlayerIds });

    // 胜利条件优先级最高：夜晚结算后立即判断
    this.checkWinCondition();
    if (this.room.winner) {
      this.transitionTo('GAME_OVER');
      return;
    }

    // Emit Backend-Driven Day Event Queue
    const events: any[] = [];
    if (deathPlayerIds.length > 0) {
      const names = this.room.players.filter(p => deathPlayerIds.includes(p.id)).map(p => `${p.position}号(${p.name})`).join('、');
      events.push({
        event_type: 'ANNOUNCE_DEATH',
        duration: 3000,
        message: `昨晚，${names}玩家死亡。`,
        log_text: `昨晚，${names} 玩家死亡。`,
      });
    } else {
      events.push({
        event_type: 'ANNOUNCE_DEATH',
        duration: 2000,
        message: '昨晚是平安夜。',
        log_text: '昨晚是平安夜。',
      });
    }

    const order = this.computeSpeakerOrder();
    for (const pid of order) {
      const player = this.room.players.find(p => p.id === pid);
      if (!player || !player.is_alive) continue;
      const isHuman = player.type === 'user';
      if (isHuman) {
        events.push({ event_type: 'TURN_SWITCH', next_speaker_id: pid, is_human: true, time_limit: 60000 });
      } else {
        events.push({ event_type: 'SPEECH_NORMAL', speaker_id: pid, thinking_time: 2000, display_time: 10000, log_text: `[${player.position}号]: 发言中...` });
      }
    }

    this.io.to(this.room.id).emit('day_event_queue', events);

    // 记忆：女巫救与毒、守卫保护、狼人团队击杀、平安夜
    try {
      const { pushKnowledge } = require('./AgentKnowledge.js');
      const saves = actions.filter(a => a.actionType === 'save')
      const poisons = actions.filter(a => a.actionType === 'poison')
      const protects = actions.filter(a => a.actionType === 'protect')
      const finalKill = this.room.nightActions.find(a => a.actionType === 'kill' && a.playerId === 'werewolf-team')
      // 女巫：记录自己救/毒
      for (const s of saves) {
        const target = this.room.players.find(p => p.id === s.targetId)
        pushKnowledge(this.room, s.playerId, { round: this.room.currentRound, phase: 'NIGHT', type: 'witch_save', targetId: s.targetId!, targetName: target?.name })
      }
      for (const p of poisons) {
        const target = this.room.players.find(p0 => p0.id === p.targetId)
        pushKnowledge(this.room, p.playerId, { round: this.room.currentRound, phase: 'NIGHT', type: 'witch_poison', targetId: p.targetId!, targetName: target?.name })
      }
      // 守卫：记录保护
      for (const g of protects) {
        const target = this.room.players.find(p => p.id === g.targetId)
        pushKnowledge(this.room, g.playerId, { round: this.room.currentRound, phase: 'NIGHT', type: 'guard_protect', targetId: g.targetId!, targetName: target?.name })
      }
      // 狼人团队击杀
      if (finalKill?.targetId) {
        const wolves = this.room.players.filter(p => p.role === 'werewolf' && p.type === 'ai')
        const target = this.room.players.find(p => p.id === finalKill.targetId)
        for (const w of wolves) {
          pushKnowledge(this.room, w.id, { round: this.room.currentRound, phase: 'NIGHT', type: 'werewolf_team_kill', targetId: finalKill.targetId, targetName: target?.name })
        }
      } else {
        // 平安夜：非女巫记录“未知银水”
        const aiAll = this.room.players.filter(p => p.type === 'ai')
        for (const a of aiAll) {
          pushKnowledge(this.room, a.id, { round: this.room.currentRound, phase: 'NIGHT', type: 'peace_night', text: '平安夜（银水未知）' })
        }
      }
    } catch { }

    // Check for special phases (Hunter/Sheriff)
    if (this.checkPendingSpecialPhases()) {
      return;
    }

    // If no special phases, transition to Discussion
    this.transitionTo('DAY_DISCUSS');
  }

  // Resolve votes
  private resolveVotes(): void {
    const voteCounts = new Map<string, number>();

    for (const vote of this.room.votes) {
      const count = voteCounts.get(vote.targetId) || 0;
      voteCounts.set(vote.targetId, count + 1);
    }

    // Find player with most votes (修复平票处理)
    let maxVotes = 0;
    let eliminatedId: string | null = null;
    const playersWithMaxVotes: string[] = [];

    for (const [playerId, count] of voteCounts.entries()) {
      if (count > maxVotes) {
        maxVotes = count;
        eliminatedId = playerId;
        playersWithMaxVotes.length = 0; // 清空之前的候选人
        playersWithMaxVotes.push(playerId);
      } else if (count === maxVotes && count > 0) {
        playersWithMaxVotes.push(playerId);
      }
    }

    // 检测平票
    if (playersWithMaxVotes.length > 1) {
      console.log(`[Vote] 平票检测: ${playersWithMaxVotes.length} 人同票 (${maxVotes}票)`);
      eliminatedId = null; // 平票则无人出局
      this.room.gameLog.push({
        round: this.room.currentRound,
        phase: 'DAY_VOTE',
        timestamp: new Date().toISOString(),
        event: 'Vote tied - No elimination',
        details: { tiedPlayers: playersWithMaxVotes, votes: maxVotes },
      });
    }

    // Eliminate player
    if (eliminatedId) {
      const player = this.room.players.find((p) => p.id === eliminatedId);
      if (player) {
        player.is_alive = false;
        player.deathReason = 'voted'; // 记录死因

        this.room.gameLog.push({
          round: this.room.currentRound,
          phase: 'DAY_VOTE',
          timestamp: new Date().toISOString(),
          event: 'Player eliminated by vote',
          details: {
            eliminatedId,
            eliminatedName: player.name,
            voteCount: maxVotes,
          },
        });

        // 公开知识：记录被票出局
        try {
          const { pushKnowledge } = require('./AgentKnowledge.js');
          const aiAll = this.room.players.filter(p => p.type === 'ai');
          for (const a of aiAll) {
            pushKnowledge(this.room, a.id, { round: this.room.currentRound, phase: 'DAY_VOTE', type: 'vote_eliminate', targetId: eliminatedId, targetName: player.name });
          }
        } catch { }

        // Handle Last Words for Voted Player
        this.room.pendingLastWordsPlayerId = eliminatedId;
        try {
          const { getMemoryStream } = require('./MemoryStream.js');
          const ms = getMemoryStream(this.room.id);
          ms.addEvent({ round: this.room.currentRound, speaker: 0, action: 'DIE', summary: `${player.position}号(${player.name}) 白天被票出局` });
        } catch { }
        this.transitionTo('DAY_DEATH_LAST_WORDS');
        return;
      }
    }
  }

  // Check win conditions
  private checkWinCondition(): void {
    const alivePlayers = this.room.players.filter((p) => p.is_alive);
    const aliveWerewolves = alivePlayers.filter((p) => p.role === 'werewolf');
    const aliveGood = alivePlayers.filter((p) => p.role !== 'werewolf');

    if (aliveWerewolves.length === 0) {
      this.room.winner = 'villager';
    } else if (aliveWerewolves.length >= aliveGood.length) {
      this.room.winner = 'werewolf';
    }
  }

  // Clean up timers
  private clearTimer(): void {
    if (this.phaseTimer) {
      clearInterval(this.phaseTimer);
      this.phaseTimer = null;
    }
  }

  // Destroy state machine
  public destroy(): void {
    this.clearTimer();
  }

  // Get current room state
  public getRoom(): RoomState {
    return this.room;
  }

  // AI夜晚自动行动（修复：狼人投票制）
  private async handleAINightActions(): Promise<void> {
    const currentPhase = this.room.phase; // 记录当前阶段
    const aiPlayers = this.room.players.filter((p) => p.type === 'ai' && p.is_alive && p.role);

    // 延迟执行，避免瞬间完成
    setTimeout(async () => {
      // 阶段检查
      if (this.room.phase !== 'NIGHT' || this.room.phase !== currentPhase) {
        console.log('[Night] Phase changed, stopping AI night actions');
        return;
      }

      for (const ai of aiPlayers) {
        // 再次检查阶段
        if (this.room.phase !== 'NIGHT') return;

        const agent = this.aiAgents.get(ai.id);
        if (!agent) continue;

        // 更新AI的游戏状态
        agent.updateGameState(this.room);

        // AI决策
        try {
          const decision = await agent.performNightAction();

          if (decision.actionType !== 'skip' && decision.targetId) {
            this.submitNightAction({
              playerId: ai.id,
              role: ai.role || 'villager',
              actionType: decision.actionType as any,
              targetId: decision.targetId
            });
            console.log(`[AI Night] ${ai.name} performed ${decision.actionType} on ${decision.targetId}`);
          }
        } catch (error) {
          console.error(`AI ${ai.name} night action failed:`, error);
        }

        // 模拟思考时间（2~3s）
        await this.delay(2000 + Math.random() * 1000);
      }

      // 狼人投票：统计所有狼人的 kill 目标，选择票数最多的
      await this.resolveWerewolfVotingAsync();
    }, 1000);
  }

  // 狼人投票制：统计并确定最终击杀目标
  private async resolveWerewolfVotingAsync(): Promise<void> {
    const werewolfKills = this.room.nightActions.filter(a => a.actionType === 'kill');

    // 若所有狼人未提交目标，尝试调用AI进行决策而非随机
    if (werewolfKills.length === 0) {
      const wolves = this.room.players.filter(p => p.is_alive && p.role === 'werewolf');
      for (const w of wolves) {
        const agent = this.aiAgents.get(w.id);
        if (agent) {
          try {
            const decision = await agent.performNightAction();
            if (decision.actionType === 'kill' && decision.targetId) {
              this.room.nightActions.push({
                playerId: w.id,
                role: 'werewolf',
                actionType: 'kill',
                targetId: decision.targetId,
              });
            }
          } catch { }
        }
      }
    }

    // 统计每个目标的票数
    const voteCounts = new Map<string, number>();
    for (const action of werewolfKills) {
      if (action.targetId) {
        const count = voteCounts.get(action.targetId) || 0;
        voteCounts.set(action.targetId, count + 1);
      }
    }

    // 找到票数最多的目标
    let maxVotes = 0;
    let finalTarget: string | null = null;
    const topCandidates: string[] = [];
    for (const [targetId, count] of voteCounts.entries()) {
      if (count > maxVotes) {
        maxVotes = count;
        finalTarget = targetId;
        topCandidates.length = 0;
        topCandidates.push(targetId);
      } else if (count === maxVotes) {
        topCandidates.push(targetId);
      }
    }

    // 清除所有狼人的 kill 动作，只保留最终决定
    this.room.nightActions = this.room.nightActions.filter(a => a.actionType !== 'kill');

    // 平票随机
    if (topCandidates.length > 1) {
      finalTarget = topCandidates[Math.floor(Math.random() * topCandidates.length)];
    }

    // 首夜保护真人体验：若最终目标为真人，强制改为随机AI候选（若存在）
    if (finalTarget) {
      const finalTargetPlayer = this.room.players.find(p => p.id === finalTarget);
      if (this.room.currentRound === 1 && finalTargetPlayer?.type === 'user') {
        const aiCandidates = this.room.players.filter(p => p.is_alive && p.role !== 'werewolf' && p.type === 'ai');
        if (aiCandidates.length > 0) {
          const pick = aiCandidates[Math.floor(Math.random() * aiCandidates.length)].id;
          console.log(`[Werewolf] 首夜保护真人体验：将最终目标从 ${finalTarget} 切换为 AI ${pick}`);
          finalTarget = pick;
        }
      }
    }

    if (finalTarget) {
      // 添加最终的杀人动作
      this.room.nightActions.push({
        playerId: 'werewolf-team',
        role: 'werewolf',
        actionType: 'kill',
        targetId: finalTarget,
      });
      console.log(`[Werewolf] 狼人投票完成，最终目标: ${finalTarget} (${maxVotes}票)`);
    }
    if (!finalTarget && this.room.currentRound === 1) {
      const candidates = this.room.players.filter(p => p.is_alive && p.role !== 'werewolf' && p.type === 'ai');
      const random = candidates[Math.floor(Math.random() * Math.max(1, candidates.length))];
      if (random) {
        this.room.nightActions.push({
          playerId: 'werewolf-team',
          role: 'werewolf',
          actionType: 'kill',
          targetId: random.id,
        });
        console.log(`[Werewolf] 首夜兜底随机击杀: ${random.id}`);
      } else {
        console.log('[Werewolf] 首夜兜底：无AI候选，平安夜');
      }
    }
  }

  // AI自动投票（修复：阶段检查）
  private async handleAIVotes(): Promise<void> {
    const currentPhase = this.room.phase;
    const aiPlayers = this.room.players.filter((p) => p.type === 'ai' && p.is_alive);

    // 延迟执行
    setTimeout(async () => {
      if (this.room.phase !== 'DAY_VOTE' || this.room.phase !== currentPhase) {
        console.log('[Vote] Phase changed, stopping AI votes');
        return;
      }

      for (const ai of aiPlayers) {
        if (this.room.phase !== 'DAY_VOTE') return;
        const agent = this.aiAgents.get(ai.id);
        if (!agent) continue;

        agent.updateGameState(this.room);

        try {
          const { targetId } = await agent.decideVote();
          if (targetId) {
            this.submitVote(ai.id, targetId);
            console.log(`[AI Vote] ${ai.name} voted for ${targetId}`);
          } else {
            console.log(`[AI Vote] ${ai.name} abstained`);
          }
        } catch (error) {
          console.error(`AI ${ai.name} vote failed:`, error);
        }

        await this.delay(800 + Math.random() * 1200);
      }
    }, 2000);
  }

  // 延迟辅助函数
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  // 处理玩家发言，让AI听到
  public handleUserSpeech(playerId: string, content: string): void {
    const player = this.room.players.find(p => p.id === playerId);
    if (!player) return;

    // 广播发言
    this.broadcastChat(playerId, player.name, content, 'speech');

    // 让所有AI理解这段发言
    const aiPlayers = this.room.players.filter(p => p.type === 'ai' && p.is_alive);

    for (const ai of aiPlayers) {
      const agent = this.aiAgents.get(ai.id);
      if (agent) {
        // 异步处理，不阻塞
        agent.understandSpeech({
          position: player.position,
          content,
          phase: this.room.phase
        }).catch(err => console.error(`AI ${ai.name} failed to understand speech:`, err));
      }
    }

    // 预启动下一位AI思考：文本到达后即可显示“思考中…”，但不切换发言权
    if (this.room.phase === 'DAY_DISCUSS' || this.room.phase === 'DAY_DEATH_LAST_WORDS') {
      const nextIdx = (this.room.currentSpeakerIndex ?? -1) + 1;
      const nextId = this.room.currentSpeakerOrder?.[nextIdx];
      if (nextId) {
        const nextPlayer = this.room.players.find(p => p.id === nextId);
        if (nextPlayer && nextPlayer.type === 'ai' && nextPlayer.is_alive) {
          if (!this.room.aiThinkingIds) this.room.aiThinkingIds = [];
          if (!this.room.aiThinkingIds.includes(nextPlayer.id)) {
            this.room.aiThinkingIds.push(nextPlayer.id);
            this.io.to(this.room.id).emit('ai_thinking', { playerId: nextPlayer.id, thinking: true });
          }
        }
      }
    }
  }

  // 广播聊天消息
  private broadcastChat(playerId: string, playerName: string, message: string, type: 'speech' | 'chat' = 'chat'): void {
    console.log(`[BroadcastChat] 发送消息: ${playerName} (${type}): "${message.substring(0, 30)}..."`);
    
    const chatMessage = {
      id: `${Date.now()}_${playerId}`,
      senderId: playerId,
      senderName: playerName,
      content: message,
      timestamp: new Date().toISOString(),
      phase: this.room.phase,
      type // Add type to message
    };

    this.room.gameLog.push({
      round: this.room.currentRound,
      phase: this.room.phase,
      timestamp: new Date().toISOString(),
      event: type,
      details: {
        senderId: playerId,
        senderName: playerName,
        content: message,
      },
    });

    // Emit chat message via Socket.IO
    this.io.to(this.room.id).emit('chat_message', chatMessage);
    console.log(`[BroadcastChat] 消息已发送到房间 ${this.room.id}`);

    // Record replay event
    this.recorder.addEvent(type === 'speech' ? 'speech' : 'chat', {
      playerId,
      playerName,
      content: message,
      phase: this.room.phase,
      round: this.room.currentRound,
    });

    // MemoryStream: 记录公共事件摘要
    try {
      const { getMemoryStream } = require('./MemoryStream.js');
      const ms = getMemoryStream(this.room.id);
      const speakerPos = this.room.players.find(p => p.id === playerId)?.position || 0;
      const summary = message.length > 60 ? `${message.slice(0, 60)}…` : message;
      ms.addEvent({ round: this.room.currentRound, speaker: speakerPos, action: 'SPEECH', summary });
    } catch { }

    // 触发下一位AI的预思考（任何“发言”消息一到后端即可）
    if (type === 'speech' && (this.room.phase === 'DAY_DISCUSS' || this.room.phase === 'DAY_DEATH_LAST_WORDS')) {
      const nextIdx = (this.room.currentSpeakerIndex ?? -1) + 1;
      const nextId = this.room.currentSpeakerOrder?.[nextIdx];
      if (nextId) {
        const nextPlayer = this.room.players.find(p => p.id === nextId);
        if (nextPlayer && nextPlayer.type === 'ai' && nextPlayer.is_alive) {
          if (!this.room.aiThinkingIds) this.room.aiThinkingIds = [];
          if (!this.room.aiThinkingIds.includes(nextPlayer.id)) {
            this.room.aiThinkingIds.push(nextPlayer.id);
            this.io.to(this.room.id).emit('ai_thinking', { playerId: nextPlayer.id, thinking: true });
          }
        }
      }
    }
  }

  // ========== Sheriff Election Methods ==========

  // Register a candidate for sheriff election
  public registerSheriffCandidate(playerId: string): void {
    if (this.room.phase !== 'DAY_DISCUSS' && this.room.currentRound !== 1) {
      throw new Error('Sheriff election only happens on Day 1');
    }

    const player = this.room.players.find(p => p.id === playerId);
    if (!player || !player.is_alive) {
      throw new Error('Only alive players can register');
    }

    if (this.room.sheriffCandidates.includes(playerId)) {
      throw new Error('Already registered');
    }

    this.room.sheriffCandidates.push(playerId);
    this.io.to(this.room.id).emit('sheriff_candidate_registered', {
      playerId,
      playerName: player.name,
      totalCandidates: this.room.sheriffCandidates.length,
    });

    this.onStateChange(this.room);
  }

  // Start sheriff election discussion phase
  private startSheriffElectionDiscussion(): void {
    if (this.room.sheriffCandidates.length === 0) {
      // No candidates, skip election
      this.room.isSheriffElectionDone = true;
      this.transitionTo('DAY_DISCUSS');
      return;
    }

    // Set speaker order to candidates only
    this.room.currentSpeakerOrder = this.room.sheriffCandidates.filter(id => {
      const player = this.room.players.find(p => p.id === id);
      return player && player.is_alive;
    });
    this.room.currentSpeakerIndex = 0;

    if (this.room.currentSpeakerOrder.length === 0) {
      this.room.isSheriffElectionDone = true;
      this.transitionTo('DAY_DISCUSS');
      return;
    }

    const firstId = this.room.currentSpeakerOrder[0];
    const firstPlayer = this.room.players.find(p => p.id === firstId);
    const duration = this.getSpeakerDuration(firstPlayer);
    this.setCurrentSpeaker(firstId, duration);
    this.startTimer();
  }

  // Start sheriff election voting phase
  private startSheriffElectionVoting(): void {
    this.room.sheriffVotes = [];
    this.room.players.forEach(p => {
      p.hasVoted = false;
    });

    // AI auto-vote for sheriff
    this.handleAISheriffVotes();
  }

  // Handle AI voting for sheriff
  private async handleAISheriffVotes(): Promise<void> {
    const aiPlayers = this.room.players.filter(p => p.type === 'ai' && p.is_alive);

    setTimeout(async () => {
      for (const ai of aiPlayers) {
        const agent = this.aiAgents.get(ai.id);
        if (!agent || this.room.sheriffCandidates.length === 0) continue;

        // Simple AI logic: vote for a random candidate (can be enhanced)
        const targetId = this.room.sheriffCandidates[
          Math.floor(Math.random() * this.room.sheriffCandidates.length)
        ];

        this.submitSheriffVote(ai.id, targetId);
        await this.delay(800 + Math.random() * 1200);
      }
    }, 2000);
  }

  // Submit a vote for sheriff
  public submitSheriffVote(voterId: string, targetId: string): void {
    if (this.room.phase !== 'SHERIFF_ELECTION_VOTE') {
      throw new Error('Not in sheriff voting phase');
    }

    if (!this.room.sheriffCandidates.includes(targetId)) {
      throw new Error('Target is not a candidate');
    }

    // Remove existing vote
    this.room.sheriffVotes = this.room.sheriffVotes.filter(v => v.voterId !== voterId);

    // Add new vote
    this.room.sheriffVotes.push({ voterId, targetId });

    const player = this.room.players.find(p => p.id === voterId);
    if (player) {
      player.hasVoted = true;
    }

    // Check if all voted
    this.checkAllSheriffVoted();
  }

  // Check if all players have voted for sheriff
  private checkAllSheriffVoted(): void {
    const alivePlayers = this.room.players.filter(p => p.is_alive);
    const allVoted = alivePlayers.every(p => p.hasVoted);

    if (allVoted && alivePlayers.length > 0) {
      this.resolveSheriffElection();
    }
  }

  // Resolve sheriff election
  private resolveSheriffElection(): void {
    const voteCounts = new Map<string, number>();

    for (const vote of this.room.sheriffVotes) {
      const count = voteCounts.get(vote.targetId) || 0;
      voteCounts.set(vote.targetId, count + 1);
    }

    // Find winner
    let maxVotes = 0;
    let winnerId: string | null = null;
    const topCandidates: string[] = [];

    for (const [candidateId, count] of voteCounts.entries()) {
      if (count > maxVotes) {
        maxVotes = count;
        winnerId = candidateId;
        topCandidates.length = 0;
        topCandidates.push(candidateId);
      } else if (count === maxVotes) {
        topCandidates.push(candidateId);
      }
    }

    // Handle tie
    if (topCandidates.length > 1) {
      winnerId = topCandidates[Math.floor(Math.random() * topCandidates.length)];
    }

    if (winnerId) {
      this.room.sheriffId = winnerId;
      const winner = this.room.players.find(p => p.id === winnerId);

      this.room.gameLog.push({
        round: this.room.currentRound,
        phase: 'SHERIFF_ELECTION_VOTE',
        timestamp: new Date().toISOString(),
        event: 'Sheriff elected',
        details: {
          sheriffId: winnerId,
          sheriffName: winner?.name,
          votes: maxVotes,
        },
      });

      this.io.to(this.room.id).emit('sheriff_elected', {
        sheriffId: winnerId,
        sheriffName: winner?.name,
        votes: maxVotes,
      });
    }

    this.room.isSheriffElectionDone = true;
    this.transitionTo('DAY_DISCUSS');
  }

  // ========== Host Control Methods ==========

  // Pause the game (host only)
  public hostPauseGame(hostId: string): void {
    if (this.room.hostId !== hostId) {
      throw new Error('Only host can pause');
    }

    this.room.isPaused = true;
    this.clearTimer();
    this.io.to(this.room.id).emit('game_paused', { by: hostId });
    this.onStateChange(this.room);
  }

  // Resume the game (host only)
  public hostResumeGame(hostId: string): void {
    if (this.room.hostId !== hostId) {
      throw new Error('Only host can resume');
    }

    this.room.isPaused = false;
    if (this.room.timer > 0) {
      this.startTimer();
    }
    this.io.to(this.room.id).emit('game_resumed', { by: hostId });
    this.onStateChange(this.room);
  }

  // Force skip current speaker (host only)
  public hostForceSkip(hostId: string): void {
    if (this.room.hostId !== hostId) {
      throw new Error('Only host can force skip');
    }

    if (this.room.currentSpeakerId) {
      this.io.to(this.room.id).emit('host_forced_skip', {
        skippedId: this.room.currentSpeakerId,
        by: hostId,
      });
      this.nextSpeaker();
    }
  }

  public debugRestoreToDayDiscuss(speakerId?: string): void {
    this.clearTimer();
    this.room.phase = 'DAY_DISCUSS';
    this.room.currentSpeakerOrder = this.computeSpeakerOrder();
    this.room.currentSpeakerIndex = 0;
    let targetId = speakerId;
    if (!targetId && this.room.currentSpeakerOrder.length > 0) {
      targetId = this.room.currentSpeakerOrder[0];
    }
    if (targetId) {
      const idx = this.room.currentSpeakerOrder.findIndex(id => id === targetId);
      if (idx >= 0) this.room.currentSpeakerIndex = idx;
      const player = this.room.players.find(p => p.id === targetId);
      const duration = this.getSpeakerDuration(player);
      this.setCurrentSpeaker(targetId, duration);
    }
    this.onStateChange(this.room);
    this.startTimer();
  }
}
