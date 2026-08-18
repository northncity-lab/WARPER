import React from 'react';
import { ConsoleLog } from '../types';
import { Terminal, Trash2, X, AlertCircle, CheckCircle, Info, Sparkles, ChevronDown } from 'lucide-react';

interface LiveConsoleDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  logs: ConsoleLog[];
  onClearLogs: () => void;
}

export const LiveConsoleDrawer: React.FC<LiveConsoleDrawerProps> = ({
  isOpen,
  onClose,
  logs,
  onClearLogs,
}) => {
  if (!isOpen) return null;

  const getLogBadge = (level: ConsoleLog['level']) => {
    switch (level) {
      case 'ai':
        return <span className="text-[#00F0FF] font-bold flex items-center gap-1"><Sparkles className="w-3 h-3" />[GEMINI 3.7]</span>;
      case 'success':
        return <span className="text-[#57F287] font-bold flex items-center gap-1"><CheckCircle className="w-3 h-3" />[SUCCESS]</span>;
      case 'warn':
        return <span className="text-[#FEE75C] font-bold flex items-center gap-1"><AlertCircle className="w-3 h-3" />[WARN]</span>;
      case 'error':
        return <span className="text-[#ED4245] font-bold flex items-center gap-1"><AlertCircle className="w-3 h-3" />[ERROR]</span>;
      default:
        return <span className="text-[#5865F2] font-bold flex items-center gap-1"><Info className="w-3 h-3" />[GATEWAY]</span>;
    }
  };

  return (
    <div className="border-t border-[#202225] bg-[#1E1F22] shadow-2xl flex flex-col h-56 transition-all duration-200 z-30">
      {/* Drawer Header */}
      <div className="px-4 py-2 bg-[#2B2D31] border-b border-[#202225] flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs font-mono font-bold text-white">
          <Terminal className="w-4 h-4 text-[#57F287]" />
          <span>WARPER Real-Time Gateway & AI Logs</span>
          <span className="bg-[#1E1F22] text-[#949BA4] px-1.5 py-0.2 rounded text-[10px]">
            {logs.length} events
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onClearLogs}
            className="p-1 hover:bg-[#35373C] text-[#949BA4] hover:text-white rounded text-xs flex items-center gap-1 cursor-pointer transition-colors"
            title="Clear Console"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span className="text-[11px]">Clear</span>
          </button>
          <button
            onClick={onClose}
            className="p-1 hover:bg-[#35373C] text-[#949BA4] hover:text-white rounded cursor-pointer transition-colors"
            title="Close Console"
          >
            <ChevronDown className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Logs Viewport */}
      <div className="flex-1 p-3 overflow-y-auto font-mono text-xs space-y-1.5 no-scrollbar bg-[#111214]">
        {logs.length === 0 ? (
          <div className="text-[#80848E] italic">Menunggu aktivitas gateway dan command...</div>
        ) : (
          logs.map((log) => (
            <div key={log.id} className="flex items-start gap-2 leading-relaxed">
              <span className="text-[#80848E] shrink-0">{log.timestamp}</span>
              <span className="shrink-0">{getLogBadge(log.level)}</span>
              <span className="text-[#DBDEE1] break-all">{log.message}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
