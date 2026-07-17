import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  initializeFirestore, 
  getFirestore,
  persistentLocalCache, 
  persistentMultipleTabManager,
  collection, 
  doc, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  onSnapshot,
  query,
  orderBy
} from 'firebase/firestore';

const FIREBASE_CONFIG_KEY = 'apex_tasks_firebase_config';
const LOCAL_TASKS_KEY = 'apex_tasks_local_tasks';
const LOCAL_PROFILE_KEY = 'apex_tasks_local_profile';

let firebaseApp = null;
let firestoreDb = null;
let isFirestoreInitialized = false;
let snapshotUnsubscribe = null;

let dbListeners = [];

// profile joinedAt is initialized to an ISO string for reliable parsing
const defaultProfile = {
  name: 'Productivity Enthusiast',
  avatar: 'avatar_male.png',
  role: '',
  bio: 'Managing personal schedule and tasks.',
  joinedAt: new Date().toISOString()
};

function notifyListeners() {
  if (!isFirestoreInitialized) {
    const tasks = getLocalTasks();
    dbListeners.forEach(listener => listener(tasks));
  }
}

export function getFirebaseConfig() {
  const config = localStorage.getItem(FIREBASE_CONFIG_KEY);
  return config ? JSON.parse(config) : null;
}

export function saveFirebaseConfig(config) {
  if (!config || !config.apiKey || !config.projectId) {
    throw new Error('Invalid Firebase Configuration keys.');
  }
  localStorage.setItem(FIREBASE_CONFIG_KEY, JSON.stringify(config));
  return initializeDb();
}

export function clearFirebaseConfig() {
  localStorage.removeItem(FIREBASE_CONFIG_KEY);
  firebaseApp = null;
  firestoreDb = null;
  isFirestoreInitialized = false;
  if (snapshotUnsubscribe) {
    snapshotUnsubscribe();
    snapshotUnsubscribe = null;
  }
  notifyListeners();
  return { success: true, mode: 'local' };
}

export function initializeDb() {
  const config = getFirebaseConfig();
  if (!config) {
    isFirestoreInitialized = false;
    return { success: true, mode: 'local', message: 'No firebase config. Running in Local-Only Mode.' };
  }

  try {
    if (getApps().length > 0) {
      firebaseApp = getApp();
      try {
        firestoreDb = getFirestore(firebaseApp);
      } catch (dbErr) {
        firestoreDb = initializeFirestore(firebaseApp, {
          localCache: persistentLocalCache({
            tabManager: persistentMultipleTabManager()
          })
        });
      }
    } else {
      firebaseApp = initializeApp(config);
      firestoreDb = initializeFirestore(firebaseApp, {
        localCache: persistentLocalCache({
          tabManager: persistentMultipleTabManager()
        })
      });
    }
    isFirestoreInitialized = true;
    return { success: true, mode: 'cloud', message: 'Sync Mode Active. Local-first Firestore Initialized.' };
  } catch (err) {
    console.error('Firebase initialization failed, falling back to Local Mode:', err);
    isFirestoreInitialized = false;
    return { success: false, mode: 'local', error: err.message };
  }
}

export function subscribeTasks(onUpdate) {
  dbListeners.push(onUpdate);
  
  if (isFirestoreInitialized && firestoreDb) {
    try {
      const q = query(collection(firestoreDb, 'tasks'), orderBy('createdAt', 'desc'));
      
      if (snapshotUnsubscribe) {
        snapshotUnsubscribe();
      }
      
      snapshotUnsubscribe = onSnapshot(q, (snapshot) => {
        const tasks = [];
        snapshot.forEach((doc) => {
          tasks.push({ id: doc.id, ...doc.data() });
        });
        
        localStorage.setItem(LOCAL_TASKS_KEY, JSON.stringify(tasks));
        dbListeners.forEach(listener => listener(tasks));
      }, (error) => {
        console.error("Firestore sync subscription failed, fallback to local cache", error);
        const tasks = getLocalTasks();
        dbListeners.forEach(listener => listener(tasks));
      });
    } catch (error) {
      console.warn("Firestore subscription failed, falling back to local init:", error);
      onUpdate(getLocalTasks());
    }
  } else {
    onUpdate(getLocalTasks());
  }
  
  return () => {
    dbListeners = dbListeners.filter(l => l !== onUpdate);
    if (dbListeners.length === 0 && snapshotUnsubscribe) {
      snapshotUnsubscribe();
      snapshotUnsubscribe = null;
    }
  };
}

