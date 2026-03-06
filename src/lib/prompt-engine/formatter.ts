import type { TargetTool } from "@prisma/client"
import { formatCursor } from "./formatters/cursor"
import { formatClaudeProjects } from "./formatters/claude-projects"
import { formatClaudeCode } from "./formatters/claude-code"
import { formatChatGPT } from "./formatters/chatgpt"
import { formatGeneric } from "./formatters/generic"

export function formatPrompt(assembled: string, tool: TargetTool): string {
  switch (tool) {
    case "CURSOR":
      return formatCursor(assembled)
    case "CLAUDE_PROJECTS":
      return formatClaudeProjects(assembled)
    case "CLAUDE_CODE":
      return formatClaudeCode(assembled)
    case "CHATGPT":
      return formatChatGPT(assembled)
    case "GENERIC":
    default:
      return formatGeneric(assembled)
  }
}
