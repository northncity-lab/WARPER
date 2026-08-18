import { RiftTier, RiftTierInfo, DiscordEmbed, DiscordActionRow } from '../types';

export const RIFT_TIERS: Record<RiftTier, RiftTierInfo> = {
  c: {
    tier: 'c',
    type: 'coin',
    stars: 1,
    label: '★ 1x Coin Rift (@c)',
    rolePing: '@c',
    color: '#FEE75C', // Gold / Yellow
    emoji: '🪙',
    rewardDesc: 'Single Coin Rift • Standar reward koin',
  },
  cc: {
    tier: 'cc',
    type: 'coin',
    stars: 2,
    label: '★★ 2x Coin Rift (@cc)',
    rolePing: '@cc',
    color: '#F1C40F',
    emoji: '🪙🪙',
    rewardDesc: 'Double Coin Rift • 2x Koin berlimpah',
  },
  ccc: {
    tier: 'ccc',
    type: 'coin',
    stars: 3,
    label: '★★★ 3x Coin Rift (@ccc)',
    rolePing: '@ccc',
    color: '#E67E22',
    emoji: '🪙🪙🪙',
    rewardDesc: 'Triple Coin Rift • Maksimal Koin!',
  },
  d: {
    tier: 'd',
    type: 'diamond',
    stars: 1,
    label: '★ 1x Diamond Rift (@d)',
    rolePing: '@d',
    color: '#00F0FF', // Cyan / Diamond
    emoji: '💎',
    rewardDesc: 'Single Diamond / Spin Rift • Hadiah Spin & Berlian',
  },
  dd: {
    tier: 'dd',
    type: 'diamond',
    stars: 2,
    label: '★★ 2x Diamond Rift (@dd)',
    rolePing: '@dd',
    color: '#5865F2',
    emoji: '💎💎',
    rewardDesc: 'Double Diamond Rift • 2x Spin & Diamond',
  },
  ddd: {
    tier: 'ddd',
    type: 'diamond',
    stars: 3,
    label: '★★★ 3x Diamond Rift (@ddd)',
    rolePing: '@ddd',
    color: '#EB459E', // Pink / Magenta
    emoji: '💎💎💎',
    rewardDesc: 'Triple Diamond Rift • JACKPOT Spin & Berlian Langka!',
  },
};

export const HH_LOCATIONS = [
  { id: 'relax', name: 'Relax', icon: '🛋️', desc: 'Tempat Santai / Relaxation Lounge' },
  { id: 'beach', name: 'Beach', icon: '🏖️', desc: 'Pantai Hotel Hideaway' },
  { id: 'pool', name: 'Pool', icon: '🏊', desc: 'Kolam Renang Utama' },
  { id: 'rooftop', name: 'Rooftop', icon: '🌆', desc: 'Atap Hotel / Sky Lounge' },
  { id: 'lobby', name: 'Lobby', icon: '🏨', desc: 'Main Lobby & Reception' },
  { id: 'promenade', name: 'Promenade', icon: '🌴', desc: 'Jalan Tepi Pantai' },
  { id: 'nightclub', name: 'Nightclub', icon: '🪩', desc: 'Velvet Lounge / Club Malam' },
  { id: 'spa', name: 'Spa & Sauna', icon: '🧖', desc: 'Area Relaksasi & Spa' },
  { id: 'oasis', name: 'Oasis', icon: '🌺', desc: 'Taman Oasis Luar' },
  { id: 'fusion', name: 'Fusion Room', icon: '⚡', desc: 'Ruangan Fusion & Spinner' },
];

/**
 * Generate rich Discord embed for Hotel Hideaway Rift announcement
 */