function getLocalTasks() {
  const localTasks = localStorage.getItem(LOCAL_TASKS_KEY);
  if (!localTasks) return [];
  
  try {
    const tasks = JSON.parse(localTasks);
    if (!Array.isArray(tasks)) return [];
    
    let needsRewrite = false;
    const sanitizedTasks = tasks.map(task => {
      if (!task) return task;
      
      let taskUpdated = false;
      
      // Deduplicate and sanitize completedDates to prevent memory leak
      if (task.completedDates && Array.isArray(task.completedDates)) {
        if (task.completedDates.length > 50) {
          const unique = Array.from(new Set(task.completedDates)).slice(-50);
          if (unique.length !== task.completedDates.length) {
            task.completedDates = unique;
            taskUpdated = true;
          }
        }
      } else {
        task.completedDates = [];
        taskUpdated = true;
      }
      
      // Deduplicate and sanitize failedDates (critical for infinite loop recovery)
      if (task.failedDates && Array.isArray(task.failedDates)) {
        if (task.failedDates.length > 50) {
          const unique = Array.from(new Set(task.failedDates)).slice(-50);
          if (unique.length !== task.failedDates.length) {
            task.failedDates = unique;
            taskUpdated = true;
          }
        }
      } else {
        task.failedDates = [];
        taskUpdated = true;
      }
      
      if (taskUpdated) {
        needsRewrite = true;
      }
      return task;
    }).filter(Boolean);
    
    if (needsRewrite) {
      localStorage.setItem(LOCAL_TASKS_KEY, JSON.stringify(sanitizedTasks));
    }
    return sanitizedTasks;
  } catch (e) {
    console.warn("Failed to parse local tasks:", e);
    return [];
  }
}

function saveLocalTasks(tasks) {
  localStorage.setItem(LOCAL_TASKS_KEY, JSON.stringify(tasks));
}

export async function createTask(taskData) {
  const newTask = {
    ...taskData,
    completed: false,
    completedAt: null,
    failed: false,
    createdAt: new Date().toISOString(),
    completedDates: [], // Historical successes
    failedDates: [],    // Historical misses/incompletes
    subtasks: taskData.subtasks || [],
    archived: false
  };

  if (isFirestoreInitialized && firestoreDb) {
    try {
      const docRef = await addDoc(collection(firestoreDb, 'tasks'), newTask);
      return { id: docRef.id, ...newTask };
    } catch (error) {
      console.warn("Firestore write failed, saving to local storage queue:", error);
    }
  }

  newTask.id = 'local_' + Math.random().toString(36).substr(2, 9);
  const tasks = getLocalTasks();
  tasks.unshift(newTask);
  saveLocalTasks(tasks);
  notifyListeners();
  return newTask;
}

export async function updateTask(taskId, updates) {
  if (isFirestoreInitialized && firestoreDb) {
    try {
      const taskDocRef = doc(firestoreDb, 'tasks', taskId);
      await updateDoc(taskDocRef, updates);
      return true;
    } catch (error) {
      console.warn("Firestore update failed, saving locally:", error);
    }
  }

  const tasks = getLocalTasks();
  const index = tasks.findIndex(t => t.id === taskId);
  if (index !== -1) {
    tasks[index] = { ...tasks[index], ...updates };
    saveLocalTasks(tasks);
    notifyListeners();
    return true;
  }
  return false;
}

