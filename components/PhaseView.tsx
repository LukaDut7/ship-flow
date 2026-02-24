"use client";

import { useStore } from "@/lib/store";
import { PHASES } from "@/lib/phases";
import ChecklistItem from "./ChecklistItem";

export default function PhaseView() {
  const { activePhaseId, setActiveFile, navigatePhase } = useStore();
  const phase = PHASES.find(p => p.id === activePhaseId)!;

  return (
    <div className="flex-1 flex flex-col overflow-hidden border-r border-border-primary">
      <div className="flex-1 overflow-y-auto px-4 py-3.5">
        {/* Phase header */}
        <div className="flex items-center gap-2 mb-1">
          <span className="text-lg">{phase.icon}</span>
          <h2 className="text-base font-extrabold m-0" style={{ color: phase.color }}>
            Phase {phase.num}: {phase.name}
          </h2>
        </div>
        <div className="text-[11px] text-text-dim mb-3">
          {phase.duration} • {phase.goal}
        </div>

        {/* Checklist items */}
        {phase.files.map(f => (
          <ChecklistItem
            key={f.id}
            file={f}
            phaseId={phase.id}
            phaseColor={phase.color}
          />
        ))}

        {/* Gate */}
        <div
          className="rounded-md p-2.5 mt-2 border"
          style={{ background: "rgba(239,68,68,0.04)", borderColor: "rgba(239,68,68,0.07)" }}
        >
          <div className="text-[9px] font-bold text-persona-taylor">🚦 GATE</div>
          <div className="text-[11px] leading-relaxed" style={{ color: "#FCA5A5" }}>
            {phase.gate}
          </div>
        </div>

        {/* Navigation */}
        <div className="flex justify-between mt-2.5">
          {phase.num > 1 && (
            <button
              onClick={() => navigatePhase(PHASES[phase.num - 2].id)}
              className="bg-border-primary border border-border-secondary text-text-dim px-2.5 py-1 rounded text-[11px] hover:text-text-secondary"
            >
              ← {PHASES[phase.num - 2].name}
            </button>
          )}
          <div className="flex-1" />
          {phase.num < PHASES.length && (
            <button
              onClick={() => navigatePhase(PHASES[phase.num].id)}
              className="border-none text-white px-2.5 py-1 rounded text-[11px] font-semibold"
              style={{ background: phase.color }}
            >
              {PHASES[phase.num].name} →
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
