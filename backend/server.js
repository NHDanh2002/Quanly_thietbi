const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const axios = require('axios');
const mysql = require('mysql2')
const WebSocket = require('ws');

require('dotenv').config();

const app = express();
app.get('/', (re, res) => {
    return res.json("BACKEND!")
})
// Middleware
app.use(cors());
const db = require('./db')
const wss = new WebSocket.Server({ port: 8080 });
wss.on('connection', (ws) => {
    console.log('Client connected');
    ws.on('close', () => console.log('Client disconnected'));
});
// Kiểm tra số lượng thiết bị hỏng và gửi thông báo qua WebSocket
setInterval(() => {
    const query = "SELECT COUNT(*) as errorCount FROM devices WHERE status = 'Hỏng'";
    db.query(query, (err, results) => {
        if (err) {
            console.error('Lỗi khi đếm thiết bị hỏng:', err);
            return;
        }

        const errorCount = results[0].errorCount;
        
        // Gửi số lượng thiết bị hỏng cho tất cả clients
        wss.clients.forEach((client) => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify({
                    type: 'errorCount',
                    count: errorCount
                }));
            }
        });
    });
}, 1000);

//Kiểm tra nếu có 1 loại thiết bị mới được thêm vào thì báo cho các client biết
function notifyClients(data) {
    wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(data));
        }
    });
}

