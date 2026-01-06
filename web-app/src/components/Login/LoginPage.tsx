import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AxiosClient from '../../api/AxiosClient';
import toast from 'react-hot-toast';
import './Login.css';

const LoginPage: React.FC = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        // Kiểm tra xem có flag đăng xuất vừa thực hiện không
        if (localStorage.getItem('logout_success')) {
            toast.success('Đăng xuất thành công!');
            localStorage.removeItem('logout_success');
        }
    }, []);

    const validateForm = () => {
        // Simple email validation regex
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
            console.log('Logging in with:', { email, password });
            const response: any = await AxiosClient.post('/auth/login', { email, password });

            console.log('Login success:', response);

            // Kiểm tra role trước khi cho phép vào hệ thống
            if (response.user?.role !== 'FIELD_OWNER') {
                toast.error('Tài khoản của bạn không có quyền truy cập trang quản trị!');
                setIsLoading(false);
                return;
            }

            toast.success('Đăng nhập thành công!');

            // Lưu token và thông tin user theo structure của BE
            if (response.access_token) {
                localStorage.setItem('access_token', response.access_token);
                localStorage.setItem('refresh_token', response.refresh_token);
                localStorage.setItem('user', JSON.stringify(response.user));
            }

            navigate('/app');
        } catch (error: any) {
            console.error('Login error:', error);
            const errorMessage = error.response?.data?.message || 'Sai tài khoản hoặc mật khẩu!';
            toast.error(typeof errorMessage === 'string' ? errorMessage : 'Đăng nhập thất bại!');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="login-container">
            <div className="login-left">
                <div className="login-card">
                    <div className="login-header">
                        <h2>Chào mừng trở lại!</h2>
                        <p>Vui lòng đăng nhập để quản lý sân bóng của bạn</p>
                    </div>

                    <form className="login-form" onSubmit={handleLogin}>
                        <div className="form-group">
                            <label htmlFor="email">Email</label>
                            <input
                                type="email"
                                id="email"
                                placeholder="player1@ballmate.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>

                        <div className="form-group">
                            <div className="label-row">
                                <label htmlFor="password">Mật khẩu</label>
                                <a href="#" className="forgot-password">Quên mật khẩu?</a>
                            </div>
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

                        <div className="form-options">
                            <label className="checkbox-container">
                                <input type="checkbox" />
                                <span className="checkmark"></span>
                                Ghi nhớ đăng nhập
                            </label>
                        </div>

                        <button
                            type="submit"
                            className={`login-button ${isLoading ? 'loading' : ''}`}
                            disabled={isLoading}
                        >
                            {isLoading ? 'Đang đăng nhập...' : 'Đăng Nhập'}
                        </button>
                    </form>

                    <div className="login-footer">
                        <p>Chưa có tài khoản? <a href="/register" onClick={(e) => { e.preventDefault(); navigate('/register'); }}>Đăng ký ngay</a></p>
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
                        <span style={{ whiteSpace: 'nowrap' }}>Đặt sân nhanh chóng,</span>
                        <span className="line-break">
                            chơi <span>BÓNG</span> hết mình!
                        </span>
                    </h1>
                    <p className="hero-subtitle">
                        Giải pháp quản lý và đặt sân bóng đá hàng đầu Việt Nam
                    </p>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;
