import type { ReactNode } from 'react';

interface EditModalProps {
  title: string;
  open: boolean;
  onClose: () => void;
  onSubmit: () => void;
  submitting?: boolean;
  children: ReactNode;
  wide?: boolean;
}

export default function EditModal({
  title,
  open,
  onClose,
  onSubmit,
  submitting = false,
  children,
  wide = false,
}: EditModalProps) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[1100] flex items-center justify-center bg-black/50 p-4 backdrop-blur-[2px]"
      onClick={onClose}
      role="presentation"
    >
      <div
        className={`flex max-h-[90vh] w-full flex-col overflow-hidden rounded-2xl bg-white shadow-2xl ${
          wide ? 'max-w-3xl' : 'max-w-lg'
        }`}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-labelledby="edit-modal-title"
      >
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <h2 id="edit-modal-title" className="m-0 text-lg font-bold text-primary-dark">
            {title}
          </h2>
          <button
            type="button"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100"
            onClick={onClose}
            aria-label="Đóng"
          >
            ×
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5">{children}</div>

        <div className="flex justify-end gap-3 border-t border-gray-100 px-6 py-4">
          <button type="button" className="btn-secondary" onClick={onClose} disabled={submitting}>
            Hủy
          </button>
          <button
            type="button"
            className="btn-primary min-w-[100px]"
            onClick={onSubmit}
            disabled={submitting}
          >
            {submitting ? 'Đang lưu...' : 'Lưu thay đổi'}
          </button>
        </div>
      </div>
    </div>
  );
}
