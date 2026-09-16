import React, { useEffect, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import logoImg from '../../pages/logo.png';
import './sidebar.css';

const Sidebar = ({ items, isCollapsed, isMobileOpen, onCloseMobile, onToggleCollapse }) => {
  const location = useLocation();
  const [hoveredIndex, setHoveredIndex] = useState(null);

  // Automatically close the mobile drawer when the route changes
  useEffect(() => {
    if (isMobileOpen) onCloseMobile();
  }, [location.pathname]); // eslint-disable-line react-hooks/exhaustive-deps

  // Clear hovered tooltip when sidebar collapses
  useEffect(() => {
    if (isCollapsed) setHoveredIndex(null);
  }, [isCollapsed]);

  return (
    <>
      {/* Mobile Backdrop */}
      <div
        className={`sidebar-backdrop ${isMobileOpen ? 'visible' : ''}`}
        onClick={onCloseMobile}
      />

      <aside
        className={`sidebar ${isCollapsed ? 'collapsed' : ''} ${isMobileOpen ? 'mobile-open' : ''}`}
      >
        {/* Ambient floating glow orbs */}
        <div className="sidebar-ambient" aria-hidden="true">
          <div className="ambient-orb ambient-orb--1" />
          <div className="ambient-orb ambient-orb--2" />
        </div>

        {/* Subtle glass layer */}
        <div className="sidebar-glass" aria-hidden="true" />

        {/* Actual content — sits above effects */}
        <div className="sidebar-content">
          {/* Header */}
          <div className="sidebar-header">
            <div className="sidebar-logo">
              <div className="logo-mark">
                <img
                  src={logoImg}
                  alt="DATFORTE SCH Logo"
                  className="logo-mark-img"
                />
              </div>
              <div className="logo-text">
                <h2>DATFORTE SCH</h2>
                <p>Application System</p>
              </div>
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

          {/* Navigation */}
          <nav className="sidebar-nav" aria-label="Main navigation">
            {items.map((item, index) => (
              item.divider ? (
                <div key={index} className="nav-divider">{item.label}</div>
              ) : (
                <div
                  key={index}
                  className="nav-item-wrapper"
                  style={{ '--stagger': `${index * 45}ms` }}
                >
                  <NavLink
                    to={item.path}
                    end={item.exact}
                    className={({ isActive }) =>
                      `sidebar-nav-item ${isActive ? 'active' : ''}`
                    }
                    onMouseEnter={() => setHoveredIndex(index)}
                    onMouseLeave={() => setHoveredIndex(null)}
                  >
                    <span className="nav-icon">{item.icon}</span>
                    <span className="nav-label">{item.label}</span>
                    {/* Animated glow layer on active item */}
                    <span className="nav-active-glow" aria-hidden="true" />
                  </NavLink>

                  {/* Tooltip — only visible when collapsed & hovered */}
                  {isCollapsed && hoveredIndex === index && (
                    <div className="nav-tooltip" role="tooltip">
                      {item.label}
                      <span className="nav-tooltip-arrow" aria-hidden="true" />
                    </div>
                  )}
                </div>
              )
            ))}
          </nav>

          {/* Bottom accent line */}
          <div className="sidebar-footer" aria-hidden="true">
            <div className="sidebar-footer-line" />
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;