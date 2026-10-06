const STORAGE_KEYS = {
  USERS: 'ismo_users',
  CURRENT_USER: 'ismo_current_user',
  TOKEN: 'ismo_token',
  PROJECTS: 'ismo_projects',
  TASKS: 'ismo_tasks',
};

const DEFAULT_USERS = [
  {
    id: 'u-1',
    name: 'Pranat (Intern Demo)',
    email: 'intern@ismo.dev',
  },
];

const DEFAULT_PROJECTS = [
  {
    id: 'proj-1',
    name: 'E-Commerce Platform Redesign',
    description: 'Revamping the core checkout experience and product catalog for high conversion.',
    status: 'In Progress',
    startDate: '2026-09-15',
    endDate: '2026-11-30',
    createdAt: '2026-09-15T10:00:00.000Z',
    userId: 'u-1',
  },
  {
    id: 'proj-2',
    name: 'Mobile Banking Application',
    description: 'Cross-platform financial management app for seamless transfers and bill payments.',
    status: 'Not Started',
    startDate: '2026-10-10',
    endDate: '2026-12-20',
    createdAt: '2026-10-01T09:30:00.000Z',
    userId: 'u-1',
  },
  {
    id: 'proj-3',
    name: 'AI Analytics Dashboard',
    description: 'Internal business intelligence metrics tool with predictive forecasts.',
    status: 'Completed',
    startDate: '2026-08-01',
    endDate: '2026-09-30',
    createdAt: '2026-08-01T08:00:00.000Z',
    userId: 'u-1',
  },
];

const DEFAULT_TASKS = [
  {
    id: 'task-1',
    projectId: 'proj-1',
    projectName: 'E-Commerce Platform Redesign',
    name: 'Integrate Stripe Payment Gateway',
    description: 'Implement tokenized card charges, webhooks, and refund flow.',
    priority: 'High',
    status: 'In Progress',
    dueDate: '2026-10-25',
    createdAt: '2026-09-20T11:00:00.000Z',
  },
  {
    id: 'task-2',
    projectId: 'proj-1',
    projectName: 'E-Commerce Platform Redesign',
    name: 'Design Cart & Checkout Wireframes',
    description: 'Deliver mobile-first responsive wireframes in Figma.',
    priority: 'Medium',
    status: 'Completed',
    dueDate: '2026-09-28',
    createdAt: '2026-09-16T12:00:00.000Z',
  },
  {
    id: 'task-3',
    projectId: 'proj-2',
    projectName: 'Mobile Banking Application',
    name: 'Setup React Native / Flutter Boilerplate',
    description: 'Configure environment, secure storage, and base routing.',
    priority: 'High',
    status: 'Pending',
    dueDate: '2026-10-18',
    createdAt: '2026-10-02T14:00:00.000Z',
  },
  {
    id: 'task-4',
    projectId: 'proj-2',
    projectName: 'Mobile Banking Application',
    name: 'Draft API contracts for transfer service',
    description: 'Define OpenAPI schema for fund transfer endpoints.',
    priority: 'Low',
    status: 'Pending',
    dueDate: '2026-10-22',
    createdAt: '2026-10-03T09:00:00.000Z',
  },
  {
    id: 'task-5',
    projectId: 'proj-3',
    projectName: 'AI Analytics Dashboard',
    name: 'Train trend forecasting model',
    description: 'Export monthly aggregate metrics and train ARIMA model.',
    priority: 'High',
    status: 'Completed',
    dueDate: '2026-09-15',
    createdAt: '2026-08-10T08:30:00.000Z',
  },
];

