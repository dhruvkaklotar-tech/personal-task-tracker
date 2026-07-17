import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CheckSquare, 
  BarChart2, 
  User, 
  Wifi, 
  WifiOff, 
  CloudLightning
} from 'lucide-react';
import Sidebar from './components/layout/Sidebar';
import Header from './components/layout/Header';
import TaskList from './components/tasks/TaskList';
import ReportsDashboard from './components/reports/ReportsDashboard';
import ProfileDashboard from './components/profile/ProfileDashboard';
import OnboardingWizard from './components/profile/OnboardingWizard';
import ErrorBoundary from './components/layout/ErrorBoundary';
import { initializeDb, subscribeTasks, checkAndResetTasks } from './lib/db';

function App() {
  const [onboardingComplete, setOnboardingComplete] = useState(
    localStorage.getItem('apex_tasks_onboarding_complete') === 'true'
  );
  const [activeTab, setActiveTab] = useState('tasks');
  const [tasks, setTasks] = useState([]);
  const [dbStatus, setDbStatus] = useState({ mode: 'local', message: 'Initializing...' });
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [theme, setTheme] = useState(
    localStorage.getItem('task_tracker_theme') || 'dark'
  );

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('task_tracker_theme', theme);
  }, [theme]);

  // Monitor network status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Keep a mutable ref of tasks to avoid re-triggering timers and loops
  const tasksRef = useRef(tasks);
  useEffect(() => {
    tasksRef.current = tasks;
  }, [tasks]);

  // Initialize DB and subscribe to reactive task updates
  useEffect(() => {
    // Only subscribe to tasks if onboarding is completed
    if (!onboardingComplete) return;

    // Run database init exactly once when onboarding completes/startup
    const status = initializeDb();
    setDbStatus(status);

    const unsubscribe = subscribeTasks((updatedTasks) => {
      // Run the 3:00 AM reset check immediately on load/updates
      checkAndResetTasks(updatedTasks);
      setTasks(updatedTasks);
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [onboardingComplete]);

  // Periodic check every minute to auto-reset completed/failed tasks to incomplete at 3 AM
  useEffect(() => {
    if (!onboardingComplete) return;

    const interval = setInterval(() => {
      if (tasksRef.current.length > 0) {
        checkAndResetTasks(tasksRef.current);
      }
    }, 60000); // 1 minute interval
    return () => clearInterval(interval);
  }, [onboardingComplete]);

  const refreshDbConnection = () => {
    const status = initializeDb();
    setDbStatus(status);
  };

  const handleOnboardingComplete = () => {
    setOnboardingComplete(true);
  };

  const navItems = [
    { id: 'tasks', label: 'My Tasks', icon: CheckSquare },
    { id: 'reports', label: 'Reports', icon: BarChart2 },
    { id: 'profile', label: 'Profile & Settings', icon: User }
  ];

  const pendingTasksCount = tasks.filter(t => !t.archived && !t.completed && !t.failed).length;

  if (!onboardingComplete) {
    return <OnboardingWizard onComplete={handleOnboardingComplete} />;
  }

  return (
    <div className="app-container">
      {/* Sidebar Nav Component */}
      <Sidebar 
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        dbStatus={dbStatus}
        isOnline={isOnline}
        navItems={navItems}
      />

      {/* Main content grid */}
      <main className="main-content">
        {/* Header Component */}
        <Header 
          activeTab={activeTab}
          setSidebarOpen={setSidebarOpen}
          pendingTasksCount={pendingTasksCount}
        />

        <section className="content-body">
          <div className="tab-content-wrapper">
            {activeTab === 'tasks' && (
              <TaskList tasks={tasks.filter(t => !t.archived)} />
            )}
            {activeTab === 'reports' && (
              <ErrorBoundary>
                <ReportsDashboard tasks={tasks} />
              </ErrorBoundary>
            )}
            {activeTab === 'profile' && (
              <ErrorBoundary>
                <ProfileDashboard 
                  theme={theme}
                  setTheme={setTheme}
                  onConfigChanged={refreshDbConnection} 
                  onReset={() => {
                    localStorage.removeItem('apex_tasks_onboarding_complete');
                    setOnboardingComplete(false);
                    setActiveTab('tasks');
                  }} 
                  tasksCount={tasks.filter(t => !t.archived).length}
                  tasks={tasks}
                />
              </ErrorBoundary>
            )}
          </div>
        </section>
      </main>

      {/* Bottom Nav Bar for Mobile Screens */}
      <div className="mobile-nav-bar">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              className={`mobile-nav-item ${isActive ? 'active' : ''}`}
              onClick={() => setActiveTab(item.id)}
            >
              <Icon size={20} />
              <span>{item.label.split(' ')[0]}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default App;
