import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { WidgetConfig, WidgetType } from './types';
import { WIDGET_METADATA } from './types';

const STORAGE_KEY = '@be5afe_widgets';

function generateId(type: WidgetType): string {
  return `${type}_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

function sorted(widgets: WidgetConfig[]): WidgetConfig[] {
  return [...widgets].sort((a, b) => a.order - b.order);
}

function normalized(widgets: WidgetConfig[]): WidgetConfig[] {
  return sorted(widgets).map((w, i) => ({ ...w, order: i }));
}

function defaultWidgets(): WidgetConfig[] {
  return normalized([
    { id: generateId('weather'),   type: 'weather',   size: 'large', order: 0 },
    { id: generateId('safety'),    type: 'safety',    size: 'small', order: 1 },
    { id: generateId('emergency'), type: 'emergency', size: 'small', order: 2 },
    { id: generateId('alerts'),    type: 'alerts',    size: 'large', order: 3 },
  ]);
}

interface WidgetsState {
  widgets: WidgetConfig[];
  isLoading: boolean;
  addWidget(type: WidgetType, settings?: Record<string, unknown>): Promise<void>;
  removeWidget(id: string): Promise<void>;
  updateWidgetSettings(id: string, settings: Record<string, unknown>): Promise<void>;
  reorderWidgets(widgets: WidgetConfig[]): Promise<void>;
  refreshWidgets(): Promise<void>;
  getAvailableTypes(): WidgetType[];
}

export function useWidgets(): WidgetsState {
  const [widgets, setWidgets] = useState<WidgetConfig[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const persist = useCallback(async (updated: WidgetConfig[]) => {
    const norm = normalized(updated);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(norm));
    setWidgets(norm);
  }, []);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((raw) => {
      setWidgets(raw ? sorted(JSON.parse(raw)) : defaultWidgets());
    }).catch(() => {
      setWidgets(defaultWidgets());
    }).finally(() => setIsLoading(false));
  }, []);

  const addWidget = useCallback(async (type: WidgetType, settings?: Record<string, unknown>) => {
    const meta = WIDGET_METADATA[type];
    const next: WidgetConfig = {
      id: generateId(type),
      type,
      size: meta.defaultSize,
      settings,
      order: widgets.length,
    };
    await persist([...widgets, next]);
  }, [widgets, persist]);

  const removeWidget = useCallback(async (id: string) => {
    await persist(widgets.filter((w) => w.id !== id));
  }, [widgets, persist]);

  const updateWidgetSettings = useCallback(async (id: string, settings: Record<string, unknown>) => {
    await persist(widgets.map((w) => w.id === id ? { ...w, settings } : w));
  }, [widgets, persist]);

  const reorderWidgets = useCallback(async (reordered: WidgetConfig[]) => {
    await persist(reordered);
  }, [persist]);

  const refreshWidgets = useCallback(async () => {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    setWidgets(raw ? sorted(JSON.parse(raw)) : defaultWidgets());
  }, []);

  const getAvailableTypes = useCallback((): WidgetType[] => {
    const added = new Set(widgets.map((w) => w.type));
    return (Object.keys(WIDGET_METADATA) as WidgetType[]).filter((t) => !added.has(t));
  }, [widgets]);

  return { widgets, isLoading, addWidget, removeWidget, updateWidgetSettings, reorderWidgets, refreshWidgets, getAvailableTypes };
}
