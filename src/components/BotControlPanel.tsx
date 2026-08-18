import React, { useState } from 'react';
import { BotConfig, BotStatus } from '../types';
import { X, Sparkles, Shield, Key, Send, Power, CheckCircle2, AlertTriangle, RefreshCw, Radio, Terminal, Cpu } from 'lucide-react';

interface BotControlPanelProps {
  isOpen: boolean;
  onClose: () => void;
  config: BotConfig;
  onUpdateConfig: (newConfig: BotConfig) => void;
  botStatus: BotStatus;
  onStartLiveBot: (token: string) => Promise<boolean>;
  onStopLiveBot: () => Promise<void>;
  onSendWebhook: (webhookUrl: string, content: string, embedTitle?: string) => Promise<boolean>;
  initialTab?: 'personality' | 'discord_gateway' | 'automod' | 'webhook';
}

export const BotControlPanel: React.FC<BotControlPanelProps> = ({
  isOpen,
  onClose,
  config,
  onUpdateConfig,
  botStatus,
  onStartLiveBot,
  onStopLiveBot,
  onSendWebhook,
  initialTab = 'discord_gateway',
}) => {
  const [activeTab, setActiveTab] = useState<'personality' | 'discord_gateway' | 'automod' | 'webhook'>(initialTab);
  const [tokenInput, setTokenInput] = useState(config.discordToken || '');
  const [webhookInput, setWebhookInput] = useState(config.webhookUrl || '');
  const [webhookMsg, setWebhookMsg] = useState('Halo dari WARPER AI Bot via Discord Webhook!');
  const [webhookTitle, setWebhookTitle] = useState('📢 Pengumuman Resmi WARPER AI');
  const [isConnecting, setIsConnecting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  if (!isOpen) return null;

  const PERSONA_PRESETS = [
    {
      id: 'cyber',
      name: 'Futuristic Cyber AI',
      desc: 'Cerdas, tech-savvy, menggunakan istilah teknologi masa depan & formatting rapi.',
      prompt: 'Kamu adalah WARPER, AI bot Discord super cerdas dari masa depan. Kamu selalu menjawab dengan presisi tinggi, terstruktur, ramah, dan solutif.',
    },
    {
      id: 'gamer',
      name: 'Gaming Guild Companion',
      desc: 'Santai, gaul, paham meta game (Valorant, Genshin, Minecraft), meme gaming & esports.',
      prompt: 'Kamu adalah WARPER, bot discord gaming yang asik, paham tips & trik game populer, santai, dan seru diajak ngobrol di server gaming.',
    },
    {
      id: 'dev',
      name: 'Senior Dev & Tech Mentor',
      desc: 'Fokus pada arsitektur software, clean code, debugging, performa, dan best practice.',
      prompt: 'Kamu adalah WARPER, Senior Full-Stack Architect & AI Developer bot. Berikan analisis kode mendalam, best practices, dan solusi clean code.',
    },
    {
      id: 'mod',
      name: 'Strict Server Guardian',
      desc: 'Menjaga ketertiban server, tegas, formal, dan fokus pada aturan & kenyamanan komunitas.',
      prompt: 'Kamu adalah WARPER, Server Guardian Bot. Jaga ketertiban, berikan panduan server yang tertib, dan deteksi potensi pelanggaran aturan.',
    },
  ];

  const handleApplyPersona = (preset: typeof PERSONA_PRESETS[0]) => {
    onUpdateConfig({
      ...config,
      personality: preset.name,
      customPrompt: preset.prompt,
    });
    setFeedback({ type: 'success', text: `Persona berhasil diubah menjadi: ${preset.name}` });
    setTimeout(() => setFeedback(null), 3000);
  };

  const handleToggleLiveGateway = async () => {
    setIsConnecting(true);
    setFeedback(null);
    try {
      if (botStatus.isLive) {
        await onStopLiveBot();
        setFeedback({ type: 'success', text: 'Live Discord Bot berhasil dimatikan.' });
      } else {
        if (!tokenInput.trim()) {
          setFeedback({ type: 'error', text: 'Silakan masukkan Discord Bot Token dari Discord Developer Portal.' });
          setIsConnecting(false);
          return;
        }
        const success = await onStartLiveBot(tokenInput);
        if (success) {
          onUpdateConfig({ ...config, discordToken: tokenInput });
          setFeedback({ type: 'success', text: '⚡ WARPER berhasil terhubung ke Gateway Discord asli!' });
        } else {
          setFeedback({ type: 'error', text: 'Gagal login. Pastikan Bot Token valid dan Intent Privileged aktif.' });
        }
      }
    } catch (e: any) {
      setFeedback({ type: 'error', text: e.message || 'Error connecting to Discord' });
    } finally {
      setIsConnecting(false);
    }
  };

  const handleTestWebhook = async () => {
    if (!webhookInput || !webhookInput.startsWith('https://discord.com/api/webhooks/')) {
      setFeedback({ type: 'error', text: 'URL Webhook harus berformat https://discord.com/api/webhooks/...' });
      return;
    }
    setFeedback(null);
    const success = await onSendWebhook(webhookInput, webhookMsg, webhookTitle);
    if (success) {
      onUpdateConfig({ ...config, webhookUrl: webhookInput });
      setFeedback({ type: 'success', text: '✅ Pesan embed berhasil dikirim ke channel Discord via Webhook!' });
    } else {
      setFeedback({ type: 'error', text: 'Gagal mengirim webhook. Cek URL Webhook Anda.' });
    }
    setTimeout(() => setFeedback(null), 4000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 animate-in fade-in">
      <div className="w-full max-w-3xl bg-[#313338] border border-[#202225] rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-[#2B2D31] border-b border-[#202225] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-[#5865F2] flex items-center justify-center text-white shadow-md">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white leading-tight flex items-center gap-2">
                WARPER Bot Control Hub
                {botStatus.isLive && (
                  <span className="text-[10px] bg-[#23A55A] text-white px-2 py-0.5 rounded-full font-bold uppercase">
                    Live Connected
                  </span>
                )}
              </h3>
              <p className="text-xs text-[#949BA4]">
                Konfigurasi kepribadian AI Gemini 3.7, Gateway Token, AutoMod, dan Webhooks
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-[#949BA4] hover:text-white p-1.5 rounded-md hover:bg-[#35373C] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-[#202225] bg-[#2B2D31] px-6 gap-2">
          <button
            onClick={() => setActiveTab('personality')}
            className={`py-3 px-3 text-xs font-bold border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'personality'
                ? 'border-[#5865F2] text-white'
                : 'border-transparent text-[#949BA4] hover:text-[#DBDEE1]'
            }`}
          >
            <Cpu className="w-4 h-4" />
            Kepribadian & Prompt AI
          </button>

          <button
            onClick={() => setActiveTab('discord_gateway')}
            className={`py-3 px-3 text-xs font-bold border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'discord_gateway'
                ? 'border-[#5865F2] text-white'
                : 'border-transparent text-[#949BA4] hover:text-[#DBDEE1]'
            }`}
          >
            <Radio className="w-4 h-4" />
            Live Discord Gateway
            {botStatus.isLive && <span className="w-2 h-2 rounded-full bg-[#23A55A] animate-pulse" />}
          </button>

          <button
            onClick={() => setActiveTab('automod')}
            className={`py-3 px-3 text-xs font-bold border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'automod'
                ? 'border-[#5865F2] text-white'
                : 'border-transparent text-[#949BA4] hover:text-[#DBDEE1]'
            }`}
          >
            <Shield className="w-4 h-4" />
            Auto-Moderation
          </button>

          <button
            onClick={() => setActiveTab('webhook')}
            className={`py-3 px-3 text-xs font-bold border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'webhook'
                ? 'border-[#5865F2] text-white'
                : 'border-transparent text-[#949BA4] hover:text-[#DBDEE1]'
            }`}
          >
            <Send className="w-4 h-4" />
            Discord Webhook Sender
          </button>
        </div>

        {/* Feedback Alert */}
        {feedback && (
          <div
            className={`px-6 py-2 text-xs font-semibold flex items-center gap-2 ${
              feedback.type === 'success'
                ? 'bg-[#23A55A]/20 text-[#57F287] border-b border-[#23A55A]/40'
                : 'bg-[#ED4245]/20 text-[#ED4245] border-b border-[#ED4245]/40'
            }`}
          >
            {feedback.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
            <span>{feedback.text}</span>
          </div>
        )}

        {/* Tab Contents */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {/* TAB 1: PERSONALITY */}
          {activeTab === 'personality' && (
            <div className="space-y-5">
              <div>
                <h4 className="text-sm font-bold text-white mb-1">Preset Gaya Karakter WARPER</h4>
                <p className="text-xs text-[#949BA4]">
                  Pilih arketipe respon agar WARPER berbicara sesuai nuansa server Discord Anda:
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {PERSONA_PRESETS.map((p) => (
                  <div
                    key={p.id}
                    onClick={() => handleApplyPersona(p)}
                    className="p-3.5 rounded-lg bg-[#2B2D31] border border-[#202225] hover:border-[#5865F2] cursor-pointer transition-all hover:bg-[#35373C] group"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-white group-hover:text-[#5865F2] transition-colors">
                        {p.name}
                      </span>
                      <Sparkles className="w-3.5 h-3.5 text-[#5865F2] opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    <p className="text-[11px] text-[#949BA4] leading-relaxed">{p.desc}</p>
                  </div>
                ))}
              </div>

              <div className="space-y-3 pt-2 border-t border-[#202225]">
                <div>
                  <label className="block text-xs font-bold text-[#DBDEE1] mb-1">
                    Nama Bot & Prefix
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <input
                        type="text"
                        value={config.name}
                        onChange={(e) => onUpdateConfig({ ...config, name: e.target.value })}
                        className="w-full bg-[#1E1F22] border border-[#202225] rounded-md p-2 text-xs text-white focus:outline-none focus:border-[#5865F2]"
                        placeholder="Nama Bot (cth: WARPER)"
                      />
                    </div>
                    <div>
                      <input
                        type="text"
                        value={config.prefix}
                        onChange={(e) => onUpdateConfig({ ...config, prefix: e.target.value })}
                        className="w-full bg-[#1E1F22] border border-[#202225] rounded-md p-2 text-xs text-white focus:outline-none focus:border-[#5865F2]"
                        placeholder="Prefix (cth: !w atau !warper)"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#DBDEE1] mb-1">
                    Status Aktivitas di Profil Discord (Playing Status)
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={config.statusText || '/warper ask | ⚡ WARPER'}
                      onChange={(e) => onUpdateConfig({ ...config, statusText: e.target.value })}
                      className="w-full bg-[#1E1F22] border border-[#202225] rounded-md p-2 text-xs text-white focus:outline-none focus:border-[#5865F2]"
                      placeholder="/warper ask | ⚡ WARPER"
                    />
                    {botStatus.isLive && (
                      <button
                        onClick={async () => {
                          const val = config.statusText || '/warper ask | ⚡ WARPER';
                          await fetch('/api/warper/live-bot/activity', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ statusText: val }),
                          });
                          setFeedback({ type: 'success', text: `Status profil Discord diubah menjadi: "${val}"` });
                          setTimeout(() => setFeedback(null), 3000);
                        }}
                        className="shrink-0 px-3 py-1.5 bg-[#5865F2] hover:bg-[#4752C4] text-white text-xs font-bold rounded-md cursor-pointer transition-colors"
                      >
                        Terapkan
                      </button>
                    )}
                  </div>
                  <p className="text-[11px] text-[#949BA4] mt-1">
                    Teks ini yang akan tampil di profil Discord bot (contoh: <em>Playing /warper ask | ⚡ WARPER</em>).
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#DBDEE1] mb-1">
                    Instruksi Prompt Kustom (System Instruction)
                  </label>
                  <textarea
                    rows={4}
                    value={config.customPrompt}
                    onChange={(e) => onUpdateConfig({ ...config, customPrompt: e.target.value })}
                    className="w-full bg-[#1E1F22] border border-[#202225] rounded-md p-2.5 text-xs text-white focus:outline-none focus:border-[#5865F2] leading-relaxed"
                    placeholder="Instruksi khusus untuk AI..."
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: LIVE DISCORD GATEWAY */}
          {activeTab === 'discord_gateway' && (
            <div className="space-y-5">
              <div className="p-4 rounded-lg bg-[#2B2D31] border border-[#202225]">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Radio className="w-5 h-5 text-[#5865F2]" />
                    <div>
                      <h4 className="text-sm font-bold text-white">Live Discord Bot Connection</h4>
                      <p className="text-xs text-[#949BA4]">
                        Jalankan WARPER langsung di server Discord sungguhan Anda!
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`inline-block w-3 h-3 rounded-full ${
                        botStatus.isLive ? 'bg-[#23A55A] animate-ping' : 'bg-[#80848E]'
                      }`}
                    />
                    <span className="text-xs font-bold text-white">
                      {botStatus.isLive ? 'ONLINE' : 'OFFLINE'}
                    </span>
                  </div>
                </div>

                {botStatus.isLive && (
                  <div className="grid grid-cols-3 gap-2 my-3 p-3 bg-[#1E1F22] rounded-md text-center border border-[#202225]">
                    <div>
                      <div className="text-[10px] text-[#949BA4] font-bold uppercase">BOT TAG</div>
                      <div className="text-xs font-bold text-[#57F287] truncate">{botStatus.botTag || 'WARPER#0000'}</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-[#949BA4] font-bold uppercase">SERVERS</div>
                      <div className="text-xs font-bold text-white">{botStatus.connectedGuilds} Guilds</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-[#949BA4] font-bold uppercase">PING</div>
                      <div className="text-xs font-bold text-[#00F0FF]">{botStatus.pingMs}ms</div>
                    </div>
                  </div>
                )}

                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-[#DBDEE1] mb-1 flex items-center justify-between">
                      <span>Discord Bot Token</span>
                      <a
                        href="https://discord.com/developers/applications"
                        target="_blank"
                        rel="noreferrer"
                        className="text-[11px] text-[#00A8FC] hover:underline"
                      >
                        Buka Discord Developer Portal ↗
                      </a>
                    </label>
                    <div className="relative">
                      <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#949BA4]" />
                      <input
                        type="password"
                        value={tokenInput}
                        onChange={(e) => setTokenInput(e.target.value)}
                        disabled={botStatus.isLive}
                        className="w-full bg-[#1E1F22] border border-[#202225] rounded-md pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-[#5865F2] disabled:opacity-50 font-mono"
                        placeholder="Paste Discord Bot Token Anda di sini..."
                      />
                    </div>
                  </div>

                  <div className="p-3 bg-[#1E1F22] rounded-lg border border-[#202225] text-xs space-y-2">
                    <div className="font-bold text-white flex items-center gap-1.5">
                      <Shield className="w-4 h-4 text-[#5865F2]" />
                      <span>Panduan Privileged Gateway Intents (Opsional tapi Direkomendasikan)</span>
                    </div>
                    <p className="text-[#949BA4] leading-relaxed">
                      Jika Anda ingin bot merespons semua pesan teks dan prefix <code className="text-white bg-[#2B2D31] px-1 py-0.5 rounded">!w</code> tanpa harus di-mention:
                    </p>
                    <ol className="list-decimal list-inside text-[#949BA4] space-y-1 pl-1 text-[11px]">
                      <li>Buka <a href="https://discord.com/developers/applications" target="_blank" rel="noreferrer" className="text-[#00A8FC] underline">Discord Developer Portal</a> ➔ Pilih Aplikasi Bot Anda.</li>
                      <li>Pilih menu <strong>Bot</strong> di bilah kiri.</li>
                      <li>Scroll ke bawah ke <strong>Privileged Gateway Intents</strong>.</li>
                      <li>Aktifkan (centang ON) <strong>Message Content Intent</strong> lalu klik <em>Save Changes</em>.</li>
                    </ol>
                    <p className="text-[11px] text-[#57F287]">
                      ✨ <em>Bot sekarang tetap bisa online dan otomatis merespons saat di-mention (@WARPER) bahkan jika intent belum diaktifkan!</em>
                    </p>
                  </div>

                  <div className="pt-2 flex items-center justify-end gap-2">
                    <button
                      id="btn-toggle-live-discord"
                      onClick={handleToggleLiveGateway}
                      disabled={isConnecting}
                      className={`px-4 py-2 rounded-md text-xs font-bold flex items-center gap-2 cursor-pointer transition-all shadow-md ${
                        botStatus.isLive
                          ? 'bg-[#ED4245] hover:bg-[#C03537] text-white'
                          : 'bg-[#23A55A] hover:bg-[#1C8B4C] text-white'
                      } disabled:opacity-50`}
                    >
                      {isConnecting ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          Menghubungkan...
                        </>
                      ) : botStatus.isLive ? (
                        <>
                          <Power className="w-3.5 h-3.5" />
                          Matikan Live Bot
                        </>
                      ) : (
                        <>
                          <Radio className="w-3.5 h-3.5" />
                          Koneksikan & Jalankan Bot
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: AUTOMOD */}
          {activeTab === 'automod' && (
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-bold text-white mb-1">AI-Powered Auto-Moderation Shield</h4>
                <p className="text-xs text-[#949BA4]">
                  WARPER menggunakan Gemini AI untuk memeriksa pesan berbahaya, toxic, phishing, dan spam secara real-time.
                </p>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between p-3.5 rounded-lg bg-[#2B2D31] border border-[#202225]">
                  <div>
                    <div className="text-xs font-bold text-white">Filter Toksisitas & Kata Kasar</div>
                    <div className="text-[11px] text-[#949BA4]">
                      Mendeteksi ujaran kebencian, hinaan, dan kata kasar secara otomatis
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={config.autoModeration}
                    onChange={(e) => onUpdateConfig({ ...config, autoModeration: e.target.checked })}
                    className="w-4 h-4 accent-[#5865F2] cursor-pointer"
                  />
                </div>

                <div className="flex items-center justify-between p-3.5 rounded-lg bg-[#2B2D31] border border-[#202225]">
                  <div>
                    <div className="text-xs font-bold text-white">Deteksi Phishing Link & Fake Nitro Scam</div>
                    <div className="text-[11px] text-[#949BA4]">
                      Mencegah penyebaran link scam berbahaya yang membajak akun anggota
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={true}
                    readOnly
                    className="w-4 h-4 accent-[#5865F2] cursor-pointer"
                  />
                </div>

                <div className="flex items-center justify-between p-3.5 rounded-lg bg-[#2B2D31] border border-[#202225]">
                  <div>
                    <div className="text-xs font-bold text-white">Pesan Sambutan AI Otomatis (Auto Welcome)</div>
                    <div className="text-[11px] text-[#949BA4]">
                      Sapa anggota baru yang masuk dengan ucapan hangat yang digenerate AI
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={config.autoWelcome}
                    onChange={(e) => onUpdateConfig({ ...config, autoWelcome: e.target.checked })}
                    className="w-4 h-4 accent-[#5865F2] cursor-pointer"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: WEBHOOK SENDER */}
          {activeTab === 'webhook' && (
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-bold text-white mb-1">Kirim Pesan Langsung via Discord Webhook</h4>
                <p className="text-xs text-[#949BA4]">
                  Kirim pengumuman, embed kaya, atau pesan AI langsung ke channel Discord mana pun tanpa perlu login bot!
                </p>
              </div>

              <div className="space-y-3 bg-[#2B2D31] p-4 rounded-lg border border-[#202225]">
                <div>
                  <label className="block text-xs font-bold text-[#DBDEE1] mb-1">
                    Discord Webhook URL
                  </label>
                  <input
                    type="text"
                    value={webhookInput}
                    onChange={(e) => setWebhookInput(e.target.value)}
                    className="w-full bg-[#1E1F22] border border-[#202225] rounded-md p-2 text-xs text-white focus:outline-none focus:border-[#5865F2] font-mono"
                    placeholder="https://discord.com/api/webhooks/..."
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#DBDEE1] mb-1">
                    Judul Embed
                  </label>
                  <input
                    type="text"
                    value={webhookTitle}
                    onChange={(e) => setWebhookTitle(e.target.value)}
                    className="w-full bg-[#1E1F22] border border-[#202225] rounded-md p-2 text-xs text-white focus:outline-none focus:border-[#5865F2]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#DBDEE1] mb-1">
                    Isi Pesan
                  </label>
                  <textarea
                    rows={3}
                    value={webhookMsg}
                    onChange={(e) => setWebhookMsg(e.target.value)}
                    className="w-full bg-[#1E1F22] border border-[#202225] rounded-md p-2.5 text-xs text-white focus:outline-none focus:border-[#5865F2]"
                  />
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    id="btn-send-webhook"
                    onClick={handleTestWebhook}
                    className="px-4 py-2 bg-[#5865F2] hover:bg-[#4752C4] text-white text-xs font-bold rounded-md flex items-center gap-1.5 cursor-pointer shadow-md transition-colors"
                  >
                    <Send className="w-3.5 h-3.5" />
                    Kirim ke Discord Sekarang
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 bg-[#2B2D31] border-t border-[#202225] flex items-center justify-between">
          <div className="text-xs text-[#949BA4]">
            Powered by <strong>Google Gemini 3.7 Flash</strong> Engine
          </div>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-[#5865F2] hover:bg-[#4752C4] text-white text-xs font-bold rounded-md cursor-pointer transition-colors"
          >
            Selesai
          </button>
        </div>
      </div>
    </div>
  );
};
