// Shared light/dark theme toggle. The very first paint's correct
// data-theme value is set by a blocking script in public/index.html
// (before React even mounts) so there's no flash of the wrong theme.
// This hook just reads whatever is already on <html> at mount time and
// keeps state/localStorage/the attribute all in sync from then on.
//
// Every part of the app that shows a theme toggle (SiteHeader,
// DashboardHeader) must use THIS hook — no page-local copies of this
// logic. That duplication is what caused theme state to drift between
// pages before.
import { useEffect, useState, useCallback } from 'react';

const THEME_KEY = 'efms_theme';

function resolveInitialIsDark() {
  if (typeof document !== 'undefined') {
    const current = document.documentElement.getAttribute('data-theme');
    if (current === 'dark' || current === 'light') return current === 'dark';
  }
  if (typeof localStorage !== 'undefined') {
    const stored = localStorage.getItem(THEME_KEY);
    if (stored === 'dark' || stored === 'light') return stored === 'dark';
  }
  return !!(
    typeof window !== 'undefined' &&
    window.matchMedia &&
    window.matchMedia('(prefers-color-scheme: dark)').matches
  );
}

export function useTheme() {
  // Lazy initializer: reads the attribute the bootstrap script already
  // set, so this component's very first render already agrees with what's
  // on screen — no useEffect delay, no mismatch.
  const [isDark, setIsDark] = useState(resolveInitialIsDark);

  // Keeps <html data-theme="..."> aligned with state on every mount.
  // Normally a no-op (the bootstrap script already set it correctly),
  // but guards against this hook ever mounting before that script runs.
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
  }, [isDark]);

  const toggleTheme = useCallback(() => {
    setIsDark((prev) => {
      const next = !prev;
      document.documentElement.setAttribute('data-theme', next ? 'dark' : 'light');
      localStorage.setItem(THEME_KEY, next ? 'dark' : 'light');
      return next;
    });
  }, []);

  return { isDark, toggleTheme };
}