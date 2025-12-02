import { supabase } from '../supabase.js';

export interface Script {
    id: string;
    title: string;
    description?: string;
    playerCount: number;
    difficulty?: string;
    category?: string;
    scenes?: any[];
    clues?: any[];
    gameFlow?: string[];
    dmHandbookPath?: string;
    status: 'active' | 'archived';
    createdAt: Date;
    coverUrl?: string;
    isPremium: boolean;
    playCount: number;
    rating: number;
}

export class ScriptRepository {
    /**
     * 检查 Supabase 是否可用
     */
    private isAvailable(): boolean {
        return supabase !== null;
    }

    /**
     * 创建新剧本
     */
    async createScript(script: Partial<Script>): Promise<Script | null> {
        if (!this.isAvailable()) {
            console.warn('Supabase not configured, createScript skipped');
            return null;
        }
        const { data, error } = await supabase!
            .from('scripts')
            .insert({
                id: script.id || `script-${Date.now()}`,
                title: script.title,
                description: script.description,
                player_count: script.playerCount,
                difficulty: script.difficulty || 'normal',
                category: script.category || '推理',
                scenes: script.scenes || [],
                clues: script.clues || [],
                game_flow: script.gameFlow || [],
                dm_handbook_path: script.dmHandbookPath,
                cover_url: script.coverUrl,
                is_premium: script.isPremium || false,
                status: 'active'
            })
            .select()
            .single();

        if (error) {
            console.error('Error creating script:', error);
            return null;
        }

        return this.mapRow(data);
    }

    /**
     * 根据ID获取剧本
     */
    async getScriptById(scriptId: string): Promise<Script | null> {
        if (!this.isAvailable()) return null;
        const { data, error } = await supabase!
            .from('scripts')
            .select('*')
            .eq('id', scriptId)
            .eq('status', 'active')
            .single();

        if (error || !data) return null;
        return this.mapRow(data);
    }

    /**
     * 获取所有剧本列表
     */
    async getAllScripts(): Promise<Script[]> {
        if (!this.isAvailable()) return [];
        const { data, error } = await supabase!
            .from('scripts')
            .select('*')
            .eq('status', 'active')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching scripts:', error);
            return [];
        }

        return data.map(this.mapRow);
    }

    /**
     * 更新剧本信息
     */
    async updateScript(scriptId: string, updates: Partial<Script>): Promise<void> {
        if (!this.isAvailable()) return;
        const updateData: any = {};
        if (updates.title !== undefined) updateData.title = updates.title;
        if (updates.description !== undefined) updateData.description = updates.description;
        if (updates.scenes !== undefined) updateData.scenes = updates.scenes;
        if (updates.clues !== undefined) updateData.clues = updates.clues;

        updateData.updated_at = new Date().toISOString();

        const { error } = await supabase!
            .from('scripts')
            .update(updateData)
            .eq('id', scriptId);

        if (error) {
            console.error('Error updating script:', error);
        }
    }

    /**
     * 增加播放次数
     */
    async incrementPlayCount(scriptId: string): Promise<void> {
        if (!this.isAvailable()) return;
        // Note: Supabase doesn't support atomic increment easily without RPC.
        // For now, we'll fetch and update, or ignore race conditions for play count.
        // Ideally use an RPC function: await supabase.rpc('increment_play_count', { script_id: scriptId })

        const { data } = await supabase!.from('scripts').select('play_count').eq('id', scriptId).single();
        if (data) {
            await supabase!
                .from('scripts')
                .update({ play_count: (data.play_count || 0) + 1, updated_at: new Date().toISOString() })
                .eq('id', scriptId);
        }
    }

    /**
     * 归档剧本
     */
    async archiveScript(scriptId: string): Promise<void> {
        if (!this.isAvailable()) return;
        await supabase!
            .from('scripts')
            .update({ status: 'archived' })
            .eq('id', scriptId);
    }

    /**
     * 映射数据库行到对象
     */
    private mapRow(row: any): Script {
        return {
            id: row.id,
            title: row.title,
            description: row.description,
            playerCount: row.player_count,
            difficulty: row.difficulty,
            category: row.category,
            scenes: row.scenes,
            clues: row.clues,
            gameFlow: row.game_flow,
            dmHandbookPath: row.dm_handbook_path,
            status: row.status,
            createdAt: new Date(row.created_at),
            coverUrl: row.cover_url,
            isPremium: row.is_premium,
            playCount: row.play_count,
            rating: row.rating
        };
    }
}

export const scriptRepository = new ScriptRepository();
