import type { User } from "@/lib/types"

export interface UserRepo {
  findById(id: string): Promise<User | null>
  findByIdOrThrow(id: string): Promise<User>
}
