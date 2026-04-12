import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      const refreshToken = localStorage.getItem('refreshToken');
      if (refreshToken && !error.config._retry) {
        error.config._retry = true;
        try {
          const { data } = await axios.post(`${API_URL}/api/auth/refresh`, {
            refreshToken,
          });
          localStorage.setItem('accessToken', data.accessToken);
          error.config.headers.Authorization = `Bearer ${data.accessToken}`;
          return api(error.config);
        } catch {
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          if (typeof window !== 'undefined') {
            window.location.href = '/';
          }
        }
      }
    }
    return Promise.reject(error);
  }
);

export interface User {
  id: string;
  email: string;
  name: string;
  plan: string;
}

export interface Repo {
  id: string;
  name: string;
  githubUrl: string;
  status: 'pending' | 'processing' | 'completed' | 'error';
  nodeCount: number;
  edgeCount: number;
  createdAt: string;
}

export interface GraphNode {
  id: string;
  type: 'file' | 'function';
  label: string;
  filePath: string;
  description: string;
  metrics: {
    linesOfCode: number;
    functionCount: number;
    callCount?: number;
  };
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  type: 'CALLS' | 'IMPORTS' | 'CONTAINS';
}

export interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export const authApi = {
  register: (email: string, password: string, name: string) =>
    api.post('/api/auth/register', { email, password, name }),

  login: (email: string, password: string) =>
    api.post('/api/auth/login', { email, password }),

  refresh: (refreshToken: string) =>
    api.post('/api/auth/refresh', { refreshToken }),
};

export const reposApi = {
  create: (githubUrl: string, name: string) =>
    api.post('/api/repos', { githubUrl, name }),

  get: (id: string) =>
    api.get<Repo>(`/api/repos/${id}`),

  getStatus: (id: string) =>
    api.get(`/api/repos/${id}/status`),

  delete: (id: string) =>
    api.delete(`/api/repos/${id}`),

  list: () =>
    api.get<Repo[]>('/api/repos'),
};

export const graphApi = {
  getGraph: (repoId: string) =>
    api.get<GraphData>(`/api/graph/${repoId}`),

  getNode: (repoId: string, nodeId: string) =>
    api.get(`/api/graph/${repoId}/nodes/${nodeId}`),

  search: (repoId: string, query: string) =>
    api.get(`/api/graph/${repoId}/search`, { params: { q: query } }),
};

export const teamsApi = {
  create: (name: string, slug: string) =>
    api.post('/api/teams', { name, slug }),

  getMembers: (teamId: string) =>
    api.get(`/api/teams/${teamId}/members`),

  invite: (teamId: string, email: string, role: string) =>
    api.post(`/api/teams/${teamId}/invite`, { email, role }),
};

export const exportApi = {
  exportMarkdown: (repoId: string, nodeIds: string[], includeAnnotations: boolean, includeEmbeddings: boolean) =>
    api.post(`/api/export/${repoId}/markdown`, {
      nodeIds,
      includeAnnotations,
      includeEmbeddings,
    }),
};

export default api;
