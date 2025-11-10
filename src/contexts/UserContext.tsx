import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import type { UserProfile } from '@/types';
import { userApi } from '@/db/api';

interface UserContextType {
  user: UserProfile | null;
  loading: boolean;
  setUser: (user: UserProfile | null) => void;
  refreshUser: () => Promise<void>;
  isVIP: boolean;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    initUser();
  }, []);

  const initUser = async () => {
    try {
      let userId = localStorage.getItem('userId');
      
      if (!userId) {
        userId = crypto.randomUUID();
        localStorage.setItem('userId', userId);
      }

      const nickname = localStorage.getItem('userNickname') || `玩家${userId.slice(0, 6)}`;
      const userData = await userApi.getOrCreateUser(userId, nickname);
      
      if (userData) {
        setUser(userData);
      }
    } catch (error) {
      console.error('Failed to initialize user:', error);
    } finally {
      setLoading(false);
    }
  };

  const refreshUser = async () => {
    if (!user) return;
    
    try {
      const userData = await userApi.getUserById(user.id);
      if (userData) {
        setUser(userData);
      }
    } catch (error) {
      console.error('Failed to refresh user:', error);
    }
  };

  const isVIP = user?.vip_status !== 'free' && 
    (!user?.vip_expire_at || new Date(user.vip_expire_at) > new Date());

  return (
    <UserContext.Provider value={{ user, loading, setUser, refreshUser, isVIP }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}
