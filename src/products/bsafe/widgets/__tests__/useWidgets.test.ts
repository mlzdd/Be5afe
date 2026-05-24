import { renderHook, act } from '@testing-library/react-native';

(globalThis as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = true;

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn().mockResolvedValue(null),
  setItem: jest.fn().mockResolvedValue(undefined),
}));

import AsyncStorage from '@react-native-async-storage/async-storage';
import { useWidgets } from '../useWidgets';
import type { WidgetConfig } from '../types';

describe('useWidgets', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
    (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);
  });

  it('loads default widgets when storage is empty', async () => {
    const { result } = renderHook(() => useWidgets());
    await act(async () => { await new Promise((r) => setTimeout(r, 10)); });
    expect(result.current.isLoading).toBe(false);
    expect(result.current.widgets.length).toBeGreaterThan(0);
    const types = result.current.widgets.map((w: WidgetConfig) => w.type);
    expect(types).toContain('weather');
    expect(types).toContain('emergency');
  });

  it('addWidget adds a new widget', async () => {
    const { result } = renderHook(() => useWidgets());
    await act(async () => { await new Promise((r) => setTimeout(r, 10)); });
    const before = result.current.widgets.length;
    await act(async () => { await result.current.addWidget('currency'); });
    expect(result.current.widgets.length).toBe(before + 1);
    expect(result.current.widgets.some((w: WidgetConfig) => w.type === 'currency')).toBe(true);
  });

  it('removeWidget removes by id', async () => {
    const { result } = renderHook(() => useWidgets());
    await act(async () => { await new Promise((r) => setTimeout(r, 10)); });
    const target = result.current.widgets[0];
    await act(async () => { await result.current.removeWidget(target.id); });
    expect(result.current.widgets.some((w: WidgetConfig) => w.id === target.id)).toBe(false);
  });

  it('getAvailableTypes excludes already-added types', async () => {
    const { result } = renderHook(() => useWidgets());
    await act(async () => { await new Promise((r) => setTimeout(r, 10)); });
    const addedTypes = new Set(result.current.widgets.map((w: WidgetConfig) => w.type));
    const available = result.current.getAvailableTypes();
    available.forEach((t: WidgetConfig['type']) => expect(addedTypes.has(t)).toBe(false));
  });
});
