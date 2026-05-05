import React, { useState, useEffect } from 'react';

const NAV_ITEMS = [
  { key: 'events', label: 'Events' },
  { key: 'contents', label: 'Educational Content' },
  { key: 'questions', label: 'Daily Questions' },
  { key: 'clinical-tools', label: 'Self-Assessment Tools' },
  { key: 'users', label: 'Users' },
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
  onRefresh,
  onLogout,
  tab,
  setTab,
  query,
  setQuery,
  status,
  error,
  kpis,
  list,
  editor,
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
          <div className="admin-nav-title">Manage</div>
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

        <details className="card admin-kpi-panel">
          <summary className="admin-kpi-summary">
            KPI Snapshot
            <span className="admin-kpi-hint">Expand to view details</span>
          </summary>
          <div className="admin-kpi-list">
            <div className="admin-kpi-item">
              <div>
                <span>Events</span>
                <div className="admin-kpi-meta">Upcoming & past sessions</div>
              </div>
              <strong>{kpis.events}</strong>
            </div>
            <div className="admin-kpi-item">
              <div>
                <span>Educational Content</span>
                <div className="admin-kpi-meta">Articles, quizzes, activities</div>
              </div>
              <strong>{kpis.contents}</strong>
            </div>
            <div className="admin-kpi-item">
              <div>
                <span>Daily Questions</span>
                <div className="admin-kpi-meta">Wellbeing check-ins</div>
              </div>
              <strong>{kpis.questions}</strong>
            </div>
            <div className="admin-kpi-item">
              <div>
                <span>Self-Assessment Tools</span>
                <div className="admin-kpi-meta">Clinical questionnaires</div>
              </div>
              <strong>{kpis.tools}</strong>
            </div>
            <div className="admin-kpi-item">
              <div>
                <span>Users</span>
                <div className="admin-kpi-meta">Active profiles</div>
              </div>
              <strong>{kpis.users}</strong>
            </div>
            <div className="admin-kpi-item">
              <div>
                <span>Submissions</span>
                <div className="admin-kpi-meta">Self-assessment responses</div>
              </div>
              <strong>{kpis.submissions}</strong>
            </div>
          </div>
        </details>

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
                  <span className="alert-icon">{error ? '⚠' : 'ℹ'}</span>
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
                <div className="admin-profile-role">Admin</div>
              </div>
            </div>
          </div>
        </header>

        <section className="admin-content">
          <div className="admin-panel card">{list}</div>
          <div className="admin-panel">{editor}</div>
        </section>
      </main>
    </div>
  );
}
