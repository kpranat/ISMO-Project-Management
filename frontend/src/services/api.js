import axios from 'axios';
import { mockStorage } from './mockStorage.js';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
// Default to false if VITE_USE_MOCK is explicitly 'false', otherwise true
const USE_MOCK = import.meta.env.VITE_USE_MOCK !== 'false';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000, // 10-second timeout
  headers: {
    'Content-Type': 'application/json',
  },
});

// Helper to extract clean, user-friendly error messages
export const getErrorMessage = (error) => {
  if (!error) return 'An unexpected error occurred.';

  // Timeout error
  if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
    return 'Request timed out (10s). Please check your internet connection or server status and try again.';
  }

  // Network error (server down or unreachable)
  if (error.message === 'Network Error' || !error.response) {
    return 'Cannot connect to backend server. Please verify the server is running on port 5000.';
  }

  // Backend returned custom message
  if (error.response?.data?.message) {
    return error.response.data.message;
  }

  // Backend validation errors array
  if (error.response?.data?.errors && Array.isArray(error.response.data.errors)) {
    return error.response.data.errors.map((e) => e.message).join(', ');
  }

  return error.message || 'An error occurred while processing your request.';
};

// Request interceptor: Always attach latest JWT token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('ismo_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: Handle 401s gracefully on protected routes
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const url = error.config?.url || '';

    // Only redirect to login if 401 occurred on a PROTECTED route, NOT during login/register
    const isAuthEndpoint = url.includes('/auth/login') || url.includes('/auth/register');

    if (status === 401 && !isAuthEndpoint) {
      localStorage.removeItem('ismo_token');
      localStorage.removeItem('ismo_current_user');

      const isAuthPage =
        window.location.pathname === '/login' || window.location.pathname === '/register';

      if (!isAuthPage) {
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  }
);

// Auth Service
export const authService = {
  async register(name, email, password) {
    if (USE_MOCK) {
      return mockStorage.register(name, email, password);
    }
    const res = await apiClient.post('/auth/register', { name, email, password });
    localStorage.setItem('ismo_token', res.data.token);
    localStorage.setItem('ismo_current_user', JSON.stringify(res.data.user));
    return res.data;
  },

  async login(email, password) {
    if (USE_MOCK) {
      return mockStorage.login(email, password);
    }
    const res = await apiClient.post('/auth/login', { email, password });
    localStorage.setItem('ismo_token', res.data.token);
    localStorage.setItem('ismo_current_user', JSON.stringify(res.data.user));
    return res.data;
  },

  async logout() {
    if (!USE_MOCK) {
      try {
        await apiClient.post('/auth/logout');
      } catch {
        // Ignore logout network failure, clean local state
      }
    }
    localStorage.removeItem('ismo_token');
    localStorage.removeItem('ismo_current_user');
    mockStorage.logout();
  },

  async getCurrentUser() {
    if (USE_MOCK) {
      return mockStorage.getCurrentUser();
    }
    const res = await apiClient.get('/auth/me');
    return res.data.user || res.data;
  },
};

// Project Service
export const projectService = {
  async getProjects(params = {}) {
    if (USE_MOCK) {
      return mockStorage.getProjects();
    }
    const res = await apiClient.get('/projects', { params });
    return res.data;
  },

  async getProject(id) {
    if (USE_MOCK) {
      return mockStorage.getProject(id);
    }
    const res = await apiClient.get(`/projects/${id}`);
    return res.data;
  },

  async createProject(data) {
    if (USE_MOCK) {
      return mockStorage.createProject(data);
    }
    const res = await apiClient.post('/projects', data);
    return res.data;
  },

  async updateProject(id, data) {
    if (USE_MOCK) {
      return mockStorage.updateProject(id, data);
    }
    const res = await apiClient.put(`/projects/${id}`, data);
    return res.data;
  },

  async deleteProject(id) {
    if (USE_MOCK) {
      return mockStorage.deleteProject(id);
    }
    const res = await apiClient.delete(`/projects/${id}`);
    return res.data;
  },
};

// Task Service
export const taskService = {
  async getTasks(projectId, params = {}) {
    if (USE_MOCK) {
      return mockStorage.getTasks(projectId);
    }
    const queryParams = { ...params };
    if (projectId) queryParams.projectId = projectId;
    const res = await apiClient.get('/tasks', { params: queryParams });
    return res.data;
  },

  async getTask(id) {
    if (USE_MOCK) {
      return mockStorage.getTask(id);
    }
    const res = await apiClient.get(`/tasks/${id}`);
    return res.data;
  },

  async createTask(data) {
    if (USE_MOCK) {
      return mockStorage.createTask(data);
    }
    const res = await apiClient.post('/tasks', data);
    return res.data;
  },

  async updateTask(id, data) {
    if (USE_MOCK) {
      return mockStorage.updateTask(id, data);
    }
    const res = await apiClient.put(`/tasks/${id}`, data);
    return res.data;
  },

  async deleteTask(id) {
    if (USE_MOCK) {
      return mockStorage.deleteTask(id);
    }
    const res = await apiClient.delete(`/tasks/${id}`);
    return res.data;
  },
};

// Dashboard Service
export const dashboardService = {
  async getDashboardStats() {
    if (USE_MOCK) {
      return mockStorage.getDashboardStats();
    }
    const res = await apiClient.get('/dashboard');
    return res.data;
  },
};
