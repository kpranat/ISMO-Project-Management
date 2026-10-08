import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { useAuth } from '../context/AuthContext.js';
import { dashboardService, taskService, updateService, getErrorMessage } from '../services/api.js';
import { StatCard } from '../components/StatCard.js';
import { RoleBadge, StatusBadge, PriorityBadge } from '../components/Badges.js';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';

export const DashboardScreen = ({ navigation }) => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalProjects: 0,
    projectsInProgress: 0,
    totalTasks: 0,
    pendingTasks: 0,
    completedTasks: 0,
  });
  const [tasks, setTasks] = useState([]);
  const [updates, setUpdates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const loadData = useCallback(async () => {
    try {
      setError(null);
      const [statsData, tasksData, updatesData] = await Promise.all([
        dashboardService.getDashboardStats(),
        taskService.getTasks(),
        updateService.getUpdates().catch(() => []),
      ]);
      setStats(statsData);
      setTasks(tasksData);
      setUpdates(updatesData);
    } catch (err) {
      console.warn('Dashboard load error:', err);
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const handleToggleTask = async (task) => {
    try {
      const nextStatus = task.status === 'Completed' ? 'Pending' : 'Completed';
      await taskService.updateTask(task.id, { status: nextStatus });
      loadData();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const upcomingTasks = tasks
    .filter((t) => t.status !== 'Completed')
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
    .slice(0, 5);

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#4f46e5" />
        <Text style={styles.loadingText}>Loading Dashboard...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#4f46e5']} />}
    >
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Welcome back,</Text>
          <Text style={styles.userName}>{user?.name || 'User'}</Text>
        </View>
        <RoleBadge role={user?.role} />
      </View>

      {error ? (
        <View style={styles.errorBanner}>
          <Ionicons name="alert-circle" size={18} color="#be123c" />
          <Text style={styles.errorBannerText}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={loadData}>
            <Text style={styles.retryBtnText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      {/* Metrics Row 1 */}
      <View style={styles.statsRow}>
        <StatCard
          title="Total Projects"
          value={stats.totalProjects}
          icon="folder-outline"
          color="#4f46e5"
        />
        <StatCard
          title="In Progress"
          value={stats.projectsInProgress}
          icon="play-outline"
          color="#2563eb"
        />
      </View>

      {/* Metrics Row 2 */}
      <View style={styles.statsRow}>
        <StatCard
          title="Total Tasks"
          value={stats.totalTasks}
          icon="list-outline"
          color="#7c3aed"
        />
        <StatCard
          title="Pending"
          value={stats.pendingTasks}
          icon="time-outline"
          color="#d97706"
        />
        <StatCard
          title="Completed"
          value={stats.completedTasks}
          icon="checkmark-done-outline"
          color="#059669"
        />
      </View>

      {/* Assigned Updates & Activity Feed */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <View style={styles.sectionHeaderLeft}>
            <Ionicons name="notifications-outline" size={18} color="#4f46e5" />
            <Text style={styles.sectionTitle}>Assigned Updates</Text>
          </View>
          <Text style={styles.updateBadge}>{updates.length} items</Text>
        </View>

        <View style={styles.updatesCard}>
          {updates.length === 0 ? (
            <View style={styles.emptyUpdates}>
              <Ionicons name="sparkles-outline" size={24} color="#94a3b8" />
              <Text style={styles.emptyUpdatesText}>No recent updates logged yet.</Text>
            </View>
          ) : (
            updates.slice(0, 6).map((upd) => (
              <View key={upd.id} style={styles.updateItem}>
                <View style={styles.updateDot} />
                <View style={styles.updateContent}>
                  <Text style={styles.updateMessage}>{upd.message}</Text>
                  <Text style={styles.updateTime}>
                    {new Date(upd.createdAt).toLocaleDateString()} • {new Date(upd.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </Text>
                </View>
              </View>
            ))
          )}
        </View>
      </View>

      {/* Urgent / Upcoming Tasks */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <View style={styles.sectionHeaderLeft}>
            <Ionicons name="alarm-outline" size={18} color="#d97706" />
            <Text style={styles.sectionTitle}>Urgent Tasks</Text>
          </View>
          <TouchableOpacity onPress={() => navigation.navigate('Tasks')}>
            <Text style={styles.viewAllText}>View All</Text>
          </TouchableOpacity>
        </View>

        {upcomingTasks.length === 0 ? (
          <View style={styles.emptyCard}>
            <Ionicons name="checkmark-circle-outline" size={32} color="#10b981" />
            <Text style={styles.emptyTitle}>All caught up!</Text>
            <Text style={styles.emptySubtitle}>No urgent pending tasks right now.</Text>
          </View>
        ) : (
          <View style={styles.taskListCard}>
            {upcomingTasks.map((t) => (
              <View key={t.id} style={styles.taskItem}>
                <TouchableOpacity
                  style={styles.checkbox}
                  onPress={() => handleToggleTask(t)}
                >
                  <Ionicons
                    name={t.status === 'Completed' ? 'checkbox' : 'square-outline'}
                    size={22}
                    color={t.status === 'Completed' ? '#10b981' : '#94a3b8'}
                  />
                </TouchableOpacity>

                <View style={styles.taskContent}>
                  <Text style={styles.taskName} numberOfLines={1}>
                    {t.name}
                  </Text>
                  <View style={styles.taskMeta}>
                    <PriorityBadge priority={t.priority} />
                    <Text style={styles.taskDue}>Due {t.dueDate}</Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8fafc',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 13,
    color: '#64748b',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingTop: 8,
  },
  greeting: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '500',
  },
  userName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0f172a',
    marginTop: 2,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff1f2',
    borderWidth: 1,
    borderColor: '#fecdd3',
    borderRadius: 12,
    padding: 10,
    marginBottom: 16,
    gap: 8,
  },
  errorBannerText: {
    fontSize: 12,
    color: '#be123c',
    flex: 1,
  },
  retryBtn: {
    backgroundColor: '#be123c',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  retryBtnText: {
    fontSize: 11,
    color: '#ffffff',
    fontWeight: 'bold',
  },
  statsRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  section: {
    marginTop: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  sectionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0f172a',
  },
  updateBadge: {
    fontSize: 11,
    color: '#64748b',
    backgroundColor: '#e2e8f0',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    fontWeight: '600',
  },
  viewAllText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4f46e5',
  },
  updatesCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 12,
  },
  emptyUpdates: {
    alignItems: 'center',
    paddingVertical: 20,
    gap: 6,
  },
  emptyUpdatesText: {
    fontSize: 12,
    color: '#94a3b8',
  },
  updateItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    gap: 10,
  },
  updateDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#4f46e5',
    marginTop: 5,
  },
  updateContent: {
    flex: 1,
  },
  updateMessage: {
    fontSize: 12,
    color: '#1e293b',
    lineHeight: 16,
    fontWeight: '500',
  },
  updateTime: {
    fontSize: 10,
    color: '#94a3b8',
    marginTop: 2,
  },
  emptyCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 24,
    alignItems: 'center',
    gap: 4,
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0f172a',
    marginTop: 6,
  },
  emptySubtitle: {
    fontSize: 11,
    color: '#94a3b8',
  },
  taskListCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    paddingHorizontal: 12,
  },
  taskItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  checkbox: {
    marginRight: 10,
  },
  taskContent: {
    flex: 1,
  },
  taskName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1e293b',
  },
  taskMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 8,
  },
  taskDue: {
    fontSize: 11,
    color: '#64748b',
  },
});

