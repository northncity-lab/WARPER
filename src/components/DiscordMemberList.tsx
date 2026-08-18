import React from 'react';
import { DiscordUser } from '../types';
import { Bot, Shield, Crown, Sparkles } from 'lucide-react';

interface DiscordMemberListProps {
  members: DiscordUser[];
  onSelectMember?: (member: DiscordUser) => void;
}

export const DiscordMemberList: React.FC<DiscordMemberListProps> = ({ members, onSelectMember }) => {
  // Group members
  const bots = members.filter((m) => m.bot);
  const owners = members.filter((m) => !m.bot && m.role?.includes('Owner'));
  const moderators = members.filter((m) => !m.bot && m.role?.includes('Moderator'));
  const developers = members.filter((m) => !m.bot && m.role?.includes('Developer'));
  const others = members.filter((m) => !m.bot && !m.role?.includes('Owner') && !m.role?.includes('Moderator') && !m.role?.includes('Developer'));

  const renderStatusDot = (status: DiscordUser['status']) => {
    switch (status) {
      case 'online':
        return 'bg-[#23A55A]';
      case 'idle':
        return 'bg-[#FEE75C]';
      case 'dnd':
        return 'bg-[#ED4245]';
      default:
        return 'bg-[#80848E]';
    }
  };

  const renderUserItem = (user: DiscordUser) => {
    return (
      <div
        key={user.id}
        onClick={() => onSelectMember && onSelectMember(user)}
        className="flex items-center gap-2.5 px-2 py-1.5 rounded-md hover:bg-[#35373C] cursor-pointer transition-colors group"
      >
        <div className="relative shrink-0">
          <img
            src={user.avatar}
            alt=""
            className="w-8 h-8 rounded-full object-cover"
          />
          <div
            className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-[#2B2D31] ${renderStatusDot(
              user.status
            )}`}
          />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span
              className="text-xs font-semibold truncate"
              style={{ color: user.roleColor || '#DBDEE1' }}
            >
              {user.displayName}
            </span>
            {user.bot && (
              <span className="bg-[#5865F2] text-white text-[9px] font-bold px-1 py-0.2 rounded flex items-center gap-0.5">
                <Bot className="w-2.5 h-2.5" />
                BOT
              </span>
            )}
            {user.role?.includes('Owner') && (
              <Crown className="w-3 h-3 text-[#FEE75C] shrink-0" />
            )}
            {user.role?.includes('Moderator') && (
              <Shield className="w-3 h-3 text-[#5865F2] shrink-0" />
            )}
          </div>
          {user.activity && (
            <div className="text-[11px] text-[#949BA4] truncate group-hover:text-[#DBDEE1]">
              {user.activity}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="w-60 bg-[#2B2D31] flex flex-col shrink-0 select-none border-l border-[#202225] py-3 px-2 overflow-y-auto no-scrollbar hidden lg:flex">
      {/* Bot Category */}
      {bots.length > 0 && (
        <div className="mb-4">
          <div className="px-2 mb-1 text-[11px] font-bold text-[#949BA4] uppercase tracking-wider flex items-center justify-between">
            <span>AI CORE ASSISTANT — {bots.length}</span>
            <Sparkles className="w-3 h-3 text-[#00F0FF]" />
          </div>
          <div className="space-y-0.5">{bots.map(renderUserItem)}</div>
        </div>
      )}

      {/* Owners */}
      {owners.length > 0 && (
        <div className="mb-4">
          <div className="px-2 mb-1 text-[11px] font-bold text-[#949BA4] uppercase tracking-wider">
            SERVER OWNER — {owners.length}
          </div>
          <div className="space-y-0.5">{owners.map(renderUserItem)}</div>
        </div>
      )}

      {/* Moderators */}
      {moderators.length > 0 && (
        <div className="mb-4">
          <div className="px-2 mb-1 text-[11px] font-bold text-[#949BA4] uppercase tracking-wider">
            MODERATORS — {moderators.length}
          </div>
          <div className="space-y-0.5">{moderators.map(renderUserItem)}</div>
        </div>
      )}

      {/* Developers */}
      {developers.length > 0 && (
        <div className="mb-4">
          <div className="px-2 mb-1 text-[11px] font-bold text-[#949BA4] uppercase tracking-wider">
            DEVELOPERS — {developers.length}
          </div>
          <div className="space-y-0.5">{developers.map(renderUserItem)}</div>
        </div>
      )}

      {/* Members */}
      {others.length > 0 && (
        <div className="mb-4">
          <div className="px-2 mb-1 text-[11px] font-bold text-[#949BA4] uppercase tracking-wider">
            ONLINE MEMBERS — {others.length}
          </div>
          <div className="space-y-0.5">{others.map(renderUserItem)}</div>
        </div>
      )}
    </div>
  );
};
