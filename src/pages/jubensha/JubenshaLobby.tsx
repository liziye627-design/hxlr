import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ScrollText, Search, Upload, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { CompanionCarryMode } from '@/config/gameModes';
import { useAgentSelection } from '@/contexts/AgentSelectionContext';
import { getApiUrl } from '@/lib/runtimeUrls';
import type { Story } from '@/types';

const FALLBACK_STORIES: Story[] = [
  {
    id: 'late-bell',
    title: '午夜钟声',
    category: 'mystery',
    difficulty: 'normal',
    min_players: 4,
    max_players: 7,
    description: '节奏紧凑，适合快速搜证和集中推理。',
    cover_url: '/source/63bc45524c4584a23494c66308f4af41.jpg',
    story_data: { estimatedDuration: '60' },
    play_count: 0,
    rating: 4.6,
    is_premium: false,
    created_at: '2026-03-15T00:00:00.000Z',
  },
  {
    id: 'school-rule',
    title: '二十二条校规',
    category: 'mystery',
    difficulty: 'hard',
    min_players: 4,
    max_players: 6,
    description: '封闭校园、强角色压迫感，适合沉浸演绎。',
    cover_url: '/source/0c6b8d63105a43b51646f3f7887247ca.jpg',
    story_data: { estimatedDuration: '75' },
    play_count: 0,
    rating: 4.8,
    is_premium: false,
    created_at: '2026-03-15T00:00:00.000Z',
  },
  {
    id: 'split-diary',
    title: '分裂日记',
    category: 'horror',
    difficulty: 'hard',
    min_players: 4,
    max_players: 7,
    description: '线索散、反转多，适合慢慢拼出整张案板。',
    cover_url: '/source/2fadb9e28aab32ac3f245e3d8e9733a7.jpg',
    story_data: { estimatedDuration: '90' },
    play_count: 0,
    rating: 4.7,
    is_premium: false,
    created_at: '2026-03-15T00:00:00.000Z',
  },
];

type ScriptMurderLocationState = {
  carryMode?: CompanionCarryMode;
};

