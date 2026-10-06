import axios from 'axios';
import { mockStorage } from './mockStorage.js';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const USE_MOCK = import.meta.env.VITE_USE_MOCK !== 'false';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('ismo_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('ismo_token');
      localStorage.removeItem('ismo_current_user');
      if (window.location.pathname !== '/login' && window.location.pathname !== '/register') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export const authService = {
  async register(name, email, password) {
    if (USE_MOCK) {
      return mockStorage.register(name, email, password);
    }
    try {
      const res = await apiClient.post('/auth/register', { name, email, password });
      localStorage.setItem('ismo_token', res.data.token);
      localStorage.setItem('ismo_current_user', JSON.stringify(res.data.user));
      return res.data;
    } catch {
      console.warn('Backend unavailable, using mock storage fallback');
      return mockStorage.register(name, email, password);
    }
  },

  async login(email, password) {
    if (USE_MOCK) {
      return mockStorage.login(email, password);
    }
    try {
      const res = await apiClient.post('/auth/login', { email, password });
      localStorage.setItem('ismo_token', res.data.token);
      localStorage.setItem('ismo_current_user', JSON.stringify(res.data.user));
      return res.data;
    } catch {
      console.warn('Backend unavailable, using mock storage fallback');
      return mockStorage.login(email, password);
    }
  },

  async logout() {
    if (!USE_MOCK) {
      try {
        await apiClient.post('/auth/logout');
      } catch {
        // ignore
      }
    }
    mockStorage.logout();
  },

  async getCurrentUser() {
    if (USE_MOCK) {
      return mockStorage.getCurrentUser();
    }
    try {
      const res = await apiClient.get('/auth/me');
      return res.data.user || res.data;
    } catch {
      return mockStorage.getCurrentUser();
    }
  },
};

export const projectService = {
  async getProjects() {
    if (USE_MOCK) {
      return mockStorage.getProjects();
    }
    try {
      const res = await apiClient.get('/projects');
      return res.data;
    } catch {
      return mockStorage.getProjects();
    }
  },

  async getProject(id) {
    if (USE_MOCK) {
      return mockStorage.getProject(id);
    }
    try {
      const res = await apiClient.get(`/projects/${id}`);
      return res.data;
    } catch {
      return mockStorage.getProject(id);
    }
  },

  async createProject(data) {
    if (USE_MOCK) {
      return mockStorage.createProject(data);
    }
    try {
      const res = await apiClient.post('/projects', data);
      return res.data;
    } catch {
      return mockStorage.createProject(data);
    }
  },

  async updateProject(id, data) {
    if (USE_MOCK) {
      return mockStorage.updateProject(id, data);
    }
    try {
      const res = await apiClient.put(`/projects/${id}`, data);
      return res.data;
    } catch {
      return mockStorage.updateProject(id, data);
    }
  },

  async deleteProject(id) {
    if (USE_MOCK) {
      return mockStorage.deleteProject(id);
    }
    try {
      await apiClient.delete(`/projects/${id}`);
    } catch {
      mockStorage.deleteProject(id);
    }
  },
};

export const taskService = {
  async getTasks(projectId) {
    if (USE_MOCK) {
      return mockStorage.getTasks(projectId);
    }
    try {
      const params = projectId ? { projectId } : {};
      const res = await apiClient.get('/tasks', { params });
      return res.data;
    } catch {
      return mockStorage.getTasks(projectId);
    }
  },

  async getTask(id) {
    if (USE_MOCK) {
      return mockStorage.getTask(id);
    }
    try {
      const res = await apiClient.get(`/tasks/${id}`);
      return res.data;
    } catch {
      return mockStorage.getTask(id);
    }
  },

  async createTask(data) {
    if (USE_MOCK) {
      return mockStorage.createTask(data);
    }
    try {
      const res = await apiClient.post('/tasks', data);
      return res.data;
    } catch {
      return mockStorage.createTask(data);
    }
  },

  async updateTask(id, data) {
    if (USE_MOCK) {
      return mockStorage.updateTask(id, data);
    }
    try {
      const res = await apiClient.put(`/tasks/${id}`, data);
      return res.data;
    } catch {
      return mockStorage.updateTask(id, data);
    }
  },

  async deleteTask(id) {
    if (USE_MOCK) {
      return mockStorage.deleteTask(id);
    }
    try {
      await apiClient.delete(`/tasks/${id}`);
    } catch {
      mockStorage.deleteTask(id);
    }
  },
};

export const dashboardService = {
  async getDashboardStats() {
    if (USE_MOCK) {
      return mockStorage.getDashboardStats();
    }
    try {
      const res = await apiClient.get('/dashboard');
      return res.data;
    } catch {
      return mockStorage.getDashboardStats();
    }
  },
};

