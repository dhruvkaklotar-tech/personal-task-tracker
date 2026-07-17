import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, ListTodo, ChevronUp, ChevronDown, Trash2 } from 'lucide-react';

function TaskCard({ 
  task, 
  onToggleComplete, 
  onToggleFailed,
  onToggleSubtask, 
  onDelete, 
  isExpanded, 
  onToggleExpand 
}) {
  const completedSubtasksCount = task.subtasks ? task.subtasks.filter(s => s.completed).length : 0;
  const hasSubtasks = task.subtasks && task.subtasks.length > 0;

  return (
    <motion.div 
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ duration: 0.2 }}
      className={`task-card ${task.completed ? 'completed-card' : ''} ${task.failed ? 'failed-card' : ''}`}
    >
      <div className="task-card-main">
        {/* Left Side: Double Custom Checkboxes (Horizontal Row) */}
        <div className="task-card-checkboxes">
          {/* Checkbox A: Complete */}
          <label className="custom-checkbox" title="Mark Completed">
            <input 
              type="checkbox" 
              checked={task.completed} 
              onChange={() => onToggleComplete(task)}
            />
            <span className="checkbox-checkmark checkmark-success" />
          </label>
          
          {/* Checkbox B: Incomplete / Missed */}
          <label className="custom-checkbox custom-checkbox-fail" title="Mark Incomplete / Missed">
            <input 
              type="checkbox" 
              checked={task.failed} 
              onChange={() => onToggleFailed(task)}
            />
            <span className="checkbox-checkmark checkmark-failure" />
          </label>
        </div>

        <div className="task-card-content" onClick={onToggleExpand}>
          <h3 className={`task-title-text ${task.completed ? 'completed' : ''} ${task.failed ? 'failed-task-text' : ''}`}>
            {task.title}
          </h3>
          {task.description && (
            <p className="task-desc">{task.description}</p>
          )}
          
          <div className="task-badges-row">
            <span className={`badge badge-${task.category.toLowerCase()}`}>
              {task.category}
            </span>
            
            {task.dueTime && (
              <span className="task-due-date-badge">
                <Clock size={11} style={{ marginRight: '4px' }} />
                <span>{(() => {
                  const [hrs, mins] = task.dueTime.split(':');
                  const h = parseInt(hrs, 10);
                  const ampm = h >= 12 ? 'PM' : 'AM';
                  const formattedHrs = h % 12 || 12;
                  return `${formattedHrs}:${mins} ${ampm}`;
                })()}</span>
              </span>
            )}

            {hasSubtasks && (
              <span className="task-subtasks-count">
                <ListTodo size={11} style={{ marginRight: '4px' }} />
                <span>{completedSubtasksCount}/{task.subtasks.length} Subtasks</span>
              </span>
            )}
          </div>
        </div>

        <div className="task-card-actions">
          {hasSubtasks && (
            <button className="expand-card-btn" onClick={(e) => { e.stopPropagation(); onToggleExpand(); }}>
              {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
          )}
          <button className="delete-card-btn" onClick={(e) => { e.stopPropagation(); onDelete(task.id); }}>
            <Trash2 size={15} />
          </button>
        </div>
      </div>

      {/* Subtasks Accordion */}
      <AnimatePresence>
        {isExpanded && hasSubtasks && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="subtasks-container"
          >
            <div className="subtasks-divider" />
            <h4 className="subtasks-header">Action Steps</h4>
            <ul className="subtasks-list">
              {task.subtasks.map((sub) => (
                <li key={sub.id} className="subtask-item">
                  <label className="custom-checkbox subtask-checkbox">
                    <input 
                      type="checkbox" 
                      checked={sub.completed}
                      onChange={() => onToggleSubtask(task, sub.id)}
                    />
                    <span className="checkbox-checkmark checkmark-success" />
                  </label>
                  <span className={`subtask-title ${sub.completed ? 'completed-subtask' : ''}`}>
                    {sub.title}
                  </span>
                </li>
              ))}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default TaskCard;
