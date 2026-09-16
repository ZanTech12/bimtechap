import React, { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useSchoolSettings } from '../../hooks/useSchoolSettings';
import './sidebar.css';

const ChevronIcon = ({ collapsed }) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
    style={{ transform: collapsed ? 'rotate(180deg)' : 'none', transition: 'transform 0.3s ease' }}>
    <polyline points="15 18 9 12 15 6"></polyline>
  </svg>
);

const CloseIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line>
  </svg>
);

const Sidebar = ({ items, collapsed, isOpen, onToggleCollapse, onToggleMobile }) => {
  const location = useLocation();
  const [hoveredIndex, setHoveredIndex] = useState(null);
  const site = useSchoolSettings();
  const [shortName, setShortName] = useState('School');

  useEffect(() => {
    if (site.shortName) setShortName(site.shortName);
  }, [site.shortName]);

  // Automatically close mobile drawer when route changes
  useEffect(() => {
    if (isOpen) onToggleMobile();
  }, [location.pathname]); // eslint-disable-line react-hooks/exhaustive-deps

  const logoUrl = site.logoUrl || '';

  return (
    <>
      {/* Mobile Backdrop */}
      <div 
        className={`sidebar-backdrop ${isOpen ? 'visible' : ''}`} 
        onClick={onToggleMobile} 
        aria-hidden="true"
      />

      <aside className={`sidebar ${collapsed ? 'collapsed' : ''} ${isOpen ? 'open' : ''}`}>
        <div className="sidebar-ambient" aria-hidden="true">
          <div className="ambient-orb ambient-orb--1" />
          <div className="ambient-orb ambient-orb--2" />
        </div>
        <div className="sidebar-glass" aria-hidden="true" />

        <div className="sidebar-content">
          <div className="sidebar-header">
            <div className="sidebar-logo">
              <div className="logo-mark">
                {logoUrl ? (
                  <img src={logoUrl} alt="Logo" className="logo-mark-img" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                ) : (
                  <div className="logo-placeholder">
                    <span>{shortName.charAt(0)}</span>
                  </div>
                )}
              </div>
              <div className="logo-text">
                <h2>{shortName.toUpperCase()}</h2>
                <p>Application System</p>
              </div>
            </div>

            {/* Desktop Collapse Toggle */}
            <button className="sidebar-toggle-btn desktop-toggle" onClick={onToggleCollapse} aria-label="Toggle sidebar">
              <ChevronIcon collapsed={collapsed} />
            </button>

            {/* Mobile Close Button */}
            <button className="sidebar-toggle-btn mobile-toggle" onClick={onToggleMobile} aria-label="Close sidebar">
              <CloseIcon />
            </button>
          </div>

          <nav className="sidebar-nav">
            {items.map((item, index) => (
              <div key={index} className="nav-item-wrapper" style={{ '--stagger': `${index * 45}ms` }}>
                <NavLink
                  to={item.path}
                  end
                  className={({ isActive }) => `sidebar-nav-item ${isActive ? 'active' : ''}`}
                  onMouseEnter={() => setHoveredIndex(index)}
                  onMouseLeave={() => setHoveredIndex(null)}
                >
                  <span className="nav-icon">{item.icon}</span>
                  <span className="nav-label">{item.label}</span>
                  <span className="nav-active-glow" aria-hidden="true" />
                </NavLink>

                {collapsed && hoveredIndex === index && (
                  <div className="nav-tooltip" role="tooltip">
                    {item.label}
                    <span className="nav-tooltip-arrow" aria-hidden="true" />
                  </div>
                )}
              </div>
            ))}
          </nav>

          <div className="sidebar-footer" aria-hidden="true">
            <div className="sidebar-footer-line" />
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
