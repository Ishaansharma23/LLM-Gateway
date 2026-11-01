import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { gatewayService } from '../services/gatewayService';
import { 
  Terminal, 
  Send, 
  Copy, 
  Check, 
  KeyRound, 
  Clock, 
  Cpu, 
  Coins, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  RefreshCw, 
  Sparkles, 
  Eye, 
  EyeOff, 
  Code2, 
  SlidersHorizontal 
} from 'lucide-react';

const PRESET_MODELS = [
  { id: 'gemini-3.5-flash', name: 'Gemini 3.5 Flash', tag: 'Fast & Recommended' },
  { id: 'gemini-flash-lite-latest', name: 'Gemini Flash Lite', tag: 'Lowest Latency' },
  { id: 'gemini-3.8-flash', name: 'Gemini 3.8 Flash', tag: 'Latest Generation' },
  { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash', tag: 'Standard' },
];

const SAMPLE_PROMPTS = [
  'Explain Node.js event loop in simple terms',
  'Write a JavaScript function to check for balanced brackets',
  'What is the difference between MongoDB and PostgreSQL?'
];

const InPreContext = React.createContext(false);

const markdownComponents = {
  h1: ({ _node, ...props }) => (
    <h1 className="text-xl font-bold text-zinc-900 mt-6 mb-3 pb-2 border-b border-zinc-200" {...props} />
  ),
  h2: ({ _node, ...props }) => (
    <h2 className="text-lg font-bold text-zinc-900 mt-5 mb-2 pb-1 border-b border-zinc-100" {...props} />
  ),
  h3: ({ _node, ...props }) => (
    <h3 className="text-base font-semibold text-zinc-900 mt-4 mb-2" {...props} />
  ),
  h4: ({ _node, ...props }) => (
    <h4 className="text-sm font-semibold text-zinc-900 mt-3 mb-1" {...props} />
  ),
  p: ({ _node, ...props }) => (
    <p className="mb-3 text-sm leading-relaxed text-zinc-800 last:mb-0 break-words whitespace-pre-line" {...props} />
  ),
  strong: ({ _node, ...props }) => (
    <strong className="font-semibold text-zinc-900" {...props} />
  ),
  em: ({ _node, ...props }) => (
    <em className="italic text-zinc-800" {...props} />
  ),
  ul: ({ _node, ...props }) => (
    <ul className="list-disc list-outside pl-5 mb-3 space-y-1 text-sm text-zinc-800" {...props} />
  ),
  ol: ({ _node, ...props }) => (
    <ol className="list-decimal list-outside pl-5 mb-3 space-y-1 text-sm text-zinc-800" {...props} />
  ),
  li: ({ _node, ...props }) => (
    <li className="leading-relaxed" {...props} />
  ),
  blockquote: ({ _node, ...props }) => (
    <blockquote className="border-l-4 border-zinc-300 pl-4 py-1.5 my-3 bg-zinc-50/80 rounded-r text-sm text-zinc-700 italic" {...props} />
  ),
  hr: ({ _node, ...props }) => (
    <hr className="my-5 border-zinc-200" {...props} />
  ),
  table: ({ _node, ...props }) => (
    <div className="my-3 overflow-x-auto border border-zinc-200 rounded-md">
      <table className="min-w-full divide-y divide-zinc-200 text-xs text-left" {...props} />
    </div>
  ),
  thead: ({ _node, ...props }) => (
    <thead className="bg-zinc-50 font-semibold text-zinc-800" {...props} />
  ),
  tbody: ({ _node, ...props }) => (
    <tbody className="divide-y divide-zinc-100 bg-white" {...props} />
  ),
  tr: ({ _node, ...props }) => (
    <tr className="hover:bg-zinc-50/50 transition-colors" {...props} />
  ),
  th: ({ _node, ...props }) => (
    <th className="px-3 py-2 text-zinc-700 font-medium" {...props} />
  ),
  td: ({ _node, ...props }) => (
    <td className="px-3 py-2 text-zinc-700" {...props} />
  ),
  a: ({ _node, ...props }) => (
    <a className="text-blue-600 hover:text-blue-800 underline underline-offset-2 break-all" target="_blank" rel="noopener noreferrer" {...props} />
  ),
  pre: ({ _node, children, ...props }) => {
    const codeChild = React.Children.toArray(children)[0];
    const lang = /language-(\w+)/.exec(codeChild?.props?.className || '')?.[1] || '';
    return (
      <div className="my-3 rounded-lg overflow-hidden border border-zinc-800 bg-zinc-950 text-zinc-100 shadow-sm">
        {lang && (
          <div className="px-4 py-1.5 bg-zinc-900 border-b border-zinc-800 text-[11px] font-mono text-zinc-400 uppercase tracking-wider select-none">
            {lang}
          </div>
        )}
        <pre className="p-4 overflow-x-auto font-mono text-xs leading-relaxed" {...props}>
          <InPreContext.Provider value={true}>
            {children}
          </InPreContext.Provider>
        </pre>
      </div>
    );
  },
  code: ({ _node, className, children, ...props }) => {
    return (
      <InPreContext.Consumer>
        {(isInPre) => {
          if (isInPre) {
            return (
              <code className="font-mono text-xs text-zinc-100" {...props}>
                {children}
              </code>
            );
          }
          return (
            <code className="bg-zinc-100 text-zinc-800 text-[12px] font-mono px-1.5 py-0.5 rounded border border-zinc-200 font-medium break-all" {...props}>
              {children}
            </code>
          );
        }}
      </InPreContext.Consumer>
    );
  }
};

export default function Playground() {
  const [virtualKey, setVirtualKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [model, setModel] = useState('gemini-3.5-flash');
  const [prompt, setPrompt] = useState('Explain Node.js in simple words');
  const [temperature, setTemperature] = useState(0.7);
  const [maxTokens, setMaxTokens] = useState(1000);

  const [isLoading, setIsLoading] = useState(false);
  const [responseResult, setResponseResult] = useState(null);
  const [errorResult, setErrorResult] = useState(null);
  const [viewTab, setViewTab] = useState('formatted');
  const [hasCopied, setHasCopied] = useState(false);

  const handleRun = async (e) => {
    if (e) e.preventDefault();
    if (!virtualKey.trim()) {
      setErrorResult({
        status: 401,
        type: 'authentication_error',
        message: 'Virtual API key is required. Enter your key starting with gw_live_'
      });
      return;
    }
    if (!prompt.trim()) {
      setErrorResult({
        status: 400,
        type: 'invalid_request_error',
        message: 'Prompt content cannot be empty'
      });
      return;
    }

    setIsLoading(true);
    setErrorResult(null);
    setResponseResult(null);
    setHasCopied(false);

    try {
      const result = await gatewayService.chatCompletion({
        virtualKey: virtualKey.trim(),
        model,
        messages: [{ role: 'user', content: prompt.trim() }],
        temperature,
        maxTokens
      });
      setResponseResult(result);
    } catch (err) {
      setErrorResult(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      handleRun();
    }
  };

  const assistantMessage = responseResult?.choices?.[0]?.message?.content || '';
  const usageStats = responseResult?.usage || {};
  const durationMs = responseResult?._clientDurationMs || 0;

  const handleCopy = () => {
    const textToCopy = viewTab === 'formatted' 
      ? assistantMessage 
      : JSON.stringify(responseResult, null, 2);
    
    if (textToCopy) {
      navigator.clipboard.writeText(textToCopy);
      setHasCopied(true);
      setTimeout(() => setHasCopied(false), 2000);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-zinc-950 tracking-tight">API Playground</h2>
        <p className="text-sm text-zinc-500 mt-0.5">
          Execute real-time chat completions through the <code className="font-mono bg-zinc-100 px-1 py-0.5 rounded text-[11px]">POST /v1/chat/completions</code> gateway proxy.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-5 bg-white border border-zinc-200 rounded-lg p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
            <span className="text-xs font-bold text-zinc-900 uppercase tracking-wider flex items-center space-x-1.5">
              <Terminal size={14} />
              <span>Request Configuration</span>
            </span>
            <Link
              to="/keys"
              className="text-[11px] text-zinc-500 hover:text-black hover:underline"
            >
              Get Virtual Key →
            </Link>
          </div>

          <form onSubmit={handleRun} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-zinc-700 mb-1">
                Virtual API Key (Authorization Header)
              </label>
              <div className="relative">
                <input
                  type={showKey ? 'text' : 'password'}
                  value={virtualKey}
                  onChange={(e) => setVirtualKey(e.target.value)}
                  placeholder="gw_live_xxxxxxxxxxxxxxxxxxxxxxxx"
                  className="w-full px-3 py-2 pr-9 bg-white border border-zinc-300 rounded-md text-xs font-mono text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-black focus:border-black transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowKey(!showKey)}
                  className="absolute right-2.5 top-2 text-zinc-400 hover:text-zinc-600"
                  tabIndex={-1}
                >
                  {showKey ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
              <span className="text-[10px] text-zinc-400 mt-1 block">
                Dispatched as <code className="font-mono">Authorization: Bearer gw_live_*</code>
              </span>
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-700 mb-1">
                LLM Model
              </label>
              <select
                value={model}
                onChange={(e) => setModel(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-zinc-300 rounded-md text-xs text-zinc-900 focus:outline-none focus:ring-1 focus:ring-black focus:border-black cursor-pointer font-mono"
              >
                {PRESET_MODELS.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.id} — {m.tag}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block text-[11px] font-medium text-zinc-700 mb-1">
                  Temperature ({temperature})
                </label>
                <input
                  type="range"
                  min="0"
                  max="2"
                  step="0.1"
                  value={temperature}
                  onChange={(e) => setTemperature(parseFloat(e.target.value))}
                  className="w-full accent-black cursor-pointer"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-zinc-700 mb-1">
                  Max Output Tokens
                </label>
                <input
                  type="number"
                  min="1"
                  max="8192"
                  value={maxTokens}
                  onChange={(e) => setMaxTokens(parseInt(e.target.value, 10) || 1000)}
                  className="w-full px-2.5 py-1.5 border border-zinc-300 rounded text-xs font-mono text-zinc-900 focus:outline-none focus:ring-1 focus:ring-black"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-medium text-zinc-700">
                  User Prompt
                </label>
                <span className="text-[10px] text-zinc-400 font-mono">
                  ⌘+Enter to run
                </span>
              </div>
              <textarea
                rows={5}
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask anything..."
                className="w-full p-3 bg-white border border-zinc-300 rounded-md text-xs font-sans text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-black focus:border-black transition-all resize-y"
              />
            </div>

            <div>
              <span className="text-[10px] text-zinc-400 uppercase tracking-wider block mb-1.5 font-medium">
                Try Sample Prompts:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {SAMPLE_PROMPTS.map((p, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setPrompt(p)}
                    className="text-[11px] px-2 py-1 bg-zinc-50 border border-zinc-200 rounded text-zinc-600 hover:text-black hover:border-zinc-400 transition-colors text-left"
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 bg-zinc-900 hover:bg-black text-white text-xs font-semibold rounded-md transition-colors flex items-center justify-center space-x-2 disabled:opacity-50 shadow-sm"
              >
                {isLoading ? (
                  <>
                    <RefreshCw size={14} className="animate-spin" />
                    <span>Streaming / Proxying...</span>
                  </>
                ) : (
                  <>
                    <Send size={14} />
                    <span>Run Completion</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        <div className="lg:col-span-7 space-y-4">
          <div className="bg-white border border-zinc-200 rounded-lg shadow-xs overflow-hidden min-h-[460px] flex flex-col">
            <div className="p-3.5 bg-zinc-50 border-b border-zinc-200 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setViewTab('formatted')}
                  className={`px-2.5 py-1 text-xs font-medium rounded transition-colors ${
                    viewTab === 'formatted'
                      ? 'bg-white text-zinc-900 shadow-xs border border-zinc-200'
                      : 'text-zinc-500 hover:text-black'
                  }`}
                >
                  Formatted Output
                </button>
                <button
                  onClick={() => setViewTab('raw')}
                  className={`px-2.5 py-1 text-xs font-medium rounded transition-colors ${
                    viewTab === 'raw'
                      ? 'bg-white text-zinc-900 shadow-xs border border-zinc-200'
                      : 'text-zinc-500 hover:text-black'
                  }`}
                >
                  Raw JSON
                </button>
              </div>

              {(responseResult || assistantMessage) && (
                <button
                  onClick={handleCopy}
                  className="inline-flex items-center space-x-1 px-2.5 py-1 text-xs text-zinc-600 hover:text-black hover:bg-zinc-200/50 rounded transition-colors"
                >
                  {hasCopied ? (
                    <>
                      <Check size={13} className="text-emerald-600" />
                      <span className="text-[11px] font-medium text-emerald-700">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy size={13} />
                      <span className="text-[11px]">Copy</span>
                    </>
                  )}
                </button>
              )}
            </div>

            {responseResult && (
              <div className="px-4 py-2 bg-zinc-100/60 border-b border-zinc-200/80 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] font-mono text-zinc-600">
                <span className="flex items-center space-x-1 text-emerald-700 font-semibold">
                  <CheckCircle2 size={13} />
                  <span>200 OK</span>
                </span>
                <span>Latency: <strong className="text-zinc-900">{durationMs}ms</strong></span>
                <span>Prompt: <strong className="text-zinc-900">{usageStats.prompt_tokens || 0}</strong></span>
                <span>Completion: <strong className="text-zinc-900">{usageStats.completion_tokens || 0}</strong></span>
                <span>Total: <strong className="text-zinc-900">{usageStats.total_tokens || 0}</strong> tokens</span>
              </div>
            )}

            <div className="p-6 flex-1 overflow-y-auto">
              {isLoading ? (
                <div className="h-full flex flex-col items-center justify-center py-16 text-zinc-400">
                  <RefreshCw size={28} className="animate-spin text-zinc-600 mb-3" />
                  <span className="text-xs font-medium text-zinc-700">Invoking Google Gemini through Gateway...</span>
                  <span className="text-[11px] text-zinc-400 mt-1 font-mono">Atomically reserving quota & awaiting usage log</span>
                </div>
              ) : errorResult ? (
                <div className="p-4 bg-red-50 border border-red-200 rounded-md text-red-800 space-y-2">
                  <div className="flex items-center space-x-2 font-semibold text-xs text-red-900">
                    <XCircle size={16} />
                    <span>HTTP {errorResult.status} {errorResult.type || 'Error'}</span>
                  </div>
                  <p className="text-xs font-mono">{errorResult.message}</p>
                  {errorResult.details && (
                    <pre className="text-[10px] bg-red-100/60 p-2 rounded overflow-x-auto font-mono mt-2">
                      {JSON.stringify(errorResult.details, null, 2)}
                    </pre>
                  )}
                </div>
              ) : responseResult ? (
                viewTab === 'formatted' ? (
                  <div className="max-w-none text-zinc-900 font-sans">
                    <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
                      {assistantMessage}
                    </ReactMarkdown>
                  </div>
                ) : (
                  <pre className="text-[11px] font-mono bg-zinc-900 text-zinc-100 p-4 rounded-md overflow-x-auto">
                    {JSON.stringify(responseResult, null, 2)}
                  </pre>
                )
              ) : (
                <div className="h-full flex flex-col items-center justify-center py-20 text-center text-zinc-400">
                  <Sparkles size={32} className="text-zinc-300 mb-2" />
                  <span className="text-xs font-medium text-zinc-600">No response generated yet</span>
                  <p className="text-[11px] text-zinc-400 max-w-xs mt-1">
                    Enter a virtual API key and prompt on the left, then click <strong>Run Completion</strong> to test the gateway proxy.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
