import React, { useState, useEffect } from 'react';
import { Routes, Route, Link, useNavigate } from 'react-router-dom';
import DeviceTypes from './DeviceTypes';
import Rooms from './Rooms';
import Devices from './Devices';
import ErrorDevices from './ErrorDevices';
import Specifications from './Specifications';
import SpecificationDetail from './SpecificationDetail';
import DeviceAnalysis from './DeviceAnalysis';
import ErrorDeviceAnalysis from './ErrorDeviceAnalysis';
import Errors from './Errors';

function Home() {
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(true);
    const [showSubNavDevices, setShowSubNavDevices] = useState(false);
    const [showSubNavStatistics, setShowSubNavStatistics] = useState(false);
    const [deviceTypes, setDeviceTypes] = useState([]);
    const [errorCount, setErrorCount] = useState(0);

    useEffect(() => {
        // Kiểm tra xem người dùng đã đăng nhập chưa
        const user = localStorage.getItem('user');
        if (!user) {
            navigate('/login');
            return;
        }

        // Kết nối WebSocket
        const ws = new WebSocket('ws://localhost:8080');
        //load lại loại thiết bị khi có loại thiết bị mới đc thêm vào
        ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            if (data.type === 'newDeviceType' || data.type === 'deleteDeviceType') {
                fetchDeviceTypes();
            }
            else if (data.type === 'errorCount') {
                setErrorCount(data.count);
            }
        };

        ws.onerror = (error) => {
            console.error('WebSocket error:', error);
        };

        ws.onclose = () => {
            console.log('WebSocket connection closed');
        };

        // Load danh sách loại thiết bị
        const fetchDeviceTypes = async () => {
            try {
                const response = await fetch('http://localhost:5000/api/device-types');
                const data = await response.json();
                setDeviceTypes(data);
            } catch (error) {
                console.error('Lỗi khi tải danh sách loại thiết bị:', error);
            }
        };

        fetchDeviceTypes();

        setTimeout(() => {
            setIsLoading(false);
        }, 1000);

        // Cleanup WebSocket connection
        return () => {
            if (ws.readyState === WebSocket.OPEN) {
                ws.close();
            }
        };
    }, [navigate]);

    const subNavStyleDevices = {
        display: showSubNavDevices ? 'flex' : 'none',
        flexDirection: 'column',
        gap: '8px',
        marginLeft: '20px',
        paddingLeft: '15px',
        marginTop: '8px',
        marginBottom: '8px'
    };
    const subNavStyleStatistics = {
        display: showSubNavStatistics ? 'flex' : 'none',
        flexDirection: 'column',
        gap: '8px',
        marginLeft: '20px',
        paddingLeft: '15px',
        marginTop: '8px',
        marginBottom: '8px'
    };

    if (isLoading) {
        return (
            <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                height: '100vh',
                fontSize: '24px'
            }}>
                <div className="loading-spinner"></div>
                <style>
                    {`
                    .loading-spinner {
                        width: 60px;
                        height: 60px;
                        border: 6px solid #f3f3f3;
                        border-top: 6px solid #4a90e2;
                        border-radius: 50%;
                        animation: spin 0.8s linear infinite;
                    }
                    
                    @keyframes spin {
                        0% { transform: rotate(0deg); }
                        100% { transform: rotate(360deg); }
                    }
                    `}
                </style>
            </div>
        );
    }

    return (
        <div className="home-container">
            {/* Thanh điều hướng bên trái */}
            <div className="sidebar">
                <div className="profile-section">
                    <div className="avatar-container">
                        <img
                            src="https://www.w3schools.com/howto/img_avatar.png"
                            alt="Avatar"
                            className="avatar-image"
                        />
                    </div>
                    <div className="user-name">
                        {localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')).name : 'Khách'}
                    </div>
                    <div className="user-role">
                        {localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')).role : ''}
                    </div>
                </div>
                <nav className="nav-menu">
                    <ul style={{ listStyle: 'none', padding: 0 }}>
                        <li>
                            <span
                                onClick={() => setShowSubNavDevices(!showSubNavDevices)}
                                className="nav-link bold"
                                style={{cursor: 'pointer'}}
                            >
                                Quản lý thiết bị
                            </span>
                            <ul style={subNavStyleDevices}>
                                {deviceTypes.map(type => (
                                    <li key={type.id}>
                                        <Link to={`/devices/${type.id}`} className="nav-link sub-link">
                                            {type.name}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </li>
                        <li><Link to="/devicetypes" className="nav-link">Quản lý loại thiết bị</Link></li>
                        <li>
                            <Link to="/error-devices" className="nav-link">
                                Quản lý thiết bị lỗi
                                {errorCount > 0 && (
                                    <span className="notification-dot"></span>
                                )}
                            </Link>
                            <style jsx>{`
                                .notification-dot {
                                    width: 8px;
                                    height: 8px;
                                    background-color: #ff4444;
                                    border-radius: 50%;
                                    display: inline-block;
                                    margin-left: 5px;
                                }
                            `}</style>
                        </li>
                        <li><Link to="/rooms" className="nav-link">Quản lý phòng</Link></li><li>
                            <span
                                onClick={() => setShowSubNavStatistics(!showSubNavStatistics)}
                                className="nav-link bold"
                                style={{cursor: 'pointer'}}
                            >
                                Thống kê
                            </span>
                            <ul style={subNavStyleStatistics}>
                                <li><Link to="/device-analysis" className="nav-link sub-link">Thống kê thiết bị</Link></li>
                                <li><Link to="/error-device-analysis" className="nav-link sub-link">Thống kê thiết bị lỗi</Link></li>
                            </ul>
                        </li>
                        <li>
                            <Link
                                to="/login"
                                onClick={() => {
                                    localStorage.removeItem('user');
                                    sessionStorage.clear();
                                }}
                                className="nav-link logout"
                            >
                                Đăng xuất
                            </Link>
                        </li>
                    </ul>
                </nav>
            </div>

            {/* Nội dung chính */}
            <div className="main-content">
                <Routes>
                    <Route path="/devices/:typeId" element={<Devices />} />
                    <Route path="/devices/add" element={<h1>Thêm thiết bị mới</h1>} />
                    <Route path="/devices/view" element={<h1>Xem danh sách thiết bị</h1>} />
                    <Route path="/devices/settings" element={<h1>Cài đặt thiết bị</h1>} />
                    <Route path="/devicetypes" element={<DeviceTypes />} />
                    <Route path="/rooms" element={<Rooms />} />
                    <Route path="/specifications/:deviceTypeId" element={<Specifications />} />
                    <Route path="/errors" element={<Errors />} />
                    <Route path="/specification-detail/:specificationId" element={<SpecificationDetail />} />
                    <Route path="/error-devices" element={<ErrorDevices />} />
                    <Route path="/device-analysis" element={<DeviceAnalysis />} />
                    <Route path="/error-device-analysis" element={<ErrorDeviceAnalysis />} />
                    <Route path="/" element={<h1>Chào mừng đến hệ thống quản lý!</h1>} />
                </Routes>
            </div>

            <style>
                {`
                .home-container {
                    display: flex;
                    min-height: 100vh;
                    background-color: #f8f9fa;
                }

                .sidebar {
                    width: 280px;
                    background: linear-gradient(180deg, #1a237e 0%, #303f9f 100%);
                    color: white;
                    padding: 25px;
                    box-shadow: 4px 0 10px rgba(0,0,0,0.1);
                    position: fixed;
                    height: 100vh;
                    overflow-y: auto;
                    z-index: 100;
                }

                .profile-section {
                    text-align: center;
                    margin-bottom: 35px;
                    padding: 20px 0;
                    border-bottom: 2px solid rgba(255,255,255,0.1);
                }

                .avatar-container {
                    width: 100px;
                    height: 100px;
                    border-radius: 50%;
                    margin: 0 auto 15px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    overflow: hidden;
                    border: 3px solid #4a90e2;
                    box-shadow: 0 4px 8px rgba(0,0,0,0.2);
                    transition: transform 0.3s ease;
                }

                .avatar-container:hover {
                    transform: scale(1.05);
                }

                .avatar-image {
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                }

                .user-name {
                    font-size: 18px;
                    font-weight: 600;
                    margin-bottom: 8px;
                    color: #fff;
                }

                .user-role {
                    font-size: 14px;
                    color: #90caf9;
                    font-weight: 500;
                }

                .nav-menu {
                    display: flex;
                    flex-direction: column;
                    gap: 12px;
                }

                .nav-link {
                    color: white;
                    text-decoration: none;
                    padding: 12px 15px;
                    border-radius: 8px;
                    transition: all 0.3s ease;
                    display: flex;
                    align-items: center;
                    font-weight: 500;
                    background-color: rgba(255,255,255,0.05);
                    margin-bottom: 8px;
                }

                .nav-link:hover {
                    background-color: rgba(255,255,255,0.15);
                    transform: translateX(5px);
                }

                .sub-link {
                    background-color: rgba(255,255,255,0.03);
                    font-size: 14px;
                    padding: 10px 15px;
                    margin-bottom: 4px;
                }

                .bold {
                    font-weight: 600;
                    letter-spacing: 0.5px;
                }

                .logout {
                    margin-top: 30px;
                    margin-bottom: 30px;
                    background-color: #d32f2f;
                }

                .logout:hover {
                    background-color: #b71c1c;
                }

                .main-content {
                    flex: 1;
                    margin-left: 330px;
                    padding: 30px;
                    background-color: #f8f9fa;
                    min-height: 100vh;
                    box-sizing: border-box;
                    position: relative;
                }

                .main-content h1 {
                    color: #1a237e;
                    margin-top: 0;
                    font-size: 28px;
                    font-weight: 600;
                    margin-bottom: 30px;
                }

                /* Custom scrollbar cho sidebar */
                .sidebar::-webkit-scrollbar {
                    width: 6px;
                }

                .sidebar::-webkit-scrollbar-track {
                    background: rgba(255,255,255,0.1);
                }

                .sidebar::-webkit-scrollbar-thumb {
                    background: rgba(255,255,255,0.3);
                    border-radius: 3px;
                }

                .sidebar::-webkit-scrollbar-thumb:hover {
                    background: rgba(255,255,255,0.5);
                }
                `}
            </style>
        </div>
    );
}

export default Home;
