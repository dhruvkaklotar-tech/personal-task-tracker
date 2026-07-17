import React, { useState } from 'react';
import { PlusCircle, Trash2, Clock } from 'lucide-react';

function TaskForm({ categories, onSubmit, onClose }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState(categories[0] || 'Work');
  
  // Custom Time Selection states
  const [selectedHour, setSelectedHour] = useState('');
  const [selectedMinute, setSelectedMinute] = useState('');
  const [selectedPeriod, setSelectedPeriod] = useState('AM');
  
  // Subtasks list local states
  const [subtaskText, setSubtaskText] = useState('');
  const [subtasks, setSubtasks] = useState([]);

  const handleAddSubtask = () => {
    if (subtaskText.trim()) {
      setSubtasks([
        ...subtasks,
        { id: 'new_' + Date.now() + Math.random(), title: subtaskText.trim(), completed: false }
      ]);
      setSubtaskText('');
    }
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    if (!title.trim()) return;

    // Convert AM/PM Hour/Minute selectors to 24h dueTime string
    let dueTime = null;
    if (selectedHour && selectedMinute) {
      let h = parseInt(selectedHour, 10);
      if (selectedPeriod === 'PM' && h < 12) {
        h += 12;
      } else if (selectedPeriod === 'AM' && h === 12) {
        h = 0;
      }
      const formattedHour = h.toString().padStart(2, '0');
      dueTime = `${formattedHour}:${selectedMinute}`;
    }

    onSubmit({
      title: title.trim(),
      description: description.trim(),
      category,
      dueTime,
      subtasks
    });
  };

  return (
    <form onSubmit={handleFormSubmit} className="task-form">
      <div className="form-group-grid">
        <div className="form-field full-width">
          <label>Task Title *</label>
          <input 
            type="text" 
            placeholder="E.g., Design system alignment details" 
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </div>
        
        <div className="form-field full-width">
          <label>Details / Description</label>
          <textarea 
            placeholder="Enter task specifics..." 
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
          />
        </div>

        <div className="form-field">
          <label>Category</label>
          <select value={category} onChange={(e) => setCategory(e.target.value)}>
            {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
          </select>
        </div>

        {/* Custom Premium Time Picker Row */}
        <div className="form-field">
          <label>Target Time (Optional)</label>
          <div className="custom-time-picker-row">
            <select 
              value={selectedHour} 
              onChange={(e) => setSelectedHour(e.target.value)}
              title="Select Hour"
            >
              <option value="">Hour</option>
              {Array.from({ length: 12 }, (_, i) => i + 1).map(h => (
                <option key={h} value={h.toString().padStart(2, '0')}>{h}</option>
              ))}
            </select>

            <select 
              value={selectedMinute} 
              onChange={(e) => setSelectedMinute(e.target.value)}
              title="Select Minute"
            >
              <option value="">Min</option>
              {['00', '05', '10', '15', '20', '25', '30', '35', '40', '45', '50', '55'].map(m => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>

            <div className="period-toggle-group">
              <button 
                type="button" 
                className={`period-btn ${selectedPeriod === 'AM' ? 'active' : ''}`}
                onClick={() => setSelectedPeriod('AM')}
              >
                AM
              </button>
              <button 
                type="button" 
                className={`period-btn ${selectedPeriod === 'PM' ? 'active' : ''}`}
                onClick={() => setSelectedPeriod('PM')}
              >
                PM
              </button>
            </div>
          </div>
        </div>

        {/* Action Items List */}
        <div className="form-field full-width subtasks-form-section">
          <label>Action Items / Subtasks</label>
          <div className="subtask-input-row">
            <input 
              type="text" 
              placeholder="E.g., Complete wireframes" 
              value={subtaskText}
              onChange={(e) => setSubtaskText(e.target.value)}
              onKeyDown={(e) => { if(e.key === 'Enter') { e.preventDefault(); handleAddSubtask(); } }}
            />
            <button type="button" className="btn-secondary add-sub-btn" onClick={handleAddSubtask}>
              <PlusCircle size={16} />
            </button>
          </div>

          {subtasks.length > 0 && (
            <ul className="temp-subtasks-list">
              {subtasks.map((sub) => (
                <li key={sub.id} className="temp-subtask-item">
                  <span>{sub.title}</span>
                  <button 
                    type="button" 
                    className="remove-temp-sub-btn" 
                    onClick={() => setSubtasks(subtasks.filter(t => t.id !== sub.id))}
                  >
                    <Trash2 size={13} />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="form-actions-row">
        <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
        <button type="submit" className="btn-primary">Create Task</button>
      </div>
    </form>
  );
}

export default TaskForm;
