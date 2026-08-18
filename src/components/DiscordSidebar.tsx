import React from 'react';
import { DiscordServer } from '../types';
import { Bot, Compass, Plus, Sparkles, Terminal, Code2 } from 'lucide-react';

interface DiscordSidebarProps {
  servers: DiscordServer[];
  activeServerId: string;
  onSelectServer: (id: string) => void;
  onOpenControlPanel: () => void;
  onOpenExportModal: () => void;
  onToggleConsole: () => void;
  isConsoleOpen: boolean;
  isBotLive: boolean;
}

export const DiscordSidebar: React.FC<DiscordSidebarProps> = ({
  servers,
  activeServerId,
  onSelectServer,
  onOpenControlPanel,
  onOpenExportModal,
  onToggleConsole,
  isConsoleOpen,
  isBotLive,
}) => {
  return (
    <nav
      aria-label="Discord Servers and Navigation"
      className="flex flex-col items-center py-2 sm:py-3 w-14 sm:w-[72px] bg-[#1E1F22] shrink-0 select-none gap-2 z-20 border-r border-[#111214]"
    >
      {/* Top Bot / Direct Home Icon */}
      <div className="relative group">
        <div
          className={`absolute left-0 top-1/2 -translate-y-1/2 w-1 bg-white rounded-r-full transition-all duration-200 ${
            !activeServerId && isBotLive ? 'h-8 sm:h-10' : 'h-0 group-hover:h-4'
          }`}
        />
        <button
          id="btn-warper-home"
          onClick={onOpenControlPanel}
          className={`w-10 h-10 sm:w-12 sm:h-12 rounded-[20px] sm:rounded-[24px] group-hover:rounded-[14px] sm:group-hover:rounded-[16px] transition-all duration-200 flex items-center justify-center cursor-pointer relative shadow-md ${
            isBotLive
              ? 'bg-[#5865F2] text-white'
              : 'bg-[#313338] text-[#DBDEE1] hover:bg-[#5865F2] hover:text-white'
          }`}
          title={isBotLive ? 'WARPER Gateway Active (Klik untuk Pengaturan Bot)' : 'Hubungkan Bot Discord'}
        >
          <Bot className="w-5 h-5 sm:w-7 sm:h-7" />
          {isBotLive && (
            <span
              className="absolute -top-0.5 -right-0.5 sm:-top-1 sm:-right-1 flex h-3 w-3 sm:h-3.5 sm:w-3.5"
              title="Live Discord Bot Active"
            >
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#57F287] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 sm:h-3.5 sm:w-3.5 bg-[#23A55A] border-2 border-[#1E1F22]"></span>
            </span>
          )}
        </button>
      </div>

      <div className="w-6 sm:w-8 h-[2px] bg-[#35363C] rounded my-1" />

      {/* Real Live Discord Servers List */}
      <div className="flex flex-col gap-2 overflow-y-auto no-scrollbar max-h-[calc(100vh-280px)]">
        {servers.map((server) => {
          const isActive = activeServerId === server.id;
          const isUrlIcon = server.icon && (server.icon.startsWith('http') || server.icon.startsWith('/'));
          return (
            <div key={server.id} className="relative group">
              <div
                className={`absolute left-0 top-1/2 -translate-y-1/2 w-1 bg-white rounded-r-full transition-all duration-200 ${
                  isActive ? 'h-8 sm:h-10' : 'h-0 group-hover:h-4'
                }`}
              />
              <button
                id={`server-btn-${server.id}`}
                onClick={() => onSelectServer(server.id)}
                className={`w-10 h-10 sm:w-12 sm:h-12 rounded-[20px] sm:rounded-[24px] group-hover:rounded-[14px] sm:group-hover:rounded-[16px] transition-all duration-200 flex items-center justify-center cursor-pointer text-xs sm:text-base font-bold shadow-sm relative overflow-hidden ${
                  isActive
                    ? 'bg-[#5865F2] text-white rounded-[14px] sm:rounded-[16px]'
                    : 'bg-[#313338] text-[#DBDEE1] hover:bg-[#5865F2] hover:text-white'
                }`}
                title={server.name + (server.isLiveDiscord ? ' (Server Discord Live)' : '')}
              >
                {isUrlIcon ? (
                  <img
                    src={server.icon}
                    alt={server.name}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <span>{server.icon || server.name.substring(0, 2).toUpperCase()}</span>
                )}

                {server.isLiveDiscord && (
                  <span
                    className="absolute bottom-0 right-0 w-2.5 h-2.5 sm:w-3 sm:h-3 bg-[#23A55A] border-2 border-[#1E1F22] rounded-full"
                    title="Real Discord Server"
                  />
                )}
              </button>
            </div>
          );
        })}

        {servers.length === 0 && (
          <div className="relative group">
            <button
              onClick={onOpenControlPanel}
              className="w-10 h-10 sm:w-12 sm:h-12 rounded-[20px] sm:rounded-[24px] hover:rounded-[14px] sm:hover:rounded-[16px] bg-[#313338] text-[#57F287] hover:bg-[#23A55A] hover:text-white transition-all duration-200 flex items-center justify-center cursor-pointer shadow-sm border border-dashed border-[#57F287]/40 animate-pulse"
              title="Isi Token Bot untuk memuat server Discord Anda"
            >
              <Plus className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
          </div>
        )}
      </div>

      {/* Add / Explore Guild Mock Buttons */}
      <div className="flex flex-col gap-2 mt-auto">
        <button
          id="btn-bot-config"
          onClick={onOpenControlPanel}
          className="w-10 h-10 sm:w-12 sm:h-12 rounded-[20px] sm:rounded-[24px] hover:rounded-[14px] sm:hover:rounded-[16px] bg-[#313338] text-[#23A55A] hover:bg-[#23A55A] hover:text-white transition-all duration-200 flex items-center justify-center cursor-pointer shadow-sm group"
          title="Bot Control Panel & Settings"
        >
          <Sparkles className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>

        <button
          id="btn-code-export"
          onClick={onOpenExportModal}
          className="w-12 h-12 rounded-[24px] hover:rounded-[16px] bg-[#313338] text-[#00A8FC] hover:bg-[#00A8FC] hover:text-white transition-all duration-200 flex items-center justify-center cursor-pointer shadow-sm group"
          title="Export WARPER Bot Source Code (discord.js / python)"
        >
          <Code2 className="w-5 h-5" />
        </button>

        <button
          id="btn-live-console-toggle"
          onClick={onToggleConsole}
          className={`w-12 h-12 rounded-[24px] hover:rounded-[16px] transition-all duration-200 flex items-center justify-center cursor-pointer shadow-sm ${
            isConsoleOpen
              ? 'bg-[#FEE75C] text-[#1E1F22] rounded-[16px]'
              : 'bg-[#313338] text-[#B5BAC1] hover:bg-[#FEE75C] hover:text-[#1E1F22]'
          }`}
          title="Toggle Gateway & AI Console"
        >
          <Terminal className="w-5 h-5" />
        </button>
      </div>
    </nav>
  );
};
