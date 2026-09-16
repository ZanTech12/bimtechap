import React from 'react';
import './header.css';

const Header = ({ onMenuClick }) => {
  return (
    <header className="header">
      <button className="menu-btn" onClick={onMenuClick} aria-label="Toggle Menu">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="3" y1="12" x2="21" y2="12"></line>
          <line x1="3" y1="6" x2="21" y2="6"></line>
          <line x1="3" y1="18" x2="21" y2="18"></line>
        </svg>
      </button>
      
      <div className="header-title">
        <h1>Admin Dashboard</h1>
      </div>

      <div className="header-actions">
        <button className="header-profile-btn">
          <div className="avatar">A</div>
          <span>Admin User</span>
        </button>
      </div>
    </header>
  );
};

export default Header;