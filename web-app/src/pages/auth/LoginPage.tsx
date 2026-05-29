import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AxiosClient from '../../api/AxiosClient';
import toast from 'react-hot-toast';
import { isPortalUser, normalizeLoginUser, setStoredUser } from '../../types/auth';
import { cn } from '../../lib/cn';

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (localStorage.getItem('logout_success')) {
      toast.success('Đăng xuất thành công!');
      localStorage.removeItem('logout_success');
    }
  }, []);

  const validateForm = () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.error('Email không hợp lệ!');
      return false;
    }
    if (password.length < 6) {
      toast.error('Mật khẩu phải có ít nhất 6 ký tự!');
      return false;
    }
    return true;
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      const response: { access_token?: string; refresh_token?: string; user?: Record<string, unknown> } =
        await AxiosClient.post('/auth/login', { email, password });

      const user = normalizeLoginUser(response.user ?? {});

      if (!isPortalUser(user)) {
        toast.error('Tài khoản của bạn không có quyền truy cập trang quản trị!');
        setIsLoading(false);
        return;
      }

      toast.success('Đăng nhập thành công!');

      if (response.access_token) {
        localStorage.setItem('access_token', response.access_token);
        localStorage.setItem('refresh_token', response.refresh_token ?? '');
        setStoredUser(user);
      }

      navigate(user.mustChangePassword ? '/change-password' : '/app');
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(
        typeof err.response?.data?.message === 'string'
          ? err.response.data.message
          : 'Sai tài khoản hoặc mật khẩu!',
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen w-full flex-col-reverse bg-slate-50 max-[900px]:flex-col-reverse md:flex-row">
      <div className="flex flex-1 items-center justify-center bg-white p-10 max-[900px]:px-5 max-[900px]:py-14">
        <div className="w-full max-w-[420px] animate-[fade-in_0.8s_ease-out]">
          <div className="mb-8">
            <h2 className="mb-2 text-[2rem] font-extrabold text-primary">Chào mừng trở lại!</h2>
            <p className="text-slate-500">Vui lòng đăng nhập để quản lý sân bóng của bạn</p>
          </div>

          <form className="flex flex-col" onSubmit={handleLogin}>
            <div className="mb-4 flex flex-col gap-2">
              <label htmlFor="email" className="text-sm font-semibold text-slate-700">
                Email
              </label>
              <input
                type="email"
                id="email"
                className="input-field"
                placeholder="player1@ballmate.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="mb-4 flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <label htmlFor="password" className="text-sm font-semibold text-slate-700">
                  Mật khẩu
                </label>
                <a href="#" className="text-sm font-semibold text-primary">
                  Quên mật khẩu?
                </a>
              </div>
              <div className="relative w-full">
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  className="input-field pr-10"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  minLength={6}
                  required
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 flex -translate-y-1/2 items-center justify-center p-0 text-slate-500"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                >
                  {showPassword ? (
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                      <line x1="1" y1="1" x2="23" y2="23" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <label className="mb-6 flex cursor-pointer items-center gap-2 text-sm text-slate-600">
              <input type="checkbox" className="h-4 w-4 accent-primary" />
              Ghi nhớ đăng nhập
            </label>

            <button
              type="submit"
              className={cn(
                'w-full rounded-[10px] bg-primary py-3.5 text-base font-semibold text-white transition-colors hover:bg-primary-dark disabled:opacity-70',
                isLoading && 'opacity-80',
              )}
              disabled={isLoading}
            >
              {isLoading ? 'Đang đăng nhập...' : 'Đăng Nhập'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-500">
            Chưa có tài khoản?{' '}
            <a
              href="/register"
              className="font-semibold text-primary"
              onClick={(e) => {
                e.preventDefault();
                navigate('/register');
              }}
            >
              Đăng ký ngay
            </a>
          </p>
        </div>
      </div>

      <div className="flex flex-1 items-center justify-center overflow-hidden bg-gradient-to-br from-[#EAFBEA] to-[#F0FDF0] p-16 max-[900px]:px-5 max-[900px]:py-20">
        <div className="z-[2] w-full max-w-[600px] text-center">
          <div className="relative mb-8 flex h-[140px] items-end justify-center">
            <div
              className="h-[60px] w-[60px] rounded-full bg-[url('/football.png')] bg-cover bg-center shadow-[inset_-4px_-4px_12px_rgba(0,0,0,0.35)] animate-[bounce-ball_1s_ease-in-out_alternate_infinite]"
            />
            <div className="absolute bottom-0 h-3 w-20 rounded-[50%] bg-[radial-gradient(ellipse_at_center,rgba(0,0,0,0.4)_0%,rgba(0,0,0,0.2)_35%,rgba(0,0,0,0.05)_55%,transparent_75%)] blur-[1.5px] animate-[squash_1s_ease-in-out_infinite]" />
          </div>
          <h1 className="mb-6 text-[clamp(2rem,4.5vw,3.2rem)] font-black leading-tight tracking-tight text-[#043f3a]">
            <span className="whitespace-nowrap">Đặt sân nhanh chóng,</span>
            <span className="mt-1 block">
              chơi <span className="text-primary">BÓNG</span> hết mình!
            </span>
          </h1>
          <p className="text-lg font-medium text-slate-600">
            Giải pháp quản lý và đặt sân bóng đá hàng đầu Việt Nam
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
