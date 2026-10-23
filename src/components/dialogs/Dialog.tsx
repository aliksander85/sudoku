import { useEffect, useId, useRef, type ReactNode } from 'react'
import styles from './dialogs.module.css'

interface Props {
  open: boolean
  onClose: () => void
  title: string
  dismissible?: boolean
  children: ReactNode
}

function Dialog({ open, onClose, title, dismissible = true, children }: Props) {
  const ref = useRef<HTMLDialogElement>(null)
  const titleId = useId()

  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    if (open && !dialog.open) dialog.showModal()
    else if (!open && dialog.open) dialog.close()
  }, [open])

  return (
    <dialog
      ref={ref}
      className={styles.dialog}
      aria-labelledby={titleId}
      onCancel={(e) => {
        e.preventDefault()
        if (dismissible) onClose()
      }}
      onClick={(e) => {
        if (dismissible && e.target === e.currentTarget) onClose()
      }}
    >
      <h2 id={titleId} className={styles.title}>
        {title}
      </h2>
      {children}
    </dialog>
  )
}

export default Dialog
