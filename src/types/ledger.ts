export type TransactionType = 'income' | 'expense';

export type TransactionCategory =
  | 'salary'
  | 'food'
  | 'transport'
  | 'shopping'
  | 'etc';

export interface Transaction {
  id: string;
  date: string;
  type: TransactionType;
  category: TransactionCategory;
  amount: number;
  memo: string;
  createdAt: string;
}

export interface TransactionInput {
  date: string;
  type: TransactionType;
  category: TransactionCategory;
  amount: number;
  memo: string;
}

export interface MonthlySummary {
  totalIncome: number;
  totalExpense: number;
  balance: number;
}

export interface CategoryStatistic {
  category: string;
  label: string;
  amount: number;
  percentage: number;
  color: string;
}
