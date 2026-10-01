import React from 'react';
import { Calendar, Shield, Users, RotateCcw, Sun, Moon } from 'lucide-react';

export default function Navbar({ 
  currentTab, 
  setCurrentTab, 
  isAdminUnlocked, 
  openAdminModal,
  openRetractModal,
  bookingsCount,
  theme,
  setTheme
}) {
  return (
    <header className="navbar-header">
      <div className="navbar-container">
        {/* Mobile Top Bar (Contents on Desktop) */}
        <div className="navbar-mobile-top-bar">
          {/* Brand & Identity */}
          <div className="navbar-brand-section">
            <div 
              className="navbar-brand-logo"
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '8px',
                background: 'var(--mapua-crimson)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ffffff',
                boxShadow: 'var(--shadow-xs)',
                flexShrink: 0
              }}
            >
              <Calendar size={18} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <h1 className="navbar-brand-title" style={{ 
                  fontSize: '1.05rem', 
                  fontWeight: 800, 
                  letterSpacing: '-0.02em',
                  color: 'var(--text-primary)',
                  margin: 0
                }}>
                  OJT Schedpoint
                </h1>
              </div>
              <p className="navbar-brand-subtitle" style={{ fontSize: '0.72rem', color: 'var(--text-muted)', margin: 0 }}>
                OJT scheduling form
              </p>
            </div>
          </div>

          {/* Quick Mobile Actions (Retract button & Theme toggle) */}
          <div className="navbar-mobile-actions">
            <button
              type="button"
              onClick={openRetractModal}
              className="btn btn-secondary"
              style={{ fontSize: '0.75rem', padding: '6px 9px' }}
              title="Manage or Retract Booking"
            >
              <RotateCcw size={13} color="var(--mapua-crimson)" />
              <span>Manage</span>
            </button>

            <button
              type="button"
              onClick={() => setTheme(theme === 'mapua' ? 'dark' : 'mapua')}
              className="btn btn-secondary"
              style={{ padding: '6px 9px' }}
              title="Toggle Theme"
            >
              {theme === 'mapua' ? <Moon size={14} /> : <Sun size={14} color="#f59e0b" />}
            </button>
          </div>
        </div>

        {/* Right Navigation & Tools (Desktop) */}
        <div className="navbar-tools-section navbar-desktop-tools">
          {/* Student Retract / Lookup Booking Button */}
          <button
            type="button"
            onClick={openRetractModal}
            className="btn btn-secondary"
            style={{ fontSize: '0.8125rem', padding: '7px 12px' }}
            title="Search for your reservation and cancel/retract it"
          >
            <RotateCcw size={14} color="var(--mapua-crimson)" />
            <span>Manage / Retract Booking</span>
          </button>

          {/* Theme Switcher: Light (Default) vs Dark */}
          <div className="segmented-control">
            <button
              type="button"
              onClick={() => setTheme('mapua')}
              className={`segmented-control-item ${theme === 'mapua' ? 'active' : ''}`}
              title="Light Mode (Default)"
            >
              <Sun size={13} />
              <span>Light</span>
            </button>
            <button
              type="button"
              onClick={() => setTheme('dark')}
              className={`segmented-control-item ${theme === 'dark' ? 'active' : ''}`}
              title="Dark Mode"
            >
              <Moon size={13} />
              <span>Dark</span>
            </button>
          </div>

          {/* Portal Switch: Student Booking vs Instructor Portal */}
          <div className="segmented-control navbar-tab-switch">
            <button
              type="button"
              onClick={() => setCurrentTab('booking')}
              className={`segmented-control-item ${currentTab === 'booking' ? 'active' : ''}`}
            >
              <Users size={14} />
              <span>Student Schedule</span>
            </button>

            <button
              type="button"
              onClick={() => {
                if (isAdminUnlocked) {
                  setCurrentTab('admin');
                } else {
                  openAdminModal();
                }
              }}
              className={`segmented-control-item ${currentTab === 'admin' ? 'active' : ''}`}
            >
              <Shield size={14} />
              <span>Instructor Portal</span>
              {bookingsCount > 0 && (
                <span style={{
                  background: 'var(--mapua-crimson)',
                  color: '#ffffff',
                  borderRadius: '10px',
                  padding: '1px 6px',
                  fontSize: '0.6875rem',
                  fontFamily: 'var(--font-mono)',
                  fontWeight: 700
                }}>
                  {bookingsCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Portal Switch on Mobile (full width row) */}
        <div className="segmented-control navbar-tab-switch-mobile">
          <button
            type="button"
            onClick={() => setCurrentTab('booking')}
            className={`segmented-control-item ${currentTab === 'booking' ? 'active' : ''}`}
          >
            <Users size={14} />
            <span>Student Schedule</span>
          </button>

          <button
            type="button"
            onClick={() => {
              if (isAdminUnlocked) {
                setCurrentTab('admin');
              } else {
                openAdminModal();
              }
            }}
            className={`segmented-control-item ${currentTab === 'admin' ? 'active' : ''}`}
          >
            <Shield size={14} />
            <span>Instructor Portal</span>
            {bookingsCount > 0 && (
              <span style={{
                background: 'var(--mapua-crimson)',
                color: '#ffffff',
                borderRadius: '10px',
                padding: '1px 6px',
                fontSize: '0.6875rem',
                fontFamily: 'var(--font-mono)',
                fontWeight: 700
              }}>
                {bookingsCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
}
