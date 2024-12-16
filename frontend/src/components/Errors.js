import React, { useState, useEffect } from 'react';

function Errors() {
    const [errors, setErrors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAddDialog, setShowAddDialog] = useState(false);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [showEditDialog, setShowEditDialog] = useState(false);
    const [selectedErrorId, setSelectedErrorId] = useState(null);
    const [newErrorName, setNewErrorName] = useState('');
    const [newErrorDescription, setNewErrorDescription] = useState('');
    const [editErrorName, setEditErrorName] = useState('');
    const [editErrorDescription, setEditErrorDescription] = useState('');

    useEffect(() => {
        fetch('http://localhost:5000/api/errors')
            .then(response => response.json())
            .then(data => {
                setErrors(data);
                setLoading(false);
            })
            .catch(err => {
                console.error('Lỗi khi lấy dữ liệu lỗi thường gặp:', err);
                setLoading(false);
            });
    }, []);

    const handleEdit = (error) => {
        setSelectedErrorId(error.id);
        setEditErrorName(error.name);
        setEditErrorDescription(error.description);
        setShowEditDialog(true);
    };

    const confirmEdit = () => {
        if (!editErrorName.trim()) {
            alert('Vui lòng nhập tên lỗi!');
            return;
        }

        fetch(`http://localhost:5000/api/errors/${selectedErrorId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ name: editErrorName, description: editErrorDescription })
        })
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                alert(data.error);
                return;
            }
            if (data.message === 'Sửa lỗi thường gặp thành công') {
                setErrors(errors.map(error => 
                    error.id === selectedErrorId ? {...error, name: editErrorName, description: editErrorDescription} : error
                ));
                setShowEditDialog(false);
                setEditErrorName('');
                setEditErrorDescription('');
            } else {
                alert('Có lỗi xảy ra khi sửa lỗi!');
            }
        })
        .catch(err => {
            console.error('Lỗi khi sửa lỗi:', err);
            alert('Có lỗi xảy ra khi sửa lỗi!');
        });
    };

    const handleAdd = () => {
        if (!newErrorName.trim()) {
            alert('Vui lòng nhập tên lỗi!');
            return;
        }

        fetch('http://localhost:5000/api/errors', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ name: newErrorName, description: newErrorDescription })
        })
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                alert(data.error);
                return;
            }
            if (data.message === 'Thêm lỗi thường gặp thành công') {
                fetch('http://localhost:5000/api/errors')
                    .then(response => response.json())
                    .then(data => {
                        setErrors(data);
                    });
                setShowAddDialog(false);
                setNewErrorName('');
                setNewErrorDescription('');
            } else {
                alert('Có lỗi xảy ra khi thêm lỗi!');
            }
        })
        .catch(err => {
            console.error('Lỗi khi thêm lỗi:', err);
            alert('Có lỗi xảy ra khi thêm lỗi!');
        });
    };

    const handleDelete = (error) => {
        setSelectedErrorId(error.id);
        setShowDeleteDialog(true);
    };

    const confirmDelete = () => {
        fetch(`http://localhost:5000/api/errors/${selectedErrorId}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json'
            }
        })
        .then(response => response.json())
        .then(data => {
            if (data.message === 'Xóa lỗi thường gặp thành công') {
                setErrors(errors.filter(error => error.id !== selectedErrorId));
                setShowDeleteDialog(false);
            } else if (data.error === 'Không tìm thấy lỗi') {
                console.error('Không tìm thấy lỗi để xóa');
                setShowDeleteDialog(false);
            } else {
                console.error('Lỗi server khi xóa lỗi');
                setShowDeleteDialog(false);
            }
        })
        .catch(err => {
            console.error('Lỗi khi gửi request xóa:', err);
            setShowDeleteDialog(false);
        });
    };

    if (loading) {
        return (
            <div className="loading-container">
                Đang tải dữ liệu...
            </div>
        );
    }

    return (
        <div className="rooms-container">
            <div className="rooms-header">
                <h1>Danh sách lỗi thường gặp</h1>
                <button className="add-button" onClick={() => setShowAddDialog(true)}>
                    Thêm mới
                </button>
            </div>

            {showAddDialog && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h3>Thêm lỗi mới</h3>
                        <input
                            type="text"
                            value={newErrorName}
                            onChange={(e) => setNewErrorName(e.target.value)}
                            placeholder="Nhập tên lỗi"
                            className="modal-input"
                        />
                        <input
                            type="text"
                            value={newErrorDescription}
                            onChange={(e) => setNewErrorDescription(e.target.value)}
                            placeholder="Nhập mô tả lỗi"
                            className="modal-input"
                        />
                        <div className="modal-buttons">
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
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h3>Sửa lỗi</h3>
                        <input
                            type="text"
                            value={editErrorName}
                            onChange={(e) => setEditErrorName(e.target.value)}
                            placeholder="Nhập tên lỗi mới"
                            className="modal-input"
                        />
                        <input
                            type="text"
                            value={editErrorDescription}
                            onChange={(e) => setEditErrorDescription(e.target.value)}
                            placeholder="Nhập mô tả lỗi mới"
                            className="modal-input"
                        />
                        <div className="modal-buttons">
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
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h3>Xác nhận xóa</h3>
                        <p className="delete-message">
                            Bạn có chắc chắn muốn xóa lỗi này?
                        </p>
                        <div className="modal-buttons">
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

            {errors.length > 0 ? (
                <div className="table-container">
                <table className="errors-table">
                    <thead>
                        <tr>
                            <th>Tên lỗi</th>
                            <th>Mô tả</th>
                            <th>Thao tác</th>
                        </tr>
                    </thead>
                    <tbody>
                        {errors.map(error => (
                            <tr key={error.id}>
                                <td>{error.name}</td>
                                <td>{error.description}</td>
                                <td className="action-buttons">
                                    <button 
                                        className="edit-btn"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleEdit(error);
                                        }}
                                    >
                                        Sửa
                                    </button>
                                    <button 
                                        className="delete-btn"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleDelete(error);
                                        }}
                                    >
                                        Xóa
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            ) : (
                <p className="no-errors">Không có lỗi nào.</p>
            )}

            <style jsx>{`
                .errors-container {
                    padding: 2rem;
                    max-width: 1200px;
                    margin: 0 auto;
                }
                .table-container {
                    width: 100%;
                    background-color: #fff;
                    border-radius: 12px;
                    box-shadow: 0 6px 16px rgba(0,0,0,0.1);
                    overflow: hidden;
                    border: 1px solid #e0e0e0;
                }

                .errors-table {
                    width: 100%;
                    border-collapse: separate;
                    border-spacing: 0;
                }

                .errors-table th,
                .errors-table td {
                    padding: 16px;
                    border: 1px solid #e0e0e0;
                }

                .errors-table th {
                    background-color: #1a73e8;
                    color: white;
                    font-weight: 600;
                    font-size: 15px;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                }

                .errors-table tr {
                    transition: all 0.3s;
                }

                .errors-table tr:hover {
                    background-color: #f8f9fa;
                    transform: scale(1.01);
                }

                .action-buttons {
                    display: flex;
                    justify-content: center;
                    gap: 12px;
                }
                .errors-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 2rem;
                }

                .errors-header h1 {
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
                    transition: all 0.3s ease;
                    margin:10px;
                }

                .add-button:hover {
                    background-color: #45a049;
                    transform: translateY(-2px);
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

                .modal-overlay {
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

                .modal-content {
                    background-color: white;
                    padding: 2rem;
                    border-radius: 12px;
                    width: 400px;
                    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
                }

                .modal-content h3 {
                    margin: 0 0 1.5rem;
                    font-size: 1.5rem;
                    color: #2c3e50;
                    text-align: center;
                }

                .modal-input {
                    width: 100%;
                    padding: 0.75rem;
                    margin-bottom: 0.5rem;
                    border-radius: 6px;
                    border: 2px solid #e1e8ed;
                    font-size: 1rem;
                    box-sizing: border-box;
                    transition: border-color 0.3s ease;
                }

                .modal-input:focus {
                    border-color: #4CAF50;
                    outline: none;
                }

                .modal-buttons {
                    display: flex;
                    justify-content: center;
                    gap: 1rem;
                }

                .cancel-button,
                .confirm-button,
                .delete-button {
                    padding: 0.75rem 1.5rem;
                    border: none;
                    border-radius: 6px;
                    cursor: pointer;
                    font-size: 1rem;
                    min-width: 100px;
                    transition: all 0.3s ease;
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

                .cancel-button:hover,
                .confirm-button:hover,
                .delete-button:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
                }
                .delete-message {
                    text-align: center;
                    color: #5f6368;
                    margin-bottom: 1.5rem;
                }

                .loading-container {
                    text-align: center;
                    padding: 2rem;
                    font-size: 1.125rem;
                    color: #666;
                }
            `}</style>
        </div>
    );
}

export default Errors;
