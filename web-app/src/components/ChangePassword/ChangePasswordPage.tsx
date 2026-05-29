import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AxiosClient from '../../api/AxiosClient';
import toast from 'react-hot-toast';
import { getStoredUser, setStoredUser } from '../../types/auth';
import './ChangePassword.css';

const ChangePasswordPage: React.FC = () => {
  const navigate = useNavigate();
  const user = getStoredUser();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword.length < 6) {
      toast.error('Mật khẩu mới phải có ít nhất 6 ký tự');
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error('Mật khẩu xác nhận không khớp');
      return;
    }

    setIsLoading(true);
    try {
      await AxiosClient.post('/auth/change-password', {
        currentPassword,
        newPassword,
      });

      if (user) {
        setStoredUser({ ...user, mustChangePassword: false });
      }

      toast.success('Đổi mật khẩu thành công!');
      navigate('/app');
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || 'Đổi mật khẩu thất bại');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="change-password-page">
      <div className="change-password-card">
        <h2>Đổi mật khẩu</h2>
        <p className="change-password-hint">
          Đây là lần đăng nhập đầu tiên. Vui lòng đặt mật khẩu mới để tiếp tục.
        </p>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="current">Mật khẩu hiện tại</label>
            <input
              id="current"
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="new">Mật khẩu mới</label>
            <input
              id="new"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              minLength={6}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="confirm">Xác nhận mật khẩu mới</label>
            <input
              id="confirm"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              minLength={6}
              required
            />
          </div>
          <button type="submit" className="submit-btn" disabled={isLoading}>
            {isLoading ? 'Đang lưu...' : 'Lưu mật khẩu'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChangePasswordPage;
