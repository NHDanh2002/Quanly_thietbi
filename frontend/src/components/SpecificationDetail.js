import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';

function SpecificationDetail() {
    const { specificationId } = useParams();
    const [specification, setSpecification] = useState([]);
    const [specificationDetail, setSpecificationDetail] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showAddDialog, setShowAddDialog] = useState(false);
    const [showEditDialog, setShowEditDialog] = useState(false);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [newSpecValue, setNewSpecValue] = useState('');
    const [editSpecValue, setEditSpecValue] = useState('');
    const [selectedSpecId, setSelectedSpecId] = useState(null);

    useEffect(() => {
        if (specificationId) {
            // Lấy thông số kỹ thuật theo id
            fetch(`http://localhost:5000/api/specification/${specificationId}`)
                .then(response => response.json())
                .then(data => {
                    setSpecification(data);
                })
                .catch(err => {
                    console.error('Lỗi khi lấy thông số kỹ thuật:', err);
                });

            // Lấy chi tiết thông số kỹ thuật
            fetch(`http://localhost:5000/api/specification_detail/${specificationId}`)
                .then(response => response.json())
                .then(data => {
                    setSpecificationDetail(data);
                    setLoading(false);
                })
                .catch(err => {
                    console.error('Lỗi khi lấy thông số kỹ thuật:', err);
                    setError('Không thể tải thông số kỹ thuật');
                    setLoading(false);
                });
        }
    }, [specificationId]);

    const handleAdd = () => {
        if (!newSpecValue.trim()) {
            alert('Vui lòng nhập giá trị thông số kỹ thuật!');
            return;
        }
        fetch('http://localhost:5000/api/specification_detail', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                spec_name: specificationId,
                spec_value: newSpecValue
            })
        })
        .then(response => response.json())
        .then(data => {
            if (data.message === 'Thêm chi tiết thông số kỹ thuật thành công') {
                // Refresh danh sách chi tiết thông số
                fetch(`http://localhost:5000/api/specification_detail/${specificationId}`)
                    .then(response => response.json())
                    .then(data => {
                        setSpecificationDetail(data);
                    });
                setShowAddDialog(false);
                setNewSpecValue('');
            } else {
                alert('Có lỗi xảy ra khi thêm chi tiết thông số kỹ thuật!!!');
            }
        })
        .catch(err => {
            console.error('Lỗi khi thêm chi tiết thông số kỹ thuật:', err);
            alert('Có lỗi xảy ra khi thêm chi tiết thông số kỹ thuật!');
        });
    };

    const handleEdit = (id, value) => {
        setSelectedSpecId(id);
        setEditSpecValue(value);
        setShowEditDialog(true);
    };
    const confirmEdit = () => {
        if (!editSpecValue.trim()) {
            alert('Vui lòng nhập giá trị chi tiết thông số kỹ thuật!');
            return;
        }

        fetch(`http://localhost:5000/api/specification_detail/edit/${selectedSpecId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ spec_value: editSpecValue })
        })
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                alert(data.error);
                return;
            }
            if (data.message === 'Sửa chi tiết thông số kỹ thuật thành công') {
                setSpecificationDetail(specificationDetail.map(spec => 
                    spec.id === selectedSpecId ? {...spec, spec_value: editSpecValue} : spec
                ));
                setShowEditDialog(false);
                setEditSpecValue('');
            } else {
                alert('Có lỗi xảy ra khi sửa chi tiết thông số kỹ thuật!');
            }
        })
        .catch(err => {
            console.error('Lỗi khi sửa chi tiết thông số kỹ thuật:', err);
            alert('Có lỗi xảy ra khi sửa chi tiết thông số kỹ thuật!');
        });
    };
    const handleDelete = (id) => {
        setSelectedSpecId(id);
        setShowDeleteDialog(true);
    };

    const confirmDelete = () => {
        fetch(`http://localhost:5000/api/specification_detail/delete/${selectedSpecId}`, {
            method: 'DELETE'
        })
        .then(response => response.json())
        .then(data => {
            if (data.message === 'Xóa chi tiết thông số kỹ thuật thành công') {
                setSpecificationDetail(specificationDetail.filter(spec => spec.id !== selectedSpecId));
                setShowDeleteDialog(false);
            } else {
                alert('Có lỗi xảy ra khi xóa chi tiết thông số kỹ thuật!');
            }
        })
        .catch(err => {
            console.error('Lỗi khi xóa chi tiết thông số kỹ thuật:', err);
            alert('Có lỗi xảy ra khi xóa chi tiết thông số kỹ thuật!');
        });
    };

    if (loading) return <div className="loading-state">Đang tải thông số kỹ thuật...</div>;
    if (error) return <div className="error-state">{error}</div>;
    return (
        <div className="specifications-container">        
            <div>
                <div className="specifications-header">
                    <h2>{specification && `${specification.map(type => type.spec_name)}`} gồm các loại</h2>
                    <button className="add-button" onClick={() => setShowAddDialog(true)}>
                        Thêm mới
                    </button>
                </div>
                {!specificationDetail.length && (
                    <div className="empty-state">
                        <h3>Không có loại nào thuộc {specification && `${specification.map(type => type.spec_name)}`}.</h3>
                    </div>
                )}          
                <div className="specifications-list">
                    {specificationDetail.map(spec => (
                        <div key={spec.id} className="specification-item">
                                <span className="spec-name">{spec.spec_value}</span>
                            <div className="action-buttons">
                                <button className="edit-button" onClick={() => handleEdit(spec.id, spec.spec_value)}>
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
                        <h3>Thêm {specification && `${specification.map(type => type.spec_name)}`} mới</h3>
                        <input
                            type="text"
                            required
                            value={newSpecValue}
                            onChange={(e) => setNewSpecValue(e.target.value)}
                            placeholder="Nhập giá trị thông số kỹ thuật"
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
                        <h3>Sửa thông tin loại {specification && `${specification.map(type => type.spec_name)}`} này</h3>
                        <input
                            type="text"
                            value={editSpecValue}
                            onChange={(e) => setEditSpecValue(e.target.value)}
                            placeholder="Nhập giá trị thông số kỹ thuật"
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
                        <p>Bạn có chắc chắn muốn xóa loại {specification && `${specification.map(type => type.spec_name)}`} này không?</p>
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

export default SpecificationDetail;
