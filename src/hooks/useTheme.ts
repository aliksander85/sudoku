import { useEffect } from 'react'
import { useSettingsStore } from '../store/index.ts'

// Mirrors the `theme` setting onto <html data-theme>; `system` removes the attribute (§6.6).
export function useTheme(): void {
  const theme = useSettingsStore((s) => s.settings.theme)
  useEffect(() => {
    const root = document.documentElement
    if (theme === 'system') delete root.dataset.theme
    else root.dataset.theme = theme
  }, [theme])
}
