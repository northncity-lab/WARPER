import React, { useState, useEffect } from 'react';
import { DiscordSidebar } from './components/DiscordSidebar';
import { DiscordChannels } from './components/DiscordChannels';
import { DiscordChat } from './components/DiscordChat';
import { DiscordMemberList } from './components/DiscordMemberList';
import { BotControlPanel } from './components/BotControlPanel';
import { BotCodeExportModal } from './components/BotCodeExportModal';
import { SlashCommandMenu } from './components/SlashCommandMenu';
import { LiveConsoleDrawer } from './components/LiveConsoleDrawer';

import {
  INITIAL_SERVERS,
  INITIAL_MESSAGES,
  MOCK_USERS,
  CURRENT_USER,
  WARPER_BOT_USER,
  DEFAULT_BOT_CONFIG,
} from './data/discordMock';

import {
  DiscordServer,
  DiscordMessage,
  DiscordUser,
  BotConfig,
  BotStatus,
  ConsoleLog,
} from './types';

export default function App() {
  const [servers, setServers] = useState<DiscordServer[]>(INITIAL_SERVERS);
  const [activeServerId, setActiveServerId] = useState<string>('');
  const [activeChannelId, setActiveChannelId] = useState<string>('');
  const [messagesMap, setMessagesMap] = useState<Record<string, DiscordMessage[]>>(INITIAL_MESSAGES);
  const [members, setMembers] = useState<DiscordUser[]>(MOCK_USERS);
  const [currentUser] = useState<DiscordUser>(CURRENT_USER);
  const [botUser] = useState<DiscordUser>(WARPER_BOT_USER);
  const [botConfig, setBotConfig] = useState<BotConfig>(DEFAULT_BOT_CONFIG);

  const [isThinking, setIsThinking] = useState(false);
  const [showMembers, setShowMembers] = useState(false);

  // Modals & Drawers
  const [isControlPanelOpen, setIsControlPanelOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isSlashMenuOpen, setIsSlashMenuOpen] = useState(false);
  const [isConsoleOpen, setIsConsoleOpen] = useState(false);
  const [isChannelSidebarOpen, setIsChannelSidebarOpen] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth >= 768;
    }
    return true;
  });

  // Bot Gateway & Console State
  const [botStatus, setBotStatus] = useState<BotStatus>({
    isLive: false,
    connectedGuilds: 0,
    pingMs: 0,
    uptimeSeconds: 0,
    totalCommandsProcessed: 0,
    totalAiTokens: 0,
  });

  const [consoleLogs, setConsoleLogs] = useState<ConsoleLog[]>([
    {
      id: 'log-0',
      timestamp: new Date().toLocaleTimeString(),
      level: 'info',
      message: 'WARPER Discord Simulation & Gateway interface loaded.',
    },
  ]);

  const addConsoleLog = (level: ConsoleLog['level'], message: string) => {
    const log: ConsoleLog = {
      id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      timestamp: new Date().toLocaleTimeString(),
      level,
      message,
    };
    setConsoleLogs((prev) => [log, ...prev.slice(0, 80)]);
  };

  const fetchLiveGuilds = async () => {
    try {
      const res = await fetch('/api/warper/live-bot/guilds');
      if (res.ok) {
        const data = await res.json();
        const liveGuilds: DiscordServer[] = data.guilds && Array.isArray(data.guilds) ? data.guilds : [];
        setServers(liveGuilds);
        if (liveGuilds.length > 0) {
          setActiveServerId((prev) => (liveGuilds.some((g) => g.id === prev) ? prev : liveGuilds[0].id));
          setActiveChannelId((prev) => {
            const allChannels = liveGuilds.flatMap((g) => g.channels);
            return allChannels.some((c) => c.id === prev) ? prev : (liveGuilds[0].channels[0]?.id || '');
          });
        }
      }
    } catch (err) {
      // quiet
    }
  };

  // Poll live bot status & live guilds periodically
  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const res = await fetch('/api/warper/live-bot/status');
        if (res.ok) {
          const data = await res.json();
          if (data.status) {
            setBotStatus(data.status);
            // If live, also sync real guilds
            if (data.status.isLive) {
              fetchLiveGuilds();
            }
          }
          if (data.logs && Array.isArray(data.logs) && data.logs.length > 0) {
            setConsoleLogs((prev) => {
              const combined = [...data.logs, ...prev];
              const seen = new Set();
              return combined.filter((item) => {
                if (seen.has(item.id)) return false;
                seen.add(item.id);
                return true;
              }).slice(0, 100);
            });
          }
        }
      } catch (err) {
        // quiet in background
      }
    };

    fetchStatus();
    fetchLiveGuilds();
    const interval = setInterval(fetchStatus, 5000);
    return () => clearInterval(interval);
  }, []);

  const currentServer = servers.find((s) => s.id === activeServerId) || servers[0] || null;
  const currentChannel =
    currentServer?.channels.find((c) => c.id === activeChannelId) || currentServer?.channels[0] || null;
  const currentMessages = currentChannel ? messagesMap[currentChannel.id] || [] : [];

  // Poll live messages when watching a live Discord channel
  useEffect(() => {
    if (!currentChannel?.isLiveDiscord || !botStatus.isLive) return;

    const fetchLiveMessages = async () => {
      try {
        const res = await fetch(`/api/warper/live-bot/channel/${currentChannel.id}/messages`);
        if (res.ok) {
          const data = await res.json();
          if (data.messages && Array.isArray(data.messages)) {
            setMessagesMap((prev) => ({
              ...prev,
              [currentChannel.id]: data.messages,
            }));
          }
        }
      } catch {}
    };

    fetchLiveMessages();
    const timer = setInterval(fetchLiveMessages, 3500);
    return () => clearInterval(timer);
  }, [currentChannel?.id, currentChannel?.isLiveDiscord, botStatus.isLive]);

  // Switch server & auto-pick first channel
  const handleSelectServer = (serverId: string) => {
    setActiveServerId(serverId);
    const targetServer = servers.find((s) => s.id === serverId);
    if (targetServer && targetServer.channels.length > 0) {
      setActiveChannelId(targetServer.channels[0].id);
    }
    // On mobile screens, open the channel drawer when changing server so user can pick
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      setIsChannelSidebarOpen(true);
    }
  };

  // Switch channel
  const handleSelectChannel = (channelId: string) => {
    setActiveChannelId(channelId);
    // On mobile screens, automatically collapse drawer to give full width to chat
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      setIsChannelSidebarOpen(false);
    }
  };

  // Toggle reactions on messages
  const handleToggleReaction = (messageId: string, emoji: string) => {
    if (!currentChannel) return;
    setMessagesMap((prev) => {
      const channelMsgs = prev[currentChannel.id] || [];
      const updated = channelMsgs.map((m) => {
        if (m.id !== messageId) return m;
        const reactions = [...(m.reactions || [])];
        const existing = reactions.find((r) => r.emoji === emoji);

        if (existing) {
          const hasVoted = existing.users.includes(currentUser.id);
          if (hasVoted) {
            existing.users = existing.users.filter((uid) => uid !== currentUser.id);
            existing.count -= 1;
          } else {
            existing.users.push(currentUser.id);
            existing.count += 1;
          }
        } else {
          reactions.push({ emoji, count: 1, users: [currentUser.id] });
        }

        return {
          ...m,
          reactions: reactions.filter((r) => r.count > 0),
        };
      });

      return {
        ...prev,
        [currentChannel.id]: updated,
      };
    });
  };

  // Send message from user and trigger smart WARPER AI response
  const handleSendMessage = async (content: string, replyTo?: DiscordMessage) => {
    if (!currentChannel) {
      setIsControlPanelOpen(true);
      return;
    }
    const userMsgId = `m-${Date.now()}`;
    const newMsg: DiscordMessage = {
      id: userMsgId,
      channelId: currentChannel.id,
      author: currentUser,
      content,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      replyTo: replyTo
        ? {
            id: replyTo.id,
            authorName: replyTo.author.displayName,
            content: replyTo.content,
          }
        : undefined,
    };

    // Auto-moderation pre-check
    let isToxic = false;
    let toxicReason = '';
    if (botConfig.autoModeration) {
      try {
        const modRes = await fetch('/api/warper/automod', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: content }),
        });
        if (modRes.ok) {
          const modData = await modRes.json();
          if (modData.isToxic) {
            isToxic = true;
            toxicReason = modData.reason || 'Terdeteksi konten tidak aman';
            newMsg.flaggedToxicity = true;
            newMsg.toxicityReason = toxicReason;
            addConsoleLog('warn', `[AutoMod] Flagged message from ${currentUser.displayName}: "${content}"`);
          }
        }
      } catch (err) {
        // proceed
      }
    }

    // Add user message to UI immediately
    setMessagesMap((prev) => ({
      ...prev,
      [currentChannel.id]: [...(prev[currentChannel.id] || []), newMsg],
    }));

    addConsoleLog('info', `Message sent by ${currentUser.displayName} in #${currentChannel.name}`);

    // If this is a real live Discord channel, transmit directly to Discord!
    if (currentChannel.isLiveDiscord && botStatus.isLive) {
      setIsThinking(true);
      try {
        const isAiTrigger =
          content.startsWith(botConfig.prefix || '!w') ||
          content.includes('@WARPER') ||
          content.toLowerCase().startsWith('!ask') ||
          content.toLowerCase().startsWith('!warper');

        const liveRes = await fetch(`/api/warper/live-bot/channel/${currentChannel.id}/send`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            content,
            triggerAi: isAiTrigger,
          }),
        });

        if (!liveRes.ok) {
          const errData = await liveRes.json();
          throw new Error(errData.error || 'Failed to send to Discord');
        }

        addConsoleLog('success', `[Live Gateway] Pesan terkirim langsung ke channel Discord #${currentChannel.name}!`);

        // Refresh messages from Discord channel immediately
        setTimeout(async () => {
          try {
            const refreshRes = await fetch(`/api/warper/live-bot/channel/${currentChannel.id}/messages`);
            if (refreshRes.ok) {
              const refreshData = await refreshRes.json();
              if (refreshData.messages) {
                setMessagesMap((prev) => ({
                  ...prev,
                  [currentChannel.id]: refreshData.messages,
                }));
              }
            }
          } catch {}
        }, 1200);
      } catch (err: any) {
        addConsoleLog('error', `Live Discord send error: ${err.message}`);
      } finally {
        setIsThinking(false);
      }
      return;
    }

    // If user message is in chat-warper or mentions WARPER or starts with prefix, trigger Gemini response
    const shouldRespond =
      currentChannel.id === 'c-chat-warper' ||
      currentChannel.id === 'c-tanya-warper' ||
      content.includes('@WARPER') ||
      content.toLowerCase().includes('warper') ||
      content.startsWith(botConfig.prefix || '!w');

    if (shouldRespond && !isToxic) {
      setIsThinking(true);
      try {
        const history = (messagesMap[currentChannel.id] || []).slice(-5);
        const res = await fetch('/api/warper/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: content,
            channelName: currentChannel.name,
            conversationHistory: history,
            botConfig,
          }),
        });

        if (!res.ok) {
          throw new Error(`Server returned ${res.status}`);
        }

        const data = await res.json();
        const replyMsg: DiscordMessage = {
          id: `m-bot-${Date.now()}`,
          channelId: currentChannel.id,
          author: botUser,
          content: data.text || 'Siap! Ada hal lain yang bisa saya bantu?',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          replyTo: {
            id: userMsgId,
            authorName: currentUser.displayName,
            content: content,
          },
        };

        setMessagesMap((prev) => ({
          ...prev,
          [currentChannel.id]: [...(prev[currentChannel.id] || []), replyMsg],
        }));

        addConsoleLog('ai', `WARPER replied to @${currentUser.displayName} (${data.elapsedMs || 120}ms)`);
      } catch (err: any) {
        console.error('Error getting WARPER reply:', err);
        const errorMsg: DiscordMessage = {
          id: `m-err-${Date.now()}`,
          channelId: currentChannel.id,
          author: botUser,
          content: `⚠️ Maaf, terjadi gangguan saat menghubungi Gemini AI: ${err.message}`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
        setMessagesMap((prev) => ({
          ...prev,
          [currentChannel.id]: [...(prev[currentChannel.id] || []), errorMsg],
        }));
        addConsoleLog('error', `Chat error: ${err.message}`);
      } finally {
        setIsThinking(false);
      }
    }
  };

  // Execute Slash Command
  const handleExecuteCommand = async (commandName: string, args: Record<string, any>) => {
    if (!currentChannel) {
      setIsControlPanelOpen(true);
      return;
    }

    if (commandName === 'interact_select') {
      const { customId, value } = args;
      if (customId === 'rift_select_tier') {
         // Fake response for Local Mock
         const msg: DiscordMessage = {
            id: `m-bot-sel-${Date.now()}`,
            channelId: currentChannel.id,
            author: botUser,
            content: `**📢 Menu Dispatch Rift**\nRole Tier yang dipilih: **@${value}**\n\nSilakan pilih Ruangan (Lokasi) Rift saat ini:`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            components: [
              {
                components: [
                  {
                    type: 'select',
                    customId: `rift_loc_${value}`,
                    placeholder: 'Pilih Lokasi Ruangan (Rooms)...',
                    options: [
                      { label: 'Relaxarium', value: 'Relaxarium', emoji: '🛋️' },
                      { label: 'Beach', value: 'Beach', emoji: '🏖️' },
                      { label: 'Oasis', value: 'Oasis', emoji: '🌴' },
                      { label: 'Rooftop', value: 'Rooftop', emoji: '🌆' },
                      { label: 'Lobby', value: 'Lobby', emoji: '🏨' },
                    ]
                  }
                ]
              }
            ]
         };
         setMessagesMap((prev) => ({
           ...prev,
           [currentChannel.id]: [...(prev[currentChannel.id] || []), msg],
         }));
      } else if (customId.startsWith('rift_loc_')) {
         const tier = customId.replace('rift_loc_', '');
         const msg: DiscordMessage = {
            id: `m-bot-sel2-${Date.now()}`,
            channelId: currentChannel.id,
            author: botUser,
            content: `✅ **Berhasil!** Pesan ping telah dikirim:\n> @${tier} (${value})`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
         };
         setMessagesMap((prev) => ({
           ...prev,
           [currentChannel.id]: [...(prev[currentChannel.id] || []), msg],
         }));
      }
      return;
    }

    // Special Handling for /clear command: Purge all messages in current channel
    if (commandName === 'clear') {
      setIsThinking(true);
      addConsoleLog('info', `🧹 Executing /clear in channel #${currentChannel.name}...`);

      if (currentChannel.isLiveDiscord && botStatus.isLive) {
        try {
          await fetch(`/api/warper/live-bot/channel/${currentChannel.id}/clear`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ amount: args?.amount || 100 }),
          });
        } catch (e) {
          console.error('Failed to clear Discord channel:', e);
        }
      }

      const botClearMsg: DiscordMessage = {
        id: `m-clear-${Date.now()}`,
        channelId: currentChannel.id,
        author: botUser,
        content: '🧹 **Channel Berhasil Dibersihkan!**',
        embeds: [
          {
            title: '🧹 WARPER Channel Clear & Purge',
            description: `Seluruh riwayat chat di channel **#${currentChannel.name}** telah berhasil dibersihkan dan dihapus.`,
            color: '#57F287',
            fields: [
              { name: '📍 Channel', value: `#${currentChannel.name}`, inline: true },
              { name: '🛡️ Executor', value: currentUser.displayName, inline: true },
              { name: '⚡ Status', value: 'Clean & Ready', inline: true },
            ],
            footer: { text: 'WARPER Moderation Core' },
            timestamp: new Date().toISOString(),
          },
        ],
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        commandName: '/warper clear',
      };

      setMessagesMap((prev) => ({
        ...prev,
        [currentChannel.id]: [botClearMsg],
      }));
      addConsoleLog('success', `🧹 Cleared all chat in channel #${currentChannel.name}`);
      setIsThinking(false);
      return;
    }

    // 1. Post user command invocation pill to chat
    const cmdSummary = Object.entries(args)
      .filter(([_, v]) => v)
      .map(([k, v]) => `${k}:"${v}"`)
      .join(' ');

    const userCmdMsg: DiscordMessage = {
      id: `m-cmd-${Date.now()}`,
      channelId: currentChannel.id,
      author: currentUser,
      content: `/warper ${commandName} ${cmdSummary}`.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      commandName: `/warper ${commandName}`,
    };

    setMessagesMap((prev) => ({
      ...prev,
      [currentChannel.id]: [...(prev[currentChannel.id] || []), userCmdMsg],
    }));

    setIsThinking(true);
    addConsoleLog('info', `Executing command: /warper ${commandName}`);

    try {
      const res = await fetch('/api/warper/command', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          command: commandName,
          args,
          botConfig,
        }),
      });

      if (!res.ok) {
        throw new Error(`Command failed with status ${res.status}`);
      }

      const data = await res.json();
      const botReplyMsg: DiscordMessage = {
        id: `m-bot-cmd-${Date.now()}`,
        channelId: currentChannel.id,
        author: botUser,
        content: data.text || '',
        embeds: data.embed ? [data.embed] : undefined,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        commandName: `/warper ${commandName}`,
      };

      // If poll command, add default reaction options
      if (commandName === 'poll') {
        botReplyMsg.reactions = [
          { emoji: '1️⃣', count: 1, users: [currentUser.id] },
          { emoji: '2️⃣', count: 0, users: [] },
        ];
      }

      setMessagesMap((prev) => ({
        ...prev,
        [currentChannel.id]: [...(prev[currentChannel.id] || []), botReplyMsg],
      }));

      addConsoleLog('success', `Command /warper ${commandName} completed successfully.`);
    } catch (err: any) {
      console.error('Command execution failed:', err);
      const errorMsg: DiscordMessage = {
        id: `m-err-cmd-${Date.now()}`,
        channelId: currentChannel.id,
        author: botUser,
        content: `❌ Gagal menjalankan command /warper ${commandName}: ${err.message}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessagesMap((prev) => ({
        ...prev,
        [currentChannel.id]: [...(prev[currentChannel.id] || []), errorMsg],
      }));
      addConsoleLog('error', `Command /warper ${commandName} failed: ${err.message}`);
    } finally {
      setIsThinking(false);
    }
  };

  // Start Live Discord Gateway Bot
  const handleStartLiveBot = async (token: string): Promise<boolean> => {
    addConsoleLog('info', 'Connecting to Discord Gateway with Bot Token...');
    try {
      const res = await fetch('/api/warper/live-bot/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          prefix: botConfig.prefix,
          personality: botConfig.personality,
          statusText: botConfig.statusText,
          name: botConfig.name,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setBotStatus((prev) => ({ ...prev, isLive: true }));
        addConsoleLog('success', '⚡ WARPER is now LIVE on real Discord servers!');
        setTimeout(() => {
          fetchLiveGuilds();
        }, 1000);
        return true;
      } else {
        const err = await res.json();
        addConsoleLog('error', `Gateway connection error: ${err.error}`);
        return false;
      }
    } catch (e: any) {
      addConsoleLog('error', `Connection failed: ${e.message}`);
      return false;
    }
  };

  // Stop Live Discord Gateway Bot
  const handleStopLiveBot = async (): Promise<void> => {
    try {
      await fetch('/api/warper/live-bot/stop', { method: 'POST' });
      setBotStatus((prev) => ({ ...prev, isLive: false }));
      setServers([]);
      setActiveServerId('');
      setActiveChannelId('');
      addConsoleLog('warn', 'WARPER Discord Gateway bot stopped.');
    } catch (e) {
      // quiet
    }
  };

  // Send Discord Webhook
  const handleSendWebhook = async (
    webhookUrl: string,
    content: string,
    embedTitle?: string
  ): Promise<boolean> => {
    try {
      const res = await fetch('/api/warper/webhook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          webhookUrl,
          content: content,
          embeds: embedTitle
            ? [
                {
                  title: embedTitle,
                  description: content,
                  color: 0x5865f2,
                  footer: { text: 'WARPER Discord AI Bot' },
                  timestamp: new Date().toISOString(),
                },
              ]
            : undefined,
        }),
      });
      return res.ok;
    } catch (e) {
      return false;
    }
  };

  // Dispatch Rift Announcement (Live API & Local Mock)
  const handleSendRift = async (tier: any, location: string, targetChannelId: string, notes?: string) => {
    if (botStatus.isLive) {
      addConsoleLog('info', `Dispatching Rift Ping ${tier} at ${location} via Live Bot API...`);
      try {
        const res = await fetch('/api/warper/live-bot/rift/dispatch', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            tier,
            location,
            targetChannelId,
            notes,
            reportedBy: currentUser.displayName || currentUser.name
          }),
        });
        const data = await res.json();
        if (res.ok && data.success) {
          addConsoleLog('success', `Rift Ping Live broadcasted to #${data.targetChannel}!`);
        } else {
          addConsoleLog('error', `Live Rift dispatch failed: ${data.error || data.message}`);
        }
      } catch (err: any) {
        addConsoleLog('error', `Live Rift dispatch error: ${err.message}`);
      }
    } else {
      // Offline / Local Mock Simulator execution via /api/warper/command
      addConsoleLog('info', `Dispatching Local Mock Rift Ping ${tier} at ${location}...`);
      handleExecuteCommand('rift', { tier, location, targetChannelId, notes });
    }
  };

  return (
    <div className="flex h-screen w-screen bg-[#1E1F22] text-[#DBDEE1] overflow-hidden font-sans antialiased">
      {/* 1. Discord Left Server Rail */}
      <DiscordSidebar
        servers={servers}
        activeServerId={activeServerId}
        onSelectServer={handleSelectServer}
        onOpenControlPanel={() => setIsControlPanelOpen(true)}
        onOpenExportModal={() => setIsExportModalOpen(true)}
        onToggleConsole={() => setIsConsoleOpen((prev) => !prev)}
        isConsoleOpen={isConsoleOpen}
        isBotLive={botStatus.isLive}
      />

      {/* 2. Channels Sidebar */}
      <DiscordChannels
        server={currentServer}
        activeChannelId={activeChannelId}
        onSelectChannel={handleSelectChannel}
        currentUser={currentUser}
        onOpenSettings={() => setIsControlPanelOpen(true)}
        isBotLive={botStatus.isLive}
        isOpen={isChannelSidebarOpen}
        onClose={() => setIsChannelSidebarOpen(false)}
      />

      {/* 3. Main Center Chat View */}
      <div className="flex flex-col flex-1 min-w-0 h-full overflow-hidden relative">
        <DiscordChat
          channel={currentChannel}
          channels={currentServer?.channels || []}
          messages={currentMessages}
          currentUser={currentUser}
          botUser={botUser}
          isThinking={isThinking}
          onSendMessage={handleSendMessage}
          onExecuteCommand={handleExecuteCommand}
          onSendRift={handleSendRift}
          onToggleReaction={handleToggleReaction}
          onOpenSlashMenu={() => setIsSlashMenuOpen(true)}
          onOpenControlPanel={() => setIsControlPanelOpen(true)}
          onOpenExportModal={() => setIsExportModalOpen(true)}
          onToggleMembers={() => setShowMembers((prev) => !prev)}
          showMembers={showMembers}
          botConfig={botConfig}
          isBotLive={botStatus.isLive}
          onToggleChannelSidebar={() => setIsChannelSidebarOpen((prev) => !prev)}
          isChannelSidebarOpen={isChannelSidebarOpen}
        />

        {/* Bottom Gateway & AI Console Drawer */}
        <LiveConsoleDrawer
          isOpen={isConsoleOpen}
          onClose={() => setIsConsoleOpen(false)}
          logs={consoleLogs}
          onClearLogs={() => setConsoleLogs([])}
        />
      </div>

      {/* 4. Guild Member List (Right) */}
      {showMembers && (
        <DiscordMemberList
          members={botStatus.isLive && currentServer?.members?.length ? currentServer.members : members}
          onSelectMember={(m) => {
            if (m.bot) {
              setIsControlPanelOpen(true);
            }
          }}
        />
      )}

      {/* Modals */}
      <BotControlPanel
        isOpen={isControlPanelOpen}
        onClose={() => setIsControlPanelOpen(false)}
        config={botConfig}
        onUpdateConfig={setBotConfig}
        botStatus={botStatus}
        onStartLiveBot={handleStartLiveBot}
        onStopLiveBot={handleStopLiveBot}
        onSendWebhook={handleSendWebhook}
      />

      <BotCodeExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        config={botConfig}
      />

      <SlashCommandMenu
        isOpen={isSlashMenuOpen}
        onClose={() => setIsSlashMenuOpen(false)}
        onExecuteCommand={handleExecuteCommand}
      />
    </div>
  );
}
