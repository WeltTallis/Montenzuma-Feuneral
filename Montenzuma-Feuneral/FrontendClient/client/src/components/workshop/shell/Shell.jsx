import React, { useState } from 'react';
import '../workshop.css';
import '../../design-tokens.css';

/* ============================================================================
   Shell — main layout wrapper with sidebar + main content area.
   Provides the grid structure: 220px sidebar | 1fr main.
   ============================================================================ */
const Shell = ({ children, sidebar, main }) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const toggleSidebar = () => setSidebarOpen((prev) => !prev);

  return (
    <div className="ec-shell">
      {/* Mobile toggle */}
      <button
        className="ec-shell-toggle"
        onClick={toggleSidebar}
        aria-label="Toggle sidebar"
        style={{ display: sidebarOpen ? 'none' : 'flex' }}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="3" y1="6" x2="21" y2="6" />
          <line x1="3" y1="12" x2="21" y2="12" />
          <line x1="3" y1="18" x2="21" y2="18" />
        </svg>
      </button>

      {/* Sidebar */}
      <aside
        className={`ec-sidebar ${sidebarOpen ? 'open' : ''}`}
        style={{ width: sidebarOpen ? '220px' : '76px' }}
      >
        {sidebar({ toggleSidebar })}
      </aside>

      {/* Mobile backdrop */}
      <div
        className="ec-sidebar-backdrop"
        style={{ display: sidebarOpen ? 'block' : 'none' }}
        onClick={toggleSidebar}
      />

      {/* Main content */}
      <main className="ec-main">{main}</main>
    </div>
  );
};

export default Shell;
