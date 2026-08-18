import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import {
  Client,
  GatewayIntentBits,
  Partials,
  EmbedBuilder,
  ActivityType,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
} from 'discord.js';

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize Gemini Client
const getGeminiClient = () => {
  return new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
};

// Global Live Discord Client state
let discordClient: Client | null = null;
let liveBotStatus = {
  isLive: false,
  connectedGuilds: 0,
  pingMs: 0,
  uptimeSeconds: 0,
  totalCommandsProcessed: 0,
  totalAiTokens: 0,
  botTag: '',
  startedAt: null as number | null,
};

// In-memory gateway logs for live viewer
const serverLogs: Array<{ id: string; timestamp: string; level: 'info' | 'warn' | 'error' | 'success' | 'ai'; message: string }> = [
  {
    id: 'log-1',
    timestamp: new Date().toLocaleTimeString(),
    level: 'info',
    message: 'WARPER Server Core initialized with Google Gemini 3.7 Flash engine.',
  },
  {
    id: 'log-2',
    timestamp: new Date().toLocaleTimeString(),
    level: 'success',
    message: 'Discord UI simulator & API routes mounted successfully.',
  },
];

function addLog(level: 'info' | 'warn' | 'error' | 'success' | 'ai', message: string) {
  const log = {
    id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
    timestamp: new Date().toLocaleTimeString(),
    level,
    message,
  };
  serverLogs.unshift(log);
  if (serverLogs.length > 100) serverLogs.pop();
}

// ----------------------------------------------------
// API ROUTES
// ----------------------------------------------------

// 1. Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', bot: 'WARPER', timestamp: new Date().toISOString() });
});

// 2. Chat with WARPER (Gemini 3.7 Flash)
app.post('/api/warper/chat', async (req, res) => {
  try {
    const { message, channelName, conversationHistory, botConfig } = req.body;
    if (!message) {
      return res.status(400).json({ error: 'Message content is required.' });
    }

    const ai = getGeminiClient();
    const systemPrompt = `You are WARPER, a high-intelligence futuristic Discord Bot powered by Gemini AI.
You reside in Discord servers and assist users with friendly, insightful, and formatted responses.
Rules:
1. Always format responses elegantly for Discord markdown (bold, bullet points, clean code blocks with language syntax).
2. Answer questions accurately, whether in Indonesian, English, or any other language requested.
3. Be witty, cyber-savvy, helpful, and concise yet thorough.
4. Personality override: ${botConfig?.personality || 'Futuristic, smart, friendly, precise, and tech-savvy.'}
5. Custom instructions: ${botConfig?.customPrompt || 'Help users with whatever they need, provide practical insights and examples.'}
Channel context: #${channelName || 'general'}`;

    // Format chat history for prompt
    let formattedPrompt = message;
    if (conversationHistory && Array.isArray(conversationHistory) && conversationHistory.length > 0) {
      const recentHistory = conversationHistory.slice(-6).map((m: any) => `${m.author?.username || 'User'}: ${m.content}`).join('\n');
      formattedPrompt = `Previous conversation in #${channelName || 'chat'}:\n${recentHistory}\n\nCurrent message from user:\n${message}`;
    }

    const startTime = Date.now();
    const response = await ai.models.generateContent({
      model: 'gemini-3.7-flash',
      contents: formattedPrompt,
      config: {
        systemInstruction: systemPrompt,
        temperature: 0.7,
      },
    });

    const elapsed = Date.now() - startTime;
    const replyText = response.text || 'Maaf, saya tidak dapat memproses pesan saat ini.';

    liveBotStatus.totalCommandsProcessed += 1;
    addLog('ai', `[Gemini 3.7 Flash] Processed chat in #${channelName || 'chat'} (${elapsed}ms)`);

    res.json({
      text: replyText,
      elapsedMs: elapsed,
      model: 'gemini-3.7-flash',
    });
  } catch (error: any) {
    console.error('Error calling Gemini API for chat:', error);
    addLog('error', `Chat error: ${error.message}`);
    res.status(500).json({ error: error.message || 'Failed to generate response' });
  }
});

