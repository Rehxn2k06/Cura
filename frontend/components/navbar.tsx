'use client';

import { useTheme } from 'next-themes';
import { Moon, Sun, Circle } from 'lucide-react';
import { useEffect, useState } from 'react';

export function PageHeader({ title }: { title: string }) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <header className="flex items-center justify-between">
      {/* Left: Page Title */}
      <div>
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white">{title}</h1>
      </div>

      {/* Right: Status & Theme Toggle */}
      <div className="flex items-center gap-6">
        {/* AI Agent Status */}
        <div className="flex items-center gap-2">
          <div className="relative w-2.5 h-2.5">
            <Circle className="w-2.5 h-2.5 fill-blue-500 dark:fill-green-500 text-blue-500 dark:text-green-500 animate-pulse" />
          </div>
          <span className="text-sm text-gray-700 dark:text-white/70">AI Online</span>
        </div>

        {/* Theme Toggle */}
        <button
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-white/10 transition-colors duration-300"
          aria-label="Toggle theme"
        >
          {theme === 'dark' ? (
            <Sun className="w-5 h-5 text-gray-600 dark:text-white/70" />
          ) : (
            <Moon className="w-5 h-5 text-gray-400 dark:text-white/70" />
          )}
        </button>
      </div>
    </header>
  );
}
