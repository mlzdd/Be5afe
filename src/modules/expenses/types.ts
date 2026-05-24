export type ExpenseCategory =
  | 'food'
  | 'transport'
  | 'accommodation'
  | 'activities'
  | 'shopping'
  | 'other';

export interface Expense {
  id: string;
  amount: number;
  currency: string;
  category: ExpenseCategory;
  description?: string;
  date: string;
  tripId?: string;
  createdAt: string;
}

export interface Budget {
  amount: number;
  currency: string;
}

export type BudgetStatus = 'safe' | 'warning' | 'danger';

export const CATEGORY_CONFIG: Record<ExpenseCategory, { icon: string; color: string; label: string }> = {
  food: { icon: 'restaurant', color: '#FF9800', label: 'Food & Dining' },
  transport: { icon: 'car', color: '#9C27B0', label: 'Transport' },
  accommodation: { icon: 'bed', color: '#4CAF50', label: 'Accommodation' },
  activities: { icon: 'basketball', color: '#2196F3', label: 'Activities' },
  shopping: { icon: 'cart', color: '#E91E63', label: 'Shopping' },
  other: { icon: 'ellipsis-horizontal-circle', color: '#757575', label: 'Other' },
};

export function getBudgetStatus(spent: number, budget: number): BudgetStatus {
  if (budget === 0) return 'safe';
  const pct = (spent / budget) * 100;
  if (pct >= 100) return 'danger';
  if (pct >= 80) return 'warning';
  return 'safe';
}

export function formatAmount(amount: number, currency: string): string {
  const symbols: Record<string, string> = {
    USD: '$', EUR: '€', GBP: '£', JPY: '¥', AUD: 'A$', CAD: 'C$',
    CHF: 'Fr', SGD: 'S$', THB: '฿', INR: '₹', AED: 'د.إ', NZD: 'NZ$',
    KRW: '₩', BRL: 'R$', MXN: '$', TRY: '₺', ZAR: 'R',
  };
  const sym = symbols[currency] ?? currency;
  return `${sym}${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
