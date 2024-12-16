import React, { useState, useEffect } from 'react';
import Chart from 'chart.js/auto';

function DeviceAnalysis() {
    const [devicesByRoom, setDevicesByRoom] = useState([]);
    const [devicesByType, setDevicesByType] = useState([]);
    const [loading, setLoading] = useState(true);
    const [roomChart, setRoomChart] = useState(null);
    const [typeChart, setTypeChart] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const roomResponse = await fetch('http://localhost:5000/api/devices-by-room');
                const roomData = await roomResponse.json();
                setDevicesByRoom(roomData);

                const typeResponse = await fetch('http://localhost:5000/api/devices-by-type');
                const typeData = await typeResponse.json();
                setDevicesByType(typeData);

                setLoading(false);
            } catch (error) {
                console.error('Lỗi khi lấy dữ liệu:', error);
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    useEffect(() => {
        if (!loading) {
            // Hủy biểu đồ cũ nếu tồn tại
            if (roomChart) roomChart.destroy();
            if (typeChart) typeChart.destroy();

            // Tạo biểu đồ theo phòng
            const roomCtx = document.getElementById('roomChart').getContext('2d');
            const newRoomChart = new Chart(roomCtx, {
                type: 'pie',
                data: {
                    labels: devicesByRoom.map(item => item.room),
                    datasets: [{
                        data: devicesByRoom.map(item => item.device_count),
                        backgroundColor: [
                            '#FF6384',
                            '#36A2EB',
                            '#FFCE56',
                            '#4BC0C0',
                            '#9966FF',
                            '#FF9F40'
                        ]
                    }]
                },
                options: {
                    responsive: true,
                    plugins: {
                        legend: {
                            position: 'right',
                        },
                        title: {
                            display: true,
                            text: 'Phân bố thiết bị theo phòng'
                        }
                    }
                }
            });
            setRoomChart(newRoomChart);

            // Tạo biểu đồ theo loại
            const typeCtx = document.getElementById('typeChart').getContext('2d');
            const newTypeChart = new Chart(typeCtx, {
                type: 'pie',
                data: {
                    labels: devicesByType.map(item => item.name),
                    datasets: [{
                        data: devicesByType.map(item => item.device_count),
                        backgroundColor: [
                            '#FF6384',
                            '#36A2EB',
                            '#FFCE56',
                            '#4BC0C0',
                            '#9966FF',
                            '#FF9F40'
                        ]
                    }]
                },
                options: {
                    responsive: true,
                    plugins: {
                        legend: {
                            position: 'right',
                        },
                        title: {
                            display: true,
                            text: 'Phân bố thiết bị theo loại'
                        }
                    }
                }
            });
            setTypeChart(newTypeChart);
        }
    }, [devicesByRoom, devicesByType, loading]);

    if (loading) {
        return <div>Đang tải...</div>;
    }

    return (
        <div style={{ padding: '20px' }}>
            <h2>Thống kê thiết bị</h2>
            
            <div style={{ display: 'flex', gap: '40px', marginTop: '20px' }}>
                <div style={{ flex: 1, backgroundColor: '#fff', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                    <canvas id="roomChart"></canvas>
                </div>

                <div style={{ flex: 1, backgroundColor: '#fff', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                    <canvas id="typeChart"></canvas>
                </div>
            </div>
        </div>
    );
}

export default DeviceAnalysis;