// Checkbox complete toggler (adds completion history, clears failed state)
export async function toggleTaskComplete(task) {
  const now = new Date();
  const last3AM = new Date(now);
  last3AM.setHours(3, 0, 0, 0);
  if (now.getHours() < 3) {
    last3AM.setDate(last3AM.getDate() - 1);
  }
  const next3AM = new Date(last3AM);
  next3AM.setDate(next3AM.getDate() + 1);

  const completedDates = task.completedDates ? [...task.completedDates] : [];
  const failedDates = task.failedDates ? [...task.failedDates] : [];
  const isCompleted = !task.completed;

  if (isCompleted) {
    completedDates.push(now.toISOString());
    // Clear failed state for today
    const filteredFailed = failedDates.filter(dateStr => {
      const d = new Date(dateStr);
      return !(d >= last3AM && d < next3AM);
    });
    return updateTask(task.id, {
      completed: true,
      completedDates,
      completedAt: now.toISOString(),
      failed: false,
      failedDates: filteredFailed
    });
  } else {
    const filteredCompleted = completedDates.filter(dateStr => {
      const d = new Date(dateStr);
      return !(d >= last3AM && d < next3AM);
    });
    return updateTask(task.id, {
      completed: false,
      completedDates: filteredCompleted,
      completedAt: null
    });
  }
}

// Incomplete/Missed toggler (adds failed history, clears completed state)
export async function toggleTaskFailed(task) {
  const now = new Date();
  const last3AM = new Date(now);
  last3AM.setHours(3, 0, 0, 0);
  if (now.getHours() < 3) {
    last3AM.setDate(last3AM.getDate() - 1);
  }
  const next3AM = new Date(last3AM);
  next3AM.setDate(next3AM.getDate() + 1);

  const failedDates = task.failedDates ? [...task.failedDates] : [];
  const completedDates = task.completedDates ? [...task.completedDates] : [];
  const isFailed = !task.failed;

  if (isFailed) {
    failedDates.push(now.toISOString());
    // Clear completed state for today
    const filteredCompleted = completedDates.filter(dateStr => {
      const d = new Date(dateStr);
      return !(d >= last3AM && d < next3AM);
    });
    return updateTask(task.id, {
      failed: true,
      failedDates,
      completed: false,
      completedDates: filteredCompleted,
      completedAt: null
    });
  } else {
    const filteredFailed = failedDates.filter(dateStr => {
      const d = new Date(dateStr);
      return !(d >= last3AM && d < next3AM);
    });
    return updateTask(task.id, {
      failed: false,
      failedDates: filteredFailed
    });
  }
}

// Manual Save & Reset tasks dashboard triggers
export async function saveProgressAndReset(tasks) {
  for (const task of tasks) {
    if (task.completed || task.failed) {
      await updateTask(task.id, {
        completed: false,
        failed: false
      });
    }
  }
}

