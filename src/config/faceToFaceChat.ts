import { PARTNER_MODE_CARDS } from './partnerHome';
import type { AgentShowcaseEntry } from './agentRoster';

export interface FaceToFaceStageCopy {
  badge: string;
  title: string;
  subtitle: string;
  placeholder: string;
  quickPrompts: string[];
  switchLabel: string;
  backLabel: string;
  inputLabel: string;
}

export const FACE_TO_FACE_MODE_CTA = '去面对面聊天';
export const FACE_TO_FACE_MODE_DESCRIPTION = '先选好对应的数字人，然后直接跳到面对面聊天界面。';

const teammateMode = PARTNER_MODE_CARDS.find((item) => item.id === 'teammate');
if (teammateMode) {
  teammateMode.cta = FACE_TO_FACE_MODE_CTA;
  teammateMode.description = FACE_TO_FACE_MODE_DESCRIPTION;
}

export function buildFaceToFaceStageCopy(agent: AgentShowcaseEntry): FaceToFaceStageCopy {
  return {
    badge: '面对面数字人',
    title: `${agent.name} 面对面聊天`,
    subtitle: '界面只保留数字人和对话框，你直接说重点，让陪玩马上接住你。',
    placeholder: `直接和 ${agent.name} 说话，比如让她帮你想开场、读桌面、接剧情或做复盘。`,
    quickPrompts: [
      '帮我准备狼人杀开场',
      '读一下这一桌最可疑的人',
      '把这段发言改得更稳一点',
      '陪我做个简短赛后复盘',
    ],
    switchLabel: '切换数字人',
    backLabel: '返回模式页',
    inputLabel: '对话框',
  };
}

export function buildFaceToFaceReply(agent: AgentShowcaseEntry, draft: string) {
  const normalized = draft.toLowerCase();

  if (draft.includes('狼人') || normalized.includes('werewolf')) {
    return `${agent.name}在。第一轮别急着站死边，你先把最可疑的两个人和他们的发言节奏给我，我帮你把开场顺下来。`;
  }

  if (draft.includes('剧本') || normalized.includes('script')) {
    return `${agent.name}收到。把人物、线索和时间顺序丢给我，我先帮你把案板理干净，再决定怎么往下问。`;
  }

  if (draft.includes('开场') || draft.includes('发言') || normalized.includes('speech')) {
    return `${agent.name}建议你这么说：先亮立场，再点一个轻目标，最后把问题抛回桌面。这样稳，也不会太早暴露。`;
  }

  return `${agent.name}在听。把这一局的气氛、身份和你现在最犹豫的动作告诉我，我帮你接下一句。`;
}
