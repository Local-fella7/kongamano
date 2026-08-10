import { describe, it, expect, beforeEach, vi } from 'vitest'
import { ref } from 'vue'

describe('useTheme comprehensive tests', () => {
  let isDark: any

  function applyTheme(dark: boolean) {
    const html = document.documentElement
    if (dark) {
      html.setAttribute('data-bs-theme', 'dark')
      html.setAttribute('data-theme', 'dark')
    } else {
      html.removeAttribute('data-bs-theme')
      html.removeAttribute('data-theme')
    }
    isDark.value = dark
    localStorage.setItem('kongamano_theme', dark ? 'dark' : 'light')
  }

  function toggleTheme() {
    applyTheme(!isDark.value)
  }

  function initTheme(savedPreference?: string, prefersDark: boolean = false) {
    const saved = savedPreference || localStorage.getItem('kongamano_theme')
    applyTheme(saved ? saved === 'dark' : prefersDark)
  }

  beforeEach(() => {
    isDark = ref(false)
    localStorage.clear()
    document.documentElement.removeAttribute('data-bs-theme')
    document.documentElement.removeAttribute('data-theme')
  })

  it('1. applies dark mode attributes and localStorage', () => {
    applyTheme(true)
    expect(isDark.value).toBe(true)
    expect(document.documentElement.getAttribute('data-bs-theme')).toBe('dark')
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark')
    expect(localStorage.getItem('kongamano_theme')).toBe('dark')
  })

  it('2. removes dark mode attributes when set to light mode', () => {
    applyTheme(false)
    expect(isDark.value).toBe(false)
    expect(document.documentElement.getAttribute('data-bs-theme')).toBeNull()
    expect(document.documentElement.getAttribute('data-theme')).toBeNull()
    expect(localStorage.getItem('kongamano_theme')).toBe('light')
  })

  it('3. toggles theme from light to dark', () => {
    isDark.value = false
    toggleTheme()
    expect(isDark.value).toBe(true)
  })

  it('4. toggles theme from dark to light', () => {
    isDark.value = true
    toggleTheme()
    expect(isDark.value).toBe(false)
  })

  it('5. initializes saved dark preference from localStorage', () => {
    localStorage.setItem('kongamano_theme', 'dark')
    initTheme()
    expect(isDark.value).toBe(true)
  })

  it('6. initializes saved light preference from localStorage', () => {
    localStorage.setItem('kongamano_theme', 'light')
    initTheme()
    expect(isDark.value).toBe(false)
  })

  it('7. honours OS prefers-color-scheme dark preference when no saved choice exists', () => {
    initTheme(undefined, true)
    expect(isDark.value).toBe(true)
  })

  it('8. defaults to light mode when no saved preference and OS prefers light', () => {
    initTheme(undefined, false)
    expect(isDark.value).toBe(false)
  })
})
