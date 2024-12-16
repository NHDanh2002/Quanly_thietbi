const mysql = require('mysql2');
require('dotenv').config();

const connection = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
});


// Kết nối đến MySQL
connection.connect((err) => {
    if (err) {
        console.error('Lỗi kết nối MySQL:', err.message);
    } else {
        console.log('Kết nối MySQL thành công!');
    }
});

// Export kết nối
module.exports = connection;
