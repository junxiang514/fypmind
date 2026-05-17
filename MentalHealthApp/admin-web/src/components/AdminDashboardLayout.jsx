import React, { useState, useEffect } from 'react';

const NAV_ITEMS = [
  { key: 'dashboard', label: 'Dashboard' },
  { key: 'events', label: 'Events' },
  { key: 'contents', label: 'Educational Content' },
  { key: 'questions', label: 'Check-ins Question' },
  { key: 'clinical-tools', label: 'Self-Assessment Tools' },
  { key: 'users', label: 'Users' },
  { key: 'approvals', label: 'Approval Review' },
];

function getInitials(name) {
  if (!name) return 'AD';
  const parts = String(name)
    .split(' ')
    .map((part) => part.trim())
    .filter(Boolean);
  if (!parts.length) return 'AD';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

export default function AdminDashboardLayout({
  signedInName,
  signedInRole,
  onRefresh,
  onLogout,
  tab,
  setTab,
  query,
  setQuery,
  status,
  error,
  content,
  logoSrc,
}) {
  const [showAlert, setShowAlert] = useState(true);
  const initials = getInitials(signedInName);
  const hasAlert = !!status || !!error;

  useEffect(() => {
    if (!hasAlert) {
      setShowAlert(true);
      return;
    }

    const timer = setTimeout(() => {
      setShowAlert(false);
    }, 2000);

    return () => clearTimeout(timer);
  }, [status, error, hasAlert]);

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <div className="admin-sidebar-header">
          {logoSrc ? (
            <img src={logoSrc} alt="MIND" className="sidebar-logo" />
          ) : (
            <div className="sidebar-brand-icon">M</div>
          )}
          <div className="sidebar-brand-content">
            <div className="sidebar-brand-text">MIND</div>
            <div className="sidebar-brand-subtitle">Mental Health Intelligence for Nurturing and Development</div>
          </div>
        </div>

        <nav className="admin-nav">
          <div className="admin-nav-divider" aria-hidden="true" />
          {NAV_ITEMS.map((item) => (
            <button
              key={item.key}
              className={`admin-nav-item ${tab === item.key ? 'active' : ''}`}
              onClick={() => setTab(item.key)}
            >
              {item.label}
            </button>
          ))}
        </nav>

        <div className="admin-sidebar-footer">
          <div className="admin-sidebar-actions">
            <button className="btn light" onClick={onRefresh}>Refresh</button>
            <button className="btn danger" onClick={onLogout}>Logout</button>
          </div>
        </div>
      </aside>

      <main className="admin-main">
        <header className="admin-topbar topbar-card">
          <div className="topbar-left">
            <div className="admin-search-wrap">
              <input
                className="admin-search"
                placeholder="Search current tab..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
          </div>

          <div className="topbar-right">
            {hasAlert && (
              <div style={{ position: 'relative' }}>
                <button
                  className={`topbar-alert-btn ${error ? 'error' : 'success'}`}
                  onClick={() => setShowAlert(!showAlert)}
                  title={error || status}
                >
                  <span className="alert-icon">{error ? '⚠' : '🔔'}</span>
                </button>
                {showAlert && (
                  <div className={`alert-tooltip ${error ? 'error' : 'success'}`}>
                    {error || status}
                  </div>
                )}
              </div>
            )}
            <div className="admin-profile topbar-profile">
              <div className="admin-avatar">{initials}</div>
              <div className="topbar-profile-text">
                <div className="admin-profile-name">{signedInName}</div>
                <div className="admin-profile-role">{signedInRole}</div>
              </div>
            </div>
          </div>
        </header>

        {content}
      </main>
    </div>
  );
}
