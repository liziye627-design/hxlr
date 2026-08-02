import { useEffect, useMemo, useState } from 'react';
import { Star, Trophy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAgentSelection } from '@/contexts/AgentSelectionContext';
import { useUser } from '@/contexts/UserContext';
import { agentReviewApi } from '@/db/api';
import type { AgentLeaderboardEntry, AgentReview, AgentReviewMode } from '@/types';

const reviewModes: AgentReviewMode[] = ['werewolf', 'script_murder', 'chat', 'mc'];

function ScoreField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <div className="space-y-2">
      <div className="text-sm text-white/58">{label}</div>
      <div className="flex gap-2">
        {[1, 2, 3, 4, 5].map((score) => (
          <button
            key={`${label}-${score}`}
            type="button"
            onClick={() => onChange(score)}
            className={`h-11 w-11 rounded-2xl border text-sm transition ${
              value === score
                ? 'border-[#f2875f]/40 bg-[#f2875f]/12 text-[#ffc0a8]'
                : 'border-white/10 bg-white/[0.03] text-white/60 hover:bg-white/[0.08]'
            }`}
          >
            {score}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function Rankings() {
  const { user } = useUser();
  const { selectedAgent } = useAgentSelection();
  const [leaderboard, setLeaderboard] = useState<AgentLeaderboardEntry[]>([]);
  const [recentReviews, setRecentReviews] = useState<AgentReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [sessionId, setSessionId] = useState('');
  const [mode, setMode] = useState<AgentReviewMode>('werewolf');
  const [overallScore, setOverallScore] = useState(4);
  const [chemistryScore, setChemistryScore] = useState(4);
  const [deductionScore, setDeductionScore] = useState(4);
  const [clutchScore, setClutchScore] = useState(4);
  const [suggestion, setSuggestion] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const [entries, reviews] = await Promise.all([
        agentReviewApi.getLeaderboard(),
        agentReviewApi.getReviewsForAgent(selectedAgent.id),
      ]);
      setLeaderboard(entries);
      setRecentReviews(reviews);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, [selectedAgent.id]);

  const podium = leaderboard.slice(0, 3);
  const selectedEntry = useMemo(
    () => leaderboard.find((entry) => entry.agentId === selectedAgent.id) ?? null,
    [leaderboard, selectedAgent.id],
  );

  const handleSubmit = async () => {
    if (!user?.id) return;

    setSubmitting(true);
    try {
      await agentReviewApi.submitReview({
        agent_id: selectedAgent.id,
        user_id: user.id,
        session_id: sessionId || null,
        game_mode: mode,
        overall_score: overallScore,
        chemistry_score: chemistryScore,
        deduction_score: deductionScore,
        clutch_score: clutchScore,
        suggestion,
      });

      setSuggestion('');
      setSessionId('');
      await loadData();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="relative overflow-hidden px-4 pb-32 pt-6 md:px-8 md:pb-10 md:pt-8">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-[-12%] top-[8%] h-[30rem] w-[30rem] rounded-full bg-[#f2875f]/10 blur-[130px]" />
        <div className="absolute right-[-8%] top-[20%] h-[24rem] w-[24rem] rounded-full bg-[#2957b8]/10 blur-[120px]" />
      </div>

      <div className="relative mx-auto flex max-w-[1440px] flex-col gap-6">
        <section className="rounded-[30px] border border-white/10 bg-[#0d1015]/88 px-5 py-5 shadow-[0_24px_120px_rgba(0,0,0,0.42)] backdrop-blur-2xl md:px-7">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-[11px] uppercase tracking-[0.22em] text-white/56">
                Agent leaderboard
              </div>
              <h1 className="text-3xl font-semibold tracking-tight text-white md:text-5xl">
                Score the agents that actually played with you.
              </h1>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              {[
                { label: 'Agents tracked', value: String(leaderboard.length || 9) },
                { label: 'Selected lead', value: selectedAgent.name },
                { label: 'Recent reviews', value: String(recentReviews.length) },
              ].map((item) => (
                <div
                  key={item.label}
                  className="rounded-[22px] border border-white/8 bg-white/[0.03] px-4 py-4"
                >
                  <div className="text-[11px] uppercase tracking-[0.18em] text-white/38">{item.label}</div>
                  <div className="mt-3 text-lg font-medium text-white">{item.value}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <div className="grid gap-6 xl:grid-cols-[1.02fr_0.98fr]">
          <section className="space-y-6">
            <div className="grid gap-5 lg:grid-cols-3">
              {podium.map((entry, index) => (
                <div
                  key={entry.agentId}
                  className="rounded-[28px] border border-white/10 bg-[#0d1015]/88 p-5 shadow-[0_18px_90px_rgba(0,0,0,0.35)] backdrop-blur-2xl"
                >
                  <div className="mb-4 flex items-center justify-between">
                    <div className="text-[11px] uppercase tracking-[0.18em] text-white/38">#{index + 1}</div>
                    <Trophy className="h-4 w-4 text-[#ffc0a8]" />
                  </div>
                  <div className="flex items-center gap-4">
                    <img
                      src={entry.previewImage}
                      alt={entry.agentName}
                      className="h-16 w-16 rounded-2xl border border-white/10 object-cover object-top"
                    />
                    <div>
                      <div className="text-lg font-medium text-white">{entry.agentName}</div>
                      <div className="mt-1 text-sm text-white/48">{entry.title}</div>
                    </div>
                  </div>
                  <div className="mt-5 text-3xl font-semibold text-white">{entry.averageOverall.toFixed(2)}</div>
                  <div className="mt-2 text-sm text-white/50">{entry.reviewCount} weighted reviews</div>
                </div>
              ))}
            </div>

            <div className="rounded-[30px] border border-white/10 bg-[#0d1015]/88 p-5 shadow-[0_20px_90px_rgba(0,0,0,0.35)] backdrop-blur-2xl">
              <div className="mb-5 text-[11px] uppercase tracking-[0.18em] text-white/38">All agents</div>
              <div className="space-y-3">
                {(loading ? [] : leaderboard).map((entry, index) => (
                  <div
                    key={entry.agentId}
                    className={`rounded-[24px] border p-4 ${
                      entry.agentId === selectedAgent.id
                        ? 'border-[#f2875f]/35 bg-[#f2875f]/10'
                        : 'border-white/8 bg-white/[0.03]'
                    }`}
                  >
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                      <div className="flex items-center gap-4">
                        <div className="text-sm text-white/42">#{index + 1}</div>
                        <img
                          src={entry.previewImage}
                          alt={entry.agentName}
                          className="h-14 w-14 rounded-2xl border border-white/10 object-cover object-top"
                        />
                        <div>
                          <div className="text-base font-medium text-white">{entry.agentName}</div>
                          <div className="mt-1 text-sm text-white/48">{entry.title}</div>
                        </div>
                      </div>

                      <div className="grid gap-3 sm:grid-cols-4">
                        {[
                          ['Overall', entry.averageOverall],
                          ['Chem', entry.averageChemistry],
                          ['Read', entry.averageDeduction],
                          ['Clutch', entry.averageClutch],
                        ].map(([label, score]) => (
                          <div
                            key={`${entry.agentId}-${label}`}
                            className="rounded-[20px] border border-white/8 bg-black/18 px-4 py-3"
                          >
                            <div className="text-[10px] uppercase tracking-[0.16em] text-white/36">{label}</div>
                            <div className="mt-2 text-sm font-medium text-white">{Number(score).toFixed(2)}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}

                {loading && (
                  <div className="rounded-[24px] border border-white/8 bg-white/[0.03] p-6 text-sm text-white/52">
                    Loading leaderboard...
                  </div>
                )}
              </div>
            </div>
          </section>

          <aside className="space-y-6 xl:sticky xl:top-8 xl:self-start">
            <div className="rounded-[30px] border border-white/10 bg-[#0d1015]/88 p-5 shadow-[0_20px_90px_rgba(0,0,0,0.35)] backdrop-blur-2xl">
              <div className="mb-5">
                <div className="text-[11px] uppercase tracking-[0.18em] text-white/38">Review panel</div>
                <div className="mt-2 text-2xl font-semibold text-white">{selectedAgent.name}</div>
              </div>

              <div className="mb-5 flex items-center gap-4 rounded-[24px] border border-white/8 bg-white/[0.03] p-4">
                <img
                  src={selectedAgent.previewImage}
                  alt={selectedAgent.name}
                  className="h-16 w-16 rounded-2xl border border-white/10 object-cover object-top"
                />
                <div>
                  <div className="text-base font-medium text-white">{selectedAgent.name}</div>
                  <div className="mt-1 text-sm text-white/48">{selectedAgent.title}</div>
                  {selectedEntry && (
                    <div className="mt-2 text-sm text-white/60">
                      Current score {selectedEntry.averageOverall.toFixed(2)} from {selectedEntry.reviewCount} reviews
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-5">
                <div className="space-y-2">
                  <div className="text-sm text-white/58">Mode</div>
                  <div className="flex flex-wrap gap-2">
                    {reviewModes.map((value) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => setMode(value)}
                        className={`rounded-full border px-4 py-2 text-sm transition ${
                          mode === value
                            ? 'border-[#f2875f]/40 bg-[#f2875f]/12 text-[#ffc0a8]'
                            : 'border-white/10 bg-white/[0.04] text-white/62 hover:bg-white/[0.08]'
                        }`}
                      >
                        {value}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="text-sm text-white/58">Session ID</div>
                  <Input
                    value={sessionId}
                    onChange={(event) => setSessionId(event.target.value)}
                    placeholder="Optional session ID"
                    className="h-12 rounded-2xl border-white/10 bg-white/[0.04] text-white placeholder:text-white/28"
                  />
                </div>

                <ScoreField label="Overall" value={overallScore} onChange={setOverallScore} />
                <ScoreField label="Chemistry" value={chemistryScore} onChange={setChemistryScore} />
                <ScoreField label="Deduction" value={deductionScore} onChange={setDeductionScore} />
                <ScoreField label="Clutch" value={clutchScore} onChange={setClutchScore} />

                <div className="space-y-2">
                  <div className="text-sm text-white/58">Suggestion</div>
                  <textarea
                    value={suggestion}
                    onChange={(event) => setSuggestion(event.target.value)}
                    placeholder="What should this agent keep, change, or learn for future rooms?"
                    className="min-h-[140px] w-full resize-none rounded-[24px] border border-white/10 bg-white/[0.04] px-4 py-4 text-base leading-7 text-white placeholder:text-white/26 focus:outline-none"
                  />
                </div>

                <Button
                  onClick={() => void handleSubmit()}
                  disabled={submitting || !user?.id}
                  className="h-12 w-full rounded-2xl bg-[#f2875f] text-white hover:bg-[#ff946f]"
                >
                  <Star className="mr-2 h-4 w-4" />
                  {submitting ? 'Saving review' : 'Save review'}
                </Button>
              </div>
            </div>

            <div className="rounded-[30px] border border-white/10 bg-[#0d1015]/88 p-5 shadow-[0_20px_90px_rgba(0,0,0,0.35)] backdrop-blur-2xl">
              <div className="mb-4 text-[11px] uppercase tracking-[0.18em] text-white/38">Recent notes</div>
              <div className="space-y-3">
                {recentReviews.slice(0, 5).map((review) => (
                  <div
                    key={review.id}
                    className="rounded-[22px] border border-white/8 bg-white/[0.03] p-4"
                  >
                    <div className="mb-2 text-xs text-white/36">
                      {review.game_mode} · {new Date(review.created_at).toLocaleDateString('zh-CN')}
                    </div>
                    <div className="text-sm leading-7 text-white/72">
                      {review.suggestion || 'No written suggestion for this session.'}
                    </div>
                  </div>
                ))}

                {!loading && recentReviews.length === 0 && (
                  <div className="rounded-[22px] border border-white/8 bg-white/[0.03] p-4 text-sm text-white/52">
                    No notes yet for this agent.
                  </div>
                )}
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
