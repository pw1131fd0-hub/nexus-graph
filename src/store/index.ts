import { create } from 'zustand';
import { User, Repo, GraphData, GraphNode } from '@/lib/api';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  login: (user: User, accessToken: string, refreshToken: string) => void;
  logout: () => void;
  setTokens: (accessToken: string, refreshToken: string) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: null,
  refreshToken: null,
  isAuthenticated: false,
  login: (user, accessToken, refreshToken) => {
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
    set({ user, accessToken, refreshToken, isAuthenticated: true });
  },
  logout: () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    set({ user: null, accessToken: null, refreshToken: null, isAuthenticated: false });
  },
  setTokens: (accessToken, refreshToken) => {
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
    set({ accessToken, refreshToken });
  },
}));

interface GraphState {
  currentRepo: Repo | null;
  graphData: GraphData | null;
  selectedNode: GraphNode | null;
  isLoading: boolean;
  error: string | null;
  setRepo: (repo: Repo) => void;
  setGraphData: (data: GraphData) => void;
  selectNode: (node: GraphNode | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearGraph: () => void;
}

export const useGraphStore = create<GraphState>((set) => ({
  currentRepo: null,
  graphData: null,
  selectedNode: null,
  isLoading: false,
  error: null,
  setRepo: (repo) => set({ currentRepo: repo }),
  setGraphData: (data) => set({ graphData: data }),
  selectNode: (node) => set({ selectedNode: node }),
  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),
  clearGraph: () => set({ currentRepo: null, graphData: null, selectedNode: null }),
}));
