import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

import Header from '../components/common/Header';
import Sidebar from '../components/common/Sidebar';
import StudentDashboard from '../components/student/StudentDashboard';
import TestList from '../components/student/TestList';
import TakeTest from '../components/student/TakeTest';
import MyResults from '../components/student/MyResults';
import './StudentLayout.css'

// ACADEMIC IMPORTS
import StudentReportCard from '../components/student/StudentReportCard';
import StudentProfile from '../components/student/StudentProfile';

// E-NOTES IMPORT
import StudentENotes from '../pages/StudentENotes';

const studentMenuItems = [
  { path: '/student', label: 'Dashboard', icon: '📊', exact: true },
  { divider: true, label: 'EXAMINATIONS' },
  { path: '/student/tests', label: 'Available Tests', icon: '📝' },
  { path: '/student/results', label: 'Test Results', icon: '📈' },
  { path: '/student/schedule', label: 'Test Schedule', icon: '📅' },
  { divider: true, label: 'ACADEMICS' },
  { path: '/student/report-card', label: 'My Grades', icon: '📋' },
  { path: '/student/e-notes', label: 'E-Notes', icon: '📒' },
  { divider: true, label: 'ACCOUNT' },
  { path: '/student/profile', label: 'Profile', icon: '👤' },
];

const StudentLayout = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Close drawer if screen resizes to desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setIsDrawerOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Lock body scroll when mobile drawer is open
  useEffect(() => {
    document.body.style.overflow = isDrawerOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isDrawerOpen]);

  // The Routes definition (reused for both normal and fullscreen modes if you ever need it)
  const renderRoutes = () => (
    <Routes>
      {/* Main Routes */}
      <Route path="/" element={<StudentDashboard />} />
      
      {/* Examination Routes */}
      <Route path="/tests" element={<TestList />} />
      <Route path="/tests/:testId" element={<TakeTest />} />
      <Route path="/results" element={<MyResults />} />
      <Route path="/schedule" element={<TestList showSchedule />} />
      
      {/* Academic Routes */}
      <Route path="/report-card" element={<StudentReportCard />} />
      <Route path="/e-notes" element={<StudentENotes />} />
      
      {/* Account Routes */}
      <Route path="/profile" element={<StudentProfile />} />
      
      {/* Catch all */}
      <Route path="*" element={<Navigate to="/student" replace />} />
    </Routes>
  );

  return (
    <div className={`layout-container ${isCollapsed ? 'sidebar-collapsed' : ''}`}>
      
      <Sidebar
        items={studentMenuItems}
        collapsed={isCollapsed}
        isOpen={isDrawerOpen}
        onToggleCollapse={() => setIsCollapsed(!isCollapsed)}
        onToggleOpen={() => setIsDrawerOpen(!isDrawerOpen)}
      />

      <div className="main-content">
        <Header
          title="Student Panel"
          onToggleSidebar={() => setIsCollapsed(!isCollapsed)}
          onMobileMenuClick={() => setIsDrawerOpen(!isDrawerOpen)}
        />
        
        <div className="page-content">
          {renderRoutes()}
        </div>
      </div>
    </div>
  );
};

export default StudentLayout;