import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './components/Home';
import DeviceTypes from './components/DeviceTypes';

function HomeRouter() {
    return (
        <Router>
            <Routes>
                <Route path="/home" element={<Home />} />
                <Route path="/devicetypes" element={<DeviceTypes />} />
                <Route path="/" element={<Home />} /> {/* Mặc định là trang đăng nhập */}
            </Routes>
        </Router>
    );
}

export default HomeRouter;
