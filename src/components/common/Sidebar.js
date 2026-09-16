import React, { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useSchoolSettings } from '../../hooks/useSchoolSettings';
import './sidebar.css';

const Sidebar = ({ items, collapsed, isOpen }) => {
  const [hoveredIndex, setHoveredIndex] = useState(null);
  const site = useSchoolSettings();
  const [shortName, setShortName] = useState('School');

  useEffect(() => {
    if (site.shortName) setShortName(site.shortName);
  }, [site.shortName]);

  // Clear hovered tooltip when sidebar collapses
  useEffect(() => {
    if (collapsed) setHoveredIndex(null);
  }, [collapsed]);

  const logoUrl = site.logoUrl || '';

  return (
    <aside
      className={`sidebar ${collapsed ? 'collapsed' : ''} ${isOpen ? 'open' : ''}`}
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
        {/* Logo */}
        <div className="sidebar-logo">
          <div className="logo-mark">
            {logoUrl ? (
              <img
                src={logoUrl}
                alt="Logo"
                className="logo-mark-img"
                onError={(e) => { e.currentTarget.style.display = 'none'; }}
              />
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

        {/* Navigation */}
        <nav className="sidebar-nav" aria-label="Main navigation">
          {items.map((item, index) => (
            <div
              key={index}
              className="nav-item-wrapper"
              style={{ '--stagger': `${index * 45}ms` }}
            >
              <NavLink
                to={item.path}
                end
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
              {collapsed && hoveredIndex === index && (
                <div className="nav-tooltip" role="tooltip">
                  {item.label}
                  <span className="nav-tooltip-arrow" aria-hidden="true" />
                </div>
              )}
            </div>
          ))}
        </nav>

        {/* Bottom accent line */}
        <div className="sidebar-footer" aria-hidden="true">
          <div className="sidebar-footer-line" />
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;