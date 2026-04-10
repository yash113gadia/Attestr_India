import { useState, useEffect } from 'react';
import { Sun, Moon } from 'lucide-react';

export default function ThemeToggle({ className = '' }) {
  const [light, setLight] = useState(() => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem('attestr-theme') === 'light';
  });

  useEffect(() => {
    const root = document.documentElement;
    if (light) {
      root.classList.add('light');
      localStorage.setItem('attestr-theme', 'light');
    } else {
      root.classList.remove('light');
      localStorage.setItem('attestr-theme', 'dark');
    }
  }, [light]);

  return (
    <button
      onClick={() => setLight(!light)}
      className={`p-1.5 rounded-sm border border-rule text-ink-tertiary hover:text-ink hover:bg-surface-raised transition ${className}`}
      aria-label={light ? 'Switch to dark mode' : 'Switch to light mode'}
      title={light ? 'Dark mode' : 'Light mode'}
    >
      {light ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
    </button>
  );
}
