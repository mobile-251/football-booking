import React, { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import PageShell from "../../components/layout/PageShell";
import venueManagerApi from "../../api/venueManagerApi";
import type { VenueManagerRecord } from "../../api/venueManagerApi";
import { useCurrentVenue } from "../../hooks/useCurrentVenue";
import { isOwner } from "../../types/auth";
import { cn } from "../../lib/cn";

const VenueManagerList: React.FC = () => {
  const { currentVenueId, currentVenue, user } = useCurrentVenue();
  const [managers, setManagers] = useState<VenueManagerRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [credentialsModal, setCredentialsModal] = useState<{
    email: string;
    temporaryPassword: string;
  } | null>(null);

  const loadManagers = useCallback(async () => {
    if (!currentVenueId) return;
    setLoading(true);
    try {
      const res = await venueManagerApi.list(currentVenueId);
      const list = Array.isArray(res)
        ? res
        : ((res as { data?: VenueManagerRecord[] }).data ?? []);
      setManagers(list as VenueManagerRecord[]);
    } catch {
      toast.error("Không thể tải danh sách nhân viên");
    } finally {
      setLoading(false);
    }
  }, [currentVenueId]);

  useEffect(() => {
    loadManagers();
  }, [loadManagers]);

  if (!user || !isOwner(user)) {
    return (
      <PageShell title="Quản lý nhân viên">
        <p className="text-sm text-slate-500">
          Bạn không có quyền quản lý nhân viên.
        </p>
      </PageShell>
    );
  }

  if (!currentVenueId) {
    return (
      <PageShell title="Quản lý nhân viên">
        <p className="text-sm text-slate-500">
          Vui lòng chọn sân ở menu bên trái trước.
        </p>
      </PageShell>
    );
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !fullName.trim()) {
      toast.error("Vui lòng nhập đầy đủ email và họ tên");
      return;
    }
    setSubmitting(true);
    try {
      const res: unknown = await venueManagerApi.create(currentVenueId, {
        email: email.trim(),
        fullName: fullName.trim(),
      });
      const data = res as {
        credentials: { email: string; temporaryPassword: string };
      };
      setCredentialsModal(data.credentials);
      setEmail("");
      setFullName("");
      toast.success("Đã tạo tài khoản quản lý");
      loadManagers();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      toast.error(error.response?.data?.message || "Tạo tài khoản thất bại");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeactivate = async (managerId: number) => {
    if (!window.confirm("Vô hiệu hóa nhân viên này?")) return;
    try {
      await venueManagerApi.deactivate(currentVenueId, managerId);
      toast.success("Đã vô hiệu hóa");
      loadManagers();
    } catch {
      toast.error("Thao tác thất bại");
    }
  };

  const handleResetPassword = async (managerId: number) => {
    if (!window.confirm("Đặt lại mật khẩu cho nhân viên này?")) return;
    try {
      const res: unknown = await venueManagerApi.resetPassword(
        currentVenueId,
        managerId,
      );
      const creds = res as { email: string; temporaryPassword: string };
      setCredentialsModal(creds);
      toast.success("Đã đặt lại mật khẩu");
    } catch {
      toast.error("Đặt lại mật khẩu thất bại");
    }
  };

  const copyCredentials = () => {
    if (!credentialsModal) return;
    const text = `Email: ${credentialsModal.email}\nMật khẩu tạm: ${credentialsModal.temporaryPassword}`;
    navigator.clipboard.writeText(text);
    toast.success("Đã sao chép");
  };

  return (
    <PageShell
      title="Quản lý nhân viên"
      subtitle={currentVenue?.name}
      maxWidth="wide"
    >
      <div className="card-surface grid gap-6 p-6 lg:grid-cols-[1fr_280px]">
        <form onSubmit={handleCreate}>
          <h3 className="mb-4 text-sm font-semibold text-primary">
            Thêm quản lý sân
          </h3>
          <div className="flex flex-col gap-4">
            <div>
              <label
                htmlFor="mgr-email"
                className="mb-1.5 block text-[13px] font-semibold text-slate-700"
              >
                Email
              </label>
              <input
                id="mgr-email"
                type="email"
                className="input-field"
                placeholder="email@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div>
              <label
                htmlFor="mgr-name"
                className="mb-1.5 block text-[13px] font-semibold text-slate-700"
              >
                Họ và tên
              </label>
              <input
                id="mgr-name"
                type="text"
                className="input-field"
                placeholder="Nguyễn Văn A"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />
            </div>
            <button
              type="submit"
              className="btn-primary w-fit"
              disabled={submitting}
            >
              {submitting ? "Đang tạo..." : "Tạo tài khoản"}
            </button>
          </div>
        </form>
        <aside className="rounded-[10px] border-l-4 border-primary bg-primary-light p-4">
          <h4 className="mb-2 text-[13px] font-semibold text-primary-dark">
            Lưu ý
          </h4>
          <p className="mb-2 text-[13px] leading-relaxed text-primary">
            Mật khẩu tạm chỉ hiển thị <strong>một lần</strong> sau khi tạo hoặc
            đặt lại. Hãy sao chép và gửi cho nhân viên qua kênh riêng.
          </p>
          <p className="text-[13px] text-primary">
            Nhân viên sẽ đổi mật khẩu khi đăng nhập lần đầu.
          </p>
        </aside>
      </div>

      <div className="card-surface p-6">
        <h3 className="mb-4 text-sm font-semibold text-primary">
          Danh sách nhân viên
        </h3>
        {loading ? (
          <p className="text-sm text-slate-500">Đang tải...</p>
        ) : managers.length === 0 ? (
          <p className="text-sm text-slate-500">Chưa có nhân viên nào.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead className="bg-[#f0fdf4]">
                <tr>
                  {[
                    "Họ tên",
                    "Email",
                    "Trạng thái",
                    "Ngày tạo",
                    "Thao tác",
                  ].map((h) => (
                    <th
                      key={h}
                      className="border-b border-gray-200 px-3.5 py-3 text-left text-[13px] font-semibold text-primary-dark"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {managers.map((m) => (
                  <tr
                    key={m.id}
                    className="even:bg-gray-50 hover:bg-primary-light"
                  >
                    <td className="border-b border-gray-100 px-3.5 py-3.5">
                      {m.user.fullName}
                    </td>
                    <td className="border-b border-gray-100 px-3.5 py-3.5">
                      {m.user.email}
                    </td>
                    <td className="border-b border-gray-100 px-3.5 py-3.5">
                      <span
                        className={cn(
                          "inline-block rounded-full px-2.5 py-1 text-xs font-semibold",
                          m.isActive && m.user.isActive
                            ? "bg-green-100 text-primary-dark"
                            : "bg-gray-100 text-slate-500",
                        )}
                      >
                        {m.isActive && m.user.isActive ? "Hoạt động" : "Ngưng"}
                      </span>
                    </td>
                    <td className="border-b border-gray-100 px-3.5 py-3.5">
                      {new Date(m.createdAt).toLocaleDateString("vi-VN")}
                    </td>
                    <td className="border-b border-gray-100 px-3.5 py-3.5">
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          className="rounded-lg border border-primary px-3 py-1.5 text-xs font-semibold text-primary hover:bg-primary-light"
                          onClick={() => handleResetPassword(m.id)}
                        >
                          Đặt lại MK
                        </button>
                        {m.isActive && (
                          <button
                            type="button"
                            className="rounded-lg border border-danger px-3 py-1.5 text-xs font-semibold text-danger hover:bg-red-50"
                            onClick={() => handleDeactivate(m.id)}
                          >
                            Vô hiệu hóa
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {credentialsModal && (
        <div
          className="fixed inset-0 z-[1100] flex items-center justify-center bg-black/45 backdrop-blur-[2px]"
          onClick={() => setCredentialsModal(null)}
          role="presentation"
        >
          <div
            className="w-[90%] max-w-md animate-[slide-up_0.3s_ease] rounded-2xl bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-labelledby="credentials-title"
          >
            <div className="flex items-center justify-between border-b border-gray-200 px-6 py-5">
              <h3
                id="credentials-title"
                className="text-lg font-bold text-primary-dark"
              >
                Thông tin đăng nhập
              </h3>
              <button
                type="button"
                className="text-3xl leading-none text-slate-500 hover:text-slate-700"
                onClick={() => setCredentialsModal(null)}
                aria-label="Đóng"
              >
                ×
              </button>
            </div>
            <div className="px-6 py-6">
              <p className="mb-4 text-sm text-slate-500">
                Gửi thông tin sau cho nhân viên qua kênh riêng:
              </p>
              <div className="rounded-[10px] border border-gray-200 bg-slate-50 p-4">
                <div className="mb-3 flex flex-col gap-1">
                  <span className="text-[11px] font-semibold uppercase text-primary-muted">
                    Email
                  </span>
                  <span>{credentialsModal.email}</span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-[11px] font-semibold uppercase text-primary-muted">
                    Mật khẩu tạm
                  </span>
                  <code className="font-mono text-lg font-bold tracking-wide text-amber-700">
                    {credentialsModal.temporaryPassword}
                  </code>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3 border-t border-gray-200 px-6 py-4">
              <button
                type="button"
                className="btn-secondary"
                onClick={copyCredentials}
              >
                Sao chép
              </button>
              <button
                type="button"
                className="btn-primary"
                onClick={() => setCredentialsModal(null)}
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </PageShell>
  );
};

export default VenueManagerList;
