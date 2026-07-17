import React from 'react';
import { Menu } from 'lucide-react';

function Header({ activeTab, setSidebarOpen, pendingTasksCount }) {
  return (
    <header className="content-header">
      <button className="sidebar-toggle-btn" onClick={() => setSidebarOpen(true)}>
        <Menu size={20} />
      </button>
      
      <div className="header-meta">
        <h1 className="header-title">
          {activeTab === 'tasks' && <span className="title-gradient">Task Board</span>}
          {activeTab === 'reports' && <span className="title-secondary-gradient">Performance Insights</span>}
          {activeTab === 'profile' && <span>Profile & Settings</span>}
        </h1>
        <p className="header-subtitle">
          {activeTab === 'tasks' && `Manage, plan and check off your tasks. ${pendingTasksCount} pending.`}
          {activeTab === 'reports' && 'Review your productivity charts and line trends.'}
          {activeTab === 'profile' && 'Customize your identity, theme, and cloud synchronization settings.'}
        </p>
      </div>
    </header>
  );
}

export default Header;
