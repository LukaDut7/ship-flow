import NextAuth from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import type { Session } from "next-auth"
import type { JWT } from "next-auth/jwt"
import {
  DESKTOP_SESSION_COOKIE_NAME,
  DESKTOP_SESSION_COOKIE_OPTIONS,
  DESKTOP_SESSION_MAX_AGE,
} from "./auth-constants"
import { parseDesktopExchangeToken } from "./desktop-auth-token"

type DesktopJwt = JWT & {
  userId?: string
  tier?: string
}

type DesktopSession = Session & {
  user?: NonNullable<Session["user"]> & {
    id?: string
    tier?: string
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    CredentialsProvider({
      id: "desktop-token",
      name: "Desktop Token",
      credentials: {
        token: { type: "text" },
      },
      async authorize(credentials: Record<string, unknown> | undefined) {
        const user = parseDesktopExchangeToken(
          credentials?.token as string | undefined
        )
        return user
      },
    }),
  ],
  session: {
    strategy: "jwt" as const,
    maxAge: DESKTOP_SESSION_MAX_AGE,
  },
  cookies: {
    sessionToken: {
      name: DESKTOP_SESSION_COOKIE_NAME,
      options: DESKTOP_SESSION_COOKIE_OPTIONS,
    },
  },
  callbacks: {
    jwt({ token, user }) {
      const nextToken = token as DesktopJwt
      if (user) {
        const authUser = user as typeof user & { tier?: string | null }
        nextToken.userId = user.id
        nextToken.tier = authUser.tier ?? nextToken.tier ?? "FREE"
      }
      return nextToken
    },
    session({ session, token }) {
      const nextSession = session as DesktopSession
      const nextToken = token as DesktopJwt

      if (nextSession.user && nextToken.userId) {
        nextSession.user.id = nextToken.userId
        nextSession.user.tier = nextToken.tier ?? "FREE"
      }
      return nextSession
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
})
