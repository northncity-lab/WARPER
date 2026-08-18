import React, { useState, useRef, useEffect } from 'react';
import { DiscordChannel, DiscordMessage, DiscordUser, BotConfig, DiscordRole, MentionCandidate, RiftTier, DiscordButtonComponent } from '../types';
import { DiscordEmbed } from './DiscordEmbed';
import { RiftDispatchModal } from './RiftDispatchModal';
import {
  Hash,
  Send,
  PlusCircle,
  Sparkles,
  CornerUpLeft,
  Copy,
  Check,
  ShieldAlert,
  Settings,
  Users,
  Code2,
  Radio,
  Zap,
  Key,
  Shield,
  AtSign,
  Bot,
  Trash2,
  Menu,
  ChevronDown,
  Compass,
} from 'lucide-react';
import { MOCK_USERS } from '../data/discordMock';

interface DiscordChatProps {
  channel?: DiscordChannel | null;
  channels?: DiscordChannel[];
  messages: DiscordMessage[];
  currentUser: DiscordUser;
  botUser: DiscordUser;
  isThinking: boolean;
  onSendMessage: (content: string, replyToMessage?: DiscordMessage) => void;
  onExecuteCommand: (command: string, args: Record<string, any>) => void;
  onSendRift?: (tier: RiftTier, location: string, targetChannelId: string, notes?: string) => void;
  onToggleReaction: (messageId: string, emoji: string) => void;
  onOpenSlashMenu: () => void;
  onOpenControlPanel: () => void;
  onOpenExportModal: () => void;
  onToggleMembers: () => void;
  showMembers: boolean;
  botConfig: BotConfig;
  isBotLive: boolean;
  onToggleChannelSidebar?: () => void;
  isChannelSidebarOpen?: boolean;
}

