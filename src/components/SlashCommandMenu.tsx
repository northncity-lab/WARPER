import React, { useState } from 'react';
import { SLASH_COMMANDS } from '../data/discordMock';
import { SlashCommandDef } from '../types';
import { Terminal, Sparkles, Code2, FileText, Globe2, BarChart2, ShieldCheck, Dices, Server, Cpu, X, Send, Trash2 } from 'lucide-react';

interface SlashCommandMenuProps {
  isOpen: boolean;
  onClose: () => void;
  onExecuteCommand: (command: string, args: Record<string, any>) => void;
}

export const SlashCommandMenu: React.FC<SlashCommandMenuProps> = ({
  isOpen,
  onClose,
  onExecuteCommand,
}) => {
  const [selectedCommand, setSelectedCommand] = useState<SlashCommandDef>(SLASH_COMMANDS[0]);
  const [argValues, setArgValues] = useState<Record<string, string>>({
    prompt: 'Jelaskan cara kerja Google Gemini AI secara ringkas dan menarik!',
    language: 'TypeScript',
    task: 'Buat discord bot slash command handler dengan type safety',
    text: 'Discord adalah platform komunikasi suara, video, dan teks yang digunakan oleh ratusan juta orang untuk berkumpul dan mengobrol dengan komunitas dan teman.',
    target: 'Japanese',
    question: 'Siapa game developer terbaik?',
    options: 'Nintendo, Valve, FromSoftware, Rockstar',
    check: 'Klik di sini untuk klaim Free Nitro 3 Bulan http://scam-discord.xyz',
    sides: '20',
    amount: '100',
  });

  if (!isOpen) return null;

  const getCommandIcon = (name: string) => {
    switch (name) {
      case 'ask':
        return <Sparkles className="w-4 h-4 text-[#5865F2]" />;
      case 'code':
        return <Code2 className="w-4 h-4 text-[#00F0FF]" />;
      case 'summarize':
        return <FileText className="w-4 h-4 text-[#57F287]" />;
      case 'translate':
        return <Globe2 className="w-4 h-4 text-[#FEE75C]" />;
      case 'clear':
        return <Trash2 className="w-4 h-4 text-[#ED4245]" />;
      case 'poll':
        return <BarChart2 className="w-4 h-4 text-[#EB459E]" />;
      case 'automod':
        return <ShieldCheck className="w-4 h-4 text-[#ED4245]" />;
      case 'dice':
        return <Dices className="w-4 h-4 text-[#FEE75C]" />;
      case 'serverinfo':
        return <Server className="w-4 h-4 text-[#5865F2]" />;
      case 'botstatus':
        return <Cpu className="w-4 h-4 text-[#00F0FF]" />;
      default:
        return <Terminal className="w-4 h-4 text-[#949BA4]" />;
    }
  };

  const handleRun = () => {
    onExecuteCommand(selectedCommand.name, argValues);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
      <div className="w-full max-w-2xl bg-[#313338] border border-[#202225] rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="px-5 py-3.5 bg-[#2B2D31] border-b border-[#202225] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded bg-[#5865F2] flex items-center justify-center text-white font-bold text-sm">
              /
            </div>
            <div>
              <h3 className="text-base font-bold text-white leading-tight">
                WARPER Slash Commands Hub
              </h3>
              <p className="text-xs text-[#949BA4]">
                Pilih dan jalankan perintah cerdas bertenaga Gemini 3.7 Flash
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-[#949BA4] hover:text-white p-1 rounded-md hover:bg-[#35373C] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Layout */}
        <div className="grid grid-cols-1 md:grid-cols-12 flex-1 overflow-hidden">
          {/* Commands List (Left) */}
          <div className="md:col-span-5 bg-[#2B2D31] p-3 border-r border-[#202225] overflow-y-auto space-y-1">
            <div className="text-[11px] font-bold text-[#949BA4] uppercase px-2 mb-2">
              DAFTAR PERINTAH
            </div>
            {SLASH_COMMANDS.map((cmd) => {
              const isSelected = selectedCommand.name === cmd.name;
              return (
                <button
                  key={cmd.name}
                  onClick={() => setSelectedCommand(cmd)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left transition-colors cursor-pointer text-xs font-semibold ${
                    isSelected
                      ? 'bg-[#5865F2] text-white shadow-sm'
                      : 'text-[#DBDEE1] hover:bg-[#35373C]'
                  }`}
                >
                  <span className="p-1 rounded bg-[#202225]/40">{getCommandIcon(cmd.name)}</span>
                  <div className="truncate flex-1">
                    <span className="font-bold">/warper {cmd.name}</span>
                    <div className="text-[10px] opacity-80 truncate font-normal">{cmd.description}</div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Command Config / Arguments (Right) */}
          <div className="md:col-span-7 p-5 bg-[#313338] overflow-y-auto flex flex-col justify-between space-y-4">
            <div className="space-y-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs px-2 py-0.5 rounded bg-[#5865F2]/20 text-[#5865F2] font-mono font-bold">
                    {selectedCommand.category}
                  </span>
                  <h4 className="text-lg font-bold text-white">/warper {selectedCommand.name}</h4>
                </div>
                <p className="text-xs text-[#B5BAC1] leading-relaxed">
                  {selectedCommand.description}
                </p>
              </div>

              {/* Arguments Inputs based on command */}
              <div className="space-y-3 bg-[#2B2D31] p-3.5 rounded-lg border border-[#202225]">
                <div className="text-xs font-bold text-[#949BA4] uppercase tracking-wide">
                  ARGUMEN PERINTAH
                </div>

                {selectedCommand.name === 'ask' && (
                  <div>
                    <label className="block text-xs font-semibold text-white mb-1">
                      prompt (Pertanyaan AI):
                    </label>
                    <textarea
                      rows={3}
                      value={argValues.prompt || ''}
                      onChange={(e) => setArgValues({ ...argValues, prompt: e.target.value })}
                      className="w-full bg-[#1E1F22] border border-[#202225] rounded-md p-2.5 text-xs text-white placeholder-[#80848E] focus:outline-none focus:border-[#5865F2]"
                      placeholder="Masukkan pertanyaan untuk WARPER..."
                    />
                  </div>
                )}

                {selectedCommand.name === 'code' && (
                  <div className="space-y-2.5">
                    <div>
                      <label className="block text-xs font-semibold text-white mb-1">
                        language (Bahasa Pemrograman):
                      </label>
                      <input
                        type="text"
                        value={argValues.language || ''}
                        onChange={(e) => setArgValues({ ...argValues, language: e.target.value })}
                        className="w-full bg-[#1E1F22] border border-[#202225] rounded-md p-2 text-xs text-white focus:outline-none focus:border-[#5865F2]"
                        placeholder="TypeScript, Python, C++, Go, Rust..."
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-white mb-1">
                        task (Tugas / Algoritma / Fitur):
                      </label>
                      <textarea
                        rows={2}
                        value={argValues.task || ''}
                        onChange={(e) => setArgValues({ ...argValues, task: e.target.value })}
                        className="w-full bg-[#1E1F22] border border-[#202225] rounded-md p-2 text-xs text-white focus:outline-none focus:border-[#5865F2]"
                        placeholder="Deskripsi kode yang ingin dibuat..."
                      />
                    </div>
                  </div>
                )}

                {selectedCommand.name === 'summarize' && (
                  <div>
                    <label className="block text-xs font-semibold text-white mb-1">
                      text (Teks untuk dirangkum):
                    </label>
                    <textarea
                      rows={3}
                      value={argValues.text || ''}
                      onChange={(e) => setArgValues({ ...argValues, text: e.target.value })}
                      className="w-full bg-[#1E1F22] border border-[#202225] rounded-md p-2.5 text-xs text-white focus:outline-none focus:border-[#5865F2]"
                      placeholder="Paste teks panjang di sini..."
                    />
                  </div>
                )}

                {selectedCommand.name === 'translate' && (
                  <div className="space-y-2.5">
                    <div>
                      <label className="block text-xs font-semibold text-white mb-1">
                        target (Bahasa Tujuan):
                      </label>
                      <input
                        type="text"
                        value={argValues.target || ''}
                        onChange={(e) => setArgValues({ ...argValues, target: e.target.value })}
                        className="w-full bg-[#1E1F22] border border-[#202225] rounded-md p-2 text-xs text-white focus:outline-none focus:border-[#5865F2]"
                        placeholder="Japanese, English, Korean, German..."
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-white mb-1">
                        text (Kalimat):
                      </label>
                      <textarea
                        rows={2}
                        value={argValues.text || ''}
                        onChange={(e) => setArgValues({ ...argValues, text: e.target.value })}
                        className="w-full bg-[#1E1F22] border border-[#202225] rounded-md p-2 text-xs text-white focus:outline-none focus:border-[#5865F2]"
                      />
                    </div>
                  </div>
                )}

                {selectedCommand.name === 'clear' && (
                  <div>
                    <label className="block text-xs font-semibold text-white mb-1">
                      amount (Jumlah pesan maksimal yang ingin dibersihkan):
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={100}
                      value={argValues.amount || '100'}
                      onChange={(e) => setArgValues({ ...argValues, amount: e.target.value })}
                      className="w-full bg-[#1E1F22] border border-[#202225] rounded-md p-2 text-xs text-white focus:outline-none focus:border-[#5865F2]"
                      placeholder="100 (Default: semua chat hingga 100 pesan)"
                    />
                    <p className="text-[11px] text-[#949BA4] mt-1.5 leading-relaxed">
                      💡 Perintah ini akan menghapus semua riwayat chat di channel aktif secara instan dan membersihkan pesan lama.
                    </p>
                  </div>
                )}

                {selectedCommand.name === 'poll' && (
                  <div className="space-y-2.5">
                    <div>
                      <label className="block text-xs font-semibold text-white mb-1">
                        question (Pertanyaan Voting):
                      </label>
                      <input
                        type="text"
                        value={argValues.question || ''}
                        onChange={(e) => setArgValues({ ...argValues, question: e.target.value })}
                        className="w-full bg-[#1E1F22] border border-[#202225] rounded-md p-2 text-xs text-white focus:outline-none focus:border-[#5865F2]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-white mb-1">
                        options (Pisahkan dengan koma):
                      </label>
                      <input
                        type="text"
                        value={argValues.options || ''}
                        onChange={(e) => setArgValues({ ...argValues, options: e.target.value })}
                        className="w-full bg-[#1E1F22] border border-[#202225] rounded-md p-2 text-xs text-white focus:outline-none focus:border-[#5865F2]"
                        placeholder="Opsi 1, Opsi 2, Opsi 3..."
                      />
                    </div>
                  </div>
                )}

                {selectedCommand.name === 'automod' && (
                  <div>
                    <label className="block text-xs font-semibold text-white mb-1">
                      check (Teks untuk diuji keamanannya):
                    </label>
                    <textarea
                      rows={2}
                      value={argValues.check || ''}
                      onChange={(e) => setArgValues({ ...argValues, check: e.target.value })}
                      className="w-full bg-[#1E1F22] border border-[#202225] rounded-md p-2.5 text-xs text-white focus:outline-none focus:border-[#5865F2]"
                    />
                  </div>
                )}

                {selectedCommand.name === 'dice' && (
                  <div>
                    <label className="block text-xs font-semibold text-white mb-1">
                      sides (Jumlah Sisi Dadu):
                    </label>
                    <select
                      value={argValues.sides || '20'}
                      onChange={(e) => setArgValues({ ...argValues, sides: e.target.value })}
                      className="w-full bg-[#1E1F22] border border-[#202225] rounded-md p-2 text-xs text-white focus:outline-none focus:border-[#5865F2]"
                    >
                      <option value="6">D6 (Standard 6-sided)</option>
                      <option value="20">D20 (RPG D20 dice)</option>
                      <option value="100">D100 (Percentage dice)</option>
                    </select>
                  </div>
                )}

                {(selectedCommand.name === 'serverinfo' || selectedCommand.name === 'botstatus') && (
                  <p className="text-xs text-[#949BA4]">
                    Perintah ini tidak memerlukan parameter tambahan. WARPER akan langsung mengambil data status server & AI.
                  </p>
                )}
              </div>

              {/* Examples */}
              <div>
                <div className="text-[11px] font-bold text-[#949BA4] uppercase mb-1.5">
                  CONTOH PENGGUNAAN
                </div>
                <div className="space-y-1">
                  {selectedCommand.examples.map((ex, i) => (
                    <div
                      key={i}
                      className="text-xs font-mono text-[#57F287] bg-[#232428] px-2.5 py-1.5 rounded border border-[#1E1F22]"
                    >
                      {ex}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Execute Button */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#202225]">
              <button
                onClick={onClose}
                className="px-4 py-2 rounded-md text-xs font-semibold text-[#DBDEE1] hover:bg-[#35373C] transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                id="btn-execute-slash-cmd"
                onClick={handleRun}
                className="px-4 py-2 rounded-md bg-[#5865F2] hover:bg-[#4752C4] text-white text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 shadow-md"
              >
                <Send className="w-3.5 h-3.5" />
                Jalankan Command
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
