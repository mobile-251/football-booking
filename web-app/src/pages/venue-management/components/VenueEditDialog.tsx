import { useEffect, useState } from "react";
import EditModal from "./EditModal";
import type {
  PricedItem,
  PricingRow,
  VenueManagementData,
  UpdateVenueManagementPayload,
} from "../../../api/venueManagementApi";

export type EditSection =
  | "basic"
  | "images"
  | "amenities"
  | "equipment"
  | "canteen"
  | "policies"
  | { kind: "pricing"; fieldType: string; label: string };

const AMENITY_OPTIONS = [
  { key: "wifi", label: "Wifi miễn phí" },
  { key: "parking", label: "Bãi đỗ xe" },
  { key: "changing_room", label: "Phòng thay đồ / Vệ sinh" },
  { key: "lockers", label: "Tủ đồ" },
  { key: "canteen", label: "Căn tin" },
];

interface VenueEditDialogProps {
  section: EditSection | null;
  data: VenueManagementData;
  onClose: () => void;
  onSave: (payload: UpdateVenueManagementPayload) => Promise<void>;
  submitting: boolean;
}

function emptyPricedItem(): PricedItem {
  return { name: "", price: 0 };
}

export default function VenueEditDialog({
  section,
  data,
  onClose,
  onSave,
  submitting,
}: VenueEditDialogProps) {
  const { venue } = data;
  const open = section !== null;

  const [name, setName] = useState(venue.name);
  const [description, setDescription] = useState(venue.description ?? "");
  const [address, setAddress] = useState(venue.address);
  const [district, setDistrict] = useState(venue.district ?? "");
  const [city, setCity] = useState(venue.city);
  const [phoneNumber, setPhoneNumber] = useState(venue.phoneNumber ?? "");
  const [email, setEmail] = useState(venue.email ?? "");
  const [openTime, setOpenTime] = useState(venue.openTime);
  const [closeTime, setCloseTime] = useState(venue.closeTime);
  const [images, setImages] = useState<string[]>(venue.images);
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>(
    venue.amenities.map((a) => a.key),
  );
  const [equipment, setEquipment] = useState<PricedItem[]>(venue.equipment);
  const [canteenItems, setCanteenItems] = useState<PricedItem[]>(
    venue.canteenItems,
  );
  const [policies, setPolicies] = useState(venue.policies);
  const [pricingRows, setPricingRows] = useState<PricingRow[]>([]);

  useEffect(() => {
    if (!open) return;
    setName(venue.name);
    setDescription(venue.description ?? "");
    setAddress(venue.address);
    setDistrict(venue.district ?? "");
    setCity(venue.city);
    setPhoneNumber(venue.phoneNumber ?? "");
    setEmail(venue.email ?? "");
    setOpenTime(venue.openTime);
    setCloseTime(venue.closeTime);
    setImages([...venue.images]);
    setSelectedAmenities(venue.amenities.map((a) => a.key));
    setEquipment(venue.equipment.map((i) => ({ ...i })));
    setCanteenItems(venue.canteenItems.map((i) => ({ ...i })));
    setPolicies({ ...venue.policies });

    if (section && typeof section === "object" && section.kind === "pricing") {
      const group = data.pricingByType.find(
        (p) => p.fieldType === section.fieldType,
      );
      setPricingRows(group ? group.rows.map((r) => ({ ...r })) : []);
    }
  }, [open, section, venue, data.pricingByType]);

  const handleSubmit = async () => {
    if (!section) return;

    if (section === "basic") {
      await onSave({
        name,
        description,
        address,
        district: district || undefined,
        city,
        phoneNumber: phoneNumber || undefined,
        email: email || undefined,
        openTime,
        closeTime,
      });
    } else if (section === "images") {
      await onSave({ images: images.filter((u) => u.trim()) });
    } else if (section === "amenities") {
      await onSave({ amenities: selectedAmenities });
    } else if (section === "equipment") {
      await onSave({
        equipment: equipment
          .filter((i) => i.name.trim())
          .map((i) => ({ name: i.name.trim(), price: Number(i.price) || 0 })),
      });
    } else if (section === "canteen") {
      await onSave({
        canteenItems: canteenItems
          .filter((i) => i.name.trim())
          .map((i) => ({ name: i.name.trim(), price: Number(i.price) || 0 })),
      });
    } else if (section === "policies") {
      await onSave({ policies });
    } else if (section.kind === "pricing") {
      await onSave({
        pricing: [
          {
            fieldType: section.fieldType,
            rows: pricingRows.map((r) => ({
              dayType: r.dayType as "WEEKDAY" | "WEEKEND",
              startTime: r.startTime,
              endTime: r.endTime,
              price: Number(r.price),
            })),
          },
        ],
      });
    }
  };

  const title =
    section === "basic"
      ? "Chỉnh sửa thông tin cơ bản"
      : section === "images"
        ? "Chỉnh sửa hình ảnh"
        : section === "amenities"
          ? "Chỉnh sửa tiện ích"
          : section === "equipment"
            ? "Chỉnh sửa cho thuê dụng cụ"
            : section === "canteen"
              ? "Chỉnh sửa căn tin / quán"
              : section === "policies"
                ? "Chỉnh sửa điều khoản"
                : section && typeof section === "object"
                  ? `Chỉnh sửa bảng giá — ${section.label}`
                  : "";

  const isWide = Boolean(
    section === "policies" ||
    (section && typeof section === "object" && section.kind === "pricing"),
  );

  return (
    <EditModal
      title={title}
      open={open}
      onClose={onClose}
      onSubmit={handleSubmit}
      submitting={submitting}
      wide={isWide}
    >
      {section === "basic" && (
        <div className="flex flex-col gap-4">
          <Field label="Tên sân">
            <input
              className="input-field"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </Field>
          <Field label="Mô tả">
            <textarea
              className="input-field min-h-[100px] resize-y"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </Field>
          <Field label="Địa chỉ">
            <input
              className="input-field"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              required
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Quận / Huyện">
              <input
                className="input-field"
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
              />
            </Field>
            <Field label="Thành phố">
              <input
                className="input-field"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                required
              />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Điện thoại">
              <input
                className="input-field"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
              />
            </Field>
            <Field label="Email">
              <input
                type="email"
                className="input-field"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Giờ mở cửa (HH:mm)">
              <input
                className="input-field"
                placeholder="06:00"
                value={openTime}
                onChange={(e) => setOpenTime(e.target.value)}
              />
            </Field>
            <Field label="Giờ đóng cửa (HH:mm)">
              <input
                className="input-field"
                placeholder="23:00"
                value={closeTime}
                onChange={(e) => setCloseTime(e.target.value)}
              />
            </Field>
          </div>
        </div>
      )}

      {section === "images" && (
        <div className="flex flex-col gap-3">
          <p className="m-0 text-sm text-slate-500">
            Nhập URL ảnh (tối đa 4 ảnh hiển thị trên trang quản lý).
          </p>
          {images.map((url, idx) => (
            <div key={idx} className="flex gap-2">
              <input
                className="input-field flex-1"
                value={url}
                placeholder="https://..."
                onChange={(e) => {
                  const next = [...images];
                  next[idx] = e.target.value;
                  setImages(next);
                }}
              />
              <button
                type="button"
                className="btn-secondary shrink-0 px-3"
                onClick={() => setImages(images.filter((_, i) => i !== idx))}
              >
                Xóa
              </button>
            </div>
          ))}
          {images.length < 8 && (
            <button
              type="button"
              className="btn-secondary w-full"
              onClick={() => setImages([...images, ""])}
            >
              + Thêm URL ảnh
            </button>
          )}
        </div>
      )}

      {section === "amenities" && (
        <div className="flex flex-col gap-2">
          {AMENITY_OPTIONS.map((opt) => (
            <label
              key={opt.key}
              className="flex cursor-pointer items-center gap-3 rounded-xl border border-gray-100 px-4 py-3 hover:bg-slate-50"
            >
              <input
                type="checkbox"
                className="h-4 w-4 accent-primary"
                checked={selectedAmenities.includes(opt.key)}
                onChange={(e) => {
                  if (e.target.checked) {
                    setSelectedAmenities([...selectedAmenities, opt.key]);
                  } else {
                    setSelectedAmenities(
                      selectedAmenities.filter((k) => k !== opt.key),
                    );
                  }
                }}
              />
              <span className="text-sm font-medium text-slate-700">
                {opt.label}
              </span>
            </label>
          ))}
        </div>
      )}

      {section === "equipment" && (
        <PricedItemsEditor items={equipment} onChange={setEquipment} />
      )}

      {section === "canteen" && (
        <PricedItemsEditor items={canteenItems} onChange={setCanteenItems} />
      )}

      {section === "policies" && (
        <div className="flex flex-col gap-4">
          <Field label="Chính sách đặt sân">
            <textarea
              className="input-field min-h-[80px] resize-y"
              value={policies.booking}
              onChange={(e) =>
                setPolicies({ ...policies, booking: e.target.value })
              }
            />
          </Field>
          <Field label="Sử dụng sân">
            <textarea
              className="input-field min-h-[80px] resize-y"
              value={policies.usage}
              onChange={(e) =>
                setPolicies({ ...policies, usage: e.target.value })
              }
            />
          </Field>
          <Field label="Bảo hiểm">
            <textarea
              className="input-field min-h-[80px] resize-y"
              value={policies.insurance}
              onChange={(e) =>
                setPolicies({ ...policies, insurance: e.target.value })
              }
            />
          </Field>
        </div>
      )}

      {section && typeof section === "object" && section.kind === "pricing" && (
        <PricingRowsEditor rows={pricingRows} onChange={setPricingRows} />
      )}
    </EditModal>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-semibold text-slate-700">
        {label}
      </label>
      {children}
    </div>
  );
}

