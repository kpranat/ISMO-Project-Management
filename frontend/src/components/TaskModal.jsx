import React, { useState, useEffect } from 'react';
import { X, User } from 'lucide-react';
import { getErrorMessage, userService } from '../services/api.js';

export const TaskModal = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  projects = [],
  defaultProjectId,
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [projectId, setProjectId] = useState('');
  const [priority, setPriority] = useState('Medium');
  const [status, setStatus] = useState('Pending');
  const [dueDate, setDueDate] = useState('');
  const [assignedToId, setAssignedToId] = useState('');
  const [users, setUsers] = useState([]);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      userService.getUsers().then(setUsers).catch(console.error);
    }
  }, [isOpen]);

  useEffect(() => {
    if (initialData) {
      setName(initialData.name);
      setDescription(initialData.description);
      setProjectId(initialData.projectId);
      setPriority(initialData.priority);
      setStatus(initialData.status);
      setDueDate(initialData.dueDate ? initialData.dueDate.substring(0, 10) : '');
      setAssignedToId(initialData.assignedToId || '');
    } else {
      setName('');
      setDescription('');
      setProjectId(defaultProjectId || (projects.length > 0 ? projects[0].id : ''));
      setPriority('Medium');
      setStatus('Pending');
      setAssignedToId('');
      const nextWeek = new Date();
      nextWeek.setDate(nextWeek.getDate() + 7);
      setDueDate(nextWeek.toISOString().split('T')[0]);
    }
    setErrors({});
  }, [initialData, isOpen, projects, defaultProjectId]);

  if (!isOpen) return null;

  const validate = () => {
    const errs = {};
    if (!name.trim()) errs.name = 'Task name is required';
    if (!description.trim()) errs.description = 'Task description is required';
    if (!projectId) errs.projectId = 'Project selection is required';
    if (!dueDate) errs.dueDate = 'Due date is required';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    try {
      const selectedProj = projects.find((p) => p.id === projectId);
      await onSubmit({
        name: name.trim(),
        description: description.trim(),
        projectId,
        projectName: selectedProj ? selectedProj.name : '',
        priority,
        status,
        dueDate,
        assignedToId: assignedToId || null,
      });
      onClose();
    } catch (err) {
      setErrors({ form: getErrorMessage(err) });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl transition-all">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <h3 className="text-lg font-semibold text-slate-900">
            {initialData ? 'Edit Task' : 'Create New Task'}
          </h3>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {errors.form && (
          <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">
            {errors.form}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {/* Project Selection */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600">
              Project *
            </label>
            <select
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              disabled={!!defaultProjectId}
              className={`mt-1.5 w-full rounded-xl border bg-white px-3.5 py-2.5 text-sm transition outline-none focus:ring-2 disabled:bg-slate-50 ${
                errors.projectId
                  ? 'border-rose-300 focus:ring-rose-200'
                  : 'border-slate-300 focus:border-indigo-500 focus:ring-indigo-100'
              }`}
            >
              <option value="">Select a Project</option>
              {projects.map((proj) => (
                <option key={proj.id} value={proj.id}>
                  {proj.name}
                </option>
              ))}
            </select>
            {errors.projectId && (
              <p className="mt-1 text-xs text-rose-600">{errors.projectId}</p>
            )}
          </div>

          {/* Task Name */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600">
              Task Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Implement authentication middleware"
              className={`mt-1.5 w-full rounded-xl border px-3.5 py-2.5 text-sm transition outline-none focus:ring-2 ${
                errors.name
                  ? 'border-rose-300 focus:ring-rose-200'
                  : 'border-slate-300 focus:border-indigo-500 focus:ring-indigo-100'
              }`}
            />
            {errors.name && <p className="mt-1 text-xs text-rose-600">{errors.name}</p>}
          </div>

          {/* Assign To User */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600">
              Assign To Team Member
            </label>
            <div className="relative mt-1.5">
              <select
                value={assignedToId}
                onChange={(e) => setAssignedToId(e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm transition outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              >
                <option value="">Unassigned</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} ({u.role?.name || 'MEMBER'}) - {u.email}
                  </option>
                ))}
              </select>
            </div>
            <p className="mt-1 text-[11px] text-slate-500">
              Only the assigned user will see and be able to work on this task.
            </p>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600">
              Description *
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Detailed steps or acceptance criteria..."
              className={`mt-1.5 w-full rounded-xl border px-3.5 py-2.5 text-sm transition outline-none focus:ring-2 ${
                errors.description
                  ? 'border-rose-300 focus:ring-rose-200'
                  : 'border-slate-300 focus:border-indigo-500 focus:ring-indigo-100'
              }`}
            />
            {errors.description && (
              <p className="mt-1 text-xs text-rose-600">{errors.description}</p>
            )}
          </div>

          {/* Priority & Status */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600">
                Priority
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="mt-1.5 w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm transition outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600">
                Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="mt-1.5 w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm transition outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              >
                <option value="Pending">Pending</option>
                <option value="In Progress">In Progress</option>
                <option value="Completed">Completed</option>
              </select>
            </div>
          </div>

          {/* Due Date */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600">
              Due Date *
            </label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className={`mt-1.5 w-full rounded-xl border px-3.5 py-2 text-sm outline-none transition focus:ring-2 ${
                errors.dueDate
                  ? 'border-rose-300 focus:ring-rose-200'
                  : 'border-slate-300 focus:border-indigo-500 focus:ring-indigo-100'
              }`}
            />
            {errors.dueDate && <p className="mt-1 text-xs text-rose-600">{errors.dueDate}</p>}
          </div>

          {/* Buttons */}
          <div className="mt-6 flex items-center justify-end gap-3 border-t border-slate-100 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-xl bg-indigo-600 px-5 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 active:scale-95 transition disabled:opacity-50"
            >
              {submitting ? 'Saving...' : initialData ? 'Update Task' : 'Create Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
