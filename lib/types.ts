export type PersonaKey = "sara" | "jordan" | "yuki" | "alex" | "marcus" | "taylor";

export interface Persona {
  name: string;
  role: string;
  icon: string;
  color: string;
  greeting: string;
}

export interface FileSpec {
  id: string;
  name: string;
  label: string;
  dp: PersonaKey;
  what: string;
  done: string;
  prompt: string;
  template: string;
}

export interface Phase {
  id: string;
  num: number;
  name: string;
  icon: string;
  color: string;
  duration: string;
  goal: string;
  files: FileSpec[];
  gate: string;
}

export interface FileData {
  content: string;
  versions: { content: string; ts: number; label: string }[];
  complete: boolean;
}

export interface ChatMessage {
  role: "user" | "assistant";
  text: string;
  ts: number;
  persona?: PersonaKey;
}
