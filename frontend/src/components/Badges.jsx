import React from 'react';

export const StatusBadge = ({ status }) => {
  switch (status) {
    case 'Completed':
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-600/20">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
          Completed
        </span>
      );
    case 'In Progress':
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700 ring-1 ring-inset ring-blue-600/20">
          <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
          In Progress
        </span>
      );
    case 'Pending':
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700 ring-1 ring-inset ring-amber-600/20">
          <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
          Pending
        </span>
      );
    case 'Not Started':
    default:
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700 ring-1 ring-inset ring-slate-500/20">
          <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
          Not Started
        </span>
      );
  }
};

export const PriorityBadge = ({ priority }) => {
  switch (priority) {
    case 'High':
      return (
        <span className="inline-flex items-center rounded-md bg-rose-50 px-2 py-0.5 text-xs font-semibold text-rose-700 ring-1 ring-inset ring-rose-600/10">
          High
        </span>
      );
    case 'Medium':
      return (
        <span className="inline-flex items-center rounded-md bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-700 ring-1 ring-inset ring-amber-600/10">
          Medium
        </span>
      );
    case 'Low':
    default:
      return (
        <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600 ring-1 ring-inset ring-slate-500/10">
          Low
        </span>
      );
  }
};

export const RoleBadge = ({ role }) => {
  const roleName = typeof role === 'object' ? role?.name : role;
  switch (roleName) {
    case 'ADMIN':
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-purple-50 px-2.5 py-0.5 text-xs font-semibold text-purple-700 ring-1 ring-inset ring-purple-600/20">
          <span className="h-1.5 w-1.5 rounded-full bg-purple-600" />
          Admin
        </span>
      );
    case 'PROJECT_LEADER':
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-semibold text-indigo-700 ring-1 ring-inset ring-indigo-600/20">
          <span className="h-1.5 w-1.5 rounded-full bg-indigo-600" />
          Project Leader
        </span>
      );
    case 'MEMBER':
    default:
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-700 ring-1 ring-inset ring-slate-500/20">
          <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
          Member
        </span>
      );
  }
};

export const AssigneeAvatar = ({ user, fallback = 'Unassigned' }) => {
  if (!user) {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs text-slate-400">
        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-100 text-[10px] font-medium text-slate-500">
          ?
        </span>
        {fallback}
      </span>
    );
  }

  const initials = user.name
    ? user.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .substring(0, 2)
        .toUpperCase()
    : 'U';

  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-700">
      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-indigo-100 text-[10px] font-bold text-indigo-700 ring-1 ring-white">
        {initials}
      </span>
      <span className="truncate max-w-[120px]">{user.name}</span>
    </span>
  );
};
