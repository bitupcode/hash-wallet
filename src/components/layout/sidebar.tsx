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
    <aside className="w-[220px] shrink-0 bg-white h-full">
      <div className="p-4 pb-6">
        <h1 className="text-lg font-bold">HashWallet</h1>
      </div>
      <nav className="px-2 space-y-0.5">
        {links.map((link) => {
          const isActive =
            pathname === link.href || pathname.startsWith(link.href + "/")
          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors relative",
                isActive
                  ? "bg-muted text-foreground before:absolute before:left-0 before:top-1 before:bottom-1 before:w-[3px] before:rounded-full before:bg-foreground"
                  : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
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
