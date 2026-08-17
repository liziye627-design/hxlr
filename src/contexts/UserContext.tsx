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

      try {
        const userData = await userApi.getOrCreateUser(userId, nickname);
        if (userData) {
          setUser(userData);
        } else {
          // Create a guest user locally if database fails
          console.warn('⚠️ Database unavailable. Creating guest user.');
          createGuestUser(userId, nickname);
        }
      } catch (dbError) {
        console.error('Failed to connect to database:', dbError);
        console.warn('⚠️ Creating guest user with limited features.');
        createGuestUser(userId, nickname);
      }
    } catch (error) {
      console.error('Failed to initialize user:', error);
      // Create a minimal guest user as last resort
      createGuestUser('guest-' + Date.now(), '访客');
    } finally {
      setLoading(false);
    }
  };

  const createGuestUser = (id: string, nickname: string) => {
    setUser({
      id,
      nickname,
      avatar_url: `https://api.dicebear.com/7.x/avataaars/svg?seed=${id}`,
      level: 1,
      experience: 0,
      coins: 100,
      vip_status: 'free',
      vip_expire_at: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
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

  const isVIP =
    user?.vip_status !== 'free' &&
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
