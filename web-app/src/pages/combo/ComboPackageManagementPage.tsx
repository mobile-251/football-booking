import React, { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import PageShell from "../../components/layout/PageShell";
import comboApi, { type ComboPackageRecord } from "../../api/comboApi";
import { useCurrentVenue } from "../../hooks/useCurrentVenue";

const FIELD_TYPES = ["FIELD_5VS5", "FIELD_7VS7", "FIELD_11VS11"];

export default function ComboPackageManagementPage() {
  const { currentVenueId } = useCurrentVenue();
  const [packages, setPackages] = useState<ComboPackageRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    fieldType: "FIELD_5VS5",
    name: "",
    matchCount: 10,
    priceCoin: 3100,
    validityDays: 60,
  });

  const load = useCallback(async () => {
    if (!currentVenueId) return;
    setLoading(true);
    try {
      const res = await comboApi.list(currentVenueId);
      setPackages(Array.isArray(res.data) ? res.data : []);
    } catch {
      toast.error("Không tải được gói combo");
    } finally {
      setLoading(false);
    }
  }, [currentVenueId]);

  useEffect(() => {
    load();
  }, [load]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentVenueId) return;
    try {
      await comboApi.create(currentVenueId, form);
      toast.success("Đã tạo gói combo");
      setForm({ ...form, name: "" });
      load();
    } catch {
      toast.error("Tạo gói thất bại");
    }
  };

  if (!currentVenueId) {
    return (
      <PageShell title="Gói combo">
        <p className="text-sm text-slate-500">Chọn sân trước.</p>
      </PageShell>
    );
  }

  return (
    <PageShell title="Gói combo membership">
      <form
        onSubmit={handleCreate}
        className="mb-6 grid gap-3 rounded-xl bg-white p-4 shadow-sm md:grid-cols-3"
      >
        <select
          className="rounded border px-3 py-2"
          value={form.fieldType}
          onChange={(e) =>
            setForm((f) => ({ ...f, fieldType: e.target.value }))
          }
        >
          {FIELD_TYPES.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
        <input
          className="rounded border px-3 py-2"
          placeholder="Tên gói"
          value={form.name}
          onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          required
        />
        <input
          type="number"
          className="rounded border px-3 py-2"
          placeholder="Số lượt"
          value={form.matchCount}
          onChange={(e) =>
            setForm((f) => ({ ...f, matchCount: Number(e.target.value) }))
          }
        />
        <input
          type="number"
          className="rounded border px-3 py-2"
          placeholder="Giá coin"
          value={form.priceCoin}
          onChange={(e) =>
            setForm((f) => ({ ...f, priceCoin: Number(e.target.value) }))
          }
        />
        <input
          type="number"
          className="rounded border px-3 py-2"
          placeholder="Hạn (ngày)"
          value={form.validityDays}
          onChange={(e) =>
            setForm((f) => ({ ...f, validityDays: Number(e.target.value) }))
          }
        />
        <button
          type="submit"
          className="rounded-lg bg-emerald-600 px-4 py-2 font-medium text-white"
        >
          Thêm gói
        </button>
      </form>

      {loading ? (
        <p>Đang tải...</p>
      ) : (
        <ul className="space-y-2">
          {packages.map((p) => (
            <li
              key={p.id}
              className="flex items-center justify-between rounded-lg bg-white p-4 shadow-sm"
            >
              <div>
                <p className="font-semibold">{p.name}</p>
                <p className="text-sm text-slate-500">
                  {p.fieldType} · {p.matchCount} lượt · {p.priceCoin} coin ·{" "}
                  {p.validityDays} ngày
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </PageShell>
  );
}
