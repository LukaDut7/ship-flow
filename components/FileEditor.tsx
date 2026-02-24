"use client";

import { useStore } from "@/lib/store";
import { PHASES } from "@/lib/phases";

export default function FileEditor() {
  const {
    activePhaseId, activeFileId, files,
    setActiveFile, loadTemplate, saveVersion, toggleComplete,
    updateFileContent, restoreVersion,
  } = useStore();

  const phase = PHASES.find(p => p.id === activePhaseId)!;
  const spec = phase.files.find(f => f.id === activeFileId)!;
  const fk = `${activePhaseId}/${activeFileId}`;
  const fd = files[fk];

  if (!fd) return null;

  return (
    <div className="flex-1 flex flex-col overflow-hidden border-r border-border-primary">
      {/* Toolbar */}
      <div className="px-3.5 py-1.5 border-b border-border-primary flex items-center gap-1.5 shrink-0">
        <button
          onClick={() => setActiveFile(null)}
          className="text-[10px] text-text-faint hover:text-text-secondary"
        >
          ← back
        </button>
        <span className="text-border-primary">|</span>
        <span className="text-[12px] font-bold flex-1">{spec.name}</span>

        {!fd.content && (
          <button
            onClick={loadTemplate}
            className="text-[10px] bg-border-secondary border border-text-faint text-text-secondary px-2 py-0.5 rounded hover:bg-text-faint/20"
          >
            Template
          </button>
        )}
        <button
          onClick={saveVersion}
          className="text-[10px] bg-border-secondary border border-text-faint px-2 py-0.5 rounded"
          style={{ color: fd.content ? "#A1A1AA" : "#27272A" }}
        >
          💾
        </button>
        <button
          onClick={toggleComplete}
          className="text-[10px] px-2 py-0.5 rounded"
          style={{
            background: fd.complete ? "rgba(16,185,129,0.09)" : "#27272A",
            border: `1px solid ${fd.complete ? "rgba(16,185,129,0.19)" : "#3F3F46"}`,
            color: fd.complete ? "#10B981" : "#A1A1AA",
          }}
        >
          {fd.complete ? "✓ Done" : "Done"}
        </button>
      </div>

      {/* Info bar */}
      <div className="px-3.5 py-1 border-b border-border-primary bg-bg-tertiary shrink-0 flex gap-3">
        <span className="text-[10px] text-text-dim">
          Do: <span className="text-text-muted">{spec.what}</span>
        </span>
        <span className="text-[10px]">
          Done: <span className="text-persona-alex">{spec.done}</span>
        </span>
      </div>

      {/* Editor */}
      <textarea
        value={fd.content}
        onChange={e => updateFileContent(e.target.value)}
        placeholder="Paste AI result here, or use Template, or chat →"
        className="flex-1 bg-bg-tertiary text-zinc-300 border-none p-3.5 text-[12px] font-mono leading-[1.8] resize-none outline-none placeholder:text-text-faint"
        spellCheck={false}
      />

      {/* Version history */}
      {fd.versions.length > 0 && (
        <div className="px-3.5 py-1 border-t border-border-primary shrink-0">
          <details>
            <summary className="text-[9px] text-text-faint cursor-pointer">
              📜 {fd.versions.length} version{fd.versions.length > 1 ? "s" : ""}
            </summary>
            {fd.versions.slice().reverse().map((v, i) => (
              <button
                key={i}
                onClick={() => restoreVersion(v.content)}
                className="block text-[9px] text-text-dim cursor-pointer hover:text-text-secondary"
              >
                {v.label} — {new Date(v.ts).toLocaleTimeString()}{" "}
                <span className="text-text-faint">restore</span>
              </button>
            ))}
          </details>
        </div>
      )}
    </div>
  );
}
