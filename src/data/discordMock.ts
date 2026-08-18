import { DiscordServer, DiscordUser, DiscordMessage, SlashCommandDef, BotConfig } from '../types';

export const WARPER_BOT_USER: DiscordUser = {
  id: 'warper-bot-id',
  username: 'WARPER',
  displayName: 'WARPER [AI]',
  avatar: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150&auto=format&fit=crop&q=80',
  bot: true,
  role: '⚡ WARPER CORE',
  roleColor: '#00F0FF',
  status: 'online',
  activity: 'Playing /warper ask | ⚡ WARPER',
};

export const CURRENT_USER: DiscordUser = {
  id: 'user-master-id',
  username: 'CaptainQuantum',
  displayName: 'Captain Quantum',
  avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
  bot: false,
  role: '👑 Server Owner',
  roleColor: '#FEE75C',
  status: 'online',
  activity: 'Building Discord bots 🚀',
};

export const MOCK_USERS: DiscordUser[] = [
  WARPER_BOT_USER,
  CURRENT_USER,
  {
    id: 'user-2',
    username: 'LunaTech',
    displayName: 'Luna 🌙',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    bot: false,
    role: '🛡️ Moderator',
    roleColor: '#5865F2',
    status: 'idle',
    activity: 'Listening to Spotify',
  },
  {
    id: 'user-3',
    username: 'ByteGamer_99',
    displayName: 'ByteGamer 🎮',
    avatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150&auto=format&fit=crop&q=80',
    bot: false,
    role: '🌟 Elite Member',
    roleColor: '#57F287',
    status: 'dnd',
    activity: 'Playing Cyberpunk 2077',
  },
  {
    id: 'user-4',
    username: 'NovaCoder',
    displayName: 'Nova [Dev]',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    bot: false,
    role: '💻 Developer',
    roleColor: '#EB459E',
    status: 'online',
    activity: 'Coding TypeScript',
  },
  {
    id: 'user-5',
    username: 'Aria_Indo',
    displayName: 'Aria Santoso',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    bot: false,
    role: '🌟 Member',
    roleColor: '#99AAB5',
    status: 'offline',
  },
];

export const INITIAL_SERVERS: DiscordServer[] = [
  {
    id: 'server-hh',
    name: 'Hotel Hideaway Indo',
    icon: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=150&auto=format&fit=crop&q=80',
    memberCount: 480,
    channels: [
      {
        id: 'c-staff-only',
        name: 'staff-only',
        type: 'text',
        topic: 'Channel khusus Staff Ping Rift untuk memicu tombol ping @c, @cc, @ccc, @d, @dd, @ddd',
      },
      {
        id: 'c-rift-announcements',
        name: 'rift-announcements',
        type: 'text',
        topic: 'Pengumuman retakan dimensi real-time Hotel Hideaway (@Role Ping)',
      },
      {
        id: 'c-general',
        name: 'general',
        type: 'text',
        topic: 'Obrolan umum komunitas player Hotel Hideaway & WARPER AI',
      },
      {
        id: 'c-bot-commands',
        name: 'bot-commands',
        type: 'text',
        topic: 'Gunakan command /warper rift, /ask, /clear, dll.',
      },
    ],
  },
];

