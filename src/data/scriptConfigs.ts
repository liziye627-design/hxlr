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
            },
            {
                id: 'char_lv_siqi',
                name: '吕思琦',
                pdfPath: '/scripts/school-rule-22/characters/吕思琦上.pdf',
                pdfPath2: '/scripts/school-rule-22/characters/吕思琦下.pdf',
                description: '校园明星',
            },
            {
                id: 'char_yao_qingfeng',
                name: '姚青峰',
                pdfPath: '/scripts/school-rule-22/characters/姚青峰.pdf',
                description: '学霸班长',
            },
            {
                id: 'char_li_xuanxuan',
                name: '李萱萱',
                pdfPath: '/scripts/school-rule-22/characters/李萱萱.pdf',
                description: '温柔女生',
            },
            {
                id: 'char_bai_mu',
                name: '白穆',
                pdfPath: '/scripts/school-rule-22/characters/白穆.pdf',
                description: '沉默寡言的同学',
            },
            {
                id: 'char_huangfu_qing',
                name: '皇甫青',
                pdfPath: '/scripts/school-rule-22/characters/皇甫青.pdf',
                description: '豪门大小姐',
            },
            {
                id: 'char_xie_yuqing',
                name: '谢雨晴',
                pdfPath: '/scripts/school-rule-22/characters/谢雨晴.pdf',
                description: '活泼开朗的女孩',
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
            },
            {
                id: 'char_anna',
                name: '安娜',
                pdfPath: '/scripts/k-series-awakening/characters/安娜.pdf',
                description: '神秘女特工',
            },
            {
                id: 'char_sam',
                name: '山姆',
                pdfPath: '/scripts/k-series-awakening/characters/山姆.pdf',
                description: '技术专家',
            },
            {
                id: 'char_lynn',
                name: '林恩',
                pdfPath: '/scripts/k-series-awakening/characters/林恩.pdf',
                description: '觉醒的新成员',
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
            },
            {
                id: 'char_mask',
                name: '口罩',
                pdfPath: '/scripts/yandere-diary/characters/口罩.pdf',
                description: '隐藏与保护的象征',
            },
            {
                id: 'char_dumbbell',
                name: '杠铃',
                pdfPath: '/scripts/yandere-diary/characters/杠铃.pdf',
                description: '力量与坚持的代表',
            },
            {
                id: 'char_fruit',
                name: '水果',
                pdfPath: '/scripts/yandere-diary/characters/水果.pdf',
                description: '生命与营养的象征',
            },
            {
                id: 'char_gamepad',
                name: '游戏手柄',
                pdfPath: '/scripts/yandere-diary/characters/游戏手柄.pdf',
                description: '娱乐与逃避的工具',
            },
            {
                id: 'char_bulb',
                name: '灯泡',
                pdfPath: '/scripts/yandere-diary/characters/灯泡.pdf',
                description: '光明与希望的象征',
            },
            {
                id: 'char_pencil',
                name: '铅笔',
                pdfPath: '/scripts/yandere-diary/characters/铅笔.pdf',
                description: '创作与表达的媒介',
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
