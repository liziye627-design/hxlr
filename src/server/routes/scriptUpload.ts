import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs/promises';
import { parseAllScripts } from '../services/pdfParser';
import { analyzeScript } from '../services/scriptAnalyzer';
import { generateAllAgentConfigs } from '../services/agentConfigGenerator';
import { scriptRepository } from '../repositories/ScriptRepository';
import { agentRepository } from '../repositories/AgentRepository';

const router = Router();

// Configure multer for file upload
const storage = multer.diskStorage({
    destination: async (req, file, cb) => {
        const uploadDir = path.join(process.cwd(), 'uploads', 'scripts');
        await fs.mkdir(uploadDir, { recursive: true });
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage,
    limits: {
        fileSize: 50 * 1024 * 1024, // 50MB per file
    },
    fileFilter: (req, file, cb) => {
        const allowedTypes = ['.pdf', '.txt', '.docx'];
        const ext = path.extname(file.originalname).toLowerCase();

        if (allowedTypes.includes(ext)) {
            cb(null, true);
        } else {
            cb(new Error('只支持 PDF、TXT、DOCX 格式的文件'));
        }
    }
});

// Upload endpoint with full integration
router.post('/upload', upload.fields([
    { name: 'dmHandbook', maxCount: 1 },
    { name: 'characterScript_0', maxCount: 1 },
    { name: 'characterScript_1', maxCount: 1 },
    { name: 'characterScript_2', maxCount: 1 },
    { name: 'characterScript_3', maxCount: 1 },
    { name: 'characterScript_4', maxCount: 1 },
    { name: 'characterScript_5', maxCount: 1 },
    { name: 'characterScript_6', maxCount: 1 },
    { name: 'characterScript_7', maxCount: 1 },
    { name: 'characterScript_8', maxCount: 1 },
    { name: 'characterScript_9', maxCount: 1 },
    { name: 'characterScript_10', maxCount: 1 },
    { name: 'characterScript_11', maxCount: 1 },
]), async (req, res) => {
    try {
        const { scriptName, playerCount } = req.body;
        const files = req.files as { [fieldname: string]: Express.Multer.File[] };

        console.log('[Upload] Received upload request:', { scriptName, playerCount });

        if (!scriptName || !playerCount) {
            return res.status(400).json({
                success: false,
                error: '缺少必要信息：剧本名称或玩家人数'
            });
        }

        // Get DM handbook
        const dmHandbook = files['dmHandbook']?.[0];
        if (!dmHandbook) {
            return res.status(400).json({
                success: false,
                error: '缺少主持人手册'
            });
        }

        // Get character scripts
        const characterScripts: Express.Multer.File[] = [];
        for (let i = 0; i < parseInt(playerCount); i++) {
            const script = files[`characterScript_${i}`]?.[0];
            if (script) {
                characterScripts.push(script);
            }
        }

        if (characterScripts.length !== parseInt(playerCount)) {
            return res.status(400).json({
                success: false,
                error: `角色剧本数量（${characterScripts.length}）与玩家人数（${playerCount}）不匹配`
            });
        }

        // Create script directory
        const scriptId = `script-${Date.now()}`;
        const scriptDir = path.join(process.cwd(), 'uploads', 'scripts', scriptId);
        await fs.mkdir(scriptDir, { recursive: true });

        // Move files to script directory
        const dmPath = path.join(scriptDir, 'dm-handbook.pdf');
        await fs.rename(dmHandbook.path, dmPath);

        const characterPaths: string[] = [];
        for (let i = 0; i < characterScripts.length; i++) {
            const charPath = path.join(scriptDir, `character-${i}.pdf`);
            await fs.rename(characterScripts[i].path, charPath);
            characterPaths.push(charPath);
        }

        console.log('[Upload] Files saved, starting PDF extraction...');

        // 🆕 Step 1: Extract PDF text
        const { dmText, characterTexts } = await parseAllScripts(dmPath, characterPaths);

        console.log('[Upload] PDF extraction complete, starting AI analysis...');

        // 🆕 Step 2: AI analyze script
        const scriptAnalysis = await analyzeScript(dmText, characterTexts);

        console.log('[Upload] AI analysis complete, generating agent configs...');

        // 🆕 Step 3: Generate AI agent configs
        const agentConfigs = generateAllAgentConfigs(scriptAnalysis, scriptId);

        console.log('[Upload] Saving to database...');

        // 🆕 Step 4: Save script to database
        const script = await scriptRepository.createScript({
            id: scriptId,
            title: scriptAnalysis.title || scriptName,
            description: scriptAnalysis.summary,
            playerCount: parseInt(playerCount),
            scenes: scriptAnalysis.scenes,
            clues: scriptAnalysis.clues,
            gameFlow: scriptAnalysis.game_flow,
            dmHandbookPath: dmPath,
            category: '自定义',
            isPremium: false
        });

        // 🆕 Step 5: Save AI agent configs to database
        await agentRepository.saveAllAgents(scriptId, agentConfigs);

        console.log('[Upload] Database saved, creating meta.json...');

        // Save meta.json for quick access
        await fs.writeFile(
            path.join(scriptDir, 'meta.json'),
            JSON.stringify({
                scriptId,
                title: script.title,
                characters: agentConfigs.map(c => ({
                    id: c.id,
                    name: c.characterName,
                    description: c.characterDescription
                })),
                playerCount: parseInt(playerCount),
                uploadedAt: new Date().toISOString(),
                status: 'ready'
            }, null, 2)
        );

        console.log('[Upload] Complete!');

        res.json({
            success: true,
            scriptId,
            script: {
                id: script.id,
                title: script.title,
                description: script.description,
                playerCount: script.playerCount
            },
            characters: agentConfigs.map(c => ({
                id: c.id,
                name: c.characterName,
                age: c.characterAge,
                description: c.characterDescription,
                coreEssence: c.coreEssence
            })),
            message: '剧本上传成功，AI角色已创建并保存！'
        });

    } catch (error) {
        console.error('[Upload] Error:', error);
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : '上传失败'
        });
    }
});

// Get uploaded scripts list
router.get('/list', async (req, res) => {
    try {
        const scripts = await scriptRepository.getAllScripts();
        res.json({ success: true, scripts });
    } catch (error) {
        console.error('List scripts error:', error);
        res.status(500).json({
            success: false,
            error: '获取剧本列表失败'
        });
    }
});

// Get script details with agents
router.get('/:scriptId', async (req, res) => {
    try {
        const { scriptId } = req.params;

        const script = await scriptRepository.getScriptById(scriptId);
        if (!script) {
            return res.status(404).json({
                success: false,
                error: '剧本不存在'
            });
        }

        const agents = await agentRepository.loadAgentsByScript(scriptId);

        res.json({
            success: true,
            script,
            characters: agents.map(a => ({
                id: a.id,
                name: a.characterName,
                age: a.characterAge,
                description: a.characterDescription
            }))
        });
    } catch (error) {
        console.error('Get script error:', error);
        res.status(500).json({
            success: false,
            error: '获取剧本详情失败'
        });
    }
});

export default router;
