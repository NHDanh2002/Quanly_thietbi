import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './components/Login';
import Home from './components/Home';
import DeviceDetail from './components/DeviceDetail';
function App() {
    return (
        <Router>
            <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/*" element={<Home />} />
                <Route path="/device/:id" element={<DeviceDetail />} />
                <Route path="/" element={<Login />} /> {/* Mặc định là trang đăng nhập */}
            </Routes>
        </Router>
    );
}

export default App;
