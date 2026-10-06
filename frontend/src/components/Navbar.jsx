import React from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { Menu, LogOut, User as UserIcon, CheckCircle2 } from 'lucide-react';

export const Navbar = ({ onToggleSidebar }) => {
  const { user, logout } = useAuth();

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-200 bg-white/95 px-4 backdrop-blur sm:px-6">
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          aria-label="Toggle menu"
          className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 focus:outline-none md:hidden"
        >
          <Menu className="h-5 w-5" />
        </button>
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 text-white shadow-sm shadow-indigo-200">
            <CheckCircle2 className="h-5 w-5" />
          </div>
          <div>
            <span className="text-lg font-bold tracking-tight text-slate-900">ISMO</span>
            <span className="ml-1.5 hidden rounded-md bg-indigo-50 px-2 py-0.5 text-xs font-semibold text-indigo-700 sm:inline-block">
              Projects
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="hidden items-center gap-2 rounded-full border border-slate-200 bg-slate-50 py-1.5 pl-2 pr-3.5 sm:flex">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-indigo-100 text-indigo-700 font-medium text-xs">
            {user?.name ? user.name[0].toUpperCase() : <UserIcon className="h-4 w-4" />}
          </div>
          <div className="flex flex-col text-left">
            <span className="text-xs font-medium text-slate-800 leading-none">{user?.name || 'User'}</span>
            <span className="text-[10px] text-slate-500 leading-none mt-0.5">{user?.email}</span>
          </div>
        </div>

        <button
          onClick={() => logout()}
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-sm transition hover:bg-rose-50 hover:border-rose-200 hover:text-rose-600 active:scale-95"
          title="Sign out"
        >
          <LogOut className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Sign Out</span>
        </button>
      </div>
    </header>
  );
};

