import AsyncStorage from '@react-native-async-storage/async-storage';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getFirestore, 
  doc, 
  setDoc, 
  deleteDoc, 
  collection,
  writeBatch
} from 'firebase/firestore';

const LOCAL_TASKS_KEY = 'apex_tasks_list';
const LOCAL_PROFILE_KEY = 'apex_tasks_profile';
const FIREBASE_CONFIG_KEY = 'apex_tasks_firebase_config';

// 3:00 AM Rollover Hour Configuration
export const ROLLOVER_HOUR = 3;

let dbInstance = null;

// Initialize Firestore connection dynamically
export function initFirestore(config) {
  if (!config || !config.apiKey || !config.projectId) {
    dbInstance = null;
    return null;
  }
  try {
    const app = getApps().length === 0 ? initializeApp(config) : getApp();
    dbInstance = getFirestore(app);
    return dbInstance;
  } catch (error) {
    console.error('Failed to initialize Firebase SDK:', error);
    dbInstance = null;
    return null;
  }
}

// Get Firestore Instance
export function getDb() {
  if (dbInstance) return dbInstance;
  
  // Try initializing from cached config synchronously if possible (will be run during startup async checks)
  return null;
}

// Load Firebase Config
export async function getFirebaseConfig() {
  try {
    const data = await AsyncStorage.getItem(FIREBASE_CONFIG_KEY);
    return data ? JSON.parse(data) : null;
  } catch (err) {
    console.error('Failed to load Firebase config:', err);
    return null;
  }
}

// Save Firebase Config
export async function saveFirebaseConfig(config) {
  try {
    if (config) {
      await AsyncStorage.setItem(FIREBASE_CONFIG_KEY, JSON.stringify(config));
      initFirestore(config);
    } else {
      await AsyncStorage.removeItem(FIREBASE_CONFIG_KEY);
      dbInstance = null;
    }
  } catch (err) {
    console.error('Failed to save Firebase config:', err);
  }
}

// Check if Firebase is configured
export async function isFirebaseConfigured() {
  const config = await getFirebaseConfig();
  return !!config;
}

// Helper to determine if a rollover is required based on last launch time
export function shouldRollover(lastLaunchTime) {
  if (!lastLaunchTime) return false;
  
  const now = new Date();
  const last = new Date(lastLaunchTime);
  
  // Calculate the boundary rollover point for today and yesterday
  const getRolloverPoint = (date) => {
    const r = new Date(date);
    r.setHours(ROLLOVER_HOUR, 0, 0, 0);
    return r;
  };
  
  const todayRollover = getRolloverPoint(now);
  
  // If the last launch was before today's 3:00 AM rollover, and current time is past 3:00 AM, rollover is triggered
  if (now >= todayRollover && last < todayRollover) {
    return true;
  }
  
  // If last launch was before yesterday's 3:00 AM rollover, trigger rollover
  const yesterdayRollover = new Date(todayRollover);
  yesterdayRollover.setDate(yesterdayRollover.getDate() - 1);
  if (last < yesterdayRollover) {
    return true;
  }
  
  return false;
}

// Perform 3:00 AM daily rollover checks on task items
export function rolloverDailyTasks(tasks) {
  let modified = false;
  const updatedTasks = tasks.map(task => {
    if (task.archived) return task;
    
    // Rollover tasks that are incomplete (failed) or completed
    const isCompleted = task.completed;
    const isFailed = task.failed;
    
    if (isCompleted || isFailed) {
      modified = true;
      return {
        ...task,
        archived: true // Move completed/failed to reports history
      };
    }
    return task;
  });
  
  return { updatedTasks, modified };
}

// Load Tasks from AsyncStorage
export async function getTasks() {
  try {
    const data = await AsyncStorage.getItem(LOCAL_TASKS_KEY);
    let tasks = data ? JSON.parse(data) : [];
    
    // Check if daily rollover is required
    const profile = await getProfile();
    if (profile.lastLaunch && shouldRollover(profile.lastLaunch)) {
      const { updatedTasks, modified } = rolloverDailyTasks(tasks);
      if (modified) {
        tasks = updatedTasks;
        await saveTasks(tasks);
      }
    }
    
    // Update last launch timestamp
    await saveProfile({
      ...profile,
      lastLaunch: new Date().toISOString()
    });
    
    return tasks;
  } catch (err) {
    console.error('Failed to fetch tasks:', err);
    return [];
  }
}

// Save Tasks to AsyncStorage & Sync to Firebase
export async function saveTasks(tasks) {
  try {
    await AsyncStorage.setItem(LOCAL_TASKS_KEY, JSON.stringify(tasks));
    
    // Dynamic Cloud Firestore Sync
    const config = await getFirebaseConfig();
    const db = getDb() || (config ? initFirestore(config) : null);
    const profile = await getProfile();
    
    if (db && profile && profile.id) {
      try {
        const batch = writeBatch(db);
        tasks.forEach(task => {
          const docRef = doc(db, `users/${profile.id}/tasks/${task.id}`);
          batch.set(docRef, task);
        });
        await batch.commit();
      } catch (syncErr) {
        console.warn('Network sync queued: database changes saved locally.', syncErr);
      }
    }
  } catch (err) {
    console.error('Failed to save tasks:', err);
  }
}

