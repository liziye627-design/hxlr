import type { ScriptConfig } from '@/server/scriptmurder/types';

/**
 * Official Script Configurations
 * Maps script IDs to their asset paths and metadata
 */
export const OFFICIAL_SCRIPTS: Record<string, ScriptConfig> = {
    'school-rule-22': {
        scriptId: 'school-rule-22',
        intro: '欢迎来到××高中。这里有一条第二十二条校规，从未被人提起，却支配着所有人的命运...',
        chapters: 7,
        estimatedTime: '4-5小时',
        tags: ['恐怖', '悬疑', '心理'],
        characters: [
            {
                id: 'char_ye_lengxing',
                name: '叶冷星',
                pdfPath: '/scripts/school-rule-22/characters/叶冷星.pdf',
                description: '神秘的转学生',
                role: '转学生',
                personality: '高冷、神秘、观察力敏锐，对周围的人保持警惕。说话简短有力，不喜欢废话。',
                secrets: ['其实是为了调查姐姐的死因才转学过来的', '知道第22条校规的真相'],
                relationships: {
                    'char_lv_siqi': '怀疑对象',
                    'char_yao_qingfeng': '觉得他隐藏了什么',
                },
                avatar: '/avatars/ye_lengxing.png'
            },
            {
                id: 'char_lv_siqi',
                name: '吕思琦',
                pdfPath: '/scripts/school-rule-22/characters/吕思琦上.pdf',
                pdfPath2: '/scripts/school-rule-22/characters/吕思琦下.pdf',
                description: '校园明星',
                role: '校花',
                personality: '表面光鲜亮丽，实则内心充满焦虑和嫉妒。喜欢成为焦点，受不了被忽视。',
                secrets: ['曾经霸凌过叶冷星的姐姐', '为了保持成绩作弊'],
                relationships: {
                    'char_ye_lengxing': '看不顺眼',
                    'char_yao_qingfeng': '暗恋对象',
                },
                avatar: '/avatars/lv_siqi.png'
            },
            {
                id: 'char_yao_qingfeng',
                name: '姚青峰',
                pdfPath: '/scripts/school-rule-22/characters/姚青峰.pdf',
                description: '学霸班长',
                role: '班长',
                personality: '沉稳、理智，总是试图维持秩序。内心深处有强烈的控制欲。',
                secrets: ['是校长的私生子', '暗中协助掩盖学校的丑闻'],
                relationships: {
                    'char_lv_siqi': '利用对象',
                    'char_li_xuanxuan': '青梅竹马',
                },
                avatar: '/avatars/yao_qingfeng.png'
            },
            {
                id: 'char_li_xuanxuan',
                name: '李萱萱',
                pdfPath: '/scripts/school-rule-22/characters/李萱萱.pdf',
                description: '温柔女生',
                role: '普通学生',
                personality: '胆小、怯懦，容易受人摆布。心地善良但缺乏主见。',
                secrets: ['目击了当年的坠楼事件但不敢说', '被吕思琦抓住把柄威胁'],
                relationships: {
                    'char_yao_qingfeng': '依赖',
                    'char_lv_siqi': '恐惧',
                },
                avatar: '/avatars/li_xuanxuan.png'
            },
            {
                id: 'char_bai_mu',
                name: '白穆',
                pdfPath: '/scripts/school-rule-22/characters/白穆.pdf',
                description: '沉默寡言的同学',
                role: '边缘人',
                personality: '孤僻、阴郁，仿佛游离在集体之外。对灵异事件很感兴趣。',
                secrets: ['在学校里养了一只黑猫', '偷偷收集大家的秘密'],
                relationships: {
                    'char_ye_lengxing': '感到同类气息',
                },
                avatar: '/avatars/bai_mu.png'
            },
            {
                id: 'char_huangfu_qing',
                name: '皇甫青',
                pdfPath: '/scripts/school-rule-22/characters/皇甫青.pdf',
                description: '豪门大小姐',
                role: '富二代',
                personality: '傲慢、任性，认为钱能解决一切问题。其实内心很孤独。',
                secrets: ['家里破产了，现在是装出来的', '偷了班费'],
                relationships: {
                    'char_lv_siqi': '表面闺蜜',
                },
                avatar: '/avatars/huangfu_qing.png'
            },
            {
                id: 'char_xie_yuqing',
                name: '谢雨晴',
                pdfPath: '/scripts/school-rule-22/characters/谢雨晴.pdf',
                description: '活泼开朗的女孩',
                role: '体育委员',
                personality: '大大咧咧，讲义气，像个假小子。直觉很准。',
                secrets: ['喜欢女生', '知道皇甫青家里的事'],
                relationships: {
                    'char_huangfu_qing': '想要保护她',
                },
                avatar: '/avatars/xie_yuqing.png'
            },
        ],
        clues: [
            {
                id: 'clue_memories',
                title: '记忆碎片合集',
                pdfPath: '/scripts/school-rule-22/clues/记忆碎片合集.pdf',
                description: '零散的记忆片段',
            },
            {
                id: 'clue_bixian_flow',
                title: '笔仙流程',
                pdfPath: '/scripts/school-rule-22/clues/笔仙流程.pdf',
                description: '笔仙游戏的完整流程',
            },
            {
                id: 'clue_building_map',
                title: '教学楼示意图',
                pdfPath: '/scripts/school-rule-22/clues/教学楼示意图.pdf',
                description: '学校建筑平面图',
            },
        ],
        audioFiles: [
            {
                id: 'audio_01',
                name: '背景音乐',
                filePath: '/scripts/school-rule-22/audio/01.mp3',
                trigger: 'opening',
            },
        ],
        gameAssets: {
            handbookPath: '/scripts/school-rule-22/handbook/主持人手册.pdf',
        },
    },

    'k-series-awakening': {
        scriptId: 'k-series-awakening',
        intro: '你们都是K组织的成员，拥有特殊能力。但当记忆开始混乱，你能分辨谁是真正的队友吗？',
        chapters: 5,
        estimatedTime: '3-4小时',
        tags: ['科幻', '悬疑', '推理'],
        characters: [
            {
                id: 'char_kevin',
                name: '凯文',
                pdfPath: '/scripts/k-series-awakening/characters/凯文.pdf',
                description: 'K组织领导者',
                role: '队长',
                personality: '果断、威严，具有极强的领导力。为了任务可以牺牲一切。',
                secrets: ['其实是双重间谍', '记忆被篡改过'],
                relationships: {
                    'char_anna': '曾经的恋人',
                },
                avatar: '/avatars/kevin.png'
            },
            {
                id: 'char_anna',
                name: '安娜',
                pdfPath: '/scripts/k-series-awakening/characters/安娜.pdf',
                description: '神秘女特工',
                role: '刺客',
                personality: '冷艳、敏捷，行踪飘忽不定。不信任任何人。',
                secrets: ['正在寻找失散多年的妹妹', '怀疑凯文背叛了组织'],
                relationships: {
                    'char_kevin': '爱恨交织',
                },
                avatar: '/avatars/anna.png'
            },
            {
                id: 'char_sam',
                name: '山姆',
                pdfPath: '/scripts/k-series-awakening/characters/山姆.pdf',
                description: '技术专家',
                role: '黑客',
                personality: '幽默、随性，是个技术宅。遇到危险时会变得异常冷静。',
                secrets: ['在系统里留了后门', '暗恋安娜'],
                relationships: {
                    'char_anna': '女神',
                    'char_kevin': '老板',
                },
                avatar: '/avatars/sam.png'
            },
            {
                id: 'char_lynn',
                name: '林恩',
                pdfPath: '/scripts/k-series-awakening/characters/林恩.pdf',
                description: '觉醒的新成员',
                role: '新人',
                personality: '迷茫、好奇，对自己的能力还不能完全掌控。',
                secrets: ['其实是组织制造的克隆人', '拥有毁灭性的力量'],
                relationships: {
                    'char_kevin': '导师',
                },
                avatar: '/avatars/lynn.png'
            },
        ],
        clues: [
            {
                id: 'clue_book',
                title: '神秘书籍',
                pdfPath: '/scripts/k-series-awakening/clues/书.pdf',
                description: '记载着组织秘密的古书',
            },
            {
                id: 'clue_mask',
                title: '面具',
                pdfPath: '/scripts/k-series-awakening/clues/口罩.pdf',
                description: '特殊材质的面具',
            },
            {
                id: 'clue_dumbbell',
                title: '杠铃',
                pdfPath: '/scripts/k-series-awakening/clues/杠铃.pdf',
                description: '训练室的器材',
            },
            {
                id: 'clue_fruit',
                title: '水果',
                pdfPath: '/scripts/k-series-awakening/clues/水果.pdf',
                description: '实验室样本',
            },
            {
                id: 'clue_gamepad',
                title: '游戏手柄',
                pdfPath: '/scripts/k-series-awakening/clues/游戏手柄.pdf',
                description: '控制装置',
            },
            {
                id: 'clue_bulb',
                title: '灯泡',
                pdfPath: '/scripts/k-series-awakening/clues/灯泡.pdf',
                description: '特殊的照明设备',
            },
            {
                id: 'clue_pencil',
                title: '铅笔',
                pdfPath: '/scripts/k-series-awakening/clues/铅笔.pdf',
                description: '标记工具',
            },
        ],
        gameAssets: {
            handbookPath: '/scripts/k-series-awakening/handbook/游戏流程及真相手册.pdf',
            identityCardsPath: '/scripts/k-series-awakening/identity/身份牌.pdf',
        },
    },

    'yandere-diary': {
        scriptId: 'yandere-diary',
        intro: '他的日记里记录着七个不同的人格，每个都有独特的故事。而你们，就是这些故事的主角...',
        chapters: 6,
        estimatedTime: '4-5小时',
        tags: ['心理', '情感', '悬疑'],
        characters: [
            {
                id: 'char_book',
                name: '书',
                pdfPath: '/scripts/yandere-diary/characters/书.pdf',
                description: '知识与理性的化身',
                role: '理智人格',
                personality: '博学、冷静，喜欢引经据典。试图分析和解释一切。',
                secrets: ['知道主人格的创伤来源', '想要融合所有人格'],
                relationships: {
                    'char_mask': '认为他太封闭',
                },
                avatar: '/avatars/book.png'
            },
            {
                id: 'char_mask',
                name: '口罩',
                pdfPath: '/scripts/yandere-diary/characters/口罩.pdf',
                description: '隐藏与保护的象征',
                role: '防御人格',
                personality: '沉默、敏感，总是戴着口罩。对外界充满戒备。',
                secrets: ['替主人格承受了大部分痛苦', '脸上有伤疤'],
                relationships: {
                    'char_book': '觉得他太啰嗦',
                },
                avatar: '/avatars/mask.png'
            },
            {
                id: 'char_dumbbell',
                name: '杠铃',
                pdfPath: '/scripts/yandere-diary/characters/杠铃.pdf',
                description: '力量与坚持的代表',
                role: '力量人格',
                personality: '强壮、暴躁，崇尚武力解决问题。保护欲过强。',
                secrets: ['曾经失手打伤过人', '其实内心很脆弱'],
                relationships: {
                    'char_fruit': '想要保护她',
                },
                avatar: '/avatars/dumbbell.png'
            },
            {
                id: 'char_fruit',
                name: '水果',
                pdfPath: '/scripts/yandere-diary/characters/水果.pdf',
                description: '生命与营养的象征',
                role: '欲望人格',
                personality: '甜美、诱惑，追求感官享受。喜欢新鲜事物。',
                secrets: ['沉迷于某种瘾癖', '嫉妒其他受宠的人格'],
                relationships: {
                    'char_dumbbell': '利用他的力量',
                },
                avatar: '/avatars/fruit.png'
            },
            {
                id: 'char_gamepad',
                name: '游戏手柄',
                pdfPath: '/scripts/yandere-diary/characters/游戏手柄.pdf',
                description: '娱乐与逃避的工具',
                role: '逃避人格',
                personality: '贪玩、幼稚，把一切都当成游戏。不愿意面对现实。',
                secrets: ['把重要的记忆当成游戏存档删除了', '害怕长大'],
                relationships: {
                    'char_bulb': '玩伴',
                },
                avatar: '/avatars/gamepad.png'
            },
            {
                id: 'char_bulb',
                name: '灯泡',
                pdfPath: '/scripts/yandere-diary/characters/灯泡.pdf',
                description: '光明与希望的象征',
                role: '希望人格',
                personality: '乐观、温暖，总是给别人带来希望。但光芒太强有时会刺伤人。',
                secrets: ['知道自己终将熄灭', '其实是最绝望的一个'],
                relationships: {
                    'char_pencil': '欣赏他的才华',
                },
                avatar: '/avatars/bulb.png'
            },
            {
                id: 'char_pencil',
                name: '铅笔',
                pdfPath: '/scripts/yandere-diary/characters/铅笔.pdf',
                description: '创作与表达的媒介',
                role: '创造人格',
                personality: '敏感、忧郁，喜欢写写画画。情绪波动很大。',
                secrets: ['日记的真正执笔者', '想要创造一个完美的世界'],
                relationships: {
                    'char_book': '灵感来源',
                },
                avatar: '/avatars/pencil.png'
            },
        ],
        clues: [],
        gameAssets: {
            handbookPath: '/scripts/yandere-diary/handbook/病娇男孩-组织者手册.pdf',
        },
    },
};

/**
 * Get script configuration by ID
 */
export function getScriptConfig(scriptId: string): ScriptConfig | undefined {
    return OFFICIAL_SCRIPTS[scriptId];
}

/**
 * Get all available official scripts
 */
export function getAllScriptConfigs(): ScriptConfig[] {
    return Object.values(OFFICIAL_SCRIPTS);
}
