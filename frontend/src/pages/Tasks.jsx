import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { taskService, projectService } from '../services/api.js';
import { StatusBadge, PriorityBadge } from '../components/Badges.jsx';
import { TaskModal } from '../components/TaskModal.jsx';
import { DeleteConfirmModal } from '../components/DeleteConfirmModal.jsx';
import {
  CheckSquare,
  Plus,
  Search,
  CheckCircle2,
  Clock,
  Edit2,
  Trash2,
  FolderKanban,
  Loader2,
} from 'lucide-react';

export const Tasks = () => {
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [priorityFilter, setPriorityFilter] = useState('All');
  const [projectFilter, setProjectFilter] = useState('All');

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [deletingTask, setDeletingTask] = useState(null);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [tasksData, projectsData] = await Promise.all([
        taskService.getTasks(),
        projectService.getProjects(),
      ]);
      setTasks(tasksData);
      setProjects(projectsData);
    } catch (err) {
      console.error('Failed to load tasks', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Filtered task items
  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      const matchesSearch = task.name
        .toLowerCase()
        .includes(searchQuery.toLowerCase().trim());
      const matchesStatus =
        statusFilter === 'All' ? true : task.status === statusFilter;
      const matchesPriority =
        priorityFilter === 'All' ? true : task.priority === priorityFilter;
      const matchesProject =
        projectFilter === 'All' ? true : task.projectId === projectFilter;

      return matchesSearch && matchesStatus && matchesPriority && matchesProject;
    });
  }, [tasks, searchQuery, statusFilter, priorityFilter, projectFilter]);

  const handleCreateOrUpdate = async (data) => {
    if (editingTask) {
      await taskService.updateTask(editingTask.id, data);
    } else {
      await taskService.createTask(data);
    }
    await loadData();
  };

  const handleToggleTask = async (task) => {
    const nextStatus = task.status === 'Completed' ? 'Pending' : 'Completed';
    await taskService.updateTask(task.id, { status: nextStatus });
    await loadData();
  };

  const handleDelete = async () => {
    if (!deletingTask) return;
    await taskService.deleteTask(deletingTask.id);
    setDeletingTask(null);
    await loadData();
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Tasks
          </h1>
          <p className="mt-1 text-xs text-slate-500 sm:text-sm">
            Track individual work items, prioritize execution, and mark deliverables complete.
          </p>
        </div>

        <button
          onClick={() => {
            setEditingTask(null);
            setIsModalOpen(true);
          }}
          className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-indigo-700 active:scale-95 transition"
        >
          <Plus className="h-4 w-4" />
          <span>New Task</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-xs lg:flex-row lg:items-center lg:justify-between">
        {/* Search input */}
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search tasks by name..."
            className="w-full rounded-xl border border-slate-200 py-2 pl-9 pr-3 text-xs sm:text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
          />
        </div>

        {/* Filter controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Filter by Project */}
          <div className="flex items-center gap-1 text-xs">
            <span className="text-slate-400 font-medium hidden sm:inline">Project:</span>
            <select
              value={projectFilter}
              onChange={(e) => setProjectFilter(e.target.value)}
              className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 outline-none focus:border-indigo-500"
            >
              <option value="All">All Projects</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          {/* Filter by Status */}
          <div className="flex items-center gap-1 text-xs">
            <span className="text-slate-400 font-medium hidden sm:inline">Status:</span>
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

          {/* Filter by Priority */}
          <div className="flex items-center gap-1 text-xs">
            <span className="text-slate-400 font-medium hidden sm:inline">Priority:</span>
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

      {/* Task List Table/Cards */}
      {filteredTasks.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
          <CheckSquare className="mx-auto h-10 w-10 text-slate-300" />
          <h3 className="mt-2 text-sm font-semibold text-slate-800">No tasks found</h3>
          <p className="mt-1 text-xs text-slate-500">
            {searchQuery || statusFilter !== 'All' || priorityFilter !== 'All' || projectFilter !== 'All'
              ? 'Try adjusting your search criteria or filters.'
              : 'Add your first task to start tracking work.'}
          </p>
          {!searchQuery && statusFilter === 'All' && priorityFilter === 'All' && (
            <button
              onClick={() => {
                setEditingTask(null);
                setIsModalOpen(true);
              }}
              className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white"
            >
              <Plus className="h-4 w-4" /> Add Task
            </button>
          )}
        </div>
      ) : (
        <div className="divide-y divide-slate-200 rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden">
          {filteredTasks.map((task) => (
            <div
              key={task.id}
              className={`group flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4.5 transition hover:bg-slate-50/70 ${
                task.status === 'Completed' ? 'bg-slate-50/40 opacity-75' : ''
              }`}
            >
              <div className="flex items-start gap-3.5">
                {/* One-click toggle complete checkbox */}
                <button
                  onClick={() => handleToggleTask(task)}
                  className={`mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-lg border transition ${
                    task.status === 'Completed'
                      ? 'border-emerald-500 bg-emerald-500 text-white'
                      : 'border-slate-300 hover:border-emerald-500 text-transparent'
                  }`}
                  title={task.status === 'Completed' ? 'Mark uncompleted' : 'Mark completed'}
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
                  <p className="mt-0.5 text-xs text-slate-500 leading-relaxed max-w-2xl">
                    {task.description}
                  </p>

                  <div className="mt-2.5 flex flex-wrap items-center gap-2">
                    <StatusBadge status={task.status} />
                    <PriorityBadge priority={task.priority} />

                    {task.projectId && (
                      <Link
                        to={`/projects/${task.projectId}`}
                        className="inline-flex items-center gap-1 text-[11px] font-medium text-indigo-600 hover:text-indigo-700 bg-indigo-50/60 px-2 py-0.5 rounded-md hover:underline"
                      >
                        <FolderKanban className="h-3 w-3" />
                        {task.projectName || 'Project'}
                      </Link>
                    )}

                    <span className="flex items-center gap-1 text-[11px] text-slate-400">
                      <Clock className="h-3 w-3" /> Due {task.dueDate}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex items-center justify-end gap-2 shrink-0 border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-100">
                <button
                  onClick={() => {
                    setEditingTask(task);
                    setIsModalOpen(true);
                  }}
                  className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
                  title="Edit task"
                >
                  <Edit2 className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setDeletingTask(task)}
                  className="rounded-lg p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition"
                  title="Delete task"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modals */}
      <TaskModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingTask(null);
        }}
        onSubmit={handleCreateOrUpdate}
        initialData={editingTask}
        projects={projects}
      />

      <DeleteConfirmModal
        isOpen={!!deletingTask}
        onClose={() => setDeletingTask(null)}
        onConfirm={handleDelete}
        title="Delete Task"
        message={`Are you sure you want to delete "${deletingTask?.name}"?`}
      />
    </div>
  );
};

