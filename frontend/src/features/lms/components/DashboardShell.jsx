import React from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { LogOut, Bell } from 'lucide-react';
import { useAuth } from '../../../common/context/AuthContext';

export default function DashboardShell({ brand, accent, nav, bellTo, children }) {
  const { auth, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-900 text-white flex font-sans">
      <aside className="hidden md:flex w-64 flex-col border-r border-white/10 bg-slate-950/60">
        <div className="p-5 flex items-center gap-3 border-b border-white/10">
          <div className={`w-10 h-10 rounded-xl bg-gradient-to-tr ${accent} flex items-center justify-center font-bold shadow-lg`}>
            1C
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight">OneClass</h1>
            <span className="text-[10px] uppercase tracking-wider text-slate-400">{brand}</span>
          </div>
        </div>
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {nav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm transition-all ${
                  isActive ? 'bg-white/10 text-white font-semibold' : 'text-slate-400 hover:bg-white/5 hover:text-white'
                }`
              }
            >
              {item.icon}
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="border-b border-white/10 bg-slate-900/80 backdrop-blur-md px-4 md:px-6 py-4 flex items-center justify-between sticky top-0 z-20">
          <div className="md:hidden font-bold">OneClass</div>
          <div className="flex items-center gap-3 ml-auto">
            {bellTo && (
              <button onClick={() => navigate(bellTo)} className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10">
                <Bell className="w-4 h-4" />
              </button>
            )}
            <div className="text-right hidden sm:block">
              <p className="text-sm font-semibold">{auth?.fullName}</p>
              <p className="text-xs text-slate-400">{auth?.email}</p>
            </div>
            <button
              onClick={() => {
                logout();
                navigate('/');
              }}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-sm text-slate-300"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </div>
        </header>
        <div className="md:hidden flex gap-2 overflow-x-auto px-3 py-2 border-b border-white/10">
          {nav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `whitespace-nowrap text-xs px-3 py-2 rounded-lg ${isActive ? 'bg-white/15 text-white' : 'text-slate-400 bg-white/5'}`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </div>
        <main className="flex-1 p-4 md:p-8 max-w-7xl w-full mx-auto">{children || <Outlet />}</main>
      </div>
    </div>
  );
}
