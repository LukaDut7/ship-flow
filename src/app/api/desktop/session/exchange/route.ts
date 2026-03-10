import { NextRequest, NextResponse } from "next/server"
import {
  createDesktopSessionToken,
  parseDesktopExchangeToken,
} from "@/lib/desktop-auth-token"
import {
  DESKTOP_SESSION_COOKIE_NAME,
  DESKTOP_SESSION_COOKIE_OPTIONS,
} from "@/lib/auth-constants"

// POST /api/desktop/session/exchange
// Called after system-browser OAuth completes.
// The cloud server generates a short-lived token containing user info,
// which the desktop app sends here to establish a local session.

async function cacheDesktopUser(user: {
  id: string
  name?: string | null
  email?: string | null
  image?: string | null
  tier?: string | null
}) {
  try {
    const { DesktopUserRepo } = await import("@/lib/repositories/desktop/user-repo")
    const userRepo = new DesktopUserRepo()
    await userRepo.upsertFromSync({
      id: user.id,
      name: user.name ?? null,
      email: user.email ?? null,
      image: user.image ?? null,
      tier: user.tier ?? "FREE",
    })
  } catch {
    // Non-fatal: user cache can be populated later via sync
  }
}

async function attachDesktopSession(
  response: NextResponse,
  token: string
): Promise<NextResponse> {
  const user = parseDesktopExchangeToken(token)
  if (!user) {
    return NextResponse.json({ error: "Invalid token" }, { status: 400 })
  }

  await cacheDesktopUser(user)

  const sessionToken = await createDesktopSessionToken(user)
  response.cookies.set(
    DESKTOP_SESSION_COOKIE_NAME,
    sessionToken,
    DESKTOP_SESSION_COOKIE_OPTIONS
  )

  return response
}

export async function POST(request: NextRequest) {
  if (process.env.SHIPFLOW_RUNTIME !== "desktop") {
    return NextResponse.json({ error: "Desktop only" }, { status: 403 })
  }

  try {
    const { token } = await request.json()
    const user = parseDesktopExchangeToken(token)
    if (!user) {
      return NextResponse.json({ error: "Invalid token" }, { status: 400 })
    }

    return attachDesktopSession(
      NextResponse.json({
        success: true,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          tier: user.tier,
        },
      }),
      token
    )
  } catch {
    return NextResponse.json({ error: "Exchange failed" }, { status: 500 })
  }
}

// GET handler for protocol callback redirect
export async function GET(request: NextRequest) {
  if (process.env.SHIPFLOW_RUNTIME !== "desktop") {
    return NextResponse.json({ error: "Desktop only" }, { status: 403 })
  }

  const token = request.nextUrl.searchParams.get("token")
  if (!token) {
    return NextResponse.json({ error: "Token required" }, { status: 400 })
  }

  // Process the token and redirect to dashboard
  try {
    if (!parseDesktopExchangeToken(token)) {
      return NextResponse.json({ error: "Invalid token" }, { status: 400 })
    }

    return attachDesktopSession(
      NextResponse.redirect(new URL("/dashboard", request.url)),
      token
    )
  } catch {
    return NextResponse.json({ error: "Exchange failed" }, { status: 500 })
  }
}
