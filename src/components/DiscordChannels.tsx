import React from 'react';
import { DiscordChannel, DiscordServer, DiscordUser } from '../types';
import { Hash, Volume2, Megaphone, ChevronDown, Settings, Mic, Headphones, Shield, Sparkles, Bot, X, PanelLeftClose } from 'lucide-react';

interface DiscordChannelsProps {
  server?: DiscordServer | null;
  activeChannelId: string;
  onSelectChannel: (channelId: string) => void;
  currentUser: DiscordUser;
  onOpenSettings: () => void;
  isBotLive: boolean;
  isOpen?: boolean;
  onClose?: () => void;
}

export const DiscordChannels: React.FC<DiscordChannelsProps> = ({
  server,
  activeChannelId,
  onSelectChannel,
  currentUser,
  onOpenSettings,
  isBotLive,
  isOpen = true,
  onClose,
}) => {
  const getChannelIcon = (type: DiscordChannel['type']) => {
    switch (type) {
      case 'voice':
        return <Volume2 className="w-4 h-4 text-[#949BA4]" />;
      case 'announcement':
        return <Megaphone className="w-4 h-4 text-[#949BA4]" />;
      default:
        return <Hash className="w-4 h-4 text-[#949BA4]" />;
    }
  };

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 bg-black/70 z-30 md:hidden backdrop-blur-xs transition-opacity"
          aria-hidden="true"
        />
      )}

      {/* Main Channels Sidebar / Drawer */}
      <div
        className={`bg-[#2B2D31] flex flex-col shrink-0 select-none border-r border-[#202225] transition-all duration-300 ease-in-out ${
          isOpen
            ? 'fixed md:relative inset-y-0 left-[72px] md:left-0 w-64 md:w-60 z-40 md:z-10 shadow-2xl md:shadow-none translate-x-0'
            : 'fixed md:relative inset-y-0 -translate-x-[350px] md:translate-x-0 w-0 md:w-0 overflow-hidden border-none opacity-0 md:opacity-100 pointer-events-none md:pointer-events-none'
        }`}
      >
        {/* Server Header */}
        {server ? (
          <div className="h-12 border-b border-[#202225] px-3 flex items-center justify-between shadow-[0_1px_2px_rgba(0,0,0,0.2)] hover:bg-[#35373C] transition-colors">
            <div className="flex items-center gap-2 font-bold text-white text-sm truncate flex-1 min-w-0">
              {server.icon && (server.icon.startsWith('http') || server.icon.startsWith('/')) ? (
                <img
                  src={server.icon}
                  alt={server.name}
                  className="w-5 h-5 rounded-full object-cover shrink-0"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <span className="shrink-0">{server.icon || '💬'}</span>
              )}
              <span className="truncate">{server.name}</span>
              {server.isLiveDiscord && (
                <span className="px-1.5 py-0.2 text-[9px] bg-[#23A55A]/20 text-[#57F287] border border-[#23A55A]/40 rounded font-bold shrink-0">
                  LIVE
                </span>
              )}
            </div>

            <div className="flex items-center gap-1">
              {/* Close Button on Mobile / Android */}
              {onClose && (
                <button
                  onClick={onClose}
                  className="p-1 text-[#949BA4] hover:text-white hover:bg-[#35373C] rounded transition-colors cursor-pointer"
                  title="Sembunyikan Panel Channel"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="h-12 border-b border-[#202225] px-3 flex items-center justify-between shadow-[0_1px_2px_rgba(0,0,0,0.2)]">
            <div className="flex items-center gap-2 font-bold text-white text-sm">
              <Bot className="w-5 h-5 text-[#5865F2]" />
              <span>WARPER Bot</span>
            </div>
            {onClose && (
              <button
                onClick={onClose}
                className="p-1 text-[#949BA4] hover:text-white hover:bg-[#35373C] rounded transition-colors cursor-pointer"
                title="Tutup Panel"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        )}

        {/* Bot Live Badge Info */}
        <div className="p-2.5 mx-2 mt-2 rounded-md bg-[#232428] border border-[#1E1F22] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <div className="relative">
              <div className="w-7 h-7 rounded-full bg-[#5865F2] flex items-center justify-center text-white">
                <Bot className="w-4 h-4" />
              </div>
              <span
                className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-[#232428] ${
                  isBotLive ? 'bg-[#23A55A]' : 'bg-[#ED4245]'
                }`}
              />
            </div>
            <div>
              <div className="text-xs font-bold text-white flex items-center gap-1">
                WARPER
                <span className="text-[9px] bg-[#5865F2] text-white px-1 py-0.2 rounded font-bold">BOT</span>
              </div>
              <div className="text-[10px] text-[#949BA4]">
                {isBotLive ? '⚡ Gateway Live' : '🔴 Bot Offline'}
              </div>
            </div>
          </div>
          <button
            onClick={onOpenSettings}
            className="text-[11px] text-[#00A8FC] hover:underline cursor-pointer flex items-center gap-1 font-medium"
          >
            <Sparkles className="w-3 h-3" />
            Setup
          </button>
        </div>

        {/* Channel Categories & List or Empty Server Guidance */}
        <div className="flex-1 overflow-y-auto px-2 py-3 space-y-4 no-scrollbar">
          {server && server.channels && server.channels.length > 0 ? (
            <div>
              <div className="px-2 mb-1 flex items-center justify-between text-[11px] font-bold text-[#949BA4] uppercase tracking-wider">
                <span>TEXT CHANNELS</span>
                <span className="text-[10px] text-[#80848E] font-normal">
                  {server.channels.length} channel
                </span>
              </div>

              <div className="space-y-0.5">
                {server.channels.map((ch) => {
                  const isActive = activeChannelId === ch.id;
                  return (
                    <button
                      key={ch.id}
                      id={`channel-btn-${ch.id}`}
                      onClick={() => {
                        onSelectChannel(ch.id);
                        if (onClose && window.innerWidth < 768) {
                          onClose();
                        }
                      }}
                      className={`w-full flex items-center gap-2 px-2.5 py-2 md:py-1.5 rounded-md text-sm font-medium transition-colors cursor-pointer group text-left ${
                        isActive
                          ? 'bg-[#404249] text-white'
                          : 'text-[#949BA4] hover:bg-[#35373C] hover:text-[#DBDEE1]'
                      }`}
                    >
                      <span className={isActive ? 'text-white' : 'text-[#949BA4] group-hover:text-[#DBDEE1]'}>
                        {getChannelIcon(ch.type)}
                      </span>
                      <span className="truncate flex-1">{ch.name}</span>
                      {ch.unreadCount && (
                        <span className="bg-[#ED4245] text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                          {ch.unreadCount}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="p-3 text-center rounded-lg bg-[#232428]/60 border border-[#202225] my-4">
              <div className="w-10 h-10 rounded-full bg-[#5865F2]/20 text-[#5865F2] flex items-center justify-center mx-auto mb-2">
                <Shield className="w-5 h-5" />
              </div>
              <div className="text-xs font-bold text-white mb-1">Tidak Ada Server</div>
              <p className="text-[11px] text-[#949BA4] mb-3 leading-relaxed">
                Hanya menampilkan server yang telah dimasuki bot WARPER.
              </p>
              <button
                onClick={onOpenSettings}
                className="w-full py-1.5 bg-[#23A55A] hover:bg-[#1C8B4C] text-white text-xs font-bold rounded-md shadow-sm transition-colors cursor-pointer"
              >
                Isi Token Bot
              </button>
            </div>
          )}
        </div>

        {/* Bottom Current User Bar */}
        <div className="h-[52px] bg-[#232428] px-2 flex items-center justify-between select-none border-t border-[#1E1F22] shrink-0">
          <div className="flex items-center gap-2 p-1 rounded-md hover:bg-[#35373C] cursor-pointer flex-1 mr-1 transition-colors">
            <div className="relative">
              <img
                src={currentUser.avatar}
                alt=""
                className="w-8 h-8 rounded-full object-cover"
              />
              <div className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-[#23A55A] border-2 border-[#232428]" />
            </div>
            <div className="truncate text-left">
              <div className="text-xs font-bold text-white truncate leading-tight">
                {currentUser.displayName}
              </div>
              <div className="text-[10px] text-[#949BA4] truncate">
                {currentUser.activity || 'Online'}
              </div>
            </div>
          </div>

          <div className="flex items-center text-[#B5BAC1]">
            <button
              className="p-1.5 hover:bg-[#35373C] hover:text-white rounded transition-colors cursor-pointer"
              title="Mute (Simulator)"
            >
              <Mic className="w-4 h-4" />
            </button>
            <button
              className="p-1.5 hover:bg-[#35373C] hover:text-white rounded transition-colors cursor-pointer"
              title="Deafen (Simulator)"
            >
              <Headphones className="w-4 h-4" />
            </button>
            <button
              id="btn-open-bot-settings"
              onClick={onOpenSettings}
              className="p-1.5 hover:bg-[#35373C] hover:text-white rounded transition-colors cursor-pointer text-[#5865F2]"
              title="WARPER Configuration"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </>
  );
};
