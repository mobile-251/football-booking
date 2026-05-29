import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AxiosClient from '../../api/AxiosClient';
import toast from 'react-hot-toast';
import { getStoredUser, setStoredUser } from '../../types/auth';
import { cn } from '../../lib/cn';

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
    <div className="flex min-h-screen w-full flex-col-reverse bg-slate-50 md:flex-row">
      <div className="flex flex-1 items-center justify-center bg-white p-10">
        <div className="w-full max-w-[440px]">
          <div className="mb-6">
            <h2 className="mb-2 text-[2rem] font-extrabold text-primary">Đổi mật khẩu</h2>
            <p className="text-slate-500">Hoàn tất thiết lập tài khoản để tiếp tục</p>
          </div>

          <div className="mb-6 rounded-[10px] border border-primary/20 bg-primary-light p-4 text-sm leading-relaxed text-primary-dark">
            Đây là lần đăng nhập đầu tiên. Vui lòng đặt mật khẩu mới để bảo mật tài khoản.
          </div>

          <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="current" className="mb-1.5 block text-sm font-semibold text-slate-700">
                Mật khẩu hiện tại (tạm)
              </label>
              <input
                id="current"
                type="password"
                className="input-field"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
              />
            </div>
            <div>
              <label htmlFor="new" className="mb-1.5 block text-sm font-semibold text-slate-700">
                Mật khẩu mới
              </label>
              <input
                id="new"
                type="password"
                className="input-field"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                minLength={6}
                required
              />
            </div>
            <div>
              <label htmlFor="confirm" className="mb-1.5 block text-sm font-semibold text-slate-700">
                Xác nhận mật khẩu mới
              </label>
              <input
                id="confirm"
                type="password"
                className="input-field"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                minLength={6}
                required
              />
            </div>
            <button
              type="submit"
              className={cn(
                'btn-primary w-full',
                isLoading && 'opacity-80',
              )}
              disabled={isLoading}
            >
              {isLoading ? 'Đang lưu...' : 'Lưu mật khẩu'}
            </button>
          </form>
        </div>
      </div>

      <div className="flex flex-1 items-center justify-center bg-gradient-to-br from-[#EAFBEA] to-[#F0FDF0] p-16">
        <div className="max-w-[600px] text-center">
          <div className="relative mb-8 flex h-[140px] items-end justify-center">
            <div className="h-[60px] w-[60px] rounded-full bg-[url('/football.png')] bg-cover bg-center shadow-[inset_-4px_-4px_12px_rgba(0,0,0,0.35)] animate-[bounce-ball_1s_ease-in-out_alternate_infinite]" />
            <div className="absolute bottom-0 h-3 w-20 rounded-[50%] bg-[radial-gradient(ellipse_at_center,rgba(0,0,0,0.4)_0%,transparent_75%)] blur-[1.5px] animate-[squash_1s_ease-in-out_infinite]" />
          </div>
          <h1 className="mb-4 text-3xl font-black text-[#043f3a]">
            Bảo mật tài khoản, quản lý sân <span className="text-primary">an toàn</span>
          </h1>
          <p className="text-lg text-slate-600">
            Mật khẩu mới sẽ được dùng cho các lần đăng nhập tiếp theo
          </p>
        </div>
      </div>
    </div>
  );
};

export default ChangePasswordPage;
