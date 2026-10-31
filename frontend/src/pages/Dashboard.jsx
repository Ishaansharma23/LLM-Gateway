import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAdmin } from '../context/AdminContext';
import { keyService } from '../services/keyService';
import { usageService } from '../services/usageService';
import { 
  KeyRound, 
  Activity, 
  Coins, 
  Cpu, 
  ArrowRight, 
  CheckCircle2, 
  XCircle, 
  TrendingUp, 
  Clock, 
  ShieldCheck, 
  ShieldAlert, 
  Sliders, 
  RefreshCw, 
  Terminal, 
  Layers,
  Server
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  CartesianGrid 
} from 'recharts';

export default function Dashboard() {
  const { adminSecret, isConfigured, backendStatus, healthData } = useAdmin();

  const [keys, setKeys] = useState([]);
  const [usageData, setUsageData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const loadDashboardData = useCallback(async () => {
    if (!adminSecret) return;
    setIsLoading(true);
    setError(null);
    try {
      const [keysRes, usageRes] = await Promise.all([
        keyService.listKeys(),
        usageService.getOverallUsage(15)
      ]);
      setKeys(keysRes.keys || []);
      setUsageData(usageRes);
    } catch (err) {
      setError(err.message || 'Failed to load dashboard metrics');
    } finally {
      setIsLoading(false);
    }
  }, [adminSecret]);

  useEffect(() => {
    if (adminSecret) {
      loadDashboardData();
    }
  }, [adminSecret, loadDashboardData]);

  const summary = usageData?.summary || {
    totalRequests: 0,
    successfulRequests: 0,
    failedRequests: 0,
    totalInputTokens: 0,
    totalOutputTokens: 0,
    totalTokens: 0,
    estimatedTotalSpendInr: 0
  };

  const recentRequests = usageData?.recentRequests || [];
  const totalKeys = keys.length;
  const activeKeys = keys.filter((k) => k.status === 'active').length;
  const revokedKeys = totalKeys - activeKeys;

  const chartData = useMemo(() => {
    return [...recentRequests]
      .reverse()
      .map((item, idx) => ({
        index: idx + 1,
        time: new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        inputTokens: item.inputTokens || 0,
        outputTokens: item.outputTokens || 0,
        totalTokens: item.totalTokens || 0,
        model: item.model,
        status: item.requestStatus
      }));
  }, [recentRequests]);

  if (!isConfigured) {
    return (
      <div className="space-y-6">
        <div className="bg-white border border-zinc-200 rounded-lg p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-zinc-950 tracking-tight">Overview Dashboard</h2>
            <p className="text-sm text-zinc-500 mt-0.5">
              Monitor virtual API keys, atomic request budgets, and token telemetry across your LLM Gateway.
            </p>
          </div>
          <Link
            to="/settings"
            className="inline-flex items-center space-x-2 bg-zinc-900 hover:bg-black text-white text-xs font-medium px-4 py-2 rounded-md transition-colors self-start sm:self-auto shadow-xs"
          >
            <span>Set Admin Secret</span>
            <ArrowRight size={14} />
          </Link>
        </div>

        <div className="bg-white border border-zinc-200 rounded-lg p-10 text-center shadow-xs">
          <div className="w-12 h-12 rounded-full bg-zinc-100 flex items-center justify-center mx-auto mb-3 text-zinc-900 border border-zinc-200">
            <ShieldAlert size={22} />
          </div>
          <h3 className="text-sm font-bold text-zinc-900">Admin Authentication Required</h3>
          <p className="text-xs text-zinc-500 max-w-md mx-auto mt-1 leading-relaxed">
            The dashboard displays real-time telemetry from your backend. Enter your session <code className="font-mono bg-zinc-100 px-1 py-0.5 rounded text-[11px]">ADMIN_SECRET</code> in Settings to unlock key and usage statistics.
          </p>
          <div className="mt-5 flex justify-center gap-3">
            <Link
              to="/settings"
              className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-zinc-900 hover:bg-black text-white text-xs font-medium rounded-md transition-colors"
            >
              <Sliders size={13} />
              <span>Configure Secret</span>
            </Link>
            <Link
              to="/playground"
              className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-white border border-zinc-300 text-zinc-700 hover:bg-zinc-50 text-xs font-medium rounded-md transition-colors"
            >
              <Terminal size={13} />
              <span>Open Playground</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-zinc-950 tracking-tight">Overview Dashboard</h2>
          <p className="text-sm text-zinc-500 mt-0.5">
            Real-time telemetry and atomic budget enforcement across Google Gemini proxy calls.
          </p>
        </div>
        <div className="flex items-center space-x-2.5">
          <button
            onClick={loadDashboardData}
            disabled={isLoading}
            className="p-2 border border-zinc-300 rounded-md bg-white hover:bg-zinc-50 text-zinc-700 transition-colors shadow-xs"
            title="Refresh Data"
          >
            <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
          </button>
          <Link
            to="/keys"
            className="inline-flex items-center space-x-1.5 bg-zinc-900 hover:bg-black text-white text-xs font-medium px-3.5 py-2 rounded-md transition-colors shadow-xs"
          >
            <span>Manage Keys</span>
            <ArrowRight size={14} />
          </Link>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 flex items-center justify-between">
          <span>{error}</span>
          <button onClick={loadDashboardData} className="underline font-medium hover:text-red-900 ml-3">
            Retry
          </button>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-5 bg-white border border-zinc-200 rounded-lg shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-zinc-500 font-medium uppercase tracking-wider">Virtual API Keys</span>
            <KeyRound size={16} className="text-zinc-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-zinc-950 mt-2">
            {totalKeys}
          </div>
          <div className="flex items-center space-x-2 text-[11px] mt-1 text-zinc-500">
            <span className="text-emerald-700 font-medium">{activeKeys} active</span>
            <span>•</span>
            <span className="text-zinc-400">{revokedKeys} revoked</span>
          </div>
        </div>

        <div className="p-5 bg-white border border-zinc-200 rounded-lg shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-zinc-500 font-medium uppercase tracking-wider">Total Requests</span>
            <Activity size={16} className="text-zinc-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-zinc-950 mt-2">
            {summary.totalRequests}
          </div>
          <div className="flex items-center space-x-2 text-[11px] mt-1 text-zinc-500">
            <span className="text-emerald-700 font-medium">{summary.successfulRequests} success</span>
            <span>•</span>
            <span className={summary.failedRequests > 0 ? 'text-red-600 font-medium' : 'text-zinc-400'}>
              {summary.failedRequests} failed
            </span>
          </div>
        </div>

        <div className="p-5 bg-white border border-zinc-200 rounded-lg shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-zinc-500 font-medium uppercase tracking-wider">Tokens Consumed</span>
            <Cpu size={16} className="text-zinc-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-zinc-950 mt-2">
            {summary.totalTokens.toLocaleString()}
          </div>
          <div className="flex items-center space-x-1 text-[11px] text-zinc-500 mt-1">
            <span>{summary.totalInputTokens.toLocaleString()} in</span>
            <span>/</span>
            <span>{summary.totalOutputTokens.toLocaleString()} out</span>
          </div>
        </div>

        <div className="p-5 bg-white border border-zinc-200 rounded-lg shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-zinc-500 font-medium uppercase tracking-wider">Estimated Spend</span>
            <Coins size={16} className="text-zinc-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-zinc-950 mt-2">
            ₹{summary.estimatedTotalSpendInr.toFixed(4)}
          </div>
          <span className="text-[10px] text-zinc-400 mt-1 block">
            Gemini rates @ 83.50 INR/USD
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="lg:col-span-8 bg-white border border-zinc-200 rounded-lg p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-xs font-semibold text-zinc-900 uppercase tracking-wider">
                Recent Request Token Volumes
              </h3>
              <span className="text-[11px] text-zinc-400">Chronological prompt and candidate tokens</span>
            </div>
            <Link to="/usage" className="text-xs text-zinc-600 hover:text-black hover:underline font-medium">
              View Detailed Analytics →
            </Link>
          </div>

          <div className="h-60 w-full">
            {chartData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-zinc-400">
                No recent request activity recorded.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F4F4F5" />
                  <XAxis dataKey="index" tickLine={false} tick={{ fontSize: 10, fill: '#71717A' }} />
                  <YAxis tickLine={false} tick={{ fontSize: 10, fill: '#71717A' }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#111111', borderColor: '#27272A', borderRadius: '6px', color: '#fff', fontSize: '11px' }}
                    itemStyle={{ color: '#fff' }}
                  />
                  <Bar dataKey="inputTokens" name="Input Tokens" fill="#A1A1AA" radius={[2, 2, 0, 0]} stackId="a" />
                  <Bar dataKey="outputTokens" name="Output Tokens" fill="#111111" radius={[2, 2, 0, 0]} stackId="a" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="lg:col-span-4 bg-white border border-zinc-200 rounded-lg p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
              <span className="text-xs font-semibold text-zinc-900 uppercase tracking-wider flex items-center space-x-1.5">
                <Server size={14} />
                <span>Gateway Infrastructure</span>
              </span>
              <span className="flex items-center space-x-1 text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded text-[10px] font-medium border border-emerald-200">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
                <span>Active</span>
              </span>
            </div>

            <div className="mt-4 space-y-3 text-xs">
              <div className="flex justify-between py-1 border-b border-zinc-100">
                <span className="text-zinc-500">Service</span>
                <span className="font-mono text-zinc-900 font-medium">{healthData?.service || 'rentok-llm-gateway'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-zinc-100">
                <span className="text-zinc-500">Uptime</span>
                <span className="font-mono text-zinc-900 font-medium">{healthData?.uptimeSeconds ? `${healthData.uptimeSeconds}s` : '--'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-zinc-100">
                <span className="text-zinc-500">Upstream LLM</span>
                <span className="font-mono text-zinc-900 font-medium">Google Gemini</span>
              </div>
              <div className="flex justify-between py-1 border-b border-zinc-100">
                <span className="text-zinc-500">Database Engine</span>
                <span className="font-mono text-zinc-900 font-medium">MongoDB (Mongoose)</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-zinc-500">Local Port</span>
                <span className="font-mono text-zinc-900 font-medium">:3000 (Proxy :5173)</span>
              </div>
            </div>
          </div>

          <Link
            to="/playground"
            className="mt-5 w-full py-2 bg-zinc-50 hover:bg-zinc-100 border border-zinc-200 text-zinc-800 text-xs font-medium rounded-md transition-colors flex items-center justify-center space-x-1.5"
          >
            <Terminal size={13} />
            <span>Test in Playground</span>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="lg:col-span-5 bg-white border border-zinc-200 rounded-lg p-5 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-100 mb-3">
            <h3 className="text-xs font-semibold text-zinc-900 uppercase tracking-wider">
              Virtual Key Distribution
            </h3>
            <Link to="/keys" className="text-xs text-zinc-500 hover:text-black">
              View all ({keys.length}) →
            </Link>
          </div>

          {keys.length === 0 ? (
            <div className="py-8 text-center text-xs text-zinc-400">
              No keys created yet.
            </div>
          ) : (
            <div className="space-y-3">
              {keys.slice(0, 5).map((k) => {
                const used = k.requestsUsed || 0;
                const limit = k.requestLimit || 1;
                const pct = Math.min(100, Math.round((used / limit) * 100));

                return (
                  <div key={k._id} className="text-xs p-2 rounded hover:bg-zinc-50 transition-colors">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold text-zinc-900">{k.name}</span>
                      <span className="font-mono text-[11px] text-zinc-500">{used} / {limit} reqs</span>
                    </div>
                    <div className="w-full bg-zinc-100 h-1.5 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${pct >= 100 ? 'bg-red-500' : pct >= 80 ? 'bg-amber-500' : 'bg-zinc-900'}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="lg:col-span-7 bg-white border border-zinc-200 rounded-lg p-5 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-100 mb-3">
            <h3 className="text-xs font-semibold text-zinc-900 uppercase tracking-wider">
              Recent Activity Feed
            </h3>
            <Link to="/usage" className="text-xs text-zinc-500 hover:text-black">
              View full audit log →
            </Link>
          </div>

          {recentRequests.length === 0 ? (
            <div className="py-8 text-center text-xs text-zinc-400">
              No recent requests logged yet.
            </div>
          ) : (
            <div className="divide-y divide-zinc-100">
              {recentRequests.slice(0, 5).map((item) => (
                <div key={item._id} className="py-2.5 flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-2.5">
                    {item.requestStatus === 'success' ? (
                      <CheckCircle2 size={14} className="text-emerald-600 shrink-0" />
                    ) : (
                      <XCircle size={14} className="text-red-600 shrink-0" />
                    )}
                    <div>
                      <span className="font-medium text-zinc-900 font-mono text-[11px]">
                        {item.model}
                      </span>
                      <span className="text-[10px] text-zinc-400 ml-2 font-mono">
                        {item.durationMs}ms
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3 text-right">
                    <span className="font-mono text-[11px] text-zinc-600 font-semibold">
                      {item.totalTokens} tokens
                    </span>
                    <span className="text-[10px] text-zinc-400">
                      {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
