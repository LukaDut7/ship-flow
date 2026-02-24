"use client";

import { useStore } from "@/lib/store";

export default function TopBar() {
  const { getTotalProgress } = useStore();
  const { total, done } = getTotalProgress();

  return (
    <div className="h-[38px] border-b border-border-primary flex items-center px-4 gap-3 shrink-0">
      <span className="text-[13px] font-extrabold tracking-tight">⚡ ShipFlow</span>
      <span className="text-[10px] text-text-faint">Idea → Production → Growth</span>
      <div className="flex-1" />
      <span className="text-[9px] bg-persona-jordan/5 text-persona-jordan px-1.5 py-0.5 rounded font-mono">
        Expo + NestJS + K8s + AWS
      </span>
      <span className="text-[10px] text-text-faint">{done}/{total}</span>
    </div>
  );
}
