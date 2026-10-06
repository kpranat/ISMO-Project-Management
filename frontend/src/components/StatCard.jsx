import React from 'react';

const colorStyles = {
  indigo: {
    bg: 'bg-indigo-50/70',
    iconBg: 'bg-indigo-600',
    border: 'border-indigo-100',
    text: 'text-indigo-600',
  },
  emerald: {
    bg: 'bg-emerald-50/70',
    iconBg: 'bg-emerald-600',
    border: 'border-emerald-100',
    text: 'text-emerald-600',
  },
  amber: {
    bg: 'bg-amber-50/70',
    iconBg: 'bg-amber-500',
    border: 'border-amber-100',
    text: 'text-amber-600',
  },
  blue: {
    bg: 'bg-blue-50/70',
    iconBg: 'bg-blue-600',
    border: 'border-blue-100',
    text: 'text-blue-600',
  },
  purple: {
    bg: 'bg-purple-50/70',
    iconBg: 'bg-purple-600',
    border: 'border-purple-100',
    text: 'text-purple-600',
  },
};

export const StatCard = ({
  title,
  value,
  icon: Icon,
  colorScheme,
  description,
}) => {
  const styles = colorStyles[colorScheme] || colorStyles.indigo;

  return (
    <div className={`relative overflow-hidden rounded-2xl border ${styles.border} bg-white p-5 shadow-xs transition hover:shadow-md`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">{title}</p>
          <p className="mt-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">{value}</p>
          {description && (
            <p className="mt-1 text-xs text-slate-500">{description}</p>
          )}
        </div>
        <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${styles.iconBg} text-white shadow-sm`}>
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </div>
  );
};

