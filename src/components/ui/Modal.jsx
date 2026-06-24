// src/components/ui/Modal.jsx
//
// Accessible modal dialog with overlay, keyboard close, and scroll lock.
//
// SCROLL LOCK:
//   When the modal opens, document.body.style.overflow is set to 'hidden' so
//   the page behind the modal can't be scrolled. The cleanup function restores
//   'unset' when the modal closes OR when the component unmounts. Without this,
//   the page would be permanently unscrollable after a modal closes during unmount.
//
// ESC KEY HANDLER:
//   A keydown listener is added to window only while the modal is open.
//   The cleanup removes it when the modal closes or the component unmounts,
//   preventing stale listeners from accumulating. ESC is a standard UX pattern
//   for dismissing dialogs.
//
// OVERLAY CLICK:
//   Clicking the dark backdrop (`absolute inset-0`) calls onClose, matching user
//   expectations for dismissing a dialog. The modal content itself is `relative`
//   and sits above the backdrop — clicks on it do not propagate to the backdrop.
//
// CONDITIONAL RENDER:
//   `if (!isOpen) return null` completely removes the modal from the DOM when
//   closed. This avoids the overhead of a hidden but mounted complex form,
//   and also ensures that the modal's internal state (form values, etc.) resets
//   naturally when it unmounts.
//
// size prop controls max width — allows different modals to be appropriately
//   sized (a confirm dialog doesn't need the same width as a multi-tab editor).

import { useEffect } from 'react'
import { X } from 'lucide-react'

export default function Modal({ isOpen, onClose, title, children, size = 'md' }) {
  const sizes = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
  }

  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : 'unset'
    return () => { document.body.style.overflow = 'unset' }
  }, [isOpen])

  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose() }
    if (isOpen) window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className={`relative w-full ${sizes[size]} bg-slate-800 rounded-xl border border-slate-700 shadow-2xl`}>
        <div className="flex items-center justify-between p-5 border-b border-slate-700">
          <h2 className="text-lg font-semibold text-white truncate pr-4">{title}</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg p-1.5 transition-colors flex-shrink-0"
          >
            <X size={18} />
          </button>
        </div>
        <div className="p-5 overflow-y-auto max-h-[80vh]">
          {children}
        </div>
      </div>
    </div>
  )
}
