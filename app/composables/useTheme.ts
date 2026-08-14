const THEME_KEY = 'kongamano_theme';

export function useTheme() {
  const isDark = ref(false);

  function applyTheme() {
    if (!import.meta.client) return;
    const html = document.documentElement;
    html.removeAttribute('data-bs-theme');
    html.removeAttribute('data-theme');
    isDark.value = false;
    localStorage.setItem(THEME_KEY, 'light');
  }

  function toggleTheme() {
    applyTheme();
  }

  function initTheme() {
    applyTheme();
  }

  return { isDark, toggleTheme, initTheme };
}
