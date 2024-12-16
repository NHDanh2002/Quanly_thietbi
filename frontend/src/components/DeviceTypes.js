import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function DeviceTypes() {
    const navigate = useNavigate();
    const [deviceTypes, setDeviceTypes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAddDialog, setShowAddDialog] = useState(false);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [showEditDialog, setShowEditDialog] = useState(false);
    const [selectedTypeId, setSelectedTypeId] = useState(null);
    const [newDeviceName, setNewDeviceName] = useState('');
    const [editDeviceName, setEditDeviceName] = useState('');

    useEffect(() => {
        fetch('http://localhost:5000/api/device-types')
            .then(response => response.json())
            .then(data => {
                setDeviceTypes(data);
                setLoading(false);
            })
            .catch(err => {
                console.error('Lỗi khi lấy dữ liệu loại thiết bị:', err);
                setLoading(false);
            });
    }, []);

    const handleEdit = (id) => {
        const deviceType = deviceTypes.find(type => type.id === id);
        if (deviceType) {
            setSelectedTypeId(id);
            setEditDeviceName(deviceType.name);
            setShowEditDialog(true);
        }
    };

    const confirmEdit = () => {
        if (!editDeviceName.trim()) {
            alert('Vui lòng nhập tên loại thiết bị!');
            return;
        }

        fetch(`http://localhost:5000/api/device-types/${selectedTypeId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ name: editDeviceName })
        })
        .then(response => response.json())
        .then(data => {
            if (data.message === 'Sửa loại thiết bị thành công') {
                setDeviceTypes(deviceTypes.map(type => 
                    type.id === selectedTypeId ? {...type, name: editDeviceName} : type
                ));
                setShowEditDialog(false);
                setEditDeviceName('');
            } else {
                alert('Có lỗi xảy ra khi sửa loại thiết bị!');
            }
        })
        .catch(err => {
            console.error('Lỗi khi sửa loại thiết bị:', err);
            alert('Có lỗi xảy ra khi sửa loại thiết bị!');
        });
    };

    const handleAdd = () => {
        if (!newDeviceName.trim()) {
            alert('Vui lòng nhập tên loại thiết bị!');
            return;
        }

        fetch('http://localhost:5000/api/device-types', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ name: newDeviceName })
        })
        .then(response => response.json())
        .then(data => {
            if (data.message === 'Thêm loại thiết bị thành công') {
                fetch('http://localhost:5000/api/device-types')
                    .then(response => response.json())
                    .then(data => {
                        setDeviceTypes(data);
                    });
                setShowAddDialog(false);
                setNewDeviceName('');
            } else {
                alert('Có lỗi xảy ra khi thêm loại thiết bị!');
            }
        })
        .catch(err => {
            console.error('Lỗi khi thêm loại thiết bị:', err);
            alert('Có lỗi xảy ra khi thêm loại thiết bị!');
        });
    };

    const handleDelete = (id) => {
        setSelectedTypeId(id);
        setShowDeleteDialog(true);
    };

    const confirmDelete = () => {
        fetch(`http://localhost:5000/api/device-types/${selectedTypeId}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json'
            }
        })
        .then(response => response.json())
        .then(data => {
            if (data.message === 'Xóa loại thiết bị thành công') {
                setDeviceTypes(deviceTypes.filter(type => type.id !== selectedTypeId));
                setShowDeleteDialog(false);
            } else if (data.error === 'Không tìm thấy loại thiết bị') {
                console.error('Không tìm thấy loại thiết bị để xóa');
                setShowDeleteDialog(false);
            } else {
                console.error('Lỗi server khi xóa loại thiết bị');
                setShowDeleteDialog(false);
            }
        })
        .catch(err => {
            console.error('Lỗi khi gửi request xóa:', err);
            setShowDeleteDialog(false);
        });
    };

    const handleViewSpecifications = (typeId) => {
        navigate(`/specifications/${typeId}`);
    };

    if (loading) {
        return <div className="loading">Đang tải dữ liệu...</div>;
    }

    return (
        <div className="device-types-container">
            <div className="header">
                <h1>Danh sách loại thiết bị</h1>
                <button className="add-button" onClick={() => setShowAddDialog(true)}>
                    Thêm mới
                </button>
            </div>

            {showAddDialog && (
                <div className="dialog-overlay">
                    <div className="dialog-content">
                        <h3>Thêm loại thiết bị mới</h3>
                        <input
                            type="text"
                            value={newDeviceName}
                            onChange={(e) => setNewDeviceName(e.target.value)}
                            placeholder="Nhập tên loại thiết bị"
                            className="input-field"
                        />
                        <div className="button-group">
                            <button className="cancel-button" onClick={() => setShowAddDialog(false)}>
                                Hủy
                            </button>
                            <button className="confirm-button" onClick={handleAdd}>
                                Thêm
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {showEditDialog && (
                <div className="dialog-overlay">
                    <div className="dialog-content">
                        <h3>Sửa loại thiết bị</h3>
                        <input
                            type="text"
                            value={editDeviceName}
                            onChange={(e) => setEditDeviceName(e.target.value)}
                            placeholder="Nhập tên loại thiết bị mới"
                            className="input-field"
                        />
                        <div className="button-group">
                            <button className="cancel-button" onClick={() => setShowEditDialog(false)}>
                                Hủy
                            </button>
                            <button className="confirm-button" onClick={confirmEdit}>
                                Lưu
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {showDeleteDialog && (
                <div className="dialog-overlay">
                    <div className="dialog-content">
                        <h3>Xác nhận xóa</h3>
                        <p>Bạn có chắc chắn muốn xóa loại thiết bị này?</p>
                        <div className="button-group">
                            <button className="cancel-button" onClick={() => setShowDeleteDialog(false)}>
                                Hủy
                            </button>
                            <button className="delete-button" onClick={confirmDelete}>
                                Xóa
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {deviceTypes.length > 0 ? (
                <div className="device-types-list">
                    {deviceTypes.map(type => (
                        <div key={type.id} className="device-type-item">
                            <div className="device-type-info" onClick={() => handleViewSpecifications(type.id)} style={{cursor: 'pointer'}}>
                                <h3>{type.name}</h3>
                                <p>{type.description}</p>
                            </div>
                            <div className="action-buttons">
                                <button className="edit-button" onClick={() => handleEdit(type.id)}>
                                    Sửa
                                </button>
                                <button className="delete-button" onClick={() => handleDelete(type.id)}>
                                    Xóa
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <p className="no-data">Không có loại thiết bị nào.</p>
            )}
            {/*Style*/}
            <style jsx>{`
                .device-types-container {
                    padding: 2rem;
                    max-width: 1200px;
                    margin: 0 auto;
                }

                .header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 2rem;
                }

                .header h1 {
                    font-size: 2rem;
                    color: #2c3e50;
                    margin: 0;
                }

                .add-button {
                    padding: 0.75rem 1.5rem;
                    background-color: #4CAF50;
                    color: white;
                    border: none;
                    border-radius: 6px;
                    cursor: pointer;
                    font-size: 1rem;
                    transition: background-color 0.3s;
                }

                .add-button:hover {
                    background-color: #45a049;
                }

                .dialog-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background-color: rgba(0, 0, 0, 0.6);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 1000;
                }

                .dialog-content {
                    background-color: white;
                    padding: 2rem;
                    border-radius: 12px;
                    width: 400px;
                    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
                }

                .dialog-content h3 {
                    margin: 0 0 1.5rem;
                    font-size: 1.5rem;
                    color: #2c3e50;
                    text-align: center;
                }
                
                .dialog-content p {
                    text-align: center;
                    margin-bottom: 1.5rem;
                }

                .input-field {
                    width: 100%;
                    padding: 0.75rem;
                    margin-bottom: 1.5rem;
                    border-radius: 6px;
                    border: 2px solid #e1e8ed;
                    font-size: 1rem;
                    transition: border-color 0.3s;
                }

                .input-field:focus {
                    outline: none;
                    border-color: #4CAF50;
                }

                .button-group {
                    display: flex;
                    justify-content: center;
                    gap: 1rem;
                }

                .cancel-button, .confirm-button, .delete-button {
                    padding: 0.75rem 1.5rem;
                    border: none;
                    border-radius: 6px;
                    cursor: pointer;
                    font-size: 1rem;
                    min-width: 100px;
                    transition: background-color 0.3s;
                }

                .cancel-button {
                    background-color: #e74c3c;
                    color: white;
                }

                .confirm-button {
                    background-color: #4CAF50;
                    color: white;
                }

                .delete-button {
                    background-color: #e74c3c;
                    color: white;
                }

                .device-types-list {
                    background-color: white;
                    border-radius: 12px;
                    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
                    overflow: hidden;
                }

                .device-type-item {
                    padding: 1.5rem;
                    border-bottom: 1px solid #e1e8ed;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    transition: background-color 0.3s;
                }

                .device-type-item:hover {
                    background-color: #f8f9fa;
                }

                .device-type-info h3 {
                    margin: 0;
                    font-size: 1.25rem;
                    color: #2c3e50;
                }

                .device-type-info p {
                    margin: 0.5rem 0 0;
                    color: #5f6368;
                    line-height: 1.5;
                }

                .action-buttons {
                    display: flex;
                    gap: 0.75rem;
                }

                .edit-button, .delete-button {
                    padding: 0.5rem 1rem;
                    color: white;
                    border: none;
                    border-radius: 4px;
                    cursor: pointer;
                    transition: background-color 0.3s;
                    min-width: 80px;
                }

                .edit-button {
                    background-color: #3498db;
                }

                .edit-button:hover {
                    background-color: #2980b9;
                }

                .delete-button {
                    background-color: #e74c3c;
                }

                .delete-button:hover {
                    background-color: #c0392b;
                }

                .no-data {
                    text-align: center;
                    color: #666;
                    font-size: 1.125rem;
                    margin-top: 2.5rem;
                }

                .loading {
                    text-align: center;
                    color: #666;
                    font-size: 1.125rem;
                    padding: 2.5rem;
                }
            `}</style>
        </div>
    );
}

export default DeviceTypes;
