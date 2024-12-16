import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import * as XLSX from 'xlsx';

function Devices() {
    const { typeId } = useParams();
    const [type, setType] = useState(null);
    const [devices, setDevices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedDevice, setSelectedDevice] = useState(null);
    const [rooms, setRooms] = useState([]);
    const [showAddDialog, setShowAddDialog] = useState(false);
    const [showEditDialog, setShowEditDialog] = useState(false);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [specifications, setSpecifications] = useState([]);
    const [specificationDetails, setSpecificationDetails] = useState({});
    const [deviceToDelete, setDeviceToDelete] = useState(null);
    const [deviceToEdit, setDeviceToEdit] = useState(null);
    const [showExportDialog, setShowExportDialog] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [devicesPerPage] = useState(7);
    const [newDevice, setNewDevice] = useState({
        name: '',
        room: '',
        status: 'Hoạt động',
        depreciation_period: '',
        description: '',
        start_date: new Date().toISOString().split('T')[0],
        specifications: {}
    });

    // Get current devices
    const indexOfLastDevice = currentPage * devicesPerPage;
    const indexOfFirstDevice = indexOfLastDevice - devicesPerPage;
    const currentDevices = devices.slice(indexOfFirstDevice, indexOfLastDevice);

    // Change page
    const paginate = pageNumber => setCurrentPage(pageNumber);

    //xử lý export excel
    const handleExportExcel = () => {
        if(!devices.length) {
            setShowExportDialog(true);
            return;
        }
        // Hàm làm phẳng JSON
        const flattenData = (devices) => {
            return devices.map(item => {
                // Sao chép các trường ban đầu
                const flattened = { ...item };
                
                // Xử lý các trường JSON (giả sử trường có tên là 'details')
                if (typeof item.specifications === 'object' && item.specifications !== null) {
                    Object.keys(item.specifications).forEach(key => {
                        flattened[`specifications_${key}`] = item.specifications[key]; // Thêm từng key của JSON vào flattened
                    });
                    delete flattened.specifications; // Xoá trường JSON gốc
                }
                return flattened;
            });
        };
    
        // Làm phẳng dữ liệu
        const flattenedDevices = flattenData(devices);
    
        // Tạo worksheet từ dữ liệu đã làm phẳng
        const worksheet = XLSX.utils.json_to_sheet(flattenedDevices);
    
        // Tạo workbook và thêm worksheet
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Devices');
    
        // Ghi file Excel
        XLSX.writeFile(workbook, `Danh sách ${type && `${type.map(type => type.name)}`}.xlsx`);
    };
    

    //lấy danh sách loại thiết bị theo id
    useEffect(() => {
        if (typeId) {
            fetch(`http://localhost:5000/api/device-types/${typeId}`)
                .then(response => response.json())
                .then(data => {
                    setType(data);
                })
                .catch(err => {
                    console.error('Lỗi khi lấy thông tin loại thiết bị:', err);
                });
        }
    }, [typeId]);

    //lấy danh sách thông số kỹ thuật theo loại thiết bị
    const fetchSpecifications = async () => {
        try {
            const response = await fetch(`http://localhost:5000/api/specifications/${typeId}`);
            const data = await response.json();
            setSpecifications(data);
            
            // Fetch details for each specification
            data.forEach(spec => {
                fetchSpecificationDetails(spec.id);
            });
        } catch (error) {
            console.error('Lỗi khi lấy thông số kỹ thuật:', error);
        } finally {
            setLoading(false);
        }
    };
    useEffect(() => {
        fetchSpecifications();
    }, /*[typeId]*/);

    const fetchSpecificationDetails = async (specId) => {
        try {
            const response = await fetch(`http://localhost:5000/api/specification_detail/${specId}`);
            const data = await response.json();
            setSpecificationDetails(prev => ({
                ...prev,
                [specId]: data
            }));
        } catch (error) {
            console.error('Lỗi khi lấy chi tiết thông số kỹ thuật:', error);
        }
    };

    const fetchDevices = async () => {
        try {
            if (typeId) {
                const response = await fetch(`http://localhost:5000/api/devices/${typeId}`);
                if (!response.ok) {
                    throw new Error('Failed to fetch devices');
                }
                const data = await response.json();
                setDevices(data);
            }
        } catch (err) {
            console.error('Lỗi khi lấy dữ liệu thiết bị:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDevices();
    }, /*[typeId]*/);

    useEffect(() => {
        const fetchRooms = async () => {
            try {
                const response = await fetch('http://localhost:5000/api/rooms');
                if (!response.ok) {
                    throw new Error('Failed to fetch rooms');
                }
                const data = await response.json();
                setRooms(data);
            } catch (err) {
                console.error('Lỗi khi lấy dữ liệu phòng:', err);
            }
        };

        fetchRooms();
    }, []);

    const handleEdit = (device) => {
        setDeviceToEdit(device);
        setShowEditDialog(true);
    };

    const handleEditSubmit = async () => {
        try {
            const selectedRoom = rooms.find(room => room.name === deviceToEdit.room);
            if (!selectedRoom) {
                alert('Phòng không hợp lệ');
                return;
            }

            const response = await fetch(`http://localhost:5000/api/devices/${deviceToEdit.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    name: deviceToEdit.name,
                    room: selectedRoom.name,
                    status: deviceToEdit.status,
                    start_date: deviceToEdit.start_date,
                    specifications: deviceToEdit.specifications,
                    description: deviceToEdit.description
                })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message);
            }

            const result = await response.json();
            console.log('Kết quả cập nhật:', result);

            await fetchDevices();
            setShowEditDialog(false);
            setDeviceToEdit(null);
            //alert('Cập nhật thiết bị thành công');

        } catch (error) {
            console.error('Lỗi khi cập nhật thiết bị:', error);
            alert('Đã xảy ra lỗi khi cập nhật thiết bị: ' + error.message);
        }
    };

    const handleDelete = (device) => {
        setDeviceToDelete(device);
        setShowDeleteDialog(true);
    };

    const confirmDelete = async () => {
        try {
            const response = await fetch(`http://localhost:5000/api/devices/${deviceToDelete.id}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                await fetchDevices();
                setShowDeleteDialog(false);
                setDeviceToDelete(null);
            } else {
                const error = await response.json();
                alert(`Lỗi: ${error.message}`);
            }
        } catch (error) {
            console.error('Lỗi khi xóa thiết bị:', error);
            alert('Đã xảy ra lỗi khi xóa thiết bị');
        }
    };

    const handleViewDetails = (device) => {
        setSelectedDevice(device);
    };

    const handleCloseDialog = () => {
        setSelectedDevice(null);
    };

    const handlePrintQRCode = () => {
        const printWindow = window.open('', '', 'width=600,height=600');
        printWindow.document.write(`
            <html>
                <head>
                    <title>In mã QR</title>
                    <style>
                        .container {
                            text-align: center;
                            padding: 20px;
                        }
                        .device-name {
                            font-size: 24px;
                            margin-bottom: 20px;
                        }
                        .qr-code {
                            width: 300px;
                            height: 300px;
                        }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="device-name">${selectedDevice.name}</div>
                        <img src="${selectedDevice.qr_code}" class="qr-code" />
                    </div>
                    <script>
                        window.onload = function() {
                            window.print();
                            window.onafterprint = function() {
                                window.close();
                            }
                        }
                    </script>
                </body>
            </html>
        `);
        printWindow.document.close();
    };

    const handleAddDevice = async () => {
        try {
            if (!newDevice.room) {
                alert('Vui lòng chọn phòng');
                return;
            }

            const selectedRoom = rooms.find(room => room.name === newDevice.room);
            if (!selectedRoom) {
                alert('Phòng không hợp lệ');
                return;
            }

            const response = await fetch('http://localhost:5000/api/devices', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    ...newDevice,
                    room_id: selectedRoom.id,
                    type: typeId
                })
            });

            if (response.ok) {
                //const addedDevice = await response.json();
                await fetchDevices(); // Tải lại danh sách thiết bị
                setShowAddDialog(false);
                // Reset form
                setNewDevice({
                    name: '',
                    room: '',
                    status: 'Hoạt động',
                    start_date: new Date().toISOString().split('T')[0],
                    specifications: {}
                });
            } else {
                const error = await response.json();
                alert(`Lỗi: ${error.message}`);
            }
        } catch (error) {
            console.error('Lỗi khi thêm thiết bị:', error);
            alert('Đã xảy ra lỗi khi thêm thiết bị');
        }
    };

    if (loading) {
        return <div>Đang tải...</div>;
    }

    return (
        <div className="devices-container">
            <div className="header-container">
                <h2 className="devices-title">Danh sách {type && `${type.map(type => type.name)}`}</h2>
                <div className="button-group">
                    <button className="export-btn" onClick={handleExportExcel}>
                        Xuất Excel
                    </button>
                    <button className="add-btn" onClick={() => setShowAddDialog(true)}>
                        Thêm thiết bị mới
                    </button>
                </div>
            </div>

            {devices.length > 0 ? (
                <div className="table-container">
                    <table className="devices-table">
                        <thead>
                            <tr>
                                <th>Tên thiết bị</th>
                                <th>Phòng</th>
                                <th>Trạng thái</th>
                                <th>Ngày đưa vào sử dụng</th>
                                <th>Thao tác</th>
                            </tr>
                        </thead>
                        <tbody>
                            {currentDevices.map(device => (
                                <tr key={device.id} onClick={() => handleViewDetails(device)} style={{cursor: 'pointer'}}>
                                    <td>{device.name}</td>
                                    <td>{device.room}</td>
                                    <td>{device.status}</td>
                                    <td>{new Date(device.start_date).toLocaleDateString('vi-VN')}</td>
                                    <td className="action-buttons">
                                        <button 
                                            className="edit-btn"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleEdit(device);
                                            }}
                                        >
                                            Sửa
                                        </button>
                                        <button 
                                            className="delete-btn"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleDelete(device);
                                            }}
                                        >
                                            Xóa
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    
                    <div className="pagination">
                        {Array.from({ length: Math.ceil(devices.length / devicesPerPage) }).map((_, index) => (
                            <button
                                key={index}
                                onClick={() => paginate(index + 1)}
                                className={currentPage === index + 1 ? 'active' : ''}
                            >
                                {index + 1}
                            </button>
                        ))}
                    </div>
                </div>
            ) : (
                <p className="no-data">Không có thiết bị nào</p>
            )}

            {selectedDevice && (
                <div className="dialog-overlay" onClick={handleCloseDialog}>
                    <div className="dialog-content" onClick={e => e.stopPropagation()}>
                        <h3>Chi tiết thiết bị</h3>
                        <div className="dialog-scroll">
                            <table className="detail-table">
                                <tbody>
                                    <tr>
                                        <th>Tên thiết bị:</th>
                                        <td>{selectedDevice.name}</td>
                                    </tr>
                                    <tr>
                                        <th>Phòng:</th>
                                        <td>{selectedDevice.room}</td>
                                    </tr>
                                    <tr>
                                        <th>Trạng thái:</th>
                                        <td>{selectedDevice.status}</td>
                                    </tr>
                                    <tr>
                                        <th>Ngày đưa vào sử dụng:</th>
                                        <td>{new Date(selectedDevice.start_date).toLocaleDateString('vi-VN')}</td>
                                    </tr>
                                    <tr>
                                        <th>Người sử dụng:</th>
                                        <td>{selectedDevice.user || 'Chưa phân công'}</td>
                                    </tr>
                                    <tr>
                                        <th>Mô tả:</th>
                                        <td>{selectedDevice.description || 'Không có mô tả'}</td>
                                    </tr>
                                </tbody>
                            </table>

                            <h4 className="specs-title">Thông số kỹ thuật:</h4>
                            <table className="specs-table">
                                <tbody>
                                    {specifications.map(spec => (
                                        <tr key={spec.id}>
                                            <th>{spec.spec_name}:</th>
                                            <td>
                                                {selectedDevice.specifications?.[spec.spec_name] || 'Chưa cập nhật'}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>

                            <div className="qr-code-container">
                                <img 
                                    src={selectedDevice.qr_code} 
                                    alt="QR Code"
                                    className="qr-code-image"
                                />
                            </div>
                        </div>
                        
                        <div className="button-container">
                            <button className="print-btn" onClick={handlePrintQRCode}>In mã QR</button>
                            <button className="close-btn" onClick={handleCloseDialog}>Đóng</button>
                        </div>
                    </div>
                </div>
            )}
            {showExportDialog && (
                <div className="dialog-overlay">
                    <div className="dialog-content" style={{textAlign: 'center'}}>
                        <h3>Thông báo</h3>
                        <p>Không có thiết bị để xuất excel</p>
                        <button style={{margin: '10px'}} className="close-btn" onClick={() => setShowExportDialog(false)}>Đóng</button>
                    </div>
                </div>
            )}

            {showDeleteDialog && (
                <div className="dialog-overlay">
                    <div className="dialog-content">
                        <h3>Xác nhận xóa</h3>
                        <p>Bạn có chắc chắn muốn xóa thiết bị "{deviceToDelete?.name}"?</p>
                        <div className="button-container">
                            <button className="cancel-btn" onClick={() => setShowDeleteDialog(false)}>
                                Hủy
                            </button>
                            <button className="delete-btn" onClick={confirmDelete}>
                                Xóa
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {showEditDialog && deviceToEdit && (
                <div className="dialog-overlay" onClick={() => setShowEditDialog(false)}>
                    <div className="dialog-content" onClick={e => e.stopPropagation()}>
                        <h3>Sửa thiết bị</h3>
                        <div className="dialog-scroll">
                            <div className="form-group">
                                <label>Tên thiết bị:</label>
                                <input
                                    type="text"
                                    value={deviceToEdit.name}
                                    onChange={e => setDeviceToEdit({...deviceToEdit, name: e.target.value})}
                                />
                            </div>
                            <div className="form-group">
                                <label>Phòng:</label>
                                <select
                                    value={deviceToEdit.room}
                                    onChange={e => setDeviceToEdit({...deviceToEdit, room: e.target.value})}
                                >
                                    <option value="">Chọn phòng</option>
                                    {rooms.map(room => (
                                        <option key={room.id} value={room.name}>
                                            {room.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Trạng thái:</label>
                                <select
                                    value={deviceToEdit.status}
                                    onChange={e => setDeviceToEdit({...deviceToEdit, status: e.target.value})}
                                >
                                    <option value="Hoạt động">Hoạt động</option>
                                    <option value="Bảo trì">Bảo trì</option>
                                    <option value="Hỏng">Hỏng</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Mô tả:</label>
                                <textarea
                                    value={deviceToEdit.description || ''}
                                    onChange={e => setDeviceToEdit({...deviceToEdit, description: e.target.value})}
                                    rows="4"
                                />
                            </div>
                            <h4 className="specs-title">Thông số kỹ thuật:</h4>
                            {specifications.map(spec => (
                                <div className="form-group" key={spec.id}>
                                    <label>{spec.spec_name}:</label>
                                    <select
                                        value={deviceToEdit.specifications?.[spec.spec_name] || ''}
                                        onChange={e => setDeviceToEdit({
                                            ...deviceToEdit,
                                            specifications: {
                                                ...deviceToEdit.specifications,
                                                [spec.spec_name]: e.target.value
                                            }
                                        })}
                                    >
                                        <option value="">Chọn {spec.spec_name}</option>
                                        {specificationDetails[spec.id]?.map(detail => (
                                            <option key={detail.id} value={detail.spec_value}>
                                                {detail.spec_value}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            ))}
                        </div>
                        <div className="button-container">
                            <button className="cancel-btn" onClick={() => setShowEditDialog(false)}>Hủy</button>
                            <button className="save-btn" onClick={handleEditSubmit}>Lưu</button>
                        </div>
                    </div>
                </div>
            )}

            {showAddDialog && (
                <div className="dialog-overlay" onClick={() => setShowAddDialog(false)}>
                    <div className="dialog-content" onClick={e => e.stopPropagation()}>
                        <h3>Thêm thiết bị mới</h3>
                        <div className="dialog-scroll">
                            <div className="form-group">
                                <label>Tên thiết bị:</label>
                                <input
                                    type="text"
                                    value={newDevice.name}
                                    onChange={e => setNewDevice({...newDevice, name: e.target.value})}
                                />
                            </div>
                            <div className="form-group">
                                <label>Phòng:</label>
                                <select
                                    value={newDevice.room}
                                    onChange={e => setNewDevice({...newDevice, room: e.target.value})}
                                >
                                    <option value="">Chọn phòng</option>
                                    {rooms.map(room => (
                                        <option key={room.id} value={room.name}>
                                            {room.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Trạng thái:</label>
                                <select
                                    value={newDevice.status}
                                    onChange={e => setNewDevice({...newDevice, status: e.target.value})}
                                >
                                    <option value="Hoạt động">Hoạt động</option>
                                    <option value="Bảo trì">Bảo trì</option>
                                    <option value="Hỏng">Hỏng</option>
                                </select>
                            </div>
                            <h4 className="specs-title">Thông số kỹ thuật:</h4>
                            {specifications.map(spec => (
                                <div className="form-group" key={spec.id}>
                                    <label>{spec.spec_name}:</label>
                                    <select
                                        value={newDevice.specifications[spec.spec_name] || ''}
                                        onChange={e => setNewDevice({
                                            ...newDevice,
                                            specifications: {
                                                ...newDevice.specifications,
                                                [spec.spec_name]: e.target.value
                                            }
                                        })}
                                    >
                                        <option value="">Chọn {spec.spec_name}</option>
                                        {specificationDetails[spec.id]?.map(detail => (
                                            <option key={detail.id} value={detail.spec_value}>
                                                {detail.spec_value}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            ))}
                        </div>
                        <div className="button-container">
                            <button className="cancel-btn" onClick={() => setShowAddDialog(false)}>Hủy</button>
                            <button className="save-btn" onClick={handleAddDevice}>Lưu</button>
                        </div>
                    </div>
                </div>
            )}


            <style>{`
                .devices-container {
                    padding: 20px;
                    max-width: 1200px;
                    margin: 0 auto;
                }

                .header-container {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 20px;
                }

                .devices-title {
                    color: #1a73e8;
                    font-size: 28px;
                    font-weight: 600;
                    margin: 0;
                }

                .add-btn {
                    padding: 12px 24px;
                    background-color: #4CAF50;
                    color: white;
                    border: none;
                    border-radius: 8px;
                    cursor: pointer;
                    font-weight: 600;
                    font-size: 16px;
                    transition: all 0.3s;
                    box-shadow: 0 2px 8px rgba(76,175,80,0.3);
                }
                
                .export-btn {
                    padding: 12px 24px;
                    background-color: #1a73e8;
                    color: white;
                    border: none;
                    border-radius: 8px;
                    cursor: pointer;
                    font-weight: 600;
                    font-size: 16px;
                    transition: all 0.3s;
                    box-shadow: 0 2px 8px rgba(26,115,232,0.3);
                    margin:10px;
                }

                .add-btn:hover {
                    background-color: #43A047;
                    transform: translateY(-2px);
                    box-shadow: 0 4px 12px rgba(76,175,80,0.4);
                }
                
                .export-btn:hover {
                    background-color: #1557b0;
                    transform: translateY(-2px);
                    box-shadow: 0 4px 12px rgba(26,115,232,0.4);
                }

                .pagination {
                    display: flex;
                    justify-content: center;
                }
                
                .pagination button {
                    padding: 10px 15px;
                    margin: 5px;
                    border: none;
                    border-radius: 5px;
                    background-color: #1a73e8;
                    color: white;
                }
                
                .pagination button.active {
                    background-color: #1557b0;
                }
                
                .pagination button:hover {
                    background-color: #1557b0;
                }

                .table-container {
                    width: 100%;
                    background-color: #fff;
                    border-radius: 12px;
                    box-shadow: 0 6px 16px rgba(0,0,0,0.1);
                    overflow: hidden;
                    border: 1px solid #e0e0e0;
                }

                .devices-table {
                    width: 100%;
                    border-collapse: separate;
                    border-spacing: 0;
                }

                .devices-table th,
                .devices-table td {
                    padding: 16px;
                    text-align: center;
                    border: 1px solid #e0e0e0;
                }

                .devices-table th {
                    background-color: #1a73e8;
                    color: white;
                    font-weight: 600;
                    font-size: 15px;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                }

                .devices-table tr {
                    transition: all 0.3s;
                }

                .devices-table tr:hover {
                    background-color: #f8f9fa;
                    transform: scale(1.01);
                }

                .action-buttons {
                    display: flex;
                    justify-content: center;
                    gap: 12px;
                }

                .edit-btn,
                .delete-btn {
                    padding: 8px 16px;
                    border: none;
                    border-radius: 6px;
                    cursor: pointer;
                    font-weight: 500;
                    transition: all 0.3s;
                    min-width: 90px;
                }

                .edit-btn {
                    background-color: #1a73e8;
                    color: white;
                    box-shadow: 0 2px 6px rgba(26,115,232,0.3);
                }

                .edit-btn:hover {
                    background-color: #1557b0;
                    transform: translateY(-2px);
                    box-shadow: 0 4px 12px rgba(26,115,232,0.4);
                }

                .delete-btn {
                    background-color: #dc3545;
                    color: white;
                    box-shadow: 0 2px 6px rgba(220,53,69,0.3);
                }

                .delete-btn:hover {
                    background-color: #bb2d3b;
                    transform: translateY(-2px);
                    box-shadow: 0 4px 12px rgba(220,53,69,0.4);
                }

                .dialog-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background-color: rgba(0, 0, 0, 0.7);
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    z-index: 1000;
                    backdrop-filter: blur(4px);
                    overflow-y: auto;
                }

                .dialog-content {
                    background: white;
                    padding: 35px;
                    border-radius: 16px;
                    width: 600px;
                    max-height: 90vh;
                    box-shadow: 0 12px 36px rgba(0, 0, 0, 0.25);
                    margin: 20px;
                    position: relative;
                }

                .dialog-scroll {
                    overflow-y: auto;
                    max-height: calc(90vh - 200px);
                    padding: 25px 15px;
                    margin: 25px -15px;
                }

                .dialog-content h3 {
                    margin: 0;
                    color: #1a73e8;
                    font-size: 28px;
                    font-weight: 600;
                    border-bottom: 3px solid #e8f0fe;
                    padding-bottom: 20px;
                    text-align: center;
                }

                .detail-table,
                .specs-table {
                    width: 100%;
                    border-collapse: collapse;
                    margin-bottom: 25px;
                    border-radius: 8px;
                    overflow: hidden;
                }

                .detail-table th,
                .detail-table td,
                .specs-table th,
                .specs-table td {
                    padding: 14px;
                    border: 1px solid #e0e0e0;
                }

                .detail-table th,
                .specs-table th {
                    background-color: #f8f9fa;
                    width: 220px;
                    font-weight: 600;
                    text-align: left;
                    color: #202124;
                }

                .specs-title {
                    margin: 25px 0 20px 0;
                    color: #1a73e8;
                    font-size: 20px;
                    font-weight: 600;
                }

                .form-group {
                    margin-bottom: 20px;
                }

                .form-group label {
                    display: block;
                    margin-bottom: 8px;
                    font-weight: 500;
                    color: #202124;
                    font-size: 15px;
                }

                .form-group input,
                .form-group select,
                .form-group textarea {
                    width: 100%;
                    padding: 12px 16px;
                    border: 2px solid #e0e0e0;
                    border-radius: 8px;
                    font-size: 15px;
                    transition: all 0.3s;
                    box-sizing: border-box;
                }

                .form-group textarea {
                    resize: vertical;
                    min-height: 100px;
                }

                .form-group input:focus,
                .form-group select:focus,
                .form-group textarea:focus {
                    outline: none;
                    border-color: #1a73e8;
                    box-shadow: 0 0 0 3px rgba(26,115,232,0.2);
                }

                .button-container {
                    display: flex;
                    justify-content: center;
                    gap: 20px;
                    margin-top: 30px;
                }

                .close-btn,
                .save-btn,
                .cancel-btn,
                .print-btn {
                    padding: 12px 28px;
                    border: none;
                    border-radius: 8px;
                    cursor: pointer;
                    font-weight: 600;
                    font-size: 16px;
                    transition: all 0.3s;
                }

                .close-btn,
                .save-btn {
                    background-color: #1a73e8;
                    color: white;
                    box-shadow: 0 4px 12px rgba(26,115,232,0.3);
                }

                .close-btn:hover,
                .save-btn:hover {
                    background-color: #1557b0;
                    transform: translateY(-2px);
                    box-shadow: 0 6px 16px rgba(26,115,232,0.4);
                }

                .print-btn {
                    background-color: #4CAF50;
                    color: white;
                    box-shadow: 0 4px 12px rgba(76,175,80,0.3);
                }

                .print-btn:hover {
                    background-color: #43A047;
                    transform: translateY(-2px);
                    box-shadow: 0 6px 16px rgba(76,175,80,0.4);
                }

                .cancel-btn {
                    background-color: #dc3545;
                    color: white;
                    box-shadow: 0 4px 12px rgba(220,53,69,0.3);
                }

                .cancel-btn:hover {
                    background-color: #bb2d3b;
                    transform: translateY(-2px);
                    box-shadow: 0 6px 16px rgba(220,53,69,0.4);
                }

                .qr-code-container {
                    display: flex;
                    justify-content: center;
                    margin-bottom: 20px;
                }

                .qr-code-image {
                    width: 150px;
                    height: 150px;
                    object-fit: contain;
                }
            `}</style>
        </div>
    );
}

export default Devices;
