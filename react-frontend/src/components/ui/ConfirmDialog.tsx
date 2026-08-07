import Button from "./Button";

export default function ConfirmDialog({
  title,
  message,
  confirmLabel = "Delete",
  busyLabel = "Deleting…",
  busy = false,
  onConfirm,
  onCancel,
}: {
  title: string;
  message: string;
  confirmLabel?: string;
  busyLabel?: string;
  busy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onCancel}
    >
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm rounded-xl bg-white p-5 shadow-xl dark:bg-slate-800"
      >
        <h2 id="confirm-dialog-title" className="mb-2 text-lg font-semibold text-slate-900 dark:text-slate-100">
          {title}
        </h2>
        <p className="mb-5 text-sm text-slate-600 dark:text-slate-300">{message}</p>
        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={onCancel} disabled={busy}>
            Cancel
          </Button>
          <Button variant="danger" onClick={onConfirm} disabled={busy}>
            {busy ? busyLabel : confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
