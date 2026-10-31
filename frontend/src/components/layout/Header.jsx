import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import { ShieldCheck, ShieldAlert, RefreshCw } from 'lucide-react';
import { useAdmin } from '../../context/AdminContext';

const titleMap = {
  '/': 'Overview Dashboard',
  '/keys': 'Virtual API Keys',
  '/usage': 'Usage & Spend Analytics',
  '/playground': 'API Playground',
  '/settings': 'Gateway Settings',
};

export default function Header({ onRefresh, isRefreshing }) {
  const location = useLocation();
  const currentTitle = titleMap[location.pathname] || 'Dashboard';
  const { isConfigured, authStatus } = useAdmin();

  return (
    <header className="h-16 bg-white border-b border-zinc-200 px-8 flex items-center justify-between sticky top-0 z-20">
      <div>
        <h1 className="text-lg font-semibold text-zinc-900 tracking-tight">
          {currentTitle}
        </h1>
      </div>

      <div className="flex items-center space-x-3">
        {isConfigured && authStatus === 'verified' ? (
          <div className="flex items-center space-x-1.5 px-2.5 py-1 bg-emerald-50 border border-emerald-200 rounded-full text-xs text-emerald-800">
            <ShieldCheck size={14} className="text-emerald-600" />
            <span className="font-medium font-mono text-[11px]">Admin Key Active</span>
          </div>
        ) : isConfigured && authStatus === 'invalid' ? (
          <Link
            to="/settings"
            className="flex items-center space-x-1.5 px-2.5 py-1 bg-red-50 border border-red-200 rounded-full text-xs text-red-700 hover:bg-red-100 transition-colors"
          >
            <ShieldAlert size={14} className="text-red-600" />
            <span className="font-medium text-[11px]">Invalid Admin Secret</span>
          </Link>
        ) : (
          <Link
            to="/settings"
            className="flex items-center space-x-1.5 px-2.5 py-1 bg-amber-50 border border-amber-200/80 rounded-full text-xs text-amber-800 hover:bg-amber-100 transition-colors"
          >
            <ShieldAlert size={14} className="text-amber-600" />
            <span className="font-medium text-[11px]">Set Admin Secret</span>
          </Link>
        )}

        {onRefresh && (
          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            className="p-1.5 rounded-md text-zinc-500 hover:text-black hover:bg-zinc-100 transition-colors border border-transparent hover:border-zinc-200"
            title="Refresh Data"
          >
            <RefreshCw size={16} className={isRefreshing ? 'animate-spin' : ''} />
          </button>
        )}
      </div>
    </header>
  );
}
