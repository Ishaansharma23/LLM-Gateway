import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAdmin } from '../context/AdminContext';
import { keyService } from '../services/keyService';
import { 
  KeyRound, 
  Plus, 
  Copy, 
  Check, 
  AlertTriangle, 
  RefreshCw, 
  Search, 
  ShieldAlert, 
  Sliders, 
  X, 
  Trash2, 
  Clock,
  Layers,
  Ban
} from 'lucide-react';

export default function ApiKeys() {
  const { adminSecret, isConfigured } = useAdmin();
  const [keys, setKeys] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [formName, setFormName] = useState('');
  const [formLimit, setFormLimit] = useState(100);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createError, setCreateError] = useState(null);

  const [newKeyData, setNewKeyData] = useState(null);
  const [hasCopied, setHasCopied] = useState(false);

  const [keyToDeactivate, setKeyToDeactivate] = useState(null);
  const [isDeactivating, setIsDeactivating] = useState(false);

  const fetchKeys = useCallback(async () => {
    if (!adminSecret) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await keyService.listKeys();
      setKeys(data.keys || []);
    } catch (err) {
      setError(err.message || 'Failed to fetch virtual keys');
    } finally {
      setIsLoading(false);
    }
  }, [adminSecret]);

  useEffect(() => {
    if (adminSecret) {
      fetchKeys();
    }
  }, [adminSecret, fetchKeys]);

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!formName.trim()) {
      setCreateError('Key name is required');
      return;
    }
    const limitNum = Number(formLimit);
    if (!limitNum || limitNum <= 0) {
      setCreateError('Request limit must be at least 1');
      return;
    }

    setIsSubmitting(true);
    setCreateError(null);
    try {
      const res = await keyService.createKey({
        name: formName.trim(),
        requestLimit: limitNum
      });
      setIsCreateOpen(false);
      setFormName('');
      setFormLimit(100);
      setNewKeyData(res);
      setHasCopied(false);
      await fetchKeys();
    } catch (err) {
      setCreateError(err.message || 'Failed to create virtual key');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyRawKey = () => {
    if (newKeyData?.apiKey) {
      navigator.clipboard.writeText(newKeyData.apiKey);
      setHasCopied(true);
      setTimeout(() => setHasCopied(false), 2500);
    }
  };

  const handleDeactivate = async () => {
    if (!keyToDeactivate) return;
    setIsDeactivating(true);
    try {
      await keyService.deactivateKey(keyToDeactivate._id);
      setKeyToDeactivate(null);
      await fetchKeys();
    } catch (err) {
      alert(`Error deactivating key: ${err.message}`);
    } finally {
      setIsDeactivating(false);
    }
  };

  const filteredKeys = keys.filter(
    (k) =>
      k.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      k.keyPrefix.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalKeys = keys.length;
  const activeKeys = keys.filter((k) => k.status === 'active').length;
  const totalBudget = keys.reduce((acc, k) => acc + (k.requestLimit || 0), 0);
  const totalUsed = keys.reduce((acc, k) => acc + (k.requestsUsed || 0), 0);

  if (!isConfigured) {
    return (
      <div className="bg-white border border-zinc-200 rounded-lg p-10 text-center shadow-sm max-w-xl mx-auto my-12">
        <div className="w-12 h-12 rounded-full bg-zinc-100 flex items-center justify-center mx-auto mb-4 border border-zinc-200 text-zinc-900">
          <ShieldAlert size={24} />
        </div>
        <h2 className="text-base font-bold text-zinc-900">Admin Secret Required</h2>
        <p className="text-xs text-zinc-500 mt-1 max-w-md mx-auto leading-relaxed">
          Virtual API key management is protected by the backend. Please configure your <code className="font-mono bg-zinc-100 px-1 py-0.5 rounded text-[11px]">ADMIN_SECRET</code> in Settings to view and issue keys.
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
          <h2 className="text-xl font-bold text-zinc-950 tracking-tight">Virtual API Keys</h2>
          <p className="text-sm text-zinc-500 mt-0.5">
            Issue and govern client keys with atomic request budgets and one-way SHA-256 storage.
          </p>
        </div>
        <div className="flex items-center space-x-2.5">
          <button
            onClick={fetchKeys}
            disabled={isLoading}
            className="p-2 border border-zinc-300 rounded-md bg-white hover:bg-zinc-50 text-zinc-700 transition-colors"
            title="Refresh List"
          >
            <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
          </button>
          <button
            onClick={() => {
              setCreateError(null);
              setIsCreateOpen(true);
            }}
            className="inline-flex items-center space-x-2 bg-zinc-900 hover:bg-black text-white text-xs font-medium px-3.5 py-2 rounded-md transition-colors shadow-sm"
          >
            <Plus size={14} strokeWidth={2.5} />
            <span>Create Virtual Key</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 bg-white border border-zinc-200 rounded-lg">
          <span className="text-[11px] text-zinc-500 font-medium uppercase tracking-wider block">Total Keys</span>
          <span className="text-xl font-bold font-mono text-zinc-900 mt-1 block">{totalKeys}</span>
        </div>
        <div className="p-3.5 bg-white border border-zinc-200 rounded-lg">
          <span className="text-[11px] text-zinc-500 font-medium uppercase tracking-wider block">Active Keys</span>
          <span className="text-xl font-bold font-mono text-emerald-700 mt-1 block">{activeKeys}</span>
        </div>
        <div className="p-3.5 bg-white border border-zinc-200 rounded-lg">
          <span className="text-[11px] text-zinc-500 font-medium uppercase tracking-wider block">Total Budget</span>
          <span className="text-xl font-bold font-mono text-zinc-900 mt-1 block">{totalBudget}</span>
        </div>
        <div className="p-3.5 bg-white border border-zinc-200 rounded-lg">
          <span className="text-[11px] text-zinc-500 font-medium uppercase tracking-wider block">Requests Used</span>
          <span className="text-xl font-bold font-mono text-zinc-900 mt-1 block">{totalUsed}</span>
        </div>
      </div>

      <div className="relative max-w-sm">
        <Search size={14} className="absolute left-3 top-3 text-zinc-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by key name or prefix..."
          className="w-full pl-9 pr-4 py-2 bg-white border border-zinc-200 rounded-md text-xs text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-black focus:border-black transition-all"
        />
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 flex items-center justify-between">
          <span>{error}</span>
          <button onClick={fetchKeys} className="underline font-medium hover:text-red-900 ml-3">
            Retry
          </button>
        </div>
      )}

      <div className="bg-white border border-zinc-200 rounded-lg shadow-sm overflow-hidden">
        {isLoading && keys.length === 0 ? (
          <div className="p-12 text-center">
            <RefreshCw size={24} className="animate-spin text-zinc-400 mx-auto mb-2" />
            <span className="text-xs text-zinc-500">Loading virtual keys from database...</span>
          </div>
        ) : filteredKeys.length === 0 ? (
          <div className="p-12 text-center">
            <KeyRound size={32} className="text-zinc-300 mx-auto mb-3" />
            <h3 className="text-sm font-semibold text-zinc-900">
              {searchQuery ? 'No matching keys found' : 'No virtual keys yet'}
            </h3>
            <p className="text-xs text-zinc-500 max-w-xs mx-auto mt-1">
              {searchQuery
                ? 'Try adjusting your search query.'
                : 'Create your first virtual API key to grant client access with a request budget.'}
            </p>
            {!searchQuery && (
              <button
                onClick={() => setIsCreateOpen(true)}
                className="mt-4 inline-flex items-center space-x-1.5 px-3 py-1.5 bg-zinc-900 hover:bg-black text-white text-xs font-medium rounded-md transition-colors"
              >
                <Plus size={14} />
                <span>Create Key</span>
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-zinc-50/80 border-b border-zinc-200 text-zinc-500 uppercase tracking-wider font-medium text-[10px]">
                <tr>
                  <th className="py-3 px-5">Client / Name</th>
                  <th className="py-3 px-4">Prefix</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 w-56">Budget Usage</th>
                  <th className="py-3 px-4">Created</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 text-zinc-800">
                {filteredKeys.map((k) => {
                  const used = k.requestsUsed || 0;
                  const limit = k.requestLimit || 1;
                  const pct = Math.min(100, Math.round((used / limit) * 100));
                  const remaining = Math.max(0, limit - used);
                  const isRevoked = k.status !== 'active';

                  return (
                    <tr key={k._id} className="hover:bg-zinc-50/60 transition-colors">
                      <td className="py-3.5 px-5">
                        <div className="font-semibold text-zinc-900 text-xs">{k.name}</div>
                        <div className="text-[10px] text-zinc-400 font-mono mt-0.5">{k._id}</div>
                      </td>

                      <td className="py-3.5 px-4 font-mono text-[11px] text-zinc-600">
                        <span className="bg-zinc-100 px-1.5 py-0.5 rounded border border-zinc-200">
                          {k.keyPrefix}...
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        {isRevoked ? (
                          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-zinc-100 text-zinc-600 border border-zinc-200">
                            <Ban size={10} />
                            <span>Revoked</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
                            <span>Active</span>
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="flex items-center justify-between text-[11px] mb-1 font-mono">
                          <span className="font-semibold text-zinc-900">{used} / {limit} reqs</span>
                          <span className="text-zinc-400 text-[10px]">{remaining} left</span>
                        </div>
                        <div className="w-full bg-zinc-100 h-1.5 rounded-full overflow-hidden border border-zinc-200/60">
                          <div
                            className={`h-full transition-all duration-300 ${
                              pct >= 100
                                ? 'bg-red-500'
                                : pct >= 80
                                ? 'bg-amber-500'
                                : 'bg-zinc-900'
                            }`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-zinc-500 text-[11px]">
                        {new Date(k.createdAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        {isRevoked ? (
                          <span className="text-[11px] text-zinc-400 italic">Deactivated</span>
                        ) : (
                          <button
                            onClick={() => setKeyToDeactivate(k)}
                            className="text-xs text-red-600 hover:text-red-700 font-medium px-2 py-1 rounded hover:bg-red-50 transition-colors"
                          >
                            Deactivate
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-lg border border-zinc-200 shadow-xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between p-5 border-b border-zinc-100">
              <div className="flex items-center space-x-2">
                <KeyRound size={18} className="text-zinc-900" />
                <h3 className="text-sm font-bold text-zinc-900">Create Virtual API Key</h3>
              </div>
              <button
                onClick={() => setIsCreateOpen(false)}
                className="text-zinc-400 hover:text-zinc-600 transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="p-5 space-y-4">
              {createError && (
                <div className="p-3 bg-red-50 border border-red-200 text-xs text-red-700 rounded-md">
                  {createError}
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-zinc-700 mb-1">
                  Key Name / Client Identifier
                </label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g., Mobile App Client, Rahul, Production Partner"
                  className="w-full px-3 py-2 border border-zinc-300 rounded-md text-xs text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-black focus:border-black"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-700 mb-1">
                  Request Budget Limit
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  value={formLimit}
                  onChange={(e) => setFormLimit(e.target.value)}
                  placeholder="100"
                  className="w-full px-3 py-2 border border-zinc-300 rounded-md text-xs font-mono text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-black focus:border-black"
                />
                <span className="text-[11px] text-zinc-400 mt-1 block">
                  Total requests this key is allowed to make before returning HTTP 429.
                </span>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-zinc-100">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-3.5 py-2 border border-zinc-300 rounded-md text-xs text-zinc-700 hover:bg-zinc-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-zinc-900 hover:bg-black text-white text-xs font-medium rounded-md transition-colors flex items-center space-x-1.5 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw size={14} className="animate-spin" />
                      <span>Generating...</span>
                    </>
                  ) : (
                    <span>Generate Key</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {newKeyData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-lg border border-zinc-200 shadow-2xl max-w-lg w-full p-6 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start space-x-3">
              <div className="w-10 h-10 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 shrink-0">
                <KeyRound size={20} />
              </div>
              <div className="flex-1">
                <h3 className="text-base font-bold text-zinc-950">Virtual API Key Generated</h3>
                <p className="text-xs text-zinc-500 mt-0.5">
                  Created for <strong className="text-zinc-800">{newKeyData.key?.name}</strong> with a budget of {newKeyData.key?.requestLimit} requests.
                </p>
              </div>
            </div>

            <div className="mt-4 p-3 bg-amber-50 border border-amber-200/80 rounded-md text-xs text-amber-900 flex items-start space-x-2">
              <AlertTriangle size={16} className="text-amber-600 shrink-0 mt-0.5" />
              <span>
                <strong>Important:</strong> Save this raw key now. For security, only its SHA-256 hash is saved in MongoDB. It will <strong>never</strong> be displayed again.
              </span>
            </div>

            <div className="mt-4 p-3 bg-zinc-50 border border-zinc-300 rounded-md flex items-center justify-between">
              <code className="text-xs font-mono text-zinc-900 break-all select-all font-semibold">
                {newKeyData.apiKey}
              </code>
              <button
                onClick={handleCopyRawKey}
                className="ml-3 px-3 py-1.5 bg-zinc-900 hover:bg-black text-white text-xs font-medium rounded transition-colors flex items-center space-x-1 shrink-0"
              >
                {hasCopied ? (
                  <>
                    <Check size={14} className="text-emerald-400" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy size={14} />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setNewKeyData(null)}
                className="px-4 py-2 bg-zinc-900 hover:bg-black text-white text-xs font-medium rounded-md transition-colors"
              >
                I have saved this key
              </button>
            </div>
          </div>
        </div>
      )}

      {keyToDeactivate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-lg border border-zinc-200 shadow-xl max-w-md w-full p-6 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start space-x-3">
              <div className="w-10 h-10 rounded-full bg-red-50 border border-red-200 flex items-center justify-center text-red-600 shrink-0">
                <AlertTriangle size={20} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-zinc-950">Deactivate Virtual Key</h3>
                <p className="text-xs text-zinc-500 mt-1 leading-relaxed">
                  Are you sure you want to deactivate <strong>{keyToDeactivate.name}</strong> ({keyToDeactivate.keyPrefix}...)?
                </p>
                <p className="text-xs text-zinc-500 mt-1 leading-relaxed">
                  Any API requests using this key will immediately receive HTTP 403 Forbidden errors.
                </p>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end space-x-2 pt-3 border-t border-zinc-100">
              <button
                type="button"
                onClick={() => setKeyToDeactivate(null)}
                className="px-3.5 py-2 border border-zinc-300 rounded-md text-xs text-zinc-700 hover:bg-zinc-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeactivate}
                disabled={isDeactivating}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-medium rounded-md transition-colors flex items-center space-x-1.5 disabled:opacity-50"
              >
                {isDeactivating ? (
                  <>
                    <RefreshCw size={14} className="animate-spin" />
                    <span>Deactivating...</span>
                  </>
                ) : (
                  <span>Yes, Deactivate Key</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
