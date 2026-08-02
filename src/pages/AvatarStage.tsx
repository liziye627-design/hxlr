import { ArrowLeft, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { OpenLLMVTuberFrame } from '@/components/live2d/OpenLLMVTuberFrame';
import { useAgentSelection } from '@/contexts/AgentSelectionContext';

export default function AvatarStage() {
  const navigate = useNavigate();
  const { agents, selectedAgent, setSelectedAgentId } = useAgentSelection();

  return (
    <div className="relative overflow-hidden px-4 pb-10 pt-6 md:px-6 md:pt-8">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-[-10%] top-[-6%] h-[32rem] w-[32rem] rounded-full bg-[#ff8b61]/10 blur-[130px]" />
        <div className="absolute right-[-8%] top-[8%] h-[28rem] w-[28rem] rounded-full bg-[#2f7b7b]/10 blur-[120px]" />
        <div className="absolute bottom-[-8rem] left-[18%] h-[24rem] w-[24rem] rounded-full bg-[#7c5cff]/10 blur-[120px]" />
      </div>

      <div className="relative mx-auto flex max-w-[1640px] flex-col gap-5">
        <section className="rounded-[30px] border border-white/10 bg-[#0b1012]/88 px-5 py-5 shadow-[0_24px_120px_rgba(0,0,0,0.42)] backdrop-blur-2xl md:px-7">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
            <div>
              <div className="text-[11px] uppercase tracking-[0.22em] text-white/38">VTuber Preview</div>
              <h1 className="mt-3 text-3xl font-semibold tracking-tight text-white md:text-5xl">
                直接看主播形象
              </h1>
              <p className="mt-3 max-w-3xl text-sm leading-7 text-white/56 md:text-base">
                这个页面不再套游戏观战 UI，只保留 VTuber 原始预览。想截图时，如果浏览器弹出麦克风权限，你可以直接点“阻止”。
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Button
                onClick={() => navigate('/chat')}
                variant="outline"
                className="h-12 rounded-2xl border-white/10 bg-white/[0.04] text-white hover:bg-white/[0.08]"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                回到队友页
              </Button>
              <Button
                onClick={() => window.open('http://127.0.0.1:12393', '_blank', 'noopener,noreferrer')}
                className="h-12 rounded-2xl bg-[#f2875f] text-white hover:bg-[#ff946f]"
              >
                打开原始窗口
                <ExternalLink className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </section>

        <section className="rounded-[30px] border border-white/10 bg-[#0b1012]/88 p-4 shadow-[0_24px_120px_rgba(0,0,0,0.42)] backdrop-blur-2xl md:p-5">
          <div className="mb-4 flex items-end justify-between gap-4">
            <div>
              <div className="text-[11px] uppercase tracking-[0.22em] text-white/38">Current avatar</div>
              <h2 className="mt-2 text-2xl font-semibold text-white md:text-3xl">{selectedAgent.name}</h2>
              <p className="mt-1 text-sm text-white/56">{selectedAgent.title}</p>
            </div>
            <div className="text-right text-xs text-white/42">
              <div>如果画面没立刻切过去</div>
              <div>点一下下面其他主播，再切回来</div>
            </div>
          </div>

          <div className="mb-5 flex gap-3 overflow-x-auto pb-1">
            {agents.map((agent) => {
              const isSelected = agent.id === selectedAgent.id;

              return (
                <button
                  key={agent.id}
                  type="button"
                  onClick={() => setSelectedAgentId(agent.id)}
                  className={`group flex min-w-[156px] shrink-0 items-center gap-3 rounded-[22px] border px-3 py-3 text-left transition ${
                    isSelected
                      ? 'border-[#f2875f]/40 bg-[linear-gradient(180deg,rgba(242,135,95,0.18),rgba(255,255,255,0.04))]'
                      : 'border-white/10 bg-white/[0.03] hover:border-white/20 hover:bg-white/[0.06]'
                  }`}
                >
                  <img
                    src={agent.previewImage}
                    alt={agent.name}
                    className="h-14 w-14 rounded-[16px] border border-white/10 object-cover object-top"
                  />
                  <div className="min-w-0">
                    <div className="truncate text-sm font-semibold text-white">{agent.name}</div>
                    <div className="mt-1 truncate text-xs text-white/46">{agent.title}</div>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="overflow-hidden rounded-[28px] border border-white/8 bg-black/30">
            <OpenLLMVTuberFrame
              baseUrl="http://127.0.0.1:12393"
              className="h-[72vh] min-h-[680px] w-full"
              mode="dialogue"
              modelName={selectedAgent.modelName}
              showControls={false}
            />
          </div>
        </section>
      </div>
    </div>
  );
}
