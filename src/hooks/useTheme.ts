import { useCallback, useEffect, useState } from 'react';
import { loadSettings, saveSettings } from '../game/storage';
import type { ThemeName } from '../game/types';

export function useTheme() {
  const [theme, setThemeState] = useState<ThemeName>(() => {
    if (typeof window === 'undefined') return 'light';
    return loadSettings(window.localStorage).theme;
  });

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') root.classList.add('dark');
    else root.classList.remove('dark');
  }, [theme]);

  const setTheme = useCallback(
    (next: ThemeName) => {
      setThemeState(next);
      if (typeof window !== 'undefined') {
        const s = loadSettings(window.localStorage);
        saveSettings(window.localStorage, { ...s, theme: next });
      }
    },
    [],
  );

  const toggle = useCallback(() => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  }, [theme, setTheme]);

  return { theme, setTheme, toggle };
}
