import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AxiosClient from '../../api/AxiosClient';
import toast from 'react-hot-toast';
import './Login.css';

const LoginPage: React.FC = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const navigate = useNavigate();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            console.log('Logging in with:', { username, password });
            const response: any = await AxiosClient.post('/auth/login', { username, password });

            console.log('Login success:', response);
            toast.success('Đăng nhập thành công!');

            // Lưu token nếu backend trả về
            if (response.token) {
                localStorage.setItem('token', response.token);
            }

            navigate('/app');
        } catch (error) {
            console.error('Login error:', error);
            toast.error('Sai tài khoản hoặc mật khẩu!');

            // Tạm thời cho phép lách qua để dev nếu API chưa sẵn sàng (options)
            // navigate('/app'); 
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
                            <label htmlFor="username">Tên đăng nhập</label>
                            <input
                                type="text"
                                id="username"
                                placeholder="Nhập tên đăng nhập của bạn"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
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

                        <button type="submit" className="login-button">Đăng Nhập</button>
                    </form>

                    <div className="login-footer">
                        <p>Chưa có tài khoản? <a href="#">Đăng ký ngay</a></p>
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
