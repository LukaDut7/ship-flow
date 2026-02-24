"use client";

import { createContext, useContext, useState, useCallback, ReactNode } from "react";
import { PersonaKey, FileData, ChatMessage } from "./types";
import { PHASES } from "./phases";
import { PERSONAS, PERSONA_RESPONSES } from "./personas";

interface StoreState {
  activePhaseId: string;
  activeFileId: string | null;
  activePersonaKey: PersonaKey;
  expandedItem: string | null;
  expandedPhases: Record<string, boolean>;
  chatActive: boolean;
  chatInput: string;
  files: Record<string, FileData>;
  chatMessages: Record<string, ChatMessage[]>;
  chatPersonas: Record<string, PersonaKey[]>;
  copied: string | null;
}

interface StoreActions {
  setActivePhase: (phaseId: string) => void;
  setActiveFile: (fileId: string | null) => void;
  setActivePersona: (key: PersonaKey) => void;
  setExpandedItem: (id: string | null) => void;
  togglePhaseExpanded: (phaseId: string) => void;
  setChatActive: (active: boolean) => void;
  setChatInput: (input: string) => void;
  setCopied: (id: string | null) => void;
  copyPrompt: (text: string, id: string) => void;
  startChat: (fileId: string, personaKey?: PersonaKey) => void;
  sendChat: () => void;
  pasteToFile: (text: string) => void;
  loadTemplate: () => void;
  saveVersion: () => void;
  toggleComplete: () => void;
  updateFileContent: (content: string) => void;
  restoreVersion: (content: string) => void;
  navigatePhase: (phaseId: string) => void;
  getFilePersonas: (fileKey: string) => PersonaKey[];
  getPhaseProgress: (phaseId: string) => { total: number; done: number; pct: number };
  getTotalProgress: () => { total: number; done: number };
  getChatKey: () => string | null;
  getCurrentMessages: () => ChatMessage[];
}

type Store = StoreState & StoreActions;

const StoreContext = createContext<Store | null>(null);

