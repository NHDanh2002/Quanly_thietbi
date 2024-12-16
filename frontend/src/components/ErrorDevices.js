import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function ErrorDevices() {
    const navigate = useNavigate();
    const [errorDevices, setErrorDevices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showDialog, setShowDialog] = useState(false);
    const [selectedDevice, setSelectedDevice] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const devicesPerPage = 5;

    const fetchErrorDevices = async () => {
        try {
            const response = await fetch('http://localhost:5000/api/error-devices');
            if (!response.ok) {
                throw new Error('Không thể lấy danh sách thiết bị lỗi');
            }
            const data = await response.json();
            setErrorDevices(data);
        } catch (error) {
            console.error('Lỗi:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchErrorDevices();
    }, []);

    const handleUpdateStatus = async (newStatus) => {
        try {
            // Lấy thông tin thiết bị từ API
            const deviceResponse = await fetch(`http://localhost:5000/api/devices/${selectedDevice.device_id}`);
            if (!deviceResponse.ok) {
                throw new Error('Không thể lấy thông tin thiết bị');
            }
            const deviceData = await deviceResponse.json();

            // Cập nhật trạng thái thiết bị
            const response = await fetch(`http://localhost:5000/api/devices/${selectedDevice.device_id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    ...deviceData,
                    status: newStatus
                })
            });

            if (!response.ok) {
                throw new Error('Không thể cập nhật trạng thái thiết bị');
            }

            // Cập nhật ngày sửa cho thiết bị lỗi
            const errorDeviceResponse = await fetch(`http://localhost:5000/api/error_devices/${selectedDevice.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    date_fix: new Date().toISOString().slice(0, 19).replace('T', ' '),
                    status: newStatus,
                })
            });

            if (!errorDeviceResponse.ok) {
                throw new Error('Không thể cập nhật ngày sửa thiết bị');
            }
            setShowDialog(false);

            // Load lại danh sách thiết bị lỗi
            await fetchErrorDevices();
        } catch (error) {
            console.error('Lỗi khi cập nhật:', error);
            alert('Có lỗi xảy ra khi cập nhật thiết bị: ' + error.message);
        }
    };

    const handelNavigate = () => {
        navigate('/errors');
    }

    if (loading) {
        return <div className="loading">Đang tải...</div>;
    }

    // Tính toán các thiết bị cho trang hiện tại
    const indexOfLastDevice = currentPage * devicesPerPage;
    const indexOfFirstDevice = indexOfLastDevice - devicesPerPage;
    const currentDevices = errorDevices.slice(indexOfFirstDevice, indexOfLastDevice);
    const totalPages = Math.ceil(errorDevices.length / devicesPerPage);

    const paginate = (pageNumber) => setCurrentPage(pageNumber);

    return (
        <div className="error-devices-container">
            <h2>Danh sách thiết bị lỗi</h2>
            <button className="btn-navigate" onClick={handelNavigate}>Danh sách lỗi thường gặp</button>
            <div className="error-devices-list">
                {errorDevices.length === 0 ? (
                    <p className="no-data">Không có thiết bị lỗi nào</p>
                ) : (
                    <>
                        <table>
                            <thead>
                                <tr>
                                    <th>Thiết bị</th>
                                    <th>Phòng</th>
                                    <th>Ngày báo cáo</th>
                                    <th>Ngày sửa</th>
                                    <th>Trạng thái</th>
                                    <th>Lỗi</th>
                                    <th>Thao tác</th>
                                </tr>
                            </thead>
                            <tbody>
                                {currentDevices.map(device => (
                                    <tr key={device.id}>
                                        <td>{device.name}</td>
                                        <td>{device.room}</td>
                                        <td style={{textAlign: 'center'}}>{new Date(device.date_report).toLocaleString('en-US')}</td>
                                        <td style={{textAlign: 'center'}}>{device.date_fix ? new Date(device.date_fix).toLocaleString('en-US') : 'Chưa sửa'}</td>
                                        <td>
                                            <span className={`status ${device.status.toLowerCase()}`}>
                                                {device.status}
                                            </span>
                                        </td>
                                        <td>{device.error}</td>
                                        <td>
                                            <button
                                                className="update-btn"
                                                onClick={() => {
                                                    setSelectedDevice(device);
                                                    setShowDialog(true);
                                                }}
                                                disabled={device.status === 'Đã sửa'}
                                            >
                                                Cập nhật
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        <div className="pagination">
                            {Array.from({ length: totalPages }, (_, i) => (
                                <button
                                    key={i + 1}
                                    onClick={() => paginate(i + 1)}
                                    className={`pagination-btn ${currentPage === i + 1 ? 'active' : ''}`}
                                >
                                    {i + 1}
                                </button>
                            ))}
                        </div>
                    </>
                )}
            </div>

            {showDialog && (
                <div className="dialog-overlay">
                    <div className="dialog">
                        <h3>Cập nhật trạng thái thiết bị</h3>
                        <p>Chọn trạng thái mới cho thiết bị</p>
                        <div className="dialog-buttons">
                            <button onClick={() => handleUpdateStatus('Hoạt động')} className="btn-success">
                                Hoạt động
                            </button>
                            <button onClick={() => handleUpdateStatus('Đang sửa')} className="btn-warning">
                                Đang sửa
                            </button>
                            <button onClick={() => setShowDialog(false)} className="btn-cancel">
                                Hủy
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <style jsx>{`
                .error-devices-container {
                    padding: 30px;
                    max-width: 1200px;
                    margin: 0 auto;
                }

                .loading {
                    text-align: center;
                    padding: 20px;
                    font-size: 18px;
                    color: #666;
                }

                .no-data {
                    text-align: center;
                    padding: 30px;
                    font-size: 16px;
                    color: #666;
                    background: #f8f9fa;
                    border-radius: 8px;
                }

                h2 {
                    color: #1a237e;
                    margin-bottom: 25px;
                    font-size: 24px;
                    font-weight: 600;
                    position: relative;
                    padding-bottom: 10px;
                }

                h2:after {
                    content: '';
                    position: absolute;
                    bottom: 0;
                    left: 0;
                    width: 50px;
                    height: 3px;
                    background: #1a237e;
                }

                table {
                    width: 100%;
                    border-collapse: separate;
                    border-spacing: 0;
                    background: white;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
                    border-radius: 10px;
                    overflow: hidden;
                }

                th, td {
                    padding: 15px 20px;
                    text-align: left;
                    border-bottom: 1px solid #eef2f7;
                }

                th {
                    background-color: #1a73e8;
                    color: white;
                    font-weight: 600;
                    font-size: 15px;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                    text-align: center;
                }

                tr:last-child td {
                    border-bottom: none;
                }

                tr:hover {
                    background-color: #f8f9ff;
                    transition: background-color 0.2s ease;
                }

                .status {
                    padding: 6px 12px;
                    border-radius: 20px;
                    font-size: 14px;
                    font-weight: 500;
                    display: inline-block;
                    text-transform: uppercase;
                    align-items: center;
                }

                .status.chưa.sửa {
                    background: #ffeaea;
                    color: #dc3545;
                    border: 1px solid #ffcdd2;
                    text-align: center;
                }

                .status.đang.sửa {
                    background: #fff8e1;
                    color: #ffa000;
                    text-align: center;
                    border: 1px solid #ffe082;
                }

                .status.hoạt.động {
                    background: #e8f5e9;
                    color: #4caf50;
                    text-align: center;
                    border: 1px solid #c8e6c9;
                }

                .update-btn {
                    padding: 8px 16px;
                    background-color: #2196f3;
                    color: white;
                    border: none;
                    border-radius: 4px;
                    cursor: pointer;
                    font-size: 14px;
                    transition: all 0.3s ease;
                }

                .update-btn:hover {
                    background-color: #1976d2;
                    transform: translateY(-2px);
                }

                .update-btn:disabled {
                    background-color: #ccc;
                    cursor: not-allowed;
                    transform: none;
                }

                .dialog-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background-color: rgba(0, 0, 0, 0.6);
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    backdrop-filter: blur(3px);
                }

                .dialog {
                    background: white;
                    padding: 30px;
                    border-radius: 15px;
                    width: 450px;
                    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
                    animation: slideIn 0.3s ease-out;
                }

                @keyframes slideIn {
                    from {
                        transform: translateY(-50px);
                        opacity: 0;
                    }
                    to {
                        transform: translateY(0);
                        opacity: 1;
                    }
                }

                .dialog h3 {
                    margin-top: 0;
                    color: #2c3e50;
                    font-size: 22px;
                    margin-bottom: 15px;
                }

                .dialog p {
                    color: #666;
                    margin-bottom: 25px;
                    font-size: 16px;
                }

                .dialog-buttons {
                    display: flex;
                    gap: 12px;
                    justify-content: flex-end;
                }

                .dialog-buttons button {
                    padding: 10px 20px;
                    border: none;
                    border-radius: 8px;
                    cursor: pointer;
                    font-size: 15px;
                    font-weight: 500;
                    transition: all 0.3s ease;
                }
                
                .btn-navigate {
                    padding: 8px 16px;
                    background-color: #2196f3;
                    color: white;
                    border: none;
                    border-radius: 4px;
                    cursor: pointer;
                    font-size: 14px;
                    transition: all 0.3s ease;
                    margin-bottom: 10px;
                }

                .btn-success {
                    background-color: #4CAF50;
                    color: white;
                }

                .btn-success:hover {
                    background-color: #45a049;
                    transform: translateY(-2px);
                    box-shadow: 0 4px 12px rgba(76, 175, 80, 0.3);
                }

                .btn-warning {
                    background-color: #ff9800;
                    color: white;
                }

                .btn-warning:hover {
                    background-color: #f57c00;
                    transform: translateY(-2px);
                    box-shadow: 0 4px 12px rgba(255, 152, 0, 0.3);
                }

                .btn-cancel {
                    background-color: #f44336;
                    color: white;
                }

                .btn-cancel:hover {
                    background-color: #d32f2f;
                    transform: translateY(-2px);
                    box-shadow: 0 4px 12px rgba(244, 67, 54, 0.3);
                }

                .pagination {
                    display: flex;
                    justify-content: center;
                    gap: 8px;
                    margin-top: 20px;
                }

                .pagination-btn {
                    padding: 8px 12px;
                    border: 1px solid #ddd;
                    background: white;
                    cursor: pointer;
                    border-radius: 4px;
                    transition: all 0.3s ease;
                }

                .pagination-btn:hover {
                    background: #f5f5f5;
                }

                .pagination-btn.active {
                    background: #1a73e8;
                    color: white;
                    border-color: #1a73e8;
                }
            `}</style>
        </div>
    );
}

export default ErrorDevices;