export const mockStorage = {
  init() {
    if (!localStorage.getItem(STORAGE_KEYS.USERS)) {
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(DEFAULT_USERS));
    }
    if (!localStorage.getItem(STORAGE_KEYS.PROJECTS)) {
      localStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(DEFAULT_PROJECTS));
    }
    if (!localStorage.getItem(STORAGE_KEYS.TASKS)) {
      localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(DEFAULT_TASKS));
    }
    if (!localStorage.getItem(STORAGE_KEYS.CURRENT_USER)) {
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(DEFAULT_USERS[0]));
      localStorage.setItem(STORAGE_KEYS.TOKEN, 'mock-jwt-token-ismo-intern');
    }
  },

  getCurrentUser() {
    this.init();
    const raw = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
    return raw ? JSON.parse(raw) : null;
  },

  getToken() {
    return localStorage.getItem(STORAGE_KEYS.TOKEN);
  },

  login(email, _password) {
    this.init();
    const users = JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || '[]');
    let user = users.find((u) => u.email.toLowerCase() === email.toLowerCase());
    if (!user) {
      user = {
        id: `u-${Date.now()}`,
        name: email.split('@')[0],
        email: email,
      };
      users.push(user);
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
    }
    const token = `mock-token-${Date.now()}`;
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
    localStorage.setItem(STORAGE_KEYS.TOKEN, token);
    return { user, token };
  },

  register(name, email, _password) {
    this.init();
    const users = JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || '[]');
    const existing = users.find((u) => u.email.toLowerCase() === email.toLowerCase());
    if (existing) {
      throw new Error('Email address already registered.');
    }
    const newUser = {
      id: `u-${Date.now()}`,
      name,
      email,
    };
    users.push(newUser);
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
    const token = `mock-token-${Date.now()}`;
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(newUser));
    localStorage.setItem(STORAGE_KEYS.TOKEN, token);
    return { user: newUser, token };
  },

  logout() {
    localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
    localStorage.removeItem(STORAGE_KEYS.TOKEN);
  },

  getProjects() {
    this.init();
    const projects = JSON.parse(localStorage.getItem(STORAGE_KEYS.PROJECTS) || '[]');
    const tasks = JSON.parse(localStorage.getItem(STORAGE_KEYS.TASKS) || '[]');

    return projects.map((p) => {
      const pTasks = tasks.filter((t) => t.projectId === p.id);
      return {
        ...p,
        taskCount: pTasks.length,
        completedTaskCount: pTasks.filter((t) => t.status === 'Completed').length,
      };
    });
  },

  getProject(id) {
    const list = this.getProjects();
    return list.find((p) => p.id === id) || null;
  },

  createProject(data) {
    this.init();
    const projects = JSON.parse(localStorage.getItem(STORAGE_KEYS.PROJECTS) || '[]');
    const newProject = {
      ...data,
      id: `proj-${Date.now()}`,
      createdAt: new Date().toISOString(),
      taskCount: 0,
      completedTaskCount: 0,
    };
    projects.unshift(newProject);
    localStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(projects));
    return newProject;
  },

  updateProject(id, data) {
    this.init();
    const projects = JSON.parse(localStorage.getItem(STORAGE_KEYS.PROJECTS) || '[]');
    const index = projects.findIndex((p) => p.id === id);
    if (index === -1) throw new Error('Project not found');
    projects[index] = { ...projects[index], ...data };
    localStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(projects));
    return this.getProject(id);
  },

  deleteProject(id) {
    this.init();
    const projects = JSON.parse(localStorage.getItem(STORAGE_KEYS.PROJECTS) || '[]');
    const filtered = projects.filter((p) => p.id !== id);
    localStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(filtered));

    const tasks = JSON.parse(localStorage.getItem(STORAGE_KEYS.TASKS) || '[]');
    const filteredTasks = tasks.filter((t) => t.projectId !== id);
    localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(filteredTasks));
  },

  getTasks(projectId) {
    this.init();
    let tasks = JSON.parse(localStorage.getItem(STORAGE_KEYS.TASKS) || '[]');
    const projects = JSON.parse(localStorage.getItem(STORAGE_KEYS.PROJECTS) || '[]');

    tasks = tasks.map((t) => {
      const proj = projects.find((p) => p.id === t.projectId);
      return {
        ...t,
        projectName: proj ? proj.name : 'Unassigned Project',
      };
    });

    if (projectId) {
      return tasks.filter((t) => t.projectId === projectId);
    }
    return tasks;
  },

  getTask(id) {
    const list = this.getTasks();
    return list.find((t) => t.id === id) || null;
  },

  createTask(data) {
    this.init();
    const tasks = JSON.parse(localStorage.getItem(STORAGE_KEYS.TASKS) || '[]');
    const projects = JSON.parse(localStorage.getItem(STORAGE_KEYS.PROJECTS) || '[]');
    const proj = projects.find((p) => p.id === data.projectId);

    const newTask = {
      ...data,
      id: `task-${Date.now()}`,
      projectName: proj ? proj.name : '',
      createdAt: new Date().toISOString(),
    };
    tasks.unshift(newTask);
    localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(tasks));
    return newTask;
  },

  updateTask(id, data) {
    this.init();
    const tasks = JSON.parse(localStorage.getItem(STORAGE_KEYS.TASKS) || '[]');
    const index = tasks.findIndex((t) => t.id === id);
    if (index === -1) throw new Error('Task not found');
    tasks[index] = { ...tasks[index], ...data };
    localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(tasks));
    return this.getTask(id);
  },

  deleteTask(id) {
    this.init();
    const tasks = JSON.parse(localStorage.getItem(STORAGE_KEYS.TASKS) || '[]');
    const filtered = tasks.filter((t) => t.id !== id);
    localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(filtered));
  },

  getDashboardStats() {
    const projects = this.getProjects();
    const tasks = this.getTasks();

    const totalProjects = projects.length;
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter((t) => t.status === 'Completed').length;
    const pendingTasks = tasks.filter((t) => t.status === 'Pending').length;
    const projectsInProgress = projects.filter((p) => p.status === 'In Progress').length;

    return {
      totalProjects,
      totalTasks,
      completedTasks,
      pendingTasks,
      projectsInProgress,
    };
  },
};

