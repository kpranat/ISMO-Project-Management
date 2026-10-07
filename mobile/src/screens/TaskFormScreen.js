import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { projectService, taskService, userService, getErrorMessage } from '../services/api.js';
import { Ionicons } from '@expo/vector-icons';

export const TaskFormScreen = ({ route, navigation }) => {
  const initialData = route.params?.initialData;
  const defaultProjectId = route.params?.defaultProjectId;
  const onDone = route.params?.onDone;

  const [name, setName] = useState(initialData?.name || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [projectId, setProjectId] = useState(initialData?.projectId || defaultProjectId || '');
  const [priority, setPriority] = useState(initialData?.priority || 'Medium');
  const [status, setStatus] = useState(initialData?.status || 'Pending');
  const [dueDate, setDueDate] = useState(
    initialData?.dueDate ? initialData.dueDate.substring(0, 10) : new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0]
  );
  const [assignedToId, setAssignedToId] = useState(initialData?.assignedToId || '');

  const [projects, setProjects] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [projsData, usersData] = await Promise.all([
          projectService.getProjects(),
          userService.getUsers().catch(() => []),
        ]);
        setProjects(projsData);
        setUsers(usersData);
        if (!projectId && projsData.length > 0) {
          setProjectId(projsData[0].id);
        }
      } catch (err) {
        console.warn('Failed to fetch dependencies:', err);
      }
    };
    fetchData();
  }, [projectId]);

  const handleSubmit = async () => {
    setError('');
    if (!name.trim()) {
      setError('Task name is required.');
      return;
    }
    if (!description.trim()) {
      setError('Task description is required.');
      return;
    }
    if (!projectId) {
      setError('Please select a project.');
      return;
    }
    if (!dueDate.trim()) {
      setError('Due date is required (YYYY-MM-DD).');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        name: name.trim(),
        description: description.trim(),
        projectId,
        priority,
        status,
        dueDate: dueDate.trim(),
        assignedToId: assignedToId || null,
      };

      if (initialData?.id) {
        await taskService.updateTask(initialData.id, payload);
      } else {
        await taskService.createTask(payload);
      }

      if (onDone) onDone();
      navigation.goBack();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const priorities = ['Low', 'Medium', 'High'];
  const statuses = ['Pending', 'In Progress', 'Completed'];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.headerTitle}>
        {initialData ? 'Edit Task' : 'Create New Task'}
      </Text>

      {error ? (
        <View style={styles.errorBox}>
          <Ionicons name="alert-circle" size={18} color="#be123c" />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}

      {/* Project Selector */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Project *</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
          {projects.map((p) => (
            <TouchableOpacity
              key={p.id}
              style={[styles.chip, projectId === p.id && styles.chipActive]}
              onPress={() => setProjectId(p.id)}
            >
              <Text style={[styles.chipText, projectId === p.id && styles.chipTextActive]}>
                {p.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Task Name */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Task Name *</Text>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholder="e.g. Implement authentication"
        />
      </View>

      {/* Description */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Description *</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={description}
          onChangeText={setDescription}
          placeholder="Detailed task instructions..."
          multiline
          numberOfLines={3}
        />
      </View>

      {/* Assignee Selection */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Assign To Team Member</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
          <TouchableOpacity
            style={[styles.chip, !assignedToId && styles.chipActive]}
            onPress={() => setAssignedToId('')}
          >
            <Text style={[styles.chipText, !assignedToId && styles.chipTextActive]}>
              Unassigned
            </Text>
          </TouchableOpacity>
          {users.map((u) => (
            <TouchableOpacity
              key={u.id}
              style={[styles.chip, assignedToId === u.id && styles.chipActive]}
              onPress={() => setAssignedToId(u.id)}
            >
              <Text style={[styles.chipText, assignedToId === u.id && styles.chipTextActive]}>
                {u.name} ({u.role?.name || 'MEMBER'})
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Priority */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Priority</Text>
        <View style={styles.chipRow}>
          {priorities.map((p) => (
            <TouchableOpacity
              key={p}
              style={[styles.chip, priority === p && styles.chipActive]}
              onPress={() => setPriority(p)}
            >
              <Text style={[styles.chipText, priority === p && styles.chipTextActive]}>{p}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Status */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Status</Text>
        <View style={styles.chipRow}>
          {statuses.map((s) => (
            <TouchableOpacity
              key={s}
              style={[styles.chip, status === s && styles.chipActive]}
              onPress={() => setStatus(s)}
            >
              <Text style={[styles.chipText, status === s && styles.chipTextActive]}>{s}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Due Date */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Due Date (YYYY-MM-DD) *</Text>
        <TextInput
          style={styles.input}
          value={dueDate}
          onChangeText={setDueDate}
          placeholder="YYYY-MM-DD"
        />
      </View>

      <TouchableOpacity
        style={[styles.submitBtn, loading && styles.btnDisabled]}
        onPress={handleSubmit}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#ffffff" size="small" />
        ) : (
          <Text style={styles.submitBtnText}>
            {initialData ? 'Update Task' : 'Create Task'}
          </Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0f172a',
    marginBottom: 16,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff1f2',
    borderWidth: 1,
    borderColor: '#fecdd3',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    gap: 8,
  },
  errorText: {
    fontSize: 12,
    color: '#be123c',
    flex: 1,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
    textTransform: 'uppercase',
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  input: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#0f172a',
    backgroundColor: '#f8fafc',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  chipScroll: {
    flexDirection: 'row',
  },
  chipRow: {
    flexDirection: 'row',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#f1f5f9',
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  chipActive: {
    backgroundColor: '#4f46e5',
    borderColor: '#4f46e5',
  },
  chipText: {
    fontSize: 12,
    color: '#475569',
    fontWeight: '600',
  },
  chipTextActive: {
    color: '#ffffff',
  },
  submitBtn: {
    backgroundColor: '#4f46e5',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    shadowColor: '#4f46e5',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  btnDisabled: {
    opacity: 0.6,
  },
  submitBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
  },
});

