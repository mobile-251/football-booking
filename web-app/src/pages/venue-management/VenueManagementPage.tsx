import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import PageShell from "../../components/layout/PageShell";
import { useCurrentVenue } from "../../hooks/useCurrentVenue";
import { cn } from "../../lib/cn";
import venueManagementApi, {
  type FieldOperationalStatus,
  type UpdateVenueManagementPayload,
  type VenueManagementData,
} from "../../api/venueManagementApi";
import SectionCard from "./components/SectionCard";
import VenueEditDialog, {
  type EditSection,
} from "./components/VenueEditDialog";
import EditModal from "./components/EditModal";
import { formatVenueHoursLabel } from "../../utils/venueHours";

function formatPrice(amount: number): string {
  return `${new Intl.NumberFormat("vi-VN").format(amount)}đ`;
}

function formatHours(open: string, close: string): string {
  return formatVenueHoursLabel(open, close);
}

const AMENITY_ICONS: Record<string, string> = {
  wifi: "📶",
  parking: "🅿️",
  changing_room: "🚿",
  lockers: "🔐",
  canteen: "🍜",
};

export default function VenueManagementPage() {
  const { currentVenueId } = useCurrentVenue();
  const [data, setData] = useState<VenueManagementData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editSection, setEditSection] = useState<EditSection | null>(null);
  const [showAddField, setShowAddField] = useState(false);
  const [newFieldName, setNewFieldName] = useState("");
  const [newFieldType, setNewFieldType] = useState("FIELD_5VS5");
  const [renameField, setRenameField] = useState<{
    id: number;
    name: string;
  } | null>(null);

  const load = useCallback(async () => {
    if (!currentVenueId) return;
    setLoading(true);
    try {
      const result = await venueManagementApi.getManagement(currentVenueId);
      setData(result);
    } catch {
      toast.error("Không tải được thông tin sân");
    } finally {
      setLoading(false);
    }
  }, [currentVenueId]);

  useEffect(() => {
    load();
  }, [load]);

  const saveManagement = async (payload: UpdateVenueManagementPayload) => {
    if (!currentVenueId) return;
    setSaving(true);
    try {
      const updated = await venueManagementApi.updateManagement(
        currentVenueId,
        payload,
      );
      setData(updated);
      setEditSection(null);
      setRenameField(null);
      toast.success("Đã lưu thay đổi");
    } catch {
      toast.error("Lưu thất bại");
      throw new Error("save failed");
    } finally {
      setSaving(false);
    }
  };

  const handleStatusChange = async (
    fieldId: number,
    status: FieldOperationalStatus,
  ) => {
    if (!currentVenueId) return;
    try {
      const updated = await venueManagementApi.updateFieldStatus(
        currentVenueId,
        fieldId,
        status,
      );
      setData(updated);
      toast.success("Đã cập nhật trạng thái sân");
    } catch {
      toast.error("Cập nhật thất bại");
    }
  };

  const handleAddField = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentVenueId || !newFieldName.trim()) return;
    try {
      const updated = await venueManagementApi.createField(currentVenueId, {
        name: newFieldName.trim(),
        fieldType: newFieldType,
      });
      setData(updated);
      setNewFieldName("");
      setShowAddField(false);
      toast.success("Đã thêm sân con");
    } catch {
      toast.error("Thêm sân thất bại");
    }
  };

  const handleRenameField = async () => {
    if (!renameField?.name.trim()) return;
    try {
      await saveManagement({
        fieldNames: [{ id: renameField.id, name: renameField.name.trim() }],
      });
    } catch {
      /* toast handled in saveManagement */
    }
  };

  if (!currentVenueId) {
    return (
      <PageShell
        title="Quản lý Thông Tin Sân"
        subtitle="Chọn sân ở menu bên trái để tiếp tục"
      />
    );
  }

  if (loading || !data) {
    return (
      <PageShell
        title="Quản lý Thông Tin Sân"
        subtitle="Chỉnh sửa thông tin đầy đủ và quản lý các sân con"
        loading
      />
    );
  }

  const { venue, pricingByType, fields } = data;
  const fullAddress = [venue.address, venue.district, venue.city]
    .filter(Boolean)
    .join(", ");

  return (
    <PageShell
      title="Quản lý Thông Tin Sân"
      subtitle="Chỉnh sửa thông tin đầy đủ và quản lý các sân con"
    >
      {data && (
        <VenueEditDialog
          section={editSection}
          data={data}
          onClose={() => setEditSection(null)}
          onSave={saveManagement}
          submitting={saving}
        />
      )}

      <EditModal
        title="Đổi tên sân con"
        open={renameField !== null}
        onClose={() => setRenameField(null)}
        onSubmit={handleRenameField}
        submitting={saving}
      >
        <label className="mb-1.5 block text-sm font-semibold text-slate-700">
          Tên sân
        </label>
        <input
          className="input-field"
          value={renameField?.name ?? ""}
          onChange={(e) =>
            renameField &&
            setRenameField({ ...renameField, name: e.target.value })
          }
          autoFocus
        />
      </EditModal>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[320px_1fr]">
        <SectionCard
          title="Hình ảnh sân"
          onEdit={() => setEditSection("images")}
        >
          <div className="grid grid-cols-2 gap-2">
            {venue.images.slice(0, 4).map((src, i) => (
              <div
                key={src + i}
                className="aspect-[4/3] overflow-hidden rounded-xl bg-slate-100"
              >
                <img src={src} alt="" className="h-full w-full object-cover" />
              </div>
            ))}
          </div>
        </SectionCard>

        <SectionCard
          title="Thông tin cơ bản"
          onEdit={() => setEditSection("basic")}
        >
          <h3 className="m-0 text-lg font-bold text-primary-dark">
            {venue.name}
          </h3>
          {venue.description && (
            <p className="mt-3 text-sm leading-relaxed text-slate-600">
              {venue.description}
            </p>
          )}
          <dl className="mt-4 grid gap-2 text-sm">
            <div>
              <dt className="font-medium text-primary-muted">Địa chỉ</dt>
              <dd className="text-slate-700">{fullAddress}</dd>
            </div>
            {venue.phoneNumber && (
              <div>
                <dt className="font-medium text-primary-muted">Điện thoại</dt>
                <dd className="text-slate-700">{venue.phoneNumber}</dd>
              </div>
            )}
            {venue.email && (
              <div>
                <dt className="font-medium text-primary-muted">Email</dt>
                <dd className="text-slate-700">{venue.email}</dd>
              </div>
            )}
            <div>
              <dt className="font-medium text-primary-muted">Giờ hoạt động</dt>
              <dd className="text-slate-700">
                {formatHours(venue.openTime, venue.closeTime)}
              </dd>
            </div>
          </dl>
        </SectionCard>
      </div>

      {pricingByType.map((pricing) => (
        <SectionCard
          key={pricing.fieldType}
          title={`Bảng giá — ${pricing.label}`}
          onEdit={() =>
            setEditSection({
              kind: "pricing",
              fieldType: pricing.fieldType,
              label: pricing.label,
            })
          }
        >
          <div className="overflow-x-auto">
            <table className="w-full min-w-[480px] border-collapse text-sm">
              <thead>
                <tr className="border-b border-gray-200 text-left text-slate-500">
                  <th className="pb-3 pr-4 font-semibold">Thứ</th>
                  <th className="pb-3 pr-4 font-semibold">Khung giờ</th>
                  <th className="pb-3 font-semibold text-right">Giá</th>
                </tr>
              </thead>
              <tbody>
                {pricing.rows.map((row, idx) => (
                  <tr key={idx} className="border-b border-gray-50">
                    <td className="py-3 pr-4 text-slate-700">{row.dayLabel}</td>
                    <td className="py-3 pr-4 text-slate-700">
                      {row.startTime} - {row.endTime}
                    </td>
                    <td className="py-3 text-right font-semibold text-primary-dark">
                      {formatPrice(row.price)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-4 flex flex-wrap gap-3">
            <div className="rounded-xl bg-primary-light px-4 py-2 text-sm">
              <span className="text-primary-muted">Giá thấp nhất: </span>
              <strong className="text-primary-dark">
                {formatPrice(pricing.minPrice)}
              </strong>
            </div>
            <div className="rounded-xl bg-primary-light px-4 py-2 text-sm">
              <span className="text-primary-muted">Giá cao nhất: </span>
              <strong className="text-primary-dark">
                {formatPrice(pricing.maxPrice)}
              </strong>
            </div>
          </div>
        </SectionCard>
      ))}

      <SectionCard title="Tiện ích" onEdit={() => setEditSection("amenities")}>
        <div className="flex flex-wrap gap-3">
          {venue.amenities.map((a) => (
            <div
              key={a.key}
              className="flex items-center gap-2 rounded-xl border border-gray-100 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700"
            >
              <span className="text-lg">{AMENITY_ICONS[a.key] ?? "✓"}</span>
              {a.label}
            </div>
          ))}
        </div>
      </SectionCard>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <SectionCard
          title="Cho thuê dụng cụ"
          onEdit={() => setEditSection("equipment")}
        >
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {venue.equipment.map((item) => (
              <div
                key={item.name}
                className="rounded-xl border border-gray-100 bg-slate-50 p-3 text-center"
              >
                <p className="m-0 text-sm font-medium text-slate-800">
                  {item.name}
                </p>
                <p className="m-0 mt-1 text-sm font-bold text-primary">
                  {formatPrice(item.price)}
                </p>
              </div>
            ))}
          </div>
        </SectionCard>

        <SectionCard
          title="Căn tin / Quán"
          onEdit={() => setEditSection("canteen")}
        >
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {venue.canteenItems.map((item) => (
              <div
                key={item.name}
                className="rounded-xl border border-gray-100 bg-slate-50 p-3 text-center"
              >
                <p className="m-0 text-sm font-medium text-slate-800">
                  {item.name}
                </p>
                <p className="m-0 mt-1 text-sm font-bold text-primary">
                  {formatPrice(item.price)}
                </p>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>

      <SectionCard
        title="Điều khoản / Chính sách"
        onEdit={() => setEditSection("policies")}
      >
        <div className="grid gap-4 md:grid-cols-3">
          <div>
            <h4 className="m-0 mb-2 text-sm font-bold text-primary">Đặt sân</h4>
            <p className="m-0 text-sm leading-relaxed text-slate-600">
              {venue.policies.booking}
            </p>
          </div>
          <div>
            <h4 className="m-0 mb-2 text-sm font-bold text-primary">
              Sử dụng sân
            </h4>
            <p className="m-0 text-sm leading-relaxed text-slate-600">
              {venue.policies.usage}
            </p>
          </div>
          <div>
            <h4 className="m-0 mb-2 text-sm font-bold text-primary">
              Bảo hiểm
            </h4>
            <p className="m-0 text-sm leading-relaxed text-slate-600">
              {venue.policies.insurance}
            </p>
          </div>
        </div>
      </SectionCard>

      <SectionCard
        title="Quản lý sân con"
        action={
          <button
            type="button"
            className="btn-primary px-4 py-2 text-sm"
            onClick={() => setShowAddField(true)}
          >
            + Thêm sân
          </button>
        }
      >
        {showAddField && (
          <form
            onSubmit={handleAddField}
            className="mb-5 flex flex-wrap items-end gap-3 rounded-xl border border-primary/20 bg-primary-light/50 p-4"
          >
            <div className="min-w-[140px] flex-1">
              <label className="mb-1 block text-xs font-semibold text-slate-600">
                Tên sân
              </label>
              <input
                className="input-field"
                value={newFieldName}
                onChange={(e) => setNewFieldName(e.target.value)}
                placeholder="VD: Sân 5A"
                required
              />
            </div>
            <div className="min-w-[140px]">
              <label className="mb-1 block text-xs font-semibold text-slate-600">
                Loại sân
              </label>
              <select
                className="input-field"
                value={newFieldType}
                onChange={(e) => setNewFieldType(e.target.value)}
              >
                <option value="FIELD_5VS5">Sân 5</option>
                <option value="FIELD_7VS7">Sân 7</option>
                <option value="FIELD_11VS11">Sân 11</option>
              </select>
            </div>
            <button type="submit" className="btn-primary">
              Lưu
            </button>
            <button
              type="button"
              className="btn-secondary"
              onClick={() => setShowAddField(false)}
            >
              Hủy
            </button>
          </form>
        )}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {fields.map((field) => (
            <div
              key={field.id}
              className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <h4 className="m-0 truncate font-bold text-primary-dark">
                    {field.name}
                  </h4>
                  <p className="mt-1 text-xs text-slate-500">
                    {field.fieldTypeLabel}
                  </p>
                </div>
                <button
                  type="button"
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-gray-200 text-slate-500 hover:border-primary hover:text-primary"
                  onClick={() =>
                    setRenameField({ id: field.id, name: field.name })
                  }
                  aria-label="Đổi tên sân"
                >
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                  </svg>
                </button>
              </div>
              <div className="mt-4 flex flex-col gap-2">
                {(
                  [
                    ["ACTIVE", "Hoạt động", "bg-primary text-white"],
                    ["MAINTENANCE", "Bảo trì", "bg-amber-400 text-amber-950"],
                    ["INACTIVE", "Tắt", "bg-red-500 text-white"],
                  ] as const
                ).map(([status, label, activeClass]) => (
                  <button
                    key={status}
                    type="button"
                    className={cn(
                      "rounded-lg px-3 py-2 text-xs font-semibold transition-all",
                      field.operationalStatus === status
                        ? activeClass
                        : "bg-slate-50 text-slate-500 hover:bg-slate-100",
                    )}
                    onClick={() => handleStatusChange(field.id, status)}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </SectionCard>
    </PageShell>
  );
}
