const THEME_KEY = 'kongamano_theme';

export function useTheme() {
  const isDark = ref(false);

  function applyTheme(dark: boolean) {
    if (!import.meta.client) return;
    const html = document.documentElement;
    if (dark) {
      html.setAttribute('data-bs-theme', 'dark');
      html.setAttribute('data-theme', 'dark');
    } else {
      html.removeAttribute('data-bs-theme');
      html.removeAttribute('data-theme');
    }
    isDark.value = dark;
    localStorage.setItem(THEME_KEY, dark ? 'dark' : 'light');
  }

  function toggleTheme() {
    applyTheme(!isDark.value);
  }

  function initTheme() {
    if (!import.meta.client) return;
    const saved = localStorage.getItem(THEME_KEY);
    // Also honour OS preference if no saved choice
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    applyTheme(saved ? saved === 'dark' : prefersDark);
  }

  return { isDark, toggleTheme, initTheme };
}
