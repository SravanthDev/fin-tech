export interface User {
  id: string
  name: string
  email: string
  phone: string | null
  createdAt: string
  lastUploadFilename: string | null
  lastUploadAt: string | null
  transactionCount: number
}

export interface Transaction {
  id: string
  date: string
  transactionId: string
  type: "Credit" | "Debit"
  description: string
  category: string
  paymentMethod: string
  amount: number
  signedAmount: number
  notes: string | null
  sourceFile: string | null
}

export interface PaginatedTransactions {
  items: Transaction[]
  total: number
  page: number
  limit: number
}

export interface DashboardSummary {
  totalIncome: number
  totalExpenses: number
  netCashFlow: number
  transactionCount: number
  healthScore: number
  healthScoreLabel: string
  healthScoreMessage: string
}

export interface CashFlowPoint {
  label: string
  income: number
  expenses: number
}

export interface CategoryBreakdownItem {
  category: string
  total: number
  count: number
  percentOfExpenses: number
}

export interface ChatMessage {
  role: "user" | "assistant"
  content: string
}
