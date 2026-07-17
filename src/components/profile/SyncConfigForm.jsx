import React, { useState, useEffect } from 'react';
import { Database, HelpCircle, Save, Eye, EyeOff, Lock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getFirebaseConfig, saveFirebaseConfig, clearFirebaseConfig } from '../../lib/db';

function SyncConfigForm({ onConfigChanged }) {
  const [apiKey, setApiKey] = useState('');
  const [projectId, setProjectId] = useState('');
  const [appId, setAppId] = useState('');
  const [isFirebaseConfigured, setIsFirebaseConfigured] = useState(false);
  const [saveStatus, setSaveStatus] = useState({ success: null, message: '' });

  // Toggle show/hide states for sensitive keys
  const [showApiKey, setShowApiKey] = useState(false);
  const [showProjectId, setShowProjectId] = useState(false);
  const [showAppId, setShowAppId] = useState(false);

  // PIN Verification Modal states
  const [showPinModal, setShowPinModal] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [pendingSetter, setPendingSetter] = useState(null);
  const [pinError, setPinError] = useState('');
  const [isSectionUnlocked, setIsSectionUnlocked] = useState(false);
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [lockoutTimeLeft, setLockoutTimeLeft] = useState(0);

  useEffect(() => {
    const config = getFirebaseConfig();
    if (config) {
      setApiKey(config.apiKey || '');
      setProjectId(config.projectId || '');
      setAppId(config.appId || '');
      setIsFirebaseConfigured(true);
    } else {
      setIsFirebaseConfigured(false);
    }
  }, []);

  // System identity verification wrapper for eye toggles
  const handleToggleShowKey = async (setter, currentState) => {
    if (currentState) {
      setter(false);
      return;
    }

    // Bypass check if section is already unlocked
    if (isSectionUnlocked) {
      setter(true);
      return;
    }

    setSaveStatus({ success: null, message: 'Verifying device owner identity...' });

    // 1. Try Electron native bridge first if running in desktop shell
    if (window.electronAPI && window.electronAPI.verifyIdentity) {
      try {
        const result = await window.electronAPI.verifyIdentity();
        if (result.success) {
          setIsSectionUnlocked(true);
          setter(true);
          setSaveStatus({ success: null, message: '' });
          return;
        } else {
          console.warn("Electron native identity failed:", result.error);
        }
      } catch (err) {
        console.warn("Electron native auth call crashed, trying browser WebAuthn:", err);
      }
    }

    // 2. Try browser WebAuthn (Touch ID, Windows Hello, iOS Face ID, Android Fingerprint/PIN)
    if (window.PublicKeyCredential) {
      try {
        const challenge = new Uint8Array(32);
        window.crypto.getRandomValues(challenge);
        
        const options = {
          challenge: challenge,
          rp: { name: "Task Tracker", id: window.location.hostname },
          user: {
            id: new Uint8Array([1, 2, 3, 4]),
            name: "task-tracker-user",
            displayName: "Task Tracker User"
          },
          pubKeyCredParams: [
            { type: "public-key", alg: -7 }, // ES256
            { type: "public-key", alg: -257 } // RS256
          ],
          authenticatorSelection: {
            authenticatorAttachment: "platform",
            userVerification: "required"
          },
          timeout: 60000
        };

        const credential = await navigator.credentials.create({ publicKey: options });
        if (credential) {
          setIsSectionUnlocked(true);
          setter(true);
          setSaveStatus({ success: null, message: '' });
          return;
        }
      } catch (err) {
        console.warn("WebAuthn verification failed/cancelled, trying fallback PIN modal:", err);
        // If user cancelled or failed, fall back to PIN modal immediately
      }
    }

    // 3. Fallback: Open the premium Security PIN Modal
    setPendingSetter(() => setter);
    setPinInput('');
    setPinError('');
    setShowPinModal(true);
    setSaveStatus({ success: null, message: '' });
  };

  const handlePinDigitClick = (num) => {
    if (pinInput.length >= 4) return;
    const newPin = pinInput + num;
    setPinInput(newPin);
    
    // Automatically submit once 4 digits are completed
    if (newPin.length === 4) {
      verifyPin(newPin);
    }
  };

  const handlePinBackspace = () => {
    setPinInput(prev => prev.slice(0, -1));
  };

  const verifyPin = (pinValue) => {
    if (lockoutTimeLeft > 0) return;

    const profile = JSON.parse(localStorage.getItem('apex_tasks_local_profile') || '{}');
    const storedPin = profile.securityPin || '1234'; // Default fallback PIN for older configs

    if (pinValue === storedPin) {
      setIsSectionUnlocked(true);
      if (pendingSetter) {
        pendingSetter(true);
      }
      setShowPinModal(false);
      setPinInput('');
      setPinError('');
      setPendingSetter(null);
      setFailedAttempts(0);
    } else {
      const nextAttempts = failedAttempts + 1;
      setFailedAttempts(nextAttempts);
      setPinInput('');
      
      if (nextAttempts >= 3) {
        setLockoutTimeLeft(30);
        setPinError('');
      } else {
        setPinError(`Incorrect Passcode (${3 - nextAttempts} attempts left)`);
        setTimeout(() => {
          setPinError(prev => prev.startsWith('Incorrect') ? '' : prev);
        }, 2000);
      }
    }
  };

  useEffect(() => {
    if (lockoutTimeLeft <= 0) return;
    const timer = setInterval(() => {
      setLockoutTimeLeft(prev => {
        if (prev <= 1) {
          setFailedAttempts(0);
          setPinError('');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [lockoutTimeLeft]);

  useEffect(() => {
    if (!showPinModal) return;
    
    const handleKeyDown = (e) => {
      if (lockoutTimeLeft > 0) return;
      
      if (e.key >= '0' && e.key <= '9') {
        handlePinDigitClick(parseInt(e.key, 10));
      } else if (e.key === 'Backspace') {
        handlePinBackspace();
      } else if (e.key === 'Enter') {
        if (pinInput.length === 4) {
          verifyPin(pinInput);
        }
      } else if (e.key === 'Escape') {
        setShowPinModal(false);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showPinModal, pinInput, lockoutTimeLeft, pendingSetter]);

  const handleConfigSubmit = (e) => {
    e.preventDefault();
    if (!apiKey.trim() || !projectId.trim() || !appId.trim()) {
      setSaveStatus({ success: false, message: 'Please fill in all required fields.' });
      return;
    }

    const config = {
      apiKey: apiKey.trim(),
      authDomain: `${projectId.trim()}.firebaseapp.com`,
      projectId: projectId.trim(),
      storageBucket: `${projectId.trim()}.appspot.com`,
      appId: appId.trim()
    };

    try {
      saveFirebaseConfig(config);
      setIsFirebaseConfigured(true);
      setSaveStatus({ success: true, message: 'Configuration saved! Cloud synchronization is active.' });
      onConfigChanged();
      
      setTimeout(() => {
        setSaveStatus({ success: null, message: '' });
      }, 4000);
    } catch (err) {
      setSaveStatus({ success: false, message: err.message });
    }
  };

  const handleDisconnect = () => {
    clearFirebaseConfig();
    setApiKey('');
    setProjectId('');
    setAppId('');
    setIsFirebaseConfigured(false);
    setSaveStatus({ success: true, message: 'Disconnected from cloud database. Sync inactive.' });
    onConfigChanged();

    setTimeout(() => {
      setSaveStatus({ success: null, message: '' });
    }, 4000);
  };

  return (
    <div className="profile-card sync-config-panel">
      <div className="card-header-row">
        <Database size={16} className="card-icon" style={{ color: 'var(--primary)' }} />
        <div>
          <h3>Cloud Database Sync</h3>
          <p className="card-header-desc">Synchronize tasks and reports automatically in real-time across multiple devices.</p>
        </div>
      </div>

      <form onSubmit={handleConfigSubmit} className="sync-config-form">
        <div className="form-field">
          <label>Firebase API Key *</label>
          <div className="input-with-icon-wrapper">
            <input 
              type={showApiKey ? "text" : "password"} 
              placeholder="AIzaSy..." 
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              disabled={isFirebaseConfigured}
              required
            />
            <button 
              type="button" 
              className="input-icon-btn"
              onClick={() => handleToggleShowKey(setShowApiKey, showApiKey)}
            >
              {showApiKey ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>
        </div>

        <div className="form-field">
          <label>Firebase Project ID *</label>
          <div className="input-with-icon-wrapper">
            <input 
              type={showProjectId ? "text" : "password"} 
              placeholder="my-tasks-tracker-123" 
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              disabled={isFirebaseConfigured}
              required
            />
            <button 
              type="button" 
              className="input-icon-btn"
              onClick={() => handleToggleShowKey(setShowProjectId, showProjectId)}
            >
              {showProjectId ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>
        </div>

        <div className="form-field">
          <label>Firebase App ID *</label>
          <div className="input-with-icon-wrapper">
            <input 
              type={showAppId ? "text" : "password"} 
              placeholder="1:1234567890:web:abcdef123456" 
              value={appId}
              onChange={(e) => setAppId(e.target.value)}
              disabled={isFirebaseConfigured}
              required
            />
            <button 
              type="button" 
              className="input-icon-btn"
              onClick={() => handleToggleShowKey(setShowAppId, showAppId)}
            >
              {showAppId ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>
        </div>

        {saveStatus.message && (
          <div className={`status-banner ${saveStatus.success ? 'status-success' : 'status-error'}`}>
            {saveStatus.message}
          </div>
        )}

        <div className="sync-actions-row">
          {isFirebaseConfigured ? (
            <button 
              type="button" 
              className="btn-secondary disconnect-btn"
              onClick={handleDisconnect}
              style={{ borderColor: 'var(--accent)', color: 'var(--accent)' }}
            >
              Disconnect Sync
            </button>
          ) : (
            <button type="submit" className="btn-primary flex-center gap-6">
              <Save size={14} /> Enable Cloud Sync
            </button>
          )}
        </div>
      </form>
      
      <div className="sync-guide-card">
        <h4><HelpCircle size={12} style={{ verticalAlign: 'middle', marginRight: '4px' }} /> Setup Instructions</h4>
        <ol>
          <li>Create a free project in the <a href="https://console.firebase.google.com" target="_blank" rel="noreferrer">Firebase Console</a>.</li>
          <li>Add a **Web App** registry to get your configuration parameters.</li>
          <li>Enable **Cloud Firestore** in test mode or with open read/write permission rules.</li>
          <li>Paste API Key, Project ID, and App ID keys above. Replicate on your phone to complete sync setup!</li>
        </ol>
      </div>

      {/* Beautiful Lock screen / PIN Verification Modal Overlay */}
      <AnimatePresence>
        {showPinModal && (
          <div className="onboarding-overlay" style={{ zIndex: 3000 }}>
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="onboarding-box pin-verification-box"
              style={{ maxWidth: '360px', alignItems: 'center', textAlign: 'center', padding: '30px' }}
            >
              <div className="onboarding-badge" style={{ margin: '0 auto 12px auto' }}>
                <Lock size={16} />
              </div>
              <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.25rem', marginBottom: '4px' }}>
                Passcode Verification
              </h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '20px' }}>
                Enter your 4-digit Security PIN to view keys.
              </p>

              {/* 4 dots PIN indicators */}
              <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', marginBottom: '24px' }}>
                {[0, 1, 2, 3].map((i) => (
                  <div 
                    key={i} 
                    style={{
                      width: '12px',
                      height: '12px',
                      borderRadius: '50%',
                      border: '1px solid var(--border-focus)',
                      background: pinInput.length > i ? 'var(--primary)' : 'transparent',
                      transition: 'all 0.15s ease'
                    }}
                  />
                ))}
              </div>

              {lockoutTimeLeft > 0 ? (
                <div style={{ color: 'var(--accent)', fontSize: '0.82rem', fontWeight: '600', marginBottom: '16px' }}>
                  Too many failed attempts. Locked for {lockoutTimeLeft}s.
                </div>
              ) : pinError ? (
                <motion.div 
                  animate={{ x: [-8, 8, -8, 8, 0] }}
                  transition={{ duration: 0.4 }}
                  style={{ color: 'var(--accent)', fontSize: '0.82rem', fontWeight: '600', marginBottom: '16px' }}
                >
                  {pinError}
                </motion.div>
              ) : null}

              {/* Numeric Keypad Grid */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '12px',
                width: '100%',
                maxWidth: '240px',
                margin: '0 auto 20px auto'
              }}>
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                  <button
                    key={num}
                    type="button"
                    disabled={lockoutTimeLeft > 0}
                    onClick={() => handlePinDigitClick(num)}
                    style={{
                      height: '50px',
                      borderRadius: '50%',
                      background: 'var(--bg-input)',
                      border: '1px solid var(--border)',
                      color: 'var(--text-main)',
                      fontSize: '1.1rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: lockoutTimeLeft > 0 ? 'not-allowed' : 'pointer',
                      opacity: lockoutTimeLeft > 0 ? 0.4 : 1,
                      transition: 'all 0.2s ease'
                    }}
                  >
                    {num}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setShowPinModal(false)}
                  style={{
                    height: '50px',
                    color: 'var(--text-muted)',
                    fontSize: '0.82rem',
                    background: 'transparent',
                    border: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={lockoutTimeLeft > 0}
                  onClick={() => handlePinDigitClick(0)}
                  style={{
                    height: '50px',
                    borderRadius: '50%',
                    background: 'var(--bg-input)',
                    border: '1px solid var(--border)',
                    color: 'var(--text-main)',
                    fontSize: '1.1rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: lockoutTimeLeft > 0 ? 'not-allowed' : 'pointer',
                    opacity: lockoutTimeLeft > 0 ? 0.4 : 1,
                    transition: 'all 0.2s ease'
                  }}
                >
                  0
                </button>
                <button
                  type="button"
                  disabled={lockoutTimeLeft > 0}
                  onClick={handlePinBackspace}
                  style={{
                    height: '50px',
                    color: 'var(--text-muted)',
                    fontSize: '0.82rem',
                    background: 'transparent',
                    border: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: lockoutTimeLeft > 0 ? 'not-allowed' : 'pointer',
                    opacity: lockoutTimeLeft > 0 ? 0.4 : 1,
                    transition: 'all 0.2s ease'
                  }}
                >
                  Clear
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default SyncConfigForm;
