import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export const StatusBadge = ({ status }) => {
  let bg = '#f1f5f9';
  let text = '#475569';
  let dot = '#94a3b8';

  switch (status) {
    case 'Completed':
      bg = '#ecfdf5';
      text = '#047857';
      dot = '#10b981';
      break;
    case 'In Progress':
      bg = '#eff6ff';
      text = '#1d4ed8';
      dot = '#3b82f6';
      break;
    case 'Pending':
      bg = '#fffbeb';
      text = '#b45309';
      dot = '#f59e0b';
      break;
    case 'Not Started':
    default:
      bg = '#f1f5f9';
      text = '#475569';
      dot = '#94a3b8';
      break;
  }

  return (
    <View style={[styles.badge, { backgroundColor: bg }]}>
      <View style={[styles.dot, { backgroundColor: dot }]} />
      <Text style={[styles.badgeText, { color: text }]}>{status || 'Not Started'}</Text>
    </View>
  );
};

export const PriorityBadge = ({ priority }) => {
  let bg = '#f1f5f9';
  let text = '#475569';

  switch (priority) {
    case 'High':
      bg = '#fff1f2';
      text = '#be123c';
      break;
    case 'Medium':
      bg = '#fffbeb';
      text = '#b45309';
      break;
    case 'Low':
    default:
      bg = '#f1f5f9';
      text = '#475569';
      break;
  }

  return (
    <View style={[styles.priorityBadge, { backgroundColor: bg }]}>
      <Text style={[styles.priorityText, { color: text }]}>{priority || 'Medium'}</Text>
    </View>
  );
};

export const RoleBadge = ({ role }) => {
  const roleName = typeof role === 'object' ? role?.name : role;
  let bg = '#f1f5f9';
  let text = '#475569';
  let label = 'Member';

  switch (roleName) {
    case 'ADMIN':
      bg = '#faf5ff';
      text = '#7e22ce';
      label = 'Admin';
      break;
    case 'PROJECT_LEADER':
      bg = '#eef2ff';
      text = '#4338ca';
      label = 'Project Leader';
      break;
    case 'MEMBER':
    default:
      bg = '#f1f5f9';
      text = '#475569';
      label = 'Member';
      break;
  }

  return (
    <View style={[styles.roleBadge, { backgroundColor: bg }]}>
      <Text style={[styles.roleText, { color: text }]}>{label}</Text>
    </View>
  );
};

export const AssigneeAvatar = ({ user, fallback = 'Unassigned' }) => {
  if (!user) {
    return (
      <View style={styles.assigneeContainer}>
        <View style={styles.avatarPlaceholder}>
          <Text style={styles.avatarPlaceholderText}>?</Text>
        </View>
        <Text style={styles.assigneeFallback}>{fallback}</Text>
      </View>
    );
  }

  const initials = user.name
    ? user.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .substring(0, 2)
        .toUpperCase()
    : 'U';

  return (
    <View style={styles.assigneeContainer}>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{initials}</Text>
      </View>
      <Text style={styles.assigneeName} numberOfLines={1}>
        {user.name}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 5,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  priorityText: {
    fontSize: 11,
    fontWeight: '700',
  },
  roleBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    alignSelf: 'flex-start',
  },
  roleText: {
    fontSize: 11,
    fontWeight: '700',
  },
  assigneeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#e0e7ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 6,
  },
  avatarText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#4338ca',
  },
  avatarPlaceholder: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 6,
  },
  avatarPlaceholderText: {
    fontSize: 10,
    color: '#94a3b8',
  },
  assigneeName: {
    fontSize: 12,
    color: '#334155',
    fontWeight: '500',
    maxWidth: 110,
  },
  assigneeFallback: {
    fontSize: 12,
    color: '#94a3b8',
  },
});

