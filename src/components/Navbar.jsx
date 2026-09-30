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
    <header style={{
      borderBottom: '1px solid var(--border-light)',
      background: 'var(--bg-surface)',
      position: 'sticky',
      top: 0,
      zIndex: 100,
      padding: '12px 24px',
      boxShadow: 'var(--shadow-xs)'
    }}>
      <div style={{
        maxWidth: '1280px',
        margin: '0 auto',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        {/* Brand & Identity */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '8px',
            background: 'var(--mapua-crimson)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#ffffff',
            boxShadow: 'var(--shadow-xs)',
            flexShrink: 0
          }}>
            <Calendar size={20} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h1 style={{ 
                fontSize: '1.125rem', 
                fontWeight: 800, 
                letterSpacing: '-0.02em',
                color: 'var(--text-primary)',
                margin: 0
              }}>
                Mapúa SchedPoint
              </h1>
              <span className="badge badge-gold">
                Mapúa University
              </span>
            </div>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>
              10-Minute Consultation & Presentation Scheduler
            </p>
          </div>
        </div>

        {/* Right Navigation & Tools */}
        <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
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
          <div className="segmented-control">
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
      </div>
    </header>
  );
}
