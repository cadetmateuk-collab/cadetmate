'use client';

import { Moon, Sun } from 'lucide-react';
import { useTheme } from '@/components/theme-provider';
import { Button } from '@/components/ui/button';
import { useEffect, useState } from 'react';

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Avoid hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <Button variant="ghost" size="icon" className="w-10 h-10" aria-label="Toggle theme">
        <Sun className="h-5 w-5" aria-hidden />
      </Button>
    );
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
      className="w-10 h-10 transition-colors hover:bg-sidebar-hover"
    >
      {theme === 'dark' ? (
        <Sun className="h-5 w-5 text-sidebar-foreground" />
      ) : (
        <Moon className="h-5 w-5 text-sidebar-foreground" />
      )}
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
}
