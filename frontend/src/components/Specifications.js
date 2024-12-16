import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';

function Specifications() {
    const navigate = useNavigate();
    const { deviceTypeId } = useParams();
    const [specifications, setSpecifications] = useState([]);
    const [deviceType, setDeviceType] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showAddDialog, setShowAddDialog] = useState(false);
    const [showEditDialog, setShowEditDialog] = useState(false);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [newSpecName, setNewSpecName] = useState('');
    const [editSpecName, setEditSpecName] = useState('');
    const [selectedSpecId, setSelectedSpecId] = useState(null);

    useEffect(() => {
        if (deviceTypeId) {
            // Lấy thông tin loại thiết bị
            fetch(`http://localhost:5000/api/device-types/${deviceTypeId}`)
                .then(response => response.json())
                .then(data => {
                    setDeviceType(data);
                })
                .catch(err => {
                    console.error('Lỗi khi lấy thông tin loại thiết bị:', err);
                });

            // Lấy thông số kỹ thuật
            fetch(`http://localhost:5000/api/specifications/${deviceTypeId}`)
                .then(response => response.json())
                .then(data => {
                    setSpecifications(data);
                    setLoading(false);
                })
                .catch(err => {
                    console.error('Lỗi khi lấy thông số kỹ thuật:', err);
                    setError('Không thể tải thông số kỹ thuật');
                    setLoading(false);
                });
        }
    }, [deviceTypeId]);

    const handleAdd = () => {
        if (!newSpecName.trim()) {
            alert('Vui lòng nhập tên thông số kỹ thuật!');
            return;
        }

        fetch('http://localhost:5000/api/specifications', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                device_type: deviceTypeId,
                spec_name: newSpecName
            })
        })
        .then(response => response.json())
        .then(data => {
            if (data.message === 'Thêm thông số kỹ thuật thành công') {
                // Refresh danh sách thông số
                fetch(`http://localhost:5000/api/specifications/${deviceTypeId}`)
                    .then(response => response.json())
                    .then(data => {
                        setSpecifications(data);
                    });
                setShowAddDialog(false);
                setNewSpecName('');
            } else {
                alert('Có lỗi xảy ra khi thêm thông số kỹ thuật!');
            }
        })
        .catch(err => {
            console.error('Lỗi khi thêm thông số kỹ thuật:', err);
            alert('Có lỗi xảy ra khi thêm thông số kỹ thuật!');
        });
    };

    const handleEdit = (id, name) => {
        setSelectedSpecId(id);
        setEditSpecName(name);
        setShowEditDialog(true);
    };
    const confirmEdit = () => {
        if (!editSpecName.trim()) {
            alert('Vui lòng nhập tên thông số kỹ thuật!');
            return;
        }

        fetch(`http://localhost:5000/api/specifications/${selectedSpecId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ spec_name: editSpecName })
        })
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                alert(data.error);
                return;
            }
            if (data.message === 'Sửa thông số kỹ thuật thành công') {
                setSpecifications(specifications.map(spec => 
                    spec.id === selectedSpecId ? {...spec, spec_name: editSpecName} : spec
                ));
                setShowEditDialog(false);
                setEditSpecName('');
            } else {
                alert('Có lỗi xảy ra khi sửa thông số kỹ thuật!');
            }
        })
        .catch(err => {
            console.error('Lỗi khi sửa thông số kỹ thuật:', err);
            alert('Có lỗi xảy ra khi sửa thông số kỹ thuật!');
        });
    };
    const handleDelete = (id) => {
        setSelectedSpecId(id);
        setShowDeleteDialog(true);
    };

    const confirmDelete = () => {
        fetch(`http://localhost:5000/api/specifications/${selectedSpecId}`, {
            method: 'DELETE'
        })
        .then(response => response.json())
        .then(data => {
            if (data.message === 'Xóa thông số kỹ thuật thành công') {
                setSpecifications(specifications.filter(spec => spec.id !== selectedSpecId));
                setShowDeleteDialog(false);
            } else {
                alert('Có lỗi xảy ra khi xóa thông số kỹ thuật!');
            }
        })
        .catch(err => {
            console.error('Lỗi khi xóa thông số kỹ thuật:', err);
            alert('Có lỗi xảy ra khi xóa thông số kỹ thuật!');
        });
    };
    
    const handleViewSpecificationDetail = (specificationId) => {
        navigate(`/specification-detail/${specificationId}`);
    };

    if (loading) return <div className="loading-state">Đang tải thông số kỹ thuật...</div>;
    if (error) return <div className="error-state">{error}</div>;
    /*if (!specifications.length) return <div className="empty-state">
                                            <h3>Không có thông số kỹ thuật nào.</h3>
                                        </div>;*/

    return (
        <div className="specifications-container">        
            <div>
                <div className="specifications-header">
                    <h2>Thông số kỹ thuật {deviceType && `của ${deviceType.map(type => type.name)}`}</h2>
                    <button className="add-button" onClick={() => setShowAddDialog(true)}>
                        Thêm thông số
                    </button>
                </div>
                {!specifications.length && (
                    <div className="empty-state">
                        <h3>Không có thông số kỹ thuật nào.</h3>
                    </div>
                )}          
                <div className="specifications-list">
                    {specifications.map(spec => (
                        <div key={spec.id} className="specification-item">
                            <span className="spec-name" onClick={() => handleViewSpecificationDetail(spec.id)} style={{cursor: 'pointer'}}>{spec.spec_name}</span>
                            <div className="action-buttons">
                                <button className="edit-button" onClick={() => handleEdit(spec.id, spec.spec_name)}>
                                    Sửa
                                </button>
                                <button className="delete-button" onClick={() => handleDelete(spec.id)}>
                                    Xóa
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
            
            {showAddDialog && (
                <div className="dialog-overlay">
                    <div className="dialog-content">
                        <h3>Thêm thông số kỹ thuật mới</h3>
                        <input
                            type="text"
                            value={newSpecName}
                            onChange={(e) => setNewSpecName(e.target.value)}
                            placeholder="Nhập tên thông số kỹ thuật"
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
                        <h3>Sửa thông số kỹ thuật</h3>
                        <input
                            type="text"
                            value={editSpecName}
                            onChange={(e) => setEditSpecName(e.target.value)}
                            placeholder="Nhập tên thông số kỹ thuật"
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
                        <p>Bạn có chắc chắn muốn xóa thông số kỹ thuật này?</p>
                        <div className="button-group">
                            <button className="cancel-button" onClick={() => setShowDeleteDialog(false)}>
                                Hủy
                            </button>
                            <button className="confirm-button" onClick={confirmDelete}>
                                Xóa
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <style jsx>{`
                .specifications-container {
                    max-width: 800px;
                    margin: 20px auto;
                    padding: 25px;
                    background: white;
                    border-radius: 12px;
                    box-shadow: 0 4px 6px rgba(0,0,0,0.1);
                }

                .specifications-header {
                    margin-bottom: 25px;
                    padding-bottom: 15px;
                    border-bottom: 2px solid #eee;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }

                .add-button {
                    padding: 10px 20px;
                    background: #4CAF50;
                    color: white;
                    border: none;
                    border-radius: 6px;
                    cursor: pointer;
                    font-size: 14px;
                    transition: background 0.3s;
                }

                .add-button:hover {
                    background: #45a049;
                }

                h2 {
                    color: #1a237e;
                    font-size: 24px;
                    margin-bottom: 10px;
                }

                h3 {
                    color: #303f9f;
                    font-size: 18px;
                    font-weight: 500;
                }

                .specifications-list {
                    display: grid;
                    gap: 15px;
                }

                .specification-item {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 15px;
                    background: #f8f9fa;
                    border-radius: 8px;
                    transition: all 0.3s ease;
                }

                .specification-item:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
                }

                .spec-name {
                    font-weight: 600;
                    color: #34495e;
                    flex: 1;
                }

                .action-buttons {
                    display: flex;
                    gap: 10px;
                }

                .edit-button,
                .delete-button {
                    padding: 6px 12px;
                    border: none;
                    border-radius: 4px;
                    cursor: pointer;
                    font-size: 14px;
                    transition: background 0.3s;
                }

                .edit-button {
                    background: #3498db;
                    color: white;
                }

                .edit-button:hover {
                    background: #2980b9;
                }

                .delete-button {
                    background: #e74c3c;
                    color: white;
                }

                .delete-button:hover {
                    background: #c0392b;
                }

                .loading-state,
                .error-state,
                .empty-state {
                    text-align: center;
                    padding: 40px;
                    color: #666;
                    font-size: 16px;
                    background: white;
                    border-radius: 8px;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                }

                .error-state {
                    color: #e74c3c;
                }

                .dialog-overlay {
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

                .dialog-content {
                    background: white;
                    padding: 20px;
                    border-radius: 8px;
                    width: 400px;
                }

                .input-field {
                    width: 100%;
                    padding: 8px;
                    margin: 10px 0;
                    border: 1px solid #ddd;
                    border-radius: 4px;
                }

                .button-group {
                    display: flex;
                    justify-content: flex-end;
                    gap: 10px;
                    margin-top: 20px;
                }

                .cancel-button,
                .confirm-button {
                    padding: 8px 16px;
                    border: none;
                    border-radius: 4px;
                    cursor: pointer;
                }

                .cancel-button {
                    background: #e74c3c;
                    color: white;
                }

                .confirm-button {
                    background: #4CAF50;
                    color: white;
                }
            `}</style>
        </div>
    );
}

export default Specifications;