export const INITIAL_MESSAGES: Record<string, DiscordMessage[]> = {
  'c-staff-only': [
    {
      id: 'm-staff-welcome',
      channelId: 'c-staff-only',
      author: WARPER_BOT_USER,
      content: '🌀 **HOTEL HIDEAWAY: PANEL PING RIFT STAFF**',
      timestamp: '10:00 AM',
      embeds: [
        {
          title: '🌀 Hotel Hideaway Rift Dispatcher Panel',
          description:
            'Halo Player / Staff bertugas dengan **Role: Ping Rift**! Jika Anda melihat Rift sedang berlangsung di in-game, silakan klik tombol Tier (@Role) dan Ruangan di bawah ini untuk menyiarkan pengumuman real-time ke seluruh player!',
          color: '#5865F2',
          fields: [
            {
              name: '🪙 Coin Rifts (Koin)',
              value: '`@c` (★1 Koin) • `@cc` (★2 Koin) • `@ccc` (★3 Koin Max)',
              inline: true,
            },
            {
              name: '💎 Diamond Rifts (Berlian / Spin)',
              value: '`@d` (★1 Spin) • `@dd` (★2 Diamond) • `@ddd` (★3 Jackpot)',
              inline: true,
            },
            {
              name: '📍 Lokasi Populer In-Game',
              value: '`🛋️ Relax` • `🏖️ Beach` • `🏊 Pool` • `🌆 Rooftop` • `🏨 Lobby`',
              inline: false,
            },
          ],
          footer: {
            text: 'WARPER Hotel Hideaway Dispatcher • Khusus Staff / Role Ping Rift',
          },
        },
      ],
      components: [
        {
          components: [
            { customId: 'rift_tier_c', label: '@c (★1 Coin)', style: 'secondary', emoji: '🪙' },
            { customId: 'rift_tier_cc', label: '@cc (★2 Coin)', style: 'secondary', emoji: '🪙' },
            { customId: 'rift_tier_ccc', label: '@ccc (★3 Coin)', style: 'success', emoji: '🪙' },
          ],
        },
        {
          components: [
            { customId: 'rift_tier_d', label: '@d (★1 Diamond)', style: 'secondary', emoji: '💎' },
            { customId: 'rift_tier_dd', label: '@dd (★2 Diamond)', style: 'secondary', emoji: '💎' },
            { customId: 'rift_tier_ddd', label: '@ddd (★3 Diamond)', style: 'primary', emoji: '💎' },
          ],
        },
        {
          components: [
            { customId: 'rift_loc_Relax', label: '🛋️ Relax', style: 'primary' },
            { customId: 'rift_loc_Beach', label: '🏖️ Beach', style: 'secondary' },
            { customId: 'rift_loc_Pool', label: '🏊 Pool', style: 'secondary' },
            { customId: 'rift_loc_Rooftop', label: '🌆 Rooftop', style: 'secondary' },
            { customId: 'rift_loc_Lobby', label: '🏨 Lobby', style: 'secondary' },
          ],
        },
        {
          components: [
            {
              customId: 'rift_send_ccc_Relax',
              label: '📢 Kirim Ping @ccc di Relax!',
              style: 'success',
              emoji: '🚀',
            },
            {
              customId: 'rift_action_custom',
              label: 'Buka Menu Lengkap...',
              style: 'secondary',
              emoji: '🗺️',
            },
          ],
        },
      ],
    },
  ],
  'c-rift-announcements': [
    {
      id: 'm-sample-rift',
      channelId: 'c-rift-announcements',
      author: WARPER_BOT_USER,
      content:
        '📢 **PING RIFT NOTIFICATION** ➜ <@&@ccc> | Role Ping: **`@ccc`**\n🌀 **Retakan Dimensi sedang berlangsung di in-game sekarang! Segera merapat ke Relax!**',
      timestamp: '10:05 AM',
      embeds: [
        {
          title: '🪙 HOTEL HIDEAWAY: COIN RIFT ACTIVE!',
          description:
            'Sebuah **★★★ 3x Coin Rift (@ccc)** telah ditemukan dan sedang terbuka di Hotel Hideaway! Seluruh player dengan role **`@ccc`** dipanggil untuk memanen reward bersama.',
          color: '#E67E22',
          fields: [
            {
              name: '📍 Lokasi / Ruangan In-Game',
              value: '🛋️ **Relax** (Tempat Santai / Relaxation Lounge)',
              inline: true,
            },
            {
              name: '⭐ Tingkat / Kelangkaan',
              value: '⭐⭐⭐ **(3 Star)**\n`Triple Coin Rift • Maksimal Koin!`',
              inline: true,
            },
            {
              name: '⏳ Perkiraan Durasi',
              value: '**~12 Menit** *(Sedang Berlangsung)*\n⏱️ Segera masuk room sebelum rift hilang!',
              inline: false,
            },
            {
              name: '👤 Dilaporkan Oleh',
              value: '**Captain Quantum** *(Role: Ping Rift / Staff)*',
              inline: true,
            },
            {
              name: '🎯 Role Pinged',
              value: '`@ccc`',
              inline: true,
            },
          ],
          footer: {
            text: 'WARPER Hotel Hideaway Rift Dispatcher • Real-time Dimension Tracker',
          },
        },
      ],
    },
  ],
};


