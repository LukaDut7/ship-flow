"use client";

import { PersonaKey } from "@/lib/types";
import { PERSONAS, PERSONA_KEYS } from "@/lib/personas";

interface Props {
  value: PersonaKey;
  onChange: (key: PersonaKey) => void;
  size?: "sm" | "md";
  className?: string;
}

export default function PersonaSelector({ value, onChange, size = "sm", className = "" }: Props) {
  const p = PERSONAS[value];
  const textSize = size === "sm" ? "text-[11px]" : "text-[12px]";
  const pad = size === "sm" ? "py-1 px-1" : "py-1.5 px-2";

  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value as PersonaKey)}
      className={`${textSize} ${pad} rounded bg-bg-input border border-border-secondary text-text-secondary cursor-pointer outline-none ${className}`}
      style={{ color: p.color }}
    >
      {PERSONA_KEYS.map(k => (
        <option key={k} value={k}>
          {PERSONAS[k].icon} {PERSONAS[k].name} ({PERSONAS[k].role})
        </option>
      ))}
    </select>
  );
}
