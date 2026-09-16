import React, { useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import './sidebar.css'; // Ensure you have this CSS file

const Sidebar = ({ items, isCollapsed, isMobileOpen, onCloseMobile, onToggleCollapse }) => {
  const location = useLocation();

  // Automatically close the mobile drawer when the route changes
  useEffect(() => {
    if (isMobileOpen) onCloseMobile();
  }, [location.pathname]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <>
      {/* Mobile Backdrop */}
      <div 
        className={`sidebar-backdrop ${isMobileOpen ? 'visible' : ''}`} 
        onClick={onCloseMobile} 
      />

      <aside className={`sidebar ${isCollapsed ? 'collapsed' : ''} ${isMobileOpen ? 'mobile-open' : ''}`}>
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <div className="logo-icon">S</div>
            <h2 className="logo-text">School Sys</h2>
          </div>
          
          {/* Desktop Collapse Button */}
          <button className="collapse-btn desktop-only" onClick={onToggleCollapse}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6"></polyline>
            </svg>
          </button>

          {/* Mobile Close Button */}
          <button className="close-btn mobile-only" onClick={onCloseMobile}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        <nav className="sidebar-nav">
          {items.map((item, index) => (
            item.divider ? (
              <div key={index} className="nav-divider">{item.label}</div>
            ) : (
              <NavLink
                key={index}
                to={item.path}
                end={item.exact}
                className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
              >
                <span className="nav-icon">{item.icon}</span>
                <span className="nav-label">{item.label}</span>
              </NavLink>
            )
          ))}
        </nav>
      </aside>
    </>
  );
};

export default Sidebar;