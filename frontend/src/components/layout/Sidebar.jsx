import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  KeyRound, 
  BarChart3, 
  Terminal, 
  Sliders, 
  Cpu, 
  Activity 
} from 'lucide-react';
import { useAdmin } from '../../context/AdminContext';

const navItems = [
  { name: 'Overview', path: '/', icon: LayoutDashboard },
  { name: 'API Keys', path: '/keys', icon: KeyRound },
  { name: 'Usage Analytics', path: '/usage', icon: BarChart3 },
  { name: 'API Playground', path: '/playground', icon: Terminal },
  { name: 'Settings', path: '/settings', icon: Sliders },
];

export default function Sidebar() {
  const { backendStatus } = useAdmin();

  return (
    <aside className="w-64 h-screen sticky top-0 flex flex-col bg-[#0F0F11] border-r border-[#222225] text-white select-none">
      <div className="h-16 flex items-center justify-between px-6 border-b border-[#222225]">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-md bg-white flex items-center justify-center text-black font-semibold">
            <Cpu size={18} strokeWidth={2.5} />
          </div>
          <div>
            <span className="font-semibold text-sm tracking-tight text-white block leading-tight">
              RentOk
            </span>
            <span className="text-[11px] text-zinc-400 font-mono tracking-wider">
              LLM GATEWAY
            </span>
          </div>
        </div>
        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300 border border-zinc-700">
          v1.0
        </span>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/'}
              className={({ isActive }) =>
                `flex items-center space-x-3 px-3 py-2.5 rounded-md text-sm font-medium transition-all duration-150 ${
                  isActive
                    ? 'bg-[#202024] text-white shadow-sm border border-zinc-700/60 font-semibold'
                    : 'text-zinc-400 hover:text-white hover:bg-[#16161A]'
                }`
              }
            >
              <Icon size={18} strokeWidth={2} />
              <span>{item.name}</span>
            </NavLink>
          );
        })}
      </nav>

      <div className="p-4 border-t border-[#222225]">
        <div className="bg-[#16161A] border border-zinc-800 rounded-md p-3 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            {backendStatus === 'healthy' ? (
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
            ) : backendStatus === 'unhealthy' ? (
              <span className="h-2.5 w-2.5 rounded-full bg-red-500"></span>
            ) : (
              <span className="h-2.5 w-2.5 rounded-full bg-amber-400 animate-pulse"></span>
            )}
            <div className="flex flex-col">
              <span className="text-xs font-medium text-zinc-200">
                {backendStatus === 'healthy' ? 'Gateway Active' : backendStatus === 'unhealthy' ? 'Gateway Offline' : 'Connecting...'}
              </span>
              <span className="text-[10px] text-zinc-500 font-mono">Port :3000</span>
            </div>
          </div>
          <Activity size={14} className="text-zinc-500" />
        </div>
      </div>
    </aside>
  );
}
