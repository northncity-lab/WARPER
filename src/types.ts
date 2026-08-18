export interface DiscordUser {
  id: string;
  username: string;
  displayName: string;
  avatar: string;
  bot?: boolean;
  role?: string;
  roleColor?: string;
  status: 'online' | 'idle' | 'dnd' | 'offline';
  activity?: string;
}

export interface DiscordEmbedField {
  name: string;
  value: string;
  inline?: boolean;
}

export interface DiscordEmbed {
  title?: string;
  description?: string;
  color?: string; // Hex color string, e.g. '#5865F2'
  fields?: DiscordEmbedField[];
  author?: {
    name: string;
    icon_url?: string;
    url?: string;
  };
  footer?: {
    text: string;
    icon_url?: string;
  };
  thumbnail?: {
    url: string;
  };
  image?: {
    url: string;
  };
  timestamp?: string;
}

export interface DiscordReaction {
  emoji: string;
  count: number;
  users: string[]; // user ids
}

export type DiscordButtonStyle = 'primary' | 'secondary' | 'success' | 'danger';

export interface DiscordButtonComponent {
  type?: 'button';
  customId: string;
  label: string;
  style: DiscordButtonStyle;
  emoji?: string;
  disabled?: boolean;
}

export interface DiscordSelectOption {
  label: string;
  value: string;
  emoji?: string;
  description?: string;
}

export interface DiscordSelectMenuComponent {
  type: 'select';
  customId: string;
  placeholder?: string;
  options: DiscordSelectOption[];
  disabled?: boolean;
}

export type DiscordComponent = DiscordButtonComponent | DiscordSelectMenuComponent;

export interface DiscordActionRow {
  components: DiscordComponent[];
}

export type RiftTier = 'c' | 'cc' | 'ccc' | 'd' | 'dd' | 'ddd';

export interface RiftTierInfo {
  tier: RiftTier;
  type: 'coin' | 'diamond';
  stars: number;
  label: string;
  rolePing: string;
  color: string;
  emoji: string;
  rewardDesc: string;
}

export interface RiftAnnouncement {
  id: string;
  tier: RiftTier;
  location: string;
  reportedBy: string;
  notes?: string;
  timestamp: string;
  createdAt: number;
  expiresAt: number; // ms
  targetChannelId?: string;
}

export interface DiscordMessage {
  id: string;
  channelId: string;
  author: DiscordUser;
  content: string;
  timestamp: string;
  embeds?: DiscordEmbed[];
  reactions?: DiscordReaction[];
  components?: DiscordActionRow[];
  replyTo?: {
    id: string;
    authorName: string;
    content: string;
  };
  commandName?: string;
  isThinking?: boolean;
  flaggedToxicity?: boolean;
  toxicityReason?: string;
}

export interface DiscordRole {
  id: string;
  name: string;
  color?: string;
  isEveryone?: boolean;
  isHere?: boolean;
  mentionable?: boolean;
  position?: number;
}

export interface MentionCandidate {
  id: string;
  name: string;
  type: 'role' | 'user' | 'special';
  displayName?: string;
  color?: string;
  avatar?: string;
  isBot?: boolean;
  mentionText: string;
}

export interface DiscordChannel {
  id: string;
  name: string;
  topic?: string;
  type?: 'text' | 'voice' | 'announcement';
  unreadCount?: number;
  isLiveDiscord?: boolean;
  roles?: DiscordRole[];
}

export interface DiscordServer {
  id: string;
  name: string;
  icon: string;
  unread?: boolean;
  isLiveDiscord?: boolean;
  memberCount?: number;
  channels: DiscordChannel[];
}

export interface SlashCommandDef {
  name: string;
  description: string;
  category: 'AI Core' | 'Utilities' | 'Moderation' | 'Fun & Games' | 'Server';
  usage: string;
  examples: string[];
}

export interface BotConfig {
  name: string;
  avatarUrl: string;
  prefix: string;
  personality: string;
  customPrompt: string;
  statusText?: string;
  autoModeration: boolean;
  autoWelcome: boolean;
  responseStyle: 'standard' | 'embed_only' | 'concise' | 'detailed';
  discordToken?: string;
  webhookUrl?: string;
}

export interface BotStatus {
  isLive: boolean;
  connectedGuilds: number;
  pingMs: number;
  uptimeSeconds: number;
  totalCommandsProcessed: number;
  totalAiTokens: number;
  botTag?: string;
}

export interface ConsoleLog {
  id: string;
  timestamp: string;
  level: 'info' | 'warn' | 'error' | 'success' | 'ai';
  message: string;
}