export const SLASH_COMMANDS: SlashCommandDef[] = [
  {
    name: 'ask',
    description: 'Tanya apa saja kepada WARPER dengan penalaran AI cerdas Gemini',
    category: 'AI Core',
    usage: '/warper ask prompt:<teks pertanyaan> [mode:creative|strict|analyst]',
    examples: ['/warper ask prompt:"Jelaskan quantum computing secara analogi sederhana"', '/warper ask prompt:"Tips push rank Valorant"'],
  },
  {
    name: 'code',
    description: 'Tulis, debug, atau jelaskan kode pemrograman dalam berbagai bahasa',
    category: 'AI Core',
    usage: '/warper code language:<bahasa> task:<tugas / problem>',
    examples: ['/warper code language:"Python" task:"Script scraping web dengan async aiohttp"', '/warper code language:"React" task:"Custom hook useLocalStorage"'],
  },
  {
    name: 'summarize',
    description: 'Rangkum artikel, teks panjang, atau diskusi menjadi poin ringkas',
    category: 'AI Core',
    usage: '/warper summarize text:<teks panjang>',
    examples: ['/warper summarize text:"Paste artikel panjang di sini..."'],
  },
  {
    name: 'translate',
    description: 'Terjemahkan teks ke bahasa asing dengan tata bahasa natural',
    category: 'AI Core',
    usage: '/warper translate target:<bahasa> text:<kalimat>',
    examples: ['/warper translate target:"Japanese" text:"Selamat datang di server Discord kami!"', '/warper translate target:"English" text:"Besok kita meeting jam 2 siang"'],
  },
  {
    name: 'rift',
    description: 'Hotel Hideaway: Kirim announcement / ping role rift (@c, @cc, @ccc, @d, @dd, @ddd) atau buka panel staf',
    category: 'Utilities',
    usage: '/warper rift [panel|c|cc|ccc|d|dd|ddd] [location:Relax|Beach|Pool|Rooftop|Lobby|...] [notes:...]',
    examples: [
      '/warper rift panel',
      '/warper rift tier:ccc location:Relax',
      '/warper rift tier:ddd location:Beach notes:"Rift dekat mercusuar"',
      '/rift ccc Relax',
    ],
  },
  {
    name: 'clear',
    description: 'Hapus dan bersihkan seluruh pesan/chat yang ada di channel ini',
    category: 'Moderation',
    usage: '/warper clear [amount:1-100]',
    examples: ['/warper clear', '/warper clear amount:50', '/clear'],
  },
  {
    name: 'poll',
    description: 'Buat voting/polling interaktif lengkap dengan emoji reactions',
    category: 'Utilities',
    usage: '/warper poll question:<pertanyaan> options:<opsi1, opsi2, ...>',
    examples: ['/warper poll question:"Game apa selanjutnya?" options:"Valorant, Genshin, Apex"'],
  },
  {
    name: 'automod',
    description: 'Cek tingkat keamanan pesan / teks terhadap toxic, spam, atau scam',
    category: 'Moderation',
    usage: '/warper automod check:<teks yang ingin diuji>',
    examples: ['/warper automod check:"Klik link ini dapat nitro gratis http://fake.io"'],
  },
  {
    name: 'dice',
    description: 'Lempar dadu (D6, D20, D100) atau koin untuk game roleplay',
    category: 'Fun & Games',
    usage: '/warper dice [sides:6|20|100]',
    examples: ['/warper dice sides:20', '/warper dice sides:6'],
  },
  {
    name: 'serverinfo',
    description: 'Tampilkan statistik lengkap status server dan anggota',
    category: 'Server',
    usage: '/warper serverinfo',
    examples: ['/warper serverinfo'],
  },
  {
    name: 'botstatus',
    description: 'Lihat status performa bot, uptime, memory, dan latency Gemini AI',
    category: 'Server',
    usage: '/warper botstatus',
    examples: ['/warper botstatus'],
  },
];

export const DEFAULT_BOT_CONFIG: BotConfig = {
  name: 'WARPER',
  avatarUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150&auto=format&fit=crop&q=80',
  prefix: '!w',
  personality: 'Futuristic Cyber-AI Assistant: Cerdas, responsif, ramah, berwawasan luas, menyukai analogi teknologi, menggunakan formatting Markdown & Discord Embeds yang estetik.',
  customPrompt: 'Kamu adalah WARPER, bot Discord AI canggih. Kamu selalu memberikan jawaban yang akurat, terstruktur, ramah, dan bila relevan sertakan tips tambahan atau format embed yang menarik.',
  statusText: '/warper ask | ⚡ WARPER',
  autoModeration: true,
  autoWelcome: true,
  responseStyle: 'standard',
};
