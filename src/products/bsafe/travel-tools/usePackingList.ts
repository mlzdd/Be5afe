import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { PackingItem, PackingCategory } from './types';

const KEY = '@be5afe_packing_list';

function newId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

interface PackingListState {
  items: PackingItem[];
  isLoading: boolean;
  addItem(data: Omit<PackingItem, 'id' | 'createdAt'>): Promise<void>;
  updateItem(id: string, updates: Partial<PackingItem>): Promise<void>;
  deleteItem(id: string): Promise<void>;
  togglePacked(id: string): Promise<void>;
  addItemsFromTemplate(items: Omit<PackingItem, 'id' | 'packed' | 'createdAt'>[]): Promise<void>;
  clearAllItems(): Promise<void>;
  getProgress(): { packed: number; total: number; percentage: number };
  getItemsByCategory(category: PackingCategory): PackingItem[];
}

export function usePackingList(): PackingListState {
  const [items, setItems] = useState<PackingItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const persist = useCallback(async (updated: PackingItem[]) => {
    await AsyncStorage.setItem(KEY, JSON.stringify(updated));
    setItems(updated);
  }, []);

  useEffect(() => {
    AsyncStorage.getItem(KEY)
      .then((raw) => raw ? setItems(JSON.parse(raw)) : undefined)
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, []);

  const addItem = useCallback(async (data: Omit<PackingItem, 'id' | 'createdAt'>) => {
    await persist([...items, { ...data, id: newId(), packed: data.packed ?? false, createdAt: new Date().toISOString() }]);
  }, [items, persist]);

  const updateItem = useCallback(async (id: string, updates: Partial<PackingItem>) => {
    await persist(items.map((i) => i.id === id ? { ...i, ...updates } : i));
  }, [items, persist]);

  const deleteItem = useCallback(async (id: string) => {
    await persist(items.filter((i) => i.id !== id));
  }, [items, persist]);

  const togglePacked = useCallback(async (id: string) => {
    await persist(items.map((i) => i.id === id ? { ...i, packed: !i.packed } : i));
  }, [items, persist]);

  const addItemsFromTemplate = useCallback(async (templates: Omit<PackingItem, 'id' | 'packed' | 'createdAt'>[]) => {
    const now = new Date().toISOString();
    const newItems = templates.map((t) => ({ ...t, id: newId(), packed: false, createdAt: now }));
    await persist([...items, ...newItems]);
  }, [items, persist]);

  const clearAllItems = useCallback(async () => {
    await persist([]);
  }, [persist]);

  const getProgress = useCallback(() => {
    const total = items.length;
    const packed = items.filter((i) => i.packed).length;
    return { packed, total, percentage: total > 0 ? Math.round((packed / total) * 100) : 0 };
  }, [items]);

  const getItemsByCategory = useCallback((category: PackingCategory) =>
    items.filter((i) => i.category === category), [items]);

  return { items, isLoading, addItem, updateItem, deleteItem, togglePacked, addItemsFromTemplate, clearAllItems, getProgress, getItemsByCategory };
}
