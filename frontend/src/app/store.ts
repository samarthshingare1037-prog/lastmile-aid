import { create } from 'zustand';
import type { Role, User } from '@/api/types';

interface AppState {
  // Auth
  user: User | null;
  isAuthenticated: boolean;

  // Active role
  activeRole: Role | null;

  // Server clock offset (ms) = serverTime - clientTime
  clockOffset: number;

  // Connection status
  connectionStatus: 'connected' | 'reconnecting' | 'offline';

  // Dark mode
  isDarkMode: boolean;

  // Sidebar
  sidebarOpen: boolean;

  // Actions
  setUser: (user: User | null) => void;
  setActiveRole: (role: Role) => void;
  setClockOffset: (offset: number) => void;
  setConnectionStatus: (status: 'connected' | 'reconnecting' | 'offline') => void;
  toggleDarkMode: () => void;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  logout: () => void;
  serverNow: () => number;
}

export const useAppStore = create<AppState>((set, get) => ({
  user: null,
  isAuthenticated: false,
  activeRole: null,
  clockOffset: 0,
  connectionStatus: 'connected',
  isDarkMode: false,
  sidebarOpen: true,

  setUser: (user) =>
    set({
      user,
      isAuthenticated: !!user,
      activeRole: user?.activeRole || user?.roles[0] || null,
    }),

  setActiveRole: (role) =>
    set((state) => ({
      activeRole: role,
      user: state.user ? { ...state.user, activeRole: role } : null,
    })),

  setClockOffset: (offset) => set({ clockOffset: offset }),

  setConnectionStatus: (status) => set({ connectionStatus: status }),

  toggleDarkMode: () =>
    set((state) => {
      const newMode = !state.isDarkMode;
      if (newMode) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
      return { isDarkMode: newMode };
    }),

  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),

  logout: () =>
    set({
      user: null,
      isAuthenticated: false,
      activeRole: null,
    }),

  serverNow: () => Date.now() + get().clockOffset,
}));
