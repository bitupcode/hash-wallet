"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Wallet, History, FileText, PenTool } from "lucide-react"
import { cn } from "@/lib/utils"
import { useAuthStore } from "@/store"

const operatorLinks = [
  { href: "/addresses", label: "Адреса", icon: Wallet },
  { href: "/history", label: "История операций", icon: History },
  { href: "/audit", label: "Журнал аудита", icon: FileText },
]

const signerLinks = [
  { href: "/signer/transactions", label: "Очередь подписания", icon: PenTool },
  { href: "/audit", label: "Журнал аудита", icon: FileText },
]

export function Sidebar() {
  const pathname = usePathname()
  const currentRole = useAuthStore((s) => s.currentRole)

  const links = currentRole === "operator" ? operatorLinks : signerLinks

  return (
    <aside className="w-[260px] shrink-0 border-r bg-muted/30 h-full">
      <div className="p-4 border-b">
        <h1 className="text-lg font-bold">HashWallet</h1>
        <p className="text-xs text-muted-foreground">Digital Depository</p>
      </div>
      <nav className="p-2 space-y-1">
        {links.map((link) => {
          const isActive =
            pathname === link.href || pathname.startsWith(link.href + "/")
          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              )}
            >
              <link.icon className="size-4" />
              {link.label}
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}
