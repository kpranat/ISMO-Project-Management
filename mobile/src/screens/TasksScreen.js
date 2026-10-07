import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  RefreshControl,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useAuth } from '../context/AuthContext.js';
import { taskService, getErrorMessage } from '../services/api.js';
import { StatusBadge, PriorityBadge, AssigneeAvatar } from '../components/Badges.js';
import { Ionicons } from '@expo/vector-icons';

export const TasksScreen = ({ navigation }) => {
  const { user } = useAuth();
  const canCreate = ['ADMIN', 'PROJECT_LEADER'].includes(user?.role?.name);

  const [tasks, setTasks] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [priorityFilter, setPriorityFilter] = useState('All');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const loadTasks = useCallback(async () => {
    try {
      setError(null);
      const data = await taskService.getTasks();
      setTasks(data);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  const onRefresh = () => {
    setRefreshing(true);
    loadTasks();
  };

  const handleToggleTask = async (task) => {
    try {
      const nextStatus = task.status === 'Completed' ? 'Pending' : 'Completed';
      await taskService.updateTask(task.id, { status: nextStatus });
      loadTasks();
    } catch (err) {
      Alert.alert('Error', getErrorMessage(err));
    }
  };

  const handleDeleteTask = (task) => {
    Alert.alert('Delete Task', `Are you sure you want to delete "${task.name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await taskService.deleteTask(task.id);
            loadTasks();
          } catch (err) {
            Alert.alert('Error', getErrorMessage(err));
          }
        },
      },
    ]);
  };

  const filteredTasks = tasks.filter((t) => {
    const matchesSearch = t.name.toLowerCase().includes(searchQuery.toLowerCase().trim());
    const matchesStatus = statusFilter === 'All' ? true : t.status === statusFilter;
    const matchesPriority = priorityFilter === 'All' ? true : t.priority === priorityFilter;
    return matchesSearch && matchesStatus && matchesPriority;
  });

  const statuses = ['All', 'Pending', 'In Progress', 'Completed'];
  const priorities = ['All', 'High', 'Medium', 'Low'];

  const renderTaskItem = ({ item }) => {
    return (
      <View style={[styles.card, item.status === 'Completed' && styles.cardCompleted]}>
        <View style={styles.cardMain}>
          <TouchableOpacity
            style={styles.checkbox}
            onPress={() => handleToggleTask(item)}
            accessibilityLabel="Toggle task completion"
          >
            <Ionicons
              name={item.status === 'Completed' ? 'checkbox' : 'square-outline'}
              size={24}
              color={item.status === 'Completed' ? '#10b981' : '#94a3b8'}
            />
          </TouchableOpacity>

          <View style={styles.cardInfo}>
            <Text
              style={[
                styles.taskName,
                item.status === 'Completed' && styles.taskNameCompleted,
              ]}
              numberOfLines={2}
            >
              {item.name}
            </Text>

            {item.description ? (
              <Text style={styles.taskDesc} numberOfLines={2}>
                {item.description}
              </Text>
            ) : null}

            <View style={styles.metaRow}>
              <StatusBadge status={item.status} />
              <PriorityBadge priority={item.priority} />
              {item.projectName ? (
                <View style={styles.projectPill}>
                  <Ionicons name="folder-outline" size={11} color="#4f46e5" />
                  <Text style={styles.projectPillText} numberOfLines={1}>
                    {item.projectName}
                  </Text>
                </View>
              ) : null}
            </View>

            <View style={styles.subMetaRow}>
              <View style={styles.dateRow}>
                <Ionicons name="time-outline" size={12} color="#94a3b8" />
                <Text style={styles.dateText}>Due {item.dueDate}</Text>
              </View>
              <AssigneeAvatar user={item.assignedTo} fallback="Unassigned" />
            </View>
          </View>
        </View>

        {canCreate && (
          <View style={styles.actionRow}>
            <TouchableOpacity
              style={styles.actionBtn}
              onPress={() => navigation.navigate('TaskForm', { initialData: item, onDone: loadTasks })}
            >
              <Ionicons name="create-outline" size={16} color="#64748b" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionBtn}
              onPress={() => handleDeleteTask(item)}
            >
              <Ionicons name="trash-outline" size={16} color="#e11d48" />
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Search Input */}
      <View style={styles.searchBar}>
        <Ionicons name="search-outline" size={18} color="#94a3b8" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search tasks..."
        />
        {searchQuery ? (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={16} color="#94a3b8" />
          </TouchableOpacity>
        ) : null}
      </View>

      {/* Filter Row 1: Statuses */}
      <View style={styles.filterRow}>
        {statuses.map((s) => (
          <TouchableOpacity
            key={s}
            style={[styles.filterChip, statusFilter === s && styles.filterChipActive]}
            onPress={() => setStatusFilter(s)}
          >
            <Text
              style={[styles.filterChipText, statusFilter === s && styles.filterChipTextActive]}
            >
              {s}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Filter Row 2: Priorities */}
      <View style={styles.priorityFilterRow}>
        <Text style={styles.filterLabel}>Priority:</Text>
        {priorities.map((p) => (
          <TouchableOpacity
            key={p}
            style={[styles.priorityChip, priorityFilter === p && styles.priorityChipActive]}
            onPress={() => setPriorityFilter(p)}
          >
            <Text
              style={[
                styles.priorityChipText,
                priorityFilter === p && styles.priorityChipTextActive,
              ]}
            >
              {p}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {error ? (
        <View style={styles.errorBox}>
          <Ionicons name="alert-circle" size={18} color="#be123c" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={loadTasks}>
            <Text style={styles.retryBtnText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      {loading ? (
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color="#4f46e5" />
        </View>
      ) : (
        <FlatList
          data={filteredTasks}
          keyExtractor={(item) => item.id}
          renderItem={renderTaskItem}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#4f46e5']} />}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="checkbox-outline" size={48} color="#cbd5e1" />
              <Text style={styles.emptyTitle}>No tasks found</Text>
              <Text style={styles.emptySubtitle}>
                {canCreate
                  ? 'Tap the button below to create your first task.'
                  : 'You do not have any tasks assigned currently.'}
              </Text>
            </View>
          }
        />
      )}

      {/* FAB for Leaders & Admins */}
      {canCreate && (
        <TouchableOpacity
          style={styles.fab}
          onPress={() => navigation.navigate('TaskForm', { onDone: loadTasks })}
          accessibilityLabel="Create Task"
        >
          <Ionicons name="add" size={28} color="#ffffff" />
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 8,
    paddingHorizontal: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 10,
    fontSize: 13,
    color: '#0f172a',
  },
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 6,
    gap: 6,
  },
  filterChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 16,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  filterChipActive: {
    backgroundColor: '#4f46e5',
    borderColor: '#4f46e5',
  },
  filterChipText: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '600',
  },
  filterChipTextActive: {
    color: '#ffffff',
  },
  priorityFilterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 8,
    gap: 6,
  },
  filterLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#94a3b8',
    textTransform: 'uppercase',
  },
  priorityChip: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    backgroundColor: '#f1f5f9',
  },
  priorityChipActive: {
    backgroundColor: '#0f172a',
  },
  priorityChipText: {
    fontSize: 10,
    color: '#64748b',
    fontWeight: '600',
  },
  priorityChipTextActive: {
    color: '#ffffff',
  },
  listContent: {
    padding: 16,
    paddingTop: 4,
    paddingBottom: 80,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  cardCompleted: {
    backgroundColor: '#f8fafc',
    opacity: 0.85,
  },
  cardMain: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  checkbox: {
    marginRight: 10,
    marginTop: 2,
  },
  cardInfo: {
    flex: 1,
  },
  taskName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a',
  },
  taskNameCompleted: {
    textDecorationLine: 'line-through',
    color: '#94a3b8',
  },
  taskDesc: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 3,
    lineHeight: 16,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 8,
  },
  projectPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#eef2ff',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    gap: 4,
    maxWidth: 120,
  },
  projectPillText: {
    fontSize: 10,
    color: '#4f46e5',
    fontWeight: '600',
  },
  subMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: '#f8fafc',
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dateText: {
    fontSize: 11,
    color: '#94a3b8',
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 6,
    marginTop: 8,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  actionBtn: {
    padding: 6,
  },
  centerBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    gap: 6,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0f172a',
    marginTop: 8,
  },
  emptySubtitle: {
    fontSize: 12,
    color: '#64748b',
    textAlign: 'center',
    maxWidth: 240,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff1f2',
    marginHorizontal: 16,
    padding: 10,
    borderRadius: 12,
    gap: 8,
    marginBottom: 8,
  },
  errorText: {
    fontSize: 12,
    color: '#be123c',
    flex: 1,
  },
  retryBtn: {
    backgroundColor: '#be123c',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  retryBtnText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: 'bold',
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#4f46e5',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#4f46e5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 6,
  },
});

