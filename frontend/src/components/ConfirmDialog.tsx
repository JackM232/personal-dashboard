import { useState } from "react";
import { Modal } from "./Modal";
import "./ConfirmDialog.css";

interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void> | void;
  title?: string;
  message: string;
  confirmLabel?: string;
  danger?: boolean;
}

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title = "Are you sure?",
  message,
  confirmLabel = "Confirm",
  danger = true,
}: ConfirmDialogProps) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleConfirm() {
    setSubmitting(true);
    setError(null);
    try {
      await onConfirm();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={title}>
      <div className="confirm-dialog">
        <p>{message}</p>
        {error && <p className="confirm-dialog-error">{error}</p>}
        <div className="confirm-dialog-actions">
          <button type="button" onClick={onClose} disabled={submitting}>
            Cancel
          </button>
          <button
            type="button"
            className={danger ? "danger" : "primary"}
            onClick={handleConfirm}
            disabled={submitting}
          >
            {submitting ? "Working..." : confirmLabel}
          </button>
        </div>
      </div>
    </Modal>
  );
}