// 3. Slash Command Handler
app.post('/api/warper/command', async (req, res) => {
  try {
    const { command, args, botConfig } = req.body;
    const ai = getGeminiClient();
    const startTime = Date.now();

    let textResponse = '';
    let embedResponse: any = null;
    let componentsResponse: any = null;

    switch (command) {
      case 'rift': {
        const rawTier = (args?.tier || args?.type || '').toLowerCase().replace(/[^a-z]/g, '');
        const tier = (['c', 'cc', 'ccc', 'd', 'dd', 'ddd'].includes(rawTier) ? rawTier : 'ccc') as string;
        const location = args?.location || args?.room || 'Relax';
        const isPanel = args?.action === 'panel' || args?.tier === 'panel' || (!args?.tier && !args?.location);

        if (isPanel) {
          textResponse = '🌀 **HOTEL HIDEAWAY: PANEL PING RIFT STAFF**';
          embedResponse = {
            title: '🌀 Hotel Hideaway Rift Dispatcher Panel',
            description: 'Halo Staff Rift! Klik tombol di bawah untuk memilih **Tipe Rift (@Role Ping)** dan **Lokasi Ruangan In-Game**, lalu tekan **Kirim Ping Rift** untuk memanggil player secara instan ke room!',
            color: '#5865F2',
            fields: [
              { name: '🪙 Coin Rifts', value: '`@c` (★1) • `@cc` (★2) • `@ccc` (★3)', inline: true },
              { name: '💎 Diamond Rifts', value: '`@d` (★1) • `@dd` (★2) • `@ddd` (★3)', inline: true },
              { name: '📍 Lokasi Standar', value: '`Relax`, `Beach`, `Pool`, `Rooftop`, `Lobby`', inline: false },
            ],
            footer: { text: 'WARPER Hotel Hideaway Dispatcher • Khusus Staff Ping Rift' },
            timestamp: new Date().toISOString(),
          };
          componentsResponse = [
            {
              components: [
                { customId: 'rift_tier_c', label: '@c (★1)', style: 'secondary', emoji: '🪙' },
                { customId: 'rift_tier_cc', label: '@cc (★2)', style: 'secondary', emoji: '🪙' },
                { customId: 'rift_tier_ccc', label: '@ccc (★3)', style: 'success', emoji: '🪙' },
              ],
            },
            {
              components: [
                { customId: 'rift_tier_d', label: '@d (★1)', style: 'secondary', emoji: '💎' },
                { customId: 'rift_tier_dd', label: '@dd (★2)', style: 'secondary', emoji: '💎' },
                { customId: 'rift_tier_ddd', label: '@ddd (★3)', style: 'primary', emoji: '💎' },
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
                { customId: 'rift_send_ccc_Relax', label: '📢 Kirim Ping @ccc di Relax!', style: 'success', emoji: '🚀' },
              ],
            },
          ];
        } else {
          const tierColors: Record<string, string> = {
            c: '#FEE75C', cc: '#F1C40F', ccc: '#E67E22',
            d: '#00F0FF', dd: '#5865F2', ddd: '#EB459E',
          };
          const tierStars: Record<string, string> = {
            c: '⭐ (1 Star)', cc: '⭐⭐ (2 Stars)', ccc: '⭐⭐⭐ (3 Stars)',
            d: '⭐ (1 Star)', dd: '⭐⭐ (2 Stars)', ddd: '⭐⭐⭐ (3 Stars)',
          };
          const isCoin = tier.startsWith('c');
          const rolePing = `@${tier}`;
          textResponse = `📢 **PING RIFT NOTIFICATION** ➜ <@&${rolePing}> | Role Ping: **\`${rolePing}\`**\n` +
            `🌀 **Retakan Dimensi ${isCoin ? 'Coin' : 'Diamond'} sedang berlangsung di in-game sekarang! Segera masuk ke ${location}!**`;

          embedResponse = {
            title: `${isCoin ? '🪙' : '💎'} HOTEL HIDEAWAY: ${isCoin ? 'COIN RIFT' : 'DIAMOND RIFT'} ACTIVE!`,
            description: `Sebuah **${isCoin ? 'Coin Rift' : 'Diamond Rift'} (\`${rolePing}\`)** telah ditemukan dan sedang berlangsung di Hotel Hideaway! Semua player dengan role **\`${rolePing}\`** dipersilakan merapat ke **${location}**.`,
            color: tierColors[tier] || '#5865F2',
            fields: [
              { name: '📍 Lokasi / Ruangan In-Game', value: `**${location}**`, inline: true },
              { name: '⭐ Tingkat / Kelangkaan', value: `**${tierStars[tier] || '3 Stars'}**`, inline: true },
              { name: '⏳ Perkiraan Durasi', value: '**~10-15 Menit** *(Sedang Berlangsung)*', inline: false },
              { name: '👤 Dilaporkan Oleh', value: `**Staff Ping Rift**`, inline: true },
              { name: '🎯 Role Pinged', value: `\`${rolePing}\``, inline: true },
            ],
            footer: { text: 'WARPER Hotel Hideaway Rift Dispatcher • Real-time Dimension Tracker' },
            timestamp: new Date().toISOString(),
          };
        }
        break;
      }
      case 'ask': {
        const prompt = args?.prompt || args?.text || 'Hello WARPER';
        const mode = args?.mode || 'smart';
        const response = await ai.models.generateContent({
          model: 'gemini-3.7-flash',
          contents: `Question: ${prompt}\nMode: ${mode}`,
          config: {
            systemInstruction: `You are WARPER Discord Bot executing /warper ask. Provide an exceptionally clear, structured answer with Discord markdown. Keep tone engaging, smart, and helpful.`,
          },
        });
        textResponse = response.text || 'Tidak ada jawaban.';
        embedResponse = {
          title: `🧠 WARPER AI Answer`,
          description: textResponse.length > 2000 ? textResponse.substring(0, 1990) + '...' : textResponse,
          color: '#5865F2',
          fields: [
            { name: '❓ Question', value: prompt.length > 250 ? prompt.substring(0, 245) + '...' : prompt, inline: false },
            { name: '⚡ AI Model', value: 'Gemini 3.7 Flash', inline: true },
            { name: '⏱️ Response Time', value: `${Date.now() - startTime}ms`, inline: true },
          ],
          footer: { text: 'WARPER • Next-Gen AI Assistant' },
          timestamp: new Date().toISOString(),
        };
        break;
      }

      case 'code': {
        const language = args?.language || 'JavaScript';
        const task = args?.task || args?.prompt || 'Create a helper utility';
        const response = await ai.models.generateContent({
          model: 'gemini-3.7-flash',
          contents: `Language: ${language}\nTask: ${task}`,
          config: {
            systemInstruction: `You are WARPER Code Specialist. Write clean, production-grade code in the requested language with comments, best practices, and brief explanation. Format code inside markdown blocks.`,
          },
        });
        const codeOutput = response.text || '';
        textResponse = `💻 **Kode dibuat untuk [${language}]:**\n${task}`;
        embedResponse = {
          title: `⚡ WARPER Code Lab • ${language}`,
          description: codeOutput.length > 3900 ? codeOutput.substring(0, 3900) + '...' : codeOutput,
          color: '#00F0FF',
          fields: [
            { name: '📌 Language', value: `\`${language}\``, inline: true },
            { name: '🎯 Objective', value: task, inline: true },
          ],
          footer: { text: 'WARPER Code Intelligence • Gemini 3.7' },
        };
        break;
      }

      case 'summarize': {
        const textToSummarize = args?.text || args?.prompt || '';
        const response = await ai.models.generateContent({
          model: 'gemini-3.7-flash',
          contents: `Rangkum teks berikut menjadi 3-5 poin kunci yang sangat padat dan informatif:\n\n${textToSummarize}`,
          config: {
            systemInstruction: 'You are WARPER Summarizer. Extract core insights, action items, and executive summary cleanly.',
          },
        });
        textResponse = '📝 **Rangkuman Eksekutif WARPER:**';
        embedResponse = {
          title: '📋 Ringkasan Cerdas & Poin Kunci',
          description: response.text || 'Tidak ada teks yang dapat dirangkum.',
          color: '#57F287',
          footer: { text: 'WARPER Summarizer Module' },
        };
        break;
      }

      case 'translate': {
        const target = args?.target || 'Indonesian';
        const inputStr = args?.text || args?.prompt || '';
        const response = await ai.models.generateContent({
          model: 'gemini-3.7-flash',
          contents: `Translate the following accurately and naturally to ${target}. Preserve nuances and context:\n\n${inputStr}`,
          config: {
            systemInstruction: 'You are WARPER Multilingual Translator. Output the translation directly with pronunciation or slang context if applicable.',
          },
        });
        textResponse = `🌐 **Hasil Terjemahan ke ${target}:**`;
        embedResponse = {
          title: `🌐 WARPER Translator • ${target}`,
          description: response.text || '',
          color: '#FEE75C',
          fields: [
            { name: '📝 Original Text', value: inputStr, inline: false },
          ],
          footer: { text: 'WARPER Multilingual Engine' },
        };
        break;
      }

      case 'poll': {
        const question = args?.question || 'Voting Server';
        const rawOptions = args?.options || 'Ya, Tidak';
        const optionsList = rawOptions.split(/[,|]/).map((opt: string) => opt.trim()).filter(Boolean);
        const numberEmojis = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟'];
        const descriptionLines = optionsList.map((opt: string, i: number) => `${numberEmojis[i % 10]} **${opt}**`).join('\n\n');
        
        textResponse = '📊 **POLLING BARU DIBUKA!** Berikan reaksi emoji Anda pada pesan ini:';
        embedResponse = {
          title: `📊 ${question}`,
          description: descriptionLines || '1️⃣ **Ya**\n\n2️⃣ **Tidak**',
          color: '#5865F2',
          footer: { text: 'WARPER Polling System • Reaksi untuk vote' },
          timestamp: new Date().toISOString(),
        };
        break;
      }

      case 'clear': {
        const amount = parseInt(args?.amount, 10) || 100;
        textResponse = '🧹 **Channel Berhasil Dibersihkan!**';
        embedResponse = {
          title: '🧹 WARPER Channel Clear & Purge',
          description: `Semua pesan di channel ini telah berhasil dibersihkan dan dihapus.`,
          color: '#57F287',
          fields: [
            { name: '🛡️ Tindakan', value: 'Bulk Delete / Chat Purge', inline: true },
            { name: '⚡ Pelaksana', value: 'WARPER Moderation Core', inline: true },
            { name: '📊 Kapasitas Hapus', value: `Hingga ${amount} Pesan`, inline: true },
          ],
          footer: { text: 'WARPER Moderation Tool • Channel Bersih' },
          timestamp: new Date().toISOString(),
        };
        break;
      }

      case 'automod': {
        const checkText = args?.check || args?.text || '';
        const response = await ai.models.generateContent({
          model: 'gemini-3.7-flash',
          contents: `Analyze this Discord chat message for safety, toxicity, spam, phishing, hate speech, or bad words: "${checkText}"`,
          config: {
            systemInstruction: 'You are WARPER Safety & AutoMod AI. Evaluate the message and return a safety score (0-100), toxicity level (Low/Medium/High/Critical), category flags, and a recommended moderation action (Allow/Warn/Delete/Timeout). Format in clean markdown.',
          },
        });
        textResponse = '🛡️ **Hasil Audit Auto-Moderasi WARPER:**';
        embedResponse = {
          title: '🛡️ WARPER AutoMod Security Report',
          description: response.text || 'Audit selesai.',
          color: checkText.toLowerCase().includes('nitro') || checkText.toLowerCase().includes('free') ? '#ED4245' : '#57F287',
          fields: [
            { name: '💬 Audited Message', value: `\`"${checkText}"\``, inline: false },
          ],
          footer: { text: 'WARPER AutoMod Engine • Real-time Threat Guard' },
        };
        break;
      }

      case 'dice': {
        const sides = parseInt(args?.sides, 10) || 20;
        const roll = Math.floor(Math.random() * sides) + 1;
        textResponse = `🎲 **WARPER Dice Roll (D${sides})**`;
        embedResponse = {
          title: `🎲 Hasil Lemparan Dadu D${sides}`,
          description: `🎯 Angka yang keluar: **${roll}** / ${sides}\n\n${roll === sides ? '🔥 **CRITICAL HIT!** Luar biasa!' : roll === 1 ? '💀 **NATURAL 1!** Nasib buruk melanda...' : '✨ Lemparan yang solid!'}`,
          color: roll === sides ? '#FEE75C' : '#5865F2',
          footer: { text: 'WARPER Dice & RNG Game Bot' },
        };
        break;
      }

      case 'serverinfo': {
        textResponse = 'ℹ️ **Statistik Server Saat Ini:**';
        embedResponse = {
          title: '🏰 WARPER Headquarters Server Stats',
          color: '#5865F2',
          fields: [
            { name: '👑 Server Owner', value: 'Captain Quantum', inline: true },
            { name: '👥 Total Members', value: '1,420 (Online: 382)', inline: true },
            { name: '🚀 Server Boost Level', value: 'Level 3 (18 Boosts)', inline: true },
            { name: '💬 Channels', value: '12 Text, 4 Voice', inline: true },
            { name: '🛡️ Verification Level', value: 'High (Verified Phone)', inline: true },
            { name: '🤖 Active AI Bot', value: 'WARPER v3.0 [Online]', inline: true },
          ],
          footer: { text: 'WARPER Server Inspector' },
          timestamp: new Date().toISOString(),
        };
        break;
      }

      case 'botstatus': {
        textResponse = '⚡ **Status Sistem WARPER Core:**';
        embedResponse = {
          title: '🤖 WARPER AI System Telemetry',
          color: '#00F0FF',
          fields: [
            { name: '🧠 Core AI', value: 'Google Gemini 3.7 Flash', inline: true },
            { name: '⚡ Gateway Ping', value: `${Math.floor(Math.random() * 8) + 14}ms`, inline: true },
            { name: '🕒 Uptime', value: '99.98% (Online)', inline: true },
            { name: '💻 Memory Usage', value: '64.2 MB / 512 MB', inline: true },
            { name: '📊 Commands Executed', value: `${liveBotStatus.totalCommandsProcessed + 420}`, inline: true },
            { name: '🛡️ Safety Filter', value: 'Enabled (Zero-Tolerance)', inline: true },
          ],
          footer: { text: 'WARPER Status Monitor • v3.0-flash' },
          timestamp: new Date().toISOString(),
        };
        break;
      }

      default: {
        textResponse = `Unknown command \`/${command}\`. Ketik \`/warper\` untuk bantuan.`;
      }
    }

    liveBotStatus.totalCommandsProcessed += 1;
    addLog('ai', `Executed command /warper ${command} in ${Date.now() - startTime}ms`);

    res.json({
      text: textResponse,
      embed: embedResponse,
      components: componentsResponse,
      elapsedMs: Date.now() - startTime,
    });
  } catch (error: any) {
    console.error('Command execution error:', error);
    addLog('error', `Command error: ${error.message}`);
    res.status(500).json({ error: error.message || 'Failed to execute command' });
  }
});

// 4. Auto-moderation check endpoint
app.post('/api/warper/automod', async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ error: 'Text required' });

    const ai = getGeminiClient();
    const response = await ai.models.generateContent({
      model: 'gemini-3.7-flash',
      contents: `Evaluate the following message for Discord server safety:\n"${text}"\n\nReturn a JSON object with keys:\nisToxic (boolean), score (number 0-100), reason (string in Indonesian), recommendation (Allow/Warn/Delete).`,
      config: {
        systemInstruction: 'You are a Discord auto-moderation AI. Detect toxic speech, insults, phishing scams, spam, and severe profanity. Return ONLY valid JSON format.',
      },
    });

    let parsed = { isToxic: false, score: 0, reason: 'Pesan aman', recommendation: 'Allow' };
    try {
      const cleaned = (response.text || '').replace(/```json/g, '').replace(/```/g, '').trim();
      parsed = JSON.parse(cleaned);
    } catch {
      if (text.toLowerCase().includes('nitro') || text.toLowerCase().includes('scam') || text.toLowerCase().includes('babi') || text.toLowerCase().includes('anjing')) {
        parsed = { isToxic: true, score: 85, reason: 'Terdeteksi kata kasar / potensi scam', recommendation: 'Delete' };
      }
    }

    res.json(parsed);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 5. Discord Webhook Sender
