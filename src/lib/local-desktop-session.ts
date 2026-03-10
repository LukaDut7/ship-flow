import type { Session } from "next-auth"

type DesktopSession = Session & {
  user?: NonNullable<Session["user"]> & {
    id?: string
    tier?: string
  }
}

export async function getLocalDesktopSession(): Promise<DesktopSession | null> {
  if (process.env.SHIPFLOW_RUNTIME !== "desktop") {
    return null
  }

  const { DesktopUserRepo } = await import("@/lib/repositories/desktop/user-repo")
  const userRepo = new DesktopUserRepo()
  const user = await userRepo.ensureLocalUser()

  return {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      image: user.image,
      tier: user.tier,
    },
    expires: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
  }
}