// Check and reset completed/failed task statuses at 3 AM roll-over, including auto-saving pending tasks as failed
export function checkAndResetTasks(tasks) {
  const now = new Date();
  const last3AM = new Date(now);
  last3AM.setHours(3, 0, 0, 0);
  if (now.getHours() < 3) {
    last3AM.setDate(last3AM.getDate() - 1);
  }

  let hasLocalChanges = false;
  const updatedTasks = [...tasks];

  for (let i = 0; i < updatedTasks.length; i++) {
    const task = updatedTasks[i];
    let updates = {};
    let needsUpdate = false;

    // Collate all status dates to determine when it was last addressed
    const logs = [
      ...(task.completedDates || []).map(d => ({ date: new Date(d), type: 'completed' })),
      ...(task.failedDates || []).map(d => ({ date: new Date(d), type: 'failed' }))
    ].sort((a, b) => b.date - a.date);

    const latestLog = logs[0] ? logs[0].date : null;

    if (task.completed) {
      if (latestLog && latestLog < last3AM) {
        updates.completed = false;
        needsUpdate = true;
      }
    } else if (task.failed) {
      if (latestLog && latestLog < last3AM) {
        updates.failed = false;
        needsUpdate = true;
      }
    } else {
      // Auto-save pending unaddressed tasks as failed/missed for the previous cycle
      const createdDate = new Date(task.createdAt);
      const cycleStart = last3AM.getTime() - 24 * 60 * 60 * 1000;
      const alreadyAddressed = (latestLog && latestLog.getTime() >= cycleStart) || (createdDate.getTime() >= last3AM.getTime());

      if (!alreadyAddressed) {
        const failedDates = task.failedDates ? [...task.failedDates] : [];
        const logTime = new Date(last3AM);
        logTime.setMinutes(logTime.getMinutes() - 1); // 2:59 AM of the ended cycle
        failedDates.push(logTime.toISOString());
        
        updates.failedDates = failedDates;
        updates.failed = false;
        updates.completed = false;
        needsUpdate = true;
      }
    }

    if (needsUpdate) {
      updatedTasks[i] = { ...task, ...updates };
      hasLocalChanges = true;

      // Update cloud DB asynchronously in the background
      if (isFirestoreInitialized && firestoreDb) {
        try {
          const taskDocRef = doc(firestoreDb, 'tasks', task.id);
          updateDoc(taskDocRef, updates);
        } catch (e) {
          // Silent catch to prevent blockages
        }
      }
    }
  }

  if (hasLocalChanges) {
    saveLocalTasks(updatedTasks);
    // Notify React listeners only once to reload stats and items cleanly
    notifyListeners();
  }
}

// Delete tasks (Soft delete by setting archived: true to preserve historical stats)
export async function deleteTask(taskId) {
  if (isFirestoreInitialized && firestoreDb) {
    try {
      const taskDocRef = doc(firestoreDb, 'tasks', taskId);
      await updateDoc(taskDocRef, { archived: true });
      return true;
    } catch (error) {
      console.warn("Firestore archive failed, executing locally:", error);
    }
  }

  const tasks = getLocalTasks();
  const index = tasks.findIndex(t => t.id === taskId);
  if (index !== -1) {
    tasks[index] = { ...tasks[index], archived: true };
    saveLocalTasks(tasks);
    notifyListeners();
    return true;
  }
  return false;
}

export async function resetAllData() {
  localStorage.removeItem(LOCAL_TASKS_KEY);
  localStorage.removeItem(LOCAL_PROFILE_KEY);
  localStorage.removeItem('apex_tasks_onboarding_complete');
  
  if (isFirestoreInitialized && firestoreDb) {
    try {
      const q = collection(firestoreDb, 'tasks');
      const querySnapshot = await getDocs(q);
      const deletePromises = [];
      querySnapshot.forEach((doc) => {
        deletePromises.push(deleteDoc(doc.ref));
      });
      await Promise.all(deletePromises);
    } catch (error) {
      console.error("Firestore database reset failed:", error);
    }
  }

  notifyListeners();
  return { success: true };
}

export function getProfile() {
  try {
    const profile = localStorage.getItem(LOCAL_PROFILE_KEY);
    if (!profile) return defaultProfile;
    const parsed = JSON.parse(profile);
    if (!parsed.avatar || parsed.avatar === 'anime_avatar.png') {
      parsed.avatar = 'avatar_male.png';
      localStorage.setItem(LOCAL_PROFILE_KEY, JSON.stringify(parsed));
    }
    return parsed;
  } catch (e) {
    console.warn("Failed to parse profile data, falling back to defaults:", e);
    return defaultProfile;
  }
}

export function saveProfile(profileData) {
  localStorage.setItem(LOCAL_PROFILE_KEY, JSON.stringify(profileData));
  return profileData;
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
          // Format as YYYY-MM-DD local date string
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

  // Start back-checking starting from today if completed, otherwise starting from yesterday
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
