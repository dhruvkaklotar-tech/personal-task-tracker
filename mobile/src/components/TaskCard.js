import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { Feather, Ionicons } from '@expo/vector-icons';

const CATEGORY_COLORS = {
  Work: '#c2a06a',
  Personal: '#6e8a75',
  Health: '#84cc16',
  Finance: '#0ea5e9',
  Urgent: '#b85740',
  General: '#94a3b8',
  Study: '#3b82f6'
};

export default function TaskCard({ 
  task, 
  onToggleComplete, 
  onToggleFailed, 
  onToggleSubtask, 
  onDelete, 
  isExpanded, 
  onToggleExpand 
}) {
  const isCompleted = task.completed;
  const isFailed = task.failed;
  const totalSubtasks = task.subtasks ? task.subtasks.length : 0;
  const completedSubtasks = task.subtasks ? task.subtasks.filter(s => s.completed).length : 0;

  const categoryColor = CATEGORY_COLORS[task.category] || CATEGORY_COLORS.General;

  return (
    <View style={[
      styles.card, 
      isCompleted && styles.completedCard,
      isFailed && styles.failedCard
    ]}>
      <View style={styles.cardHeader}>
        {/* Completion Toggle */}
        <TouchableOpacity 
          style={[styles.checkbox, isCompleted && styles.checkboxChecked]} 
          onPress={() => onToggleComplete(task)}
        >
          {isCompleted && <Feather name="check" size={14} color="#0f172a" />}
        </TouchableOpacity>

        {/* Task Details */}
        <TouchableOpacity style={styles.contentArea} onPress={onToggleExpand}>
          <Text style={[
            styles.title, 
            isCompleted && styles.completedText,
            isFailed && styles.failedText
          ]}>
            {task.title}
          </Text>
          {task.desc ? (
            <Text style={[styles.desc, isCompleted && styles.completedText]} numberOfLines={2}>
              {task.desc}
            </Text>
          ) : null}
        </TouchableOpacity>

        {/* Task Actions */}
        <View style={styles.actionsRow}>
          {/* Missed / Failed Toggle */}
          <TouchableOpacity 
            style={[styles.missedBtn, isFailed && styles.missedBtnActive]} 
            onPress={() => onToggleFailed(task)}
          >
            <Feather name="x" size={14} color={isFailed ? '#ffffff' : '#b85740'} />
          </TouchableOpacity>

          {/* Delete Action */}
          <TouchableOpacity style={styles.deleteBtn} onPress={() => onDelete(task.id)}>
            <Feather name="trash-2" size={14} color="#94a3b8" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Badges and Subtasks Counters */}
      <View style={styles.badgesRow}>
        {/* Category Badge */}
        <View style={[styles.badge, { borderColor: categoryColor + '30', backgroundColor: categoryColor + '10' }]}>
          <Text style={[styles.badgeText, { color: categoryColor }]}>{task.category}</Text>
        </View>

        {/* Due Date Badge */}
        {task.dueDate ? (
          <View style={styles.dateBadge}>
            <Feather name="calendar" size={10} color="#c2a06a" />
            <Text style={styles.dateText}>{task.dueDate}</Text>
          </View>
        ) : null}

        {/* Subtask progress count */}
        {totalSubtasks > 0 ? (
          <TouchableOpacity style={styles.subtaskProgressBadge} onPress={onToggleExpand}>
            <Feather name="list" size={10} color="#94a3b8" />
            <Text style={styles.subtaskProgressText}>
              {completedSubtasks}/{totalSubtasks} Subtasks
            </Text>
          </TouchableOpacity>
        ) : null}

        {/* Expanded chevron */}
        {totalSubtasks > 0 ? (
          <TouchableOpacity style={styles.expandChevron} onPress={onToggleExpand}>
            <Feather name={isExpanded ? "chevron-up" : "chevron-down"} size={14} color="#94a3b8" />
          </TouchableOpacity>
        ) : null}
      </View>

      {/* Expandable Subtask List */}
      {isExpanded && totalSubtasks > 0 ? (
        <View style={styles.subtasksWrapper}>
          <View style={styles.divider} />
          <Text style={styles.subtasksTitle}>Subtasks</Text>
          {task.subtasks.map((subtask) => (
            <View key={subtask.id} style={styles.subtaskRow}>
              <TouchableOpacity 
                style={[styles.subCheckbox, subtask.completed && styles.subCheckboxChecked]}
                onPress={() => onToggleSubtask(task, subtask.id)}
              >
                {subtask.completed && <Feather name="check" size={10} color="#0f172a" />}
              </TouchableOpacity>
              <Text style={[styles.subtaskText, subtask.completed && styles.completedText]}>
                {subtask.title}
              </Text>
            </View>
          ))}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  completedCard: {
    opacity: 0.6,
  },
  failedCard: {
    borderColor: '#b8574040',
    backgroundColor: 'rgba(184, 87, 64, 0.03)',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#c2a06a',
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  checkboxChecked: {
    backgroundColor: '#c2a06a',
    borderColor: '#c2a06a',
  },
  contentArea: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    fontSize: 15,
    fontWeight: '600',
    color: '#ffffff',
    lineHeight: 20,
  },
  desc: {
    fontSize: 13,
    color: '#94a3b8',
    marginTop: 4,
    lineHeight: 18,
  },
  completedText: {
    textDecorationLine: 'line-through',
    color: '#64748b',
  },
  failedText: {
    color: '#b85740',
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  missedBtn: {
    width: 24,
    height: 24,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#b85740',
    alignItems: 'center',
    justifyContent: 'center',
  },
  missedBtnActive: {
    backgroundColor: '#b85740',
  },
  deleteBtn: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    flexWrap: 'wrap',
    gap: 8,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  dateBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#c2a06a30',
    backgroundColor: '#c2a06a10',
  },
  dateText: {
    fontSize: 10,
    color: '#c2a06a',
    fontWeight: '500',
  },
  subtaskProgressBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#334155',
    backgroundColor: '#1e293b',
  },
  subtaskProgressText: {
    fontSize: 10,
    color: '#94a3b8',
  },
  expandChevron: {
    marginLeft: 'auto',
    padding: 2,
  },
  subtasksWrapper: {
    marginTop: 12,
  },
  divider: {
    height: 1,
    backgroundColor: '#334155',
    marginBottom: 8,
  },
  subtasksTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94a3b8',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  subtaskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 4,
  },
  subCheckbox: {
    width: 14,
    height: 14,
    borderRadius: 3,
    borderWidth: 1,
    borderColor: '#94a3b8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  subCheckboxChecked: {
    backgroundColor: '#94a3b8',
    borderColor: '#94a3b8',
  },
  subtaskText: {
    fontSize: 13,
    color: '#cbd5e1',
  },
});
