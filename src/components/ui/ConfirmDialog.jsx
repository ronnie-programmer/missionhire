// src/components/ui/ConfirmDialog.jsx
//
// Two-step confirmation dialog for destructive actions (currently: deleting a job).
//
// WHY A SEPARATE COMPONENT FOR THIS?
//   Confirmation dialogs are used in two places (DashboardPage and EditJobModal).
//   Abstracting to a component avoids duplicating the Modal + button layout.
//   It also standardizes the UX: all deletions go through the same "are you sure?"
//   flow with the same wording pattern.
//
// Built on top of Modal.jsx so it inherits scroll lock, ESC key, and backdrop click
// dismissal behavior automatically.
//
// The `loading` prop is forwarded to the Delete button to show a spinner while the
// delete request is in flight, and to the Cancel button's `disabled` prop so the
// user can't accidentally dismiss while a request is pending.

import Modal from './Modal'
import Button from './Button'

export default function ConfirmDialog({ isOpen, onClose, onConfirm, title, message, loading }) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="sm">
      <p className="text-slate-300 text-sm mb-6">{message}</p>
      <div className="flex gap-3 justify-end">
        <Button variant="secondary" onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        <Button variant="danger" onClick={onConfirm} loading={loading}>
          Delete
        </Button>
      </div>
    </Modal>
  )
}
