"use client";

import { useStore } from "@/lib/store";
import { PHASES } from "@/lib/phases";
import { PERSONAS } from "@/lib/personas";

export default function Sidebar() {
  const {
    activePhaseId, activeFileId, files, expandedPhases,
    setActivePhase, setActiveFile, setActivePersona,
    togglePhaseExpanded, getPhaseProgress, getFilePersonas,
    setChatActive,
  } = useStore();

  return (
    <div className="w-[220px] border-r border-border-primary overflow-y-auto shrink-0">
      <div className="px-2.5 py-2 text-[9px] text-text-faint font-bold uppercase tracking-widest">
        Phases
      </div>

      {PHASES.map(ph => {
        const prog = getPhaseProgress(ph.id);
        const isActive = activePhaseId === ph.id;
        const isExpanded = expandedPhases[ph.id];

        return (
          <div key={ph.id}>
            {/* Phase row */}
            <div
              className="flex items-center"
              style={{
                borderLeft: isActive ? `2px solid ${ph.color}` : "2px solid transparent",
                background: isActive && !activeFileId ? `${ph.color}06` : "transparent",
              }}
            >
              {/* Expand toggle */}
              <button
                onClick={(e) => { e.stopPropagation(); togglePhaseExpanded(ph.id); }}
                className="w-[26px] flex items-center justify-center py-1.5 shrink-0"
              >
                <span className="text-[9px] text-text-faint font-mono select-none">
                  {isExpanded ? "▾" : "▸"}
                </span>
              </button>

              {/* Phase name */}
              <button
                onClick={() => setActivePhase(ph.id)}
                className="flex-1 flex items-center gap-1.5 py-1.5 pr-1.5 text-left"
              >
                <span className="text-[11px]">{ph.icon}</span>
                <span
                  className="text-[11px] font-semibold flex-1 truncate"
                  style={{ color: isActive ? ph.color : "#71717A" }}
                >
                  {ph.name}
                </span>
                {prog.pct === 100 ? (
                  <span className="text-[9px] text-persona-alex">✓</span>
                ) : prog.done > 0 ? (
                  <span className="text-[9px] text-text-dim">{prog.done}/{prog.total}</span>
                ) : null}
              </button>
            </div>

            {/* File list */}
            {isExpanded && ph.files.map(f => {
              const fk = `${ph.id}/${f.id}`;
              const fd = files[fk];
              const isFileActive = activePhaseId === ph.id && activeFileId === f.id;
              const fp = getFilePersonas(fk);

              return (
                <button
                  key={f.id}
                  onClick={() => {
                    if (activePhaseId !== ph.id) {
                      setActivePhase(ph.id);
                    }
                    setActiveFile(f.id);
                    setActivePersona(f.dp);
                    setChatActive(false);
                  }}
                  className="w-full flex items-center gap-1 py-0.5 pr-1.5 text-left"
                  style={{
                    paddingLeft: "40px",
                    background: isFileActive ? "#18181B" : "transparent",
                  }}
                >
                  <span
                    className="text-[9px]"
                    style={{
                      color: fd?.complete ? "#10B981" : fd?.content ? "#F59E0B" : "#27272A",
                    }}
                  >
                    {fd?.complete ? "✓" : fd?.content ? "◐" : "○"}
                  </span>
                  <span
                    className="text-[10px] font-mono truncate flex-1"
                    style={{ color: isFileActive ? "#E4E4E7" : "#52525B" }}
                  >
                    {f.name}
                  </span>
                  {fp.length > 0 && (
                    <span className="flex gap-px">
                      {fp.map(pk => (
                        <span
                          key={pk}
                          className="text-[8px] opacity-70"
                          title={PERSONAS[pk].name}
                        >
                          {PERSONAS[pk].icon}
                        </span>
                      ))}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}
