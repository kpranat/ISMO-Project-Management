import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { projectService, taskService, getErrorMessage } from '../services/api.js';
import { StatusBadge, PriorityBadge, AssigneeAvatar } from '../components/Badges.jsx';
import { TaskModal } from '../components/TaskModal.jsx';
import { ProjectModal } from '../components/ProjectModal.jsx';
import { DeleteConfirmModal } from '../components/DeleteConfirmModal.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import {
  ArrowLeft,
  Calendar,
  Plus,
  Search,
  CheckCircle2,
  Edit2,
  Trash2,
  Clock,
  CheckSquare,
  AlertCircle,
  Loader2,
  RefreshCw,
} from 'lucide-react';

export const ProjectDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [priorityFilter, setPriorityFilter] = useState('All');

  // Modals
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [deletingTask, setDeletingTask] = useState(null);

  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [deletingProject, setDeletingProject] = useState(false);

  const isProjectLead =
    project?.userId === user?.id || project?.assignedToId === user?.id;
  const canManageProject =
    user?.role?.name === 'ADMIN' ||
    (user?.role?.name === 'PROJECT_LEADER' && isProjectLead);

  const canCreateTask =
    user?.role?.name === 'ADMIN' ||
    (user?.role?.name === 'PROJECT_LEADER' && isProjectLead);

  const loadData = useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true);
      setError(null);
      const [projData, tasksData] = await Promise.all([
        projectService.getProject(id),
        taskService.getTasks(id),
      ]);
      setProject(projData);
      setTasks(tasksData);
    } catch (err) {
      console.error('Failed to load project details', err);
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      const matchesSearch = task.name
        .toLowerCase()
        .includes(searchQuery.toLowerCase().trim());
      const matchesStatus =
        statusFilter === 'All' ? true : task.status === statusFilter;
      const matchesPriority =
        priorityFilter === 'All' ? true : task.priority === priorityFilter;
      return matchesSearch && matchesStatus && matchesPriority;
    });
  }, [tasks, searchQuery, statusFilter, priorityFilter]);

  const handleCreateOrUpdateTask = async (data) => {
    if (editingTask) {
      await taskService.updateTask(editingTask.id, data);
    } else {
      await taskService.createTask(data);
    }
    await loadData();
  };

  const handleToggleTask = async (task) => {
    try {
      const nextStatus = task.status === 'Completed' ? 'Pending' : 'Completed';
      await taskService.updateTask(task.id, { status: nextStatus });
      await loadData();
    } catch (err) {
      console.error('Failed to toggle task status', err);
      setError(getErrorMessage(err));
    }
  };

  const handleDeleteTask = async () => {
    if (!deletingTask) return;
    try {
      await taskService.deleteTask(deletingTask.id);
      setDeletingTask(null);
      await loadData();
    } catch (err) {
      console.error('Failed to delete task', err);
      setError(getErrorMessage(err));
    }
  };

  const handleUpdateProject = async (data) => {
    if (!id) return;
    await projectService.updateProject(id, data);
    await loadData();
  };

  const handleDeleteProject = async () => {
    if (!id) return;
    try {
      await projectService.deleteProject(id);
      navigate('/projects');
    } catch (err) {
      console.error('Failed to delete project', err);
      setError(getErrorMessage(err));
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (error && !project) {
    return (
      <div className="rounded-2xl border border-rose-200 bg-rose-50 p-8 text-center">
        <AlertCircle className="mx-auto h-10 w-10 text-rose-500" />
        <h2 className="mt-2 text-lg font-semibold text-rose-800">Failed to Load Project</h2>
        <p className="mt-1 text-xs text-rose-600">{error}</p>
        <div className="mt-4 flex items-center justify-center gap-3">
          <button
            onClick={() => loadData()}
            className="inline-flex items-center gap-1.5 rounded-xl bg-rose-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-rose-700"
          >
            <RefreshCw className="h-4 w-4" /> Retry
          </button>
          <Link
            to="/projects"
            className="inline-flex items-center gap-1.5 rounded-xl border border-rose-200 bg-white px-4 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-50"
          >
            <ArrowLeft className="h-4 w-4" /> Back to Projects
          </Link>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
        <AlertCircle className="mx-auto h-10 w-10 text-amber-500" />
        <h2 className="mt-2 text-lg font-semibold text-slate-800">Project Not Found</h2>
        <p className="mt-1 text-xs text-slate-500">This project may have been deleted or access was revoked.</p>
        <Link
          to="/projects"
          className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Projects
        </Link>
      </div>
    );
  }

  const completedCount = tasks.filter((t) => t.status === 'Completed').length;
  const progressPercent = tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : 0;

  return (
    <div className="space-y-6 pb-12">
      {error && (
        <div className="flex items-center justify-between gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-xs sm:text-sm text-rose-700">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-500" />
            <span>{error}</span>
          </div>
          <button
            onClick={() => loadData()}
            className="inline-flex items-center gap-1.5 rounded-lg border border-rose-300 bg-white px-2.5 py-1 text-xs font-semibold text-rose-700 hover:bg-rose-100/50"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            <span>Retry</span>
          </button>
        </div>
      )}

      {/* Back link & actions */}
      <div className="flex items-center justify-between">
        <Link
          to="/projects"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 transition"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Projects
        </Link>

        {canManageProject && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsProjectModalOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
            >
              <Edit2 className="h-3.5 w-3.5" /> Edit Project
            </button>
            <button
              onClick={() => setDeletingProject(true)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50/50 px-3 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-100 transition"
            >
              <Trash2 className="h-3.5 w-3.5" /> Delete
            </button>
          </div>
        )}
      </div>

      {/* Project Card Header */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                {project.name}
              </h1>
              <StatusBadge status={project.status} />
            </div>
            <p className="text-sm text-slate-600 leading-relaxed">
              {project.description}
            </p>

            <div className="flex flex-wrap items-center gap-4 pt-2 text-xs">
              <div className="flex items-center gap-1.5">
                <span className="font-medium text-slate-400">Assigned To:</span>
                <AssigneeAvatar user={project.assignedTo} fallback="Open Project" />
              </div>
              <div className="flex items-center gap-1.5">
                <span className="font-medium text-slate-400">Project Leader:</span>
                <AssigneeAvatar user={project.user} fallback="Unassigned" />
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-1 rounded-xl bg-slate-50 p-4 border border-slate-100 sm:text-right shrink-0">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Project Timeline
            </span>
            <div className="flex items-center gap-1.5 text-xs font-medium text-slate-700 mt-1 sm:justify-end">
              <Calendar className="h-4 w-4 text-indigo-500" />
              <span>{project.startDate} to {project.endDate}</span>
            </div>
            <span className="text-[10px] text-slate-400 mt-0.5">
              Created {new Date(project.createdAt).toLocaleDateString()}
            </span>
          </div>
        </div>

        {/* Overall progress */}
        <div className="mt-6 border-t border-slate-100 pt-4">
          <div className="flex items-center justify-between text-xs font-medium">
            <span className="text-slate-600">
              Task Progress: <span className="font-semibold text-slate-900">{completedCount} of {tasks.length} Completed</span>
            </span>
            <span className="text-indigo-600 font-semibold">{progressPercent}%</span>
          </div>
          <div className="mt-2 h-2 w-full rounded-full bg-slate-100 overflow-hidden">
            <div
              className="h-full rounded-full bg-indigo-600 transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Tasks Section Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between pt-2">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900">
            Project Tasks
          </h2>
          <p className="text-xs text-slate-500">
            {canCreateTask
              ? 'Manage deliverables and checklist items specifically for this project.'
              : 'Tasks assigned to you in this project.'}
          </p>
        </div>

        {canCreateTask && (
          <button
            onClick={() => {
              setEditingTask(null);
              setIsTaskModalOpen(true);
            }}
            className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-indigo-700 active:scale-95 transition"
          >
            <Plus className="h-4 w-4" /> Add Task
          </button>
        )}
      </div>

      {/* Task Filters */}
      <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-xs lg:flex-row lg:items-center lg:justify-between">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search tasks in this project..."
            className="w-full rounded-xl border border-slate-200 py-2 pl-9 pr-3 text-xs sm:text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1 text-xs">
            <span className="text-slate-400 font-medium mr-1 hidden sm:inline">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 outline-none focus:border-indigo-500"
            >
              <option value="All">All Statuses</option>
              <option value="Pending">Pending</option>
              <option value="In Progress">In Progress</option>
              <option value="Completed">Completed</option>
            </select>
          </div>

          <div className="flex items-center gap-1 text-xs">
            <span className="text-slate-400 font-medium mr-1 hidden sm:inline">Priority:</span>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 outline-none focus:border-indigo-500"
            >
              <option value="All">All Priorities</option>
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
            </select>
          </div>
        </div>
      </div>

      {/* Task List */}
      {filteredTasks.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
          <CheckSquare className="mx-auto h-12 w-12 text-slate-300" />
          <h3 className="mt-3 text-base font-medium text-slate-900">No tasks in this project</h3>
          <p className="mt-1 text-xs text-slate-500">
            {searchQuery || statusFilter !== 'All' || priorityFilter !== 'All'
              ? 'Try adjusting your search criteria.'
              : canCreateTask
              ? 'Add the first task to start tracking progress.'
              : 'You do not have any tasks assigned in this project.'}
          </p>
          {canCreateTask && !searchQuery && statusFilter === 'All' && priorityFilter === 'All' && (
            <button
              onClick={() => {
                setEditingTask(null);
                setIsTaskModalOpen(true);
              }}
              className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white"
            >
              <Plus className="h-4 w-4" /> Add Task
            </button>
          )}
        </div>
      ) : (
        <div className="divide-y divide-slate-100 rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden">
          {filteredTasks.map((task) => (
            <div
              key={task.id}
              className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4.5 transition hover:bg-slate-50/70 ${
                task.status === 'Completed' ? 'bg-slate-50/40 opacity-75' : ''
              }`}
            >
              <div className="flex items-start gap-3.5">
                <button
                  onClick={() => handleToggleTask(task)}
                  className={`mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-lg border transition ${
                    task.status === 'Completed'
                      ? 'border-emerald-500 bg-emerald-500 text-white'
                      : 'border-slate-300 hover:border-emerald-500 text-transparent'
                  }`}
                >
                  <CheckCircle2 className="h-3.5 w-3.5" />
                </button>

                <div>
                  <h4
                    className={`text-sm font-semibold text-slate-900 ${
                      task.status === 'Completed' ? 'line-through text-slate-500' : ''
                    }`}
                  >
                    {task.name}
                  </h4>
                  <p className="mt-0.5 text-xs text-slate-500 leading-relaxed">
                    {task.description}
                  </p>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <StatusBadge status={task.status} />
                    <PriorityBadge priority={task.priority} />
                    <span className="flex items-center gap-1 text-[11px] text-slate-400">
                      <Clock className="h-3 w-3" /> Due {task.dueDate}
                    </span>
                    <span className="inline-flex items-center gap-1 pl-1 text-[11px] text-slate-400">
                      • Assigned:
                      <AssigneeAvatar user={task.assignedTo} fallback="Unassigned" />
                    </span>
                  </div>
                </div>
              </div>

              {canCreateTask && (
                <div className="flex items-center justify-end gap-2 shrink-0 border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-100">
                  <button
                    onClick={() => {
                      setEditingTask(task);
                      setIsTaskModalOpen(true);
                    }}
                    className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
                    title="Edit task"
                  >
                    <Edit2 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setDeletingTask(task)}
                    className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition"
                    title="Delete task"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Modals */}
      <TaskModal
        isOpen={isTaskModalOpen}
        onClose={() => {
          setIsTaskModalOpen(false);
          setEditingTask(null);
        }}
        onSubmit={handleCreateOrUpdateTask}
        initialData={editingTask}
        projects={project ? [project] : []}
        defaultProjectId={project.id}
      />

      <ProjectModal
        isOpen={isProjectModalOpen}
        onClose={() => setIsProjectModalOpen(false)}
        onSubmit={handleUpdateProject}
        initialData={project}
      />

      <DeleteConfirmModal
        isOpen={!!deletingTask}
        onClose={() => setDeletingTask(null)}
        onConfirm={handleDeleteTask}
        title="Delete Task"
        message={`Are you sure you want to delete "${deletingTask?.name}"?`}
      />

      <DeleteConfirmModal
        isOpen={deletingProject}
        onClose={() => setDeletingProject(false)}
        onConfirm={handleDeleteProject}
        title="Delete Project"
        message={`Are you sure you want to delete "${project.name}" and all of its tasks? This action cannot be undone.`}
      />
    </div>
  );
};
