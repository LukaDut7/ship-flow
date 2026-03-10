import { prisma } from "@/lib/prisma"
import type { User } from "@/lib/types"
import type { UserRepo } from "../interfaces/user-repo"

export class CloudUserRepo implements UserRepo {
  async findById(id: string): Promise<User | null> {
    return prisma.user.findUnique({ where: { id } }) as Promise<User | null>
  }

  async findByIdOrThrow(id: string): Promise<User> {
    return prisma.user.findUniqueOrThrow({ where: { id } }) as Promise<User>
  }
}
