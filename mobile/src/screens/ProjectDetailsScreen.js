import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useAuth } from '../context/AuthContext.js';
import { projectService, taskService, getErrorMessage } from '../services/api.js';
import { StatusBadge, PriorityBadge, AssigneeAvatar } from '../components/Badges.js';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';

export const ProjectDetailsScreen = ({ route, navigation }) => {
  const { id } = route.params;
  const { user } = useAuth();

  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const canManage =
    user?.role?.name === 'ADMIN' ||
    (user?.role?.name === 'PROJECT_LEADER' && project?.userId === user?.id);

  const canCreateTask = ['ADMIN', 'PROJECT_LEADER'].includes(user?.role?.name);

  const loadData = useCallback(async () => {
    try {
      setError(null);
      const data = await projectService.getProject(id);
      setProject(data);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [id]);

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
      Alert.alert('Error', getErrorMessage(err));
    }
  };

  const handleDeleteProject = () => {
    Alert.alert(
      'Delete Project',
      `Are you sure you want to delete "${project.name}"? All associated tasks will also be deleted.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await projectService.deleteProject(id);
              navigation.goBack();
            } catch (err) {
              Alert.alert('Error', getErrorMessage(err));
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.centerBox}>
        <ActivityIndicator size="large" color="#4f46e5" />
      </View>
    );
  }

  if (error || !project) {
    return (
      <View style={styles.centerBox}>
        <Ionicons name="alert-circle-outline" size={48} color="#e11d48" />
        <Text style={styles.errorTitle}>Project Not Found</Text>
        <Text style={styles.errorDesc}>{error || 'This project may have been deleted.'}</Text>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backBtnText}>Back to Projects</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const tasks = project.tasks || [];
  const completedCount = tasks.filter((t) => t.status === 'Completed').length;
  const progressPercent = tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : 0;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#4f46e5']} />}
    >
      {/* Project Overview Card */}
      <View style={styles.card}>
        <View style={styles.titleRow}>
          <Text style={styles.title}>{project.name}</Text>
          <StatusBadge status={project.status} />
        </View>

        <Text style={styles.description}>{project.description}</Text>

        <View style={styles.metaBox}>
          <View style={styles.metaRow}>
            <Text style={styles.metaLabel}>Assigned To:</Text>
            <AssigneeAvatar user={project.assignedTo} fallback="Open Project" />
          </View>
          <View style={styles.metaRow}>
            <Text style={styles.metaLabel}>Leader:</Text>
            <AssigneeAvatar user={project.user} fallback="Unassigned" />
          </View>
          <View style={styles.metaRow}>
            <Text style={styles.metaLabel}>Timeline:</Text>
            <Text style={styles.metaValue}>{project.startDate} to {project.endDate}</Text>
          </View>
        </View>

        {/* Progress Bar */}
        <View style={styles.progressContainer}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressLabel}>
              Task Progress: {completedCount}/{tasks.length} Completed
            </Text>
            <Text style={styles.progressPercent}>{progressPercent}%</Text>
          </View>
          <View style={styles.progressBarTrack}>
            <View style={[styles.progressBarFill, { width: `${progressPercent}%` }]} />
          </View>
        </View>

        {/* Action buttons for Leader / Admin */}
        {canManage && (
          <View style={styles.actionRow}>
            <TouchableOpacity
              style={styles.editBtn}
              onPress={() => navigation.navigate('ProjectForm', { initialData: project, onDone: loadData })}
            >
              <Ionicons name="create-outline" size={16} color="#4f46e5" />
              <Text style={styles.editBtnText}>Edit</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.deleteBtn} onPress={handleDeleteProject}>
              <Ionicons name="trash-outline" size={16} color="#e11d48" />
              <Text style={styles.deleteBtnText}>Delete</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Tasks Section Header */}
      <View style={styles.tasksHeader}>
        <Text style={styles.sectionTitle}>Project Tasks ({tasks.length})</Text>
        {canCreateTask && (
          <TouchableOpacity
            style={styles.addTaskBtn}
            onPress={() =>
              navigation.navigate('TaskForm', {
                defaultProjectId: project.id,
                onDone: loadData,
              })
            }
          >
            <Ionicons name="add" size={16} color="#ffffff" />
            <Text style={styles.addTaskBtnText}>Add Task</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Tasks List */}
      {tasks.length === 0 ? (
        <View style={styles.emptyCard}>
          <Ionicons name="list-outline" size={32} color="#94a3b8" />
          <Text style={styles.emptyText}>No tasks under this project yet.</Text>
        </View>
      ) : (
        <View style={styles.taskListCard}>
          {tasks.map((task) => (
            <View key={task.id} style={styles.taskItem}>
              <TouchableOpacity
                style={styles.checkbox}
                onPress={() => handleToggleTask(task)}
              >
                <Ionicons
                  name={task.status === 'Completed' ? 'checkbox' : 'square-outline'}
                  size={24}
                  color={task.status === 'Completed' ? '#10b981' : '#94a3b8'}
                />
              </TouchableOpacity>

              <View style={styles.taskInfo}>
                <Text
                  style={[
                    styles.taskName,
                    task.status === 'Completed' && styles.taskNameCompleted,
                  ]}
                >
                  {task.name}
                </Text>
                {task.description ? (
                  <Text style={styles.taskDesc} numberOfLines={2}>
                    {task.description}
                  </Text>
                ) : null}

                <View style={styles.taskBadges}>
                  <StatusBadge status={task.status} />
                  <PriorityBadge priority={task.priority} />
                  <Text style={styles.taskDueDate}>Due {task.dueDate}</Text>
                  <AssigneeAvatar user={task.assignedTo} fallback="Unassigned" />
                </View>
              </View>
            </View>
          ))}
        </View>
      )}
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
    paddingBottom: 40,
  },
  centerBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: '#f8fafc',
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
    marginBottom: 20,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0f172a',
    flex: 1,
  },
  description: {
    fontSize: 13,
    color: '#64748b',
    lineHeight: 18,
    marginBottom: 16,
  },
  metaBox: {
    backgroundColor: '#f8fafc',
    borderRadius: 14,
    padding: 12,
    marginBottom: 16,
    gap: 8,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  metaLabel: {
    fontSize: 11,
    color: '#94a3b8',
    fontWeight: '600',
  },
  metaValue: {
    fontSize: 11,
    color: '#334155',
    fontWeight: '600',
  },
  progressContainer: {
    marginBottom: 14,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  progressLabel: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '500',
  },
  progressPercent: {
    fontSize: 11,
    color: '#4f46e5',
    fontWeight: 'bold',
  },
  progressBarTrack: {
    height: 8,
    backgroundColor: '#f1f5f9',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: 8,
    backgroundColor: '#4f46e5',
    borderRadius: 4,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    paddingTop: 12,
  },
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#eef2ff',
  },
  editBtnText: {
    fontSize: 12,
    color: '#4f46e5',
    fontWeight: '600',
  },
  deleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#fff1f2',
  },
  deleteBtnText: {
    fontSize: 12,
    color: '#e11d48',
    fontWeight: '600',
  },
  tasksHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  addTaskBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#4f46e5',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 10,
  },
  addTaskBtnText: {
    fontSize: 11,
    color: '#ffffff',
    fontWeight: 'bold',
  },
  emptyCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 30,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: 8,
  },
  emptyText: {
    fontSize: 12,
    color: '#94a3b8',
  },
  taskListCard: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    overflow: 'hidden',
  },
  taskItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  checkbox: {
    marginRight: 10,
    marginTop: 2,
  },
  taskInfo: {
    flex: 1,
  },
  taskName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0f172a',
  },
  taskNameCompleted: {
    textDecorationLine: 'line-through',
    color: '#94a3b8',
  },
  taskDesc: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
  },
  taskBadges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
  },
  taskDueDate: {
    fontSize: 10,
    color: '#94a3b8',
  },
  errorTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0f172a',
    marginTop: 10,
  },
  errorDesc: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 4,
    textAlign: 'center',
  },
  backBtn: {
    marginTop: 16,
    backgroundColor: '#4f46e5',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 10,
  },
  backBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },
});

