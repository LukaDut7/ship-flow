"use client";

import { useRef, useEffect } from "react";
import { useStore } from "@/lib/store";
import { PHASES } from "@/lib/phases";
import { PERSONAS, PERSONA_KEYS } from "@/lib/personas";
import PersonaSelector from "./PersonaSelector";

export default function ChatPanel() {
  const {
    activePhaseId, activeFileId, activePersonaKey, chatActive, chatInput, files,
    setActivePersona, setChatActive, setChatInput, sendChat,
    pasteToFile, getCurrentMessages, getFilePersonas, startChat,
  } = useStore();

  const chatEndRef = useRef<HTMLDivElement>(null);
  const persona = PERSONAS[activePersonaKey];
  const msgs = getCurrentMessages();

  const phase = PHASES.find(p => p.id === activePhaseId)!;
  const fileSpec = activeFileId ? phase.files.find(f => f.id === activeFileId) : null;
  const fileKey = activeFileId ? `${activePhaseId}/${activeFileId}` : null;
  const filePersonas = fileKey ? getFilePersonas(fileKey) : [];

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [msgs]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendChat();
    }
  };

  return (
    <div className="w-[280px] flex flex-col shrink-0">
      {/* Header */}
      <div className="px-2.5 py-[7px] border-b border-border-primary flex items-center gap-1.5 shrink-0">
        <div
          className="w-[22px] h-[22px] rounded-full flex items-center justify-center text-[11px]"
          style={{ background: `${persona.color}12` }}
        >
          {persona.icon}
        </div>
        <select
          value={activePersonaKey}
          onChange={e => {
            setActivePersona(e.target.value as typeof activePersonaKey);
          }}
          className="flex-1 bg-transparent border-none text-text-primary text-[11px] font-bold cursor-pointer outline-none"
        >
          {PERSONA_KEYS.map(k => (
            <option key={k} value={k} className="bg-bg-secondary">
              {PERSONAS[k].icon} {PERSONAS[k].name} ({PERSONAS[k].role})
            </option>
          ))}
        </select>
        <span className="text-[9px] text-text-faint">
          {fileSpec?.name || ""}
        </span>
        {chatActive && (
          <button
            onClick={() => setChatActive(false)}
            className="text-[8px] bg-border-primary border border-border-secondary text-text-dim px-1.5 py-px rounded"
          >
            ×
          </button>
        )}
      </div>

      {!chatActive ? (
        /* Idle state */
        <div className="flex-1 flex flex-col items-center justify-center px-4 text-center">
          <div className="text-[26px] mb-1.5">{persona.icon}</div>
          <div className="text-[12px] font-semibold" style={{ color: persona.color }}>
            {persona.name}, {persona.role}
          </div>
          <div className="text-[10px] text-text-faint leading-relaxed mt-1 mb-3">
            Expand a checklist item →<br />click &ldquo;Chat&rdquo; to start
          </div>
          <div className="text-[9px] text-border-secondary border border-border-primary rounded px-2 py-1.5">
            Or copy prompt for any AI
          </div>
        </div>
      ) : (
        <>
          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-2 py-1.5">
            {msgs.map((msg, i) => (
              <div key={i} className="mb-1.5">
                <div
                  className="px-2.5 py-1.5 rounded-lg text-[11px] leading-relaxed"
                  style={{
                    background: msg.role === "user" ? "#1E1E22" : `${persona.color}06`,
                    border: msg.role === "user" ? "none" : `1px solid ${persona.color}0D`,
                    marginLeft: msg.role === "user" ? 20 : 0,
                    marginRight: msg.role === "user" ? 0 : 14,
                  }}
                >
                  {/* Show persona icon for assistant messages */}
                  {msg.role === "assistant" && msg.persona && (
                    <span className="text-[9px] mr-1 opacity-60">
                      {PERSONAS[msg.persona]?.icon}
                    </span>
                  )}
                  <span className="whitespace-pre-wrap">{msg.text}</span>
                </div>
                {msg.role === "assistant" && activeFileId && (
                  <button
                    onClick={() => pasteToFile(msg.text)}
                    className="text-[8px] text-text-faint bg-transparent border-none cursor-pointer mt-px px-1"
                  >
                    📎 → {fileSpec?.name}
                  </button>
                )}
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>

          {/* Input area */}
          <div className="px-2 py-1.5 border-t border-border-primary shrink-0">
            {/* Persona tabs for file */}
            {filePersonas.length > 1 && (
              <div className="flex gap-[3px] mb-1">
                {filePersonas.map(pk => (
                  <button
                    key={pk}
                    onClick={() => {
                      setActivePersona(pk);
                      if (activeFileId) startChat(activeFileId, pk);
                    }}
                    className="text-[8px] px-1.5 py-px rounded"
                    style={{
                      background: pk === activePersonaKey ? `${PERSONAS[pk].color}18` : "transparent",
                      border: `1px solid ${pk === activePersonaKey ? PERSONAS[pk].color + "30" : "#1E1E22"}`,
                      color: PERSONAS[pk].color,
                    }}
                  >
                    {PERSONAS[pk].icon}
                  </button>
                ))}
              </div>
            )}

            <div className="flex gap-1">
              <input
                value={chatInput}
                onChange={e => setChatInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={`Ask ${persona.name}...`}
                className="flex-1 bg-bg-secondary border border-border-primary rounded px-2 py-1.5 text-text-primary text-[11px] outline-none placeholder:text-text-faint focus:border-border-secondary"
              />
              <button
                onClick={sendChat}
                className="border-none text-white px-2.5 py-1.5 rounded text-[11px] font-bold"
                style={{ background: persona.color }}
              >
                ↑
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
