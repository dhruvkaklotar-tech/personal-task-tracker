import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Shield, CheckCircle, Database } from 'lucide-react';
import { saveProfile, saveFirebaseConfig } from '../../lib/db';

function OnboardingWizard({ onComplete }) {
  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [role, setRole] = useState('');
  const [pin, setPin] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [projectId, setProjectId] = useState('');
  const [appId, setAppId] = useState('');
  const [error, setError] = useState('');

  const handleProfileSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please enter your name to customize your tracker.');
      return;
    }
    if (pin.length !== 4) {
      setError('Please set a secure 4-digit Security PIN.');
      return;
    }
    setError('');
    
    // Save profile data
    saveProfile({
      name: name.trim(),
      role: role.trim(),
      avatar: 'avatar_male.png',
      bio: 'Managing personal schedule and tasks.',
      joinedAt: new Date().toISOString(),
      securityPin: pin.trim()
    });

    setStep(2);
  };

  const handleSyncSubmit = (e) => {
    e.preventDefault();
    
    // If keys are provided, configure Firebase cloud sync
    if (apiKey || projectId || appId) {
      if (!apiKey.trim() || !projectId.trim() || !appId.trim()) {
        setError('Please fill in all Firebase fields or leave them all empty to run locally.');
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
      } catch (err) {
        setError(`Configuration error: ${err.message}`);
        return;
      }
    }

    localStorage.setItem('apex_tasks_onboarding_complete', 'true');
    onComplete();
  };

  return (
    <div className="onboarding-overlay">
      <AnimatePresence mode="wait">
        {step === 1 && (
          <motion.div 
            key="step1"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            className="onboarding-box"
          >
            <div className="onboarding-header">
              <div className="onboarding-badge"><User size={16} /></div>
              <h2>Initialize Profile</h2>
              <p>Welcome to Task Tracker. Customize your dashboard identity to begin.</p>
            </div>

            <form onSubmit={handleProfileSubmit} className="onboarding-form">
              <div className="form-field">
                <label>Your Name *</label>
                <input 
                  type="text" 
                  placeholder="Enter your name" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  autoFocus
                />
              </div>

              <div className="form-field">
                <label>Focus / Role</label>
                <input 
                  type="text" 
                  placeholder="Enter your focus or role (Optional)" 
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                />
              </div>

              <div className="form-field">
                <label>Security PIN (4 digits) *</label>
                <input 
                  type="password" 
                  maxLength={4}
                  placeholder="••••" 
                  value={pin}
                  onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                  required
                />
              </div>

              {error && <div className="onboarding-error">{error}</div>}

              <div className="onboarding-actions">
                <button type="submit" className="btn-primary">
                  Continue Setup
                </button>
              </div>
            </form>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div 
            key="step2"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            className="onboarding-box"
          >
            <div className="onboarding-header">
              <div className="onboarding-badge"><Database size={16} /></div>
              <h2>Sync Integration</h2>
              <p>Configure cross-device cloud synchronization now, or skip to run in Local-Only offline mode.</p>
            </div>

            <form onSubmit={handleSyncSubmit} className="onboarding-form">
              <div className="form-field">
                <label>Firebase API Key</label>
                <input 
                  type="password" 
                  placeholder="AIzaSy... (Optional)" 
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                />
              </div>

              <div className="form-field">
                <label>Firebase Project ID</label>
                <input 
                  type="text" 
                  placeholder="my-tasks-tracker-123 (Optional)" 
                  value={projectId}
                  onChange={(e) => setProjectId(e.target.value)}
                />
              </div>

              <div className="form-field">
                <label>Firebase App ID</label>
                <input 
                  type="password" 
                  placeholder="1:12345678:web:abcdef... (Optional)" 
                  value={appId}
                  onChange={(e) => setAppId(e.target.value)}
                />
              </div>

              {error && <div className="onboarding-error">{error}</div>}

              <div className="onboarding-actions" style={{ justifyContent: 'space-between' }}>
                <button 
                  type="button" 
                  className="btn-secondary"
                  onClick={() => {
                    localStorage.setItem('apex_tasks_onboarding_complete', 'true');
                    onComplete();
                  }}
                >
                  Run Offline-First (Skip)
                </button>
                
                <button type="submit" className="btn-primary">
                  Activate Sync & Start
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default OnboardingWizard;