export default function JubenshaLobby() {
  const navigate = useNavigate();
  const location = useLocation();
  const { selectedAgent, carryModes, setPendingMode } = useAgentSelection();
  const [stories, setStories] = useState<Story[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  const carryMode =
    (location.state as ScriptMurderLocationState | null)?.carryMode ??
    carryModes.script_murder ??
    'with_agent';
  const companionEnabled = carryMode !== 'solo';

  useEffect(() => {
    const loadStories = async () => {
      try {
        const response = await fetch(getApiUrl('/api/jubensha/rooms'));
        const json = await response.json();
        const rooms = (json?.rooms || []) as Array<any>;

        if (!rooms.length) {
          setStories(FALLBACK_STORIES);
          return;
        }

        setStories(
          rooms.map((room, index) => ({
            id: room.id,
            title: room.title,
            description:
              room.description || FALLBACK_STORIES[index % FALLBACK_STORIES.length].description,
            category: 'mystery',
            difficulty: 'normal',
            min_players: 4,
            max_players: room.playerCount || 6,
            cover_url:
              FALLBACK_STORIES[index % FALLBACK_STORIES.length].cover_url ||
              FALLBACK_STORIES[0].cover_url,
            story_data: { estimatedDuration: '60' },
            play_count: 0,
            rating: 4.5,
            is_premium: false,
            created_at: '2026-03-15T00:00:00.000Z',
          })),
        );
      } catch (error) {
        console.error('Failed to load script rooms:', error);
        setStories(FALLBACK_STORIES);
      }
    };

    void loadStories();
  }, []);

  const filteredStories = stories.filter((story) => {
    const target = `${story.title} ${story.description ?? ''} ${story.category}`.toLowerCase();
    return target.includes(searchTerm.toLowerCase());
  });

  const openTeammatePicker = () => {
    setPendingMode('script_murder');
    navigate('/chat');
  };

  const enterStory = (storyId: string) => {
    navigate(`/script-murder/room/${storyId}`, {
      state: {
        carryMode,
        ...(companionEnabled
          ? {
              leadAgentId: selectedAgent.id,
              agentIds: [selectedAgent.id],
            }
          : {
              agentIds: [] as string[],
            }),
      },
    });
  };

  return (
    <div className="relative overflow-hidden px-4 pb-24 pt-6 md:px-8 md:pb-10 md:pt-8">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-[-12%] top-[8%] h-[30rem] w-[30rem] rounded-full bg-[#3730a3]/18 blur-[130px]" />
        <div className="absolute right-[-8%] top-[18%] h-[24rem] w-[24rem] rounded-full bg-[#f2875f]/12 blur-[120px]" />
      </div>

      <div className="relative mx-auto flex max-w-[1440px] flex-col gap-6">
        <section className="rounded-[30px] border border-white/10 bg-[#0e0f17]/88 px-5 py-5 shadow-[0_24px_120px_rgba(0,0,0,0.42)] backdrop-blur-2xl md:px-7">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-[11px] tracking-[0.22em] text-white/56">
                <ScrollText className="h-3.5 w-3.5" />
                剧本杀
              </div>
              <h1 className="text-3xl font-semibold tracking-tight text-white md:text-5xl">
                选一个剧本
              </h1>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <div className="relative">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/28" />
                <Input
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder="搜剧本、搜关键词"
                  className="h-12 w-full rounded-2xl border-white/10 bg-white/[0.04] pl-11 text-white placeholder:text-white/28 sm:w-[260px]"
                />
              </div>
              <Button
                onClick={() => navigate('/script-murder/upload')}
                variant="outline"
                className="h-12 rounded-2xl border-white/10 bg-white/[0.04] text-white hover:bg-white/[0.08]"
              >
                <Upload className="mr-2 h-4 w-4" />
                上传剧本
              </Button>
            </div>
          </div>
        </section>

        <section className="rounded-[30px] border border-white/10 bg-[#0f1118]/90 p-5 shadow-[0_20px_90px_rgba(0,0,0,0.35)] backdrop-blur-2xl">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <div className="text-[11px] tracking-[0.18em] text-white/38">本局队友</div>
              <div className="mt-2 text-2xl font-semibold text-white">
                {companionEnabled ? selectedAgent.name : '单排入局'}
              </div>
              <div className="mt-2 text-sm text-white/58">
                {companionEnabled
                  ? `${selectedAgent.name} 会跟你一起进入这个剧本。`
                  : '这一局先不绑定队友。'}
              </div>
            </div>

            <Button
              type="button"
              variant="outline"
              onClick={openTeammatePicker}
              className="h-11 rounded-2xl border-white/10 bg-white/[0.04] text-white hover:bg-white/[0.08]"
            >
              <Users className="mr-2 h-4 w-4" />
              {companionEnabled ? '换队友' : '加个队友'}
            </Button>
          </div>
        </section>

        <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {filteredStories.map((story) => (
            <button
              key={story.id}
              type="button"
              onClick={() => enterStory(story.id)}
              className="group overflow-hidden rounded-[28px] border border-white/10 bg-[#0f1118]/90 text-left shadow-[0_18px_90px_rgba(0,0,0,0.35)] transition hover:border-white/18"
            >
              <div className="relative h-[18rem] overflow-hidden">
                <img
                  src={story.cover_url || FALLBACK_STORIES[0].cover_url || ''}
                  alt={story.title}
                  className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.04]"
                />
                <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(8,8,10,0.08),rgba(8,8,10,0.92)_78%)]" />
              </div>
              <div className="space-y-4 p-5">
                <div>
                  <div className="text-[11px] tracking-[0.18em] text-white/40">
                    {story.min_players}-{story.max_players} 人
                  </div>
                  <h3 className="mt-2 text-2xl font-semibold text-white">{story.title}</h3>
                  <p className="mt-2 text-sm leading-7 text-white/60">{story.description}</p>
                </div>

                <div className="flex items-center justify-between text-sm text-white/44">
                  <span>{story.story_data?.estimatedDuration || '60'} 分钟</span>
                  <span>{story.rating.toFixed(1)} / 5</span>
                </div>

                <div className="rounded-full border border-white/10 bg-white/[0.04] px-4 py-3 text-center text-sm text-white transition group-hover:bg-white/[0.08]">
                  进入剧本
                </div>
              </div>
            </button>
          ))}
        </section>
      </div>
    </div>
  );
}