export const DiscordChat: React.FC<DiscordChatProps> = ({
  channel,
  channels = [],
  messages,
  currentUser,
  botUser,
  isThinking,
  onSendMessage,
  onExecuteCommand,
  onSendRift,
  onToggleReaction,
  onOpenSlashMenu,
  onOpenControlPanel,
  onOpenExportModal,
  onToggleMembers,
  showMembers,
  botConfig,
  isBotLive,
  onToggleChannelSidebar,
  isChannelSidebarOpen,
}) => {
  const [inputText, setInputText] = useState('');
  const [replyingTo, setReplyingTo] = useState<DiscordMessage | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showSlashHints, setShowSlashHints] = useState(false);
  const [isRiftModalOpen, setIsRiftModalOpen] = useState(false);

  // Selected State for Interactive Staff Rift Panel
  const [panelTier, setPanelTier] = useState<RiftTier>('ccc');
  const [panelLoc, setPanelLoc] = useState<string>('Relax');

  // Mention Autocomplete States
  const [showMentionPicker, setShowMentionPicker] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  const [mentionStartIndex, setMentionStartIndex] = useState(-1);
  const [selectedMentionIdx, setSelectedMentionIdx] = useState(0);
  const [availableRoles, setAvailableRoles] = useState<DiscordRole[]>([]);
  const [availableMembers, setAvailableMembers] = useState<any[]>([]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isThinking]);

  // Fetch available roles and members from Discord Gateway or default mock
  useEffect(() => {
    let isMounted = true;
    const fetchMentions = async () => {
      if (channel?.isLiveDiscord && isBotLive && channel?.id) {
        try {
          const res = await fetch(`/api/warper/live-bot/channel/${channel.id}/mentions`);
          if (res.ok) {
            const data = await res.json();
            if (isMounted) {
              if (data.roles && Array.isArray(data.roles)) {
                setAvailableRoles(data.roles);
              }
              if (data.members && Array.isArray(data.members)) {
                setAvailableMembers(data.members);
              }
            }
            return;
          }
        } catch {
          // fallback
        }
      }

      // Default mock roles & members
      if (isMounted && !channel?.isLiveDiscord) {
        setAvailableRoles([
          { id: 'r-owner', name: 'Server Owner', color: '#FEE75C', mentionable: true },
          { id: 'r-mod', name: 'Moderator', color: '#5865F2', mentionable: true },
          { id: 'r-dev', name: 'Developer', color: '#EB459E', mentionable: true },
          { id: 'r-elite', name: 'Elite Member', color: '#57F287', mentionable: true },
          { id: 'r-member', name: 'Member', color: '#99AAB5', mentionable: true },
        ]);
        setAvailableMembers(
          MOCK_USERS.map((u) => ({
            id: u.id,
            username: u.username,
            displayName: u.displayName,
            avatar: u.avatar,
            bot: u.bot,
            roleColor: u.roleColor || '#5865F2',
          }))
        );
      }
    };

    fetchMentions();
    // Sync mentions periodically to support real-time user joins
    const interval = setInterval(fetchMentions, 8000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [channel?.id, channel?.isLiveDiscord, isBotLive]);

  // Build mention candidates list
  const mentionCandidates: MentionCandidate[] = React.useMemo(() => {
    const query = mentionQuery.toLowerCase();
    const list: MentionCandidate[] = [];

    // 1. Special Mentions
    const specials: MentionCandidate[] = [
      { id: 'everyone', name: 'everyone', type: 'special', displayName: '@everyone (Panggil Semua Anggota)', color: '#FEE75C', mentionText: '@everyone' },
      { id: 'here', name: 'here', type: 'special', displayName: '@here (Panggil Anggota Online)', color: '#57F287', mentionText: '@here' },
    ];
    for (const sp of specials) {
      if (!query || sp.name.toLowerCase().includes(query)) {
        list.push(sp);
      }
    }

    // 2. Roles
    for (const r of availableRoles) {
      if (!query || r.name.toLowerCase().includes(query)) {
        list.push({
          id: r.id,
          name: r.name,
          type: 'role',
          displayName: r.name,
          color: r.color || '#5865F2',
          mentionText: `@${r.name}`,
        });
      }
    }

    // 3. Members
    for (const m of availableMembers) {
      const matchName = m.displayName?.toLowerCase().includes(query) || m.username?.toLowerCase().includes(query);
      if (!query || matchName) {
        list.push({
          id: m.id,
          name: m.username,
          type: 'user',
          displayName: m.displayName || m.username,
          avatar: m.avatar,
          isBot: m.bot,
          color: m.roleColor || '#5865F2',
          mentionText: `@${m.displayName || m.username}`,
        });
      }
    }

    return list.slice(0, 12);
  }, [availableRoles, availableMembers, mentionQuery]);

  const insertMention = (candidate: MentionCandidate) => {
    if (mentionStartIndex < 0) return;
    const before = inputText.substring(0, mentionStartIndex);
    const after = inputText.substring(inputRef.current?.selectionStart || inputText.length);
    const newText = `${before}${candidate.mentionText} ${after}`;
    setInputText(newText);
    setShowMentionPicker(false);
    setMentionStartIndex(-1);

    // Refocus and place cursor after inserted mention
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();
        const newCursorPos = before.length + candidate.mentionText.length + 1;
        inputRef.current.setSelectionRange(newCursorPos, newCursorPos);
      }
    }, 10);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // If mention picker is active, handle navigation
    if (showMentionPicker && mentionCandidates.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedMentionIdx((prev) => (prev + 1) % mentionCandidates.length);
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedMentionIdx((prev) => (prev - 1 + mentionCandidates.length) % mentionCandidates.length);
        return;
      }
      if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault();
        const selected = mentionCandidates[selectedMentionIdx] || mentionCandidates[0];
        if (selected) {
          insertMention(selected);
        }
        return;
      }
      if (e.key === 'Escape') {
        e.preventDefault();
        setShowMentionPicker(false);
        return;
      }
    }

    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    const cursor = e.target.selectionStart || 0;
    setInputText(val);

    if (val.startsWith('/')) {
      setShowSlashHints(true);
      setShowMentionPicker(false);
      return;
    } else {
      setShowSlashHints(false);
    }

    // Check for @ mention trigger
    const textBeforeCursor = val.substring(0, cursor);
    const lastAtIdx = textBeforeCursor.lastIndexOf('@');

    if (lastAtIdx !== -1) {
      // Ensure @ is at the start of string or preceded by whitespace
      const charBeforeAt = lastAtIdx > 0 ? textBeforeCursor[lastAtIdx - 1] : ' ';
      if (/\s/.test(charBeforeAt) || lastAtIdx === 0) {
        const query = textBeforeCursor.substring(lastAtIdx + 1);
        // Query should not contain spaces
        if (!/\s/.test(query)) {
          setMentionStartIndex(lastAtIdx);
          setMentionQuery(query);
          setSelectedMentionIdx(0);
          setShowMentionPicker(true);
          return;
        }
      }
    }

    setShowMentionPicker(false);
  };

  const handleSend = () => {
    const trimmed = inputText.trim();
    if (!trimmed) return;

    // Check if it's a slash command like /warper ask or /ask
    if (trimmed.startsWith('/warper ') || trimmed.startsWith('/')) {
      const parts = trimmed.replace(/^\//, '').split(' ');
      let cmdName = parts[0] === 'warper' ? parts[1] : parts[0];
      const rest = parts.slice(parts[0] === 'warper' ? 2 : 1).join(' ');

      if (cmdName) {
        onExecuteCommand(cmdName, { prompt: rest, text: rest, task: rest, check: rest });
        setInputText('');
        setReplyingTo(null);
        setShowSlashHints(false);
        setShowMentionPicker(false);
        return;
      }
    }

    onSendMessage(trimmed, replyingTo || undefined);
    setInputText('');
    setReplyingTo(null);
    setShowSlashHints(false);
    setShowMentionPicker(false);
  };

  const handleCopyMessage = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const QUICK_PROMPTS = [
    { label: '🤖 /ask Halo WARPER!', cmd: 'ask', args: { prompt: 'Halo WARPER! Berikan 3 tips memaksimalkan produktivitas dan AI di Discord.' } },
    { label: '🧹 /clear Hapus Chat', cmd: 'clear', args: { amount: '100' } },
    { label: '💻 /code TypeScript Bot', cmd: 'code', args: { language: 'TypeScript', task: 'Buat discord bot slash command listener' } },
    { label: '📝 /summarize Artikel', cmd: 'summarize', args: { text: 'Google Gemini 3.7 Flash adalah model AI tercanggih dengan kecepatan tinggi dan penalaran mutakhir.' } },
    { label: '📊 /poll Game Night', cmd: 'poll', args: { question: 'Main game apa malam ini?', options: 'Valorant, Apex Legends, Minecraft, Dota 2' } },
    { label: '🎲 /dice D20', cmd: 'dice', args: { sides: '20' } },
    { label: '🛡️ /automod Test', cmd: 'automod', args: { check: 'Free Nitro giveaway scam link http://fake-nitro.gg' } },
  ];

  // Helper to format text with Discord-style role & user mentions, bold, and code
  const renderFormattedDiscordContent = (content: string) => {
    if (!content) return null;

    // Split by tags/mentions
    const mentionRegex = /(<@&[0-9]+>|<@[0-9]+>|@[a-zA-Z0-9_.\-\s]+(?=[,!?\s]|$)|`[^`]+`|\*\*[^*]+\*\*)/g;
    const parts = content.split(mentionRegex);

    return parts.map((part, i) => {
      if (!part) return null;

      // Special mentions @everyone or @here
      if (part === '@everyone' || part === '@here') {
        return (
          <span
            key={i}
            className="px-1.5 py-0.5 rounded font-medium bg-[#FEE75C]/15 text-[#FEE75C] hover:bg-[#FEE75C] hover:text-[#1E1F22] transition-colors cursor-pointer inline-flex items-center gap-0.5"
            title="Special Server Ping"
          >
            {part}
          </span>
        );
      }

      // Role mention tag <@&12345>
      if (part.startsWith('<@&') && part.endsWith('>')) {
        const roleId = part.slice(3, -1);
        const role = availableRoles.find((r) => r.id === roleId);
        const roleName = role ? role.name : 'Role';
        const roleColor = role?.color || '#5865F2';
        return (
          <span
            key={i}
            className="px-1.5 py-0.5 rounded font-medium transition-colors cursor-pointer inline-flex items-center gap-1 text-xs"
            style={{
              backgroundColor: `${roleColor}25`,
              color: roleColor,
              border: `1px solid ${roleColor}40`,
            }}
          >
            <Shield className="w-3 h-3" />
            @{roleName}
          </span>
        );
      }

      // User mention tag <@12345>
      if (part.startsWith('<@') && part.endsWith('>')) {
        const userId = part.slice(2, -1);
        const member = availableMembers.find((m) => m.id === userId);
        const userName = member ? member.displayName || member.username : 'User';
        return (
          <span
            key={i}
            className="px-1.5 py-0.5 rounded font-medium bg-[#5865F2]/20 text-[#5865F2] hover:bg-[#5865F2] hover:text-white transition-colors cursor-pointer inline-flex items-center gap-0.5 text-xs"
          >
            @{userName}
          </span>
        );
      }

      // Named @Role or @User mention
      if (part.startsWith('@')) {
        const cleanName = part.slice(1).trim();
        const role = availableRoles.find((r) => r.name.toLowerCase() === cleanName.toLowerCase());
        if (role) {
          const roleColor = role.color || '#5865F2';
          return (
            <span
              key={i}
              className="px-1.5 py-0.5 rounded font-medium transition-colors cursor-pointer inline-flex items-center gap-1 text-xs"
              style={{
                backgroundColor: `${roleColor}25`,
                color: roleColor,
                border: `1px solid ${roleColor}40`,
              }}
            >
              <Shield className="w-3 h-3" />
              @{role.name}
            </span>
          );
        }

        const isUserMention = availableMembers.some(
          (m) =>
            m.displayName?.toLowerCase() === cleanName.toLowerCase() ||
            m.username?.toLowerCase() === cleanName.toLowerCase()
        );
        if (isUserMention || cleanName === 'WARPER') {
          return (
            <span
              key={i}
              className="px-1.5 py-0.5 rounded font-medium bg-[#5865F2]/20 text-[#5865F2] hover:bg-[#5865F2] hover:text-white transition-colors cursor-pointer inline-flex items-center gap-0.5 text-xs"
            >
              @{cleanName}
            </span>
          );
        }
      }

      // Inline code
      if (part.startsWith('`') && part.endsWith('`') && part.length > 2) {
        return (
          <code key={i} className="bg-[#1E1F22] text-[#E0E2E5] px-1.5 py-0.5 rounded font-mono text-xs">
            {part.slice(1, -1)}
          </code>
        );
      }

      // Bold text
      if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
        return <strong key={i} className="font-bold text-white">{part.slice(2, -2)}</strong>;
      }

      return <span key={i}>{part}</span>;
    });
  };

  if (!channel) {
    return (
      <div className="flex-1 bg-[#313338] flex flex-col items-center justify-center p-6 text-center select-none relative">
        {onToggleChannelSidebar && (
          <div className="absolute top-3 left-3 md:hidden">
            <button
              onClick={onToggleChannelSidebar}
              className="px-3 py-1.5 bg-[#2B2D31] hover:bg-[#35373C] text-white text-xs font-semibold rounded-lg border border-[#202225] flex items-center gap-1.5 shadow-md cursor-pointer"
            >
              <Menu className="w-4 h-4 text-[#5865F2]" />
              <span>Daftar Channel</span>
            </button>
          </div>
        )}
        <div className="w-20 h-20 rounded-2xl bg-[#5865F2]/20 border border-[#5865F2]/40 text-[#5865F2] flex items-center justify-center mb-5 shadow-xl">
          <Bot className="w-10 h-10" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Hanya Server yang Bot Masuki</h2>
        <p className="text-[#949BA4] text-sm max-w-md mb-6 leading-relaxed">
          Semua mock server bawaan telah dibersihkan. Panel ini sekarang hanya menampilkan server Discord nyata yang telah dimasuki oleh bot <strong>WARPER</strong>.
        </p>

        <div className="flex flex-col sm:flex-row gap-3">
          {onToggleChannelSidebar && (
            <button
              onClick={onToggleChannelSidebar}
              className="px-5 py-2.5 bg-[#2B2D31] hover:bg-[#35373C] text-white text-sm font-bold rounded-lg border border-[#35373C] flex items-center justify-center gap-2 cursor-pointer transition-all"
            >
              <Menu className="w-4 h-4 text-[#5865F2]" />
              <span>Buka Daftar Server & Channel</span>
            </button>
          )}
          <button
            onClick={onOpenControlPanel}
            className="px-5 py-2.5 bg-[#5865F2] hover:bg-[#4752C4] text-white text-sm font-bold rounded-lg shadow-lg flex items-center justify-center gap-2 cursor-pointer transition-all"
          >
            <Key className="w-4 h-4" />
            <span>Koneksikan Token Bot</span>
          </button>
          <button
            onClick={onOpenExportModal}
            className="px-5 py-2.5 bg-[#2B2D31] hover:bg-[#35373C] text-[#00A8FC] text-sm font-semibold rounded-lg border border-[#202225] flex items-center justify-center gap-2 cursor-pointer transition-all"
          >
            <Code2 className="w-4 h-4" />
            <span>Lihat Source Code Bot</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-[#313338] flex flex-col min-w-0 overflow-hidden relative select-text">
      {/* Top Channel Header */}
      <div className="h-12 border-b border-[#202225] px-2 sm:px-4 flex items-center justify-between shrink-0 bg-[#313338] shadow-[0_1px_2px_rgba(0,0,0,0.2)] z-10 gap-2">
        <div className="flex items-center gap-1.5 sm:gap-2 min-w-0 flex-1">
          {/* Mobile / Android Channel Drawer Trigger Button */}
          {onToggleChannelSidebar && (
            <button
              onClick={onToggleChannelSidebar}
              className="p-1 sm:p-1.5 rounded-md bg-[#2B2D31] hover:bg-[#35373C] text-white text-xs font-semibold flex items-center gap-1 sm:gap-1.5 border border-[#202225] shrink-0 cursor-pointer shadow-xs transition-colors"
              title="Buka / Sembunyikan Panel Channel"
            >
              <Menu className="w-4 h-4 text-[#5865F2]" />
              <span className="truncate max-w-[40px] sm:max-w-[120px] md:hidden">
                #{channel.name}
              </span>
              <ChevronDown className="w-3 h-3 text-[#949BA4] md:hidden" />
            </button>
          )}

          <div className="hidden md:flex items-center gap-1.5 truncate">
            <Hash className="w-5 h-5 text-[#949BA4] shrink-0" />
            <span className="font-bold text-white text-sm truncate">{channel.name}</span>
          </div>

          <div className="w-[1px] h-4 bg-[#3F4147] mx-1 shrink-0 hidden lg:block" />
          <span className="text-xs text-[#949BA4] truncate hidden lg:inline">
            {channel.isLiveDiscord
              ? 'Terhubung secara live ke server Discord nyata Anda'
              : channel.topic || 'Powered by Gemini 3.7 Flash AI'}
          </span>
        </div>

        {/* Header Action Buttons */}
        <div className="flex items-center gap-0.5 sm:gap-2 shrink-0">
          <button
            onClick={onOpenControlPanel}
            className="p-1 text-[#B5BAC1] hover:text-white hover:bg-[#35373C] rounded transition-colors cursor-pointer"
            title="WARPER Bot Settings"
          >
            <Settings className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>

          <button
            onClick={onToggleMembers}
            className={`p-1 rounded transition-colors cursor-pointer ${
              showMembers ? 'text-white bg-[#35373C]' : 'text-[#B5BAC1] hover:text-white hover:bg-[#35373C]'
            }`}
            title="Toggle Member List"
          >
            <Users className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar">
        {/* Welcome Channel Banner */}
        <div className="mb-6 pt-4 pb-2 border-b border-[#35373C]/60">
          <div className="w-16 h-16 rounded-full bg-[#5865F2] flex items-center justify-center text-white mb-2 shadow-lg">
            <Hash className="w-9 h-9" />
          </div>
          <h2 className="text-2xl font-bold text-white">Selamat Datang di #{channel.name}!</h2>
          <p className="text-sm text-[#949BA4] mt-1">
            {channel.isLiveDiscord
              ? 'Channel Discord langsung dari server Anda. Anda bisa mengetik @ untuk mention role, ping member, atau gunakan bot WARPER.'
              : `Ini adalah awal percakapan di #${channel.name}. WARPER AI siap menjawab pertanyaan, auto-moderasi, atau menjalankan perintah.`}
          </p>
        </div>

        {/* Message Items */}
        {messages.map((msg) => {
          const isBot = msg.author.bot;
          return (
            <div
              key={msg.id}
              className="group relative flex items-start gap-3.5 px-2 py-1.5 -mx-2 rounded-md hover:bg-[#2E3035] transition-colors"
            >
              {/* Message Actions Float Bar on Hover */}
              <div className="absolute right-3 -top-3 hidden group-hover:flex items-center bg-[#313338] border border-[#202225] rounded-md shadow-md py-0.5 px-1 gap-1 z-10">
                <button
                  onClick={() => onToggleReaction(msg.id, '⚡')}
                  className="p-1 hover:bg-[#35373C] text-[#B5BAC1] hover:text-[#57F287] rounded cursor-pointer transition-colors"
                  title="Add ⚡ reaction"
                >
                  ⚡
                </button>
                <button
                  onClick={() => onToggleReaction(msg.id, '🔥')}
                  className="p-1 hover:bg-[#35373C] text-[#B5BAC1] hover:text-[#ED4245] rounded cursor-pointer transition-colors"
                  title="Add 🔥 reaction"
                >
                  🔥
                </button>
                <button
                  onClick={() => setReplyingTo(msg)}
                  className="p-1 hover:bg-[#35373C] text-[#B5BAC1] hover:text-white rounded cursor-pointer transition-colors"
                  title="Reply to message"
                >
                  <CornerUpLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleCopyMessage(msg.content, msg.id)}
                  className="p-1 hover:bg-[#35373C] text-[#B5BAC1] hover:text-white rounded cursor-pointer transition-colors"
                  title="Copy text"
                >
                  {copiedId === msg.id ? <Check className="w-4 h-4 text-[#57F287]" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>

              {/* User Avatar */}
              <img
                src={msg.author.avatar}
                alt=""
                className="w-10 h-10 rounded-full object-cover shrink-0 cursor-pointer mt-0.5"
              />

              {/* Message Content Body */}
              <div className="flex-1 min-w-0">
                {/* Reply To Reference Pill */}
                {msg.replyTo && (
                  <div className="flex items-center gap-1.5 text-xs text-[#949BA4] mb-1">
                    <CornerUpLeft className="w-3 h-3 text-[#B5BAC1]" />
                    <span className="font-semibold text-[#DBDEE1]">@{msg.replyTo.authorName}</span>
                    <span className="truncate max-w-xs">{msg.replyTo.content}</span>
                  </div>
                )}

                {/* Author Info & Timestamp */}
                <div className="flex items-center gap-2">
                  <span
                    className="font-bold text-sm hover:underline cursor-pointer"
                    style={{ color: msg.author.roleColor || (isBot ? '#00F0FF' : '#FFFFFF') }}
                  >
                    {msg.author.displayName}
                  </span>
                  {isBot && (
                    <span className="bg-[#5865F2] text-white text-[10px] font-bold px-1.5 py-0.2 rounded flex items-center gap-0.5">
                      <Sparkles className="w-2.5 h-2.5" />
                      BOT
                    </span>
                  )}
                  <span className="text-[11px] text-[#949BA4]">{msg.timestamp}</span>

                  {msg.commandName && (
                    <span className="text-[11px] font-mono text-[#57F287] bg-[#232428] px-1.5 py-0.2 rounded border border-[#1E1F22]">
                      used {msg.commandName}
                    </span>
                  )}
                </div>

                {/* Toxicity / Scam AutoMod Warning */}
                {msg.flaggedToxicity && (
                  <div className="my-1.5 px-3 py-1.5 rounded-md bg-[#ED4245]/20 border border-[#ED4245]/40 text-[#ED4245] text-xs flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4 shrink-0" />
                    <span><strong>AutoMod Triggered:</strong> {msg.toxicityReason || 'Pesan ini melanggar filter keamanan'}</span>
                  </div>
                )}

                {/* Text Content with Mention Highlighting */}
                <div className="text-sm text-[#DBDEE1] leading-relaxed whitespace-pre-wrap mt-0.5">
                  {renderFormattedDiscordContent(msg.content)}
                </div>

                {/* Embeds */}
                {msg.embeds && msg.embeds.map((emb, eIdx) => (
                  <DiscordEmbed key={eIdx} embed={emb} />
                ))}

                {/* Interactive Components (Buttons & Select Menus) */}
                {msg.components && msg.components.map((row, rIdx) => (
                  <div key={rIdx} className="flex flex-col gap-2 mt-2 max-w-lg">
                    {row.components.map((comp, cIdx) => {
                      if (comp.type === 'select') {
                        return (
                          <div key={cIdx} className="relative w-full">
                            <select
                              disabled={comp.disabled}
                              onChange={(e) => {
                                if (comp.disabled) return;
                                // In a real bot, this would send an interaction to the server.
                                // For the local mock, we can handle specific dropdown flows here or in App.tsx
                                // Currently we will just pass this as a command
                                onExecuteCommand('interact_select', { customId: comp.customId, value: e.target.value });
                              }}
                              className={`w-full appearance-none bg-[#1E1F22] border border-[#1E1F22] text-[#DBDEE1] text-sm rounded-[4px] px-3 py-2 outline-none focus:border-[#5865F2] focus:ring-1 focus:ring-[#5865F2] ${comp.disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-[#35373C]'}`}
                            >
                              <option value="" disabled selected hidden>
                                {comp.placeholder || 'Select an option...'}
                              </option>
                              {comp.options.map((opt, oIdx) => (
                                <option key={oIdx} value={opt.value}>
                                  {opt.emoji ? `${opt.emoji} ` : ''}{opt.label}
                                </option>
                              ))}
                            </select>
                            <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
                              <ChevronDown className="w-4 h-4 text-[#B5BAC1]" />
                            </div>
                          </div>
                        );
                      }

                      // Render Button
                      const baseStyles = "px-4 py-2 rounded-[3px] text-sm font-semibold flex items-center gap-2 transition-all active:scale-[0.98] shadow-sm";
                      let styleClass = "bg-[#4E5058] text-white hover:bg-[#6D6F78]"; // Secondary
                      
                      if (comp.style === 'primary') styleClass = "bg-[#5865F2] text-white hover:bg-[#4752C4]";
                      else if (comp.style === 'success') styleClass = "bg-[#248046] text-white hover:bg-[#1A6334]";
                      else if (comp.style === 'danger') styleClass = "bg-[#DA373C] text-white hover:bg-[#A12828]";

                      const disabledClass = comp.disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer";

                      return (
                        <button
                          key={cIdx}
                          disabled={comp.disabled}
                          className={`${baseStyles} ${styleClass} ${disabledClass}`}
                          onClick={() => {
                            if (comp.disabled) return;
                            
                            // Handling internal state for specific rift staff panel
                            if (comp.customId.startsWith('rift_tier_')) {
                              setPanelTier(comp.customId.replace('rift_tier_', '') as RiftTier);
                            } else if (comp.customId.startsWith('rift_loc_')) {
                              setPanelLoc(comp.customId.replace('rift_loc_', ''));
                            } else if (comp.customId.startsWith('rift_send_')) {
                              if (onSendRift) {
                                // Assuming format: rift_send_tier_location
                                const parts = comp.customId.split('_');
                                const t = parts[2] as RiftTier;
                                const loc = parts.slice(3).join('_');
                                onSendRift(t, loc, channel?.id || '');
                              }
                            } else if (comp.customId === 'rift_action_custom') {
                              setIsRiftModalOpen(true);
                            }
                          }}
                        >
                          {comp.emoji && <span>{comp.emoji}</span>}
                          <span>{comp.label}</span>
                        </button>
                      );
                    })}
                  </div>
                ))}

                {/* Reactions */}
                {msg.reactions && msg.reactions.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {msg.reactions.map((rx, rIdx) => {
                      const hasVoted = rx.users.includes(currentUser.id);
                      return (
                        <button
                          key={rIdx}
                          onClick={() => onToggleReaction(msg.id, rx.emoji)}
                          className={`px-2 py-0.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer border ${
                            hasVoted
                              ? 'bg-[#3C4270] border-[#5865F2] text-[#5865F2]'
                              : 'bg-[#2B2D31] border-[#202225] text-[#B5BAC1] hover:bg-[#35373C]'
                          }`}
                        >
                          <span>{rx.emoji}</span>
                          <span className="text-white font-mono">{rx.count}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {/* Dynamic Typing Indicator */}
        {isThinking && (
          <div className="flex items-center gap-3 px-2 py-2 text-xs text-[#00F0FF] animate-in fade-in">
            <div className="w-8 h-8 rounded-full bg-[#5865F2] flex items-center justify-center text-white shrink-0 shadow-sm animate-pulse">
              <Sparkles className="w-4 h-4" />
            </div>
            <div className="flex items-center gap-2">
              <span className="font-bold">WARPER is sending & processing...</span>
              <div className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#00F0FF] animate-bounce [animation-delay:-0.3s]" />
                <span className="w-1.5 h-1.5 rounded-full bg-[#00F0FF] animate-bounce [animation-delay:-0.15s]" />
                <span className="w-1.5 h-1.5 rounded-full bg-[#00F0FF] animate-bounce" />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Quick Action Prompt Chips */}
      <div className="px-4 py-1.5 bg-[#2B2D31]/80 border-t border-[#202225] flex items-center gap-2 overflow-x-auto no-scrollbar">
        <span className="text-[11px] font-bold text-[#949BA4] uppercase shrink-0 flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-[#5865F2]" />
          Quick Try:
        </span>
        {QUICK_PROMPTS.map((qp, idx) => (
          <button
            key={idx}
            onClick={() => onExecuteCommand(qp.cmd, qp.args)}
            className="px-2.5 py-1 rounded-full bg-[#1E1F22] hover:bg-[#35373C] text-xs text-[#DBDEE1] hover:text-white transition-colors shrink-0 cursor-pointer border border-[#202225] font-medium"
          >
            {qp.label}
          </button>
        ))}
      </div>

      {/* Replying Banner */}
      {replyingTo && (
        <div className="mx-4 px-3 py-1.5 bg-[#2B2D31] rounded-t-md border-t border-x border-[#202225] flex items-center justify-between text-xs text-[#DBDEE1]">
          <div className="flex items-center gap-1.5 truncate">
            <CornerUpLeft className="w-3.5 h-3.5 text-[#5865F2]" />
            <span>Replying to <strong className="text-white">@{replyingTo.author.displayName}</strong>:</span>
            <span className="text-[#949BA4] truncate">{replyingTo.content}</span>
          </div>
          <button
            onClick={() => setReplyingTo(null)}
            className="text-[#949BA4] hover:text-white cursor-pointer ml-2"
          >
            ✕
          </button>
        </div>
      )}

      {/* Message Input Area */}
      <div className="p-4 pt-1 bg-[#313338]">
        <div className="relative flex items-center bg-[#383A40] rounded-lg px-4 py-2.5 focus-within:ring-1 focus-within:ring-[#5865F2]">
          {/* Plus / Attach Button */}
          <button
            onClick={onOpenSlashMenu}
            className="p-1 -ml-1 text-[#B5BAC1] hover:text-white rounded-full hover:bg-[#4E5058] transition-colors cursor-pointer mr-2"
            title="Open Slash Command Picker"
          >
            <PlusCircle className="w-5 h-5" />
          </button>

          {/* Text Input */}
          <input
            ref={inputRef}
            type="text"
            value={inputText}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder={
              channel.isLiveDiscord
                ? `Ketik pesan ke #${channel.name} (ketik @ untuk ping Role/Member)...`
                : `Message #${channel.name} (ketik @ untuk ping Role, atau /warper ...)`
            }
            className="w-full bg-transparent text-sm text-white placeholder-[#80848E] focus:outline-none"
          />

          {/* Real Discord @ Mention Autocomplete Popover */}
          {showMentionPicker && mentionCandidates.length > 0 && (
            <div className="absolute bottom-full left-0 mb-2 w-80 max-h-80 overflow-y-auto bg-[#2B2D31] border border-[#202225] rounded-lg shadow-2xl p-2 z-30 no-scrollbar space-y-1">
              <div className="flex items-center justify-between px-2 py-1 border-b border-[#202225] mb-1">
                <span className="text-[11px] font-bold text-[#949BA4] uppercase flex items-center gap-1.5">
                  <AtSign className="w-3.5 h-3.5 text-[#5865F2]" />
                  MENTIONS & ROLES
                </span>
                <span className="text-[10px] text-[#949BA4]">Tekan Enter / Tab untuk pilih</span>
              </div>

              {mentionCandidates.map((candidate, idx) => {
                const isSelected = idx === selectedMentionIdx;
                return (
                  <button
                    key={`${candidate.type}-${candidate.id}`}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      insertMention(candidate);
                    }}
                    className={`w-full text-left px-2.5 py-1.5 rounded-md flex items-center gap-2.5 transition-colors cursor-pointer ${
                      isSelected ? 'bg-[#404249] text-white' : 'hover:bg-[#35373C] text-[#DBDEE1]'
                    }`}
                  >
                    {/* Icon / Avatar based on mention type */}
                    {candidate.type === 'special' && (
                      <div
                        className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                        style={{ backgroundColor: `${candidate.color}25`, color: candidate.color }}
                      >
                        @
                      </div>
                    )}

                    {candidate.type === 'role' && (
                      <div
                        className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 border"
                        style={{
                          backgroundColor: `${candidate.color}25`,
                          borderColor: candidate.color,
                          color: candidate.color,
                        }}
                      >
                        <Shield className="w-3.5 h-3.5" />
                      </div>
                    )}

                    {candidate.type === 'user' && (
                      <img
                        src={candidate.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=60&auto=format&fit=crop&q=80'}
                        alt=""
                        className="w-6 h-6 rounded-full object-cover shrink-0"
                      />
                    )}

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span
                          className="font-semibold text-xs truncate"
                          style={{ color: candidate.color || '#FFFFFF' }}
                        >
                          @{candidate.name}
                        </span>
                        {candidate.type === 'role' && (
                          <span className="text-[9px] px-1 py-0.2 rounded bg-[#1E1F22] text-[#949BA4] uppercase font-bold">
                            Role
                          </span>
                        )}
                        {candidate.isBot && (
                          <span className="text-[9px] px-1 py-0.2 rounded bg-[#5865F2] text-white font-bold">
                            BOT
                          </span>
                        )}
                      </div>
                      {candidate.displayName && candidate.displayName !== candidate.name && (
                        <div className="text-[10px] text-[#949BA4] truncate">
                          {candidate.displayName}
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {/* Quick Slash Hints Popover */}
          {showSlashHints && !showMentionPicker && (
            <div className="absolute bottom-full left-0 mb-2 w-72 bg-[#2B2D31] border border-[#202225] rounded-lg shadow-xl p-2 z-20 space-y-1">
              <div className="text-[10px] font-bold text-[#949BA4] uppercase px-2 mb-1">
                SLASH COMMANDS
              </div>
              <button
                onClick={() => {
                  onExecuteCommand('ask', { prompt: inputText.replace('/warper ask', '').replace('/ask', '').trim() || 'Jelaskan AI' });
                  setInputText('');
                  setShowSlashHints(false);
                }}
                className="w-full text-left px-2.5 py-1.5 rounded hover:bg-[#5865F2] hover:text-white text-xs text-[#DBDEE1] flex items-center gap-2 cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-[#00F0FF]" />
                <span>/warper ask [prompt]</span>
              </button>
              <button
                onClick={() => {
                  onExecuteCommand('clear', { amount: '100' });
                  setInputText('');
                  setShowSlashHints(false);
                }}
                className="w-full text-left px-2.5 py-1.5 rounded hover:bg-[#ED4245] hover:text-white text-xs text-[#DBDEE1] flex items-center gap-2 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5 text-[#ED4245]" />
                <span>/warper clear (Hapus semua chat)</span>
              </button>
              <button
                onClick={() => {
                  onExecuteCommand('code', { language: 'TypeScript', task: 'Code generator' });
                  setInputText('');
                  setShowSlashHints(false);
                }}
                className="w-full text-left px-2.5 py-1.5 rounded hover:bg-[#5865F2] hover:text-white text-xs text-[#DBDEE1] flex items-center gap-2 cursor-pointer"
              >
                <Code2 className="w-3.5 h-3.5 text-[#57F287]" />
                <span>/warper code [lang] [task]</span>
              </button>
              <button
                onClick={() => {
                  onOpenSlashMenu();
                  setShowSlashHints(false);
                }}
                className="w-full text-left px-2.5 py-1.5 rounded hover:bg-[#35373C] text-xs text-[#00A8FC] flex items-center gap-2 cursor-pointer"
              >
                <Zap className="w-3.5 h-3.5" />
                <span>Lihat semua perintah...</span>
              </button>
            </div>
          )}

          {/* Right Action Icons */}
          <div className="flex items-center gap-2 ml-2">
            <button
              onClick={() => onSendMessage(inputText || '🎉')}
              className={`p-1.5 rounded transition-all cursor-pointer ${
                inputText.trim()
                  ? 'bg-[#5865F2] text-white hover:bg-[#4752C4] shadow-md'
                  : 'text-[#B5BAC1] hover:text-white'
              }`}
              title="Send Message"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <RiftDispatchModal
        isOpen={isRiftModalOpen}
        onClose={() => setIsRiftModalOpen(false)}
        channels={channels}
        currentChannelId={channel?.id || ''}
        onSendRift={(tier, loc, targetId, notes) => {
          if (onSendRift) {
            onSendRift(tier, loc, targetId, notes);
          }
        }}
        senderName={currentUser.displayName || currentUser.name}
      />
    </div>
  );
};
