import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AxiosClient from '../../api/AxiosClient';
import toast from 'react-hot-toast';
import { cn } from '../../lib/cn';

const RegisterPage: React.FC = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [fullName, setFullName] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [role, setRole] = useState<'PLAYER' | 'FIELD_OWNER'>('PLAYER');
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();

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

        if (fullName.trim().length < 2) {
            toast.error('Họ tên phải có ít nhất 2 ký tự!');
            return false;
        }

        return true;
    };

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) return;

        setIsLoading(true);
        try {
            const payload = {
                email,
                password,
                fullName,
                phoneNumber: phoneNumber || undefined,
                role
            };

            await AxiosClient.post('/auth/register', payload);
            toast.success('Đăng ký thành công! Vui lòng đăng nhập.');
            navigate('/login');
        } catch (error: unknown) {
            const err = error as { response?: { data?: { message?: string } } };
            const errorMessage = err.response?.data?.message || 'Đăng ký thất bại!';
            toast.error(typeof errorMessage === 'string' ? errorMessage : 'Đăng ký thất bại!');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen w-full flex-col-reverse bg-slate-50 max-[900px]:flex-col-reverse md:flex-row">
            <div className="flex flex-1 items-center justify-center bg-white p-10 max-[900px]:px-5 max-[900px]:py-14">
                <div className="w-full max-w-[480px] animate-[fade-in_0.8s_ease-out]">
                    <div className="mb-8">
                        <h2 className="mb-2 text-[2rem] font-extrabold text-primary">Tạo tài khoản mới</h2>
                        <p className="text-slate-500">Tham gia cộng đồng BallMate ngay hôm nay</p>
                    </div>

                    <form className="flex flex-col gap-4" onSubmit={handleRegister}>
                        <div className="mb-2 grid grid-cols-1 gap-3 sm:grid-cols-2">
                            <button
                                type="button"
                                className={cn(
                                    'flex cursor-pointer items-center gap-3 rounded-xl border-2 p-4 text-left transition-all',
                                    role === 'PLAYER'
                                        ? 'border-primary bg-primary-light'
                                        : 'border-gray-200 bg-slate-50 hover:border-primary/50',
                                )}
                                onClick={() => setRole('PLAYER')}
                            >
                                <span className="text-2xl">🏃‍♂️</span>
                                <div>
                                    <span className="block text-sm font-semibold text-slate-800">Người chơi</span>
                                    <small className="text-xs text-slate-500">Tìm và đặt sân nhanh chóng</small>
                                </div>
                            </button>
                            <button
                                type="button"
                                className={cn(
                                    'flex cursor-pointer items-center gap-3 rounded-xl border-2 p-4 text-left transition-all',
                                    role === 'FIELD_OWNER'
                                        ? 'border-primary bg-primary-light'
                                        : 'border-gray-200 bg-slate-50 hover:border-primary/50',
                                )}
                                onClick={() => setRole('FIELD_OWNER')}
                            >
                                <span className="text-2xl">🏟️</span>
                                <div>
                                    <span className="block text-sm font-semibold text-slate-800">Chủ sân</span>
                                    <small className="text-xs text-slate-500">Quản lý và cho thuê sân</small>
                                </div>
                            </button>
                        </div>

                        <div>
                            <label htmlFor="fullName" className="mb-1.5 block text-sm font-semibold text-slate-700">
                                Họ và tên <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                id="fullName"
                                className="input-field"
                                placeholder="Nguyễn Văn A"
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                                required
                            />
                        </div>

                        <div>
                            <label htmlFor="email" className="mb-1.5 block text-sm font-semibold text-slate-700">
                                Email <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="email"
                                id="email"
                                className="input-field"
                                placeholder="example@ballmate.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>

                        <div>
                            <label htmlFor="phoneNumber" className="mb-1.5 block text-sm font-semibold text-slate-700">
                                Số điện thoại
                            </label>
                            <input
                                type="tel"
                                id="phoneNumber"
                                className="input-field"
                                placeholder="0901234567"
                                value={phoneNumber}
                                onChange={(e) => setPhoneNumber(e.target.value)}
                            />
                        </div>

                        <div>
                            <label htmlFor="password" className="mb-1.5 block text-sm font-semibold text-slate-700">
                                Mật khẩu <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="password"
                                id="password"
                                className="input-field"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                minLength={6}
                                required
                            />
                        </div>

                        <button
                            type="submit"
                            className={cn(
                                'w-full rounded-[10px] bg-primary py-3.5 text-base font-semibold text-white transition-colors hover:bg-primary-dark disabled:opacity-70',
                                isLoading && 'opacity-80',
                            )}
                            disabled={isLoading}
                        >
                            {isLoading ? 'Đang đăng ký...' : 'Đăng Ký Ngay'}
                        </button>
                    </form>

                    <p className="mt-6 text-center text-sm text-slate-500">
                        Đã có tài khoản?{' '}
                        <a
                            href="/login"
                            className="font-semibold text-primary"
                            onClick={(e) => {
                                e.preventDefault();
                                navigate('/login');
                            }}
                        >
                            Đăng nhập
                        </a>
                    </p>
                </div>
            </div>

            <div className="flex flex-1 items-center justify-center overflow-hidden bg-gradient-to-br from-[#EAFBEA] to-[#F0FDF0] p-16 max-[900px]:px-5 max-[900px]:py-20">
                <div className="z-[2] w-full max-w-[600px] text-center">
                    <div className="relative mb-8 flex h-[140px] items-end justify-center">
                        <div className="h-[60px] w-[60px] rounded-full bg-[url('/football.png')] bg-cover bg-center shadow-[inset_-4px_-4px_12px_rgba(0,0,0,0.35)] animate-[bounce-ball_1s_ease-in-out_alternate_infinite]" />
                        <div className="absolute bottom-0 h-3 w-20 rounded-[50%] bg-[radial-gradient(ellipse_at_center,rgba(0,0,0,0.4)_0%,rgba(0,0,0,0.2)_35%,rgba(0,0,0,0.05)_55%,transparent_75%)] blur-[1.5px] animate-[squash_1s_ease-in-out_infinite]" />
                    </div>
                    <h1 className="mb-6 text-[clamp(2rem,4.5vw,3.2rem)] font-black leading-tight tracking-tight text-[#043f3a]">
                        <span className="whitespace-nowrap">Khởi đầu đam mê,</span>
                        <span className="mt-1 block">
                            kết nối <span className="text-primary">BẠN BÈ</span> sân cỏ!
                        </span>
                    </h1>
                    <p className="text-lg font-medium text-slate-600">
                        Nền tảng đặt sân và quản lý bóng đá chuyên nghiệp
                    </p>
                </div>
            </div>
        </div>
    );
};

export default RegisterPage;
