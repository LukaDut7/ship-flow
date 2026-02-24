import { Persona, PersonaKey } from "./types";

export const PERSONAS: Record<PersonaKey, Persona> = {
  sara: { name: "Sara", role: "PM", icon: "📋", color: "#3B82F6", greeting: "Let's define what we're building." },
  jordan: { name: "Jordan", role: "CTO", icon: "🧭", color: "#8B5CF6", greeting: "Let's make architecture decisions." },
  yuki: { name: "Yuki", role: "Designer", icon: "🎨", color: "#EC4899", greeting: "Let's design something users enjoy." },
  alex: { name: "Alex", role: "DevOps", icon: "🔧", color: "#10B981", greeting: "Let's set up infra that doesn't break." },
  marcus: { name: "Marcus", role: "Lead Dev", icon: "🔨", color: "#F59E0B", greeting: "Show me the criterion. Test first." },
  taylor: { name: "Taylor", role: "QA", icon: "🧪", color: "#EF4444", greeting: "I'm going to break everything." },
};

export const PERSONA_KEYS: PersonaKey[] = Object.keys(PERSONAS) as PersonaKey[];

export const PERSONA_RESPONSES: Record<PersonaKey, string> = {
  sara: "Let me shape this.",
  jordan: "Let me evaluate tradeoffs.",
  yuki: "From a UX perspective...",
  alex: "Here are the exact commands.",
  marcus: "Let's start with the test.",
  taylor: "I'll try to break this.",
};
