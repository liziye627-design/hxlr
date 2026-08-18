import { AGENT_SHOWROOM } from '@/config/agentRoster';
import { cn } from '@/lib/utils';

interface AgentBenchSelectorProps {
  selectedIds: string[];
  leadAgentId?: string;
  maxSelect?: number;
  onChange: (agentIds: string[]) => void;
}

export function AgentBenchSelector({
  selectedIds,
  leadAgentId,
  maxSelect = 3,
  onChange,
}: AgentBenchSelectorProps) {
  const toggleAgent = (agentId: string) => {
    if (agentId === leadAgentId) return;

    if (selectedIds.includes(agentId)) {
      onChange(selectedIds.filter((id) => id !== agentId));
      return;
    }

    if (selectedIds.length >= maxSelect) return;
    onChange([...selectedIds, agentId]);
  };

  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {AGENT_SHOWROOM.map((agent) => {
        const active = selectedIds.includes(agent.id);
        const disabled = agent.id === leadAgentId || (!active && selectedIds.length >= maxSelect);

        return (
          <button
            key={agent.id}
            type="button"
            disabled={disabled}
            onClick={() => toggleAgent(agent.id)}
            className={cn(
              'flex items-center gap-3 rounded-[22px] border px-3 py-3 text-left transition',
              active
                ? 'border-[#f2875f]/35 bg-[#f2875f]/10'
                : 'border-white/10 bg-white/[0.03] hover:bg-white/[0.06]',
              disabled && 'cursor-not-allowed opacity-55',
            )}
          >
            <img
              src={agent.previewImage}
              alt={agent.name}
              className="h-14 w-14 rounded-2xl border border-white/10 object-cover object-top"
            />
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <div className="text-sm font-medium text-white">{agent.name}</div>
                {agent.id === leadAgentId && (
                  <span className="rounded-full border border-white/10 bg-white/[0.06] px-2 py-0.5 text-[10px] uppercase tracking-[0.16em] text-white/54">
                    Lead
                  </span>
                )}
              </div>
              <div className="mt-1 text-xs leading-5 text-white/52">{agent.title}</div>
            </div>
          </button>
        );
      })}
    </div>
  );
}
