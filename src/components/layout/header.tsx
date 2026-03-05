"use client"

import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { useAuthStore } from "@/store"
import type { Role } from "@/types"
import { ROLE_NAMES, ROLE_FULL_NAMES } from "@/types"

const roles: Role[] = ["operator", "signer1", "signer2"]

const roleHomePages: Record<Role, string> = {
  operator: "/addresses",
  signer1: "/signer/transactions",
  signer2: "/signer/transactions",
}

export function Header() {
  const router = useRouter()
  const currentRole = useAuthStore((s) => s.currentRole)
  const setRole = useAuthStore((s) => s.setRole)

  const handleRoleSwitch = (role: Role) => {
    setRole(role)
    router.push(roleHomePages[role])
  }

  return (
    <header className="h-16 border-b flex items-center justify-between px-6 bg-background">
      <div className="text-sm text-muted-foreground">
        Роль: <span className="font-semibold text-foreground">{ROLE_NAMES[currentRole]}</span>{" "}
        <span className="text-foreground">{ROLE_FULL_NAMES[currentRole]}</span>
      </div>
      <div className="flex gap-1">
        {roles.map((role) => (
          <Button
            key={role}
            variant={currentRole === role ? "default" : "outline"}
            size="sm"
            onClick={() => handleRoleSwitch(role)}
          >
            {ROLE_NAMES[role]}
          </Button>
        ))}
      </div>
    </header>
  )
}
