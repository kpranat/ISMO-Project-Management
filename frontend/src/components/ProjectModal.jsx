import React, { useState, useEffect } from 'react';
import { X, User } from 'lucide-react';
import { getErrorMessage, userService } from '../services/api.js';

export const ProjectModal = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState('Not Started');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
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
      setStatus(initialData.status);
      setStartDate(initialData.startDate ? initialData.startDate.substring(0, 10) : '');
      setEndDate(initialData.endDate ? initialData.endDate.substring(0, 10) : '');
      setAssignedToId(initialData.assignedToId || '');
    } else {
      setName('');
      setDescription('');
      setStatus('Not Started');
      const today = new Date().toISOString().split('T')[0];
      setStartDate(today);
      setEndDate('');
      setAssignedToId('');
    }
    setErrors({});
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const validate = () => {
    const errs = {};
    if (!name.trim()) errs.name = 'Project name is required';
    if (!description.trim()) errs.description = 'Project description is required';
    if (!startDate) errs.startDate = 'Start date is required';
    if (!endDate) errs.endDate = 'End date is required';
    if (startDate && endDate && endDate < startDate) {
      errs.endDate = 'End date cannot be earlier than start date';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    try {
      await onSubmit({
        name: name.trim(),
        description: description.trim(),
        status,
        startDate,
        endDate,
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
            {initialData ? 'Edit Project' : 'Create New Project'}
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
          {/* Project Name */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600">
              Project Name *
            </label>
            <div className="relative mt-1.5">
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Website Overhaul Q4"
                className={`w-full rounded-xl border px-3.5 py-2.5 text-sm transition outline-none focus:ring-2 ${
                  errors.name
                    ? 'border-rose-300 focus:ring-rose-200'
                    : 'border-slate-300 focus:border-indigo-500 focus:ring-indigo-100'
                }`}
              />
            </div>
            {errors.name && <p className="mt-1 text-xs text-rose-600">{errors.name}</p>}
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600">
              Description *
            </label>
            <div className="relative mt-1.5">
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Briefly describe the project goals and deliverables..."
                className={`w-full rounded-xl border px-3.5 py-2.5 text-sm transition outline-none focus:ring-2 ${
                  errors.description
                    ? 'border-rose-300 focus:ring-rose-200'
                    : 'border-slate-300 focus:border-indigo-500 focus:ring-indigo-100'
                }`}
              />
            </div>
            {errors.description && (
              <p className="mt-1 text-xs text-rose-600">{errors.description}</p>
            )}
          </div>

          {/* Assign To User */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600">
              Assign To (Team Member / Lead)
            </label>
            <div className="relative mt-1.5">
              <select
                value={assignedToId}
                onChange={(e) => setAssignedToId(e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm transition outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              >
                <option value="">Unassigned (Open Project)</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} ({u.role?.name || 'MEMBER'}) - {u.email}
                  </option>
                ))}
              </select>
            </div>
            <p className="mt-1 text-[11px] text-slate-500">
              Assigned user will have scoped access to this project.
            </p>
          </div>

          {/* Status */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600">
              Status
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="mt-1.5 w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm transition outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
            >
              <option value="Not Started">Not Started</option>
              <option value="In Progress">In Progress</option>
              <option value="Completed">Completed</option>
            </select>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600">
                Start Date *
              </label>
              <div className="relative mt-1.5">
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className={`w-full rounded-xl border px-3.5 py-2 text-sm outline-none transition focus:ring-2 ${
                    errors.startDate
                      ? 'border-rose-300 focus:ring-rose-200'
                      : 'border-slate-300 focus:border-indigo-500 focus:ring-indigo-100'
                  }`}
                />
              </div>
              {errors.startDate && <p className="mt-1 text-xs text-rose-600">{errors.startDate}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600">
                End Date *
              </label>
              <div className="relative mt-1.5">
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className={`w-full rounded-xl border px-3.5 py-2 text-sm outline-none transition focus:ring-2 ${
                    errors.endDate
                      ? 'border-rose-300 focus:ring-rose-200'
                      : 'border-slate-300 focus:border-indigo-500 focus:ring-indigo-100'
                  }`}
                />
              </div>
              {errors.endDate && <p className="mt-1 text-xs text-rose-600">{errors.endDate}</p>}
            </div>
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
              {submitting ? 'Saving...' : initialData ? 'Update Project' : 'Create Project'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