app.post('/api/warper/webhook', async (req, res) => {
  try {
    const { webhookUrl, content, username, avatar_url, embeds } = req.body;
    if (!webhookUrl || !webhookUrl.startsWith('https://discord.com/api/webhooks/')) {
      return res.status(400).json({ error: 'Invalid Discord Webhook URL. It must start with https://discord.com/api/webhooks/' });
    }

    const payload: any = {
      content: content || '',
      username: username || 'WARPER [AI Bot]',
      avatar_url: avatar_url || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150&auto=format&fit=crop&q=80',
    };

    if (embeds && Array.isArray(embeds)) {
      payload.embeds = embeds;
    }

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Discord Webhook returned status ${response.status}: ${errText}`);
    }

    addLog('success', `Sent message via Discord Webhook: ${webhookUrl.substring(0, 45)}...`);
    res.json({ success: true, message: 'Message successfully sent to Discord channel!' });
  } catch (error: any) {
    addLog('error', `Webhook error: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
});

// 6. Live Discord Bot Gateway (Start / Stop / Status)
app.get('/api/warper/live-bot/status', (req, res) => {
  if (discordClient && discordClient.isReady()) {
    liveBotStatus.isLive = true;
    liveBotStatus.connectedGuilds = discordClient.guilds.cache.size;
    liveBotStatus.pingMs = discordClient.ws.ping || 24;
    liveBotStatus.botTag = discordClient.user?.tag || 'WARPER#0000';
    if (liveBotStatus.startedAt) {
      liveBotStatus.uptimeSeconds = Math.floor((Date.now() - liveBotStatus.startedAt) / 1000);
    }
  } else {
    liveBotStatus.isLive = false;
  }
  res.json({
    status: liveBotStatus,
    logs: serverLogs.slice(0, 40),
  });
});

app.post('/api/warper/live-bot/start', async (req, res) => {
  try {
    const { token, prefix, personality, statusText, name } = req.body;
    if (!token || typeof token !== 'string' || token.trim().length < 20) {
      return res.status(400).json({ error: 'Valid Discord Bot Token is required to connect to the live Discord Gateway.' });
    }

    if (discordClient) {
      try {
        await discordClient.destroy();
      } catch (e) {
        // ignore
      }
      discordClient = null;
    }

    addLog('info', 'Connecting to Discord Gateway with provided token...');

    const customStatus = statusText && statusText.trim() 
      ? statusText.trim() 
      : `/warper ask | ⚡ ${name || 'WARPER'}`;

    // Function to create and attach bot event listeners
    const setupClient = (intents: number[]) => {
      const c = new Client({
        intents,
        partials: [Partials.Channel, Partials.Message],
      });

      const botPrefix = prefix || '!w';

      c.on('ready', async () => {
        liveBotStatus.isLive = true;
        liveBotStatus.connectedGuilds = c.guilds.cache.size;
        liveBotStatus.pingMs = c.ws.ping || 20;
        liveBotStatus.botTag = c.user?.tag || 'WARPER#0000';
        liveBotStatus.startedAt = Date.now();

        c.user?.setActivity(customStatus, { type: ActivityType.Playing });
        addLog('success', `WARPER Bot is ONLINE on Discord as ${c.user?.tag}! Activity set to: "${customStatus}"`);

        // Register Slash Commands
        try {
          if (c.application) {
            await c.application.commands.create({
              name: 'rift',
              description: 'Kirim ping Rift secara langsung (tanpa panel)',
              options: [
                {
                  name: 'tier',
                  description: 'Pilih Tier (c, cc, ccc, d, dd, ddd)',
                  type: 3, // STRING
                  required: true,
                },
                {
                  name: 'lokasi',
                  description: 'Contoh: Loby, Kamar Velvet, Relaxarium, Jalan sunset',
                  type: 3, // STRING
                  required: true,
                },
                {
                  name: 'status',
                  description: 'Contoh: f (baru), 10%, 20%, 30%, dll',
                  type: 3, // STRING
                  required: true,
                }
              ]
            });
            await c.application.commands.create({
              name: 'riftp',
              description: 'Buka Panel Dispatch Rift Interaktif',
              options: []
            });
            await c.application.commands.create({
              name: 'roles',
              description: 'Buka Panel Pemilihan Role Rift',
              options: []
            });
            addLog('success', 'Registered /rift, /riftp, and /roles slash commands.');
          }
        } catch (e: any) {
          addLog('error', `Gagal register slash commands: ${e.message}`);
        }
      });

      // Handle New Member Joined (Welcome)
      c.on('guildMemberAdd', async (member) => {
        addLog('info', `Member joined: ${member.user.tag} in ${member.guild.name}`);
        try {
          const welcomeChannel = member.guild.channels.cache.find(
            (ch: any) => ch.isTextBased() && (ch.name.toLowerCase().includes('welcome') || ch.name.toLowerCase().includes('general') || ch.name.toLowerCase().includes('selamat-datang'))
          ) as any;
          
          if (welcomeChannel) {
            const embed = new EmbedBuilder()
              .setColor(0x57F287)
              .setTitle('👋 Welcome to Hotel Hideaway Rift Party!')
              .setDescription(`Selamat datang <@${member.user.id}> di server kita!\n\nSemoga beruntung dan selalu hoki menemukan **Coin** & **Diamond Rifts** langka bersama tim! Jangan lupa siapkan spinner kamu. 🎰💎`)
              .setThumbnail(member.user.displayAvatarURL() || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=60&auto=format&fit=crop&q=80')
              .setFooter({ text: 'WARPER Rift Greeter' })
              .setTimestamp();
            await welcomeChannel.send({ embeds: [embed] });
          }
        } catch (e) {
          console.error('Welcome message error:', e);
        }
      });

      // Handle Member Left (Goodbye)
      c.on('guildMemberRemove', async (member) => {
        addLog('info', `Member left: ${member.user.tag} from ${member.guild.name}`);
        try {
          const leaveChannel = member.guild.channels.cache.find(
            (ch: any) => ch.isTextBased() && (ch.name.toLowerCase().includes('good-bye') || ch.name.toLowerCase().includes('goodbye') || ch.name.toLowerCase().includes('leave') || ch.name.toLowerCase().includes('keluar'))
          ) as any;
          
          if (leaveChannel) {
            const embed = new EmbedBuilder()
              .setColor(0xED4245)
              .setTitle('👋 Sampai Jumpa!')
              .setDescription(`Selamat jalan, **${member.user.username}**.\n\nTerima kasih sudah berpartisipasi berburu rift di server Hotel Hideaway Rift Party. Sampai jumpa di dimensi rift selanjutnya! 🌀`)
              .setThumbnail(member.user.displayAvatarURL() || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=60&auto=format&fit=crop&q=80')
              .setFooter({ text: 'WARPER Rift Greeter' })
              .setTimestamp();
            await leaveChannel.send({ embeds: [embed] });
          }
        } catch (e) {
          console.error('Goodbye message error:', e);
        }
      });

      c.on('messageCreate', async (message) => {
        if (message.author.bot) return;

        // Check if bot was mentioned or prefix was used
        const isMentioned = c.user ? message.mentions.has(c.user) : false;
        const isPrefixCommand = message.content.startsWith(botPrefix) || 
                                message.content.startsWith('!warper') || 
                                message.content.startsWith('!ask');

        if (isMentioned || isPrefixCommand) {
          addLog('info', `Incoming message from ${message.author.username} in #${(message.channel as any).name || 'DM'}`);

          let userPrompt = message.content;
          if (isMentioned && c.user) {
            userPrompt = userPrompt.replace(new RegExp(`<@!?${c.user.id}>`, 'g'), '').trim();
          } else if (message.content.startsWith(botPrefix)) {
            userPrompt = userPrompt.slice(botPrefix.length).trim();
          } else if (message.content.startsWith('!warper')) {
            userPrompt = userPrompt.slice(7).trim();
          } else if (message.content.startsWith('!ask')) {
            userPrompt = userPrompt.slice(4).trim();
          }

          // Handle /clear or !clear command to purge all messages in the channel
          const lowerPrompt = userPrompt.toLowerCase().trim();
          if (
            lowerPrompt.startsWith('clear') ||
            lowerPrompt.startsWith('purge') ||
            message.content.startsWith('!clear') ||
            message.content.startsWith('/clear') ||
            message.content.startsWith('!purge') ||
            message.content.startsWith('/purge')
          ) {
            try {
              const parts = userPrompt.split(/\s+/);
              const amountArg = parts.find((p: string) => /^\d+$/.test(p));
              const amount = Math.min(Math.max(parseInt(amountArg || '100', 10), 1), 100);

              // Delete the trigger message if possible
              await message.delete().catch(() => {});

              let deletedCount = 0;
              try {
                const deleted = await (message.channel as any).bulkDelete(amount, true);
                deletedCount = deleted.size;
              } catch {
                const fetched = await (message.channel as any).messages.fetch({ limit: Math.min(amount, 30) });
                for (const m of fetched.values()) {
                  await m.delete().catch(() => {});
                  deletedCount++;
                }
              }

              const embed = new EmbedBuilder()
                .setColor(0x57F287)
                .setTitle('🧹 Channel Berhasil Dibersihkan!')
                .setDescription(`Telah menghapus **${deletedCount}** pesan di channel <#${message.channel.id}>.`)
                .setFooter({ text: 'WARPER Moderation Core • Channel Purged' })
                .setTimestamp();

              const replyMsg = await (message.channel as any).send({ embeds: [embed] }).catch(() => null);
              if (replyMsg) {
                setTimeout(() => replyMsg.delete().catch(() => {}), 6000);
              }

              addLog('success', `🧹 Executed /clear in #${(message.channel as any).name || message.channel.id} (Deleted ${deletedCount} messages)`);
              liveBotStatus.totalCommandsProcessed += 1;
              return;
            } catch (clearErr: any) {
              console.error('Clear channel error:', clearErr);
              addLog('error', `Failed to execute clear: ${clearErr.message}`);
              await message.channel.send(`⚠️ Gagal membersihkan pesan: Pastikan bot memiliki izin **Manage Messages** (Kelola Pesan).`).catch(() => {});
              return;
            }
          }

          // Handle Hotel Hideaway Rift command (!rift, /rift, !riftp, /riftp)
          const isRiftText = message.content.startsWith('!rift') && !message.content.startsWith('!riftp');
          const isRiftpText = message.content.startsWith('!riftp') || message.content.startsWith('/riftp');
          
          if (isRiftText || isRiftpText) {
            // Permission Check: Only "Ping Rift" role or Administrators
            const hasPermission = message.member?.permissions.has('Administrator') ||
                                  message.member?.roles.cache.some((r: any) => r.name.toLowerCase().includes('ping rift'));
            
            if (!hasPermission) {
              await message.reply("❌ Maaf, hanya member dengan role **Ping Rift** (atau Administrator) yang dapat menggunakan command ini.");
              return;
            }

            if (isRiftpText) {
              // Hapus pesan command dari user agar terlihat misterius (jika bot punya izin Manage Messages)
              await message.delete().catch(() => {});

              // Send Interactive Rift Staff Panel with Select Menus
              const tierMenu = new StringSelectMenuBuilder()
                .setCustomId('rift_select_tier')
                .setPlaceholder('Pilih Role Ping Rift...')
                .addOptions(
                  new StringSelectMenuOptionBuilder().setLabel('Single Coin (@c)').setValue('c').setEmoji('🪙').setDescription('Ping role @c'),
                  new StringSelectMenuOptionBuilder().setLabel('Double Coin (@cc)').setValue('cc').setEmoji('🪙').setDescription('Ping role @cc'),
                  new StringSelectMenuOptionBuilder().setLabel('Triple Coin (@ccc)').setValue('ccc').setEmoji('🪙').setDescription('Ping role @ccc'),
                  new StringSelectMenuOptionBuilder().setLabel('Single Diamond (@d)').setValue('d').setEmoji('💎').setDescription('Ping role @d'),
                  new StringSelectMenuOptionBuilder().setLabel('Double Diamond (@dd)').setValue('dd').setEmoji('💎').setDescription('Ping role @dd'),
                  new StringSelectMenuOptionBuilder().setLabel('Triple Diamond (@ddd)').setValue('ddd').setEmoji('💎').setDescription('Ping role @ddd')
                );

              const row1 = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(tierMenu);

              const panelEmbed = new EmbedBuilder()
                .setColor(0x5865F2)
                .setTitle('🌀 HOTEL HIDEAWAY: PING RIFT STAFF')
                .setDescription('Halo Staff Rift! Silakan pilih role yang ingin di-ping menggunakan menu di bawah. Setelah memilih role, Anda akan diminta untuk memilih Lokasi/Ruangan Rift.')
                .setFooter({ text: 'WARPER Hotel Hideaway Rift Dispatcher • Staff Only' })
                .setTimestamp();

              await (message.channel as any).send({ embeds: [panelEmbed], components: [row1] });
              addLog('success', `Sent Staff Rift Panel Select Menu in #${(message.channel as any).name}`);
              return;
            } else if (isRiftText) {
              const cleanStr = userPrompt.startsWith('!rift') ? userPrompt.slice(5).trim() : userPrompt;
              const parts = cleanStr.split(/\s+/).filter(Boolean);

              if (parts.length < 2) {
                 await message.reply("❌ Format salah. Gunakan `!rift <tier> <lokasi> [status]` (contoh: `!rift ccc Loby f` atau `!rift ccc Loby 10%`) atau gunakan `!riftp` untuk membuka panel.");
                 return;
              }

              const tier = parts[0].toLowerCase().replace('@', '');
              const cleanTier = ['c', 'cc', 'ccc', 'd', 'dd', 'ddd'].includes(tier) ? tier : 'ccc';
              
              // Assume the last part might be the status if it's 'f', 'F', or ends with '%'
              let status = '';
              let locParts = parts.slice(1);
              const lastPart = parts[parts.length - 1].toLowerCase();
              if (lastPart === 'f' || lastPart.endsWith('%')) {
                status = parts[parts.length - 1];
                locParts = parts.slice(1, -1);
              }
              const loc = locParts.join(' ') || 'Relax';
              
              let roleMentionText = `@${cleanTier}`;
              if (message.guild) {
                const role = message.guild.roles.cache.find((r: any) => r.name.toLowerCase() === cleanTier.toLowerCase() || r.name.toLowerCase() === `@${cleanTier.toLowerCase()}`);
                if (role) roleMentionText = `<@&${role.id}>`;
              }

              const statusText = status ? ` ${status}` : '';
              const simpleMsg = `${roleMentionText} (${loc})${statusText}`;

              // Send to announcement channel if configured, or current channel
              let broadcastChannel = message.channel;
              if (message.guild) {
                const announc = message.guild.channels.cache.find((ch: any) =>
                  ch.isTextBased() && (ch.name.toLowerCase().includes('rift-announcement') || ch.name.toLowerCase().includes('rift-announc') || ch.name.toLowerCase().includes('pengumuman'))
                );
                if (announc && announc.isTextBased()) broadcastChannel = announc;
              }

              await (broadcastChannel as any).send({
                content: simpleMsg
              });
              
              if (broadcastChannel.id !== message.channel.id) {
                await message.reply(`✅ **Berhasil!** Pesan ping telah dikirim ke <#${broadcastChannel.id}>`);
              }
              
              addLog('success', `Broadcasted Rift Ping: ${simpleMsg}`);
              return;
            }
          }

          if (!userPrompt) {
            await message.reply('Halo! Saya **WARPER**, bot Discord berbasis Gemini AI. Ketik pertanyaan Anda atau mention saya `@WARPER` untuk mulai mengobrol!');
            return;
          }

          // Show typing indicator on Discord
          await (message.channel as any).sendTyping().catch(() => {});

          try {
            const ai = getGeminiClient();
            const response = await ai.models.generateContent({
              model: 'gemini-3.7-flash',
              contents: `User ${message.author.username} said: "${userPrompt}" in #${(message.channel as any).name || 'chat'}`,
              config: {
                systemInstruction: `You are WARPER, a helpful, ultra-smart AI bot on Discord powered by Gemini 3.7 Flash. Respond politely, creatively, and formatted with Discord markdown. Personality: ${personality || 'Smart, cyber-savvy, friendly, helpful.'}`,
              },
            });

            const replyContent = response.text || 'Maaf, saya tidak dapat menjawab saat ini.';
            liveBotStatus.totalCommandsProcessed += 1;

            if (replyContent.length < 1800) {
              await message.reply(replyContent);
            } else {
              const embed = new EmbedBuilder()
                .setColor(0x5865F2)
                .setTitle('⚡ WARPER AI Response')
                .setDescription(replyContent.substring(0, 4000))
                .setFooter({ text: 'WARPER • Powered by Gemini 3.7 Flash' })
                .setTimestamp();
              await message.reply({ embeds: [embed] });
            }

            addLog('ai', `Replied to ${message.author.username} successfully via Discord Gateway.`);
          } catch (err: any) {
            console.error('Discord bot reply error:', err);
            addLog('error', `Bot reply error: ${err.message}`);
            await message.reply(`⚠️ Terjadi kesalahan saat memproses permintaan: ${err.message}`).catch(() => {});
          }
        }
      });

      // Handle Discord interactive button and select menu clicks
      c.on('interactionCreate', async (interaction: any) => {
        try {
          // Universal Permission Check for all Rift-related interactions
          const isRiftInteraction = (interaction.isCommand() && (interaction.commandName === 'rift' || interaction.commandName === 'riftp' || interaction.commandName === 'roles')) ||
                                    (interaction.isStringSelectMenu() && interaction.customId.startsWith('rift_')) ||
                                    (interaction.isButton() && interaction.customId.startsWith('rift_'));

          if (isRiftInteraction && interaction.commandName !== 'roles') {
            const hasPermission = interaction.member?.permissions.has('Administrator') ||
                                  interaction.member?.roles.cache.some((r: any) => r.name.toLowerCase().includes('allprem'));
            
            if (!hasPermission) {
              await interaction.reply({
                content: "❌ Maaf, hanya member dengan role **allprem** (atau Administrator) yang dapat menggunakan akses ini.",
                ephemeral: true
              });
              return;
            }
          }

          if (interaction.isCommand()) {
            addLog('info', `Slash command received: ${interaction.commandName}`);
            if (interaction.commandName === 'roles') {
                await interaction.reply({ content: '✅ Panel Role Rift berhasil dimunculkan.', ephemeral: true });
                
                // Auto-delete after 30 seconds
                setTimeout(async () => {
                    try {
                        await interaction.deleteReply().catch(() => {});
                    } catch (err) {
                        addLog('error', `Gagal menghapus pesan konfirmasi: ${err}`);
                    }
                }, 30000);

                const roleMenu = new StringSelectMenuBuilder()
                  .setCustomId('rift_select_roles')
                  .setPlaceholder('Rift Selection Add')
                  .setMinValues(1)
                  .setMaxValues(7)
                  .addOptions(
                    new StringSelectMenuOptionBuilder().setLabel('Add All').setValue('all').setEmoji('🔄'),
                    new StringSelectMenuOptionBuilder().setLabel('Single Coin (@c)').setValue('c').setEmoji('🪙'),
                    new StringSelectMenuOptionBuilder().setLabel('Double Coin (@cc)').setValue('cc').setEmoji('🪙'),
                    new StringSelectMenuOptionBuilder().setLabel('Triple Coin (@ccc)').setValue('ccc').setEmoji('🪙'),
                    new StringSelectMenuOptionBuilder().setLabel('Single Diamond (@d)').setValue('d').setEmoji('💎'),
                    new StringSelectMenuOptionBuilder().setLabel('Double Diamond (@dd)').setValue('dd').setEmoji('💎'),
                    new StringSelectMenuOptionBuilder().setLabel('Triple Diamond (@ddd)').setValue('ddd').setEmoji('💎')
                  );

                const row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(roleMenu);
                const rowManual = new ActionRowBuilder<ButtonBuilder>().addComponents(
                    new ButtonBuilder().setCustomId('open_rift_modal').setLabel('Manual Report').setStyle(ButtonStyle.Primary)
                );
                
                const removeMenu = new StringSelectMenuBuilder()
                  .setCustomId('rift_remove_roles')
                  .setPlaceholder('Rift Selection Remove')
                  .setMinValues(1)
                  .setMaxValues(7)
                  .addOptions(
                    new StringSelectMenuOptionBuilder().setLabel('Remove All').setValue('all').setEmoji('🔄'),
                    new StringSelectMenuOptionBuilder().setLabel('Single Coin').setValue('c').setEmoji('🪙'),
                    new StringSelectMenuOptionBuilder().setLabel('Double Coin').setValue('cc').setEmoji('🪙'),
                    new StringSelectMenuOptionBuilder().setLabel('Triple Coin').setValue('ccc').setEmoji('🪙'),
                    new StringSelectMenuOptionBuilder().setLabel('Single Diamond').setValue('d').setEmoji('💎'),
                    new StringSelectMenuOptionBuilder().setLabel('Double Diamond').setValue('dd').setEmoji('💎'),
                    new StringSelectMenuOptionBuilder().setLabel('Triple Diamond').setValue('ddd').setEmoji('💎')
                  );
                const rowRemove = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(removeMenu);

                const embed = new EmbedBuilder()
                  .setColor(0x5865F2)
                  .setImage('attachment://riftrolesdesc.png')
                  .setDescription(
                    '🪙 <@&1539118892624912414> - Receive single coin rift notifications.\n' +
                    '🪙 <@&1539118993250459648> - Receive double coin rift notifications.\n' +
                    '🪙 <@&1539119274071957665> - Receive triple coin rift notifications.\n' +
                    '💎 <@&1539119343768440973> - Receive single diamond rift notifications.\n' +
                    '💎 <@&1539119414358573066> - Receive double diamond rift notifications.\n' +
                    '💎 <@&1539119478183563289> - Receive triple diamond rift notifications.'
                  );

                await interaction.channel.send({ 
                    embeds: [embed], 
                    components: [row, rowManual, rowRemove],
                    files: [{ attachment: './riftrolesdesc.png', name: 'riftrolesdesc.png' }]
                }).catch((err: any) => {
                    addLog('error', `Gagal mengirim panel role: ${err.message}`);
                    interaction.followUp({ content: '❌ Terjadi kesalahan saat mengirim panel role.', ephemeral: true });
                });
            } else if (interaction.commandName === 'riftp') {
                // Reply ephemerally to hide the command usage from public chat
                await interaction.reply({ content: '✅ Panel Rift berhasil dimunculkan secara diam-diam.', ephemeral: true });

                // Send Interactive Rift Staff Panel with Select Menus
                const tierMenu = new StringSelectMenuBuilder()
                  .setCustomId('rift_select_tier')
                  .setPlaceholder('Pilih Role Ping Rift...')
                  .addOptions(
                    new StringSelectMenuOptionBuilder().setLabel('Single Coin (@c)').setValue('c').setEmoji('🪙').setDescription('Ping role @c'),
                    new StringSelectMenuOptionBuilder().setLabel('Double Coin (@cc)').setValue('cc').setEmoji('🪙').setDescription('Ping role @cc'),
                    new StringSelectMenuOptionBuilder().setLabel('Triple Coin (@ccc)').setValue('ccc').setEmoji('🪙').setDescription('Ping role @ccc'),
                    new StringSelectMenuOptionBuilder().setLabel('Single Diamond (@d)').setValue('d').setEmoji('💎').setDescription('Ping role @d'),
                    new StringSelectMenuOptionBuilder().setLabel('Double Diamond (@dd)').setValue('dd').setEmoji('💎').setDescription('Ping role @dd'),
                    new StringSelectMenuOptionBuilder().setLabel('Triple Diamond (@ddd)').setValue('ddd').setEmoji('💎').setDescription('Ping role @ddd')
                  );

                const row1 = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(tierMenu);

                const panelEmbed = new EmbedBuilder()
                  .setColor(0x5865F2)
                  .setTitle('🌀 HOTEL HIDEAWAY: PING RIFT STAFF')
                  .setDescription('Halo Staff Rift! Silakan pilih role yang ingin di-ping menggunakan menu di bawah. Setelah memilih role, Anda akan diminta untuk memilih Lokasi/Ruangan Rift.')
                  .setFooter({ text: 'WARPER Hotel Hideaway Rift Dispatcher • Staff Only' })
                  .setTimestamp();

                await interaction.channel.send({ embeds: [panelEmbed], components: [row1] });
                addLog('success', `Sent Staff Rift Panel Select Menu via Slash Command in #${interaction.channel?.name}`);
                return;
            } else if (interaction.commandName === 'rift') {
                const tier = interaction.options.getString('tier');
                const lokasi = interaction.options.getString('lokasi');

                // Manual input format handling
                const cleanTier = tier && ['c', 'cc', 'ccc', 'd', 'dd', 'ddd'].includes(tier) ? tier : 'ccc';
                let broadcastChannel = interaction.channel;
                if (interaction.guild) {
                  const announc = interaction.guild.channels.cache.find((ch: any) =>
                    ch.isTextBased() && (ch.name.toLowerCase().includes('rift-announcement') || ch.name.toLowerCase().includes('rift-announc') || ch.name.toLowerCase().includes('pengumuman'))
                  );
                  if (announc) broadcastChannel = announc;
                }

                let roleMentionText = `@${cleanTier}`;
                if (interaction.guild) {
                   const role = interaction.guild.roles.cache.find((r: any) => r.name.toLowerCase() === cleanTier.toLowerCase() || r.name.toLowerCase() === `@${cleanTier.toLowerCase()}`);
                   if (role) roleMentionText = `<@&${role.id}>`;
                }

                const simpleMsg = `${roleMentionText} (${lokasi || 'Relax'})`;
                await broadcastChannel.send({ content: simpleMsg });

                await interaction.reply({
                   content: `✅ **Berhasil!** Pesan ping telah dikirim ke <#${broadcastChannel.id}>:\n> ${simpleMsg}`,
                   ephemeral: true
                });
                addLog('success', `Rift Ping sent to #${broadcastChannel.name}: ${simpleMsg}`);
                return;
            }
          }

          if (interaction.isStringSelectMenu()) {
            if (interaction.customId === 'rift_select_tier') {
              const selectedTier = interaction.values[0];

              // Present Language selection menu
              const langMenu = new StringSelectMenuBuilder()
                .setCustomId(`rift_lang_${selectedTier}`)
                .setPlaceholder('Pilih Bahasa / Select Language...')
                .addOptions(
                  new StringSelectMenuOptionBuilder().setLabel('Bahasa Indonesia').setValue('id').setEmoji('🇮🇩'),
                  new StringSelectMenuOptionBuilder().setLabel('English').setValue('en').setEmoji('🇬🇧')
                );

              const row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(langMenu);

              await interaction.update({
                content: `**📢 Menu Dispatch Rift**\nRole Tier yang dipilih: **@${selectedTier}**\n\nSilakan pilih Bahasa penyebutan nama ruangan:`,
                components: [row],
                embeds: [],
              });
              return;
            } else if (interaction.customId.startsWith('rift_lang_')) {
              const selectedTier = interaction.customId.replace('rift_lang_', '');
              const selectedLang = interaction.values[0];

              let locOptions: StringSelectMenuOptionBuilder[] = [];

              if (selectedLang === 'id') {
                locOptions = [
                  new StringSelectMenuOptionBuilder().setLabel('Loby').setValue('Loby').setEmoji('🏨'),
                  new StringSelectMenuOptionBuilder().setLabel('Forum furniture').setValue('Forum furniture').setEmoji('🛋️'),
                  new StringSelectMenuOptionBuilder().setLabel('Kamar Catwalk').setValue('Kamar Catwalk').setEmoji('👗'),
                  new StringSelectMenuOptionBuilder().setLabel('Dapur Fusion').setValue('Dapur Fusion').setEmoji('🍳'),
                  new StringSelectMenuOptionBuilder().setLabel('Kamar Velvet').setValue('Kamar Velvet').setEmoji('✨'),
                  new StringSelectMenuOptionBuilder().setLabel('Relaxarium').setValue('Relaxarium').setEmoji('🧘'),
                  new StringSelectMenuOptionBuilder().setLabel('Arena Dance').setValue('Arena Dance').setEmoji('💃'),
                  new StringSelectMenuOptionBuilder().setLabel('Jalan sunset').setValue('Jalan sunset').setEmoji('🌇'),
                  new StringSelectMenuOptionBuilder().setLabel('Studio Match Game').setValue('Studio Match Game').setEmoji('🎮'),
                  new StringSelectMenuOptionBuilder().setLabel('Cove Lulu').setValue('Cove Lulu').setEmoji('🌊'),
                  new StringSelectMenuOptionBuilder().setLabel('Twilight Terrace').setValue('Twilight Terrace').setEmoji('🌙'),
                  new StringSelectMenuOptionBuilder().setLabel('Lantai Teratas').setValue('Lantai Teratas').setEmoji('🏢')
                ];
              } else {
                locOptions = [
                  new StringSelectMenuOptionBuilder().setLabel('Oasis Lobby').setValue('Oasis Lobby').setEmoji('🏨'),
                  new StringSelectMenuOptionBuilder().setLabel('Velvet Beach').setValue('Velvet Beach').setEmoji('🏖️'),
                  new StringSelectMenuOptionBuilder().setLabel('Sunset Street').setValue('Sunset Street').setEmoji('🌇'),
                  new StringSelectMenuOptionBuilder().setLabel('Twilight Terrace').setValue('Twilight Terrace').setEmoji('🌙'),
                  new StringSelectMenuOptionBuilder().setLabel('Fusion Kitchen').setValue('Fusion Kitchen').setEmoji('🍳'),
                  new StringSelectMenuOptionBuilder().setLabel('Velvet Room').setValue('Velvet Room').setEmoji('✨'),
                  new StringSelectMenuOptionBuilder().setLabel('Relaxarium').setValue('Relaxarium').setEmoji('🧘'),
                  new StringSelectMenuOptionBuilder().setLabel('Spa').setValue('Spa').setEmoji('♨️'),
                  new StringSelectMenuOptionBuilder().setLabel('The Theater').setValue('The Theater').setEmoji('🎬'),
                  new StringSelectMenuOptionBuilder().setLabel('Lost Mines').setValue('Lost Mines').setEmoji('⛏️'),
                  new StringSelectMenuOptionBuilder().setLabel('Water Treatment').setValue('Water Treatment').setEmoji('💧'),
                  new StringSelectMenuOptionBuilder().setLabel('Top Floor Room').setValue('Top Floor Room').setEmoji('🏢')
                ];
              }

              const locMenu = new StringSelectMenuBuilder()
                .setCustomId(`rift_loc_${selectedTier}_${selectedLang}`)
                .setPlaceholder(`Pilih Lokasi Ruangan / Select Room...`)
                .addOptions(locOptions);

              const row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(locMenu);

              await interaction.update({
                content: `**📢 Menu Dispatch Rift**\nRole Tier yang dipilih: **@${selectedTier}**\nBahasa: **${selectedLang === 'id' ? '🇮🇩 Indonesia' : '🇬🇧 English'}**\n\nSilakan pilih Ruangan (Lokasi) Rift saat ini:`,
                components: [row],
                embeds: [],
              });
              return;
            } else if (interaction.customId.startsWith('rift_loc_')) {
              // Custom ID format: rift_loc_ccc_en
              const customIdParts = interaction.customId.split('_');
              const selectedTier = customIdParts[2]; // get tier from the array
              const selectedLang = customIdParts[3] || 'id';
              const selectedLoc = interaction.values[0];

              // Present Status selection menu
              const statusMenu = new StringSelectMenuBuilder()
                .setCustomId(`rift_status_${selectedTier}_${selectedLoc.replace(/ /g, '-')}`)
                .setPlaceholder('Pilih Status (Persentase / Baru)...')
                .addOptions(
                  new StringSelectMenuOptionBuilder().setLabel('f (Baru/Full)').setValue('f').setEmoji('✨').setDescription('Pecahan dimensi masih baru (Full)'),
                  new StringSelectMenuOptionBuilder().setLabel('10%').setValue('10%').setEmoji('📉'),
                  new StringSelectMenuOptionBuilder().setLabel('20%').setValue('20%').setEmoji('📉'),
                  new StringSelectMenuOptionBuilder().setLabel('30%').setValue('30%').setEmoji('📉'),
                  new StringSelectMenuOptionBuilder().setLabel('40%').setValue('40%').setEmoji('📉'),
                  new StringSelectMenuOptionBuilder().setLabel('50%').setValue('50%').setEmoji('📊'),
                  new StringSelectMenuOptionBuilder().setLabel('60%').setValue('60%').setEmoji('📊'),
                  new StringSelectMenuOptionBuilder().setLabel('70%').setValue('70%').setEmoji('📊'),
                  new StringSelectMenuOptionBuilder().setLabel('80%').setValue('80%').setEmoji('📈'),
                  new StringSelectMenuOptionBuilder().setLabel('90%').setValue('90%').setEmoji('📈'),
                  new StringSelectMenuOptionBuilder().setLabel('100%').setValue('100%').setEmoji('📈')
                );

              const row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(statusMenu);

              await interaction.update({
                content: `**📢 Menu Dispatch Rift**\nRole Tier: **@${selectedTier}**\nLokasi: **${selectedLoc}**\n\nSilakan pilih Status (Baru [f] atau Persentase):`,
                components: [row],
                embeds: [],
              });
              return;
            } else if (interaction.customId === 'rift_select_roles') {
                const selectedRoles = interaction.values;
                const member = interaction.member;

                if (!member || !interaction.guild) return;

                addLog('info', `Role selection: ${JSON.stringify(selectedRoles)}`);

                const roleMap: Record<string, string> = {
                    'c': '1539118892624912414',
                    'cc': '1539118993250459648',
                    'ccc': '1539119274071957665',
                    'd': '1539119343768440973',
                    'dd': '1539119414358573066',
                    'ddd': '1539119478183563289'
                };

                let rolesToAdd: string[] = [];
                if (selectedRoles.includes('all')) {
                    rolesToAdd = Object.values(roleMap);
                } else {
                    rolesToAdd = selectedRoles.map(r => roleMap[r]).filter(Boolean);
                }

                let added: string[] = [];
                // Add roles
                for (const roleIdOrName of rolesToAdd) {
                    // Try to get by ID first, then search by name
                    let role = interaction.guild.roles.cache.get(roleIdOrName);
                    if (!role) {
                        role = interaction.guild.roles.cache.find((r: any) => 
                            r.name.toLowerCase() === roleIdOrName.toLowerCase() || 
                            r.name.toLowerCase() === `@${roleIdOrName.toLowerCase()}`
                        );
                    }
                    
                    if (role) {
                        addLog('info', `Adding role: ${role.name} (${role.id})`);
                        await member.roles.add(role).catch((err: any) => addLog('error', `Gagal tambah role: ${err.message}`));
                        added.push(role.name);
                    } else {
                        addLog('warn', `Role tidak ditemukan: ${roleIdOrName}`);
                    }
                }

                const replyMessage = await interaction.reply({ 
                    content: `✅ Role yang berhasil diproses: ${added.length > 0 ? added.join(', ') : 'Tidak ada role yang ditemukan'}`, 
                    ephemeral: true,
                    fetchReply: true 
                });

                // Auto-delete after 30 seconds
                setTimeout(async () => {
                    try {
                        await interaction.deleteReply().catch(() => {});
                    } catch (err) {
                        addLog('error', `Gagal menghapus pesan: ${err}`);
                    }
                }, 30000);
                
                return;
            } else if (interaction.customId === 'rift_remove_roles') {
                const selectedRoles = interaction.values;
                const member = interaction.member;

                if (!member || !interaction.guild) return;

                const roleMap: Record<string, string> = {
                    'c': '1539118892624912414',
                    'cc': '1539118993250459648',
                    'ccc': '1539119274071957665',
                    'd': '1539119343768440973',
                    'dd': '1539119414358573066',
                    'ddd': '1539119478183563289'
                };

                let rolesToRemove: string[] = [];
                if (selectedRoles.includes('all')) {
                    rolesToRemove = Object.values(roleMap);
                } else {
                    rolesToRemove = selectedRoles.map(r => roleMap[r]).filter(Boolean);
                }

                let removed: string[] = [];
                // Remove roles
                for (const roleId of rolesToRemove) {
                    const role = interaction.guild.roles.cache.get(roleId);
                    if (role && member.roles.cache.has(roleId)) {
                        await member.roles.remove(role).catch((err: any) => addLog('error', `Gagal hapus role: ${err.message}`));
                        removed.push(role.name);
                    }
                }

                await interaction.reply({ content: `✅ Role yang berhasil dihapus: ${removed.length > 0 ? removed.join(', ') : 'Tidak ada role yang dihapus'}`, ephemeral: true, fetchReply: true });

                // Auto-delete after 30 seconds
                setTimeout(async () => {
                    try {
                        await interaction.deleteReply().catch(() => {});
                    } catch (err) {
                        addLog('error', `Gagal menghapus pesan: ${err}`);
                    }
                }, 30000);
                
                return;
            } else if (interaction.customId === 'open_rift_modal') {
                const modal = new ModalBuilder()
                    .setCustomId('rift_modal_submit')
                    .setTitle('Report Rift Manual');
                
                const roomInput = new TextInputBuilder()
                    .setCustomId('room_input')
                    .setLabel('Room Name')
                    .setStyle(TextInputStyle.Short)
                    .setRequired(true);
                
                const percentInput = new TextInputBuilder()
                    .setCustomId('percent_input')
                    .setLabel('Percentage')
                    .setStyle(TextInputStyle.Short)
                    .setRequired(true);
                
                modal.addComponents(
                    new ActionRowBuilder<TextInputBuilder>().addComponents(roomInput),
                    new ActionRowBuilder<TextInputBuilder>().addComponents(percentInput)
                );
                
                await interaction.showModal(modal);
                return;
            } else if (interaction.customId === 'rift_modal_submit') {
                const room = interaction.fields.getTextInputValue('room_input');
                const percent = interaction.fields.getTextInputValue('percent_input');
                const member = interaction.member;

                if (!member || !interaction.guild) return;

                // Broadcast logic
                const rolePing = '<@&1539118892624912414>'; 
                const simpleMsg = `${rolePing} Rift berlangsung di **${room}** (${percent}%).`;

                let broadcastChannel = interaction.channel;
                const announc = interaction.guild.channels.cache.find((ch: any) =>
                  ch.isTextBased() && (ch.name.toLowerCase().includes('rift-announcement') || ch.name.toLowerCase().includes('rift-announc') || ch.name.toLowerCase().includes('pengumuman'))
                );
                if (announc && announc.isTextBased()) broadcastChannel = announc;

                await (broadcastChannel as any).send({ content: simpleMsg });
                
                await interaction.reply({ content: `✅ Rift reported: **${room}** at **${percent}%**`, ephemeral: true, fetchReply: true });

                // Auto-delete after 30 seconds
                setTimeout(async () => {
                    try {
                        await interaction.deleteReply().catch(() => {});
                    } catch (err) {
                        addLog('error', `Gagal menghapus pesan: ${err}`);
                    }
                }, 30000);
                
                return;
            } else if (interaction.customId.startsWith('rift_status_')) {
              // Custom ID format: rift_status_ccc_Oasis-Lobby
              const customIdParts = interaction.customId.split('_');
              const selectedTier = customIdParts[2]; 
              const selectedLoc = customIdParts.slice(3).join('_').replace(/-/g, ' '); 
              const selectedStatus = interaction.values[0];

              let broadcastChannel = interaction.channel;
              if (interaction.guild) {
                const announc = interaction.guild.channels.cache.find((ch: any) =>
                  ch.isTextBased() && (ch.name.toLowerCase().includes('rift-announcement') || ch.name.toLowerCase().includes('rift-announc') || ch.name.toLowerCase().includes('pengumuman'))
                );
                if (announc) broadcastChannel = announc;
              }

              let roleMentionText = `@${selectedTier}`;
              if (interaction.guild) {
                 const role = interaction.guild.roles.cache.find((r: any) => r.name.toLowerCase() === selectedTier.toLowerCase() || r.name.toLowerCase() === `@${selectedTier.toLowerCase()}`);
                 if (role) roleMentionText = `<@&${role.id}>`;
              }

              // Simple message: @tier (tempat) status
              const simpleMsg = `${roleMentionText} (${selectedLoc}) ${selectedStatus}`;

              await broadcastChannel.send({
                 content: simpleMsg
              });

              // Instead of updating the interaction and destroying the panel, we reply ephemerally
              // and re-render the tier panel for the original message so it stays active
              const tierMenu = new StringSelectMenuBuilder()
                  .setCustomId('rift_select_tier')
                  .setPlaceholder('Pilih Role Ping Rift...')
                  .addOptions(
                    new StringSelectMenuOptionBuilder().setLabel('Single Coin (@c)').setValue('c').setEmoji('🪙').setDescription('Ping role @c'),
                    new StringSelectMenuOptionBuilder().setLabel('Double Coin (@cc)').setValue('cc').setEmoji('🪙').setDescription('Ping role @cc'),
                    new StringSelectMenuOptionBuilder().setLabel('Triple Coin (@ccc)').setValue('ccc').setEmoji('🪙').setDescription('Ping role @ccc'),
                    new StringSelectMenuOptionBuilder().setLabel('Single Diamond (@d)').setValue('d').setEmoji('💎').setDescription('Ping role @d'),
                    new StringSelectMenuOptionBuilder().setLabel('Double Diamond (@dd)').setValue('dd').setEmoji('💎').setDescription('Ping role @dd'),
                    new StringSelectMenuOptionBuilder().setLabel('Triple Diamond (@ddd)').setValue('ddd').setEmoji('💎').setDescription('Ping role @ddd')
                  );

              const row1 = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(tierMenu);

              const panelEmbed = new EmbedBuilder()
                  .setColor(0x5865F2)
                  .setTitle('🌀 HOTEL HIDEAWAY: PING RIFT STAFF')
                  .setDescription('Halo Staff Rift! Silakan pilih role yang ingin di-ping menggunakan menu di bawah. Setelah memilih role, Anda akan diminta untuk memilih Lokasi/Ruangan Rift.')
                  .setFooter({ text: 'WARPER Hotel Hideaway Rift Dispatcher • Staff Only' })
                  .setTimestamp();

              await interaction.update({
                 content: '',
                 embeds: [panelEmbed],
                 components: [row1]
              });

              await interaction.followUp({
                 content: `✅ **Berhasil!** Pesan ping telah dikirim ke <#${broadcastChannel.id}>:\n> ${simpleMsg}`,
                 ephemeral: true
              });
              
              addLog('success', `Rift Ping sent to #${broadcastChannel.name}: ${simpleMsg}`);
              return;
            }
          }

          if (!interaction.isButton()) return;
          const customId = interaction.customId || '';

          if (customId.startsWith('rift_')) {
            if (customId.startsWith('rift_send_')) {
              const parts = customId.split('_');
              const rawTier = parts[2] || 'ccc';
              const loc = parts.slice(3).join('_') || 'Relax';
              const cleanTier = ['c', 'cc', 'ccc', 'd', 'dd', 'ddd'].includes(rawTier) ? rawTier : 'ccc';
              const isCoin = cleanTier.startsWith('c');
              const rolePing = `@${cleanTier}`;

              let roleMentionText = `<@&${rolePing}>`;
              if (interaction.guild) {
                const role = interaction.guild.roles.cache.find(
                  (r: any) => r.name.toLowerCase() === rolePing.toLowerCase() || r.name.toLowerCase() === cleanTier
                );
                if (role) roleMentionText = `<@&${role.id}>`;
              }

              const embed = new EmbedBuilder()
                .setColor(isCoin ? 0xFEE75C : 0x00F0FF)
                .setTitle(`${isCoin ? '🪙' : '💎'} HOTEL HIDEAWAY: ${isCoin ? 'COIN RIFT' : 'DIAMOND RIFT'} ACTIVE!`)
                .setDescription(`Sebuah **${isCoin ? 'Coin Rift' : 'Diamond Rift'} (\`${rolePing}\`)** telah ditemukan dan sedang berlangsung di Hotel Hideaway! Seluruh player dengan role **\`${rolePing}\`** dipersilakan merapat ke **${loc}**.`)
                .addFields(
                  { name: '📍 Lokasi / Ruangan In-Game', value: `**${loc}**`, inline: true },
                  { name: '⭐ Tingkat / Kelangkaan', value: `**${cleanTier.length} Star (${cleanTier.toUpperCase()})**`, inline: true },
                  { name: '⏳ Perkiraan Durasi', value: '**~10-15 Menit** *(Sedang Berlangsung)*', inline: false },
                  { name: '👤 Dilaporkan Oleh', value: `<@${interaction.user.id}> *(Role: Ping Rift)*`, inline: true },
                  { name: '🎯 Role Pinged', value: `\`${rolePing}\``, inline: true }
                )
                .setFooter({ text: 'WARPER Hotel Hideaway Rift Dispatcher • Button Trigger' })
                .setTimestamp();

              // Send to announcement channel or current channel
              let broadcastChannel = interaction.channel;
              if (interaction.guild) {
                const announc = interaction.guild.channels.cache.find((ch: any) =>
                  ch.isTextBased() && (ch.name.includes('rift') || ch.name.includes('announc') || ch.name.includes('pengumuman'))
                );
                if (announc) broadcastChannel = announc;
              }

              await broadcastChannel.send({
                content: `📢 **PING RIFT NOTIFICATION** ➜ ${roleMentionText}\n🌀 **Retakan Dimensi sedang berlangsung di ${loc}! Segera masuk ke room!**`,
                embeds: [embed],
              });

              await interaction.reply({
                content: `✅ **Rift Ping ${rolePing} (${loc}) berhasil disiarkan ke <#${broadcastChannel.id}>!**`,
                ephemeral: true,
              }).catch(() => {});

              addLog('success', `[Button Click] ${interaction.user.username} triggered Rift Ping ${rolePing} (${loc})`);
            } else if (customId.startsWith('rift_tier_') || customId.startsWith('rift_loc_')) {
              await interaction.reply({
                content: `Pilihan tersimpan! Klik tombol '📢 Kirim Ping' untuk menyiarkan announcement.`,
                ephemeral: true,
              }).catch(() => {});
            }
          }
        } catch (intErr: any) {
          console.error('Interaction error:', intErr);
          addLog('error', `Interaction error: ${intErr.message}`);
        }
      });

      c.on('error', (err) => {
        addLog('error', `Discord Client Error: ${err.message}`);
      });

      return c;
    };

    let client: Client;
    let usedFallbackIntents = false;

    try {
      // First attempt: with Privileged MessageContent and GuildMembers intents
      client = setupClient([
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.DirectMessages,
        GatewayIntentBits.GuildMembers,
      ]);
      await client.login(token.trim());
    } catch (initialErr: any) {
      const errStr = (initialErr?.message || '').toLowerCase();
      // If DisallowedIntents error, gracefully fallback to standard intents
      if (errStr.includes('disallowed') || errStr.includes('intent')) {
        addLog('warn', 'Privileged intents (MessageContent/GuildMembers) disabled on Discord Developer Portal. Falling back...');
        try {
          await client.destroy().catch(() => {});
        } catch {}

        usedFallbackIntents = true;
        client = setupClient([
          GatewayIntentBits.Guilds,
          GatewayIntentBits.GuildMessages,
          GatewayIntentBits.DirectMessages,
        ]);
        await client.login(token.trim());
        addLog('info', 'Connected with Standard Intents. Welcome/Goodbye and @mention syncing might be restricted.');
      } else {
        throw initialErr;
      }
    }

    discordClient = client;

    res.json({
      success: true,
      usedFallbackIntents,
      message: usedFallbackIntents
        ? 'WARPER berhasil online dengan Standard Intents! Bot akan merespons saat di-mention (@WARPER). Untuk mengaktifkan respon prefix !w pada semua pesan, aktifkan "Message Content Intent" di Discord Developer Portal.'
        : 'WARPER Discord Bot berhasil terhubung ke Gateway dengan akses penuh!',
    });
  } catch (error: any) {
    console.error('Failed to start Discord bot:', error);
    addLog('error', `Gateway Login Failed: ${error.message}`);
    res.status(500).json({ error: error.message || 'Failed to authenticate with Discord Token' });
  }
});

app.post('/api/warper/live-bot/stop', async (req, res) => {
  try {
    if (discordClient) {
      await discordClient.destroy();
      discordClient = null;
      liveBotStatus.isLive = false;
      addLog('warn', 'WARPER Discord Bot was stopped.');
    }
    res.json({ success: true, message: 'Bot stopped successfully.' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/warper/live-bot/activity', async (req, res) => {
  try {
    const { statusText } = req.body;
    if (!statusText || !statusText.trim()) {
      return res.status(400).json({ error: 'Status text is required' });
    }

    if (discordClient && discordClient.isReady()) {
      discordClient.user?.setActivity(statusText.trim(), { type: ActivityType.Playing });
      addLog('info', `Updated Discord Playing status to: "${statusText.trim()}"`);
      return res.json({ success: true, message: `Status updated to: ${statusText}` });
    } else {
      return res.json({ success: true, message: 'Status saved for next connection.' });
    }
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Live Discord Guilds & Channels Synchronization
app.post('/api/warper/live-bot/rift/dispatch', async (req, res) => {
  try {
    const { tier, location, targetChannelId, notes, reportedBy } = req.body;
    const cleanTier = ['c', 'cc', 'ccc', 'd', 'dd', 'ddd'].includes(tier) ? tier : 'ccc';
    const cleanLocation = location || 'Relax';
    const reporter = reportedBy || 'Staff Ping Rift';

    const isCoin = cleanTier.startsWith('c');
    const rolePing = `@${cleanTier}`;
    const tierColors: Record<string, number> = {
      c: 0xFEE75C,
      cc: 0xF1C40F,
      ccc: 0xE67E22,
      d: 0x00F0FF,
      dd: 0x5865F2,
      ddd: 0xEB459E,
    };
    const tierStars: Record<string, string> = {
      c: '⭐ (1 Star)',
      cc: '⭐⭐ (2 Stars)',
      ccc: '⭐⭐⭐ (3 Stars)',
      d: '⭐ (1 Star)',
      dd: '⭐⭐ (2 Stars)',
      ddd: '⭐⭐⭐ (3 Stars)',
    };

    let discordSent = false;
    let targetChanName = '';

    if (discordClient && discordClient.isReady()) {
      let targetChannel: any = null;
      if (targetChannelId) {
        targetChannel =
          discordClient.channels.cache.get(targetChannelId) ||
          (await discordClient.channels.fetch(targetChannelId).catch(() => null));
      }

      // If no specific channel found, look for announcement or rift channel
      if (!targetChannel) {
        for (const guild of discordClient.guilds.cache.values()) {
          const found = guild.channels.cache.find(
            (c: any) =>
              c.isTextBased() &&
              (c.name.includes('rift') ||
                c.name.includes('announc') ||
                c.name.includes('pengumuman') ||
                c.name.includes('staff'))
          );
          if (found) {
            targetChannel = found;
            break;
          }
        }
      }

      if (targetChannel && targetChannel.isTextBased()) {
        targetChanName = targetChannel.name;
        let roleMentionText = `<@&${rolePing}>`;
        if (targetChannel.guild) {
          const role = targetChannel.guild.roles.cache.find(
            (r: any) =>
              r.name.toLowerCase() === rolePing.toLowerCase() ||
              r.name.toLowerCase() === cleanTier
          );
          if (role) {
            roleMentionText = `<@&${role.id}>`;
          }
        }

        const embed = new EmbedBuilder()
          .setColor(tierColors[cleanTier] || 0x5865F2)
          .setTitle(`${isCoin ? '🪙' : '💎'} HOTEL HIDEAWAY: ${isCoin ? 'COIN RIFT' : 'DIAMOND RIFT'} ACTIVE!`)
          .setDescription(
            `Sebuah **${isCoin ? 'Coin Rift' : 'Diamond Rift'} (\`${rolePing}\`)** telah ditemukan dan sedang berlangsung di Hotel Hideaway! Seluruh player dengan role **\`${rolePing}\`** dipersilakan merapat ke **${cleanLocation}**.`
          )
          .addFields(
            { name: '📍 Lokasi / Ruangan In-Game', value: `**${cleanLocation}**`, inline: true },
            { name: '⭐ Tingkat / Kelangkaan', value: `**${tierStars[cleanTier] || '3 Stars'}**`, inline: true },
            { name: '⏳ Perkiraan Durasi', value: '**~10-15 Menit** *(Sedang Berlangsung)*', inline: false },
            { name: '👤 Dilaporkan Oleh', value: `**${reporter}**`, inline: true },
            { name: '🎯 Role Pinged', value: `\`${rolePing}\``, inline: true }
          )
          .setFooter({ text: 'WARPER Hotel Hideaway Rift Dispatcher • Real-time Tracker' })
          .setTimestamp();

        if (notes && notes.trim()) {
          embed.addFields({ name: '📝 Catatan Tambahan', value: notes.trim(), inline: false });
        }

        await targetChannel.send({
          content: `📢 **PING RIFT NOTIFICATION** ➜ ${roleMentionText}\n🌀 **Retakan Dimensi ${isCoin ? 'Coin' : 'Diamond'} sedang berlangsung di ${cleanLocation}!**`,
          embeds: [embed],
        });
        discordSent = true;
        addLog('success', `🌀 Broadcasted Rift Ping ${rolePing} (${cleanLocation}) to Discord #${targetChanName}`);
      }
    }

    res.json({
      success: true,
      discordSent,
      targetChannel: targetChanName,
      message: `Rift Announcement ${rolePing} di ${cleanLocation} berhasil dikirim!`,
    });
  } catch (err: any) {
    console.error('Rift dispatch error:', err);
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/warper/live-bot/guilds', async (req, res) => {
  try {
    if (!discordClient || !discordClient.isReady()) {
      return res.json({ guilds: [] });
    }

    const liveGuilds = await Promise.all(
      Array.from(discordClient.guilds.cache.values()).map(async (guild) => {
        // Fetch channels if needed
        let channelsList: any[] = [];
        try {
          const channels = await guild.channels.fetch();
          channelsList = Array.from(channels.values())
            .filter((c: any) => c && c.isTextBased && c.isTextBased())
            .map((c: any) => ({
              id: c.id,
              name: c.name,
              type: 'text',
              topic: c.topic || `Channel di ${guild.name}`,
              isLiveDiscord: true,
            }));
        } catch {
          channelsList = [
            {
              id: `live-c-${guild.id}`,
              name: 'general',
              type: 'text',
              topic: 'Live Discord channel',
              isLiveDiscord: true,
            },
          ];
        }

        let membersList: any[] = [];
        try {
          const members = await guild.members.fetch({ limit: 100 });
          membersList = Array.from(members.values()).map((m: any) => ({
            id: m.user.id,
            username: m.user.username,
            displayName: m.user.globalName || m.user.displayName || m.user.username,
            avatar: m.user.displayAvatarURL() || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=60&auto=format&fit=crop&q=80',
            bot: m.user.bot,
            status: m.presence?.status || 'online',
            role: m.user.bot ? 'Bot' : 'Member',
            roleColor: m.displayHexColor !== '#000000' ? m.displayHexColor : (m.user.bot ? '#5865F2' : '#FFFFFF'),
          }));
        } catch {
          // Fallback if GuildMembers intent is missing
        }

        return {
          id: guild.id,
          name: guild.name,
          icon: guild.iconURL() || 'https://assets-global.website-files.com/6257adef93867e50d84d30e2/636e0a6a49cf127bf92de1e2_icon_clyde_blurple_RGB.png',
          memberCount: guild.memberCount,
          isLiveDiscord: true,
          members: membersList,
          channels: channelsList.length > 0 ? channelsList : [
            {
              id: `live-c-${guild.id}`,
              name: 'general',
              type: 'text',
              topic: 'Live Discord channel',
              isLiveDiscord: true,
            },
          ],
        };
      })
    );

    res.json({ guilds: liveGuilds });
  } catch (error: any) {

    console.error('Error fetching live guilds:', error);
    res.status(500).json({ error: error.message, guilds: [] });
  }
});

// Fetch recent messages from a live Discord channel
app.get('/api/warper/live-bot/channel/:channelId/messages', async (req, res) => {
  try {
    const { channelId } = req.params;
    if (!discordClient || !discordClient.isReady()) {
      return res.status(400).json({ error: 'Discord bot is not online.' });
    }

    const channel: any = await discordClient.channels.fetch(channelId).catch(() => null);
    if (!channel || !channel.isTextBased()) {
      return res.status(404).json({ error: 'Channel not found or bot does not have access.' });
    }

    const fetched = await channel.messages.fetch({ limit: 30 }).catch(() => new Map());
    const messages = Array.from(fetched.values()).reverse().map((m: any) => ({
      id: m.id,
      channelId: m.channelId,
      author: {
        id: m.author.id,
        username: m.author.username,
        displayName: m.author.globalName || m.author.displayName || m.author.username,
        avatar: m.author.displayAvatarURL() || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80',
        bot: m.author.bot,
        status: 'online',
        role: m.author.bot ? '⚡ WARPER CORE' : 'Member',
        roleColor: m.author.bot ? '#00F0FF' : '#5865F2',
      },
      content: m.content || '',
      timestamp: new Date(m.createdTimestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      embeds: m.embeds?.map((e: any) => ({
        title: e.title,
        description: e.description,
        color: e.hexColor || '#5865F2',
        fields: e.fields,
      })),
    }));

    res.json({ messages });
  } catch (error: any) {
    console.error('Error fetching channel messages:', error);
    res.status(500).json({ error: error.message });
  }
});

// Clear / Purge messages in a live Discord channel
app.post('/api/warper/live-bot/channel/:channelId/clear', async (req, res) => {
  try {
    const { channelId } = req.params;
    const { amount } = req.body;
    if (!discordClient || !discordClient.isReady()) {
      return res.status(400).json({ error: 'Discord bot is not online.' });
    }

    const channel: any = await discordClient.channels.fetch(channelId).catch(() => null);
    if (!channel || !channel.isTextBased()) {
      return res.status(404).json({ error: 'Channel not found or bot does not have access.' });
    }

    const deleteCount = Math.min(Math.max(parseInt(amount, 10) || 100, 1), 100);
    let deletedSize = 0;

    try {
      const deleted = await channel.bulkDelete(deleteCount, true);
      deletedSize = deleted.size;
    } catch {
      const messages = await channel.messages.fetch({ limit: Math.min(deleteCount, 30) });
      for (const msg of messages.values()) {
        await msg.delete().catch(() => {});
        deletedSize++;
      }
    }

    // Send confirmation message that auto deletes
    const embed = new EmbedBuilder()
      .setColor(0x57F287)
      .setTitle('🧹 WARPER Channel Clear')
      .setDescription(`Telah membersihkan **${deletedSize}** pesan di channel ini.`)
      .setFooter({ text: 'WARPER Moderation Core' })
      .setTimestamp();

    const confirmMsg = await channel.send({ embeds: [embed] }).catch(() => null);
    if (confirmMsg) {
      setTimeout(() => confirmMsg.delete().catch(() => {}), 6000);
    }

    addLog('success', `🧹 Cleared ${deletedSize} messages in Discord channel #${channel.name || channelId}`);
    res.json({ success: true, count: deletedSize });
  } catch (error: any) {
    console.error('Error clearing channel messages via API:', error);
    addLog('error', `Clear channel API error: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
});

// Fetch mentions (roles and members) for a live Discord channel
app.get('/api/warper/live-bot/channel/:channelId/mentions', async (req, res) => {
  try {
    const { channelId } = req.params;
    if (!discordClient || !discordClient.isReady()) {
      return res.json({ roles: [], members: [] });
    }

    const channel: any = await discordClient.channels.fetch(channelId).catch(() => null);
    if (!channel || !channel.guild) {
      return res.json({ roles: [], members: [] });
    }

    const guild = channel.guild;

    // Fetch roles
    const roles = Array.from(guild.roles.cache.values())
      .filter((r: any) => r.name && r.name !== '@everyone')
      .map((r: any) => ({
        id: r.id,
        name: r.name,
        color: r.hexColor !== '#000000' ? r.hexColor : '#5865F2',
        position: r.position,
        mentionable: r.mentionable,
        isRole: true,
      }))
      .sort((a, b) => (b.position || 0) - (a.position || 0));

    // Special mentions
    const specialMentions = [
      { id: 'everyone', name: 'everyone', color: '#FEE75C', isEveryone: true, mentionText: '@everyone' },
      { id: 'here', name: 'here', color: '#57F287', isHere: true, mentionText: '@here' },
    ];

    // Fetch cached members
    const members = Array.from(guild.members.cache.values())
      .map((m: any) => ({
        id: m.id,
        username: m.user.username,
        displayName: m.displayName || m.user.globalName || m.user.username,
        avatar: m.user.displayAvatarURL() || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80',
        bot: m.user.bot,
        roleColor: m.displayHexColor !== '#000000' ? m.displayHexColor : '#5865F2',
        isUser: true,
      }))
      .slice(0, 100);

    res.json({
      guildId: guild.id,
      guildName: guild.name,
      specialMentions,
      roles,
      members,
    });
  } catch (error: any) {
    console.error('Error fetching channel mentions:', error);
    res.status(500).json({ error: error.message, roles: [], members: [] });
  }
});

// Send message to a live Discord channel directly as WARPER bot
app.post('/api/warper/live-bot/channel/:channelId/send', async (req, res) => {
  try {
    const { channelId } = req.params;
    const { content, triggerAi } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({ error: 'Message content is required.' });
    }

    if (!discordClient || !discordClient.isReady()) {
      return res.status(400).json({ error: 'Discord bot is not online. Connect the bot first.' });
    }

    const channel: any = await discordClient.channels.fetch(channelId).catch(() => null);
    if (!channel || !channel.isTextBased()) {
      return res.status(404).json({ error: 'Channel not found or bot does not have access.' });
    }

    let processedContent = content.trim();

    // Convert @RoleName to <@&ROLE_ID> and @Username to <@USER_ID> so Discord triggers live pings
    if (channel.guild) {
      const guildRoles = Array.from(channel.guild.roles.cache.values()) as any[];
      for (const role of guildRoles) {
        if (role.name && role.name !== '@everyone') {
          // Replace @RoleName with <@&role.id>
          const escaped = role.name.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
          const regex = new RegExp(`@${escaped}(?=[\\s.,!?]|$)`, 'gi');
          processedContent = processedContent.replace(regex, `<@&${role.id}>`);
        }
      }

      const guildMembers = Array.from(channel.guild.members.cache.values()) as any[];
      for (const m of guildMembers) {
        const names = [m.user.username, m.displayName].filter(Boolean);
        for (const name of names) {
          if (name && name.length >= 2) {
            const escaped = name.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
            const regex = new RegExp(`@${escaped}(?=[\\s.,!?]|$)`, 'gi');
            processedContent = processedContent.replace(regex, `<@${m.id}>`);
          }
        }
      }
    }

    let sentMessage: any;

    if (triggerAi) {
      // Send as AI response generated on the fly
      await channel.sendTyping().catch(() => {});
      const ai = getGeminiClient();
      const response = await ai.models.generateContent({
        model: 'gemini-3.7-flash',
        contents: content,
        config: {
          systemInstruction: 'You are WARPER, a smart and friendly AI assistant on Discord.',
        },
      });

      const replyText = response.text || 'Halo dari WARPER AI!';
      sentMessage = await channel.send({
        content: replyText,
        allowedMentions: { parse: ['roles', 'users', 'everyone'] },
      });
      liveBotStatus.totalCommandsProcessed += 1;
      addLog('ai', `Sent AI response to live Discord channel #${channel.name}: "${replyText.substring(0, 50)}..."`);
    } else {
      // Direct message from the bot with full role and user ping capabilities
      sentMessage = await channel.send({
        content: processedContent,
        allowedMentions: { parse: ['roles', 'users', 'everyone'] },
      });
      addLog('success', `Sent live message to Discord channel #${channel.name}: "${processedContent.substring(0, 60)}"`);
    }

    res.json({
      success: true,
      messageId: sentMessage.id,
      content: sentMessage.content,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    });
  } catch (error: any) {
    console.error('Error sending message to live channel:', error);
    addLog('error', `Failed to send message to live Discord channel: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
});

// 7. Bot Code Export Generator
app.post('/api/warper/export-code', (req, res) => {
  const { framework, botConfig } = req.body;
  const botName = botConfig?.name || 'WARPER';
  const prefix = botConfig?.prefix || '!w';

  if (framework === 'python') {
    const pythonCode = `# ==========================================
# ${botName} - Smart Discord Bot (Python discord.py)
# Powered by Google Gemini 3.7 Flash
# ==========================================

import os
import discord
from discord.ext import commands
from google import genai
from dotenv import load_dotenv

load_dotenv()

# Setup Gemini AI Client
ai = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

# Discord Bot Setup
intents = discord.Intents.default()
intents.message_content = True
bot = commands.Bot(command_prefix="${prefix} ", intents=intents)

SYSTEM_PROMPT = """${botConfig?.customPrompt || 'You are ' + botName + ', a smart Discord AI bot.'}"""

@bot.event
async def on_ready():
    print(f"⚡ {bot.user.name} is ONLINE and connected to Discord!")
    await bot.change_presence(activity=discord.Game(name="${prefix} ask | 🧠 Gemini AI"))

@bot.command(name="ask")
async def ask(ctx, *, question: str):
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
            embed.set_footer(text="Powered by Google Gemini AI")
            await ctx.reply(embed=embed)
        except Exception as e:
            await ctx.reply(f"❌ Error: {str(e)}")

@bot.command(name="code")
async def code(ctx, lang: str, *, task: str):
    async with ctx.typing():
        try:
            prompt = f"Language: {lang}\\nTask: {task}\\nWrite clean code with comments."
            response = ai.models.generate_content(
                model="gemini-3.7-flash",
                contents=prompt,
                config={"system_instruction": "You are a professional code generator."}
            )
            embed = discord.Embed(
                title=f"💻 {botName} Code Lab • {lang}",
                description=response.text[:4000],
                color=0x00F0FF
            )
            await ctx.reply(embed=embed)
        except Exception as e:
            await ctx.reply(f"❌ Error: {str(e)}")

@bot.event
async def on_message(message):
    if message.author.bot:
        return
    
    # Mention handler
    if bot.user in message.mentions:
        clean_content = message.content.replace(f"<@{bot.user.id}>", "").strip()
        if clean_content:
            async with message.channel.typing():
                response = ai.models.generate_content(
                    model="gemini-3.7-flash",
                    contents=clean_content,
                    config={"system_instruction": SYSTEM_PROMPT}
                )
                await message.reply(response.text)
        else:
            await message.reply(f"Halo! Saya **${botName}**. Gunakan \`${prefix} ask <pertanyaan>\` untuk mulai!")
            
    await bot.process_commands(message)

if __name__ == "__main__":
    bot.run(os.getenv("DISCORD_BOT_TOKEN"))
`;
    return res.json({ code: pythonCode, filename: 'bot.py', language: 'python' });
  }

  // Default: Node.js discord.js
  const nodeCode = `// ==========================================
// ${botName} - Smart Discord Bot (Node.js discord.js v14)
// Powered by Google Gemini 3.7 Flash
// ==========================================

import 'dotenv/config';
import { Client, GatewayIntentBits, Partials, EmbedBuilder, ActivityType } from 'discord.js';
import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
  partials: [Partials.Channel, Partials.Message],
});

const PREFIX = '${prefix}';
const SYSTEM_PROMPT = \`${botConfig?.customPrompt || 'You are ' + botName + ', a smart Discord AI bot.'}\`;

client.once('ready', () => {
  console.log(\`⚡ \${client.user.tag} is ONLINE!\`);
  client.user.setActivity('${prefix} ask | 🧠 Gemini AI', { type: ActivityType.Playing });
});

client.on('messageCreate', async (message) => {
  if (message.author.bot) return;

  const isMentioned = message.mentions.has(client.user);
  const isCommand = message.content.startsWith(PREFIX);

  if (isMentioned || isCommand) {
    await message.channel.sendTyping();

    let query = message.content;
    if (isMentioned) query = query.replace(new RegExp(\`<@!?\${client.user.id}>\`, 'g'), '').trim();
    if (isCommand) query = query.slice(PREFIX.length).trim();

    if (!query) {
      return message.reply(\`Halo! Saya **${botName}**. Ketik \` + PREFIX + \` ask <pertanyaan> untuk bertanya!\`);
    }

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3.7-flash',
        contents: query,
        config: {
          systemInstruction: SYSTEM_PROMPT,
        },
      });

      const replyText = response.text || 'Tidak ada respons.';

      if (replyText.length < 1900) {
        await message.reply(replyText);
      } else {
        const embed = new EmbedBuilder()
          .setColor(0x5865F2)
          .setTitle('🧠 ${botName} Response')
          .setDescription(replyText.substring(0, 4000))
          .setFooter({ text: 'Powered by Google Gemini 3.7 Flash' });
        await message.reply({ embeds: [embed] });
      }
    } catch (err) {
      console.error(err);
      message.reply(\`❌ Terjadi error: \${err.message}\`);
    }
  }
});

client.login(process.env.DISCORD_BOT_TOKEN);
`;

  res.json({ code: nodeCode, filename: 'index.js', language: 'javascript' });
});

// ----------------------------------------------------
// VITE MIDDLEWARE SETUP
// ----------------------------------------------------
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`WARPER Bot Server listening on port ${PORT}`);
  });
}

startServer();
