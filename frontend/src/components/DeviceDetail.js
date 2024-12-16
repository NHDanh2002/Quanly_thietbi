import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';

function DeviceDetail() {
    const [device, setDevice] = useState(null);
    const [loading, setLoading] = useState(true);
    const { id } = useParams();
    const [specifications, setSpecifications] = useState([]);
    const [errors, setErrors] = useState([]);
    const [selectedError, setSelectedError] = useState('');
    const [customError, setCustomError] = useState('');
    const [showReportDialog, setShowReportDialog] = useState(false);

    useEffect(() => {
        const fetchDeviceDetail = async () => {
            try {
                const response = await fetch(`http://localhost:5000/api/device/${id}`);
                if (!response.ok) {
                    throw new Error('Không thể lấy thông tin thiết bị');
                }
                const data = await response.json();
                fetchSpecifications(data.type);
                setDevice(data);
            } catch (error) {
                console.error('Lỗi:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchDeviceDetail();
        fetchErrors();
    }, [id]);
    
    const fetchErrors = async () => {
        try {
            const response = await fetch('http://localhost:5000/api/errors');
            if (!response.ok) {
                throw new Error('Không thể lấy danh sách lỗi');
            }
            const data = await response.json();
            setErrors(data);
        } catch (error) {
            console.error('Lỗi khi lấy danh sách lỗi:', error);
        }
    };

    const fetchSpecifications = async (deviceTypeId) => {
        try {
            const response = await fetch(`http://localhost:5000/api/specifications/${deviceTypeId}`);
            if (!response.ok) {
                throw new Error('Không thể lấy thông số kỹ thuật');
            }
            const data = await response.json();
            setSpecifications(data);
        } catch (error) {
            console.error('Lỗi khi lấy thông số kỹ thuật:', error);
        }
    };

    const handleReportError = () => {
        if (device.status === 'Hỏng') {
            alert('Thiết bị đã được báo lỗi trước đó!');
            return;
        }
        setShowReportDialog(true);
    };

    const confirmReportError = async () => {
        if (!selectedError && !customError) {
            alert('Vui lòng chọn hoặc nhập loại lỗi!');
            return;
        }

        try {
            // Kiểm tra trạng thái thiết bị trước khi cập nhật
            const deviceCheckResponse = await fetch(`http://localhost:5000/api/device/${id}`);
            if (!deviceCheckResponse.ok) {
                throw new Error('Không thể kiểm tra trạng thái thiết bị');
            }
            const currentDevice = await deviceCheckResponse.json();
            if (currentDevice.status === 'Hỏng') {
                alert('Thiết bị đã được báo lỗi bởi người khác!');
                setShowReportDialog(false);
                return;
            }

            // Thêm vào bảng error_devices trước
            const errorResponse = await fetch('http://localhost:5000/api/error_devices', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    device_id: id,
                    date_report: new Date().toISOString().slice(0, 19).replace('T', ' '),
                    date_fix: null,
                    status: 'Chưa sửa',
                    error: customError || selectedError
                })
            });

            if (!errorResponse.ok) {
                throw new Error('Không thể thêm thiết bị lỗi');
            }

            const errorData = await errorResponse.json();
            console.log('Kết quả thêm thiết bị lỗi:', errorData);

            // Sau khi thêm báo cáo lỗi thành công, cập nhật trạng thái thiết bị
            const deviceResponse = await fetch(`http://localhost:5000/api/devices/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    ...device,
                    status: 'Hỏng'
                })
            });

            if (!deviceResponse.ok) {
                throw new Error('Không thể cập nhật trạng thái thiết bị');
            }

            // Cập nhật state local
            setDevice({
                ...device,
                status: 'Hỏng'
            });

            // Cập nhật lại số lượng thiết bị lỗi
            const countResponse = await fetch('http://localhost:5000/api/error-devices/count');
            if (!countResponse.ok) {
                throw new Error('Không thể cập nhật số lượng thiết bị lỗi');
            }
            const countData = await countResponse.json();
            window.dispatchEvent(new CustomEvent('updateErrorCount', { detail: countData.count }));

            setShowReportDialog(false);
            setSelectedError('');
            setCustomError('');
        } catch (error) {
            console.error('Lỗi khi báo cáo:', error);
            alert(`Có lỗi xảy ra: ${error.message}`);
        }
    };

    if (loading) {
        return <div className="loading">Đang tải...</div>;
    }

    if (!device) {
        return <div className="error">Không tìm thấy thiết bị</div>;
    }

    return (
        <div className="device-detail-container">
            <div className="device-detail-card">
                <h2>Chi tiết thiết bị</h2>
                <div className="device-info">
                    <div className="info-group">
                        <p><strong>Tên thiết bị:</strong> {device.name}</p>
                        <p><strong>Phòng:</strong> {device.room}</p>
                        <p><strong>Trạng thái:</strong> 
                            <span className={`status ${device.status.toLowerCase()}`}>
                                {device.status}
                            </span>
                        </p>
                        <p><strong>Ngày bắt đầu sử dụng:</strong> {new Date(device.start_date).toLocaleDateString('vi-VN')}</p>
                    </div>
                    
                    <div className="specifications-section">
                        <h3>Thông số kỹ thuật</h3>
                        {specifications.map(spec => (
                            <tr key={spec.id}>
                                <th style={{textAlign: 'left', padding:'10px'}}>{spec.spec_name}:</th>
                                <td>
                                    {device.specifications?.[spec.spec_name] || 'Chưa cập nhật'}
                                </td>
                            </tr>
                        ))}
                    </div>
                </div>

                <button 
                    className="report-btn" 
                    onClick={handleReportError}
                    disabled={device.status === 'Hỏng'}
                >
                    Báo lỗi thiết bị
                </button>
            </div>

            {showReportDialog && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h3>Báo cáo lỗi thiết bị</h3>
                        <div>
                            <select 
                                value={selectedError}
                                onChange={(e) => setSelectedError(e.target.value)}
                                className="error-select"
                            >
                                <option value="">-- Chọn loại lỗi --</option>
                                {errors.map(error => (
                                    <option key={error.id} value={error.name}>
                                        {error.name}
                                    </option>
                                ))}
                            </select>
                            <input
                                type="text"
                                placeholder="Hoặc nhập lỗi khác"
                                value={selectedError === "other" ? customError : ""}
                                onChange={(e) => {
                                    setSelectedError("other");
                                    setCustomError(e.target.value);
                                }}
                                className="error-input"
                            />
                        </div>
                        <div className="modal-buttons">
                            <button className="cancel-button" onClick={() => {
                                setShowReportDialog(false);
                                setSelectedError('');
                                setCustomError('');
                            }}>
                                Hủy
                            </button>
                            <button className="confirm-button" onClick={confirmReportError}>
                                Xác nhận
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <style jsx>{`
                .device-detail-container {
                    padding: 40px 20px;
                    max-width: 900px;
                    margin: 0 auto;
                    min-height: 100vh;
                    background: #f5f6fa;
                }

                .device-detail-card {
                    background: white;
                    border-radius: 15px;
                    box-shadow: 0 4px 20px rgba(0,0,0,0.08);
                    padding: 30px;
                    transition: all 0.3s ease;
                }

                .device-detail-card:hover {
                    transform: translateY(-5px);
                    box-shadow: 0 6px 25px rgba(0,0,0,0.1);
                }

                h2 {
                    color: #2c3e50;
                    font-size: 28px;
                    margin-bottom: 30px;
                    border-bottom: 2px solid #eee;
                    padding-bottom: 15px;
                }

                h3 {
                    color: #34495e;
                    font-size: 20px;
                    margin: 25px 0 15px;
                }

                .device-info {
                    display: flex;
                    flex-direction: column;
                    gap: 20px;
                }

                .info-group p {
                    margin: 12px 0;
                    font-size: 16px;
                    line-height: 1.8;
                    color: #444;
                }

                .specifications {
                    background: #f8f9fa;
                    padding: 20px;
                    border-radius: 10px;
                    margin-top: 10px;
                }

                .specifications th {
                    text-align: left;
                }

                .status {
                    padding: 5px 12px;
                    border-radius: 15px;
                    font-size: 14px;
                    margin-left: 8px;
                }

                .status.hoạt.động {
                    background: #e3fcef;
                    color: #00b74a;
                }

                .status.bảo.trì {
                    background: #fff4e5;
                    color: #ff9f43;
                }

                .status.hỏng {
                    background: #ffeaea;
                    color: #dc3545;
                }

                .report-btn {
                    margin-top: 30px;
                    padding: 12px 24px;
                    background: #e74c3c;
                    color: white;
                    border: none;
                    border-radius: 8px;
                    font-size: 16px;
                    cursor: pointer;
                    transition: all 0.3s ease;
                }

                .report-btn:disabled {
                    background: #ccc;
                    cursor: not-allowed;
                }

                .report-btn:not(:disabled):hover {
                    background: #c0392b;
                    transform: translateY(-2px);
                    box-shadow: 0 4px 12px rgba(231,76,60,0.3);
                }

                .loading, .error {
                    text-align: center;
                    padding: 40px;
                    font-size: 18px;
                    color: #666;
                }

                .modal-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: rgba(0, 0, 0, 0.5);
                    display: flex;
                    justify-content: center;
                    align-items: center;
                }

                .modal-content {
                    background: white;
                    padding: 30px;
                    border-radius: 10px;
                    width: 90%;
                    max-width: 500px;
                }

                .error-select {
                    width: 100%;
                    padding: 10px;
                    margin: 20px 0;
                    border: 1px solid #ddd;
                    border-radius: 5px;
                    font-size: 16px;
                }

                .modal-buttons {
                    display: flex;
                    justify-content: center;
                    gap: 10px;
                    margin-top: 20px;
                }

                .cancel-button, .confirm-button {
                    padding: 10px 20px;
                    border: none;
                    border-radius: 5px;
                    cursor: pointer;
                    font-size: 14px;
                }
                .error-input {
                    width: 95%;
                    padding: 10px;
                    margin: 20px 0;
                    border: 1px solid #ddd;
                    border-radius: 5px;
                    font-size: 16px;
                }

                .cancel-button {
                    background: #ddd;
                }

                .confirm-button {
                    background: #e74c3c;
                    color: white;
                }
            `}</style>
        </div>
    );
}

export default DeviceDetail;
