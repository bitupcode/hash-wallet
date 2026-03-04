export type Role = "operator" | "signer1" | "signer2"

export type AddressType = "MAIN" | "TRANSIT"

export type Network = "BITCOIN"

export type TransactionStatus =
  | "DRAFT"
  | "WAITING_MPC"
  | "MPC_SIGNING"
  | "COMPLETED"
  | "REJECTED"
  | "FAILED"

export type TransactionType = "INTERNAL" | "EXTERNAL"

export type SignerRole = "signer1" | "signer2" | "signer3"

export interface Address {
  id: string
  address: string
  name: string
  type: AddressType
  network: Network
  balance: number
  createdAt: string
}

export interface MpcSession {
  id: string
  transactionId: string
  deadline: string
  signersApproved: SignerRole[]
  signersRejected: SignerRole[]
  createdAt: string
}

export interface Transaction {
  id: string
  type: TransactionType
  fromAddressId: string
  fromAddress: string
  toAddress: string
  amount: number
  fee: number
  status: TransactionStatus
  txHash: string | null
  kytScore: number | null
  comment: string
  mpcSessionId: string | null
  createdAt: string
  updatedAt: string
}

export interface AuditLogEntry {
  id: string
  timestamp: string
  actor: string
  action: string
  entityType: string
  entityId: string
  details: string
}

// Constants
export const NETWORK_FEE = 0.0005
export const MPC_DEADLINE_MINUTES = 5
export const REQUIRED_SIGNATURES = 2
export const TOTAL_SIGNERS = 3

// Role display names
export const ROLE_NAMES: Record<Role, string> = {
  operator: "Оператор",
  signer1: "Signer 1",
  signer2: "Signer 2",
}

export const SIGNER_NAMES: Record<SignerRole, string> = {
  signer1: "Signer 1",
  signer2: "Signer 2",
  signer3: "Signer 3",
}

export const STATUS_LABELS: Record<TransactionStatus, string> = {
  DRAFT: "Черновик",
  WAITING_MPC: "Ожидание подписей",
  MPC_SIGNING: "Подписание",
  COMPLETED: "Завершена",
  REJECTED: "Отклонена",
  FAILED: "Ошибка",
}
