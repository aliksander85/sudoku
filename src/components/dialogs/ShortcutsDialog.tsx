import Dialog from './Dialog.tsx'
import styles from './dialogs.module.css'

// Mirrors the README table (§6.4). Each entry in `keys` is an alternative; keys within one are pressed together.
const SHORTCUTS: { keys: string[][]; action: string }[] = [
  { keys: [['←↑↓→'], ['WASD']], action: 'Move selection' },
  { keys: [['1–9']], action: 'Enter digit (note in notes mode)' },
  { keys: [['Shift', '1–9']], action: 'Toggle note' },
  { keys: [['Backspace'], ['Delete'], ['0']], action: 'Erase' },
  { keys: [['N']], action: 'Toggle notes mode' },
  { keys: [['H']], action: 'Hint' },
  { keys: [['P']], action: 'Pause / resume' },
  { keys: [['Ctrl/Cmd', 'Z']], action: 'Undo' },
  { keys: [['Ctrl/Cmd', 'Shift', 'Z'], ['Ctrl', 'Y']], action: 'Redo' },
  { keys: [['?']], action: 'Show shortcuts' },
  { keys: [['Esc']], action: 'Close dialog' },
]

interface Props {
  open: boolean
  onClose: () => void
}

function ShortcutsDialog({ open, onClose }: Props) {
  return (
    <Dialog open={open} onClose={onClose} title="Keyboard shortcuts">
      <table className={styles.shortcuts}>
        <tbody>
          {SHORTCUTS.map(({ keys, action }) => (
            <tr key={action}>
              <th scope="row">
                {keys.map((combo, i) => (
                  <span key={i} className={styles.combo}>
                    {i > 0 && ' / '}
                    {combo.map((key, j) => (
                      <span key={key}>
                        {j > 0 && ' + '}
                        <kbd>{key}</kbd>
                      </span>
                    ))}
                  </span>
                ))}
              </th>
              <td>{action}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className={styles.note}>Keys use physical positions, so they work on any keyboard layout.</p>
      <div className={styles.actions}>
        <button type="button" onClick={onClose}>
          Close
        </button>
      </div>
    </Dialog>
  )
}

export default ShortcutsDialog
