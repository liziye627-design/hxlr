import { useState } from 'react';
import { MessageCircle, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  getLocalizedAgentModesLabel,
  getLocalizedAgentTraits,
  getPartnerAgentSpotlight,
  type PartnerSpotlightPart,
  type PartnerSpotlightTone,
} from '@/config/partnerHome';
import { cn } from '@/lib/utils';
import type { AgentLeaderboardEntry } from '@/types';
import type { AgentShowcaseEntry } from '@/config/agentRoster';

interface AgentFlipCardProps {
  agent: AgentShowcaseEntry;
  selected?: boolean;
  leaderboardEntry?: AgentLeaderboardEntry | null;
  onSelect: (agentId: string) => void;
  onAction: (agentId: string, action: 'chat') => void;
}

const toneTextClasses: Record<PartnerSpotlightTone, string> = {
  teal: 'text-[#8ff5dd]',
  amber: 'text-[#ffd58a]',
  sky: 'text-[#9fdcff]',
  rose: 'text-[#ff9eb9]',
  violet: 'text-[#d0b6ff]',
  lime: 'text-[#d4ff95]',
};

const accentStyles: Record<
  PartnerSpotlightTone,
  {
    outline: string;
    pill: string;
    pillSoft: string;
    button: string;
    selectActive: string;
    selectIdle: string;
    imageWash: string;
    backWash: string;
    glow: string;
  }
