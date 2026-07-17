import React from 'react';
import { StyleSheet, Text, View, ScrollView } from 'react-native';
import { Feather } from '@expo/vector-icons';

const CATEGORY_COLORS = {
  Work: '#c2a06a',
  Personal: '#6e8a75',
  Health: '#84cc16',
  Finance: '#0ea5e9',
  Urgent: '#b85740',
  General: '#94a3b8',
  Study: '#3b82f6'
};

export default function ReportsDashboard({ tasks }) {
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.completed).length;
  const failedTasks = tasks.filter(t => t.failed).length;
  const activeTasks = tasks.filter(t => !t.completed && !t.failed && !t.archived).length;
  
  const completionPercentage = totalTasks ? Math.round((completedTasks / totalTasks) * 100) : 0;

  // Group tasks by category
  const categoryCounts = {};
  tasks.forEach(task => {
    if (task.completed) {
      categoryCounts[task.category] = (categoryCounts[task.category] || 0) + 1;
    }
  });

  const categories = Object.keys(categoryCounts);

  // Filter archived tasks for logs
  const archivedLogs = tasks.filter(t => t.archived);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <Text style={styles.title}>Analytics & Reports</Text>

      {/* Progress Card */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Daily Completeness</Text>
        <View style={styles.progressRow}>
          <View style={styles.circlePlaceholder}>
            <Text style={styles.circleText}>{completionPercentage}%</Text>
          </View>
          <View style={styles.statsCol}>
            <View style={styles.statLabelRow}>
              <View style={[styles.dot, { backgroundColor: '#6e8a75' }]} />
              <Text style={styles.statText}>{completedTasks} Completed</Text>
            </View>
            <View style={styles.statLabelRow}>
              <View style={[styles.dot, { backgroundColor: '#b85740' }]} />
              <Text style={styles.statText}>{failedTasks} Incomplete / Missed</Text>
            </View>
            <View style={styles.statLabelRow}>
              <View style={[styles.dot, { backgroundColor: '#c2a06a' }]} />
              <Text style={styles.statText}>{activeTasks} Active</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Category Breakdowns */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Focus Distributions</Text>
        {categories.length > 0 ? (
          <View style={styles.distributionWrapper}>
            {categories.map(cat => {
              const count = categoryCounts[cat];
              const percent = Math.round((count / completedTasks) * 100);
              const color = CATEGORY_COLORS[cat] || CATEGORY_COLORS.General;
              return (
                <View key={cat} style={styles.barRow}>
                  <View style={styles.barInfo}>
                    <Text style={styles.barLabel}>{cat}</Text>
                    <Text style={styles.barValue}>{count} ({percent}%)</Text>
                  </View>
                  <View style={styles.barBg}>
                    <View style={[styles.barFill, { width: `${percent}%`, backgroundColor: color }]} />
                  </View>
                </View>
              );
            })}
          </View>
        ) : (
          <Text style={styles.emptyText}>Complete tasks to log focus area distributions.</Text>
        )}
      </View>

      {/* Historical Logs */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Historical Logs</Text>
        {archivedLogs.length > 0 ? (
          <View style={styles.logsList}>
            {archivedLogs.slice(0, 10).map((log) => (
              <View key={log.id} style={styles.logRow}>
                <Feather 
                  name={log.completed ? "check-circle" : "alert-circle"} 
                  size={14} 
                  color={log.completed ? '#6e8a75' : '#b85740'} 
                />
                <Text style={styles.logText} numberOfLines={1}>{log.title}</Text>
                <Text style={styles.logCategory}>{log.category}</Text>
              </View>
            ))}
          </View>
        ) : (
          <Text style={styles.emptyText}>No historical logs archived yet.</Text>
        )}
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
  cardTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94a3b8',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 24,
  },
  circlePlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 4,
    borderColor: '#c2a06a',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0f172a',
  },
  circleText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  statsCol: {
    flex: 1,
    gap: 8,
  },
  statLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statText: {
    fontSize: 13,
    color: '#cbd5e1',
  },
  distributionWrapper: {
    gap: 12,
  },
  barRow: {
    gap: 4,
  },
  barInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  barLabel: {
    fontSize: 13,
    color: '#cbd5e1',
    fontWeight: '500',
  },
  barValue: {
    fontSize: 12,
    color: '#94a3b8',
  },
  barBg: {
    height: 6,
    backgroundColor: '#0f172a',
    borderRadius: 3,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 3,
  },
  emptyText: {
    fontSize: 13,
    color: '#64748b',
    textAlign: 'center',
    paddingVertical: 12,
  },
  logsList: {
    gap: 10,
  },
  logRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#0f172a',
    borderRadius: 8,
    padding: 10,
    borderWidth: 1,
    borderColor: '#334155',
  },
  logText: {
    fontSize: 13,
    color: '#cbd5e1',
    flex: 1,
  },
  logCategory: {
    fontSize: 10,
    color: '#94a3b8',
    backgroundColor: '#1e293b',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
});
