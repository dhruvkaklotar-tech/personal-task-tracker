import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  SafeAreaView, 
  StatusBar, 
  TouchableOpacity, 
  ScrollView, 
  Modal, 
  ActivityIndicator 
} from 'react-native';
import { Feather } from '@expo/vector-icons';

import { 
  getTasks, 
  createTask, 
  updateTask, 
  deleteTask, 
  toggleTaskComplete, 
  toggleTaskFailed, 
  getProfile, 
  saveProfile, 
  calculateStreak, 
  isFirebaseConfigured, 
  getFirebaseConfig, 
  initFirestore 
} from './src/lib/db';

import TaskCard from './src/components/TaskCard';
import TaskForm from './src/components/TaskForm';
import ReportsDashboard from './src/components/ReportsDashboard';
import ProfileDashboard from './src/components/ProfileDashboard';

const CATEGORIES = ['Work', 'Personal', 'Health', 'Finance', 'Urgent', 'General', 'Study'];

export default function App() {
  const [activeTab, setActiveTab] = useState('tasks');
  const [tasks, setTasks] = useState([]);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [expandedTasks, setExpandedTasks] = useState({});

  // Task list filters
  const [statusFilter, setStatusFilter] = useState('Active');
  const [categoryFilter, setCategoryFilter] = useState('All');

  // Load database details on mount
  useEffect(() => {
    async function loadData() {
      try {
        // Initialize dynamic Firestore configuration if set
        const config = await getFirebaseConfig();
        if (config) {
          initFirestore(config);
        }

        const loadedProfile = await getProfile();
        setProfile(loadedProfile);

        const loadedTasks = await getTasks();
        setTasks(loadedTasks);
      } catch (err) {
        console.error('Data loading error:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // Rollover timer check loop (every 30 seconds)
  useEffect(() => {
    const interval = setInterval(async () => {
      // Re-trigger getTasks which runs internally defined rollover calculations
      const updated = await getTasks();
      setTasks(updated);
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const handleCreateTask = async (taskData) => {
    const newTask = await createTask(taskData);
    setTasks(prev => [...prev, newTask]);
    setShowAddForm(false);
  };

  const handleToggleComplete = async (task) => {
    const updated = await toggleTaskComplete(task);
    if (updated) {
      setTasks(prev => prev.map(t => t.id === task.id ? updated : t));
    }
  };

  const handleToggleFailed = async (task) => {
    const updated = await toggleTaskFailed(task);
    if (updated) {
      setTasks(prev => prev.map(t => t.id === task.id ? updated : t));
    }
  };

  const handleToggleSubtask = async (task, subtaskId) => {
    const updatedSubtasks = task.subtasks.map(sub => {
      if (sub.id === subtaskId) {
        return { ...sub, completed: !sub.completed };
      }
      return sub;
    });
    const updated = await updateTask(task.id, { subtasks: updatedSubtasks });
    if (updated) {
      setTasks(prev => prev.map(t => t.id === task.id ? updated : t));
    }
  };

  const handleDeleteTask = async (id) => {
    await deleteTask(id);
    setTasks(prev => prev.filter(t => t.id !== id));
  };

  const handleProfileSaved = async (updatedProfile) => {
    const saved = await saveProfile(updatedProfile);
    setProfile(saved);
  };

  const handleResetData = () => {
    setTasks([]);
    setProfile(null);
    setActiveTab('tasks');
    setLoading(true);
    // Reload defaults
    getProfile().then(p => {
      setProfile(p);
      setLoading(false);
    });
  };

  const toggleExpand = (id) => {
    setExpandedTasks(prev => ({ ...prev, [id]: !prev[id] }));
  };

  if (loading || !profile) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#c2a06a" />
        <Text style={styles.loadingText}>Configuring Workspace...</Text>
      </View>
    );
  }

  // Filter Tasks list according to options
  const activeTasksList = tasks.filter(t => !t.archived);
  const filteredTasks = activeTasksList.filter(task => {
    const matchesCategory = categoryFilter === 'All' || task.category === categoryFilter;
    
    let matchesStatus = true;
    if (statusFilter === 'Active') matchesStatus = !task.completed && !task.failed;
    if (statusFilter === 'Completed') matchesStatus = task.completed;
    if (statusFilter === 'Missed') matchesStatus = task.failed;

    return matchesCategory && matchesStatus;
  });

  const pendingCount = activeTasksList.filter(t => !t.completed && !t.failed).length;
  const streak = calculateStreak(tasks);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0f172a" />
      
      {/* App Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Task Tracker</Text>
          <Text style={styles.headerSubtitle}>
            {pendingCount} focus {pendingCount === 1 ? 'task' : 'tasks'} pending
          </Text>
        </View>
        {streak > 0 ? (
          <View style={styles.streakBadge}>
            <Text style={styles.streakText}>🔥 {streak}</Text>
          </View>
        ) : null}
      </View>

      {/* Screen Area */}
      <View style={styles.mainContent}>
        {activeTab === 'tasks' && (
          <View style={styles.tasksTabWrapper}>
            {/* Filter Selector Tabs */}
            <View style={styles.filterTabsRow}>
              {['Active', 'Completed', 'Missed'].map((status) => {
                const isActive = statusFilter === status;
                return (
                  <TouchableOpacity 
                    key={status} 
                    style={[styles.filterTab, isActive && styles.filterTabActive]}
                    onPress={() => setStatusFilter(status)}
                  >
                    <Text style={[styles.filterTabText, isActive && styles.filterTabTextActive]}>
                      {status}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Category horizontal picker list */}
            <View style={styles.categorySelectWrapper}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryScrollView}>
                <TouchableOpacity 
                  style={[styles.catFilterBtn, categoryFilter === 'All' && styles.catFilterBtnActive]}
                  onPress={() => setCategoryFilter('All')}
                >
                  <Text style={[styles.catFilterText, categoryFilter === 'All' && styles.catFilterTextActive]}>
                    All Focus Areas
                  </Text>
                </TouchableOpacity>
                {CATEGORIES.map(cat => {
                  const isSelected = categoryFilter === cat;
                  return (
                    <TouchableOpacity 
                      key={cat}
                      style={[styles.catFilterBtn, isSelected && styles.catFilterBtnActive]}
                      onPress={() => setCategoryFilter(cat)}
                    >
                      <Text style={[styles.catFilterText, isSelected && styles.catFilterTextActive]}>
                        {cat}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>

            {/* Tasks list */}
            <ScrollView style={styles.listScroll} contentContainerStyle={styles.listScrollContent}>
              {filteredTasks.length > 0 ? (
                filteredTasks.map(task => (
                  <TaskCard 
                    key={task.id}
                    task={task}
                    onToggleComplete={handleToggleComplete}
                    onToggleFailed={handleToggleFailed}
                    onToggleSubtask={handleToggleSubtask}
                    onDelete={handleDeleteTask}
                    isExpanded={!!expandedTasks[task.id]}
                    onToggleExpand={() => toggleExpand(task.id)}
                  />
                ))
              ) : (
                <View style={styles.emptyView}>
                  <Feather name="folder-open" size={32} color="#475569" />
                  <Text style={styles.emptyTitle}>No tasks found</Text>
                  <Text style={styles.emptyDesc}>
                    Add a new focus card, or adjust category filters to start checking.
                  </Text>
                </View>
              )}
            </ScrollView>

            {/* Float Add Button */}
            <TouchableOpacity style={styles.fab} onPress={() => setShowAddForm(true)}>
              <Feather name="plus" size={24} color="#0f172a" />
            </TouchableOpacity>
          </View>
        )}

        {activeTab === 'reports' && (
          <ReportsDashboard tasks={tasks} />
        )}

        {activeTab === 'profile' && (
          <ProfileDashboard 
            profile={profile}
            onProfileSaved={handleProfileSaved}
            tasksCount={activeTasksList.length}
            streak={streak}
            onReset={handleResetData}
          />
        )}
      </View>

      {/* Bottom Navigation Tab Bar */}
      <View style={styles.navBar}>
        <TouchableOpacity 
          style={[styles.navItem, activeTab === 'tasks' && styles.navItemActive]} 
          onPress={() => setActiveTab('tasks')}
        >
          <Feather name="check-square" size={20} color={activeTab === 'tasks' ? '#c2a06a' : '#94a3b8'} />
          <Text style={[styles.navText, activeTab === 'tasks' && styles.navTextActive]}>Tasks</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.navItem, activeTab === 'reports' && styles.navItemActive]} 
          onPress={() => setActiveTab('reports')}
        >
          <Feather name="bar-chart-2" size={20} color={activeTab === 'reports' ? '#c2a06a' : '#94a3b8'} />
          <Text style={[styles.navText, activeTab === 'reports' && styles.navTextActive]}>Reports</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.navItem, activeTab === 'profile' && styles.navItemActive]} 
          onPress={() => setActiveTab('profile')}
        >
          <Feather name="user" size={20} color={activeTab === 'profile' ? '#c2a06a' : '#94a3b8'} />
          <Text style={[styles.navText, activeTab === 'profile' && styles.navTextActive]}>Profile</Text>
        </TouchableOpacity>
      </View>

      {/* Task Creation Modal */}
      <Modal
        visible={showAddForm}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowAddForm(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalWrapper}>
            <TaskForm 
              onSubmit={handleCreateTask}
              onClose={() => setShowAddForm(false)}
              categories={CATEGORIES}
            />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#0f172a',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    color: '#cbd5e1',
    fontSize: 14,
    fontWeight: '500',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
    backgroundColor: '#0f172a',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 2,
  },
  streakBadge: {
    backgroundColor: 'rgba(194, 160, 106, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(194, 160, 106, 0.2)',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  streakText: {
    fontSize: 13,
    color: '#c2a06a',
    fontWeight: 'bold',
  },
  mainContent: {
    flex: 1,
  },
  tasksTabWrapper: {
    flex: 1,
  },
  filterTabsRow: {
    flexDirection: 'row',
    backgroundColor: '#1e293b',
    margin: 16,
    marginBottom: 8,
    borderRadius: 8,
    padding: 3,
    borderWidth: 1,
    borderColor: '#334155',
  },
  filterTab: {
    flex: 1,
    paddingVertical: 6,
    alignItems: 'center',
    borderRadius: 6,
  },
  filterTabActive: {
    backgroundColor: '#334155',
  },
  filterTabText: {
    fontSize: 13,
    color: '#94a3b8',
    fontWeight: '600',
  },
  filterTabTextActive: {
    color: '#c2a06a',
  },
  categorySelectWrapper: {
    marginBottom: 8,
  },
  categoryScrollView: {
    paddingHorizontal: 16,
    gap: 8,
  },
  catFilterBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#1e293b',
    backgroundColor: '#1e293b',
  },
  catFilterBtnActive: {
    borderColor: '#c2a06a30',
    backgroundColor: '#c2a06a15',
  },
  catFilterText: {
    fontSize: 12,
    color: '#94a3b8',
    fontWeight: '600',
  },
  catFilterTextActive: {
    color: '#c2a06a',
  },
  listScroll: {
    flex: 1,
  },
  listScrollContent: {
    padding: 16,
    paddingTop: 8,
    paddingBottom: 80,
  },
  emptyView: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    gap: 12,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  emptyDesc: {
    fontSize: 13,
    color: '#64748b',
    textAlign: 'center',
    paddingHorizontal: 32,
    lineHeight: 18,
  },
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 16,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#c2a06a',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 6,
  },
  navBar: {
    flexDirection: 'row',
    height: 56,
    backgroundColor: '#1e293b',
    borderTopWidth: 1,
    borderTopColor: '#334155',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  navItem: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    height: '100%',
    gap: 2,
  },
  navItemActive: {
    // optional background highlight
  },
  navText: {
    fontSize: 11,
    color: '#94a3b8',
    fontWeight: '500',
  },
  navTextActive: {
    color: '#c2a06a',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  modalWrapper: {
    maxHeight: '80%',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    overflow: 'hidden',
  },
});
