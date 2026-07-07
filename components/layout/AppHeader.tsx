'use client';

import { GlobalSearch } from './GlobalSearch';
import { NotificationCenter } from '../notifications/NotificationCenter';

export function AppHeader() {
  return (
    <header className="sticky top-0 z-40 flex h-14 items-center gap-4 border-b border-border/60 bg-background/80 backdrop-blur-xl px-4 lg:px-6">
      <div className="flex-1 max-w-md">
        <GlobalSearch className="w-full" />
      </div>
      <NotificationCenter />
    </header>
  );
}
