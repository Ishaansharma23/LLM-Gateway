import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAdmin } from '../context/AdminContext';
import { usageService } from '../services/usageService';
import { keyService } from '../services/keyService';
import { 
  BarChart3, 
  Activity, 
  Layers, 
  Coins, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  RefreshCw, 
  Filter, 
  ShieldAlert, 
  Sliders, 
  ArrowUpRight,
  TrendingUp,
  Cpu
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  CartesianGrid, 
  AreaChart, 
  Area 
} from 'recharts';

export default function UsageAnalytics() {
  const { adminSecret, isConfigured } = useAdmin();

  const [selectedKeyId, setSelectedKeyId] = useState('all');
  const [keyList, setKeyList] = useState([]);
  const [usageData, setUsageData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const loadKeyOptions = useCallback(async () => {
    if (!adminSecret) return;
    try {
      const res = await keyService.listKeys();
      setKeyList(res.keys || []);
    } catch {

    }
  }, [adminSecret]);

  const fetchUsage = useCallback(async () => {
    if (!adminSecret) return;
    setIsLoading(true);
    setError(null);
    try {
      if (selectedKeyId === 'all') {
        const res = await usageService.getOverallUsage(100);
        setUsageData(res);
      } else {
        const res = await usageService.getKeyUsage(selectedKeyId, 100);
        setUsageData(res);
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch usage analytics');
    } finally {
      setIsLoading(false);
    }
  }, [adminSecret, selectedKeyId]);

  useEffect(() => {
    if (adminSecret) {
      loadKeyOptions();
      fetchUsage();
    }
  }, [adminSecret, loadKeyOptions, fetchUsage]);

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
  const selectedKeyInfo = usageData?.key || keyList.find((k) => k._id === selectedKeyId);

  const chartData = useMemo(() => {
    return [...recentRequests]
      .reverse()
      .map((item, idx) => ({
        index: idx + 1,
        time: new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        inputTokens: item.inputTokens || 0,
        outputTokens: item.outputTokens || 0,
        totalTokens: item.totalTokens || 0,
        duration: item.durationMs || 0,
        cost: item.estimatedCostInr || 0,
        status: item.requestStatus
      }));
  }, [recentRequests]);

  const successRate = summary.totalRequests > 0
    ? Math.round((summary.successfulRequests / summary.totalRequests) * 100)
    : 100;

  if (!isConfigured) {
    return (
      <div className="bg-white border border-zinc-200 rounded-lg p-10 text-center shadow-sm max-w-xl mx-auto my-12">
        <div className="w-12 h-12 rounded-full bg-zinc-100 flex items-center justify-center mx-auto mb-4 border border-zinc-200 text-zinc-900">
          <ShieldAlert size={24} />
        </div>
        <h2 className="text-base font-bold text-zinc-900">Admin Secret Required</h2>
        <p className="text-xs text-zinc-500 mt-1 max-w-md mx-auto leading-relaxed">
          Usage analytics and token spend reports are protected. Configure your <code className="font-mono bg-zinc-100 px-1 py-0.5 rounded text-[11px]">ADMIN_SECRET</code> in Settings to inspect metrics.
        </p>
        <Link
          to="/settings"
          className="inline-flex items-center space-x-2 mt-5 px-4 py-2 bg-zinc-900 hover:bg-black text-white text-xs font-medium rounded-md transition-colors"
        >
          <Sliders size={14} />
          <span>Open Settings</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-zinc-950 tracking-tight">Usage & Spend Analytics</h2>
          <p className="text-sm text-zinc-500 mt-0.5">
            Real-time gateway consumption telemetry, token counts, and cost metrics in INR.
          </p>
        </div>

        <div className="flex items-center space-x-2.5">
          <div className="flex items-center space-x-2 bg-white border border-zinc-200 rounded-md px-3 py-1.5 shadow-xs">
            <Filter size={13} className="text-zinc-400 shrink-0" />
            <select
              value={selectedKeyId}
              onChange={(e) => setSelectedKeyId(e.target.value)}
              className="bg-transparent text-xs text-zinc-900 font-medium focus:outline-none cursor-pointer pr-1"
            >
              <option value="all">All Virtual Keys (Global Gateway)</option>
              {keyList.map((k) => (
                <option key={k._id} value={k._id}>
                  {k.name} ({k.keyPrefix}...)
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={fetchUsage}
            disabled={isLoading}
            className="p-2 border border-zinc-300 rounded-md bg-white hover:bg-zinc-50 text-zinc-700 transition-colors shadow-xs"
            title="Refresh Metrics"
          >
            <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      <div className="p-3.5 bg-zinc-50 border border-zinc-200/90 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
        <div className="flex items-center space-x-2">
          <span className="font-semibold text-zinc-900">Current Scope:</span>
          {selectedKeyId === 'all' ? (
            <span className="px-2 py-0.5 bg-zinc-900 text-white rounded text-[11px] font-mono">
              Global Gateway Telemetry (All Keys)
            </span>
          ) : (
            <span className="px-2 py-0.5 bg-white border border-zinc-300 text-zinc-900 rounded text-[11px] font-mono font-medium">
              Virtual Key: {selectedKeyInfo?.name || selectedKeyId} ({selectedKeyInfo?.keyPrefix}...)
            </span>
          )}
        </div>
        <div className="text-[11px] text-zinc-500">
          Showing developer calls through <code className="font-mono text-zinc-700">/v1/chat/completions</code>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 flex items-center justify-between">
          <span>{error}</span>
          <button onClick={fetchUsage} className="underline font-medium hover:text-red-900 ml-3">
            Retry
          </button>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
            <span className="text-[11px] text-zinc-500 font-medium uppercase tracking-wider">Total Tokens</span>
            <Cpu size={16} className="text-zinc-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-zinc-950 mt-2">
            {summary.totalTokens.toLocaleString()}
          </div>
          <div className="flex items-center space-x-1.5 text-[11px] text-zinc-500 mt-1">
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
          <div className="text-[10px] text-zinc-400 mt-1">
            Official Gemini rate (83.50 INR/USD)
          </div>
        </div>

        <div className="p-5 bg-white border border-zinc-200 rounded-lg shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-zinc-500 font-medium uppercase tracking-wider">Success Rate</span>
            <TrendingUp size={16} className="text-zinc-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-zinc-950 mt-2">
            {successRate}%
          </div>
          <div className="text-[11px] text-zinc-500 mt-1">
            {summary.successfulRequests} of {summary.totalRequests} resolved 200 OK
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="bg-white border border-zinc-200 rounded-lg p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-xs font-semibold text-zinc-900 uppercase tracking-wider">
                Token Consumption by Request
              </h3>
              <span className="text-[11px] text-zinc-400">Input (prompt) vs Output (completion) tokens</span>
            </div>
            <div className="flex items-center space-x-3 text-[11px]">
              <span className="flex items-center space-x-1">
                <span className="w-2.5 h-2.5 rounded-sm bg-zinc-400"></span>
                <span className="text-zinc-600">Input</span>
              </span>
              <span className="flex items-center space-x-1">
                <span className="w-2.5 h-2.5 rounded-sm bg-zinc-950"></span>
                <span className="text-zinc-900 font-medium">Output</span>
              </span>
            </div>
          </div>

          <div className="h-60 w-full">
            {chartData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-zinc-400">
                No request activity recorded yet.
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

        <div className="bg-white border border-zinc-200 rounded-lg p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-xs font-semibold text-zinc-900 uppercase tracking-wider">
                Gateway & Provider Latency
              </h3>
              <span className="text-[11px] text-zinc-400">Duration in milliseconds (ms) per request</span>
            </div>
            <Clock size={16} className="text-zinc-400" />
          </div>

          <div className="h-60 w-full">
            {chartData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-zinc-400">
                No latency data recorded yet.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F4F4F5" />
                  <XAxis dataKey="index" tickLine={false} tick={{ fontSize: 10, fill: '#71717A' }} />
                  <YAxis tickLine={false} tick={{ fontSize: 10, fill: '#71717A' }} unit="ms" />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#111111', borderColor: '#27272A', borderRadius: '6px', color: '#fff', fontSize: '11px' }}
                    itemStyle={{ color: '#fff' }}
                  />
                  <Area type="monotone" dataKey="duration" name="Duration (ms)" stroke="#111111" fill="#F4F4F5" strokeWidth={1.5} />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white border border-zinc-200 rounded-lg shadow-xs overflow-hidden">
        <div className="p-4 border-b border-zinc-200 flex items-center justify-between bg-zinc-50/50">
          <div>
            <h3 className="text-xs font-bold text-zinc-900 uppercase tracking-wider">
              Recent Gateway Requests ({recentRequests.length})
            </h3>
            <span className="text-[11px] text-zinc-400">Chronological telemetry audit log</span>
          </div>
        </div>

        {recentRequests.length === 0 ? (
          <div className="p-12 text-center text-zinc-400 text-xs">
            No request records recorded for this scope.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-zinc-50 border-b border-zinc-200 text-zinc-500 uppercase tracking-wider font-medium text-[10px]">
                <tr>
                  <th className="py-2.5 px-4">Timestamp</th>
                  <th className="py-2.5 px-4">Client / Key</th>
                  <th className="py-2.5 px-4">Model & Provider</th>
                  <th className="py-2.5 px-4">Status</th>
                  <th className="py-2.5 px-4">Tokens (In / Out)</th>
                  <th className="py-2.5 px-4">Cost (INR)</th>
                  <th className="py-2.5 px-4 text-right">Duration</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 text-zinc-800">
                {recentRequests.map((item) => {
                  const keyName = item.keyId?.name || selectedKeyInfo?.name || 'Developer Key';
                  const keyPrefix = item.keyId?.keyPrefix || selectedKeyInfo?.keyPrefix || 'gw_live';
                  const isSuccess = item.requestStatus === 'success';

                  return (
                    <tr key={item._id} className="hover:bg-zinc-50/60 transition-colors">
                      <td className="py-3 px-4 font-mono text-[11px] text-zinc-500 whitespace-nowrap">
                        {new Date(item.timestamp).toLocaleString([], {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit'
                        })}
                      </td>

                      <td className="py-3 px-4">
                        <div className="font-semibold text-zinc-900">{keyName}</div>
                        <div className="text-[10px] text-zinc-400 font-mono">{keyPrefix}...</div>
                      </td>

                      <td className="py-3 px-4 font-mono text-[11px]">
                        <span className="text-zinc-900">{item.model}</span>
                        <span className="text-zinc-400 text-[10px] block font-sans capitalize">{item.provider}</span>
                      </td>

                      <td className="py-3 px-4">
                        {isSuccess ? (
                          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle2 size={10} />
                            <span>{item.httpStatus} OK</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-red-50 text-red-700 border border-red-200" title={item.errorDetails || 'Request failed'}>
                            <XCircle size={10} />
                            <span>{item.httpStatus || 500} Error</span>
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4 font-mono text-[11px]">
                        <span className="font-semibold text-zinc-900">{item.totalTokens}</span>
                        <span className="text-[10px] text-zinc-400 block">
                          {item.inputTokens} in / {item.outputTokens} out
                        </span>
                      </td>

                      <td className="py-3 px-4 font-mono text-[11px] text-zinc-900">
                        {item.estimatedCostInr !== null && item.estimatedCostInr !== undefined
                          ? `₹${Number(item.estimatedCostInr).toFixed(5)}`
                          : <span className="text-zinc-400 italic">--</span>}
                      </td>

                      <td className="py-3 px-4 text-right font-mono text-[11px] text-zinc-600">
                        {item.durationMs}ms
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
