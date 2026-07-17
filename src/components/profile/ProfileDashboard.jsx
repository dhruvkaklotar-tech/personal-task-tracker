import React, { useState } from 'react';
import { ShieldAlert, Trash2, CheckCircle2, Sun, Moon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ProfileCard from './ProfileCard';
import SyncConfigForm from './SyncConfigForm';
import { getProfile, resetAllData } from '../../lib/db';

function ProfileDashboard({ theme, setTheme, onConfigChanged, onReset, tasksCount, tasks }) {
  const [profile, setProfile] = useState(getProfile());
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showResetSuccess, setShowResetSuccess] = useState(false);

  const handleProfileSaved = (updatedProfile) => {
    setProfile(updatedProfile);
  };

  const handleResetSystem = async () => {
    await resetAllData();
    setShowResetConfirm(false);
    setShowResetSuccess(true);
    
    // Auto-redirect back to onboarding flow after 2.8 seconds
    setTimeout(() => {
      setShowResetSuccess(false);
      if (onReset) {
        onReset();
      }
    }, 2800);
  };

  return (
    <div className="profile-dashboard">
      <div className="profile-grid-row">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Profile details */}
          <ProfileCard 
            profile={profile} 
            onProfileSaved={handleProfileSaved} 
            tasksCount={tasksCount} 
            tasks={tasks}
          />

          {/* Theme Selection Card */}
          <div className="profile-card">
            <div className="card-header-row">
              {theme === 'dark' ? (
                <Moon size={16} className="card-icon" style={{ color: 'var(--primary)' }} />
              ) : (
                <Sun size={16} className="card-icon" style={{ color: 'var(--primary)' }} />
              )}
              <div>
                <h3>Appearance Theme</h3>
                <p className="card-header-desc">Choose between a premium Dark Mode obsidian canvas or a high-contrast Light Mode slate workspace.</p>
              </div>
            </div>
            
            <div style={{ display: 'flex', gap: '12px', marginTop: '4px' }}>
              <button 
                type="button"
                onClick={() => setTheme('dark')}
                style={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  padding: '10px 16px',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid',
                  fontSize: '0.88rem',
                  fontWeight: '500',
                  cursor: 'pointer',
                  borderColor: theme === 'dark' ? 'var(--primary)' : 'var(--border)',
                  background: theme === 'dark' ? 'rgba(99, 102, 241, 0.08)' : 'transparent',
                  color: theme === 'dark' ? 'var(--primary)' : 'var(--text-muted)'
                }}
              >
                <Moon size={14} /> Dark Mode
              </button>
              <button 
                type="button"
                onClick={() => setTheme('light')}
                style={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  padding: '10px 16px',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid',
                  fontSize: '0.88rem',
                  fontWeight: '500',
                  cursor: 'pointer',
                  borderColor: theme === 'light' ? 'var(--primary)' : 'var(--border)',
                  background: theme === 'light' ? 'rgba(79, 70, 229, 0.08)' : 'transparent',
                  color: theme === 'light' ? 'var(--primary)' : 'var(--text-muted)'
                }}
              >
                <Sun size={14} /> Light Mode
              </button>
            </div>
          </div>
        </div>

        {/* Sync details */}
        <SyncConfigForm onConfigChanged={onConfigChanged} />
      </div>

      {/* Danger zone actions */}
      <div className="profile-card danger-panel">
        <div className="card-header-row">
          <ShieldAlert size={18} className="card-icon" style={{ color: 'var(--accent)' }} />
          <div>
            <h3>Danger Zone</h3>
            <p className="card-header-desc">Irreversible administrative actions. These will permanently purge tracker history.</p>
          </div>
        </div>

        <div className="danger-actions-row">
          <div className="danger-text-col">
            <h4>Reset Task Tracker</h4>
            <p>Erase all local tasks, customized profiles, and cached document collections. This action cannot be undone.</p>
          </div>
          <button 
            className="btn-secondary reset-btn" 
            onClick={() => setShowResetConfirm(true)}
            style={{ backgroundColor: 'rgba(184, 87, 64, 0.08)', borderColor: 'rgba(184, 87, 64, 0.15)', color: 'var(--accent)' }}
          >
            <Trash2 size={14} style={{ marginRight: '4px' }} /> Reset Tracker
          </button>
        </div>

        {/* Confirmation Modal */}
        <AnimatePresence>
          {showResetConfirm && (
            <div className="modal-overlay" style={{ zIndex: 1999 }}>
              <motion.div 
                initial={{ scale: 0.98, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.98, opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="modal-box"
              >
                <h3>Confirm Factory Reset</h3>
                <p>Are you absolutely sure you want to purge your tracker? This deletes all completed tasks, action items, and configurations. This cannot be undone.</p>
                <div className="modal-actions">
                  <button className="btn-secondary" onClick={() => setShowResetConfirm(false)}>Cancel</button>
                  <button className="btn-primary" style={{ background: 'var(--accent)', borderColor: 'var(--accent)' }} onClick={handleResetSystem}>Yes, Purge All Data</button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Large, Animated Reset Success Popup Overlay */}
        <AnimatePresence>
          {showResetSuccess && (
            <div className="onboarding-overlay" style={{ zIndex: 3000 }}>
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="onboarding-box text-center"
                style={{ alignItems: 'center', textAlign: 'center' }}
              >
                <motion.div
                  initial={{ rotate: -90, scale: 0.5 }}
                  animate={{ rotate: 0, scale: 1 }}
                  transition={{ duration: 0.4, type: 'spring' }}
                  style={{ color: 'var(--accent)', marginBottom: '16px' }}
                >
                  <CheckCircle2 size={64} style={{ color: 'var(--secondary)' }} />
                </motion.div>
                <h2 style={{ fontFamily: 'var(--font-serif)', color: 'var(--text-main)', fontSize: '1.8rem', marginBottom: '8px' }}>
                  Reset Successful
                </h2>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: '1.5', maxWidth: '300px', margin: '0 auto' }}>
                  All tasks, histories, and sync keys have been successfully purged. Redirecting you to onboard profile...
                </p>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

export default ProfileDashboard;
