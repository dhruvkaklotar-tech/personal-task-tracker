import React from 'react';
import { motion } from 'framer-motion';
import { CloudLightning, X, Wifi, WifiOff } from 'lucide-react';

function Sidebar({ 
  activeTab, 
  setActiveTab, 
  sidebarOpen, 
  setSidebarOpen, 
  dbStatus, 
  isOnline, 
  navItems 
}) {
  return (
    <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
      <div className="sidebar-header">
        <div className="logo-container">
          <div className="logo-icon" style={{ background: 'transparent', border: 'none', width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg 
              viewBox="0 0 24 24" 
              width="24" 
              height="24" 
              fill="none" 
              stroke="var(--primary)" 
              strokeWidth="2.5" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            >
              <polygon points="4,19 11,7 16,19" />
              <polygon points="12,19 17,11 21,19" />
              <line x1="17" y1="11" x2="17" y2="5" />
              <path d="M17 5H21L20 6.5L21 8H17" fill="var(--primary)" />
            </svg>
          </div>
          <span className="logo-text">Task Tracker</span>
        </div>
        <button className="sidebar-close-btn" onClick={() => setSidebarOpen(false)}>
          <X size={18} />
        </button>
      </div>

      <nav className="sidebar-nav">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              className={`nav-item ${isActive ? 'active' : ''}`}
              onClick={() => {
                setActiveTab(item.id);
                setSidebarOpen(false);
              }}
            >
              <Icon className="nav-icon" size={18} />
              <span className="nav-label">{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="sidebar-footer">
        <div className={`sync-status-card ${dbStatus.mode === 'cloud' ? 'sync-cloud' : 'sync-local'}`}>
          <div className="sync-status-row">
            <span className="sync-dot" />
            <span className="sync-mode-text">
              {dbStatus.mode === 'cloud' ? 'Cloud Sync Enabled' : 'Local-Only Mode'}
            </span>
          </div>
          <div className="sync-network-row">
            {isOnline ? (
              <>
                <Wifi size={12} className="network-icon online" />
                <span>Device is Online</span>
              </>
            ) : (
              <>
                <WifiOff size={12} className="network-icon offline" />
                <span>Device is Offline</span>
              </>
            )}
          </div>
        </div>
      </div>
    </aside>
  );
}

export default Sidebar;