function PricedItemsEditor({
  items,
  onChange,
}: {
  items: PricedItem[];
  onChange: (items: PricedItem[]) => void;
}) {
  return (
    <div className="flex flex-col gap-3">
      {items.map((item, idx) => (
        <div key={idx} className="flex gap-2">
          <input
            className="input-field flex-1"
            placeholder="Tên món / dụng cụ"
            value={item.name}
            onChange={(e) => {
              const next = [...items];
              next[idx] = { ...next[idx], name: e.target.value };
              onChange(next);
            }}
          />
          <input
            type="number"
            className="input-field w-32"
            placeholder="Giá"
            min={0}
            step={1000}
            value={item.price || ""}
            onChange={(e) => {
              const next = [...items];
              next[idx] = { ...next[idx], price: Number(e.target.value) || 0 };
              onChange(next);
            }}
          />
          <button
            type="button"
            className="btn-secondary shrink-0 px-3"
            onClick={() => onChange(items.filter((_, i) => i !== idx))}
          >
            Xóa
          </button>
        </div>
      ))}
      <button
        type="button"
        className="btn-secondary w-full"
        onClick={() => onChange([...items, emptyPricedItem()])}
      >
        + Thêm mục
      </button>
    </div>
  );
}

function PricingRowsEditor({
  rows,
  onChange,
}: {
  rows: PricingRow[];
  onChange: (rows: PricingRow[]) => void;
}) {
  return (
    <div className="flex flex-col gap-3">
      {rows.map((row, idx) => (
        <div
          key={idx}
          className="grid grid-cols-1 gap-2 rounded-xl border border-gray-100 p-3 sm:grid-cols-[1fr_1fr_1fr_100px_auto]"
        >
          <select
            className="input-field"
            value={row.dayType}
            onChange={(e) => {
              const next = [...rows];
              const dayType = e.target.value as "WEEKDAY" | "WEEKEND";
              next[idx] = {
                ...next[idx],
                dayType,
                dayLabel: dayType === "WEEKEND" ? "T7 - CN" : "T2 - T6",
              };
              onChange(next);
            }}
          >
            <option value="WEEKDAY">T2 - T6</option>
            <option value="WEEKEND">T7 - CN</option>
          </select>
          <input
            type="time"
            className="input-field"
            value={row.startTime}
            onChange={(e) => {
              const next = [...rows];
              next[idx] = { ...next[idx], startTime: e.target.value };
              onChange(next);
            }}
          />
          <input
            type="time"
            className="input-field"
            value={row.endTime}
            onChange={(e) => {
              const next = [...rows];
              next[idx] = { ...next[idx], endTime: e.target.value };
              onChange(next);
            }}
          />
          <input
            type="number"
            className="input-field"
            min={0}
            step={1000}
            value={row.price}
            onChange={(e) => {
              const next = [...rows];
              next[idx] = { ...next[idx], price: Number(e.target.value) || 0 };
              onChange(next);
            }}
          />
          <button
            type="button"
            className="btn-secondary px-3"
            onClick={() => onChange(rows.filter((_, i) => i !== idx))}
          >
            Xóa
          </button>
        </div>
      ))}
      <button
        type="button"
        className="btn-secondary w-full"
        onClick={() =>
          onChange([
            ...rows,
            {
              dayType: "WEEKDAY",
              dayLabel: "T2 - T6",
              startTime: "06:00",
              endTime: "17:00",
              price: 250000,
            },
          ])
        }
      >
        + Thêm khung giá
      </button>
      <p className="m-0 text-xs text-slate-500">
        Thay đổi sẽ áp dụng cho tất cả sân con cùng loại.
      </p>
    </div>
  );
}