// Create new task
export async function createTask(taskData) {
  const tasks = await getTasks();
  const newTask = {
    id: Math.random().toString(36).substring(2, 9),
    createdAt: new Date().toISOString(),
    completed: false,
    failed: false,
    archived: false,
    completedDates: [],
    subtasks: [],
    ...taskData
  };
  
  tasks.push(newTask);
  await saveTasks(tasks);
  return newTask;
}

// Update task parameters
export async function updateTask(id, updates) {
  const tasks = await getTasks();
  const index = tasks.findIndex(t => t.id === id);
  if (index === -1) return null;
  
  tasks[index] = { ...tasks[index], ...updates };
  await saveTasks(tasks);
  return tasks[index];
}

// Delete task
export async function deleteTask(id) {
  const tasks = await getTasks();
  const filtered = tasks.filter(t => t.id !== id);
  await saveTasks(filtered);
  
  // Remove from Firestore if connected
  const config = await getFirebaseConfig();
  const db = getDb() || (config ? initFirestore(config) : null);
  const profile = await getProfile();
  
  if (db && profile && profile.id) {
    try {
      const docRef = doc(db, `users/${profile.id}/tasks/${id}`);
      await deleteDoc(docRef);
    } catch (syncErr) {
      console.warn('Network delete queued locally.', syncErr);
    }
  }
}

// Toggle task completion
export async function toggleTaskComplete(task) {
  const todayStr = new Date().toISOString();
  const completed = !task.completed;
  
  let completedDates = [...(task.completedDates || [])];
  if (completed) {
    completedDates.push(todayStr);
  } else {
    // Remove today's completion records if unmarked
    const todayLocal = new Date().toLocaleDateString('en-CA');
    completedDates = completedDates.filter(d => {
      const dLocal = new Date(d).toLocaleDateString('en-CA');
      return dLocal !== todayLocal;
    });
  }
  
  return await updateTask(task.id, {
    completed,
    failed: false, // Reset incomplete status when marked completed
    completedDates
  });
}

// Toggle task failed (incomplete / missed)
export async function toggleTaskFailed(task) {
  const failed = !task.failed;
  return await updateTask(task.id, {
    failed,
    completed: false // Reset completed status if marked failed
  });
}

// Fetch Profile settings
export async function getProfile() {
  try {
    const data = await AsyncStorage.getItem(LOCAL_PROFILE_KEY);
    if (data) {
      return JSON.parse(data);
    }
    
    // Return standard fallback profile if empty
    const defaultProfile = {
      id: 'usr_' + Math.random().toString(36).substring(2, 9),
      name: 'Explorer',
      role: 'Productivity Builder',
      bio: 'Organizing tasks and tracking focus areas.',
      avatar: 'avatar_male.png',
      joinedAt: new Date().toISOString(),
      lastLaunch: new Date().toISOString()
    };
    
    await AsyncStorage.setItem(LOCAL_PROFILE_KEY, JSON.stringify(defaultProfile));
    return defaultProfile;
  } catch (err) {
    console.error('Failed to fetch profile settings:', err);
    return {};
  }
}

// Save Profile settings
export async function saveProfile(profileData) {
  try {
    await AsyncStorage.setItem(LOCAL_PROFILE_KEY, JSON.stringify(profileData));
    return profileData;
  } catch (err) {
    console.error('Failed to save profile settings:', err);
    return profileData;
  }
}

// Reset system database (Factory Reset)
export async function resetAllData() {
  try {
    await AsyncStorage.removeItem(LOCAL_TASKS_KEY);
    await AsyncStorage.removeItem(LOCAL_PROFILE_KEY);
    await AsyncStorage.removeItem(FIREBASE_CONFIG_KEY);
    dbInstance = null;
  } catch (err) {
    console.error('Failed to reset system database:', err);
  }
}

// Calculate the current consecutive daily task completion streak
export function calculateStreak(tasks) {
  if (!tasks || tasks.length === 0) return 0;
  
  const uniqueDates = new Set();
  tasks.forEach(task => {
    if (task.completedDates && task.completedDates.length > 0) {
      task.completedDates.forEach(dateStr => {
        const d = new Date(dateStr);
        if (!isNaN(d.getTime())) {
          const localStr = d.toLocaleDateString('en-CA');
          uniqueDates.add(localStr);
        }
      });
    }
  });

  if (uniqueDates.size === 0) return 0;

  let streak = 0;
  const today = new Date();
  const checkDate = new Date(today);
  checkDate.setHours(0, 0, 0, 0);

  const getFormat = (d) => d.toLocaleDateString('en-CA');

  const todayStr = getFormat(checkDate);
  const yesterday = new Date(checkDate);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = getFormat(yesterday);

  // If no completions today and none yesterday, the streak is broken
  if (!uniqueDates.has(todayStr) && !uniqueDates.has(yesterdayStr)) {
    return 0;
  }

  // Start backcheck from today if completed, otherwise starting from yesterday
  const startCheck = uniqueDates.has(todayStr) ? checkDate : yesterday;

  while (true) {
    const checkStr = getFormat(startCheck);
    if (uniqueDates.has(checkStr)) {
      streak++;
      startCheck.setDate(startCheck.getDate() - 1);
    } else {
      break;
    }
  }

  return streak;
}