> = {
  teal: {
    outline: 'border-[#54dfc3]/35',
    pill: 'border-[#54dfc3]/28 bg-[#54dfc3]/14 text-[#bcfff2]',
    pillSoft: 'border-[#54dfc3]/16 bg-[#54dfc3]/10 text-[#8ff5dd]',
    button: 'bg-[#54dfc3] text-[#051412] hover:bg-[#69f2d7]',
    selectActive: 'border-[#54dfc3]/30 bg-[#54dfc3]/14 text-[#bcfff2]',
    selectIdle: 'border-white/10 bg-white/[0.04] text-white/60 hover:border-[#54dfc3]/30 hover:text-[#bcfff2]',
    imageWash:
      'bg-[radial-gradient(circle_at_top,rgba(84,223,195,0.32),transparent_40%),linear-gradient(180deg,rgba(7,10,12,0.02),rgba(7,10,12,0.86)_100%)]',
    backWash:
      'bg-[radial-gradient(circle_at_top_left,rgba(84,223,195,0.18),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(124,190,255,0.14),transparent_36%)]',
    glow: 'shadow-[0_24px_110px_rgba(11,165,140,0.18)]',
  },
  amber: {
    outline: 'border-[#ffbe6b]/35',
    pill: 'border-[#ffbe6b]/28 bg-[#ffbe6b]/14 text-[#ffe2b4]',
    pillSoft: 'border-[#ffbe6b]/16 bg-[#ffbe6b]/10 text-[#ffd58a]',
    button: 'bg-[#ffbe6b] text-[#1d1206] hover:bg-[#ffcc82]',
    selectActive: 'border-[#ffbe6b]/30 bg-[#ffbe6b]/14 text-[#ffe2b4]',
    selectIdle: 'border-white/10 bg-white/[0.04] text-white/60 hover:border-[#ffbe6b]/30 hover:text-[#ffe2b4]',
    imageWash:
      'bg-[radial-gradient(circle_at_top,rgba(255,190,107,0.30),transparent_40%),linear-gradient(180deg,rgba(7,10,12,0.02),rgba(7,10,12,0.86)_100%)]',
    backWash:
      'bg-[radial-gradient(circle_at_top_left,rgba(255,190,107,0.16),transparent_36%),radial-gradient(circle_at_bottom_right,rgba(255,129,90,0.14),transparent_38%)]',
    glow: 'shadow-[0_24px_110px_rgba(185,113,31,0.18)]',
  },
  sky: {
    outline: 'border-[#7ec9ff]/35',
    pill: 'border-[#7ec9ff]/28 bg-[#7ec9ff]/14 text-[#d8f0ff]',
    pillSoft: 'border-[#7ec9ff]/16 bg-[#7ec9ff]/10 text-[#9fdcff]',
    button: 'bg-[#7ec9ff] text-[#051018] hover:bg-[#96d5ff]',
    selectActive: 'border-[#7ec9ff]/30 bg-[#7ec9ff]/14 text-[#d8f0ff]',
    selectIdle: 'border-white/10 bg-white/[0.04] text-white/60 hover:border-[#7ec9ff]/30 hover:text-[#d8f0ff]',
    imageWash:
      'bg-[radial-gradient(circle_at_top,rgba(126,201,255,0.30),transparent_40%),linear-gradient(180deg,rgba(7,10,12,0.02),rgba(7,10,12,0.86)_100%)]',
    backWash:
      'bg-[radial-gradient(circle_at_top_left,rgba(126,201,255,0.18),transparent_35%),radial-gradient(circle_at_bottom_right,rgba(123,173,255,0.14),transparent_37%)]',
    glow: 'shadow-[0_24px_110px_rgba(46,122,185,0.18)]',
  },
  rose: {
    outline: 'border-[#ff8ead]/35',
    pill: 'border-[#ff8ead]/28 bg-[#ff8ead]/14 text-[#ffd3df]',
    pillSoft: 'border-[#ff8ead]/16 bg-[#ff8ead]/10 text-[#ff9eb9]',
    button: 'bg-[#ff8ead] text-[#19070d] hover:bg-[#ffa3be]',
    selectActive: 'border-[#ff8ead]/30 bg-[#ff8ead]/14 text-[#ffd3df]',
    selectIdle: 'border-white/10 bg-white/[0.04] text-white/60 hover:border-[#ff8ead]/30 hover:text-[#ffd3df]',
    imageWash:
      'bg-[radial-gradient(circle_at_top,rgba(255,142,173,0.30),transparent_40%),linear-gradient(180deg,rgba(7,10,12,0.02),rgba(7,10,12,0.86)_100%)]',
    backWash:
      'bg-[radial-gradient(circle_at_top_left,rgba(255,142,173,0.18),transparent_36%),radial-gradient(circle_at_bottom_right,rgba(255,192,123,0.12),transparent_38%)]',
    glow: 'shadow-[0_24px_110px_rgba(180,58,108,0.18)]',
  },
  violet: {
    outline: 'border-[#af8dff]/35',
    pill: 'border-[#af8dff]/28 bg-[#af8dff]/14 text-[#e1d4ff]',
    pillSoft: 'border-[#af8dff]/16 bg-[#af8dff]/10 text-[#d0b6ff]',
    button: 'bg-[#af8dff] text-[#10081d] hover:bg-[#c0a4ff]',
    selectActive: 'border-[#af8dff]/30 bg-[#af8dff]/14 text-[#e1d4ff]',
    selectIdle: 'border-white/10 bg-white/[0.04] text-white/60 hover:border-[#af8dff]/30 hover:text-[#e1d4ff]',
    imageWash:
      'bg-[radial-gradient(circle_at_top,rgba(175,141,255,0.30),transparent_40%),linear-gradient(180deg,rgba(7,10,12,0.02),rgba(7,10,12,0.86)_100%)]',
    backWash:
      'bg-[radial-gradient(circle_at_top_left,rgba(175,141,255,0.18),transparent_36%),radial-gradient(circle_at_bottom_right,rgba(255,146,202,0.12),transparent_40%)]',
    glow: 'shadow-[0_24px_110px_rgba(106,74,188,0.18)]',
  },
  lime: {
    outline: 'border-[#b8ec67]/35',
    pill: 'border-[#b8ec67]/28 bg-[#b8ec67]/14 text-[#e9ffc2]',
    pillSoft: 'border-[#b8ec67]/16 bg-[#b8ec67]/10 text-[#d4ff95]',
    button: 'bg-[#b8ec67] text-[#101708] hover:bg-[#caf584]',
    selectActive: 'border-[#b8ec67]/30 bg-[#b8ec67]/14 text-[#e9ffc2]',
    selectIdle: 'border-white/10 bg-white/[0.04] text-white/60 hover:border-[#b8ec67]/30 hover:text-[#e9ffc2]',
    imageWash:
      'bg-[radial-gradient(circle_at_top,rgba(184,236,103,0.28),transparent_40%),linear-gradient(180deg,rgba(7,10,12,0.02),rgba(7,10,12,0.86)_100%)]',
    backWash:
      'bg-[radial-gradient(circle_at_top_left,rgba(184,236,103,0.16),transparent_36%),radial-gradient(circle_at_bottom_right,rgba(255,196,108,0.12),transparent_40%)]',
    glow: 'shadow-[0_24px_110px_rgba(105,148,30,0.18)]',
  },
};

function renderSpotlightParts(parts: PartnerSpotlightPart[], keyPrefix: string) {
  return parts.map((part, index) => (
    <span
      key={`${keyPrefix}-${index}-${part.text}`}
      className={cn('transition-colors', part.tone ? toneTextClasses[part.tone] : 'text-white/76')}
    >
      {part.text}
    </span>
  ));
}

