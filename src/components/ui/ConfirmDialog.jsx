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
