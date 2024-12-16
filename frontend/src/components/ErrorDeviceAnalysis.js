import React, { useState, useEffect, useRef } from 'react';
import Chart from 'chart.js/auto';

const ErrorDeviceAnalysis = () => {
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [years, setYears] = useState([]);
    const chartRef = useRef(null);
    const chartInstance = useRef(null);

    useEffect(() => {
        // Lấy danh sách các năm từ server
        fetch('http://localhost:5000/api/error-devices/years')
            .then(res => res.json())
            .then(data => {
                if (data && data.length > 0) {
                    setYears(data);
                } else {
                    console.error('Không có dữ liệu năm');
                }
            })
            .catch(err => {
                console.error('Lỗi khi lấy danh sách năm:', err);
                alert('Không thể tải danh sách năm. Vui lòng thử lại sau.');
            });
    }, []);

    useEffect(() => {
        // Lấy dữ liệu thiết bị lỗi theo năm đã chọn và vẽ biểu đồ
        fetch(`http://localhost:5000/api/error-devices/stats/${selectedYear}`)
            .then(res => {
                if (!res.ok) {
                    throw new Error('Lỗi khi tải dữ liệu');
                }
                return res.json();
            })
            .then(data => {
                if (!Array.isArray(data)) {
                    throw new Error('Dữ liệu không đúng định dạng');
                }

                // Khởi tạo mảng 12 tháng với giá trị 0
                const monthlyData = Array(12).fill(0);
                
                // Cập nhật số lượng cho các tháng có dữ liệu
                data.forEach(item => {
                    if (item.month >= 1 && item.month <= 12) {
                        monthlyData[item.month - 1] = item.count;
                    }
                });

                if (chartInstance.current) {
                    chartInstance.current.destroy();
                }

                const ctx = chartRef.current.getContext('2d');
                chartInstance.current = new Chart(ctx, {
                    type: 'bar',
                    data: {
                        labels: ['Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6', 
                                'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'],
                        datasets: [{
                            label: 'Số lượng thiết bị lỗi',
                            data: monthlyData,
                            backgroundColor: 'rgba(255, 99, 132, 0.5)',
                            borderColor: 'rgb(255, 99, 132)',
                            borderWidth: 1
                        }]
                    },
                    options: {
                        responsive: true,
                        plugins: {
                            legend: {
                                position: 'top',
                            },
                            title: {
                                display: true,
                                text: `Thống kê thiết bị lỗi năm ${selectedYear}`
                            }
                        },
                        scales: {
                            y: {
                                beginAtZero: true,
                                ticks: {
                                    stepSize: 1
                                }
                            }
                        }
                    }
                });
            })
            .catch(err => {
                console.error('Lỗi khi lấy dữ liệu thống kê:', err);
                alert('Không thể tải dữ liệu thống kê. Vui lòng thử lại sau.');
            });

        return () => {
            if (chartInstance.current) {
                chartInstance.current.destroy();
            }
        };
    }, [selectedYear]);

    return (
        <div style={{ padding: '20px' }}>
            <div style={{ marginBottom: '20px' }}>
                <label htmlFor="yearSelect" style={{ marginRight: '10px' }}>Chọn năm: </label>
                <select 
                    id="yearSelect"
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(Number(e.target.value))}
                    style={{
                        padding: '8px',
                        borderRadius: '4px',
                        border: '1px solid #ccc'
                    }}
                >
                    <option hidden value="">Chọn năm</option>
                    {years.map(year => (
                        <option key={year.year} value={year.year}>{year.year}</option>
                    ))}
                </select>
            </div>
            <div style={{ 
                backgroundColor: 'white',
                padding: '20px',
                borderRadius: '8px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}>
                <canvas ref={chartRef}></canvas>
            </div>
        </div>
    );
};

export default ErrorDeviceAnalysis;
