import React, { useState } from 'react';
import { StyleSheet, Text, View, ScrollView, TextInput, TouchableOpacity, Alert } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { getFirebaseConfig, saveFirebaseConfig, resetAllData } from '../lib/db';

export default function ProfileDashboard({ 
  profile, 
  onProfileSaved, 
  tasksCount, 
  streak,
  onReset 
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(profile.name);
  const [role, setRole] = useState(profile.role);
  const [bio, setBio] = useState(profile.bio);

  const [firebaseConfig, setFirebaseConfig] = useState('');
  const [syncStatus, setSyncStatus] = useState(null);

  // Load existing config into text field on mount
  React.useEffect(() => {
    getFirebaseConfig().then(config => {
      if (config) {
        setFirebaseConfig(JSON.stringify(config, null, 2));
      }
    });
  }, []);

  const handleProfileSave = () => {
    if (!name.trim()) return;
    onProfileSaved({
      ...profile,
      name: name.trim(),
      role: role.trim(),
      bio: bio.trim()
    });
    setIsEditing(false);
  };

  const handleSaveSyncSettings = async () => {
    if (!firebaseConfig.trim()) {
      await saveFirebaseConfig(null);
      setSyncStatus({ type: 'success', msg: 'Firebase synchronization disabled.' });
      return;
    }
    try {
      const parsed = JSON.parse(firebaseConfig);
      if (!parsed.apiKey || !parsed.projectId) {
        throw new Error('Config missing apiKey or projectId');
      }
      await saveFirebaseConfig(parsed);
      setSyncStatus({ type: 'success', msg: 'Sync configurations updated and validated successfully.' });
    } catch (err) {
      setSyncStatus({ type: 'error', msg: 'Invalid JSON configuration format. Please verify configuration parameters.' });
    }
  };

  const handleResetSystem = () => {
    Alert.alert(
      "Confirm Factory Reset",
      "This action will permanently delete all task history, completed streaks, profile configurations, and cloud connections. This cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Reset Everything", 
          style: "destructive",
          onPress: async () => {
            await resetAllData();
            if (onReset) onReset();
          }
        }
      ]
    );
  };

  const formattedJoinDate = (() => {
    if (!profile.joinedAt) return 'N/A';
    const d = new Date(profile.joinedAt);
    return isNaN(d.getTime()) ? 'N/A' : d.toLocaleDateString(undefined, { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  })();

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <Text style={styles.title}>Profile & Settings</Text>

      {/* Profile Card */}
      <View style={styles.card}>
        <View style={styles.avatarSection}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarText}>{name ? name.substring(0, 2).toUpperCase() : 'U'}</Text>
          </View>

          {isEditing ? (
            <View style={styles.editForm}>
              <TextInput 
                style={styles.editInput} 
                value={name} 
                onChangeText={setName} 
                placeholder="Name" 
                placeholderTextColor="#64748b"
              />
              <TextInput 
                style={styles.editInput} 
                value={role} 
                onChangeText={setRole} 
                placeholder="Role" 
                placeholderTextColor="#64748b"
              />
              <TextInput 
                style={[styles.editInput, styles.bioInput]} 
                value={bio} 
                onChangeText={setBio} 
                placeholder="Short bio..." 
                placeholderTextColor="#64748b"
                multiline
              />
              <View style={styles.editActions}>
                <TouchableOpacity style={styles.cancelEditBtn} onPress={() => setIsEditing(false)}>
                  <Text style={styles.cancelEditText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.saveEditBtn} onPress={handleProfileSave}>
                  <Text style={styles.saveEditText}>Save</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View style={styles.infoArea}>
              <Text style={styles.profileName}>{profile.name}</Text>
              <Text style={styles.profileRole}>{profile.role}</Text>
              <Text style={styles.profileBio}>{profile.bio}</Text>
              <TouchableOpacity style={styles.editBtn} onPress={() => setIsEditing(true)}>
                <Feather name="edit-3" size={12} color="#c2a06a" />
                <Text style={styles.editBtnText}>Edit Profile</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        <View style={styles.divider} />

        {/* Triple Stat Row */}
        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statNum}>{tasksCount}</Text>
            <Text style={styles.statLabel}>Total Tasks</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statNum}>🔥 {streak}</Text>
            <Text style={styles.statLabel}>Streak</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statNum}>{formattedJoinDate}</Text>
            <Text style={styles.statLabel}>Joined Date</Text>
          </View>
        </View>
      </View>

      {/* Cloud Sync Config Panel */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Cloud Database Sync</Text>
        <Text style={styles.cardDescription}>
          Paste your Firebase web configuration JSON block below to sync your database in real-time. Leave blank to disable remote syncing.
        </Text>
        
        <TextInput 
          style={styles.codeArea} 
          multiline
          placeholder='{"apiKey": "...", "projectId": "...", ...}'
          placeholderTextColor="#64748b"
          value={firebaseConfig}
          onChangeText={setFirebaseConfig}
        />

        {syncStatus ? (
          <View style={[styles.statusBanner, syncStatus.type === 'error' ? styles.statusError : styles.statusSuccess]}>
            <Text style={[styles.statusText, { color: syncStatus.type === 'error' ? '#b85740' : '#cbd5e1' }]}>{syncStatus.msg}</Text>
          </View>
        ) : null}

        <TouchableOpacity style={styles.syncBtn} onPress={handleSaveSyncSettings}>
          <Feather name="save" size={14} color="#0f172a" />
          <Text style={styles.syncBtnText}>Commit Config</Text>
        </TouchableOpacity>
      </View>

      {/* Factory Reset Danger Zone */}
      <View style={[styles.card, styles.dangerCard]}>
        <Text style={styles.dangerTitle}>Danger Zone</Text>
        <Text style={styles.dangerDescription}>
          Performing a factory reset will erase all local and cached data.
        </Text>
        <TouchableOpacity style={styles.resetBtn} onPress={handleResetSystem}>
          <Feather name="alert-triangle" size={14} color="#ffffff" />
          <Text style={styles.resetBtnText}>Factory Reset Tracker</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 20,
    fontFamily: 'System',
  },
  card: {
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  avatarSection: {
    flexDirection: 'row',
    gap: 16,
    alignItems: 'flex-start',
  },
  avatarCircle: {
    width: 64,
    height: 64,
    borderRadius: 12,
    backgroundColor: '#334155',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#475569',
  },
  avatarText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#c2a06a',
  },
  infoArea: {
    flex: 1,
  },
  profileName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  profileRole: {
    fontSize: 12,
    color: '#c2a06a',
    textTransform: 'uppercase',
    fontWeight: '600',
    letterSpacing: 0.5,
    marginTop: 2,
  },
  profileBio: {
    fontSize: 13,
    color: '#94a3b8',
    marginTop: 6,
    lineHeight: 18,
  },
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 10,
    alignSelf: 'flex-start',
  },
  editBtnText: {
    fontSize: 12,
    color: '#c2a06a',
    fontWeight: '600',
  },
  editForm: {
    flex: 1,
    gap: 8,
  },
  editInput: {
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: '#475569',
    borderRadius: 6,
    color: '#ffffff',
    paddingHorizontal: 10,
    paddingVertical: 6,
    fontSize: 14,
  },
  bioInput: {
    height: 60,
    textAlignVertical: 'top',
  },
  editActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: 4,
  },
  cancelEditBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  cancelEditText: {
    color: '#cbd5e1',
    fontWeight: '600',
    fontSize: 13,
  },
  saveEditBtn: {
    backgroundColor: '#c2a06a',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 6,
  },
  saveEditText: {
    color: '#0f172a',
    fontWeight: 'bold',
    fontSize: 13,
  },
  divider: {
    height: 1,
    backgroundColor: '#334155',
    marginVertical: 16,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
  },
  statNum: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  statLabel: {
    fontSize: 10,
    color: '#94a3b8',
    textTransform: 'uppercase',
    marginTop: 2,
    fontWeight: '500',
  },
  cardTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94a3b8',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  cardDescription: {
    fontSize: 13,
    color: '#94a3b8',
    lineHeight: 18,
    marginBottom: 12,
  },
  codeArea: {
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 8,
    color: '#0ea5e9',
    fontFamily: 'System',
    fontSize: 12,
    padding: 10,
    height: 100,
    textAlignVertical: 'top',
    marginBottom: 12,
  },
  syncBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#c2a06a',
    borderRadius: 8,
    paddingVertical: 10,
  },
  syncBtnText: {
    color: '#0f172a',
    fontWeight: 'bold',
    fontSize: 14,
  },
  statusBanner: {
    padding: 10,
    borderRadius: 6,
    marginBottom: 12,
  },
  statusSuccess: {
    backgroundColor: 'rgba(110, 138, 117, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(110, 138, 117, 0.15)',
  },
  statusError: {
    backgroundColor: 'rgba(184, 87, 64, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(184, 87, 64, 0.15)',
  },
  statusText: {
    fontSize: 12,
    textAlign: 'center',
  },
  dangerCard: {
    borderColor: '#b8574040',
    backgroundColor: 'rgba(184, 87, 64, 0.02)',
  },
  dangerTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#b85740',
    marginBottom: 6,
  },
  dangerDescription: {
    fontSize: 13,
    color: '#cbd5e1',
    lineHeight: 18,
    marginBottom: 12,
  },
  resetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#b85740',
    borderRadius: 8,
    paddingVertical: 10,
  },
  resetBtnText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 14,
  },
});