function initFiles(): Record<string, FileData> {
  const init: Record<string, FileData> = {};
  PHASES.forEach(ph =>
    ph.files.forEach(f => {
      init[`${ph.id}/${f.id}`] = { content: "", versions: [], complete: false };
    })
  );
  return init;
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [activePhaseId, setActivePhaseId] = useState(PHASES[0].id);
  const [activeFileId, setActiveFileIdRaw] = useState<string | null>(null);
  const [activePersonaKey, setActivePersonaKey] = useState<PersonaKey>("sara");
  const [expandedItem, setExpandedItem] = useState<string | null>(null);
  const [expandedPhases, setExpandedPhases] = useState<Record<string, boolean>>({});
  const [chatActive, setChatActive] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [files, setFiles] = useState<Record<string, FileData>>(initFiles);
  const [chatMessages, setChatMessages] = useState<Record<string, ChatMessage[]>>({});
  const [chatPersonas, setChatPersonas] = useState<Record<string, PersonaKey[]>>({});
  const [copied, setCopied] = useState<string | null>(null);

  const activePhase = PHASES.find(p => p.id === activePhaseId)!;
  const fileKey = activeFileId ? `${activePhaseId}/${activeFileId}` : null;
  const activeFileSpec = activeFileId ? activePhase.files.find(f => f.id === activeFileId) : null;

  const getChatKey = useCallback(() => {
    return fileKey ? `${fileKey}/${activePersonaKey}` : null;
  }, [fileKey, activePersonaKey]);

  const getCurrentMessages = useCallback((): ChatMessage[] => {
    const ck = getChatKey();
    return ck ? (chatMessages[ck] || []) : [];
  }, [getChatKey, chatMessages]);

  const trackPersona = useCallback((fk: string, pk: PersonaKey) => {
    setChatPersonas(prev => {
      const existing = prev[fk] || [];
      return existing.includes(pk) ? prev : { ...prev, [fk]: [...existing, pk] };
    });
  }, []);

  const getFilePersonas = useCallback((fk: string): PersonaKey[] => {
    return chatPersonas[fk] || [];
  }, [chatPersonas]);

  const getPhaseProgress = useCallback((phId: string) => {
    const ph = PHASES.find(p => p.id === phId)!;
    const total = ph.files.length;
    const done = ph.files.filter(f => files[`${phId}/${f.id}`]?.complete).length;
    return { total, done, pct: total > 0 ? Math.round((done / total) * 100) : 0 };
  }, [files]);

  const getTotalProgress = useCallback(() => {
    const total = PHASES.reduce((s, p) => s + p.files.length, 0);
    const done = Object.values(files).filter(f => f.complete).length;
    return { total, done };
  }, [files]);

  const setActivePhase = useCallback((phaseId: string) => {
    setActivePhaseId(phaseId);
    setActiveFileIdRaw(null);
    setChatActive(false);
    setExpandedItem(null);
  }, []);

  const setActiveFile = useCallback((fileId: string | null) => {
    setActiveFileIdRaw(fileId);
    setExpandedItem(null);
    if (fileId) {
      const spec = activePhase.files.find(f => f.id === fileId);
      if (spec) setActivePersonaKey(spec.dp);
    }
  }, [activePhase]);

  const togglePhaseExpanded = useCallback((phaseId: string) => {
    setExpandedPhases(prev => ({ ...prev, [phaseId]: !prev[phaseId] }));
  }, []);

  const copyPrompt = useCallback((text: string, id: string) => {
    navigator.clipboard?.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  }, []);

  const startChat = useCallback((fileId: string, pk?: PersonaKey) => {
    const personaKey = pk || activePersonaKey;
    setActivePersonaKey(personaKey);
    setActiveFileIdRaw(fileId);
    setChatActive(true);

    const f = activePhase.files.find(x => x.id === fileId)!;
    const ck = `${activePhaseId}/${fileId}/${personaKey}`;
    const fk = `${activePhaseId}/${fileId}`;
    trackPersona(fk, personaKey);

    setChatMessages(prev => {
      if (prev[ck]?.length) return prev;
      return {
        ...prev,
        [ck]: [{
          role: "assistant",
          text: PERSONAS[personaKey].greeting + `\n\nLet's work on **${f.label}**. ${f.what}`,
          ts: Date.now(),
          persona: personaKey,
        }],
      };
    });
  }, [activePersonaKey, activePhase, activePhaseId, trackPersona]);

  const sendChat = useCallback(() => {
    if (!chatInput.trim()) return;
    const ck = getChatKey();
    if (!ck || !fileKey) return;

    trackPersona(fileKey, activePersonaKey);
    const prev = chatMessages[ck] || [];
    const msgs: ChatMessage[] = [
      ...prev,
      { role: "user", text: chatInput, ts: Date.now() },
      {
        role: "assistant",
        text: `${PERSONA_RESPONSES[activePersonaKey]} For **${activeFileSpec?.name || "this"}**:\n\n[In production, this connects to Claude API with project context + phase prompt.]`,
        ts: Date.now(),
        persona: activePersonaKey,
      },
    ];
    setChatMessages(p => ({ ...p, [ck]: msgs }));
    setChatInput("");
  }, [chatInput, getChatKey, fileKey, activePersonaKey, activeFileSpec, chatMessages, trackPersona]);

  const pasteToFile = useCallback((text: string) => {
    if (!fileKey) return;
    setFiles(prev => {
      const f = prev[fileKey];
      return { ...prev, [fileKey]: { ...f, content: f.content ? f.content + "\n\n" + text : text } };
    });
  }, [fileKey]);

  const loadTemplate = useCallback(() => {
    if (!fileKey || !activeFileSpec) return;
    setFiles(prev => ({ ...prev, [fileKey]: { ...prev[fileKey], content: activeFileSpec.template } }));
  }, [fileKey, activeFileSpec]);

  const saveVersion = useCallback(() => {
    if (!fileKey || !files[fileKey]?.content) return;
    setFiles(prev => {
      const f = prev[fileKey];
      return {
        ...prev,
        [fileKey]: {
          ...f,
          versions: [...f.versions, { content: f.content, ts: Date.now(), label: `v${f.versions.length + 1}` }],
        },
      };
    });
  }, [fileKey, files]);

  const toggleComplete = useCallback(() => {
    if (!fileKey) return;
    setFiles(prev => ({ ...prev, [fileKey]: { ...prev[fileKey], complete: !prev[fileKey].complete } }));
  }, [fileKey]);

  const updateFileContent = useCallback((content: string) => {
    if (!fileKey) return;
    setFiles(prev => ({ ...prev, [fileKey]: { ...prev[fileKey], content } }));
  }, [fileKey]);

  const restoreVersion = useCallback((content: string) => {
    if (!fileKey) return;
    setFiles(prev => ({ ...prev, [fileKey]: { ...prev[fileKey], content } }));
  }, [fileKey]);

  const navigatePhase = useCallback((phaseId: string) => {
    setActivePhaseId(phaseId);
    setActiveFileIdRaw(null);
    setExpandedItem(null);
  }, []);

  const store: Store = {
    activePhaseId, activeFileId, activePersonaKey, expandedItem, expandedPhases,
    chatActive, chatInput, files, chatMessages, chatPersonas, copied,
    setActivePhase, setActiveFile, setActivePersona: setActivePersonaKey,
    setExpandedItem, togglePhaseExpanded, setChatActive, setChatInput, setCopied,
    copyPrompt, startChat, sendChat, pasteToFile, loadTemplate, saveVersion,
    toggleComplete, updateFileContent, restoreVersion, navigatePhase,
    getFilePersonas, getPhaseProgress, getTotalProgress, getChatKey, getCurrentMessages,
  };

  return <StoreContext.Provider value={store}>{children}</StoreContext.Provider>;
}

export function useStore(): Store {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be inside StoreProvider");
  return ctx;
}
