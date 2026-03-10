import * as cloudAuth from "./cloud-auth"
import * as desktopAuth from "./desktop-auth"
import type { Session } from "next-auth"
import { getLocalDesktopSession } from "./local-desktop-session"

const isDesktopRuntime = process.env.SHIPFLOW_RUNTIME === "desktop"

const authModule = isDesktopRuntime ? desktopAuth : cloudAuth

type AuthFn = typeof cloudAuth.auth

export const handlers = authModule.handlers
export const signIn = authModule.signIn
export const signOut = authModule.signOut

export const auth = (async (...args: Parameters<AuthFn>) => {
  const session = await authModule.auth(...args)

  if (!isDesktopRuntime || args.length > 0) {
    return session
  }

  const authSession = session as unknown as Session | null
  if (authSession?.user?.id) {
    return authSession
  }

  return getLocalDesktopSession()
}) as AuthFn
