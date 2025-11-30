import { StateGraph, END, START } from '@langchain/langgraph';
import { BaseMessage } from '@langchain/core/messages';
import { AgentState, GameContext, AgentAction, RoleType, IAgent, StrategicIntent } from './types';
import { WerewolfPersona } from '@/types';
import { IRoleStrategy } from './strategies/types';
import { DeepSeekModel } from '@/lib/DeepSeekModel';
import { ChatPromptTemplate } from '@langchain/core/prompts';
import { StringOutputParser } from '@langchain/core/output_parsers';

export class GameAgent implements IAgent {
  id: string;
  name: string;
  role: RoleType;
  persona: WerewolfPersona;
  strategy: IRoleStrategy;

  protected graph: any;
  protected model: DeepSeekModel;

  constructor(
    id: string,
    name: string,
    role: RoleType,
    persona: WerewolfPersona,
    strategy: IRoleStrategy,
  ) {
    this.id = id;
    this.name = name;
    this.role = role;
    this.persona = persona;
    this.strategy = strategy;
    this.model = new DeepSeekModel({ temperature: 0.7 }); // Higher temp for personality
    this.graph = this.buildGraph();
  }

  protected buildGraph() {
    const workflow = new StateGraph<AgentState>({
      channels: {
        messages: {
          value: (_x: BaseMessage[], y: BaseMessage[]) => y,
          default: () => [],
        },
        context: {
          value: (_x: GameContext, y: GameContext) => y,
          default: () => ({}) as GameContext,
        },
        myRole: {
          value: (_x: RoleType, y: RoleType) => y,
          default: () => this.role,
        },
        myPersona: {
          value: (_x: WerewolfPersona, y: WerewolfPersona) => y,
          default: () => this.persona,
        },
        strategicIntent: {
          value: (_x: StrategicIntent | null, y: StrategicIntent | null) => y,
          default: () => null,
        },
        intendedAction: {
          value: (_x: AgentAction | null, y: AgentAction | null) => y,
          default: () => null,
        },
      },
    });

    workflow.addNode('perceive', this.perceiveNode.bind(this));
    workflow.addNode('strategize', this.strategizeNode.bind(this));
    workflow.addNode('articulate', this.articulateNode.bind(this));

    // Use type assertion to bypass LangGraph type definition issue
    // @ts-ignore - LangGraph v1.0.2 has incomplete type definitions for START/END in addEdge
    workflow.addEdge(START, 'perceive');
    // @ts-ignore
    workflow.addEdge('perceive', 'strategize');
    // @ts-ignore
    workflow.addEdge('strategize', 'articulate');
    // @ts-ignore
    workflow.addEdge('articulate', END);

    return workflow.compile();
  }

  protected async perceiveNode(state: AgentState): Promise<Partial<AgentState>> {
    return { context: state.context };
  }

  protected async strategizeNode(state: AgentState): Promise<Partial<AgentState>> {
    const intent = await this.strategy.getStrategicIntent(state.context);
    return {
      strategicIntent: intent,
    };
  }

  protected async articulateNode(state: AgentState): Promise<Partial<AgentState>> {
    const intent = state.strategicIntent;
    if (!intent) {
      return { intendedAction: { type: 'pass' } };
    }

    if (intent.action === 'speak') {
      // Use Persona to generate speech
      const prompt = ChatPromptTemplate.fromMessages([
        [
          'system',
          `You are playing a game of Werewolf.
Name: {name}
Role: {role} (Keep this secret if needed!)
Personality: {description}
Traits: Logic {logical_level}, Aggression {aggressive_level}, Emotion {emotional_level}

Your internal strategy says: "{reasoning}"
Key points to cover: "{content}"

Generate a short speech (max 50 words) that reflects your personality and achieves your strategic goal.
Do not output JSON, just the speech text.`,
        ],
        ['user', 'Current Phase: {phase}. Speak now.'],
      ]);

      const chain = prompt.pipe(this.model).pipe(new StringOutputParser());
      const speech = await chain.invoke({
        name: this.name,
        role: this.role,
        description: this.persona.description,
        logical_level: this.persona.personality_traits.logical_level,
        aggressive_level: this.persona.personality_traits.aggressive_level,
        emotional_level: this.persona.personality_traits.emotional_level,
        reasoning: intent.reasoning,
        content: intent.content || '',
        phase: state.context.phase,
      });

      return {
        intendedAction: {
          type: 'speak' as const,
          content: speech,
        },
      };
    } else if (intent.action === 'vote') {
      return {
        intendedAction: {
          type: 'vote' as const,
          targetId: intent.targetId!,
        },
      };
    } else if (intent.action === 'skill') {
      return {
        intendedAction: {
          type: 'skill' as const,
          targetId: intent.targetId,
          skillParams: intent.skillParams,
        },
      };
    } else {
      return {
        intendedAction: { type: 'pass' as const },
      };
    }
  }

  public async processTurn(context: GameContext): Promise<AgentAction> {
    const initialState: AgentState = {
      messages: [],
      context,
      myRole: this.role,
      myPersona: this.persona,
      strategicIntent: null,
      intendedAction: null,
    };

    const result = await this.graph.invoke(initialState);
    return result.intendedAction;
  }

  public receiveMessage(_message: BaseMessage): void {
    // Handle incoming messages
  }
}
