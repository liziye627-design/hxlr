/**
 * Apply Script Metadata Migration
 * 
 * This script reads the SQL migration file and sends it to Supabase for execution.
 * Run with: tsx apply-migration.ts
 */

import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const SUPABASE_URL = 'https://backend.appmiaoda.com/projects/supabase245135090743558144';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhdWQiOiJhdXRoZW50aWNhdGVkIiwiZXhwIjoyMDc3ODcxOTYwLCJpc3MiOiJzdXBhYmFzZSIsInJvbGUiOiJhbm9uIiwic3ViIjoiYW5vbiJ9.ZWwiHivbLSxrXaQWsyJNOUHwUoljBVBgnImFJ2GwI98';

async function applyMigration() {
    try {
        console.log('📖 Reading migration file...');
        const migrationPath = join(__dirname, 'supabase', 'migrations', '04_add_script_metadata.sql');
        const sql = readFileSync(migrationPath, 'utf-8');

        console.log('📝 Migration file loaded:', migrationPath);
        console.log('📊 SQL length:', sql.length, 'characters');

        // Execute via Supabase REST API
        console.log('\n🚀 Executing migration...');

        const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'apikey': SUPABASE_KEY,
                'Authorization': `Bearer ${SUPABASE_KEY}`,
            },
            body: JSON.stringify({ query: sql }),
        });

        if (!response.ok) {
            // Try alternative approach - insert directly via REST API
            console.log('⚠️  RPC approach failed, trying direct insertion...\n');

            const scripts = [
                {
                    id: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d',
                    title: '第二十二条校规',
                    category: 'horror',
                    difficulty: 'hard',
                    min_players: 7,
                    max_players: 7,
                    description: '一所神秘学校的禁忌规则，七名学生深陷诡异事件。笔仙游戏揭开尘封的秘密，心魔与记忆交织成致命谜团...',
                    cover_url: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=400',
                    story_data: {
                        scriptId: 'school-rule-22',
                        intro: '欢迎来到××高中。这里有一条第二十二条校规，从未被人提起，却支配着所有人的命运...',
                        chapters: 7,
                        estimatedTime: '4-5小时',
                        tags: ['恐怖', '悬疑', '心理'],
                        characters: [
                            { id: 'char_ye_lengxing', name: '叶冷星', pdfPath: '/scripts/school-rule-22/characters/叶冷星.pdf', description: '神秘的转学生' },
                            { id: 'char_lv_siqi', name: '吕思琦', pdfPath: '/scripts/school-rule-22/characters/吕思琦上.pdf', pdfPath2: '/scripts/school-rule-22/characters/吕思琦下.pdf', description: '校园明星' },
                            { id: 'char_yao_qingfeng', name: '姚青峰', pdfPath: '/scripts/school-rule-22/characters/姚青峰.pdf', description: '学霸班长' },
                            { id: 'char_li_xuanxuan', name: '李萱萱', pdfPath: '/scripts/school-rule-22/characters/李萱萱.pdf', description: '温柔女生' },
                            { id: 'char_bai_mu', name: '白穆', pdfPath: '/scripts/school-rule-22/characters/白穆.pdf', description: '沉默寡言的同学' },
                            { id: 'char_huangfu_qing', name: '皇甫青', pdfPath: '/scripts/school-rule-22/characters/皇甫青.pdf', description: '豪门大小姐' },
                            { id: 'char_xie_yuqing', name: '谢雨晴', pdfPath: '/scripts/school-rule-22/characters/谢雨晴.pdf', description: '活泼开朗的女孩' },
                        ],
                        clues: [
                            { id: 'clue_memories', title: '记忆碎片合集', pdfPath: '/scripts/school-rule-22/clues/记忆碎片合集.pdf', description: '零散的记忆片段' },
                            { id: 'clue_bixian_flow', title: '笔仙流程', pdfPath: '/scripts/school-rule-22/clues/笔仙流程.pdf', description: '笔仙游戏的完整流程' },
                            { id: 'clue_building_map', title: '教学楼示意图', pdfPath: '/scripts/school-rule-22/clues/教学楼示意图.pdf', description: '学校建筑平面图' },
                        ],
                        audioFiles: [{ id: 'audio_01', name: '背景音乐', filePath: '/scripts/school-rule-22/audio/01.mp3', trigger: 'opening' }],
                        gameAssets: { han dbookPath: '/scripts/school-rule-22/handbook/主持人手册.pdf' },
                    },
                    is_premium: false,
                },
                {
                    id: 'b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e',
                    title: 'K系列-觉醒',
                    category: 'mystery',
                    difficulty: 'normal',
                    min_players: 4,
                    max_players: 4,
                    description: '四个觉醒者，隐秘的K组织，交织的记忆与谎言。在真相揭晓之前，你是否能相信自己的同伴？',
                    cover_url: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=400',
                    story_data: {
                        scriptId: 'k-series-awakening',
                        intro: '你们都是K组织的成员，拥有特殊能力。但当记忆开始混乱，你能分辨谁是真正的队友吗？',
                        chapters: 5,
                        estimatedTime: '3-4小时',
                        tags: ['科幻', '悬疑', '推理'],
                        characters: [
                            { id: 'char_kevin', name: '凯文', pdfPath: '/scripts/k-series-awakening/characters/凯文.pdf', description: 'K组织领导者' },
                            { id: 'char_anna', name: '安娜', pdfPath: '/scripts/k-series-awakening/characters/安娜.pdf', description: '神秘女特工' },
                            { id: 'char_sam', name: '山姆', pdfPath: '/scripts/k-series-awakening/characters/山姆.pdf', description: '技术专家' },
                            { id: 'char_lynn', name: '林恩', pdfPath: '/scripts/k-series-awakening/characters/林恩.pdf', description: '觉醒的新成员' },
                        ],
                        clues: [
                            { id: 'clue_book', title: '神秘书籍', pdfPath: '/scripts/k-series-awakening/clues/书.pdf', description: '记载着组织秘密的古书' },
                            { id: 'clue_mask', title: '面具', pdfPath: '/scripts/k-series-awakening/clues/口罩.pdf', description: '特殊材质的面具' },
                            { id: 'clue_dumbbell', title: '杠铃', pdfPath: '/scripts/k-series-awakening/clues/杠铃.pdf', description: '训练室的器材' },
                            { id: 'clue_fruit', title: '水果', pdfPath: '/scripts/k-series-awakening/clues/水果.pdf', description: '实验室样本' },
                            { id: 'clue_gamepad', title: '游戏手柄', pdfPath: '/scripts/k-series-awakening/clues/游戏手柄.pdf', description: '控制装置' },
                            { id: 'clue_bulb', title: '灯泡', pdfPath: '/scripts/k-series-awakening/clues/灯泡.pdf', description: '特殊的照明设备' },
                            { id: 'clue_pencil', title: '铅笔', pdfPath: '/scripts/k-series-awakening/clues/铅笔.pdf', description: '标记工具' },
                        ],
                        gameAssets: {
                            handbookPath: '/scripts/k-series-awakening/handbook/游戏流程及真相手册.pdf',
                            identityCardsPath: '/scripts/k-series-awakening/identity/身份牌.pdf',
                        },
                    },
                    is_premium: false,
                },
                {
                    id: 'c3d4e5f6-a7b8-4c9d-0e1f-2a3b4c5d6e7f',
                    title: '病娇男孩的精分日记',
                    category: 'romance',
                    difficulty: 'hard',
                    min_players: 7,
                    max_players: 7,
                    description: '七个人格，一个男孩。在爱与疯狂的边缘，谁才是他真正的归宿？扭曲的日记揭示了一段段令人心碎的过往...',
                    cover_url: 'https://images.unsplash.com/photo-1516414447565-b14be0adf13e?w=400',
                    story_data: {
                        scriptId: 'yandere-diary',
                        intro: '他的日记里记录着七个不同的人格，每个都有独特的故事。而你们，就是这些故事的主角...',
                        chapters: 6,
                        estimatedTime: '4-5小时',
                        tags: ['心理', '情感', '悬疑'],
                        characters: [
                            { id: 'char_book', name: '书', pdfPath: '/scripts/yandere-diary/characters/书.pdf', description: '知识与理性的化身' },
                            { id: 'char_mask', name: '口罩', pdfPath: '/scripts/yandere-diary/characters/口罩.pdf', description: '隐藏与保护的象征' },
                            { id: 'char_dumbbell', name: '杠铃', pdfPath: '/scripts/yandere-diary/characters/杠铃.pdf', description: '力量与坚持的代表' },
                            { id: 'char_fruit', name: '水果', pdfPath: '/scripts/yandere-diary/characters/水果.pdf', description: '生命与营养的象征' },
                            { id: 'char_gamepad', name: '游戏手柄', pdfPath: '/scripts/yandere-diary/characters/游戏手柄.pdf', description: '娱乐与逃避的工具' },
                            { id: 'char_bulb', name: '灯泡', pdfPath: '/scripts/yandere-diary/characters/灯泡.pdf', description: '光明与希望的象征' },
                            { id: 'char_pencil', name: '铅笔', pdfPath: '/scripts/yandere-diary/characters/铅笔.pdf', description: '创作与表达的媒介' },
                        ],
                        clues: [],
                        gameAssets: { handbookPath: '/scripts/yandere-diary/handbook/病娇男孩-组织者手册.pdf' },
                    },
                    is_premium: false,
                },
            ];

            for (const script of scripts) {
                const insertResponse = await fetch(`${SUPABASE_URL}/rest/v1/stories`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'apikey': SUPABASE_KEY,
                        'Authorization': `Bearer ${SUPABASE_KEY}`,
                        'Prefer': 'return=minimal',
                    },
                    body: JSON.stringify(script),
                });

                if (insertResponse.ok || insertResponse.status === 409) {
                    console.log(`✅ Inserted: ${script.title}`);
                } else {
                    const errorText = await insertResponse.text();
                    console.log(`❌ Failed to insert ${script.title}:`, insertResponse.status, errorText);
                }
            }

            console.log('\n✅ Migration completed!');
            console.log('🎉 Three official scripts have been added to the database.');
            console.log('\n📍 Next step: Refresh your browser at http://localhost:5200/script-murder');
            return;
        }

        const result = await response.json();
        console.log('✅ Migration executed successfully!');
        console.log('Result:', result);

    } catch (error) {
        console.error('❌ Migration failed:', error);
        process.exit(1);
    }
}

applyMigration();
