'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { useServerInsertedHTML } from 'next/navigation';

export type ThemeName = 'light' | 'dark';

type ThemeContextValue = {
  theme: ThemeName;
  setTheme: (theme: ThemeName | ((prev: ThemeName) => ThemeName)) => void;
  resolvedTheme: ThemeName;
  themes: ThemeName[];
};

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export type ThemeProviderProps = {
  children: ReactNode;
  attribute?: 'class' | `data-${string}`;
  defaultTheme?: ThemeName;
  enableSystem?: boolean;
  disableTransitionOnChange?: boolean;
  storageKey?: string;
};

function applyTheme(theme: ThemeName, attribute: string) {
  const root = document.documentElement;
  if (attribute === 'class') {
    root.classList.remove('light', 'dark');
    root.classList.add(theme);
  } else {
    root.setAttribute(attribute, theme);
  }
  root.style.colorScheme = theme;
}

function buildBootstrapScript(storageKey: string, defaultTheme: ThemeName) {
  // Keep values JSON-escaped so they cannot break out of the script context
  const key = JSON.stringify(storageKey);
  const fallback = JSON.stringify(defaultTheme);
  return `(function(){try{var k=${key};var t=localStorage.getItem(k);if(t!=="light"&&t!=="dark")t=${fallback};var d=document.documentElement;d.classList.remove("light","dark");d.classList.add(t);d.style.colorScheme=t;}catch(e){}})();`;
}

/**
 * Client theme provider. FOUC script is injected via useServerInsertedHTML
 * (outside the React client tree) so React 19 does not warn about <script>.
 */
export function ThemeProvider({
  children,
  attribute = 'class',
  defaultTheme = 'light',
  storageKey = 'theme',
}: ThemeProviderProps) {
  const [theme, setThemeState] = useState<ThemeName>(defaultTheme);

  useServerInsertedHTML(() => (
    <script
      dangerouslySetInnerHTML={{
        __html: buildBootstrapScript(storageKey, defaultTheme),
      }}
    />
  ));

  useEffect(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored === 'light' || stored === 'dark') {
        setThemeState(stored);
        applyTheme(stored, attribute);
      } else {
        applyTheme(defaultTheme, attribute);
      }
    } catch {
      applyTheme(defaultTheme, attribute);
    }
  }, [attribute, defaultTheme, storageKey]);

  const setTheme = useCallback(
    (next: ThemeName | ((prev: ThemeName) => ThemeName)) => {
      setThemeState((prev) => {
        const value = typeof next === 'function' ? next(prev) : next;
        try {
          localStorage.setItem(storageKey, value);
        } catch {
          /* ignore */
        }
        applyTheme(value, attribute);
        return value;
      });
    },
    [attribute, storageKey],
  );

  const value = useMemo<ThemeContextValue>(
    () => ({
      theme,
      setTheme,
      resolvedTheme: theme,
      themes: ['light', 'dark'],
    }),
    [theme, setTheme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    return {
      theme: 'light' as ThemeName,
      setTheme: () => undefined,
      resolvedTheme: 'light' as ThemeName,
      themes: ['light', 'dark'] as ThemeName[],
    };
  }
  return ctx;
}
