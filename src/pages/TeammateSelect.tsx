import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AGENT_SHOWROOM, type AgentShowcaseEntry } from '@/config/agentRoster';
import { useAgentSelection } from '@/contexts/AgentSelectionContext';
import { AgentFlipCard } from '@/components/agents/AgentFlipCard';
import { agentReviewApi } from '@/db/api';
import type { AgentLeaderboardEntry } from '@/types';

export default function TeammateSelect() {
  const navigate = useNavigate();
  const { selectedAgentId, setSelectedAgentId } = useAgentSelection();
  const [filter, setFilter] = useState<'all' | 'alpha' | 'aqua' | 'shadow' | 'rookie'>('all');
  const [leaderboard, setLeaderboard] = useState<AgentLeaderboardEntry[]>([]);

  // Load leaderboard data
  useEffect(() => {
    const loadLeaderboard = async () => {
      const entries = await agentReviewApi.getLeaderboard();
      setLeaderboard(entries);
    };
    void loadLeaderboard();
  }, []);

  const filteredAgents = filter === 'all'
    ? AGENT_SHOWROOM
    : AGENT_SHOWROOM.filter((a) => a.type === filter);

  const handleSelect = (agentId: string) => {
    setSelectedAgentId(agentId);
  };

  const handleAction = (agentId: string, action: 'chat') => {
    if (action === 'chat') {
      setSelectedAgentId(agentId);
      navigate('/chat/room');
    }
  };

  const getLeaderboardEntry = (agentId: string): AgentLeaderboardEntry | null => {
    return leaderboard.find((entry) => entry.agentId === agentId) ?? null;
  };

  return (
    <div className="flex min-h-screen w-full flex-col bg-[#050510]">
      {/* 顶部标题区域 - 固定高度 */}
      <div className="flex-shrink-0 px-6 pt-8 pb-4 text-center">
        <h1 className="text-3xl font-bold text-white">
          选择你的{' '}
          <span className="text-[#ff6b4a]">队友</span>
        </h1>
        <p className="mt-2 text-sm text-white/50">点击卡片翻转查看详情</p>

        {/* Filter Tabs */}
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          {[
            { key: 'all', label: '全部' },
            { key: 'alpha', label: '策略型' },
            { key: 'aqua', label: '社交型' },
            { key: 'shadow', label: '神秘型' },
            { key: 'rookie', label: '辅助型' },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key as typeof filter)}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition-all ${
                filter === tab.key
                  ? 'bg-white text-black'
                  : 'border border-white/10 bg-white/5 text-white/70 hover:bg-white/10'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* 卡片区域 - 放在页面下方，整体往下推 */}
      <div className="flex-1 flex flex-col justify-end pb-8 px-6">
        {/* Cards Grid - 所有卡片在下方区域 */}
        <div className="mx-auto w-full max-w-7xl">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 items-end">
            {filteredAgents.map((agent) => (
              <div
                key={agent.id}
                className="relative flex justify-center"
                style={{ zIndex: 1 }}
              >
                <AgentFlipCard
                  agent={agent}
                  selected={selectedAgentId === agent.id}
                  leaderboardEntry={getLeaderboardEntry(agent.id)}
                  onSelect={handleSelect}
                  onAction={handleAction}
                />
              </div>
            ))}
          </div>

          {/* Count */}
          <div className="mt-6 text-center text-sm text-white/30">
            共 {filteredAgents.length} 位队友
          </div>
        </div>
      </div>
    </div>
  );
}