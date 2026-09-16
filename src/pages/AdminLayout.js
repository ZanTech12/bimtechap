import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Header from '../components/common/Header';
import Sidebar from '../components/common/Sidebar';
import AdminDashboard from '../components/admin/AdminDashboard';
// ... import your other pages here

const AdminLayout = () => {
  const [isCollapsed, setIsCollapsed] = useState(false); // Desktop collapse state
  const [isMobileOpen, setIsMobileOpen] = useState(false); // Mobile drawer state

  // Lock body scroll when mobile drawer is open
  useEffect(() => {
    document.body.style.overflow = isMobileOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isMobileOpen]);

  return (
    <div className={`layout-container ${isCollapsed ? 'sidebar-collapsed' : ''}`}>
      
      <Sidebar
        items={adminMenuItems}
        isCollapsed={isCollapsed}
        isMobileOpen={isMobileOpen}
        onCloseMobile={() => setIsMobileOpen(false)}
        onToggleCollapse={() => setIsCollapsed(!isCollapsed)}
      />

      <div className="main-content">
        <Header 
          onMenuClick={() => {
            // The Header intelligently decides what to do based on screen width
            if (window.innerWidth < 1024) {
              setIsMobileOpen(!isMobileOpen);
            } else {
              setIsCollapsed(!isCollapsed);
            }
          }}
        />
        
        <div className="page-content">
          <Routes>
            <Route path="/" element={<AdminDashboard />} />
            {/* Add your other routes here */}
            <Route path="*" element={<Navigate to="/admin" replace />} />
          </Routes>
        </div>
      </div>
    </div>
  );
};

export default AdminLayout;