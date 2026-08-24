import {
  Banknote,
  Building2,
  Car,
  Cloud,
  Fuel,
  Landmark,
  Monitor,
  Package,
  Receipt,
  ShoppingBag,
  Sparkles,
  Truck,
  UtensilsCrossed,
  Users,
  Wallet,
  type LucideIcon,
} from "lucide-react"

export const CATEGORY_ICONS: Record<string, LucideIcon> = {
  Salary: Wallet,
  "Customer Payment": Banknote,
  Software: Monitor,
  "Cloud & Hosting": Cloud,
  Office: Building2,
  "Office Supplies": ShoppingBag,
  Transport: Car,
  Fuel: Fuel,
  Meals: UtensilsCrossed,
  Logistics: Package,
  Taxes: Receipt,
  "Employee Reimbursement": Users,
  Travel: Truck,
  Marketing: Sparkles,
  Utilities: Landmark,
  Other: Receipt,
}

export function getCategoryIcon(category: string): LucideIcon {
  return CATEGORY_ICONS[category] ?? Receipt
}

const INCOME_CATEGORIES = new Set(["Customer Payment"])

export function isIncomeCategory(category: string): boolean {
  return INCOME_CATEGORIES.has(category)
}
