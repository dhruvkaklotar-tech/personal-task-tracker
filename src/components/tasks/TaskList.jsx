import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Filter, FolderOpen, Save, CheckCircle } from 'lucide-react';
import TaskCard from './TaskCard';
import TaskForm from './TaskForm';
import { 
  createTask, 
  updateTask, 
  deleteTask, 
  toggleTaskComplete, 
  toggleTaskFailed
} from '../../lib/db';

const CATEGORIES = ['Work', 'Personal', 'Health', 'Finance', 'Urgent', 'General', 'Study'];

function TaskList({ tasks }) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All'); // Set default to 'All' to show all goals together cleanly
  const [expandedTasks, setExpandedTasks] = useState({});
  const [showSaveSuccess, setShowSaveSuccess] = useState(false);
  
  // Persistent Save Progress State using local storage date matching
  const [progressSaved, setProgressSaved] = useState(() => {
    const savedDate = localStorage.getItem('apex_tasks_progress_saved_date');
    return savedDate === new Date().toDateString();
  });

  // If new active tasks are added or tasks are unmarked, reset the saved state
  useEffect(() => {
    const hasUnaddressed = tasks.some(t => !t.completed && !t.failed);
    if (hasUnaddressed) {
      setProgressSaved(false);
      localStorage.removeItem('apex_tasks_progress_saved_date');
    }
  }, [tasks]);

  const handleCreateTask = async (taskData) => {
    await createTask(taskData);
    setShowAddForm(false);
  };

  const handleToggleComplete = async (task) => {
    await toggleTaskComplete(task);
  };

  const handleToggleFailed = async (task) => {
    await toggleTaskFailed(task);
  };

  const handleToggleSubtask = async (task, subtaskId) => {
    const updatedSubtasks = task.subtasks.map(sub => {
      if (sub.id === subtaskId) {
        return { ...sub, completed: !sub.completed };
      }
      return sub;
    });
    await updateTask(task.id, { subtasks: updatedSubtasks });
  };

  const handleDeleteTask = async (id) => {
    await deleteTask(id);
  };

  const toggleExpand = (id) => {
    setExpandedTasks(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleSaveProgress = () => {
    localStorage.setItem('apex_tasks_progress_saved_date', new Date().toDateString());
    setProgressSaved(true);
    setShowSaveSuccess(true);
    setTimeout(() => {
      setShowSaveSuccess(false);
    }, 4000);
  };

  // Filter tasks based on filters
  const filteredTasks = tasks.filter(task => {
    const matchesCategory = categoryFilter === 'All' || task.category === categoryFilter;
    
    let matchesStatus = true;
    if (statusFilter === 'Active') matchesStatus = !task.completed && !task.failed;
    if (statusFilter === 'Completed') matchesStatus = task.completed;

    return matchesCategory && matchesStatus;
  });

  const totalTasks = tasks.length;
  const activeCount = tasks.filter(t => !t.completed && !t.failed).length;
  const completedCount = tasks.filter(t => t.completed).length;
  const failedCount = tasks.filter(t => t.failed).length;
  const completionPercentage = totalTasks ? Math.round((completedCount / totalTasks) * 100) : 0;

  // Save Progress button appears only when all tasks are complete OR flagged incomplete/missed AND not saved yet
  const showSaveButton = tasks.length > 0 && tasks.every(t => t.completed || t.failed) && !progressSaved;

  // Hide empty state if user is currently adding a new task
  const showEmptyState = filteredTasks.length === 0 && !showAddForm;

  return (
    <div className="task-list-dashboard">
      {/* Save Success Banner */}
      <AnimatePresence>
        {showSaveSuccess && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="status-banner status-success"
            style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <CheckCircle size={16} />
            <span>Daily performance progress committed and saved to local analytics database successfully.</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Metric Cards Display (Four columns) */}
      <div className="metrics-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
        <div className="metric-card">
          <span className="metric-title">Active Tasks</span>
          <span className="metric-value">{activeCount}</span>
        </div>
        <div className="metric-card">
          <span className="metric-title">Completed Goals</span>
          <span className="metric-value" style={{ color: 'var(--secondary)' }}>{completedCount}</span>
        </div>
        <div className="metric-card">
          <span className="metric-title">Incomplete / Missed</span>
          <span className="metric-value" style={{ color: 'var(--accent)' }}>{failedCount}</span>
        </div>
        <div className="metric-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <span className="metric-title">Daily Completeness</span>
            <span className="metric-value" style={{ color: 'var(--primary)', fontSize: '1.5rem' }}>{completionPercentage}%</span>
          </div>
          <div className="progress-bar-bg" style={{ marginTop: '12px' }}>
            <motion.div 
              className="progress-bar-fill" 
              initial={{ width: 0 }}
              animate={{ width: `${completionPercentage}%` }}
              transition={{ duration: 0.4, ease: "easeOut" }}
            />
          </div>
        </div>
      </div>

      {/* If daily progress is saved, render the premium All Completed Splash card */}
      {progressSaved && tasks.length > 0 ? (
        <motion.div 
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="all-completed-card"
        >
          <div className="completed-icon-wrapper">
            <CheckCircle size={32} style={{ color: 'var(--primary)' }} />
          </div>
          <h3>Daily Journey Completed</h3>
          <p>
            All tasks have been successfully committed and locked in the reports database. 
            Excellent work today! Your productivity metrics are securely synced.
          </p>
          <button 
            type="button"
            className="btn-secondary btn-sm flex-center gap-6"
            onClick={() => {
              setProgressSaved(false);
              localStorage.removeItem('apex_tasks_progress_saved_date');
              setShowAddForm(true);
            }}
            style={{ marginTop: '8px' }}
          >
            <Plus size={13} /> Add Additional Task
          </button>
        </motion.div>
      ) : (
        <>
          {/* Control panel */}
          <div className="controls-row" style={{ marginTop: '24px' }}>
            <div className="filters-group" style={{ flex: 1, justifyContent: 'flex-start', gap: '16px' }}>
              {/* Status Tab selectors */}
              <div className="status-tabs">
                {['Active', 'Completed', 'All'].map(status => (
                  <button
                    key={status}
                    type="button"
                    className={`status-tab-btn ${statusFilter === status ? 'active' : ''}`}
                    onClick={() => setStatusFilter(status)}
                  >
                    {status}
                  </button>
                ))}
              </div>

              {/* Category dropdown */}
              <div className="select-wrapper">
                <Filter size={12} className="select-icon" />
                <select 
                  value={categoryFilter} 
                  onChange={(e) => setCategoryFilter(e.target.value)}
                >
                  <option value="All">All Focus Areas</option>
                  {CATEGORIES.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              {/* Save Progress Button - Disappears after click */}
              {showSaveButton && (
                <button 
                  type="button" 
                  className="btn-primary flex-center gap-6 save-progress-btn"
                  onClick={handleSaveProgress}
                  style={{ background: 'rgba(110, 138, 117, 0.15)', borderColor: 'var(--secondary)', color: 'var(--secondary)' }}
                >
                  <Save size={14} /> Save Progress
                </button>
              )}

              <button 
                className="btn-primary flex-center gap-6"
                onClick={() => setShowAddForm(true)}
                style={{ marginLeft: 'auto' }}
              >
                <Plus size={14} /> Add Task
              </button>
            </div>
          </div>

          {/* Form Panel for Creating Tasks - Wrapped in .add-task-panel */}
          <AnimatePresence>
            {showAddForm && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                style={{ marginBottom: '24px', overflow: 'hidden' }}
              >
                <div className="add-task-panel" style={{ marginTop: '16px' }}>
                  <TaskForm 
                    onSubmit={handleCreateTask} 
                    onClose={() => setShowAddForm(false)} 
                    categories={CATEGORIES}
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Tasks listing container */}
          <div className="tasks-container" style={{ marginTop: '16px' }}>
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
              showEmptyState && (
                <div className="empty-state">
                  <div className="empty-state-icon">
                    <FolderOpen size={24} style={{ color: 'var(--text-dark)' }} />
                  </div>
                  <h3>No tasks found</h3>
                  <p>Refine your active filters, or add a new daily focus card to begin tracking.</p>
                </div>
              )
            )}
          </div>
        </>
      )}
    </div>
  );
}

export default TaskList;
