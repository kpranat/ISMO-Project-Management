import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { projectService } from '../services/api.js';
import { StatusBadge } from '../components/Badges.jsx';
import { ProjectModal } from '../components/ProjectModal.jsx';
import { DeleteConfirmModal } from '../components/DeleteConfirmModal.jsx';
import {
  FolderKanban,
  Plus,
  Search,
  Calendar,
  Edit2,
  Trash2,
  ExternalLink,
  Filter,
  Loader2,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import { getErrorMessage } from '../services/api.js';

export const Projects = () => {
  const [projects, setProjects] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [deletingProject, setDeletingProject] = useState(null);

  const loadProjects = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await projectService.getProjects();
      setProjects(data);
    } catch (err) {
      console.error('Failed to load projects', err);
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProjects();
  }, []);

  // Filtered list according to requirements
  const filteredProjects = useMemo(() => {
    return projects.filter((project) => {
      const matchesSearch = project.name
        .toLowerCase()
        .includes(searchQuery.toLowerCase().trim());
      const matchesStatus =
        statusFilter === 'All' ? true : project.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [projects, searchQuery, statusFilter]);

  const handleCreateOrUpdate = async (data) => {
    if (editingProject) {
      await projectService.updateProject(editingProject.id, data);
    } else {
      await projectService.createProject(data);
    }
    await loadProjects();
  };

  const handleDelete = async () => {
    if (!deletingProject) return;
    await projectService.deleteProject(deletingProject.id);
    setDeletingProject(null);
    await loadProjects();
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
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Projects
          </h1>
          <p className="mt-1 text-xs text-slate-500 sm:text-sm">
            Organize campaigns, goals, and assignments across your workspace.
          </p>
        </div>

        <button
          onClick={() => {
            setEditingProject(null);
            setIsModalOpen(true);
          }}
          className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-indigo-700 active:scale-95 transition"
        >
          <Plus className="h-4 w-4" />
          <span>New Project</span>
        </button>
      </div>

      {error && (
        <div className="flex items-center justify-between gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-xs sm:text-sm text-rose-700">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-500" />
            <span>{error}</span>
          </div>
          <button
            onClick={() => loadProjects()}
            className="inline-flex items-center gap-1.5 rounded-lg border border-rose-300 bg-white px-2.5 py-1 text-xs font-semibold text-rose-700 hover:bg-rose-100/50"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            <span>Retry</span>
          </button>
        </div>
      )}

      {/* Search & Filter Toolbar */}
      <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-xs sm:flex-row sm:items-center sm:justify-between">
        {/* Search by name */}
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search projects by name..."
            className="w-full rounded-xl border border-slate-200 py-2 pl-9 pr-3 text-xs sm:text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
          />
        </div>

        {/* Filter by status */}
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-slate-400 hidden sm:block" />
          <div className="flex items-center rounded-xl bg-slate-100 p-1 text-xs">
            {['All', 'Not Started', 'In Progress', 'Completed'].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`rounded-lg px-2.5 py-1.5 font-medium transition ${
                  statusFilter === st
                    ? 'bg-white text-indigo-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Projects Grid */}
      {filteredProjects.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
          <FolderKanban className="mx-auto h-10 w-10 text-slate-300" />
          <h3 className="mt-2 text-sm font-semibold text-slate-800">No projects found</h3>
          <p className="mt-1 text-xs text-slate-500">
            {searchQuery || statusFilter !== 'All'
              ? 'Try modifying your search or status filter.'
              : 'Create your first project to get started.'}
          </p>
          {!searchQuery && statusFilter === 'All' && (
            <button
              onClick={() => {
                setEditingProject(null);
                setIsModalOpen(true);
              }}
              className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white"
            >
              <Plus className="h-4 w-4" /> Create Project
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
          {filteredProjects.map((project) => {
            const total = project.taskCount || 0;
            const completed = project.completedTaskCount || 0;
            const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

            return (
              <div
                key={project.id}
                className="group flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-xs transition hover:border-indigo-200 hover:shadow-md"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <StatusBadge status={project.status} />
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => {
                          setEditingProject(project);
                          setIsModalOpen(true);
                        }}
                        className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
                        title="Edit project"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => setDeletingProject(project)}
                        className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition"
                        title="Delete project"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>

                  <Link to={`/projects/${project.id}`} className="mt-3 block group-hover:text-indigo-600 transition">
                    <h3 className="text-base font-semibold text-slate-900 transition">
                      {project.name}
                    </h3>
                  </Link>
                  <p className="mt-1 line-clamp-2 text-xs text-slate-500 leading-relaxed">
                    {project.description}
                  </p>
                </div>

                <div className="mt-6 border-t border-slate-100 pt-4">
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span className="flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5 text-slate-400" />
                      {project.startDate} ~ {project.endDate}
                    </span>
                    <span className="font-semibold text-slate-700">
                      {completed}/{total} tasks
                    </span>
                  </div>

                  {/* Progress Bar */}
                  <div className="mt-2.5 h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-indigo-600 transition-all duration-300"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>

                  <div className="mt-4 flex items-center justify-between">
                    <span className="text-[11px] text-slate-400">
                      Created {new Date(project.createdAt).toLocaleDateString()}
                    </span>
                    <Link
                      to={`/projects/${project.id}`}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-700"
                    >
                      View tasks <ExternalLink className="h-3 w-3" />
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modals */}
      <ProjectModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingProject(null);
        }}
        onSubmit={handleCreateOrUpdate}
        initialData={editingProject}
      />

      <DeleteConfirmModal
        isOpen={!!deletingProject}
        onClose={() => setDeletingProject(null)}
        onConfirm={handleDelete}
        title="Delete Project"
        message={`Are you sure you want to delete "${deletingProject?.name}"? All associated tasks will also be permanently removed.`}
      />
    </div>
  );
};