app.use(bodyParser.json());
//Xử lý lấy danh sách loại thiết bị
app.get('/api/error-devices/count', (req, res) => {
    const query = "SELECT COUNT(*) as errorCount FROM devices WHERE status = 'Hỏng'";
    
    db.query(query, (err, results) => {
        if (err) {
            console.error('Lỗi khi đếm thiết bị lỗi:', err);
            return res.status(500).json({ error: 'Lỗi server' });
        }
        
        res.json({ count: results[0].errorCount });
    });
});
app.get('/api/device-types', (req, res) => {
    const query = 'SELECT * FROM device_types'; // Bảng chứa loại thiết bị
    db.query(query, (err, results) => {
        if (err) {
            console.error('Lỗi khi truy vấn database:', err);
            return res.status(500).json({ error: 'Lỗi server' });
        }
        res.json(results);
    });
});
//Xử lý xóa loại thiết bị
app.delete('/api/device-types/:id', (req, res) => {
    const deviceTypeId = req.params.id;
    const query = 'DELETE FROM device_types WHERE id = ?';
    
    db.query(query, [deviceTypeId], (err, result) => {
        if (err) {
            console.error('Lỗi khi xóa loại thiết bị:', err);
            return res.status(500).json({ error: 'Lỗi server khi xóa loại thiết bị' });
        }
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Không tìm thấy loại thiết bị' });
        }
        
        res.json({ message: 'Xóa loại thiết bị thành công' });
        notifyClients({ type: 'deleteDeviceType', deviceType: deviceTypeId });
    });
});
// Xử lý thêm loại thiết bị
app.post('/api/device-types', (req, res) => {
    const { name } = req.body;
    
    // Kiểm tra xem tên loại thiết bị đã được cung cấp chưa
    if (!name || name.trim() === '') {
        return res.status(400).json({ error: 'Tên loại thiết bị không được để trống' });
    }

    // Kiểm tra xem tên loại thiết bị đã tồn tại chưa
    const checkQuery = 'SELECT * FROM device_types WHERE name = ?';
    db.query(checkQuery, [name], (err, results) => {
        if (err) {
            console.error('Lỗi khi kiểm tra loại thiết bị:', err);
            return res.status(500).json({ error: 'Lỗi server khi kiểm tra loại thiết bị' });
        }

        if (results.length > 0) {
            return res.status(400).json({ error: 'Loại thiết bị này đã tồn tại' });
        }

        // Thêm loại thiết bị mới
        const insertQuery = 'INSERT INTO device_types (name) VALUES (?)';
        db.query(insertQuery, [name], (err, result) => {  
            if (err) {
                console.error('Lỗi khi thêm loại thiết bị:', err);
                return res.status(500).json({ error: 'Lỗi server khi thêm loại thiết bị' });
            }
            res.json({ message: 'Thêm loại thiết bị thành công' });
            notifyClients({ type: 'newDeviceType', deviceType: name });
        });
    });
});
//Xử lý sửa loại thiết bị
app.put('/api/device-types/:id', (req, res) => {
    const { name } = req.body;
    const deviceTypeId = req.params.id;
    const query = 'UPDATE device_types SET name = ? WHERE id = ?';
    db.query(query, [name, deviceTypeId], (err, result) => {
        if (err) return res.status(500).json({ error: 'Lỗi server khi sửa loại thiết bị' });
        res.json({ message: 'Sửa loại thiết bị thành công' });
    });
});
//Xử lý lấy danh sách phòng
app.get('/api/rooms', (req, res) => {
    const query = 'SELECT * FROM rooms'; // Bảng chứa phòng
    db.query(query, (err, results) => {
        if (err) {
            console.error('Lỗi khi truy vấn database:', err);
            return res.status(500).json({ error: 'Lỗi server' });
        }
        res.json(results);
    });
});
//Xử lý xóa phòng
app.delete('/api/rooms/:id', (req, res) => {
    const roomId = req.params.id;
    const query = 'DELETE FROM rooms WHERE id = ?';
    
    db.query(query, [roomId], (err, result) => {
        if (err) {
            console.error('Lỗi khi xóa phòng:', err);
            return res.status(500).json({ error: 'Lỗi server khi xóa phòng' });
        }
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Không tìm thấy phòng' });
        }
        
        res.json({ message: 'Xóa phòng thành công' });
    });
});
// Xử lý thêm phòng mới 
app.post('/api/rooms', (req, res) => {
    const { name } = req.body;
    
    // Kiểm tra xem tên phòng đã được cung cấp chưa
    if (!name || name.trim() === '') {
        return res.status(400).json({ error: 'Tên phòng không được để trống' });
    }

    // Kiểm tra xem tên phòng đã tồn tại chưa
    const checkQuery = 'SELECT * FROM rooms WHERE name = ?';
    db.query(checkQuery, [name], (err, results) => {
        if (err) {
            console.error('Lỗi khi kiểm tra phòng:', err);
            return res.status(500).json({ error: 'Lỗi server khi kiểm tra phòng' });
        }

        if (results.length > 0) {
            return res.status(400).json({ error: 'Phòng này đã tồn tại' });
        }

        // Thêm phòng mới
        const insertQuery = 'INSERT INTO rooms (name) VALUES (?)';
        db.query(insertQuery, [name], (err, result) => {  
            if (err) {
                console.error('Lỗi khi thêm phòng:', err);
                return res.status(500).json({ error: 'Lỗi server khi thêm phòng' });
            }
            res.json({ message: 'Thêm phòng thành công' });
        });
    });
});
//Xử lý sửa phòng
app.put('/api/rooms/:id', (req, res) => {
    const { name } = req.body;
    const roomId = req.params.id;
    const query = 'UPDATE rooms SET name = ? WHERE id = ?';
    db.query(query, [name, roomId], (err, result) => {
        if (err) return res.status(500).json({ error: 'Lỗi server khi sửa phòng' });
        res.json({ message: 'Sửa phòng thành công' });
    });
});
//Xử lý lấy danh sách thiết bị
app.get('/api/devices', (req, res) => {
    const query = 'SELECT * FROM devices';
    db.query(query, (err, results) => {
        if (err) return res.status(500).json({ error: 'Lỗi server khi lấy danh sách thiết bị' });
        res.json(results);
    });
});
//xử lý lấy danh sách thiết bị theo loại thiết bị
app.get('/api/devices/:deviceTypeId', (req, res) => {
    const deviceTypeId = req.params.deviceTypeId;
    const query = 'SELECT * FROM devices WHERE type = ?';
    db.query(query, [deviceTypeId], (err, results) => {
        if (err) return res.status(500).json({ error: 'Lỗi server khi lấy danh sách thiết bị' });
        res.json(results);
    });
});
//lấy thiết bị theo id
app.get('/api/device/:id', (req, res) => {
    const deviceId = req.params.id;
    const query = 'SELECT * FROM devices WHERE id = ?';
    db.query(query, [deviceId], (err, results) => {
        if (err) return res.status(500).json({ error: 'Lỗi server khi lấy thiết bị' });
        res.json(results[0]);
    });
});
//xử lý cập nhật trạng thái thiết bị
app.put('/api/devices/:id', (req, res) => {
    const { status } = req.body;
    const deviceId = req.params.id;
    const query = 'UPDATE devices SET status = ? WHERE id = ?';
    db.query(query, [status, deviceId], (err, result) => {
        if (err) return res.status(500).json({ error: 'Lỗi server khi cập nhật trạng thái thiết bị' });
        res.json({ message: 'Cập nhật trạng thái thiết bị thành công' });
    });
});
//xử lý thêm thiết bị
app.post('/api/devices', (req, res) => {
    const { name, type, room, status, start_date, specifications } = req.body;
    
    // Thêm thiết bị vào database trước để lấy ID
    const query = 'INSERT INTO devices (name, type, room, status, start_date, specifications) VALUES (?, ?, ?, ?, ?, ?)';
    db.query(query, [
        name,
        type, 
        room,
        status,
        start_date,
        JSON.stringify(specifications)
    ], (err, result) => {
        if (err) {
            console.error('Lỗi khi thêm thiết bị:', err);
            return res.status(500).json({ error: 'Lỗi server khi thêm thiết bị' });
        }

        const deviceId = result.insertId;
        
        // Tạo URL cho trang chi tiết thiết bị
        const deviceUrl = `http://localhost:3000/device/${deviceId}`;
        
        // Tạo mã QR từ URL
        const qrCode = require('qrcode');
        qrCode.toDataURL(deviceUrl, (err, qrDataUrl) => {
            if (err) {
                console.error('Lỗi khi tạo mã QR:', err);
                return res.status(500).json({ error: 'Lỗi khi tạo mã QR' });
            }

            // Cập nhật mã QR vào database
            const updateQuery = 'UPDATE devices SET qr_code = ? WHERE id = ?';
            db.query(updateQuery, [qrDataUrl, deviceId], (err) => {
                if (err) {
                    console.error('Lỗi khi cập nhật mã QR:', err);
                    return res.status(500).json({ error: 'Lỗi khi cập nhật mã QR' });
                }

                res.json({
                    message: 'Thêm thiết bị thành công',
                    qrCode: qrDataUrl,
                    deviceId: deviceId
                });
            });
        });
    });
});
//xử lý xóa thiết bị
app.delete('/api/devices/:id', (req, res) => {
    const deviceId = req.params.id;
    const query = 'DELETE FROM devices WHERE id = ?';
    db.query(query, [deviceId], (err, result) => {
        if (err) return res.status(500).json({ error: 'Lỗi server khi xóa thiết bị' });
        res.json({ message: 'Xóa thiết bị thành công' });
    });
});
//xử lý sửa thiết bị
app.put('/api/devices/:id', (req, res) => {
    const { name, room, status, start_date, specifications, description } = req.body;
    const deviceId = req.params.id;

    // Kiểm tra dữ liệu đầu vào
    if (!name || !room || !status || !start_date) {
        return res.status(400).json({ error: 'Vui lòng điền đầy đủ thông tin bắt buộc' });
    }

    const query = 'UPDATE devices SET name = ?, room = ?, status = ?, start_date = ?, specifications = ?, description = ? WHERE id = ?';
    
    try {
        // Kiểm tra thiết bị tồn tại trước khi cập nhật
        const checkQuery = 'SELECT * FROM devices WHERE id = ?';
        db.query(checkQuery, [deviceId], (err, results) => {
            if (err) {
                console.error('Lỗi khi kiểm tra thiết bị:', err);
                return res.status(500).json({ error: 'Lỗi server khi kiểm tra thiết bị' });
            }

            if (results.length === 0) {
                return res.status(404).json({ error: 'Không tìm thấy thiết bị để cập nhật' });
            }

            // Thực hiện cập nhật
            db.query(query, [name, room, status, start_date, JSON.stringify(specifications), description, deviceId], (err, result) => {
                if (err) {
                    console.error('Lỗi khi cập nhật thiết bị:', err);
                    return res.status(500).json({ error: 'Lỗi server khi sửa thiết bị' });
                }

                // Trả về kết quả thành công mà không cần kiểm tra lại
                res.json({
                    message: 'Sửa thiết bị thành công',
                    device: {
                        id: deviceId,
                        name,
                        room,
                        status,
                        start_date,
                        specifications,
                        description
                    }
                });
            });
        });
    } catch (error) {
        console.error('Lỗi không mong muốn:', error);
        res.status(500).json({ error: 'Đã xảy ra lỗi khi xử lý yêu cầu' });
    }
});
//xử lý lấy danh sách thiết bị lỗi có join với bảng thiết bị để lấy tên phòng
app.get('/api/error-devices', (req, res) => {
    const query = 'SELECT ed.*, d.name, d.room FROM error_devices ed JOIN devices d ON ed.device_id = d.id';
    db.query(query, (err, results) => {
        if (err) return res.status(500).json({ error: 'Lỗi server khi lấy danh sách thiết bị lỗi' });
        res.json(results);
    });
});
app.get('/api/specifications/:deviceTypeId', (req, res) => {
    const deviceTypeId = req.params.deviceTypeId;
    const query = 'SELECT * FROM specifications WHERE device_type = ?';
    db.query(query, [deviceTypeId], (err, results) => {
        if (err) return res.status(500).json({ error: 'Lỗi server khi lấy danh sách thông số kỹ thuật' });
        res.json(results);
    });
});
//xử lý lấy loại thiết bị theo id
app.get('/api/device-types/:deviceTypeId', (req, res) => {
    const deviceTypeId = req.params.deviceTypeId;
    const query = 'SELECT * FROM device_types WHERE id = ?';
    db.query(query, [deviceTypeId], (err, results) => {
        if (err) return res.status(500).json({ error: 'Lỗi server khi lấy loại thiết bị' });
        res.json(results);
    });
});
//xử lý thêm thông số kỹ thuật
app.post('/api/specifications', (req, res) => {
    const { device_type, spec_name } = req.body;
    const query = 'INSERT INTO specifications (device_type, spec_name) VALUES (?, ?)';
    db.query(query, [device_type, spec_name], (err, result) => {
        if (err) return res.status(500).json({ error: 'Lỗi server khi thêm thông số kỹ thuật' });
        res.json({ message: 'Thêm thông số kỹ thuật thành công' });
    });
});
//xử lý sửa thông số kỹ thuật
app.put('/api/specifications/:id', (req, res) => {
    const { spec_name } = req.body;
    const id = req.params.id;
    const query = 'UPDATE specifications SET spec_name = ? WHERE id = ?';
    db.query(query, [spec_name, id], (err, result) => {
        if (err) return res.status(500).json({ error: 'Lỗi server khi sửa thông số kỹ thuật' });
        res.json({ message: 'Sửa thông số kỹ thuật thành công' });
    });
});
//Xử lý lấy thông số kỹ thuật theo id
app.get('/api/specification/:specificationId', (req, res) => {
    const specificationId = req.params.specificationId;
    const query = 'SELECT * FROM specifications WHERE id = ?';
    db.query(query, [specificationId], (err, results) => {
        if (err) return res.status(500).json({ error: 'Lỗi server khi lấy thông số kỹ thuật' });
        res.json(results);
    });
});
//xử lý xóa thông số kỹ thuật
app.delete('/api/specifications/:id', (req, res) => {
    const id = req.params.id;
    const query = 'DELETE FROM specifications WHERE id = ?';
    db.query(query, [id], (err, result) => {
        if (err) return res.status(500).json({ error: 'Lỗi server khi xóa thông số kỹ thuật' });
        res.json({ message: 'Xóa thông số kỹ thuật thành công' });
    });
});
//xử lý lấy chi tiết thông số kỹ thuật theo thông số kỹ thuật
app.get('/api/specification_detail/:specificationId', (req, res) => {
    const specificationId = req.params.specificationId;
    const query = 'SELECT * FROM specification_detail WHERE spec_name = ?';
    db.query(query, [specificationId], (err, results) => {
        if (err) return res.status(500).json({ error: 'Lỗi server khi lấy danh sách chi tiết thông số kỹ thuật' });
        res.json(results);
    });
});
//xử lý thêm chi tiết thông số kỹ thuật
app.post('/api/specification_detail', (req, res) => {
    const { spec_name, spec_value } = req.body;
    const query = 'INSERT INTO specification_detail (spec_name, spec_value) VALUES (?, ?)';
    db.query(query, [spec_name, spec_value], (err, result) => {
        if (err) return res.status(500).json({ error: 'Lỗi server khi thêm chi tiết thông số kỹ thuật' });
        res.json({ message: 'Thêm chi tiết thông số kỹ thuật thành công' });
    });
});
//xử lý sửa chi tiết thông số kỹ thuật
app.put('/api/specification_detail/edit/:specificationId', (req, res) => {
    const { spec_value } = req.body;
    const specificationId = req.params.specificationId;
    const query = 'UPDATE specification_detail SET spec_value = ? WHERE id = ?';
    db.query(query, [spec_value, specificationId], (err, result) => {
        if (err) return res.status(500).json({ error: 'Lỗi server khi sửa chi tiết thông số kỹ thuật' });
        res.json({ message: 'Sửa chi tiết thông số kỹ thuật thành công' });
    });
});
//xử lý xóa chi tiết thông số kỹ thuật
app.delete('/api/specification_detail/delete/:specificationId', (req, res) => {
    const specificationId = req.params.specificationId;
    const query = 'DELETE FROM specification_detail WHERE id = ?';
    db.query(query, [specificationId], (err, result) => {
        if (err) return res.status(500).json({ error: 'Lỗi server khi xóa chi tiết thông số kỹ thuật' });
        res.json({ message: 'Xóa chi tiết thông số kỹ thuật thành công' });
    });
});
//xử lý lấy danh sách lỗi thường gặp
app.get('/api/errors', (req, res) => {
    const query = 'SELECT * FROM errors';
    db.query(query, (err, results) => {
        if (err) return res.status(500).json({ error: 'Lỗi server khi lấy danh sách lỗi thường gặp' });
        res.json(results);
    });
});
//xử lý xóa lỗi thường gặp
app.delete('/api/errors/:id', (req, res) => {
    const id = req.params.id;
    const query = 'DELETE FROM errors WHERE id = ?';
    db.query(query, [id], (err, result) => {
        if (err) return res.status(500).json({ error: 'Lỗi server khi xóa lỗi thường gặp' });
        res.json({ message: 'Xóa lỗi thường gặp thành công' });
    });
});
//xử lý thêm lỗi thường gặp
app.post('/api/errors', (req, res) => {
    const { name, description } = req.body;
    const query = 'INSERT INTO errors (name, description) VALUES (?, ?)';
    db.query(query, [name, description], (err, result) => {
        if (err) return res.status(500).json({ error: 'Lỗi server khi thêm lỗi thường gặp' });
        res.json({ message: 'Thêm lỗi thường gặp thành công' });
    });
});
//xử lý sửa lỗi thường gặp
app.put('/api/errors/:id', (req, res) => {
    const { name, description } = req.body;
    const id = req.params.id;
    const query = 'UPDATE errors SET name = ?, description = ? WHERE id = ?';
    db.query(query, [name, description, id], (err, result) => {
        if (err) return res.status(500).json({ error: 'Lỗi server khi sửa lỗi thường gặp' });
        res.json({ message: 'Sửa lỗi thường gặp thành công' });
    });
});
//xử lý thêm thiết bị lỗi
app.post('/api/error_devices', (req, res) => {
    const { device_id, date_report, date_fix, status, error } = req.body;
    
    // Kiểm tra dữ liệu đầu vào
    if (!device_id || !date_report || !status || !error) {
        return res.status(400).json({ error: 'Thiếu thông tin bắt buộc' });
    }

    // Kiểm tra thiết bị có tồn tại không
    const checkDeviceQuery = 'SELECT * FROM devices WHERE id = ?';
    db.query(checkDeviceQuery, [device_id], (err, results) => {
        if (err) {
            return res.status(500).json({ error: 'Lỗi khi kiểm tra thiết bị' });
        }
        
        if (results.length === 0) {
            return res.status(404).json({ error: 'Không tìm thấy thiết bị' });
        }

        // Thêm báo cáo lỗi
        const query = 'INSERT INTO error_devices (device_id, date_report, date_fix, status, error) VALUES (?, ?, ?, ?, ?)';
        db.query(query, [device_id, date_report, date_fix, status, error], (err, result) => {
            if (err) {
                console.error('Lỗi SQL:', err);
                return res.status(500).json({ error: 'Lỗi khi thêm báo cáo lỗi thiết bị' });
            }
            res.json({ message: 'Thêm báo cáo lỗi thiết bị thành công' });
        });
    });
});
//xử lý lấy danh sách thiết bị lỗi
app.get('/api/error_devices', (req, res) => {
    const query = 'SELECT * FROM error_devices';
    db.query(query, (err, results) => {
        if (err) return res.status(500).json({ error: 'Lỗi server khi lấy danh sách thiết bị lỗi' });
        res.json(results);
    });
});
//xử lý sửa thiết bị lỗi
app.put('/api/error_devices/:id', (req, res) => {
    const { date_fix, status } = req.body;
    const id = req.params.id;

    // Kiểm tra thiết bị có tồn tại không
    const checkDeviceQuery = 'SELECT * FROM error_devices WHERE id = ?';
    db.query(checkDeviceQuery, [id], (err, results) => {
        if (err) {
            return res.status(500).json({ error: 'Lỗi khi kiểm tra thiết bị' });
        }
        
        if (results.length === 0) {
            return res.status(404).json({ error: 'Không tìm thấy thiết bị lỗi' });
        }

        // Cập nhật thông tin thiết bị lỗi
        const query = 'UPDATE error_devices SET date_fix = ?, status = ? WHERE id = ?';
        db.query(query, [date_fix, status, id], (err, result) => {
            if (err) {
                console.error('Lỗi SQL:', err);
                return res.status(500).json({ error: 'Lỗi server khi sửa thiết bị lỗi' });
            }
            
            if (result.affectedRows === 0) {
                return res.status(404).json({ error: 'Không thể cập nhật thiết bị lỗi' });
            }
            
            res.json({ message: 'Sửa thiết bị lỗi thành công' });
        });
    });
});
//thống kê thiết bị theo phòng
app.get('/api/devices-by-room', (req, res) => {
    const query = 'SELECT room, COUNT(*) AS device_count FROM devices GROUP BY room';
    db.query(query, (err, results) => {
        if (err) return res.status(500).json({ error: 'Lỗi server khi lấy thiết bị theo phòng' });
        res.json(results);
    });
});
//thống kê thiết bị theo loại kết với bản loại để lấy tên loại
app.get('/api/devices-by-type', (req, res) => {
    const query = 'SELECT dt.name, COUNT(*) AS device_count FROM devices d JOIN device_types dt ON d.type = dt.id GROUP BY d.type';
    db.query(query, (err, results) => {
        if (err) return res.status(500).json({ error: 'Lỗi server khi lấy thiết bị theo loại' });
        res.json(results);
    });
});
// Route đăng nhập
app.post('/api/login', async (req, res) => {
    const { username, password, captchaToken } = req.body;

    // Xác minh CAPTCHA
    try {
        const captchaResponse = await axios.post(
            'https://www.google.com/recaptcha/api/siteverify',
            null,
            {
                params: {
                    secret: process.env.RECAPTCHA_SECRET_KEY,
                    response: captchaToken,
                }
            }
        );

        if (!captchaResponse.data.success) {
            return res.status(400).json({ message: 'Captcha không hợp lệ!' });
        }

        // Kiểm tra thông tin đăng nhập từ database
        const query = 'SELECT * FROM users WHERE username = ? AND password = ?';
        db.query(query, [username, password], (err, results) => {
            if (err) return res.status(500).json({ message: 'Lỗi server!' });
            if (results.length === 0) {
                return res.status(401).json({ message: 'Sai tên đăng nhập hoặc mật khẩu!' });
            }
            // Lấy thông tin người dùng từ kết quả truy vấn
            const user = results[0];
            return res.status(200).json({ 
                message: 'Đăng nhập thành công!',
                name: user.name,
                role: user.role
            });
        });
    } catch (error) {
        return res.status(500).json({ message: 'Lỗi xác minh CAPTCHA!' });
    }
});
//lấy danh sách các năm có thiết bị lỗi
app.get('/api/error-devices/years', (req, res) => {
    const query = 'SELECT DISTINCT YEAR(date_report) as year FROM error_devices';
    db.query(query, (err, results) => {
        if (err) return res.status(500).json({ error: 'Lỗi server khi lấy danh sách năm' });
        res.json(results);
    });
});
//lấy thống kê thiết bị lỗi theo năm
app.get('/api/error-devices/stats/:year', (req, res) => {
    const year = req.params.year;
    const query = 'SELECT MONTH(date_report) as month, COUNT(*) as count FROM error_devices WHERE YEAR(date_report) = ? GROUP BY MONTH(date_report)';
    db.query(query, [year], (err, results) => {
        if (err) return res.status(500).json({ error: 'Lỗi server khi lấy thống kê thiết bị lỗi' });
        res.json(results);
    });
});
// Lắng nghe trên cổng 5000
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server is running on port ${PORT}`));