export function buildRiftAnnouncementEmbed(params: {
  tier: RiftTier;
  location: string;
  reportedBy: string;
  notes?: string;
  durationMinutes?: number;
}): { text: string; embed: DiscordEmbed } {
  const info = RIFT_TIERS[params.tier] || RIFT_TIERS.c;
  const duration = params.durationMinutes || 12;
  const locationObj = HH_LOCATIONS.find(
    (l) => l.name.toLowerCase() === params.location.toLowerCase() || l.id === params.location.toLowerCase()
  );
  const locationDisplay = locationObj ? `${locationObj.icon} ${locationObj.name} (${locationObj.desc})` : `📍 ${params.location}`;

  const starIcons = '⭐'.repeat(info.stars);
  const titleText = `${info.emoji} HOTEL HIDEAWAY: ${info.type === 'coin' ? 'COIN RIFT' : 'DIAMOND RIFT'} ACTIVE!`;

  const textPing = `📢 **PING RIFT NOTIFICATION** ➜ <@&${info.rolePing}> | Role Ping: **\`${info.rolePing}\`**\n` +
    `🌀 **Retakan Dimensi sedang berlangsung di in-game sekarang! Segera merapat ke ${params.location}!**`;

  const embed: DiscordEmbed = {
    title: titleText,
    description: `Sebuah **${info.label}** telah ditemukan dan sedang terbuka di Hotel Hideaway! Seluruh player dengan role **\`${info.rolePing}\`** dipanggil untuk memanen reward bersama.`,
    color: info.color,
    fields: [
      {
        name: '📍 Lokasi / Ruangan In-Game',
        value: `**${locationDisplay}**`,
        inline: true,
      },
      {
        name: '⭐ Tingkat / Kelangkaan',
        value: `**${starIcons} (${info.stars} Star)**\n\`${info.rewardDesc}\``,
        inline: true,
      },
      {
        name: '⏳ Perkiraan Durasi',
        value: `**~${duration} Menit** *(Sedang Berlangsung)*\n⏱️ Segera masuk room sebelum rift hilang!`,
        inline: false,
      },
      {
        name: '👤 Dilaporkan Oleh',
        value: `**${params.reportedBy}** *(Role: Ping Rift / Staff)*`,
        inline: true,
      },
      {
        name: '🎯 Role Pinged',
        value: `\`${info.rolePing}\``,
        inline: true,
      },
    ],
    footer: {
      text: 'WARPER Hotel Hideaway Rift Dispatcher • Real-time Dimension Tracker',
      icon_url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=80&auto=format&fit=crop&q=80',
    },
    timestamp: new Date().toISOString(),
  };

  if (params.notes && params.notes.trim()) {
    embed.fields?.push({
      name: '📝 Catatan Tambahan',
      value: params.notes.trim(),
      inline: false,
    });
  }

  return { text: textPing, embed };
}

/**
 * Generate Staff Control Panel message components for #staff-only
 */
export function buildStaffRiftPanelComponents(selectedTier: RiftTier = 'c', selectedLoc: string = 'Relax'): DiscordActionRow[] {
  return [
    {
      components: [
        {
          customId: 'rift_tier_c',
          label: '@c (★1 Coin)',
          style: selectedTier === 'c' ? 'success' : 'secondary',
          emoji: '🪙',
        },
        {
          customId: 'rift_tier_cc',
          label: '@cc (★2 Coin)',
          style: selectedTier === 'cc' ? 'success' : 'secondary',
          emoji: '🪙',
        },
        {
          customId: 'rift_tier_ccc',
          label: '@ccc (★3 Coin)',
          style: selectedTier === 'ccc' ? 'success' : 'secondary',
          emoji: '🪙',
        },
      ],
    },
    {
      components: [
        {
          customId: 'rift_tier_d',
          label: '@d (★1 Diamond)',
          style: selectedTier === 'd' ? 'primary' : 'secondary',
          emoji: '💎',
        },
        {
          customId: 'rift_tier_dd',
          label: '@dd (★2 Diamond)',
          style: selectedTier === 'dd' ? 'primary' : 'secondary',
          emoji: '💎',
        },
        {
          customId: 'rift_tier_ddd',
          label: '@ddd (★3 Diamond)',
          style: selectedTier === 'ddd' ? 'primary' : 'secondary',
          emoji: '💎',
        },
      ],
    },
    {
      components: [
        {
          customId: 'rift_loc_Relax',
          label: '🛋️ Relax',
          style: selectedLoc.toLowerCase() === 'relax' ? 'primary' : 'secondary',
        },
        {
          customId: 'rift_loc_Beach',
          label: '🏖️ Beach',
          style: selectedLoc.toLowerCase() === 'beach' ? 'primary' : 'secondary',
        },
        {
          customId: 'rift_loc_Pool',
          label: '🏊 Pool',
          style: selectedLoc.toLowerCase() === 'pool' ? 'primary' : 'secondary',
        },
        {
          customId: 'rift_loc_Rooftop',
          label: '🌆 Rooftop',
          style: selectedLoc.toLowerCase() === 'rooftop' ? 'primary' : 'secondary',
        },
        {
          customId: 'rift_loc_Lobby',
          label: '🏨 Lobby',
          style: selectedLoc.toLowerCase() === 'lobby' ? 'primary' : 'secondary',
        },
      ],
    },
    {
      components: [
        {
          customId: `rift_send_${selectedTier}_${selectedLoc}`,
          label: `📢 Kirim Ping ${RIFT_TIERS[selectedTier].rolePing} di ${selectedLoc}!`,
          style: 'success',
          emoji: '🚀',
        },
        {
          customId: 'rift_action_custom',
          label: 'Lokasi Lain...',
          style: 'secondary',
          emoji: '🗺️',
        },
      ],
    },
  ];
}
