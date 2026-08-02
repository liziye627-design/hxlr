import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { AGENT_SHOWROOM, findAgentShowcase, type AgentShowcaseEntry } from '@/config/agentRoster';
import type { CompanionCarryMode, GameModeId } from '@/config/gameModes';

interface AgentSelectionContextType {
  agents: AgentShowcaseEntry[];
  selectedAgentId: string;
  selectedAgent: AgentShowcaseEntry;
  pendingMode: GameModeId | null;
  carryModes: Partial<Record<GameModeId, CompanionCarryMode>>;
  setSelectedAgentId: (agentId: string) => void;
  setPendingMode: (mode: GameModeId | null) => void;
  setCarryMode: (mode: GameModeId, carryMode: CompanionCarryMode) => void;
  clearPendingMode: () => void;
  clearSelectedAgent: () => void;
}

const STORAGE_KEY = 'selectedAgentId';
const PENDING_MODE_KEY = 'pendingGameMode';
const CARRY_MODES_KEY = 'carryModes';

const AgentSelectionContext = createContext<AgentSelectionContextType | undefined>(undefined);

export function AgentSelectionProvider({ children }: { children: ReactNode }) {
  const [selectedAgentId, setSelectedAgentIdState] = useState(AGENT_SHOWROOM[0]?.id ?? '');
  const [pendingMode, setPendingModeState] = useState<GameModeId | null>(null);
  const [carryModes, setCarryModes] = useState<Partial<Record<GameModeId, CompanionCarryMode>>>({});

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored && findAgentShowcase(stored)) {
      setSelectedAgentIdState(stored);
    }

    const storedPendingMode = window.localStorage.getItem(PENDING_MODE_KEY);
    if (storedPendingMode === 'werewolf' || storedPendingMode === 'script_murder' || storedPendingMode === 'adventure') {
      setPendingModeState(storedPendingMode);
    }

    const storedCarryModes = window.localStorage.getItem(CARRY_MODES_KEY);
    if (storedCarryModes) {
      try {
        const parsed = JSON.parse(storedCarryModes) as Partial<Record<GameModeId, CompanionCarryMode>>;
        setCarryModes(parsed);
      } catch (error) {
        console.error('Failed to parse carry mode state:', error);
      }
    }
  }, []);

  useEffect(() => {
    if (!selectedAgentId) return;
    window.localStorage.setItem(STORAGE_KEY, selectedAgentId);
  }, [selectedAgentId]);

  useEffect(() => {
    if (!pendingMode) {
      window.localStorage.removeItem(PENDING_MODE_KEY);
      return;
    }

    window.localStorage.setItem(PENDING_MODE_KEY, pendingMode);
  }, [pendingMode]);

  useEffect(() => {
    window.localStorage.setItem(CARRY_MODES_KEY, JSON.stringify(carryModes));
  }, [carryModes]);

  const selectedAgent = useMemo(
    () => findAgentShowcase(selectedAgentId) ?? AGENT_SHOWROOM[0],
    [selectedAgentId],
  );

  const setSelectedAgentId = (agentId: string) => {
    if (!findAgentShowcase(agentId)) return;
    setSelectedAgentIdState(agentId);
  };

  const setPendingMode = (mode: GameModeId | null) => {
    setPendingModeState(mode);
  };

  const setCarryMode = (mode: GameModeId, carryMode: CompanionCarryMode) => {
    setCarryModes((current) => ({
      ...current,
      [mode]: carryMode,
    }));
  };

  const clearPendingMode = () => {
    setPendingModeState(null);
    window.localStorage.removeItem(PENDING_MODE_KEY);
  };

  const clearSelectedAgent = () => {
    const fallback = AGENT_SHOWROOM[0]?.id ?? '';
    setSelectedAgentIdState(fallback);
    if (fallback) {
      window.localStorage.setItem(STORAGE_KEY, fallback);
    } else {
      window.localStorage.removeItem(STORAGE_KEY);
    }
  };

  return (
    <AgentSelectionContext.Provider
      value={{
        agents: AGENT_SHOWROOM,
        selectedAgentId,
        selectedAgent,
        pendingMode,
        carryModes,
        setSelectedAgentId,
        setPendingMode,
        setCarryMode,
        clearPendingMode,
        clearSelectedAgent,
      }}
    >
      {children}
    </AgentSelectionContext.Provider>
  );
}

export function useAgentSelection() {
  const context = useContext(AgentSelectionContext);
  if (!context) {
    throw new Error('useAgentSelection must be used within an AgentSelectionProvider');
  }
  return context;
}
