import React, { useState } from 'react';
import { useAdmin } from '../context/AdminContext';
import { 
  KeyRound, 
  ShieldCheck, 
  ShieldAlert, 
  Eye, 
  EyeOff, 
  CheckCircle2, 
  XCircle, 
  RefreshCw, 
  Server, 
  Lock, 
  Info 
} from 'lucide-react';

export default function Settings() {
  const { 
    adminSecret, 
    backendStatus, 
    authStatus, 
    healthData, 
    isTesting, 
    saveSecret, 
    clearSecret, 
    testConnection 
  } = useAdmin();

  const [inputVal, setInputVal] = useState(adminSecret);
  const [showSecret, setShowSecret] = useState(false);
  const [feedback, setFeedback] = useState(null);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!inputVal.trim()) {
      setFeedback({ type: 'error', text: 'Admin secret cannot be empty.' });
      return;
    }
    saveSecret(inputVal.trim());
    setFeedback({ type: 'success', text: 'Admin secret loaded into session memory.' });
    const res = await testConnection(inputVal.trim());
    if (res.authValid) {
      setFeedback({ type: 'success', text: 'Secret verified! Successfully authenticated against backend.' });
    } else if (res.backendHealthy && !res.authValid) {
      setFeedback({ type: 'error', text: 'Secret rejected: Backend returned HTTP 401 Unauthorized.' });
    }
  };

  const handleClear = () => {
    clearSecret();
    setInputVal('');
    setFeedback({ type: 'info', text: 'Admin secret cleared from session memory.' });
  };

  const handleTest = async () => {
    setFeedback(null);
    const res = await testConnection(inputVal.trim());
    if (res.authValid) {
      setFeedback({ type: 'success', text: 'Connection successful: Backend healthy & secret authenticated.' });
    } else if (res.backendHealthy && !res.authValid) {
      setFeedback({ type: 'error', text: 'Backend is healthy, but the provided admin secret is invalid.' });
    } else {
      setFeedback({ type: 'error', text: 'Failed to reach backend server at http://localhost:3000.' });
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h2 className="text-xl font-bold text-zinc-950 tracking-tight">Gateway Settings & Authentication</h2>
        <p className="text-sm text-zinc-500 mt-1">
          Configure admin access to unlock key creation, key revocation, and spend analytics.
        </p>
      </div>

      {feedback && (
        <div
          className={`p-3.5 rounded-lg border text-xs flex items-center justify-between ${
            feedback.type === 'success'
              ? 'bg-zinc-50 border-zinc-900 text-zinc-950 font-medium'
              : feedback.type === 'error'
              ? 'bg-red-50 border-red-200 text-red-700'
              : 'bg-zinc-100 border-zinc-200 text-zinc-700'
          }`}
        >
          <span>{feedback.text}</span>
          <button onClick={() => setFeedback(null)} className="text-xs text-zinc-400 hover:text-zinc-600">
            Dismiss
          </button>
        </div>
      )}

      <div className="bg-white border border-zinc-200 rounded-lg p-6 shadow-sm">
        <div className="flex items-center space-x-2.5 pb-4 border-b border-zinc-100">
          <Lock size={18} className="text-zinc-900" />
          <h3 className="text-sm font-semibold text-zinc-900">Admin Secret (In-Memory Only)</h3>
        </div>

        <form onSubmit={handleSave} className="mt-5 space-y-4">
          <div>
            <label className="block text-xs font-medium text-zinc-700 mb-1.5">
              Enter ADMIN_SECRET
            </label>
            <div className="relative">
              <input
                type={showSecret ? 'text' : 'password'}
                value={inputVal}
                onChange={(e) => setInputVal(e.target.value)}
                placeholder="Paste your ADMIN_SECRET from .env"
                className="w-full px-3.5 py-2.5 pr-10 bg-white border border-zinc-300 rounded-md text-xs font-mono text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-black focus:border-black transition-all"
              />
              <button
                type="button"
                onClick={() => setShowSecret(!showSecret)}
                className="absolute right-3 top-2.5 text-zinc-400 hover:text-zinc-700 transition-colors"
                tabIndex={-1}
              >
                {showSecret ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div className="flex items-center space-x-3 pt-2">
            <button
              type="submit"
              disabled={isTesting}
              className="px-4 py-2 bg-zinc-900 hover:bg-black text-white text-xs font-medium rounded-md transition-colors flex items-center space-x-2 disabled:opacity-50"
            >
              <span>Save for Current Session</span>
            </button>

            <button
              type="button"
              onClick={handleTest}
              disabled={isTesting}
              className="px-4 py-2 bg-white border border-zinc-300 hover:bg-zinc-50 text-zinc-800 text-xs font-medium rounded-md transition-colors flex items-center space-x-2 disabled:opacity-50"
            >
              <RefreshCw size={14} className={isTesting ? 'animate-spin' : ''} />
              <span>Test Connection</span>
            </button>

            {adminSecret && (
              <button
                type="button"
                onClick={handleClear}
                className="px-4 py-2 text-red-600 hover:text-red-700 text-xs font-medium transition-colors"
              >
                Clear Secret
              </button>
            )}
          </div>
        </form>

        <div className="mt-6 p-3 bg-zinc-50 border border-zinc-200/80 rounded-md flex items-start space-x-2.5">
          <Info size={16} className="text-zinc-500 shrink-0 mt-0.5" />
          <p className="text-[11px] text-zinc-600 leading-relaxed">
            <strong>Security Guarantee:</strong> This secret is strictly held in React component state memory. It is never persisted to <code className="bg-zinc-200/70 px-1 py-0.5 rounded text-[10px]">localStorage</code>, <code className="bg-zinc-200/70 px-1 py-0.5 rounded text-[10px]">sessionStorage</code>, or frontend environment variables, and will be cleared when the page refreshes.
          </p>
        </div>
      </div>

      <div className="bg-white border border-zinc-200 rounded-lg p-6 shadow-sm">
        <div className="flex items-center space-x-2.5 pb-4 border-b border-zinc-100">
          <Server size={18} className="text-zinc-900" />
          <h3 className="text-sm font-semibold text-zinc-900">Connectivity & Service Status</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-5">
          <div className="border border-zinc-200 rounded-md p-4 bg-zinc-50/50">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-zinc-600">Backend Server (GET /health)</span>
              {backendStatus === 'healthy' ? (
                <span className="flex items-center space-x-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  <CheckCircle2 size={12} />
                  <span>Online</span>
                </span>
              ) : (
                <span className="flex items-center space-x-1.5 text-xs font-medium text-red-700 bg-red-50 px-2 py-0.5 rounded border border-red-200">
                  <XCircle size={12} />
                  <span>Offline</span>
                </span>
              )}
            </div>
            <div className="mt-3 font-mono text-[11px] text-zinc-500 space-y-1">
              <div>Endpoint: <span className="text-zinc-800">http://localhost:3000/health</span></div>
              <div>Service: <span className="text-zinc-800">{healthData?.service || 'rentok-llm-gateway'}</span></div>
              <div>Uptime: <span className="text-zinc-800">{healthData?.uptimeSeconds ? `${healthData.uptimeSeconds}s` : '--'}</span></div>
            </div>
          </div>

          <div className="border border-zinc-200 rounded-md p-4 bg-zinc-50/50">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-zinc-600">Admin Secret Verification</span>
              {authStatus === 'verified' ? (
                <span className="flex items-center space-x-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  <ShieldCheck size={12} />
                  <span>Authenticated</span>
                </span>
              ) : authStatus === 'invalid' ? (
                <span className="flex items-center space-x-1.5 text-xs font-medium text-red-700 bg-red-50 px-2 py-0.5 rounded border border-red-200">
                  <ShieldAlert size={12} />
                  <span>Invalid Secret (401)</span>
                </span>
              ) : (
                <span className="flex items-center space-x-1.5 text-xs font-medium text-zinc-500 bg-zinc-200/60 px-2 py-0.5 rounded border border-zinc-300">
                  <span>Not Configured</span>
                </span>
              )}
            </div>
            <div className="mt-3 text-[11px] text-zinc-500">
              {authStatus === 'verified' ? (
                <p className="text-emerald-800">
                  Verified against <code className="font-mono text-[10px]">GET /admin/keys</code>. You can manage keys and view spend.
                </p>
              ) : authStatus === 'invalid' ? (
                <p className="text-red-700">
                  The current secret does not match ADMIN_SECRET configured on the backend.
                </p>
              ) : (
                <p className="text-zinc-500">
                  Save your secret above to authorize admin dashboard features.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
