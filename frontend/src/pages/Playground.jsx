import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { gatewayService } from '../services/gatewayService';
import { 
  Send, 
  Copy, 
  Check, 
  KeyRound, 
  Clock, 
  Cpu, 
  CheckCircle2, 
  XCircle, 
  Sparkles, 
  Eye, 
  EyeOff, 
  SlidersHorizontal,
  Info,
  Loader2
} from 'lucide-react';

const PRESET_MODELS = [
  { id: 'gemini-3.5-flash', name: 'Gemini 3.5 Flash', tag: 'Fast & Recommended' },
  { id: 'gemini-flash-lite-latest', name: 'Gemini Flash Lite', tag: 'Lowest Latency' },
  { id: 'gemini-3.8-flash', name: 'Gemini 3.8 Flash', tag: 'Latest Generation' },
  { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash', tag: 'Standard' },
];

const SAMPLE_PROMPTS = [
  'Explain Node.js in simple words',
  'Write a JavaScript function to check for balanced brackets',
  'What is the difference between MongoDB and PostgreSQL?',
  'Explain the concept of Virtual API Keys in an LLM Gateway'
];

const InPreContext = React.createContext(false);

function MarkdownCodeBlock({ children, ...props }) {
  const [copied, setCopied] = useState(false);
  const codeChild = React.Children.toArray(children)[0];
  const lang = /language-(\w+)/.exec(codeChild?.props?.className || '')?.[1] || '';
  const rawCode = codeChild?.props?.children ? String(codeChild.props.children).replace(/\n$/, '') : '';

  const handleCopyCode = () => {
    if (rawCode) {
      navigator.clipboard.writeText(rawCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="my-4 rounded-xl overflow-hidden border border-zinc-800 bg-zinc-950 text-zinc-100 shadow-md">
      <div className="px-4 py-2 bg-zinc-900/90 border-b border-zinc-800/80 flex items-center justify-between text-[11px] font-mono text-zinc-400 select-none">
        <span className="uppercase tracking-wider font-semibold text-zinc-300">
          {lang || 'code'}
        </span>
        <button
          type="button"
          onClick={handleCopyCode}
          className="inline-flex items-center space-x-1.5 text-zinc-400 hover:text-zinc-100 transition-colors px-2 py-0.5 rounded hover:bg-zinc-800 cursor-pointer"
          title="Copy code snippet"
        >
          {copied ? (
            <>
              <Check size={12} className="text-emerald-400" />
              <span className="text-[11px] text-emerald-400 font-medium">Copied</span>
            </>
          ) : (
            <>
              <Copy size={12} />
              <span className="text-[11px]">Copy</span>
            </>
          )}
        </button>
      </div>
      <pre className="p-4 overflow-x-auto font-mono text-xs leading-relaxed text-zinc-100 selection:bg-zinc-700" {...props}>
        <InPreContext.Provider value={true}>
          {children}
        </InPreContext.Provider>
      </pre>
    </div>
  );
}

const markdownComponents = {
  h1: ({ node: _node, ...props }) => (
    <h1 className="text-xl font-bold text-zinc-900 mt-6 mb-3 pb-2 border-b border-zinc-200/80 tracking-tight" {...props} />
  ),
  h2: ({ node: _node, ...props }) => (
    <h2 className="text-lg font-bold text-zinc-900 mt-5 mb-2.5 pb-1 border-b border-zinc-100 tracking-tight" {...props} />
  ),
  h3: ({ node: _node, ...props }) => (
    <h3 className="text-base font-semibold text-zinc-900 mt-4 mb-2 tracking-tight" {...props} />
  ),
  h4: ({ node: _node, ...props }) => (
    <h4 className="text-sm font-semibold text-zinc-900 mt-3 mb-1.5" {...props} />
  ),
  p: ({ node: _node, ...props }) => (
    <p className="mb-3.5 text-sm leading-relaxed text-zinc-800 last:mb-0 break-words" {...props} />
  ),
  strong: ({ node: _node, ...props }) => (
    <strong className="font-semibold text-zinc-950" {...props} />
  ),
  em: ({ node: _node, ...props }) => (
    <em className="italic text-zinc-800" {...props} />
  ),
  ul: ({ node: _node, ...props }) => (
    <ul className="list-disc list-outside pl-5 mb-3.5 space-y-1.5 text-sm text-zinc-800 marker:text-zinc-400" {...props} />
  ),
  ol: ({ node: _node, ...props }) => (
    <ol className="list-decimal list-outside pl-5 mb-3.5 space-y-1.5 text-sm text-zinc-800 marker:text-zinc-500 font-normal" {...props} />
  ),
  li: ({ node: _node, ...props }) => (
    <li className="leading-relaxed pl-1" {...props} />
  ),
  blockquote: ({ node: _node, ...props }) => (
    <blockquote className="border-l-4 border-zinc-300 pl-4 py-1.5 my-3.5 bg-zinc-50/80 rounded-r text-sm text-zinc-700 italic" {...props} />
  ),
  hr: ({ node: _node, ...props }) => (
    <hr className="my-6 border-zinc-200" {...props} />
  ),
  table: ({ node: _node, ...props }) => (
    <div className="my-4 overflow-x-auto border border-zinc-200 rounded-lg shadow-xs">
      <table className="min-w-full divide-y divide-zinc-200 text-xs text-left" {...props} />
    </div>
  ),
  thead: ({ node: _node, ...props }) => (
    <thead className="bg-zinc-50 font-semibold text-zinc-800 border-b border-zinc-200" {...props} />
  ),
  tbody: ({ node: _node, ...props }) => (
    <tbody className="divide-y divide-zinc-100 bg-white" {...props} />
  ),
  tr: ({ node: _node, ...props }) => (
    <tr className="hover:bg-zinc-50/60 transition-colors" {...props} />
  ),
  th: ({ node: _node, ...props }) => (
    <th className="px-3.5 py-2.5 text-zinc-700 font-medium whitespace-nowrap" {...props} />
  ),
  td: ({ node: _node, ...props }) => (
    <td className="px-3.5 py-2.5 text-zinc-700" {...props} />
  ),
  a: ({ node: _node, ...props }) => (
    <a className="text-zinc-900 font-medium underline underline-offset-4 decoration-zinc-300 hover:decoration-zinc-900 transition-colors break-all" target="_blank" rel="noopener noreferrer" {...props} />
  ),
  pre: (props) => <MarkdownCodeBlock {...props} />,
  code: ({ node: _node, className, children, ...props }) => {
    return (
      <InPreContext.Consumer>
        {(isInPre) => {
          if (isInPre) {
            return (
              <code className={`${className || ''} font-mono text-xs text-zinc-100`} {...props}>
                {children}
              </code>
            );
          }
          return (
            <code className="bg-zinc-100 text-zinc-850 text-[12px] font-mono px-1.5 py-0.5 rounded border border-zinc-200/80 font-medium break-all" {...props}>
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
        message: 'Virtual API key is required. Enter your virtual key starting with gw_live_'
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

  const assistantMessage = responseResult?.choices?.[0]?.message?.content || responseResult?.choices?.[0]?.text || '';
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
      {/* Top Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-1 border-b border-zinc-200/60">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-xl font-bold text-zinc-950 tracking-tight">API Playground</h1>
            <span className="text-[11px] font-mono font-medium px-2 py-0.5 bg-zinc-100 text-zinc-600 rounded border border-zinc-200/80">
              POST /v1/chat/completions
            </span>
          </div>
          <p className="text-xs text-zinc-500 mt-1">
            Test virtual API keys, models, and real-time completions against the OpenAI-compatible gateway proxy.
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Link
            to="/keys"
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 text-xs font-medium text-zinc-700 hover:text-zinc-950 bg-white hover:bg-zinc-50 border border-zinc-200 rounded-lg shadow-xs transition-colors"
          >
            <KeyRound size={13} className="text-zinc-500" />
            <span>Manage Virtual Keys</span>
          </Link>
        </div>
      </div>

      {/* Main 2-Column Responsive Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Request Configuration Panel */}
        <div className="lg:col-span-5 bg-white border border-zinc-200/80 rounded-xl shadow-xs overflow-hidden">
          <div className="px-5 py-3.5 bg-zinc-50/70 border-b border-zinc-200/80 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <SlidersHorizontal size={14} className="text-zinc-700" />
              <span className="text-xs font-semibold text-zinc-900 tracking-wide uppercase">
                Request Configuration
              </span>
            </div>
            <Link
              to="/keys"
              className="text-[11px] font-medium text-zinc-500 hover:text-zinc-900 transition-colors"
            >
              Get Virtual Key →
            </Link>
          </div>

          <form onSubmit={handleRun} className="p-5 space-y-4">
            {/* Virtual API Key */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-zinc-900">
                  Virtual API Key
                </label>
                <span className="text-[10px] text-zinc-400 font-mono">
                  Bearer Token
                </span>
              </div>
              <div className="relative">
                <div className="absolute left-3 top-2.5 text-zinc-400 pointer-events-none">
                  <KeyRound size={15} />
                </div>
                <input
                  type={showKey ? 'text' : 'password'}
                  value={virtualKey}
                  onChange={(e) => setVirtualKey(e.target.value)}
                  disabled={isLoading}
                  placeholder="gw_live_xxxxxxxxxxxxxxxxxxxxxxxx"
                  className="w-full pl-9 pr-9 py-2 bg-white border border-zinc-300 rounded-lg text-xs font-mono text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-900 transition-all disabled:bg-zinc-50 disabled:text-zinc-400"
                />
                <button
                  type="button"
                  onClick={() => setShowKey(!showKey)}
                  className="absolute right-2.5 top-2.5 text-zinc-400 hover:text-zinc-700 transition-colors cursor-pointer"
                  tabIndex={-1}
                  title={showKey ? 'Hide virtual key' : 'Show virtual key'}
                >
                  {showKey ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
              <span className="text-[10px] text-zinc-400 mt-1.5 block">
                Dispatched as <code className="font-mono bg-zinc-100 px-1 py-0.5 rounded text-zinc-600">Authorization: Bearer gw_live_*</code>
              </span>
            </div>

            {/* Model Selection */}
            <div>
              <label className="block text-xs font-semibold text-zinc-900 mb-1.5">
                Model
              </label>
              <select
                value={model}
                onChange={(e) => setModel(e.target.value)}
                disabled={isLoading}
                className="w-full px-3 py-2 bg-white border border-zinc-300 rounded-lg text-xs text-zinc-900 font-mono focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-900 cursor-pointer disabled:bg-zinc-50 transition-all"
              >
                {PRESET_MODELS.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} ({m.id}) — {m.tag}
                  </option>
                ))}
              </select>
            </div>

            {/* Temperature & Max Output Tokens */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-zinc-900">
                    Temperature
                  </label>
                  <span className="font-mono text-xs px-2 py-0.5 bg-zinc-100 text-zinc-800 rounded font-semibold border border-zinc-200">
                    {temperature}
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="2"
                  step="0.1"
                  value={temperature}
                  onChange={(e) => setTemperature(parseFloat(e.target.value))}
                  disabled={isLoading}
                  className="w-full accent-zinc-900 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-zinc-400 mt-1 font-mono">
                  <span>0.0 (Deterministic)</span>
                  <span>2.0 (Creative)</span>
                </div>
              </div>

              <div>
                <div className="flex items-center space-x-1.5 mb-1.5">
                  <label className="text-xs font-semibold text-zinc-900">
                    Max Output Tokens
                  </label>
                  <div className="relative group flex items-center">
                    <Info size={13} className="text-zinc-400 hover:text-zinc-600 cursor-help" />
                    <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-1.5 hidden group-hover:flex flex-col items-center z-30 pointer-events-none">
                      <div className="bg-zinc-900 text-white text-[11px] rounded-md px-2.5 py-1.5 w-48 text-center shadow-lg leading-tight">
                        Controls the maximum generated response length for the assistant.
                      </div>
                      <div className="w-2 h-2 bg-zinc-900 rotate-45 -mt-1" />
                    </div>
                  </div>
                </div>
                <input
                  type="number"
                  min="1"
                  max="8192"
                  value={maxTokens}
                  onChange={(e) => setMaxTokens(parseInt(e.target.value, 10) || 1000)}
                  disabled={isLoading}
                  className="w-full px-3 py-2 border border-zinc-300 rounded-lg text-xs font-mono text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-900 disabled:bg-zinc-50 transition-all"
                />
                <span className="text-[10px] text-zinc-400 mt-1 block font-mono">
                  Range: 1 – 8,192 tokens
                </span>
              </div>
            </div>

            {/* User Prompt */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-zinc-900">
                  User Prompt
                </label>
                <span className="text-[10px] text-zinc-400 font-mono">
                  ⌘ + Enter to execute
                </span>
              </div>
              <textarea
                rows={5}
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={isLoading}
                placeholder="Ask anything or enter an instruction..."
                className="w-full p-3.5 bg-white border border-zinc-300 rounded-lg text-sm font-sans text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-900 transition-all resize-y min-h-[130px] leading-relaxed disabled:bg-zinc-50"
              />
            </div>

            {/* Quick Sample Prompts */}
            <div>
              <span className="text-[11px] text-zinc-500 font-medium block mb-2">
                Quick Sample Prompts:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {SAMPLE_PROMPTS.map((p, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setPrompt(p)}
                    disabled={isLoading}
                    className="text-[11px] px-2.5 py-1 bg-zinc-50 hover:bg-zinc-100 border border-zinc-200 rounded-md text-zinc-700 hover:text-zinc-900 transition-colors text-left cursor-pointer disabled:opacity-50"
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            {/* Run Completion Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 px-4 bg-zinc-900 hover:bg-black text-white text-xs font-semibold rounded-lg transition-all flex items-center justify-center space-x-2 disabled:opacity-50 shadow-sm cursor-pointer active:scale-[0.99]"
              >
                {isLoading ? (
                  <>
                    <Loader2 size={15} className="animate-spin text-zinc-300" />
                    <span>Generating response...</span>
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

        {/* Right Column: Response Panel */}
        <div className="lg:col-span-7 bg-white border border-zinc-200/80 rounded-xl shadow-xs overflow-hidden flex flex-col min-h-[580px]">
          {/* Header Bar with Tabs and Copy Button */}
          <div className="p-3.5 bg-zinc-50/80 border-b border-zinc-200/80 flex items-center justify-between">
            <div className="inline-flex items-center p-0.5 bg-zinc-200/60 rounded-lg border border-zinc-200/80">
              <button
                type="button"
                onClick={() => setViewTab('formatted')}
                className={`px-3 py-1.5 text-xs rounded-md transition-all cursor-pointer ${
                  viewTab === 'formatted'
                    ? 'bg-white text-zinc-900 shadow-xs font-semibold'
                    : 'text-zinc-600 hover:text-zinc-900 font-medium'
                }`}
              >
                Formatted Output
              </button>
              <button
                type="button"
                onClick={() => setViewTab('raw')}
                className={`px-3 py-1.5 text-xs rounded-md transition-all cursor-pointer ${
                  viewTab === 'raw'
                    ? 'bg-white text-zinc-900 shadow-xs font-semibold'
                    : 'text-zinc-600 hover:text-zinc-900 font-medium'
                }`}
              >
                Raw JSON
              </button>
            </div>

            {(responseResult || assistantMessage) && (
              <button
                type="button"
                onClick={handleCopy}
                className="inline-flex items-center space-x-1.5 px-3 py-1.5 text-xs font-medium text-zinc-700 hover:text-zinc-900 bg-white hover:bg-zinc-100 border border-zinc-200 rounded-lg shadow-xs transition-colors cursor-pointer"
                title="Copy entire response"
              >
                {hasCopied ? (
                  <>
                    <Check size={13} className="text-emerald-600" />
                    <span className="text-emerald-700 font-medium">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy size={13} />
                    <span>Copy Response</span>
                  </>
                )}
              </button>
            )}
          </div>

          {/* Response Statistics Bar */}
          {responseResult && (
            <div className="px-5 py-2.5 bg-zinc-50/50 border-b border-zinc-200/70 flex flex-wrap items-center gap-x-5 gap-y-1.5 text-xs font-mono text-zinc-600">
              <span className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200/80 rounded-md font-semibold text-[11px]">
                <CheckCircle2 size={13} />
                <span>200 OK</span>
              </span>
              <span className="flex items-center space-x-1">
                <Clock size={12} className="text-zinc-400" />
                <span>Latency: <strong className="text-zinc-900 font-semibold">{durationMs}ms</strong></span>
              </span>
              <span>Prompt: <strong className="text-zinc-900 font-semibold">{usageStats.prompt_tokens ?? 0}</strong></span>
              <span>Completion: <strong className="text-zinc-900 font-semibold">{usageStats.completion_tokens ?? 0}</strong></span>
              <span className="flex items-center space-x-1">
                <Cpu size={12} className="text-zinc-400" />
                <span>Total: <strong className="text-zinc-900 font-semibold">{usageStats.total_tokens ?? 0}</strong> tokens</span>
              </span>
            </div>
          )}

          {/* Response Content View */}
          <div className="p-6 flex-1 overflow-y-auto">
            {isLoading ? (
              <div className="h-full flex flex-col items-center justify-center py-20 text-center px-4">
                <div className="w-12 h-12 rounded-xl bg-zinc-100 border border-zinc-200/80 flex items-center justify-center text-zinc-800 mb-3.5 shadow-xs">
                  <Loader2 size={24} className="animate-spin text-zinc-700" />
                </div>
                <h3 className="text-sm font-semibold text-zinc-900">
                  Generating response...
                </h3>
                <p className="text-xs text-zinc-500 max-w-xs mt-1.5 leading-relaxed">
                  Streaming through Gateway proxy & logging token quota.
                </p>
              </div>
            ) : errorResult ? (
              <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-900 space-y-2.5">
                <div className="flex items-center space-x-2 font-semibold text-xs text-rose-800">
                  <XCircle size={16} className="text-rose-600 shrink-0" />
                  <span>HTTP {errorResult.status} {errorResult.type ? `(${errorResult.type})` : 'Error'}</span>
                </div>
                <p className="text-xs font-mono leading-relaxed bg-rose-100/50 p-2.5 rounded-lg border border-rose-200/60 text-rose-900">
                  {errorResult.message}
                </p>
                {errorResult.details && (
                  <div className="pt-1">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-rose-700 block mb-1">
                      Error Details:
                    </span>
                    <pre className="text-[11px] bg-rose-100/70 p-3 rounded-lg overflow-x-auto font-mono text-rose-950 border border-rose-200/60">
                      {JSON.stringify(errorResult.details, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            ) : responseResult ? (
              viewTab === 'formatted' ? (
                <div className="max-w-none text-zinc-900 font-sans">
                  {assistantMessage ? (
                    <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
                      {assistantMessage}
                    </ReactMarkdown>
                  ) : (
                    <div className="text-xs text-zinc-400 italic">
                      No text content returned in choice message. Switch to Raw JSON to inspect full payload.
                    </div>
                  )}
                </div>
              ) : (
                <div className="rounded-xl overflow-hidden border border-zinc-800 bg-zinc-950 text-zinc-100 shadow-sm">
                  <div className="px-4 py-2 bg-zinc-900/90 border-b border-zinc-800/80 flex items-center justify-between text-[11px] font-mono text-zinc-400 select-none">
                    <span className="uppercase tracking-wider font-semibold text-zinc-300">
                      application/json
                    </span>
                    <span className="text-[10px] text-zinc-500">
                      {JSON.stringify(responseResult).length} bytes
                    </span>
                  </div>
                  <pre className="p-4 overflow-x-auto font-mono text-xs leading-relaxed text-zinc-100 selection:bg-zinc-700">
                    {JSON.stringify(responseResult, null, 2)}
                  </pre>
                </div>
              )
            ) : (
              <div className="h-full flex flex-col items-center justify-center py-20 text-center px-4">
                <div className="w-12 h-12 rounded-xl bg-zinc-100 border border-zinc-200/80 flex items-center justify-center text-zinc-400 mb-3.5 shadow-xs">
                  <Sparkles size={22} className="text-zinc-500" />
                </div>
                <h3 className="text-sm font-semibold text-zinc-800">
                  Your AI response will appear here
                </h3>
                <p className="text-xs text-zinc-400 max-w-sm mt-1.5 leading-relaxed">
                  Configure your request parameters on the left, enter a prompt, and click <strong>Run Completion</strong> to execute a real-time request through the LLM Gateway.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
