"use client";

import { useStore } from "@/lib/store";
import { PERSONAS } from "@/lib/personas";
import { FileSpec } from "@/lib/types";
import PersonaSelector from "./PersonaSelector";

interface Props {
  file: FileSpec;
  phaseId: string;
  phaseColor: string;
}

export default function ChecklistItem({ file, phaseId, phaseColor }: Props) {
  const {
    activePersonaKey, expandedItem, files, copied,
    setExpandedItem, setActivePersona, setActiveFile,
    copyPrompt, startChat, getFilePersonas,
  } = useStore();

  const fk = `${phaseId}/${file.id}`;
  const fd = files[fk];
  const isExpanded = expandedItem === file.id;
  const dp = PERSONAS[file.dp];
  const persona = PERSONAS[activePersonaKey];
  const fp = getFilePersonas(fk);

  return (
    <div
      className="rounded-lg mb-1.5 overflow-hidden"
      style={{
        background: "#18181B",
        border: fd?.complete
          ? "1px solid rgba(16,185,129,0.12)"
          : isExpanded
          ? `1px solid ${phaseColor}10`
          : "1px solid #1E1E22",
      }}
    >
      {/* Header row */}
      <button
        onClick={() => setExpandedItem(isExpanded ? null : file.id)}
        className="flex items-center gap-2 px-3 py-2 w-full text-left"
      >
        {/* Checkbox */}
        <div
          className="w-[18px] h-[18px] rounded shrink-0 flex items-center justify-center text-[10px]"
          style={{
            border: fd?.complete ? "none" : "2px solid #3F3F46",
            background: fd?.complete ? "#10B981" : fd?.content ? "rgba(245,158,11,0.09)" : "transparent",
            color: "#fff",
          }}
        >
          {fd?.complete ? "✓" : fd?.content ? "◐" : ""}
        </div>

        {/* Label + filename */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span
              className="text-[12px] font-semibold"
              style={{ color: fd?.complete ? "#52525B" : "#E4E4E7" }}
            >
              {file.label}
            </span>
            <span className="text-[9px] opacity-60" title={`Default: ${dp.name}`}>
              {dp.icon}
            </span>
            {/* Personas who chatted */}
            {fp.length > 0 && (
              <span className="flex gap-0.5 ml-0.5">
                {fp.map(pk => (
                  <span
                    key={pk}
                    title={`${PERSONAS[pk].name} chatted`}
                    className="text-[9px] px-[3px] rounded leading-4"
                    style={{
                      background: `${PERSONAS[pk].color}15`,
                      color: PERSONAS[pk].color,
                    }}
                  >
                    {PERSONAS[pk].icon}
                  </span>
                ))}
              </span>
            )}
          </div>
          <div className="text-[10px] text-border-secondary">{file.name}</div>
        </div>

        <span className="text-border-secondary text-[10px]">
          {isExpanded ? "▾" : "▸"}
        </span>
      </button>

      {/* Expanded content */}
      {isExpanded && (
        <div className="px-3 pb-3 border-t border-border-primary">
          {/* What / Done when */}
          <div className="mt-2 flex gap-4 mb-2">
            <div>
              <div className="text-[9px] text-text-faint">WHAT</div>
              <div className="text-[11px] text-text-secondary">{file.what}</div>
            </div>
            <div>
              <div className="text-[9px] text-text-faint">DONE WHEN</div>
              <div className="text-[11px] text-persona-alex">{file.done}</div>
            </div>
          </div>

          {/* Prompt */}
          <div className="mb-2">
            <div className="text-[9px] text-text-faint mb-1">🤖 PROMPT</div>
            <div className="bg-bg-input rounded-md p-2.5 border border-border-primary relative max-h-[180px] overflow-y-auto prompt-box">
              <pre className="text-[10px] text-text-dim leading-relaxed font-mono whitespace-pre-wrap break-words m-0">
                {file.prompt}
              </pre>
              <button
                onClick={(e) => { e.stopPropagation(); copyPrompt(file.prompt, file.id); }}
                className="sticky bottom-0 float-right text-[9px] px-2 py-0.5 rounded font-semibold"
                style={{
                  background: copied === file.id ? "rgba(16,185,129,0.09)" : "#1E1E22",
                  border: `1px solid ${copied === file.id ? "rgba(16,185,129,0.14)" : "#27272A"}`,
                  color: copied === file.id ? "#10B981" : "#71717A",
                }}
              >
                {copied === file.id ? "✓ Copied" : "📋 Copy"}
              </button>
            </div>
          </div>

          {/* Persona selector + actions */}
          <div className="flex gap-1.5 items-center">
            <PersonaSelector
              value={activePersonaKey}
              onChange={setActivePersona}
            />
            <button
              onClick={() => startChat(file.id)}
              className="flex-1 py-1.5 rounded text-[11px] font-semibold"
              style={{
                background: `${persona.color}0D`,
                border: `1px solid ${persona.color}20`,
                color: persona.color,
              }}
            >
              Chat with {persona.name} →
            </button>
            <button
              onClick={() => setActiveFile(file.id)}
              className="flex-1 py-1.5 rounded text-[11px] font-semibold bg-border-primary border border-border-secondary text-text-muted"
            >
              📝 {fd?.content ? "Edit" : "Paste →"} {file.name}
            </button>
          </div>

          {/* Past persona chats */}
          {fp.length > 0 && (
            <div className="mt-1.5 flex gap-1 flex-wrap">
              {fp.map(pk => (
                <button
                  key={pk}
                  onClick={() => startChat(file.id, pk)}
                  className="text-[9px] px-1.5 py-0.5 rounded cursor-pointer"
                  style={{
                    background: `${PERSONAS[pk].color}0A`,
                    border: `1px solid ${PERSONAS[pk].color}18`,
                    color: PERSONAS[pk].color,
                  }}
                >
                  {PERSONAS[pk].icon} {PERSONAS[pk].name} chat
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
