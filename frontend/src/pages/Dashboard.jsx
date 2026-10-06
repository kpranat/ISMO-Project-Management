import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { dashboardService, projectService, taskService } from '../services/api.js';
import { StatCard } from '../components/StatCard.jsx';
import { StatusBadge, PriorityBadge } from '../components/Badges.jsx';
import { ProjectModal } from '../components/ProjectModal.jsx';
import { TaskModal } from '../components/TaskModal.jsx';
import {
  FolderKanban,
  CheckCircle2,
  Clock,
  Activity,
  Plus,
  ArrowRight,
  ListTodo,
  Calendar,
  Loader2,
} from 'lucide-react';

export const Dashboard = () => {
  const [stats, setStats] = useState({
    totalProjects: 0,
    totalTasks: 0,
    completedTasks: 0,
    pendingTasks: 0,
    projectsInProgress: 0,
  });
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals state
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [statsData, projectsData, tasksData] = await Promise.all([
        dashboardService.getDashboardStats(),
        projectService.getProjects(),
        taskService.getTasks(),
      ]);
      setStats(statsData);
      setProjects(projectsData);
      setTasks(tasksData);
    } catch (err) {
      console.error('Failed to load dashboard data', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleCreateProject = async (data) => {
    await projectService.createProject(data);
    await loadData();
  };

  const handleCreateTask = async (data) => {
    await taskService.createTask(data);
    await loadData();
  };

  const handleToggleTask = async (task) => {
    const nextStatus = task.status === 'Completed' ? 'In Progress' : 'Completed';
    await taskService.updateTask(task.id, { status: nextStatus });
    await loadData();
  };

  const upcomingTasks = tasks
    .filter((t) => t.status !== 'Completed')
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
    .slice(0, 5);

  const recentProjects = projects.slice(0, 4);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12">
      {/* Header section with quick actions */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Dashboard Overview
          </h1>
          <p className="mt-1 text-xs text-slate-500 sm:text-sm">
            Monitor all ongoing projects, task progress, and real-time completion metrics.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsTaskModalOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-xs hover:bg-slate-50 active:scale-95 transition"
          >
            <Plus className="h-4 w-4" />
            <span>Add Task</span>
          </button>
          <button
            onClick={() => setIsProjectModalOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-indigo-700 active:scale-95 transition"
          >
            <Plus className="h-4 w-4" />
            <span>New Project</span>
          </button>
        </div>
      </div>

      {/* 5 Stats Cards Required by Spec */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard
          title="Total Projects"
          value={stats.totalProjects}
          icon={FolderKanban}
          colorScheme="indigo"
          description="Managed active & finished"
        />
        <StatCard
          title="Projects In Progress"
          value={stats.projectsInProgress}
          icon={Activity}
          colorScheme="blue"
          description="Currently executing"
        />
        <StatCard
          title="Total Tasks"
          value={stats.totalTasks}
          icon={ListTodo}
          colorScheme="purple"
          description="Across all projects"
        />
        <StatCard
          title="Pending Tasks"
          value={stats.pendingTasks}
          icon={Clock}
          colorScheme="amber"
          description="Awaiting action"
        />
        <StatCard
          title="Completed Tasks"
          value={stats.completedTasks}
          icon={CheckCircle2}
          colorScheme="emerald"
          description="Successfully finished"
        />
      </div>

      {/* Projects & Tasks Overview Grid */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        {/* Projects Preview (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">Active Projects</h2>
            <Link
              to="/projects"
              className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-700"
            >
              View all <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="space-y-3">
            {recentProjects.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-300 p-8 text-center bg-white">
                <FolderKanban className="mx-auto h-8 w-8 text-slate-400" />
                <p className="mt-2 text-sm font-medium text-slate-700">No projects yet</p>
                <p className="mt-1 text-xs text-slate-500">Create your first project to start tracking.</p>
                <button
                  onClick={() => setIsProjectModalOpen(true)}
                  className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white"
                >
                  <Plus className="h-3.5 w-3.5" /> Create Project
                </button>
              </div>
            ) : (
              recentProjects.map((project) => {
                const total = project.taskCount || 0;
                const completed = project.completedTaskCount || 0;
                const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

                return (
                  <Link
                    key={project.id}
                    to={`/projects/${project.id}`}
                    className="block rounded-2xl border border-slate-200 bg-white p-5 shadow-xs transition hover:border-indigo-200 hover:shadow-md"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="font-semibold text-slate-900 hover:text-indigo-600 transition">
                          {project.name}
                        </h3>
                        <p className="mt-1 line-clamp-1 text-xs text-slate-500">
                          {project.description}
                        </p>
                      </div>
                      <StatusBadge status={project.status} />
                    </div>

                    <div className="mt-4 flex items-center justify-between text-xs text-slate-500">
                      <span className="flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5 text-slate-400" />
                        Due {project.endDate}
                      </span>
                      <span className="font-medium text-slate-700">
                        {completed}/{total} tasks ({percentage}%)
                      </span>
                    </div>

                    <div className="mt-2 h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-indigo-600 transition-all duration-300"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </Link>
                );
              })
            )}
          </div>
        </div>

        {/* Urgent & Pending Tasks (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">Upcoming Tasks</h2>
            <Link
              to="/tasks"
              className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-700"
            >
              View all <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs divide-y divide-slate-100">
            {upcomingTasks.length === 0 ? (
              <div className="p-6 text-center text-slate-500">
                <CheckCircle2 className="mx-auto h-8 w-8 text-emerald-400" />
                <p className="mt-2 text-sm font-medium text-slate-700">All caught up!</p>
                <p className="mt-1 text-xs text-slate-400">No urgent pending tasks.</p>
              </div>
            ) : (
              upcomingTasks.map((task) => (
                <div
                  key={task.id}
                  className="group flex items-start gap-3 py-3 first:pt-1 last:pb-1"
                >
                  <button
                    onClick={() => handleToggleTask(task)}
                    className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border border-slate-300 text-transparent hover:border-emerald-500 hover:text-emerald-500 transition"
                    title="Mark as completed"
                  >
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 opacity-0 group-hover:opacity-100 transition" />
                  </button>

                  <div className="flex-1 min-w-0">
                    <p className="truncate text-sm font-medium text-slate-800">
                      {task.name}
                    </p>
                    <div className="mt-1 flex flex-wrap items-center gap-2">
                      <PriorityBadge priority={task.priority} />
                      <span className="truncate text-[11px] text-slate-400">
                        {task.projectName}
                      </span>
                    </div>
                  </div>

                  <div className="shrink-0 text-right">
                    <span className="text-[11px] font-medium text-slate-500 block">
                      {task.dueDate}
                    </span>
                    <span className="text-[10px] text-amber-600 font-semibold block mt-0.5">
                      {task.status}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      <ProjectModal
        isOpen={isProjectModalOpen}
        onClose={() => setIsProjectModalOpen(false)}
        onSubmit={handleCreateProject}
      />
      <TaskModal
        isOpen={isTaskModalOpen}
        onClose={() => setIsTaskModalOpen(false)}
        onSubmit={handleCreateTask}
        projects={projects}
      />
    </div>
  );
};

