import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Expense, Budget } from './types';

const EXPENSES_KEY = '@be5afe_expenses';
const BUDGET_KEY = '@be5afe_budget';

function uuid(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export interface ExpensesState {
  expenses: Expense[];
  budget: Budget | null;
  isLoading: boolean;
  addExpense: (data: Omit<Expense, 'id' | 'createdAt'>) => Promise<void>;
  updateExpense: (id: string, updates: Partial<Expense>) => Promise<void>;
  deleteExpense: (id: string) => Promise<void>;
  setBudget: (b: Budget) => Promise<void>;
  clearBudget: () => Promise<void>;
}

export function useExpenses(): ExpensesState {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [budget, setBudgetState] = useState<Budget | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [eRaw, bRaw] = await Promise.all([
          AsyncStorage.getItem(EXPENSES_KEY),
          AsyncStorage.getItem(BUDGET_KEY),
        ]);
        if (!cancelled) {
          setExpenses(eRaw ? JSON.parse(eRaw) : []);
          setBudgetState(bRaw ? JSON.parse(bRaw) : null);
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  async function persist(next: Expense[]) {
    setExpenses(next);
    await AsyncStorage.setItem(EXPENSES_KEY, JSON.stringify(next));
  }

  const addExpense = useCallback(async (data: Omit<Expense, 'id' | 'createdAt'>) => {
    const e: Expense = { ...data, id: uuid(), createdAt: new Date().toISOString() };
    await persist([e, ...expenses]);
  }, [expenses]);

  const updateExpense = useCallback(async (id: string, updates: Partial<Expense>) => {
    await persist(expenses.map((e) => (e.id === id ? { ...e, ...updates } : e)));
  }, [expenses]);

  const deleteExpense = useCallback(async (id: string) => {
    await persist(expenses.filter((e) => e.id !== id));
  }, [expenses]);

  const setBudget = useCallback(async (b: Budget) => {
    setBudgetState(b);
    await AsyncStorage.setItem(BUDGET_KEY, JSON.stringify(b));
  }, []);

  const clearBudget = useCallback(async () => {
    setBudgetState(null);
    await AsyncStorage.removeItem(BUDGET_KEY);
  }, []);

  return { expenses, budget, isLoading, addExpense, updateExpense, deleteExpense, setBudget, clearBudget };
}
