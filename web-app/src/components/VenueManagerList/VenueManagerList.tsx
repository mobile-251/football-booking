import React, { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import venueManagerApi from '../../api/venueManagerApi';
import type { VenueManagerRecord } from '../../api/venueManagerApi';
import { useCurrentVenue } from '../../hooks/useCurrentVenue';
import { isOwner } from '../../types/auth';
import './VenueManagerList.css';

const VenueManagerList: React.FC = () => {
  const { currentVenueId, currentVenue, user } = useCurrentVenue();
  const [managers, setManagers] = useState<VenueManagerRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
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
      const list = Array.isArray(res) ? res : (res as { data?: VenueManagerRecord[] }).data ?? [];
      setManagers(list as VenueManagerRecord[]);
    } catch {
      toast.error('Không thể tải danh sách nhân viên');
    } finally {
      setLoading(false);
    }
  }, [currentVenueId]);

  useEffect(() => {
    loadManagers();
  }, [loadManagers]);

  if (!user || !isOwner(user)) {
    return (
      <div className="venue-manager-page">
        <p>Bạn không có quyền quản lý nhân viên.</p>
      </div>
    );
  }

  if (!currentVenueId) {
    return (
      <div className="venue-manager-page">
        <p className="venue-manager-empty">Vui lòng chọn sân ở menu bên trái trước.</p>
      </div>
    );
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !fullName.trim()) {
      toast.error('Vui lòng nhập đầy đủ email và họ tên');
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
      setEmail('');
      setFullName('');
      toast.success('Đã tạo tài khoản quản lý');
      loadManagers();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      toast.error(error.response?.data?.message || 'Tạo tài khoản thất bại');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeactivate = async (managerId: number) => {
    if (!window.confirm('Vô hiệu hóa nhân viên này?')) return;
    try {
      await venueManagerApi.deactivate(currentVenueId, managerId);
      toast.success('Đã vô hiệu hóa');
      loadManagers();
    } catch {
      toast.error('Thao tác thất bại');
    }
  };

  const handleResetPassword = async (managerId: number) => {
    if (!window.confirm('Đặt lại mật khẩu cho nhân viên này?')) return;
    try {
      const res: unknown = await venueManagerApi.resetPassword(
        currentVenueId,
        managerId,
      );
      const creds = res as { email: string; temporaryPassword: string };
      setCredentialsModal(creds);
      toast.success('Đã đặt lại mật khẩu');
    } catch {
      toast.error('Đặt lại mật khẩu thất bại');
    }
  };

  const copyCredentials = () => {
    if (!credentialsModal) return;
    const text = `Email: ${credentialsModal.email}\nMật khẩu tạm: ${credentialsModal.temporaryPassword}`;
    navigator.clipboard.writeText(text);
    toast.success('Đã sao chép');
  };

  return (
    <div className="venue-manager-page">
      <h2>Quản lý nhân viên</h2>
      <p className="venue-manager-subtitle">
        Sân: <strong>{currentVenue?.name}</strong>
      </p>

      <form className="venue-manager-form" onSubmit={handleCreate}>
        <h3>Thêm quản lý sân</h3>
        <div className="form-row">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            type="text"
            placeholder="Họ và tên"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
          />
          <button type="submit" disabled={submitting}>
            {submitting ? 'Đang tạo...' : 'Tạo tài khoản'}
          </button>
        </div>
      </form>

      <div className="venue-manager-table-wrap">
        <h3>Danh sách nhân viên</h3>
        {loading ? (
          <p>Đang tải...</p>
        ) : managers.length === 0 ? (
          <p className="venue-manager-empty">Chưa có nhân viên nào.</p>
        ) : (
          <table className="venue-manager-table">
            <thead>
              <tr>
                <th>Họ tên</th>
                <th>Email</th>
                <th>Trạng thái</th>
                <th>Ngày tạo</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {managers.map((m) => (
                <tr key={m.id}>
                  <td>{m.user.fullName}</td>
                  <td>{m.user.email}</td>
                  <td>
                    <span
                      className={
                        m.isActive && m.user.isActive
                          ? 'status-active'
                          : 'status-inactive'
                      }
                    >
                      {m.isActive && m.user.isActive ? 'Hoạt động' : 'Ngưng'}
                    </span>
                  </td>
                  <td>
                    {new Date(m.createdAt).toLocaleDateString('vi-VN')}
                  </td>
                  <td className="actions-cell">
                    <button
                      type="button"
                      className="btn-link"
                      onClick={() => handleResetPassword(m.id)}
                    >
                      Đặt lại MK
                    </button>
                    {m.isActive && (
                      <button
                        type="button"
                        className="btn-link danger"
                        onClick={() => handleDeactivate(m.id)}
                      >
                        Vô hiệu hóa
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {credentialsModal && (
        <div className="credentials-overlay" onClick={() => setCredentialsModal(null)}>
          <div
            className="credentials-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <h3>Thông tin đăng nhập</h3>
            <p>Gửi thông tin sau cho nhân viên qua kênh riêng:</p>
            <div className="credentials-box">
              <p>
                <strong>Email:</strong> {credentialsModal.email}
              </p>
              <p>
                <strong>Mật khẩu tạm:</strong>{' '}
                <code>{credentialsModal.temporaryPassword}</code>
              </p>
            </div>
            <div className="credentials-actions">
              <button type="button" onClick={copyCredentials}>
                Sao chép
              </button>
              <button
                type="button"
                className="primary"
                onClick={() => setCredentialsModal(null)}
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VenueManagerList;
