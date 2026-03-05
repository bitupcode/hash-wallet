import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

const BASE58_CHARS = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz"

export function generateBtcAddress(): string {
  let addr = "1"
  for (let i = 0; i < 33; i++) {
    addr += BASE58_CHARS[Math.floor(Math.random() * BASE58_CHARS.length)]
  }
  return addr
}

export function generateTxHash(): string {
  const hex = "0123456789abcdef"
  let hash = ""
  for (let i = 0; i < 64; i++) {
    hash += hex[Math.floor(Math.random() * hex.length)]
  }
  return hash
}

export function generateId(): string {
  return crypto.randomUUID()
}

export function truncateAddress(addr: string): string {
  if (addr.length <= 10) return addr
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`
}

export function formatBtc(amount: number): string {
  return amount.toFixed(8)
}

export function mockDelay(ms?: number): Promise<void> {
  const delay = ms ?? (1000 + Math.random() * 2000)
  return new Promise((resolve) => setTimeout(resolve, delay))
}
