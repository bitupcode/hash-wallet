"use client"

import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { useAuthStore } from "@/store"
import type { Role } from "@/types"
import { ROLE_NAMES, ROLE_FULL_NAMES } from "@/types"
import { Mail, Bell } from "lucide-react"

const roles: Role[] = ["operator", "signer1", "signer2"]

const roleHomePages: Record<Role, string> = {
  operator: "/addresses",
  signer1: "/signer/transactions",
  signer2: "/signer/transactions",
}

function getInitials(fullName: string): string {
  const parts = fullName.split(/[\s.]+/).filter(Boolean)
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase()
  }
  return fullName.slice(0, 2).toUpperCase()
}

export function Header() {
  const router = useRouter()
  const currentRole = useAuthStore((s) => s.currentRole)
  const setRole = useAuthStore((s) => s.setRole)

  const handleRoleSwitch = (role: Role) => {
    setRole(role)
    router.push(roleHomePages[role])
  }

  const fullName = ROLE_FULL_NAMES[currentRole]
  const initials = getInitials(fullName)

  return (
    <header className="h-14 border-b border-border/50 flex items-center justify-between px-6 bg-white">
      <div className="flex gap-1">
        {roles.map((role) => (
          <Button
            key={role}
            variant={currentRole === role ? "default" : "outline"}
            size="xs"
            onClick={() => handleRoleSwitch(role)}
          >
            {ROLE_NAMES[role]}
          </Button>
        ))}
      </div>
      <div className="flex items-center gap-3">
        <button className="relative p-1.5 rounded-full hover:bg-muted transition-colors text-muted-foreground hover:text-foreground">
          <Mail className="size-4" />
        </button>
        <button className="relative p-1.5 rounded-full hover:bg-muted transition-colors text-muted-foreground hover:text-foreground">
          <Bell className="size-4" />
          <span className="absolute -top-0.5 -right-0.5 size-3.5 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">3</span>
        </button>
        <div className="w-px h-6 bg-border/50 mx-1" />
        <div className="flex items-center gap-2.5">
          <div className="size-8 rounded-full bg-muted flex items-center justify-center text-xs font-semibold text-muted-foreground">
            {initials}
          </div>
          <div className="text-right">
            <div className="text-sm font-medium leading-tight">{fullName}</div>
            <div className="text-xs text-muted-foreground leading-tight">{ROLE_NAMES[currentRole]}</div>
          </div>
        </div>
      </div>
    </header>
  )
}
