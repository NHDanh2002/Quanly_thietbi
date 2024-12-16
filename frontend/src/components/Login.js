import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ReCAPTCHA from 'react-google-recaptcha';

function Login() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [captchaToken, setCaptchaToken] = useState(null); // Lưu token của captcha
    const [message, setMessage] = useState('');
    const navigate = useNavigate();

    // Sitekey của Google ReCAPTCHA
    const siteKey = '6Le_KpUqAAAAAGYAdm02TuB0h6J5XzY9zgClIjRy';  // Thay YOUR_RECAPTCHA_SITE_KEY bằng sitekey của bạn

    // Hàm xử lý khi token captcha thay đổi
    const handleCaptchaChange = (token) => {
        setCaptchaToken(token);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        // Kiểm tra xem captcha đã được xác nhận chưa
        if (!captchaToken) {
            setMessage('Vui lòng xác nhận ReCAPTCHA!');
            return;
        }

        try {
            const response = await fetch('http://localhost:5000/api/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    username,
                    password,
                    captchaToken
                })
            });

            const data = await response.json();

            if (response.ok) {
                // Lưu thông tin người dùng vào localStorage
                const userInfo = {
                    name: data.name, // Lấy tên từ response của server
                    role: data.role  // Lấy role từ response của server
                };
                localStorage.setItem('user', JSON.stringify(userInfo));
                setMessage('Đăng nhập thành công!');
                navigate('/home');
            } else {
                setMessage(data.message || 'Có lỗi xảy ra khi đăng nhập!');
            }
        } catch (error) {
            setMessage('Lỗi kết nối đến server!');
            console.error('Lỗi:', error);
        }
    };

    return (
        <div style={{
            width: '100%',
            height: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#f5f5f5',
            position: 'fixed',
            top: 0,
            left: 0
        }}>
            <div style={{
                width: '100%',
                maxWidth: '400px',
                padding: '30px',
                backgroundColor: 'white',
                borderRadius: '8px',
                boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
                margin: '0 auto'
            }}>
                <h1 style={{ 
                    marginBottom: '30px',
                    color: '#333',
                    textAlign: 'center',
                    fontSize: '24px'
                }}>Đăng nhập</h1>
                <form onSubmit={handleSubmit}>
                    <div style={{ marginBottom: '20px' }}>
                        <input
                            type="text"
                            placeholder="Tên đăng nhập"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            required
                            style={{
                                width: '100%',
                                padding: '12px',
                                border: '1px solid #ddd',
                                borderRadius: '4px',
                                fontSize: '16px',
                                boxSizing: 'border-box'
                            }}
                        />
                    </div>
                    <div style={{ marginBottom: '20px' }}>
                        <input
                            type="password"
                            placeholder="Mật khẩu"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            style={{
                                width: '100%',
                                padding: '12px', 
                                border: '1px solid #ddd',
                                borderRadius: '4px',
                                fontSize: '16px',
                                boxSizing: 'border-box'
                            }}
                        />
                    </div>
                    <div style={{
                        marginBottom: '20px',
                        display: 'flex',
                        justifyContent: 'center',
                        transform: 'scale(0.9)'
                    }}>
                        <ReCAPTCHA
                            sitekey={siteKey}
                            onChange={handleCaptchaChange}
                        />
                    </div>
                    <div>
                        <button 
                            type="submit"
                            style={{
                                width: '100%',
                                padding: '12px',
                                backgroundColor: '#007bff',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                fontSize: '16px',
                                cursor: 'pointer',
                                transition: 'background-color 0.3s',
                                boxSizing: 'border-box'
                            }}
                            onMouseOver={(e) => e.target.style.backgroundColor = '#0056b3'}
                            onMouseOut={(e) => e.target.style.backgroundColor = '#007bff'}
                        >
                            Đăng nhập
                        </button>
                    </div>
                </form>
                <p style={{ 
                    marginTop: '20px',
                    textAlign: 'center',
                    color: message.includes('thành công') ? 'green' : 'red'
                }}>{message}</p>
            </div>
        </div>
    );
}

export default Login;
