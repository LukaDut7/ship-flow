export const DESKTOP_SESSION_COOKIE_NAME = "shipflow-desktop.session-token"
export const DESKTOP_SESSION_MAX_AGE = 30 * 24 * 60 * 60

export const DESKTOP_SESSION_COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: "lax" as const,
  path: "/",
  secure: false,
  maxAge: DESKTOP_SESSION_MAX_AGE,
}
