import { encode } from "next-auth/jwt"
import {
  DESKTOP_SESSION_COOKIE_NAME,
  DESKTOP_SESSION_MAX_AGE,
} from "./auth-constants"

export interface DesktopSessionUser {
  id: string
  name?: string | null
  email?: string | null
  image?: string | null
  tier?: string | null
}

export function parseDesktopExchangeToken(
  token: string | undefined
): DesktopSessionUser | null {
  if (!token) return null

  try {
    const parts = token.split(".")
    if (parts.length !== 3) return null

    const payload = JSON.parse(
      Buffer.from(parts[1], "base64url").toString("utf-8")
    )

    const id = payload.sub ?? payload.userId
    if (!id) return null

    return {
      id,
      name: payload.name ?? null,
      email: payload.email ?? null,
      image: payload.image ?? null,
      tier: payload.tier ?? "FREE",
    }
  } catch {
    return null
  }
}

export async function createDesktopSessionToken(user: DesktopSessionUser) {
  return encode({
    token: {
      sub: user.id,
      userId: user.id,
      name: user.name ?? null,
      email: user.email ?? null,
      picture: user.image ?? null,
      tier: user.tier ?? "FREE",
    },
    secret: process.env.NEXTAUTH_SECRET!,
    salt: DESKTOP_SESSION_COOKIE_NAME,
    maxAge: DESKTOP_SESSION_MAX_AGE,
  })
}
