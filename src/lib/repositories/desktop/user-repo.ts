import { eq } from "drizzle-orm"
import { getDesktopDb } from "./db"
import { users, projects } from "./schema"
import type { User } from "@/lib/types"
import type { UserRepo } from "../interfaces/user-repo"

export const LOCAL_DESKTOP_USER_ID = "desktop-local-user"

function rowToUser(row: typeof users.$inferSelect): User {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    emailVerified: null,
    image: row.image,
    tier: row.tier as User["tier"],
    createdAt: row.cachedAt,
  }
}

export class DesktopUserRepo implements UserRepo {
  async ensureLocalUser(): Promise<User> {
    const db = getDesktopDb()
    const rows = await db
      .select()
      .from(users)
      .where(eq(users.id, LOCAL_DESKTOP_USER_ID))
      .limit(1)

    if (!rows[0]) {
      const now = new Date()
      await db.insert(users).values({
        id: LOCAL_DESKTOP_USER_ID,
        name: "Local Workspace",
        email: null,
        image: null,
        tier: "FREE",
        cachedAt: now,
      })
      return {
        id: LOCAL_DESKTOP_USER_ID,
        name: "Local Workspace",
        email: null,
        emailVerified: null,
        image: null,
        tier: "FREE",
        createdAt: now,
      }
    }

    return rowToUser(rows[0])
  }

  async findById(id: string): Promise<User | null> {
    const db = getDesktopDb()
    const rows = await db.select().from(users).where(eq(users.id, id)).limit(1)
    return rows[0] ? rowToUser(rows[0]) : null
  }

  async findByIdOrThrow(id: string): Promise<User> {
    const user = await this.findById(id)
    if (!user) throw new Error("User not found")
    return user
  }

  // Desktop-specific: upsert cached user from JWT/sync
  async upsertFromSync(data: {
    id: string
    name: string | null
    email: string | null
    image: string | null
    tier: string
  }): Promise<void> {
    const db = getDesktopDb()
    const now = new Date()
    const localRows = await db
      .select()
      .from(users)
      .where(eq(users.id, LOCAL_DESKTOP_USER_ID))
      .limit(1)
    const existing = await db.select().from(users).where(eq(users.id, data.id)).limit(1)

    if (existing.length > 0) {
      await db
        .update(users)
        .set({ name: data.name, email: data.email, image: data.image, tier: data.tier, cachedAt: now })
        .where(eq(users.id, data.id))
    } else {
      await db.insert(users).values({
        id: data.id,
        name: data.name,
        email: data.email,
        image: data.image,
        tier: data.tier,
        cachedAt: now,
        })
    }

    if (data.id !== LOCAL_DESKTOP_USER_ID && localRows.length > 0) {
      await db
        .update(projects)
        .set({ userId: data.id })
        .where(eq(projects.userId, LOCAL_DESKTOP_USER_ID))
      await db.delete(users).where(eq(users.id, LOCAL_DESKTOP_USER_ID))
    }
  }
}
