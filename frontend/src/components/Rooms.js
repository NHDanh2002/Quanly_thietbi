import React, { useState, useEffect } from 'react';

function Rooms() {
    const [rooms, setRooms] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAddDialog, setShowAddDialog] = useState(false);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [showEditDialog, setShowEditDialog] = useState(false);
    const [selectedRoomId, setSelectedRoomId] = useState(null);
    const [newRoomName, setNewRoomName] = useState('');
    const [editRoomName, setEditRoomName] = useState('');

    useEffect(() => {
        fetch('http://localhost:5000/api/rooms')
            .then(response => response.json())
            .then(data => {
                setRooms(data);
                setLoading(false);
            })
            .catch(err => {
                console.error('Lỗi khi lấy dữ liệu phòng:', err);
                setLoading(false);
            });
    }, []);

    const handleEdit = (id, name) => {
        setSelectedRoomId(id);
        setEditRoomName(name);
        setShowEditDialog(true);
    };

    const confirmEdit = () => {
        if (!editRoomName.trim()) {
            alert('Vui lòng nhập tên phòng!');
            return;
        }

        fetch(`http://localhost:5000/api/rooms/${selectedRoomId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ name: editRoomName })
        })
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                alert(data.error);
                return;
            }
            if (data.message === 'Sửa phòng thành công') {
                setRooms(rooms.map(room => 
                    room.id === selectedRoomId ? {...room, name: editRoomName} : room
                ));
                setShowEditDialog(false);
                setEditRoomName('');
            } else {
                alert('Có lỗi xảy ra khi sửa phòng!');
            }
        })
        .catch(err => {
            console.error('Lỗi khi sửa phòng:', err);
            alert('Có lỗi xảy ra khi sửa phòng!');
        });
    };

    const handleAdd = () => {
        if (!newRoomName.trim()) {
            alert('Vui lòng nhập tên phòng!');
            return;
        }

        fetch('http://localhost:5000/api/rooms', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ name: newRoomName })
        })
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                alert(data.error);
                return;
            }
            if (data.message === 'Thêm phòng thành công') {
                fetch('http://localhost:5000/api/rooms')
                    .then(response => response.json())
                    .then(data => {
                        setRooms(data);
                    });
                setShowAddDialog(false);
                setNewRoomName('');
            } else {
                alert('Có lỗi xảy ra khi thêm phòng!');
            }
        })
        .catch(err => {
            console.error('Lỗi khi thêm phòng:', err);
            alert('Có lỗi xảy ra khi thêm phòng!');
        });
    };

    const handleDelete = (id) => {
        setSelectedRoomId(id);
        setShowDeleteDialog(true);
    };

    const confirmDelete = () => {
        fetch(`http://localhost:5000/api/rooms/${selectedRoomId}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json'
            }
        })
        .then(response => response.json())
        .then(data => {
            if (data.message === 'Xóa phòng thành công') {
                setRooms(rooms.filter(room => room.id !== selectedRoomId));
                setShowDeleteDialog(false);
            } else if (data.error === 'Không tìm thấy phòng') {
                console.error('Không tìm thấy phòng để xóa');
                setShowDeleteDialog(false);
            } else {
                console.error('Lỗi server khi xóa phòng');
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
                <h1>Danh sách phòng</h1>
                <button className="add-button" onClick={() => setShowAddDialog(true)}>
                    Thêm mới
                </button>
            </div>

            {showAddDialog && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h3>Thêm phòng mới</h3>
                        <input
                            type="text"
                            value={newRoomName}
                            onChange={(e) => setNewRoomName(e.target.value)}
                            placeholder="Nhập tên phòng"
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
                        <h3>Sửa phòng</h3>
                        <input
                            type="text"
                            value={editRoomName}
                            onChange={(e) => setEditRoomName(e.target.value)}
                            placeholder="Nhập tên phòng mới"
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
                            Bạn có chắc chắn muốn xóa phòng này?
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

            {rooms.length > 0 ? (
                <div className="rooms-list">
                    {rooms.map(room => (
                        <div key={room.id} className="room-item">
                            <div className="room-info">
                                <h3>{room.name}</h3>
                                <p>{room.description}</p>
                            </div>
                            <div className="room-actions">
                                <button 
                                    className="edit-button"
                                    onClick={() => handleEdit(room.id, room.name)}
                                >
                                    Sửa
                                </button>
                                <button 
                                    className="delete-button"
                                    onClick={() => handleDelete(room.id)}
                                >
                                    Xóa
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <p className="no-rooms">Không có phòng nào.</p>
            )}

            <style jsx>{`
                .rooms-container {
                    padding: 2rem;
                    max-width: 1200px;
                    margin: 0 auto;
                }

                .rooms-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 2rem;
                }

                .rooms-header h1 {
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
                }

                .add-button:hover {
                    background-color: #45a049;
                    transform: translateY(-2px);
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
                    margin-bottom: 1.5rem;
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

                .rooms-list {
                    background-color: white;
                    border-radius: 12px;
                    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
                    overflow: hidden;
                }

                .room-item {
                    padding: 1.5rem;
                    border-bottom: 1px solid #e1e8ed;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    transition: background-color 0.3s ease;
                }

                .room-item:hover {
                    background-color: #f8f9fa;
                }

                .room-info h3 {
                    margin: 0;
                    font-size: 1.25rem;
                    color: #2c3e50;
                }

                .room-info p {
                    margin: 0.5rem 0 0;
                    color: #5f6368;
                    line-height: 1.5;
                }

                .room-actions {
                    display: flex;
                    gap: 0.75rem;
                }

                .room-actions button {
                    padding: 0.5rem 1rem;
                    border: none;
                    border-radius: 6px;
                    cursor: pointer;
                    font-size: 0.875rem;
                    transition: all 0.3s ease;
                    width: 80px;
                }

                .edit-button {
                    background-color: #1a73e8;
                    color: white;
                }

                .edit-button:hover {
                    background-color: #1557b0;
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

                .no-rooms {
                    text-align: center;
                    color: #666;
                    font-size: 1.125rem;
                    margin-top: 2.5rem;
                }
            `}</style>
        </div>
    );
}

export default Rooms;
