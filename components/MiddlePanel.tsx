"use client";

import { useStore } from "@/lib/store";
import PhaseView from "./PhaseView";
import FileEditor from "./FileEditor";

export default function MiddlePanel() {
  const { activeFileId } = useStore();
  return activeFileId ? <FileEditor /> : <PhaseView />;
}
