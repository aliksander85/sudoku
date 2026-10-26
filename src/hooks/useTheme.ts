import { useEffect } from 'react'
import { useSettingsStore } from '../store/index.ts'

// Mirrors the `theme` setting onto <html data-theme>; `system` removes the attribute (§6.6).
// Mirrors `handDrawn` onto <html data-style="sketch">, which switches the sketch tokens in global.css.
export function useTheme(): void {
  const theme = useSettingsStore((s) => s.settings.theme)
  const handDrawn = useSettingsStore((s) => s.settings.handDrawn)
  useEffect(() => {
    const root = document.documentElement
    if (theme === 'system') delete root.dataset.theme
    else root.dataset.theme = theme
  }, [theme])
  useEffect(() => {
    const root = document.documentElement
    if (handDrawn) root.dataset.style = 'sketch'
    else delete root.dataset.style
  }, [handDrawn])
}
