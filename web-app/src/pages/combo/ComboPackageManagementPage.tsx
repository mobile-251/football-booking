import React, { useCallback, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import PageShell from "../../components/layout/PageShell";
import EmptyState from "../../components/ui/EmptyState";
import comboApi, {
  type ComboPackageFormData,
  type ComboPackageRecord,
} from "../../api/comboApi";
import { useCurrentVenue } from "../../hooks/useCurrentVenue";
import { cn } from "../../lib/cn";
import ComboPackageFormModal from "./ComboPackageFormModal";
import {
  DEFAULT_COMBO_FORM,
  FIELD_TYPE_OPTIONS,
  fieldTypeLabel,
  formatCoin,
  formatVndFromCoin,
} from "./comboConstants";

type FieldFilter = "ALL" | string;

function apiErrorMessage(err: unknown, fallback: string): string {
  const ax = err as { response?: { data?: { message?: string | string[] } } };
  const msg = ax.response?.data?.message;
  if (Array.isArray(msg)) return msg.join(", ");
  if (typeof msg === "string" && msg.trim()) return msg;
  return fallback;
}

function toFormData(p: ComboPackageRecord): ComboPackageFormData {
  return {
    fieldType: p.fieldType,
    name: p.name,
    description: p.description ?? "",
    matchCount: p.matchCount,
    priceCoin: p.priceCoin,
    validityDays: p.validityDays,
  };
}

export default function ComboPackageManagementPage() {
  const { currentVenueId } = useCurrentVenue();
  const [packages, setPackages] = useState<ComboPackageRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [fieldFilter, setFieldFilter] = useState<FieldFilter>("ALL");
  const [modal, setModal] = useState<
    | { mode: "create"; data: ComboPackageFormData }
    | { mode: "edit"; id: number; data: ComboPackageFormData }
    | null
  >(null);

  const load = useCallback(async () => {
    if (!currentVenueId) return;
    setLoading(true);
    try {
      const list = await comboApi.list(currentVenueId);
      setPackages(Array.isArray(list) ? list : []);
    } catch (err) {
      toast.error(apiErrorMessage(err, "Không tải được gói combo"));
    } finally {
      setLoading(false);
    }
  }, [currentVenueId]);

  useEffect(() => {
    load();
  }, [load]);

  const stats = useMemo(() => {
    const active = packages.filter((p) => p.isActive).length;
    return {
      total: packages.length,
      active,
      inactive: packages.length - active,
    };
  }, [packages]);

  const filtered = useMemo(() => {
    if (fieldFilter === "ALL") return packages;
    return packages.filter((p) => p.fieldType === fieldFilter);
  }, [packages, fieldFilter]);

  const handleCreate = async (data: ComboPackageFormData) => {
    if (!currentVenueId) return;
    setSubmitting(true);
    try {
      await comboApi.create(currentVenueId, data);
      toast.success("Đã tạo gói combo");
      setModal(null);
      load();
    } catch (err) {
      toast.error(apiErrorMessage(err, "Tạo gói thất bại"));
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdate = async (data: ComboPackageFormData) => {
    if (!currentVenueId || !modal || modal.mode !== "edit") return;
    setSubmitting(true);
    try {
      await comboApi.update(currentVenueId, modal.id, {
        name: data.name,
        description: data.description,
        matchCount: data.matchCount,
        priceCoin: data.priceCoin,
        validityDays: data.validityDays,
      });
      toast.success("Đã cập nhật gói combo");
      setModal(null);
      load();
    } catch (err) {
      toast.error(apiErrorMessage(err, "Cập nhật thất bại"));
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleActive = async (pkg: ComboPackageRecord) => {
    if (!currentVenueId) return;
    try {
      await comboApi.update(currentVenueId, pkg.id, {
        isActive: !pkg.isActive,
      });
      toast.success(pkg.isActive ? "Đã ẩn gói" : "Đã kích hoạt gói");
      load();
    } catch {
      toast.error("Không cập nhật được trạng thái");
    }
  };

  const handleDelete = async (pkg: ComboPackageRecord) => {
    if (!currentVenueId) return;
    if (
      !window.confirm(
        `Xóa gói "${pkg.name}"? Người chơi sẽ không mua được gói này nữa.`,
      )
    ) {
      return;
    }
    try {
      await comboApi.remove(currentVenueId, pkg.id);
      toast.success("Đã xóa gói combo");
      load();
    } catch {
      toast.error("Xóa gói thất bại");
    }
  };

  if (!currentVenueId) {
    return (
      <PageShell title="Gói combo">
        <EmptyState
          title="Chưa chọn cụm sân"
          description="Chọn cụm sân ở thanh trên để cấu hình gói combo."
        />
      </PageShell>
    );
  }

  return (
    <PageShell
      title="Gói combo membership"
      subtitle="Cấu hình gói đặt sân theo lượt"
      loading={loading}
      actions={
        <button
          type="button"
          className="btn-primary flex items-center gap-2 px-4 py-2 text-sm"
          onClick={() =>
            setModal({ mode: "create", data: { ...DEFAULT_COMBO_FORM } })
          }
        >
          <span className="text-lg leading-none">+</span>
          Thêm gói mới
        </button>
      }
    >
      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="card-surface flex items-center gap-4 p-5">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary-light text-xl">
            🎫
          </div>
          <div>
            <p className="m-0 text-sm text-slate-500">Tổng gói</p>
            <p className="m-0 text-2xl font-bold text-primary-dark">
              {stats.total}
            </p>
          </div>
        </div>
        <div className="card-surface flex items-center gap-4 p-5">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-xl">
            ✓
          </div>
          <div>
            <p className="m-0 text-sm text-slate-500">Đang bán</p>
            <p className="m-0 text-2xl font-bold text-primary-dark">
              {stats.active}
            </p>
          </div>
        </div>
        <div className="card-surface flex items-center gap-4 p-5">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-xl">
            ⏸
          </div>
          <div>
            <p className="m-0 text-sm text-slate-500">Đã ẩn</p>
            <p className="m-0 text-2xl font-bold text-primary-dark">
              {stats.inactive}
            </p>
          </div>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex flex-wrap gap-2">
        <FilterChip
          active={fieldFilter === "ALL"}
          onClick={() => setFieldFilter("ALL")}
          label="Tất cả"
          count={packages.length}
        />
        {FIELD_TYPE_OPTIONS.map((o) => (
          <FilterChip
            key={o.value}
            active={fieldFilter === o.value}
            onClick={() => setFieldFilter(o.value)}
            label={o.short}
            count={packages.filter((p) => p.fieldType === o.value).length}
          />
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="card-surface px-6 py-14 text-center">
          <p className="m-0 text-sm text-slate-500">
            {fieldFilter === "ALL"
              ? "Chưa có gói combo nào."
              : `Chưa có gói combo cho loại sân ${fieldTypeLabel(fieldFilter)}.`}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-3">
          {filtered.map((pkg) => (
            <PackageCard
              key={pkg.id}
              pkg={pkg}
              onEdit={() =>
                setModal({ mode: "edit", id: pkg.id, data: toFormData(pkg) })
              }
              onToggle={() => handleToggleActive(pkg)}
              onDelete={() => handleDelete(pkg)}
            />
          ))}
        </div>
      )}

      <ComboPackageFormModal
        open={modal !== null}
        title={modal?.mode === "edit" ? "Chỉnh sửa gói combo" : "Thêm gói combo mới"}
        initial={modal?.data ?? DEFAULT_COMBO_FORM}
        isEdit={modal?.mode === "edit"}
        submitting={submitting}
        onClose={() => setModal(null)}
        onSubmit={modal?.mode === "edit" ? handleUpdate : handleCreate}
      />
    </PageShell>
  );
}

function FilterChip({
  active,
  onClick,
  label,
  count,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  count: number;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-colors",
        active
          ? "bg-primary text-white shadow-sm"
          : "bg-white text-slate-600 ring-1 ring-gray-200 hover:bg-primary-light/50",
      )}
    >
      {label}
      <span
        className={cn(
          "rounded-full px-2 py-0.5 text-xs",
          active ? "bg-white/20 text-white" : "bg-slate-100 text-slate-600",
        )}
      >
        {count}
      </span>
    </button>
  );
}

function PackageCard({
  pkg,
  onEdit,
  onToggle,
  onDelete,
}: {
  pkg: ComboPackageRecord;
  onEdit: () => void;
  onToggle: () => void;
  onDelete: () => void;
}) {
  const perMatch =
    pkg.pricePerMatch ??
    (pkg.matchCount > 0
      ? Math.round((pkg.priceCoin / pkg.matchCount) * 100) / 100
      : 0);

  return (
    <article
      className={cn(
        "card-surface relative flex flex-col overflow-hidden transition-shadow hover:shadow-md",
        !pkg.isActive && "opacity-75",
      )}
    >
      <div
        className={cn(
          "h-1.5 w-full",
          pkg.isActive ? "bg-primary" : "bg-slate-300",
        )}
      />
      <div className="flex flex-1 flex-col p-5">
        <div className="mb-3 flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <span className="rounded-md bg-primary/10 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide text-primary-dark">
                {fieldTypeLabel(pkg.fieldType)}
              </span>
              <span
                className={cn(
                  "rounded-full px-2 py-0.5 text-[11px] font-semibold",
                  pkg.isActive
                    ? "bg-emerald-50 text-emerald-700"
                    : "bg-slate-100 text-slate-500",
                )}
              >
                {pkg.isActive ? "Đang bán" : "Đã ẩn"}
              </span>
            </div>
            <h3 className="m-0 truncate text-base font-bold text-primary-dark">
              {pkg.name}
            </h3>
            {pkg.description && (
              <p className="mt-1 line-clamp-2 text-sm text-slate-500">
                {pkg.description}
              </p>
            )}
          </div>
        </div>

        <div className="mb-4 grid grid-cols-2 gap-3 rounded-xl bg-slate-50 p-3 text-sm">
          <div>
            <p className="m-0 text-xs text-slate-500">Số lượt</p>
            <p className="m-0 font-bold text-primary-dark">{pkg.matchCount}</p>
          </div>
          <div>
            <p className="m-0 text-xs text-slate-500">Hiệu lực</p>
            <p className="m-0 font-bold text-primary-dark">
              {pkg.validityDays} ngày
            </p>
          </div>
          <div className="col-span-2 border-t border-slate-200 pt-2">
            <p className="m-0 text-xs text-slate-500">Giá gói</p>
            <p className="m-0 text-lg font-bold text-primary">
              {formatCoin(pkg.priceCoin)}
            </p>
            <p className="m-0 text-xs text-slate-500">
              ≈ {formatVndFromCoin(pkg.priceCoin)} · ~
              {formatCoin(perMatch)}/lượt
            </p>
          </div>
        </div>

        <div className="mt-auto flex flex-wrap gap-2 border-t border-gray-100 pt-4">
          <button type="button" className="btn-secondary flex-1 py-2 text-sm" onClick={onEdit}>
            Sửa
          </button>
          <button
            type="button"
            className="btn-secondary flex-1 py-2 text-sm"
            onClick={onToggle}
          >
            {pkg.isActive ? "Ẩn" : "Bật"}
          </button>
          <button
            type="button"
            className="rounded-[var(--radius-control)] px-3 py-2 text-sm font-semibold text-red-600 ring-1 ring-red-200 transition-colors hover:bg-red-50"
            onClick={onDelete}
          >
            Xóa
          </button>
        </div>
      </div>
    </article>
  );
}
