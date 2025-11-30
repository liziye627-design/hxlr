# Multi PlayerGameRoom Integration Guide

## Step 1: Add Handler Functions

Add these handler functions before the return statement (around line 400):

```tsx
// ========== Sheriff Election Handlers ==========

const handleApplySheriff = async () => {
  if (!roomState) return;
  try {
    await applySheriff(roomState.roomId, currentPlayerId);
    toast({ title: '已申请竞选警长' });
  } catch (error: any) {
    toast({ title: '申请失败', description: error.message, variant: 'destructive' });
  }
};

const handleVoteSheriff = async (targetId: string) => {
  if (!roomState) return;
  try {
    await voteSheriff(roomState.roomId, currentPlayerId, targetId);
    toast({ title: '投票成功' });
  } catch (error: any) {
    toast({ title: '投票失败', description: error.message, variant: 'destructive' });
  }
};

// ========== Host Control Handlers ==========

const handleHostPause = async () => {
  if (!roomState) return;
  try {
    await hostPause(roomState.roomId, currentPlayerId);
  } catch (error: any) {
    toast({ title: '暂停失败', description: error.message, variant: 'destructive' });
  }
};

const handleHostResume = async () => {
  if (!roomState) return;
  try {
    await hostResume(roomState.roomId, currentPlayerId);
  } catch (error: any) {
    toast({ title: '恢复失败', description: error.message, variant: 'destructive' });
  }
};

const handleHostForceSkip = async () => {
  if (!roomState) return;
  try {
    await hostForceSkip(roomState.roomId, currentPlayerId);
    toast({ title: '已强制跳过' });
  } catch (error: any) {
    toast({ title: '操作失败', description: error.message, variant: 'destructive' });
  }
};
```

## Step 2: Add Components to UI

In the game view (around line 750, in the right sidebar), add:

```tsx
{/* Right: Dynamic Side Panel */}
<div className="lg:col-span-1 space-y-4">
  {/* Sheriff Election Panel */}
  {roomState.phase && (
    <SheriffElectionPanel
      phase={roomState.phase}
      currentRound={roomState.currentRound}
      candidates={sheriffCandidates}
      players={roomState.players}
      currentPlayerId={currentPlayerId}
      hasApplied={sheriffCandidates.includes(currentPlayerId)}
      onApply={handleApplySheriff}
      onVote={handleVoteSheriff}
    />
  )}

  {/* Host Control Panel */}
  <HostControlPanel
    isHost={isHost}
    isPaused={isPaused || false}
    currentSpeakerId={activeSpeakerId}
    currentPlayerId={currentPlayerId}
    players={roomState.players}
    onPause={handleHostPause}
    onResume={handleHostResume}
    onForceSkip={handleHostForceSkip}
  />

  {/* Existing panels below... */}
  <Card className="bg-slate-800/80 border-slate-700 h-[460px] flex flex-col">
    {/* Game log...  */}
  </Card>

  {/* Night Action Panel */}
  {roomState.phase === 'NIGHT' && (
    // ...existing night panel
  )}
</div>
```

## Step 3: Fix Type Errors

Update `/src/types/index.ts` to add missing GamePhase values:

```typescript
export type GamePhase =
  | 'WAITING'
  | 'NIGHT'
  | 'DAY_MORNING_RESULT'
  | 'DAY_DISCUSS'
  | 'DAY_VOTE'
  | 'DAY_DEATH_LAST_WORDS'
  | 'SHERIFF_ELECTION_DISCUSS'  // ADD THIS
  | 'SHERIFF_ELECTION_VOTE'     // ADD THIS
  | 'HUNTER_SHOOT'
  | 'BADGE_TRANSFER'
  | 'GAME_OVER';
```

## Complete Integration

The components are now ready. They will:
- **Show "Apply for Sheriff" button** on Day 1 during discussion
- **Show candidate list** as players apply
- **Show voting UI** during SHERIFF_ELECTION_VOTE phase
- **Host panel shows pause/resume** controls (only for host)
- **Host can force skip** the current speaker

Test by running the game and checking each phase.
