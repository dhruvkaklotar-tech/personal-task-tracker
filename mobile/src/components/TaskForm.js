import React, { useState } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, ScrollView } from 'react-native';
import { Feather } from '@expo/vector-icons';

export default function TaskForm({ onSubmit, onClose, categories }) {
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [category, setCategory] = useState(categories[0] || 'General');
  const [dueDate, setDueDate] = useState('');
  const [subtaskTitle, setSubtaskTitle] = useState('');
  const [subtasks, setSubtasks] = useState([]);

  const handleAddSubtask = () => {
    if (!subtaskTitle.trim()) return;
    const newSubtask = {
      id: Math.random().toString(36).substring(2, 9),
      title: subtaskTitle.trim(),
      completed: false
    };
    setSubtasks([...subtasks, newSubtask]);
    setSubtaskTitle('');
  };

  const handleRemoveSubtask = (id) => {
    setSubtasks(subtasks.filter(s => s.id !== id));
  };

  const handleFormSubmit = () => {
    if (!title.trim()) return;
    onSubmit({
      title: title.trim(),
      desc: desc.trim(),
      category,
      dueDate: dueDate.trim() || null,
      subtasks
    });
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <Text style={styles.formTitle}>Add New Focus Task</Text>

      {/* Title Field */}
      <View style={styles.formField}>
        <Text style={styles.label}>Task Title</Text>
        <TextInput 
          style={styles.input} 
          placeholder="e.g., Run code security audits" 
          placeholderTextColor="#64748b"
          value={title}
          onChangeText={setTitle}
        />
      </View>

      {/* Description Field */}
      <View style={styles.formField}>
        <Text style={styles.label}>Description</Text>
        <TextInput 
          style={[styles.input, styles.textArea]} 
          placeholder="Detailed task guidelines..." 
          placeholderTextColor="#64748b"
          multiline
          numberOfLines={3}
          value={desc}
          onChangeText={setDesc}
        />
      </View>

      {/* Grid Fields (Category + Due Date) */}
      <View style={styles.gridRow}>
        <View style={[styles.formField, { flex: 1 }]}>
          <Text style={styles.label}>Category</Text>
          <View style={styles.selectWrapper}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryRow}>
              {categories.map((cat) => {
                const isSelected = category === cat;
                return (
                  <TouchableOpacity 
                    key={cat}
                    style={[styles.catBtn, isSelected && styles.catBtnActive]}
                    onPress={() => setCategory(cat)}
                  >
                    <Text style={[styles.catBtnText, isSelected && styles.catBtnTextActive]}>
                      {cat}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </View>

      <View style={styles.formField}>
        <Text style={styles.label}>Due Date (e.g., YYYY-MM-DD)</Text>
        <TextInput 
          style={styles.input} 
          placeholder="Leave blank for today" 
          placeholderTextColor="#64748b"
          value={dueDate}
          onChangeText={setDueDate}
        />
      </View>

      {/* Subtask Creator */}
      <View style={styles.formField}>
        <Text style={styles.label}>Subtasks</Text>
        <View style={styles.subtaskInputRow}>
          <TextInput 
            style={[styles.input, { flex: 1 }]} 
            placeholder="Add subtask item..." 
            placeholderTextColor="#64748b"
            value={subtaskTitle}
            onChangeText={setSubtaskTitle}
          />
          <TouchableOpacity style={styles.addSubtaskBtn} onPress={handleAddSubtask}>
            <Feather name="plus" size={16} color="#0f172a" />
          </TouchableOpacity>
        </View>

        {/* Temporary Subtask List */}
        {subtasks.length > 0 ? (
          <View style={styles.tempSubtasksContainer}>
            {subtasks.map((sub) => (
              <View key={sub.id} style={styles.tempSubtaskRow}>
                <Text style={styles.tempSubtaskText}>{sub.title}</Text>
                <TouchableOpacity onPress={() => handleRemoveSubtask(sub.id)}>
                  <Feather name="trash-2" size={14} color="#b85740" />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        ) : null}
      </View>

      {/* Actions Button Row */}
      <View style={styles.actionsRow}>
        <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
          <Text style={styles.cancelBtnText}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.submitBtn, !title.trim() && styles.submitBtnDisabled]} onPress={handleFormSubmit} disabled={!title.trim()}>
          <Text style={styles.submitBtnText}>Create Task</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#1e293b',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#334155',
    padding: 16,
  },
  contentContainer: {
    paddingBottom: 24,
  },
  formTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 16,
    fontFamily: 'System',
  },
  formField: {
    marginBottom: 16,
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94a3b8',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 8,
    color: '#ffffff',
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  gridRow: {
    flexDirection: 'row',
    gap: 12,
  },
  selectWrapper: {
    marginTop: 4,
  },
  categoryRow: {
    gap: 6,
    paddingVertical: 2,
  },
  catBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#334155',
    backgroundColor: '#0f172a',
  },
  catBtnActive: {
    backgroundColor: '#c2a06a',
    borderColor: '#c2a06a',
  },
  catBtnText: {
    fontSize: 12,
    color: '#cbd5e1',
    fontWeight: '600',
  },
  catBtnTextActive: {
    color: '#0f172a',
  },
  subtaskInputRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  addSubtaskBtn: {
    backgroundColor: '#c2a06a',
    width: 36,
    height: 36,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tempSubtasksContainer: {
    marginTop: 10,
    backgroundColor: '#0f172a',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#334155',
    padding: 8,
  },
  tempSubtaskRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
  },
  tempSubtaskText: {
    fontSize: 13,
    color: '#cbd5e1',
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    borderTopWidth: 1,
    borderTopColor: '#334155',
    paddingTop: 16,
    marginTop: 8,
  },
  cancelBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    justifyContent: 'center',
  },
  cancelBtnText: {
    color: '#cbd5e1',
    fontWeight: '600',
    fontSize: 14,
  },
  submitBtn: {
    backgroundColor: '#c2a06a',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  submitBtnDisabled: {
    opacity: 0.5,
  },
  submitBtnText: {
    color: '#0f172a',
    fontWeight: 'bold',
    fontSize: 14,
  },
});
