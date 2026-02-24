import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: {
          primary: "#09090B",
          secondary: "#18181B",
          tertiary: "#0A0A0C",
          input: "#0A0A0F",
        },
        border: {
          primary: "#1E1E22",
          secondary: "#27272A",
        },
        text: {
          primary: "#E4E4E7",
          secondary: "#A1A1AA",
          muted: "#71717A",
          dim: "#52525B",
          faint: "#3F3F46",
        },
        persona: {
          sara: "#3B82F6",
          jordan: "#8B5CF6",
          yuki: "#EC4899",
          alex: "#10B981",
          marcus: "#F59E0B",
          taylor: "#EF4444",
        },
      },
    },
  },
  plugins: [],
};

export default config;
