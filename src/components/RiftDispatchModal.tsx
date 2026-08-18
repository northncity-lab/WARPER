import React, { useState } from 'react';
import { X, Sparkles, MapPin, Send, Flame, Zap, Shield, HelpCircle } from 'lucide-react';
import { RiftTier, DiscordChannel } from '../types';
import { RIFT_TIERS, HH_LOCATIONS, buildRiftAnnouncementEmbed } from '../data/riftData';

interface RiftDispatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  channels: DiscordChannel[];
  currentChannelId: string;
  onSendRift: (tier: RiftTier, location: string, targetChannelId: string, notes?: string) => void;
  senderName: string;
}

export const RiftDispatchModal: React.FC<RiftDispatchModalProps> = ({
  isOpen,
  onClose,
  channels,
  currentChannelId,
  onSendRift,
  senderName,
}) => {
  const [selectedTier, setSelectedTier] = useState<RiftTier>('ccc');
  const [selectedLocation, setSelectedLocation] = useState<string>('Relax');
  const [customLocation, setCustomLocation] = useState<string>('');
  const [targetChannel, setTargetChannel] = useState<string>(() => {
    // Prefer announcement or rift channel, fallback to currentChannelId
    const riftChan = channels.find(
      (c) => c.name.toLowerCase().includes('rift') || c.name.toLowerCase().includes('announc')
    );
    return riftChan?.id || currentChannelId;
  });
  const [notes, setNotes] = useState<string>('');

  if (!isOpen) return null;

  const finalLocation = customLocation.trim() || selectedLocation;
  const currentTierInfo = RIFT_TIERS[selectedTier];
  const preview = buildRiftAnnouncementEmbed({
    tier: selectedTier,
    location: finalLocation,
    reportedBy: senderName,
    notes: notes,
  });

  const handleDispatch = () => {
    onSendRift(selectedTier, finalLocation, targetChannel, notes);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
      <div className="bg-[#313338] border border-[#202225] rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-[#202225] flex items-center justify-between bg-[#2B2D31]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#5865F2]/20 border border-[#5865F2]/40 text-[#5865F2] flex items-center justify-center shadow-inner">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white leading-tight">Hotel Hideaway Rift Dispatcher</h2>
                <span className="px-2 py-0.5 rounded-full bg-[#23A55A]/20 text-[#57F287] text-[10px] font-bold border border-[#23A55A]/40">
                  REAL-TIME PING
                </span>
              </div>
              <p className="text-xs text-[#949BA4]">
                Kirim pengumuman retakan dimensi & ping role (Role Ping Rift) secara instan.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-[#949BA4] hover:text-white hover:bg-[#35373C] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Content */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5 flex-1 custom-scrollbar">
          {/* Step 1: Select Rift Tier & Type */}
          <div>
            <label className="block text-xs font-bold text-[#DBDEE1] uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-[#FEE75C]" />
              1. Pilih Tipe & Tier Rift (@Role Ping)
            </label>

            {/* Coin Rifts */}
            <div className="mb-3">
              <div className="text-[11px] font-semibold text-[#949BA4] mb-1.5 flex items-center gap-1">
                <span>🪙 Coin Rifts (Koin):</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {(['c', 'cc', 'ccc'] as RiftTier[]).map((t) => {
                  const info = RIFT_TIERS[t];
                  const isSelected = selectedTier === t;
                  return (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setSelectedTier(t)}
                      className={`p-3 rounded-xl border flex flex-col items-center text-center transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-[#FEE75C]/15 border-[#FEE75C] text-white shadow-md ring-1 ring-[#FEE75C]'
                          : 'bg-[#2B2D31] border-[#202225] text-[#DBDEE1] hover:bg-[#35373C]'
                      }`}
                    >
                      <span className="text-lg font-black tracking-wider text-[#FEE75C]">{info.rolePing}</span>
                      <span className="text-xs font-bold mt-0.5">
                        {'⭐'.repeat(info.stars)}
                      </span>
                      <span className="text-[10px] text-[#949BA4] mt-1 line-clamp-1">{info.type === 'coin' ? 'Coin' : 'Diamond'}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Diamond Rifts */}
            <div>
              <div className="text-[11px] font-semibold text-[#949BA4] mb-1.5 flex items-center gap-1">
                <span>💎 Diamond & Spin Rifts (Berlian):</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {(['d', 'dd', 'ddd'] as RiftTier[]).map((t) => {
                  const info = RIFT_TIERS[t];
                  const isSelected = selectedTier === t;
                  return (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setSelectedTier(t)}
                      className={`p-3 rounded-xl border flex flex-col items-center text-center transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-[#00F0FF]/15 border-[#00F0FF] text-white shadow-md ring-1 ring-[#00F0FF]'
                          : 'bg-[#2B2D31] border-[#202225] text-[#DBDEE1] hover:bg-[#35373C]'
                      }`}
                    >
                      <span className="text-lg font-black tracking-wider text-[#00F0FF]">{info.rolePing}</span>
                      <span className="text-xs font-bold mt-0.5">
                        {'⭐'.repeat(info.stars)}
                      </span>
                      <span className="text-[10px] text-[#949BA4] mt-1 line-clamp-1">Diamond / Spin</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Step 2: Select Location in Hotel Hideaway */}
          <div>
            <label className="block text-xs font-bold text-[#DBDEE1] uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-[#57F287]" />
              2. Pilih Lokasi / Ruangan In-Game
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mb-2">
              {HH_LOCATIONS.map((loc) => {
                const isSelected = !customLocation && selectedLocation === loc.name;
                return (
                  <button
                    key={loc.id}
                    type="button"
                    onClick={() => {
                      setSelectedLocation(loc.name);
                      setCustomLocation('');
                    }}
                    className={`px-3 py-2 rounded-lg border text-left transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[#5865F2]/20 border-[#5865F2] text-white shadow-sm'
                        : 'bg-[#2B2D31] border-[#202225] text-[#DBDEE1] hover:bg-[#35373C]'
                    }`}
                  >
                    <div className="text-base">{loc.icon}</div>
                    <div className="text-xs font-bold truncate">{loc.name}</div>
                  </button>
                );
              })}
            </div>

            {/* Custom Location input */}
            <input
              type="text"
              value={customLocation}
              onChange={(e) => setCustomLocation(e.target.value)}
              placeholder="Atau ketik lokasi lain (contoh: Rooftop Belakang, Spa Lantai 2)..."
              className="w-full px-3.5 py-2 rounded-lg bg-[#1E1F22] border border-[#202225] text-white text-xs placeholder-[#80848E] focus:outline-none focus:border-[#5865F2]"
            />
          </div>

          {/* Step 3: Target Channel & Additional Notes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-[#DBDEE1] uppercase tracking-wider mb-1.5">
                Channel Target Broadcast
              </label>
              <select
                value={targetChannel}
                onChange={(e) => setTargetChannel(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-[#1E1F22] border border-[#202225] text-white text-xs focus:outline-none focus:border-[#5865F2] cursor-pointer"
              >
                {channels.map((c) => (
                  <option key={c.id} value={c.id}>
                    #{c.name} {c.isLiveDiscord ? '(Discord Live)' : ''}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#DBDEE1] uppercase tracking-wider mb-1.5">
                Catatan Tambahan (Opsional)
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Contoh: Baru spawn 1 menit lalu, ramai player!"
                className="w-full px-3.5 py-2 rounded-lg bg-[#1E1F22] border border-[#202225] text-white text-xs placeholder-[#80848E] focus:outline-none focus:border-[#5865F2]"
              />
            </div>
          </div>

          {/* Live Preview Card */}
          <div className="p-3.5 rounded-xl bg-[#2B2D31] border border-[#202225]">
            <div className="text-[11px] font-bold text-[#949BA4] uppercase mb-2 flex items-center gap-1">
              <span>Preview Pesan yang Akan Dikirim:</span>
            </div>
            <div className="text-xs text-[#57F287] font-semibold mb-2 bg-[#1E1F22] p-2 rounded-md border border-[#202225]">
              {preview.text}
            </div>
            <div
              className="p-3 rounded-lg border-l-4 bg-[#1E1F22] text-xs space-y-1.5 shadow-sm"
              style={{ borderColor: preview.embed.color }}
            >
              <div className="font-bold text-white text-sm">{preview.embed.title}</div>
              <p className="text-[#DBDEE1] text-[11px]">{preview.embed.description}</p>
              <div className="grid grid-cols-2 gap-2 pt-1 border-t border-[#35373C] text-[11px]">
                {preview.embed.fields?.map((f, i) => (
                  <div key={i} className={f.inline ? '' : 'col-span-2'}>
                    <span className="text-[#949BA4] font-semibold block">{f.name}</span>
                    <span className="text-white whitespace-pre-line">{f.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Footer Buttons */}
        <div className="p-4 border-t border-[#202225] bg-[#2B2D31] flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-[#35373C] hover:bg-[#404249] text-white text-xs font-semibold cursor-pointer transition-colors"
          >
            Batal
          </button>

          <button
            type="button"
            onClick={handleDispatch}
            className="px-6 py-2.5 rounded-lg bg-[#5865F2] hover:bg-[#4752C4] text-white text-xs font-bold flex items-center gap-2 shadow-lg cursor-pointer transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <Send className="w-4 h-4" />
            <span>Kirim Announcement Ping {currentTierInfo.rolePing} ({finalLocation})</span>
          </button>
        </div>
      </div>
    </div>
  );
};
