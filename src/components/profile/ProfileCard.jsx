import React, { useState } from 'react';
import { Camera } from 'lucide-react';
import { saveProfile, calculateStreak } from '../../lib/db';

function ProfileCard({ profile, onProfileSaved, tasksCount, tasks }) {
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(profile.name);
  const [role, setRole] = useState(profile.role);
  const [bio, setBio] = useState(profile.bio);
  const [avatar, setAvatar] = useState(profile.avatar);

  const handleSubmit = (e) => {
    e.preventDefault();
    const updated = saveProfile({
      ...profile,
      name,
      role,
      bio,
      avatar
    });
    onProfileSaved(updated);
    setIsEditing(false);
  };
  const handleAvatarClick = () => {
    document.getElementById('avatar-file-input').click();
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setAvatar(event.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="profile-card">
      <div className="avatar-section">
        <div className="avatar-wrapper" onClick={handleAvatarClick} style={{ cursor: 'pointer' }} title="Change Avatar Photo">
          <img 
            src={avatar && (avatar.startsWith('data:') ? avatar : avatar.replace(/^\//, ''))} 
            alt="Avatar" 
          />
          <div className="avatar-edit-overlay">
            <Camera size={14} />
          </div>
        </div>
        
        <input 
          type="file" 
          id="avatar-file-input" 
          accept="image/*" 
          style={{ display: 'none' }} 
          onChange={handleFileChange} 
        />
        
        {!isEditing ? (
          <div className="profile-info text-center">
            <h2>{profile.name || 'User Identity'}</h2>
            {profile.role && <span className="profile-role">{profile.role}</span>}
            <p className="profile-bio">{profile.bio}</p>
            <button 
              className="btn-secondary btn-sm"
              onClick={() => {
                setName(profile.name);
                setRole(profile.role);
                setBio(profile.bio);
                setAvatar(profile.avatar);
                setIsEditing(true);
              }}
              style={{ marginTop: '14px' }}
            >
              Edit Profile
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="profile-form">
            <div className="form-field">
              <label>Choose Avatar Preset</label>
              <div style={{ display: 'flex', gap: '16px', marginTop: '4px', marginBottom: '8px' }}>
                <button
                  type="button"
                  onClick={() => setAvatar('avatar_male.png')}
                  style={{
                    width: '60px',
                    height: '60px',
                    border: (avatar === 'avatar_male.png' || avatar === '/avatar_male.png') ? '2px solid var(--primary)' : '1px solid var(--border)',
                    borderRadius: 'var(--radius-sm)',
                    overflow: 'hidden',
                    background: 'var(--bg-app)',
                    padding: '2px',
                    cursor: 'pointer'
                  }}
                  title="Male Preset"
                >
                  <img src="avatar_male.png" alt="Male" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </button>
                <button
                  type="button"
                  onClick={() => setAvatar('avatar_female.png')}
                  style={{
                    width: '60px',
                    height: '60px',
                    border: (avatar === 'avatar_female.png' || avatar === '/avatar_female.png') ? '2px solid var(--primary)' : '1px solid var(--border)',
                    borderRadius: 'var(--radius-sm)',
                    overflow: 'hidden',
                    background: 'var(--bg-app)',
                    padding: '2px',
                    cursor: 'pointer'
                  }}
                  title="Female Preset"
                >
                  <img src="avatar_female.png" alt="Female" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </button>
                <button
                  type="button"
                  onClick={handleAvatarClick}
                  style={{
                    width: '60px',
                    height: '60px',
                    border: (!['avatar_male.png', '/avatar_male.png', 'avatar_female.png', '/avatar_female.png'].includes(avatar) && !avatar?.startsWith('data:')) ? '2px solid var(--primary)' : '1px solid var(--border)',
                    borderRadius: 'var(--radius-sm)',
                    background: 'var(--bg-app)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--text-muted)',
                    fontSize: '0.65rem',
                    gap: '4px',
                    cursor: 'pointer'
                  }}
                  title="Upload Custom Image"
                >
                  <Camera size={16} />
                  <span>Upload</span>
                </button>
              </div>
            </div>
            
            <div className="form-field">
              <label>Display Name</label>
              <input 
                type="text" 
                value={name} 
                onChange={(e) => setName(e.target.value)} 
                required 
              />
            </div>
            <div className="form-field">
              <label>Title / Role</label>
              <input 
                type="text" 
                value={role} 
                onChange={(e) => setRole(e.target.value)} 
              />
            </div>
            <div className="form-field">
              <label>Bio</label>
              <textarea 
                value={bio} 
                onChange={(e) => setBio(e.target.value)} 
                rows={2} 
              />
            </div>
            <div className="profile-form-actions">
              <button 
                type="button" 
                className="btn-secondary btn-sm"
                onClick={() => setIsEditing(false)}
              >
                Cancel
              </button>
              <button type="submit" className="btn-primary btn-sm">
                Save Changes
              </button>
            </div>
          </form>
        )}
      </div>
      
      <div className="profile-stats-divider" />
      
      <div className="profile-stats-row">
        <div className="profile-stat-box">
          <span className="stat-num">{tasksCount}</span>
          <span className="stat-label">Total Tasks</span>
        </div>
        <div className="profile-stat-box">
          <span className="stat-num">
            🔥 {calculateStreak(tasks)}
          </span>
          <span className="stat-label">Current Streak</span>
        </div>
        <div className="profile-stat-box">
          <span className="stat-num">
            {(() => {
              if (!profile.joinedAt) return 'N/A';
              const d = new Date(profile.joinedAt);
              return isNaN(d.getTime()) ? 'N/A' : d.toLocaleDateString(undefined, { 
                month: 'short', 
                day: 'numeric', 
                year: 'numeric' 
              });
            })()}
          </span>
          <span className="stat-label">Joined Date</span>
        </div>
      </div>
    </div>
  );
}

export default ProfileCard;
