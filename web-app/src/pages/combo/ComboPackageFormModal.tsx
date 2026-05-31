import { useEffect, useState } from "react";
import type { ComboPackageFormData } from "../../api/comboApi";
import {
  DEFAULT_COMBO_FORM,
  FIELD_TYPE_OPTIONS,
  formatCoin,
  formatVndFromCoin,
} from "./comboConstants";

interface ComboPackageFormModalProps {
  open: boolean;
  title: string;
  initial: ComboPackageFormData;
  isEdit?: boolean;
  submitting?: boolean;
  onClose: () => void;
  onSubmit: (data: ComboPackageFormData) => void;
}

export default function ComboPackageFormModal({
  open,
  title,
  initial,
  isEdit = false,
  submitting = false,
  onClose,
  onSubmit,
}: ComboPackageFormModalProps) {
  const [form, setForm] = useState<ComboPackageFormData>(initial);

  useEffect(() => {
    if (open) setForm(initial);
  }, [open, initial]);

  if (!open) return null;

  const perMatch =
    form.matchCount > 0
      ? Math.round((form.priceCoin / form.matchCount) * 100) / 100
      : 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    onSubmit({
      ...form,
      name: form.name.trim(),
      description: form.description?.trim() || undefined,
    });
  };

  const setNum = (key: "matchCount" | "priceCoin" | "validityDays", v: string) => {
    const n = Number(v);
    if (!Number.isFinite(n)) return;
    setForm((f) => ({ ...f, [key]: n }));
  };

  return (
    <div
      className="fixed inset-0 z-[1100] flex items-center justify-center bg-black/50 p-4 backdrop-blur-[2px]"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="flex max-h-[90vh] w-full max-w-xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-labelledby="combo-form-title"
      >
        <div className="border-b border-gray-100 px-6 py-4">
          <h2
            id="combo-form-title"
            className="m-0 text-lg font-bold text-primary-dark"
          >
            {title}
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Cấu hình gói combo hiển thị trên app mobile tại cụm sân này.
          </p>
        </div>

        <form
          className="flex-1 space-y-4 overflow-y-auto px-6 py-5"
          onSubmit={handleSubmit}
        >
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-primary-dark">
              Loại sân
            </label>
            <select
              value={form.fieldType}
              disabled={isEdit}
              className="input-field w-full disabled:cursor-not-allowed disabled:bg-slate-50"
              onChange={(e) =>
                setForm((f) => ({ ...f, fieldType: e.target.value }))
              }
              required
            >
              {FIELD_TYPE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
            {isEdit && (
              <p className="mt-1 text-xs text-slate-500">
                Không đổi loại sân sau khi tạo gói.
              </p>
            )}
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-semibold text-primary-dark">
              Tên gói
            </label>
            <input
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              className="input-field w-full"
              placeholder="VD: Combo 10 sân 5"
              required
              minLength={2}
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-semibold text-primary-dark">
              Mô tả (tuỳ chọn)
            </label>
            <textarea
              value={form.description ?? ""}
              onChange={(e) =>
                setForm((f) => ({ ...f, description: e.target.value }))
              }
              className="input-field min-h-[72px] w-full resize-y"
              placeholder="Ghi chú cho người chơi trên app..."
              maxLength={500}
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-primary-dark">
                Số lượt
              </label>
              <input
                type="number"
                min={1}
                max={500}
                value={form.matchCount}
                onChange={(e) => setNum("matchCount", e.target.value)}
                className="input-field w-full"
                required
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-primary-dark">
                Giá (coin)
              </label>
              <input
                type="number"
                min={1}
                value={form.priceCoin}
                onChange={(e) => setNum("priceCoin", e.target.value)}
                className="input-field w-full"
                required
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-primary-dark">
                Hạn (ngày)
              </label>
              <input
                type="number"
                min={1}
                max={3650}
                value={form.validityDays}
                onChange={(e) => setNum("validityDays", e.target.value)}
                className="input-field w-full"
                required
              />
            </div>
          </div>

          <div className="rounded-xl border border-primary/15 bg-primary-light/40 px-4 py-3 text-sm">
            <p className="m-0 font-semibold text-primary-dark">Xem trước</p>
            <p className="mt-1 m-0 text-slate-600">
              {formatCoin(form.priceCoin)} ≈ {formatVndFromCoin(form.priceCoin)} ·{" "}
              <span className="font-medium text-primary">
                ~{formatCoin(perMatch)}/lượt
              </span>
            </p>
          </div>
        </form>

        <div className="flex justify-end gap-3 border-t border-gray-100 px-6 py-4">
          <button
            type="button"
            className="btn-secondary"
            onClick={onClose}
            disabled={submitting}
          >
            Hủy
          </button>
          <button
            type="button"
            className="btn-primary min-w-[120px]"
            disabled={submitting}
            onClick={handleSubmit}
          >
            {submitting ? "Đang lưu..." : "Lưu gói"}
          </button>
        </div>
      </div>
    </div>
  );
}
