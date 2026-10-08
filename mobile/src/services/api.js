import axios from 'axios';
import { authStorage } from './authStorage.js';
import { configService } from './config.js';

export const apiClient = axios.create({
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Dynamic baseURL interceptor: ensures active server IP is always used
apiClient.interceptors.request.use(async (config) => {
  const currentUrl = configService.getCurrentApiUrl();
  config.baseURL = currentUrl;

  const token = await authStorage.getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor: handle token expiration
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const status = error.response?.status;
    const url = error.config?.url || '';

    const isAuthEndpoint = url.includes('/auth/login') || url.includes('/auth/register');

    if (status === 401 && !isAuthEndpoint) {
      await authStorage.clearAll();
      if (onTokenExpiredHandler) {
        onTokenExpiredHandler();
      }
    }

    return Promise.reject(error);
  }
);

let onTokenExpiredHandler = null;
export const setTokenExpiredHandler = (handler) => {
  onTokenExpiredHandler = handler;
};

// Error message extractor for mobile UI
export const getErrorMessage = (error) => {
  if (!error) return 'An unexpected error occurred.';

  if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
    return 'Request timed out (10s). Check your Wi-Fi and server status.';
  }

  if (error.message === 'Network Error' || !error.response) {
    return `Cannot connect to server at ${configService.getCurrentApiUrl()}. Make sure your phone is connected to the same Wi-Fi.`;
  }

  if (error.response?.data?.message) {
    return error.response.data.message;
  }

  if (error.response?.data?.errors && Array.isArray(error.response.data.errors)) {
    return error.response.data.errors.map((e) => e.message).join(', ');
  }

  return error.message || 'An error occurred while connecting to the server.';
};

// Auth Service
export const authService = {
  async register(name, email, password) {
    const res = await apiClient.post('/auth/register', { name, email, password });
    if (res.data.token) {
      await authStorage.saveToken(res.data.token);
      await authStorage.saveUser(res.data.user);
    }
    return res.data;
  },

  async login(email, password) {
    const res = await apiClient.post('/auth/login', { email, password });
    if (res.data.token) {
      await authStorage.saveToken(res.data.token);
      await authStorage.saveUser(res.data.user);
    }
    return res.data;
  },

  async logout() {
    try {
      await apiClient.post('/auth/logout');
    } catch {
      // Ignore network failure on logout
    }
    await authStorage.clearAll();
  },

  async getCurrentUser() {
    const res = await apiClient.get('/auth/me');
    const user = res.data.user || res.data;
    await authStorage.saveUser(user);
    return user;
  },
};

// Project Service
export const projectService = {
  async getProjects(params = {}) {
    const res = await apiClient.get('/projects', { params });
    return res.data;
  },

  async getProject(id) {
    const res = await apiClient.get(`/projects/${id}`);
    return res.data;
  },

  async createProject(data) {
    const res = await apiClient.post('/projects', data);
    return res.data;
  },

  async updateProject(id, data) {
    const res = await apiClient.put(`/projects/${id}`, data);
    return res.data;
  },

  async deleteProject(id) {
    const res = await apiClient.delete(`/projects/${id}`);
    return res.data;
  },
};

// Task Service
export const taskService = {
  async getTasks(projectId, params = {}) {
    const queryParams = { ...params };
    if (projectId) queryParams.projectId = projectId;
    const res = await apiClient.get('/tasks', { params: queryParams });
    return res.data;
  },

  async getTask(id) {
    const res = await apiClient.get(`/tasks/${id}`);
    return res.data;
  },

  async createTask(data) {
    const res = await apiClient.post('/tasks', data);
    return res.data;
  },

  async updateTask(id, data) {
    const res = await apiClient.put(`/tasks/${id}`, data);
    return res.data;
  },

  async deleteTask(id) {
    const res = await apiClient.delete(`/tasks/${id}`);
    return res.data;
  },
};

// Dashboard Service
export const dashboardService = {
  async getDashboardStats() {
    const res = await apiClient.get('/dashboard');
    return res.data;
  },
};

// Activity & Updates Service
export const updateService = {
  async getUpdates() {
    const res = await apiClient.get('/updates');
    return res.data;
  },
};

// Users Service
export const userService = {
  async getUsers() {
    const res = await apiClient.get('/users');
    return res.data;
  },

  async getRoles() {
    const res = await apiClient.get('/users/roles');
    return res.data;
  },

  async updateUserRole(userId, roleName) {
    const res = await apiClient.patch(`/users/${userId}/role`, { roleName });
    return res.data;
  },
};

