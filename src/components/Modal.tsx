import { useEffect, useRef } from 'react';

interface ModalProps {
  open: boolean;
  title: string;
  onClose?: () => void;
  children: React.ReactNode;
  actions?: React.ReactNode;
}

export default function Modal({ open, title, onClose, children, actions }: ModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const previouslyFocused = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (open) {
      previouslyFocused.current = document.activeElement as HTMLElement;
      const firstButton = dialogRef.current?.querySelector('button');
      (firstButton as HTMLElement)?.focus();
    } else {
      previouslyFocused.current?.focus?.();
    }
  }, [open]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape' && open && onClose) {
        onClose();
      }
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="presentation"
      onClick={(e) => {
        if (e.target === e.currentTarget && onClose) onClose();
      }}
    >
      <div className="absolute inset-0 bg-ink/50 backdrop-blur-sm" />
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        className="relative z-10 w-full max-w-md rounded-2xl border border-gold/30 bg-parchment-2 p-6 shadow-2xl dark:bg-parchment-3"
      >
        <h2 id="modal-title" className="mb-3 text-xl font-bold text-ink">
          {title}
        </h2>
        <div className="mb-5 text-ink-soft">{children}</div>
        {actions && <div className="flex flex-wrap gap-3">{actions}</div>}
      </div>
    </div>
  );
}
