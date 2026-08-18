import React, { useState } from 'react';
import { BotConfig } from '../types';
import { X, Copy, Check, Download, Code2, Terminal, Rocket, CheckCircle2 } from 'lucide-react';

interface BotCodeExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: BotConfig;
}

export const BotCodeExportModal: React.FC<BotCodeExportModalProps> = ({
  isOpen,
  onClose,
  config,
}) => {
  const [activeTab, setActiveTab] = useState<'nodejs' | 'python' | 'docker' | 'guide'>('nodejs');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const botName = config.name || 'WARPER';
  const prefix = config.prefix || '!w';

  const NODE_CODE = `// ==========================================
// ${botName} - Production Discord Bot (Node.js)
// Powered by Google Gemini 3.7 Flash AI
// ==========================================

import 'dotenv/config';
import { Client, GatewayIntentBits, Partials, EmbedBuilder, ActivityType } from 'discord.js';
import { GoogleGenAI } from '@google/genai';

// 1. Initialize Gemini AI Client
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

// 2. Initialize Discord Client with required Intents
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.DirectMessages,
  ],
  partials: [Partials.Channel, Partials.Message],
});

const PREFIX = '${prefix}';
const SYSTEM_PROMPT = \`${config.customPrompt || 'You are ' + botName + ', a super smart, helpful, and friendly Discord AI bot.'}\`;

// 3. Ready Event
client.once('ready', () => {
  console.log(\`⚡ \${client.user.tag} is ONLINE and connected to Discord!\`);
  client.user.setActivity('${prefix} ask | ⚡ ${botName}', { type: ActivityType.Playing });
});

// 4. Message Handler (Mentions & Prefix Commands)
client.on('messageCreate', async (message) => {
  if (message.author.bot) return;

  const isMentioned = message.mentions.has(client.user);
  const isCommand = message.content.startsWith(PREFIX);

  if (isMentioned || isCommand) {
    // Show typing state
    await message.channel.sendTyping();

    let query = message.content;
    if (isMentioned) query = query.replace(new RegExp(\`<@!?\${client.user.id}>\`, 'g'), '').trim();
    if (isCommand) query = query.slice(PREFIX.length).trim();

    // 4a. Handle /clear or !clear Command
    if (query.toLowerCase().startsWith('clear') || message.content.startsWith('!clear') || message.content.startsWith('/clear')) {
      try {
        const parts = query.split(/\\s+/);
        const amount = Math.min(Math.max(parseInt(parts[1], 10) || 100, 1), 100);
        await message.delete().catch(() => {});
        const deleted = await message.channel.bulkDelete(amount, true);
        const embed = new EmbedBuilder()
          .setColor(0x57F287)
          .setTitle('🧹 Channel Berhasil Dibersihkan!')
          .setDescription(\`Telah menghapus **\${deleted.size}** pesan di channel ini.\`)
          .setFooter({ text: '${botName} Moderation Core' })
          .setTimestamp();
        const replyMsg = await message.channel.send({ embeds: [embed] });
        setTimeout(() => replyMsg.delete().catch(() => {}), 5000);
        return;
      } catch (err) {
        return message.reply('⚠️ Gagal membersihkan chat. Pastikan bot memiliki izin **Manage Messages**.');
      }
    }

    if (!query) {
      return message.reply(\`Halo \${message.author.username}! Saya **${botName}**. Ketik \` + PREFIX + \` ask <pertanyaan> untuk bertanya apapun ke AI!\`);
    }

    try {
      // Generate intelligent response using Gemini 3.7 Flash
      const response = await ai.models.generateContent({
        model: 'gemini-3.7-flash',
        contents: \`User \${message.author.username} asks: "\${query}" in #\${message.channel.name || 'channel'}\`,
        config: {
          systemInstruction: SYSTEM_PROMPT,
        },
      });

      const replyText = response.text || 'Maaf, saya tidak dapat memproses jawaban saat ini.';

      // Format response: if short send direct, if long format as rich Embed
      if (replyText.length < 1800) {
        await message.reply(replyText);
      } else {
        const embed = new EmbedBuilder()
          .setColor(0x5865F2)
          .setTitle('⚡ ${botName} AI Response')
          .setDescription(replyText.substring(0, 4000))
          .setFooter({ text: '${botName} Bot • Powered by Google Gemini AI' })
          .setTimestamp();

        await message.reply({ embeds: [embed] });
      }
    } catch (error) {
      console.error('Error generating AI response:', error);
      await message.reply(\`⚠️ Terjadi kesalahan: \${error.message}\`);
    }
  }
});

// 5. Login to Discord Gateway
client.login(process.env.DISCORD_BOT_TOKEN);
`;

  const PYTHON_CODE = `# ==========================================
# ${botName} - Production Discord Bot (Python)
# Powered by Google Gemini 3.7 Flash AI
# ==========================================

import os
import discord
from discord.ext import commands
from google import genai
from dotenv import load_dotenv

load_dotenv()

# 1. Initialize Gemini AI Client
ai = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

# 2. Setup Discord Intents
intents = discord.Intents.default()
intents.message_content = True
bot = commands.Bot(command_prefix="${prefix} ", intents=intents)

SYSTEM_PROMPT = """${config.customPrompt || 'You are ' + botName + ', a smart Discord AI bot.'}"""

@bot.event
async def on_ready():
    print(f"⚡ {bot.user.name} is ONLINE and connected to Discord!")
    await bot.change_presence(activity=discord.Game(name="${prefix} ask | ⚡ ${botName}"))

@bot.command(name="ask")
async def ask(ctx, *, question: str):
    """Command tanya apa saja ke Gemini AI"""
    async with ctx.typing():
        try:
            response = ai.models.generate_content(
                model="gemini-3.7-flash",
                contents=f"User {ctx.author.name} asked: {question}",
                config={"system_instruction": SYSTEM_PROMPT}
            )
            embed = discord.Embed(
                title="🧠 ${botName} AI Response",
                description=response.text[:4000],
                color=0x5865F2
            )
            embed.set_footer(text="${botName} • Powered by Google Gemini AI")
            await ctx.reply(embed=embed)
        except Exception as e:
            await ctx.reply(f"❌ Error: {str(e)}")

@bot.command(name="clear")
@commands.has_permissions(manage_messages=True)
async def clear(ctx, amount: int = 100):
    """Command hapus dan bersihkan semua chat di channel"""
    await ctx.message.delete()
    deleted = await ctx.channel.purge(limit=amount)
    embed = discord.Embed(
        title="🧹 Channel Berhasil Dibersihkan!",
        description=f"Telah menghapus **{len(deleted)}** pesan di channel ini.",
        color=0x57F287
    )
    embed.set_footer(text="${botName} Moderation Core")
    msg = await ctx.send(embed=embed)
    await msg.delete(delay=5)

@bot.event
async def on_message(message):
    if message.author.bot:
        return
    
    # Handle bot mentions
    if bot.user in message.mentions:
        clean_text = message.content.replace(f"<@{bot.user.id}>", "").strip()
        if clean_text:
            async with message.channel.typing():
                response = ai.models.generate_content(
                    model="gemini-3.7-flash",
                    contents=clean_text,
                    config={"system_instruction": SYSTEM_PROMPT}
                )
                await message.reply(response.text)
        else:
            await message.reply(f"Halo! Saya **${botName}**. Gunakan \`${prefix} ask <pertanyaan>\`!")

    await bot.process_commands(message)

if __name__ == "__main__":
    bot.run(os.getenv("DISCORD_BOT_TOKEN"))
`;

  const DOCKER_CODE = `# Dockerfile for 24/7 Hosting
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY . .
CMD ["node", "index.js"]
`;

  const getCurrentCode = () => {
    switch (activeTab) {
      case 'nodejs':
        return NODE_CODE;
      case 'python':
        return PYTHON_CODE;
      case 'docker':
        return DOCKER_CODE;
      default:
        return '';
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(getCurrentCode());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const code = getCurrentCode();
    const filename =
      activeTab === 'nodejs' ? 'index.js' : activeTab === 'python' ? 'bot.py' : 'Dockerfile';
    const blob = new Blob([code], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 animate-in fade-in">
      <div className="w-full max-w-4xl bg-[#313338] border border-[#202225] rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-[#2B2D31] border-b border-[#202225] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-[#00A8FC] flex items-center justify-center text-white shadow-md">
              <Code2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white leading-tight">
                Export Source Code Bot: {botName}
              </h3>
              <p className="text-xs text-[#949BA4]">
                Download dan jalankan bot Anda sendiri di VPS, Railway, Render, atau Replit 24/7
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

        {/* Tabs */}
        <div className="flex border-b border-[#202225] bg-[#2B2D31] px-6 gap-2">
          <button
            onClick={() => setActiveTab('nodejs')}
            className={`py-3 px-3 text-xs font-bold border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'nodejs'
                ? 'border-[#5865F2] text-white'
                : 'border-transparent text-[#949BA4] hover:text-[#DBDEE1]'
            }`}
          >
            <Terminal className="w-4 h-4" />
            Node.js (discord.js)
          </button>
          <button
            onClick={() => setActiveTab('python')}
            className={`py-3 px-3 text-xs font-bold border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'python'
                ? 'border-[#5865F2] text-white'
                : 'border-transparent text-[#949BA4] hover:text-[#DBDEE1]'
            }`}
          >
            <Code2 className="w-4 h-4" />
            Python (discord.py)
          </button>
          <button
            onClick={() => setActiveTab('docker')}
            className={`py-3 px-3 text-xs font-bold border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'docker'
                ? 'border-[#5865F2] text-white'
                : 'border-transparent text-[#949BA4] hover:text-[#DBDEE1]'
            }`}
          >
            <Rocket className="w-4 h-4" />
            Dockerfile
          </button>
          <button
            onClick={() => setActiveTab('guide')}
            className={`py-3 px-3 text-xs font-bold border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'guide'
                ? 'border-[#5865F2] text-white'
                : 'border-transparent text-[#949BA4] hover:text-[#DBDEE1]'
            }`}
          >
            <CheckCircle2 className="w-4 h-4" />
            Panduan Deploy 24/7
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          {activeTab !== 'guide' ? (
            <div className="relative rounded-lg border border-[#202225] bg-[#1E1F22] overflow-hidden">
              <div className="flex items-center justify-between px-4 py-2 bg-[#2B2D31] border-b border-[#202225] text-xs text-[#949BA4]">
                <span className="font-mono font-bold text-[#57F287]">
                  {activeTab === 'nodejs' ? 'index.js' : activeTab === 'python' ? 'bot.py' : 'Dockerfile'}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCopy}
                    className="flex items-center gap-1 hover:text-white px-2 py-1 rounded bg-[#35373C] transition-colors cursor-pointer text-xs"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-[#57F287]" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? 'Tersalin!' : 'Salin Kode'}</span>
                  </button>
                  <button
                    onClick={handleDownload}
                    className="flex items-center gap-1 hover:text-white px-2 py-1 rounded bg-[#5865F2] text-white transition-colors cursor-pointer text-xs font-semibold"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download</span>
                  </button>
                </div>
              </div>
              <pre className="p-4 text-xs font-mono text-[#E0E1E5] overflow-x-auto whitespace-pre leading-relaxed max-h-[420px]">
                <code>{getCurrentCode()}</code>
              </pre>
            </div>
          ) : (
            /* Deployment Guide */
            <div className="space-y-4 text-sm text-[#DBDEE1]">
              <div className="p-4 rounded-lg bg-[#2B2D31] border border-[#202225] space-y-2">
                <h4 className="font-bold text-white flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-[#5865F2] text-white flex items-center justify-center text-xs">1</span>
                  Buat Aplikasi Bot di Discord Developer Portal
                </h4>
                <ol className="list-decimal list-inside text-xs text-[#949BA4] space-y-1 pl-2">
                  <li>Buka <a href="https://discord.com/developers/applications" target="_blank" rel="noreferrer" className="text-[#00A8FC] underline">Discord Developer Portal</a>.</li>
                  <li>Klik <strong>New Application</strong> & beri nama <strong>WARPER</strong>.</li>
                  <li>Buka tab <strong>Bot</strong> &gt; klik <strong>Reset Token</strong> &gt; Copy Token tersebut.</li>
                  <li>Scroll ke bawah ke bagian <strong>Privileged Gateway Intents</strong> dan aktifkan <strong>Message Content Intent</strong>.</li>
                  <li>Buka tab <strong>OAuth2 &gt; URL Generator</strong>, centang scope <code className="bg-[#1E1F22] px-1 py-0.5 rounded text-white">bot</code> dan <code className="bg-[#1E1F22] px-1 py-0.5 rounded text-white">applications.commands</code>, lalu invite bot ke server Anda!</li>
                </ol>
              </div>

              <div className="p-4 rounded-lg bg-[#2B2D31] border border-[#202225] space-y-2">
                <h4 className="font-bold text-white flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-[#23A55A] text-white flex items-center justify-center text-xs">2</span>
                  Deploy Gratis 24/7 (Railway / VPS)
                </h4>
                <p className="text-xs text-[#949BA4]">
                  Buat file <code className="text-white">.env</code> dengan isi:
                </p>
                <div className="bg-[#1E1F22] p-2.5 rounded font-mono text-xs text-[#57F287] border border-[#202225]">
                  DISCORD_BOT_TOKEN="token_bot_anda"<br />
                  GEMINI_API_KEY="api_key_gemini_anda"
                </div>
                <p className="text-xs text-[#949BA4]">
                  Jalankan perintah: <code className="text-white bg-[#1E1F22] px-1.5 py-0.5 rounded">npm install discord.js @google/genai dotenv</code> lalu <code className="text-white bg-[#1E1F22] px-1.5 py-0.5 rounded">node index.js</code>. Bot akan online 24 jam nonstop!
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-[#2B2D31] border-t border-[#202225] flex items-center justify-between">
          <div className="text-xs text-[#949BA4]">
            WARPER is fully open source & production-ready
          </div>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-[#5865F2] hover:bg-[#4752C4] text-white text-xs font-bold rounded-md cursor-pointer transition-colors"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