export function AgentFlipCard({
  agent,
  selected = false,
  leaderboardEntry,
  onSelect,
  onAction,
}: AgentFlipCardProps) {
  const [flipped, setFlipped] = useState(false);
  const reviewCount = leaderboardEntry?.reviewCount ?? 0;
  const rating = leaderboardEntry?.averageOverall ?? agent.scoreSeed.chemistry / 20;
  const localizedTraits = getLocalizedAgentTraits(agent);
  const localizedModes = getLocalizedAgentModesLabel(agent);
  const spotlight = getPartnerAgentSpotlight(agent);
  const accent = accentStyles[spotlight.accent];
  const [heroImage, sideImage, detailImage] = spotlight.imageDeck;

  return (
    <div
      className="relative h-[39rem] w-full cursor-pointer"
      style={{ perspective: '1200px' }}
      onClick={() => setFlipped((current) => !current)}
    >
      <div
        className="relative h-full w-full transition-transform duration-700 ease-in-out"
        style={{
          transformStyle: 'preserve-3d',
          transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
        }}
      >
        <div
          className={cn(
            'absolute inset-0 overflow-hidden rounded-[34px] border bg-[#0d1215]/92 shadow-[0_18px_90px_rgba(0,0,0,0.35)]',
            accent.glow,
            selected ? accent.outline : 'border-white/10',
          )}
          style={{ backfaceVisibility: 'hidden' }}
        >
          <img
            src={agent.previewImage}
            alt={agent.name}
            className="h-full w-full object-cover object-top"
          />
          <div className={cn('absolute inset-0', accent.imageWash)} />

          <div className="absolute left-5 right-5 top-5 flex items-start justify-between gap-3">
            <div className={cn('rounded-full border px-3 py-1 text-[11px] tracking-[0.18em] backdrop-blur-sm', accent.pill)}>
              点击翻牌
            </div>
            <div className="rounded-full border border-white/12 bg-black/28 px-3 py-1 text-sm font-medium text-white/88 backdrop-blur-sm">
              {rating.toFixed(1)}
            </div>
          </div>

          <div className="absolute right-5 top-20 w-[7.1rem] rotate-[8deg] overflow-hidden rounded-[24px] border border-white/10 bg-black/24 shadow-[0_14px_50px_rgba(0,0,0,0.28)] backdrop-blur-md">
            <img
              src={sideImage.src}
              alt={sideImage.alt}
              className="h-28 w-full object-cover"
              style={{ objectPosition: sideImage.objectPosition }}
            />
            <div className="border-t border-white/10 px-3 py-2 text-[10px] tracking-[0.16em] text-white/72">
              {sideImage.badge}
            </div>
          </div>

          <div className="absolute inset-x-0 bottom-0 p-5">
            <div className="rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,rgba(10,8,14,0.28),rgba(10,8,14,0.80))] p-5 backdrop-blur-md">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-[11px] tracking-[0.22em] text-white/48">{spotlight.kicker}</div>
                  <h3 className="mt-2 text-[2.1rem] font-semibold leading-none text-white">{agent.name}</h3>
                  <div className="mt-2 text-sm text-white/60">{spotlight.title}</div>
                </div>
                {selected && (
                  <div className={cn('rounded-full border px-3 py-1 text-[11px] tracking-[0.16em]', accent.pill)}>
                    当前主陪
                  </div>
                )}
              </div>

              <p className="mt-4 text-sm leading-7 text-white/76">{spotlight.tagline}</p>

              <div className="mt-4 flex flex-wrap gap-2">
                {spotlight.moodTags.map((tag) => (
                  <span
                    key={`${agent.id}-${tag}`}
                    className={cn('rounded-full border px-3 py-1 text-[11px] tracking-[0.16em]', accent.pillSoft)}
                  >
                    {tag}
                  </span>
                ))}
              </div>

              <div className="mt-4 flex items-center justify-between text-sm text-white/56">
                <span>{reviewCount} 条评价</span>
                <span>翻面直接看角色设定</span>
              </div>
            </div>
          </div>
        </div>

        <div
          className={cn(
            'absolute inset-0 rounded-[34px] border bg-[linear-gradient(180deg,rgba(14,13,19,0.98),rgba(8,8,13,0.98))] p-5 shadow-[0_18px_90px_rgba(0,0,0,0.35)]',
            accent.backWash,
            accent.glow,
            selected ? accent.outline : 'border-white/10',
          )}
          style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
        >
          <div className="flex h-full flex-col gap-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="text-[11px] tracking-[0.2em] text-white/42">{spotlight.kicker}</div>
                <h3 className="mt-2 text-3xl font-semibold text-white">{agent.name}</h3>
                <p className="mt-3 text-sm leading-7 text-white/68">{spotlight.tagline}</p>
              </div>
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  onSelect(agent.id);
                }}
                className={cn(
                  'rounded-full border px-3 py-1 text-[11px] tracking-[0.18em] transition',
                  selected ? accent.selectActive : accent.selectIdle,
                )}
              >
                {selected ? '已设为主陪' : '设为主陪'}
              </button>
            </div>

            <div className="grid grid-cols-[1.45fr_0.85fr] gap-3">
              <div className="relative min-h-[13.25rem] overflow-hidden rounded-[28px] border border-white/10 bg-black/20">
                <img
                  src={heroImage.src}
                  alt={heroImage.alt}
                  className="h-full w-full object-cover"
                  style={{ objectPosition: heroImage.objectPosition }}
                />
                <div className={cn('absolute inset-0', accent.imageWash)} />
                <div className="absolute inset-x-0 bottom-0 p-4">
                  <div className="rounded-[22px] border border-white/10 bg-black/26 p-4 backdrop-blur-md">
                    <div className="text-[11px] tracking-[0.18em] text-white/52">{heroImage.badge}</div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {spotlight.moodTags.slice(0, 2).map((tag) => (
                        <span
                          key={`${agent.id}-hero-${tag}`}
                          className={cn('rounded-full border px-3 py-1 text-[10px] tracking-[0.16em]', accent.pill)}
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid gap-3">
                {[sideImage, detailImage].map((image, index) => (
                  <div
                    key={`${agent.id}-image-${index}`}
                    className="relative overflow-hidden rounded-[24px] border border-white/10 bg-white/[0.03]"
                  >
                    <img
                      src={image.src}
                      alt={image.alt}
                      className="h-[6.1rem] w-full object-cover"
                      style={{ objectPosition: image.objectPosition }}
                    />
                    <div className="absolute inset-x-0 bottom-0 bg-[linear-gradient(180deg,transparent,rgba(6,7,10,0.88))] px-3 py-2 text-[10px] tracking-[0.16em] text-white/78">
                      {image.badge}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-4 gap-2">
              {[
                { label: '总分', value: rating.toFixed(1) },
                { label: '默契', value: (leaderboardEntry?.averageChemistry ?? agent.scoreSeed.chemistry / 20).toFixed(1) },
                { label: '推理', value: (leaderboardEntry?.averageDeduction ?? agent.scoreSeed.deduction / 20).toFixed(1) },
                { label: '评价', value: String(reviewCount) },
              ].map((item) => (
                <div
                  key={item.label}
                  className="rounded-[20px] border border-white/8 bg-white/[0.03] px-3 py-3 text-center"
                >
                  <div className="text-[10px] tracking-[0.16em] text-white/38">{item.label}</div>
                  <div className="mt-2 text-lg font-semibold text-white">{item.value}</div>
                </div>
              ))}
            </div>

            <div className="space-y-2.5">
              {spotlight.story.map((line, index) => (
                <div
                  key={`${agent.id}-${line.label}`}
                  className="rounded-[22px] border border-white/8 bg-white/[0.03] px-4 py-3"
                >
                  <div className="text-[11px] tracking-[0.18em] text-white/40">{line.label}</div>
                  <p className="mt-2 text-[13px] leading-6 text-white/76">
                    {renderSpotlightParts(line.parts, `${agent.id}-${index}`)}
                  </p>
                </div>
              ))}
            </div>

            <div className="flex flex-wrap gap-2">
              <span className={cn('rounded-full border px-3 py-1 text-xs', accent.pill)}>
                {localizedModes}
              </span>
              {localizedTraits.map((trait) => (
                <span
                  key={`${agent.id}-${trait}`}
                  className="rounded-full border border-white/10 bg-black/16 px-3 py-1 text-xs text-white/66"
                >
                  {trait}
                </span>
              ))}
            </div>

            <div className="rounded-[24px] border border-white/8 bg-white/[0.03] p-4">
              <div className="text-[11px] tracking-[0.18em] text-white/42">开场话</div>
              <div className="mt-3 text-[15px] leading-7 text-white/86">“{spotlight.openingLine}”</div>
            </div>

            <div className="mt-auto space-y-3">
              <Button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  onAction(agent.id, 'chat');
                }}
                className={cn('h-12 w-full justify-between rounded-2xl px-4', accent.button)}
              >
                <span className="flex items-center gap-2">
                  <MessageCircle className="h-4 w-4" />
                  立即开聊
                </span>
                <ShieldCheck className="h-4 w-4 opacity-70" />
              </Button>

              <div className="text-center text-xs leading-6 text-white/42">再点一下翻回封面</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
