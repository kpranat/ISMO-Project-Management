import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { projectService, userService, getErrorMessage } from '../services/api.js';
import { Ionicons } from '@expo/vector-icons';

export const ProjectFormScreen = ({ route, navigation }) => {
  const initialData = route.params?.initialData;
  const onDone = route.params?.onDone;

  const todayStr = new Date().toISOString().split('T')[0];
  const defaultEndStr = new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0];

  const [name, setName] = useState(initialData?.name || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [status, setStatus] = useState(initialData?.status || 'Not Started');
  const [startDate, setStartDate] = useState(
    initialData?.startDate ? initialData.startDate.substring(0, 10) : todayStr
  );
  const [endDate, setEndDate] = useState(
    initialData?.endDate ? initialData.endDate.substring(0, 10) : defaultEndStr
  );
  const [assignedToId, setAssignedToId] = useState(initialData?.assignedToId || '');

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const usersData = await userService.getUsers().catch(() => []);
        setUsers(usersData);
      } catch (err) {
        console.warn('Failed to fetch users:', err);
      }
    };
    fetchUsers();
  }, []);

  const handleSubmit = async () => {
    setError('');
    if (!name.trim()) {
      setError('Project name is required.');
      return;
    }
    if (!description.trim()) {
      setError('Project description is required.');
      return;
    }
    if (!startDate.trim()) {
      setError('Start date is required (YYYY-MM-DD).');
      return;
    }
    if (!endDate.trim()) {
      setError('End date is required (YYYY-MM-DD).');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        name: name.trim(),
        description: description.trim(),
        status,
        startDate: startDate.trim(),
        endDate: endDate.trim(),
        assignedToId: assignedToId || null,
      };

      if (initialData?.id) {
        await projectService.updateProject(initialData.id, payload);
      } else {
        await projectService.createProject(payload);
      }

      if (onDone) onDone();
      navigation.goBack();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const statuses = ['Not Started', 'In Progress', 'Completed'];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.headerTitle}>
        {initialData ? 'Edit Project' : 'Create New Project'}
      </Text>

      {error ? (
        <View style={styles.errorBox}>
          <Ionicons name="alert-circle" size={18} color="#be123c" />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}

      {/* Project Name */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Project Name *</Text>
        <TextInput
          style={styles.textInput}
          value={name}
          onChangeText={setName}
          placeholder="e.g. Mobile Application Launch"
          placeholderTextColor="#94a3b8"
        />
      </View>

      {/* Description */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Description *</Text>
        <TextInput
          style={[styles.textInput, styles.textArea]}
          value={description}
          onChangeText={setDescription}
          placeholder="Brief description of the project scope and deliverables..."
          placeholderTextColor="#94a3b8"
          multiline
          numberOfLines={4}
          textAlignVertical="top"
        />
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
              <Text style={[styles.chipText, status === s && styles.chipTextActive]}>
                {s}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Timeline Dates */}
      <View style={styles.row}>
        <View style={[styles.inputGroup, styles.col]}>
          <Text style={styles.label}>Start Date (YYYY-MM-DD) *</Text>
          <TextInput
            style={styles.textInput}
            value={startDate}
            onChangeText={setStartDate}
            placeholder="YYYY-MM-DD"
            placeholderTextColor="#94a3b8"
          />
        </View>
        <View style={[styles.inputGroup, styles.col]}>
          <Text style={styles.label}>End Date (YYYY-MM-DD) *</Text>
          <TextInput
            style={styles.textInput}
            value={endDate}
            onChangeText={setEndDate}
            placeholder="YYYY-MM-DD"
            placeholderTextColor="#94a3b8"
          />
        </View>
      </View>

      {/* Assignee Selector */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Assigned To</Text>
        <Text style={styles.helperText}>
          Select a team member to assign this project specifically to them.
        </Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
          <TouchableOpacity
            style={[styles.userChip, !assignedToId && styles.userChipActive]}
            onPress={() => setAssignedToId('')}
          >
            <Ionicons
              name="globe-outline"
              size={14}
              color={!assignedToId ? '#ffffff' : '#64748b'}
            />
            <Text style={[styles.userChipText, !assignedToId && styles.userChipTextActive]}>
              Open Project
            </Text>
          </TouchableOpacity>
          {users.map((u) => {
            const isSelected = assignedToId === u.id;
            return (
              <TouchableOpacity
                key={u.id}
                style={[styles.userChip, isSelected && styles.userChipActive]}
                onPress={() => setAssignedToId(u.id)}
              >
                <View style={[styles.avatarCircle, isSelected && styles.avatarCircleActive]}>
                  <Text style={[styles.avatarInitials, isSelected && styles.avatarInitialsActive]}>
                    {(u.name || 'U').substring(0, 2).toUpperCase()}
                  </Text>
                </View>
                <Text style={[styles.userChipText, isSelected && styles.userChipTextActive]}>
                  {u.name} ({u.role?.name || 'MEMBER'})
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Submit Buttons */}
      <View style={styles.btnRow}>
        <TouchableOpacity
          style={styles.cancelBtn}
          onPress={() => navigation.goBack()}
          disabled={loading}
        >
          <Text style={styles.cancelBtnText}>Cancel</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.submitBtn, loading && styles.submitBtnDisabled]}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#ffffff" size="small" />
          ) : (
            <Text style={styles.submitBtnText}>
              {initialData ? 'Update Project' : 'Create Project'}
            </Text>
          )}
        </TouchableOpacity>
      </View>
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
    fontSize: 22,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 16,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffe4e6',
    borderWidth: 1,
    borderColor: '#fecdd3',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  errorText: {
    color: '#be123c',
    fontSize: 13,
    marginLeft: 8,
    flex: 1,
  },
  inputGroup: {
    marginBottom: 16,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  col: {
    flex: 1,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 6,
  },
  helperText: {
    fontSize: 11,
    color: '#94a3b8',
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#0f172a',
  },
  textArea: {
    height: 90,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#f8fafc',
  },
  chipActive: {
    backgroundColor: '#4f46e5',
    borderColor: '#4f46e5',
  },
  chipText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#475569',
  },
  chipTextActive: {
    color: '#ffffff',
    fontWeight: '600',
  },
  chipScroll: {
    flexDirection: 'row',
    paddingVertical: 4,
  },
  userChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#f8fafc',
    marginRight: 8,
  },
  userChipActive: {
    backgroundColor: '#4f46e5',
    borderColor: '#4f46e5',
  },
  userChipText: {
    fontSize: 12,
    color: '#475569',
    fontWeight: '500',
  },
  userChipTextActive: {
    color: '#ffffff',
    fontWeight: '600',
  },
  avatarCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#e2e8f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarCircleActive: {
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  avatarInitials: {
    fontSize: 9,
    fontWeight: '700',
    color: '#475569',
  },
  avatarInitialsActive: {
    color: '#ffffff',
  },
  btnRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748b',
  },
  submitBtn: {
    flex: 2,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#4f46e5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitBtnDisabled: {
    opacity: 0.6,
  },
  submitBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
  },
});

