import { supabase } from '../supabase';

export interface AgentConfig {
  id: string;
  scriptId: string;
  characterName: string;
  characterAge?: number;
  characterDescription?: string;
  personality: string;
  secrets: string[];
  coreEssence: string;
  systemPrompt: string;
  agentConfig: {
    relationships?: Array<{
      target: string;
      type: string;
      description: string;
    }>;
    speechPatterns?: {
      tone: string;
      keywords: string[];
      forbiddenTopics: string[];
    };
  };
}

export class AgentRepository {
  /**
   * 保存单个Agent配置到数据库
   */
  async saveAgent(agentConfig: AgentConfig): Promise<void> {
    const { error } = await supabase
      .from('ai_agents')
      .upsert({
        id: agentConfig.id,
        script_id: agentConfig.scriptId,
        character_name: agentConfig.characterName,
        character_age: agentConfig.characterAge,
        character_description: agentConfig.characterDescription,
        personality: agentConfig.personality,
        secrets: agentConfig.secrets, // Supabase handles array/json conversion usually
        core_essence: agentConfig.coreEssence,
        system_prompt: agentConfig.systemPrompt,
        agent_config: agentConfig.agentConfig,
        updated_at: new Date().toISOString()
      }, { onConflict: 'script_id, character_name' });

    if (error) {
      if ((error as any).code === '42P01' || /relation\s+"public\.ai_agents"\s+does\s+not\s+exist/i.test(String(error.message))) {
        console.warn('ai_agents table missing, skipping saveAgent for development environment');
        return;
      }
      console.error('Error saving agent:', error);
    }
  }

  /**
   * 批量保存所有Agent配置
   */
  async saveAllAgents(scriptId: string, agents: AgentConfig[]): Promise<void> {
    for (const agent of agents) {
      await this.saveAgent({ ...agent, scriptId });
    }
  }

  /**
   * 根据剧本ID加载所有Agent配置
   */
  async loadAgentsByScript(scriptId: string): Promise<AgentConfig[]> {
    const { data, error } = await supabase
      .from('ai_agents')
      .select('*')
      .eq('script_id', scriptId)
      .eq('is_active', true)
      .order('created_at', { ascending: true });

    if (error) {
      if ((error as any).code === '42P01' || /relation\s+"public\.ai_agents"\s+does\s+not\s+exist/i.test(String(error.message))) {
        console.warn('ai_agents table missing, returning empty agents list');
        return [];
      }
      console.error('Error loading agents:', error);
      return [];
    }

    return data.map(row => ({
      id: row.id,
      scriptId: row.script_id,
      characterName: row.character_name,
      characterAge: row.character_age,
      characterDescription: row.character_description,
      personality: row.personality,
      secrets: row.secrets,
      coreEssence: row.core_essence,
      systemPrompt: row.system_prompt,
      agentConfig: row.agent_config
    }));
  }

  /**
   * 获取单个Agent配置
   */
  async getAgentById(agentId: string): Promise<AgentConfig | null> {
    const { data, error } = await supabase
      .from('ai_agents')
      .select('*')
      .eq('id', agentId)
      .eq('is_active', true)
      .single();

    if (error) {
      if ((error as any).code === '42P01' || /relation\s+"public\.ai_agents"\s+does\s+not\s+exist/i.test(String(error.message))) {
        console.warn('ai_agents table missing, getAgentById returns null');
        return null;
      }
      return null;
    }
    if (!data) return null;

    return {
      id: data.id,
      scriptId: data.script_id,
      characterName: data.character_name,
      characterAge: data.character_age,
      characterDescription: data.character_description,
      personality: data.personality,
      secrets: data.secrets,
      coreEssence: data.core_essence,
      systemPrompt: data.system_prompt,
      agentConfig: data.agent_config
    };
  }

  /**
   * 删除Agent
   */
  async deleteAgent(agentId: string): Promise<void> {
    const { error } = await supabase
      .from('ai_agents')
      .update({ is_active: false })
      .eq('id', agentId);
    if (error) {
      if ((error as any).code === '42P01') return;
      console.error('Error deleting agent:', error);
    }
  }

  /**
   * 更新Agent的System Prompt
   */
  async updateSystemPrompt(agentId: string, newPrompt: string): Promise<void> {
    const { error } = await supabase
      .from('ai_agents')
      .update({
        system_prompt: newPrompt,
        updated_at: new Date().toISOString()
      })
      .eq('id', agentId);
    if (error) {
      if ((error as any).code === '42P01') return;
      console.error('Error updating system prompt:', error);
    }
  }
}

export const agentRepository = new AgentRepository();
