import { create } from "zustand"
import { persist } from "zustand/middleware"
import type { Role } from "@/types"

interface AuthStore {
  currentRole: Role
  setRole: (role: Role) => void
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      currentRole: "operator",
      setRole: (role) => set({ currentRole: role }),
    }),
    { name: "hashwallet-auth" }
  )
)
