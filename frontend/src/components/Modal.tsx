import { useEffect, useRef } from "react";
import type { ReactNode } from "react";
import "./Modal.css";

// Modals can nest — a recipe's detail popup opens a "log cook" form on top of
// itself. Only the topmost one should answer Escape, or one keypress would
// dismiss the whole stack.
const stack: symbol[] = [];

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  // Forms fit the default width; content that lays itself out in columns —
  // a recipe's ingredients beside its steps — needs the wide variant.
  size?: "default" | "wide";
}

export function Modal({ open, onClose, title, children, size = "default" }: ModalProps) {
  const id = useRef(Symbol("modal"));

  useEffect(() => {
    if (!open) return;
    const self = id.current;
    stack.push(self);

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && stack[stack.length - 1] === self) onClose();
    };
    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      stack.splice(stack.indexOf(self), 1);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    // Overlays of nested modals sit inside their parent's DOM, so a click that
    // dismisses the inner one must not bubble on to dismiss the outer one too.
    <div
      className="modal-overlay"
      onMouseDown={(e) => {
        e.stopPropagation();
        onClose();
      }}
    >
      <div
        className={`modal modal-${size}`}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h2>{title}</h2>
          <button type="button" className="modal-close" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>
        <div className="modal-body">{children}</div>
      </div>
    </div>
  );
}
