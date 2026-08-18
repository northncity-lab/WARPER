import React, { useState } from 'react';
import { DiscordEmbed as DiscordEmbedType } from '../types';
import { Check, Copy, ExternalLink } from 'lucide-react';

interface DiscordEmbedProps {
  embed: DiscordEmbedType;
}

export const DiscordEmbed: React.FC<DiscordEmbedProps> = ({ embed }) => {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const copyCode = (code: string, idx: number) => {
    navigator.clipboard.writeText(code);
    setCopiedIndex(idx);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  // Helper to render markdown-like text (bold, code blocks, bullet points)
  const renderFormattedText = (text?: string) => {
    if (!text) return null;

    // Split by code blocks ```lang ... ```
    const codeBlockRegex = /```([a-zA-Z0-9_-]*)\n([\s\S]*?)```/g;
    const parts = [];
    let lastIndex = 0;
    let match;
    let blockIdx = 0;

    while ((match = codeBlockRegex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        parts.push({
          type: 'text',
          content: text.substring(lastIndex, match.index),
        });
      }
      parts.push({
        type: 'code',
        lang: match[1] || 'plaintext',
        content: match[2],
        idx: blockIdx++,
      });
      lastIndex = match.index + match[0].length;
    }

    if (lastIndex < text.length) {
      parts.push({
        type: 'text',
        content: text.substring(lastIndex),
      });
    }

    return (
      <div className="space-y-2 text-sm leading-relaxed text-[#DCDDDE]">
        {parts.map((part, index) => {
          if (part.type === 'code') {
            return (
              <div key={index} className="my-2 overflow-hidden rounded-md border border-[#202225] bg-[#2B2D31]">
                <div className="flex items-center justify-between border-b border-[#202225] px-3 py-1.5 text-xs text-[#949BA4]">
                  <span className="font-mono uppercase font-semibold text-[#5865F2]">{part.lang}</span>
                  <button
                    onClick={() => copyCode(part.content || '', part.idx || 0)}
                    className="flex items-center gap-1 hover:text-white transition-colors cursor-pointer text-xs"
                    title="Copy Code"
                  >
                    {copiedIndex === part.idx ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-[#57F287]" />
                        <span className="text-[#57F287]">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                </div>
                <pre className="p-3 text-xs font-mono text-[#E0E1E5] overflow-x-auto whitespace-pre leading-5">
                  <code>{part.content}</code>
                </pre>
              </div>
            );
          }

          // Inline text formatting (bold, inline code, italics, links)
          const lines = (part.content || '').split('\n');
          return (
            <div key={index} className="space-y-1">
              {lines.map((line, lIdx) => {
                if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
                  return (
                    <div key={lIdx} className="flex items-start gap-2 pl-1">
                      <span className="text-[#5865F2] mt-1 text-xs">•</span>
                      <span>{renderInlineMarkdown(line.replace(/^[-*]\s+/, ''))}</span>
                    </div>
                  );
                }
                return <p key={lIdx}>{renderInlineMarkdown(line)}</p>;
              })}
            </div>
          );
        })}
      </div>
    );
  };

  const renderInlineMarkdown = (line: string) => {
    // Replace **bold**
    const parts = line.split(/(\*\*.*?\*\*|`.*?`|\bhttps?:\/\/[^\s]+)/g);
    return parts.map((seg, i) => {
      if (seg.startsWith('**') && seg.endsWith('**')) {
        return <strong key={i} className="font-semibold text-white">{seg.slice(2, -2)}</strong>;
      }
      if (seg.startsWith('`') && seg.endsWith('`')) {
        return <code key={i} className="bg-[#2B2D31] text-[#E0E1E5] px-1.5 py-0.5 rounded font-mono text-xs border border-[#202225]">{seg.slice(1, -1)}</code>;
      }
      if (seg.startsWith('http')) {
        return (
          <a key={i} href={seg} target="_blank" rel="noreferrer" className="text-[#00A8FC] hover:underline inline-flex items-center gap-0.5">
            {seg} <ExternalLink className="w-3 h-3 inline" />
          </a>
        );
      }
      return seg;
    });
  };

  const borderColor = embed.color || '#5865F2';

  return (
    <div
      className="mt-2.5 max-w-2xl rounded-lg bg-[#2B2D31] p-4 text-sm text-[#DCDDDE] border-l-4 shadow-sm"
      style={{ borderLeftColor: borderColor }}
    >
      {/* Author */}
      {embed.author && (
        <div className="flex items-center gap-2 mb-2 text-xs font-semibold text-white">
          {embed.author.icon_url && (
            <img src={embed.author.icon_url} alt="" className="w-5 h-5 rounded-full object-cover" />
          )}
          <span>{embed.author.name}</span>
        </div>
      )}

      {/* Title */}
      {embed.title && (
        <h4 className="text-base font-bold text-white mb-2 tracking-tight">
          {embed.title}
        </h4>
      )}

      {/* Description */}
      {embed.description && (
        <div className="mb-3">
          {renderFormattedText(embed.description)}
        </div>
      )}

      {/* Fields */}
      {embed.fields && embed.fields.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 my-3">
          {embed.fields.map((field, fIdx) => (
            <div
              key={fIdx}
              className={`${field.inline ? 'col-span-1' : 'col-span-full'} rounded bg-[#232428] p-2.5 border border-[#1E1F22]`}
            >
              <div className="text-xs font-bold text-[#B5BAC1] uppercase tracking-wide mb-1">
                {field.name}
              </div>
              <div className="text-sm text-white font-medium break-words">
                {renderInlineMarkdown(field.value)}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Footer */}
      {(embed.footer || embed.timestamp) && (
        <div className="mt-3 flex items-center justify-between text-[11px] text-[#949BA4] border-t border-[#35373C] pt-2">
          <span>{embed.footer?.text || 'WARPER Discord Bot'}</span>
          {embed.timestamp && (
            <span>{new Date(embed.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
          )}
        </div>
      )}
    </div>
  );
};
