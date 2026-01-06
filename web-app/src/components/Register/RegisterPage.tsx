import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AxiosClient from '../../api/AxiosClient';
import toast from 'react-hot-toast';
import '../Login/Login.css';
import './Register.css';

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
        } catch (error: any) {
            console.error('Register error:', error);
            const errorMessage = error.response?.data?.message || 'Đăng ký thất bại!';
            toast.error(typeof errorMessage === 'string' ? errorMessage : 'Đăng ký thất bại!');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="login-container">
            <div className="login-left">
                <div className="login-card register-card">
                    <div className="login-header">
                        <h2>Tạo tài khoản mới</h2>
                        <p>Tham gia cộng đồng BallMate ngay hôm nay</p>
                    </div>

                    <form className="login-form" onSubmit={handleRegister}>
                        <div className="role-selection">
                            <div
                                className={`role-option ${role === 'PLAYER' ? 'active' : ''}`}
                                onClick={() => setRole('PLAYER')}
                            >
                                <div className="role-icon">🏃‍♂️</div>
                                <div className="role-info">
                                    <span>Người chơi</span>
                                    <small>Tìm và đặt sân nhanh chóng</small>
                                </div>
                            </div>
                            <div
                                className={`role-option ${role === 'FIELD_OWNER' ? 'active' : ''}`}
                                onClick={() => setRole('FIELD_OWNER')}
                            >
                                <div className="role-icon">🏟️</div>
                                <div className="role-info">
                                    <span>Chủ sân</span>
                                    <small>Quản lý và cho thuê sân</small>
                                </div>
                            </div>
                        </div>

                        <div className="form-group">
                            <label htmlFor="fullName">Họ và tên <span className="required">*</span></label>
                            <input
                                type="text"
                                id="fullName"
                                placeholder="Nguyễn Văn A"
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="email">Email <span className="required">*</span></label>
                            <input
                                type="email"
                                id="email"
                                placeholder="example@ballmate.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="phoneNumber">Số điện thoại</label>
                            <input
                                type="tel"
                                id="phoneNumber"
                                placeholder="0901234567"
                                value={phoneNumber}
                                onChange={(e) => setPhoneNumber(e.target.value)}
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="password">Mật khẩu <span className="required">*</span></label>
                            <input
                                type="password"
                                id="password"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                minLength={6}
                                required
                            />
                        </div>

                        <button
                            type="submit"
                            className={`login-button ${isLoading ? 'loading' : ''}`}
                            disabled={isLoading}
                        >
                            {isLoading ? 'Đang đăng ký...' : 'Đăng Ký Ngay'}
                        </button>
                    </form>

                    <div className="login-footer">
                        <p>Đã có tài khoản? <a href="/login" onClick={(e) => { e.preventDefault(); navigate('/login'); }}>Đăng nhập</a></p>
                    </div>
                </div>
            </div>

            <div className="login-right">
                <div className="hero-content">
                    <div className="ball-wrap">
                        <div className="ball"></div>
                        <div className="ground"></div>
                    </div>
                    <h1 className="bp-hero-title">
                        <span style={{ whiteSpace: 'nowrap' }}>Khởi đầu đam mê,</span>
                        <span className="line-break">
                            kết nối <span>BẠN BÈ</span> sân cỏ!
                        </span>
                    </h1>
                    <p className="hero-subtitle">
                        Nền tảng đặt sân và quản lý bóng đá chuyên nghiệp
                    </p>
                </div>
            </div>
        </div>
    );
};

export default RegisterPage;
