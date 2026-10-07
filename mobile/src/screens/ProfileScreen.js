import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
} from 'react-native';
import { useAuth } from '../context/AuthContext.js';
import { RoleBadge } from '../components/Badges.js';
import { ServerModal } from '../components/ServerModal.js';
import { Ionicons } from '@expo/vector-icons';

export const ProfileScreen = () => {
  const { user, logout, serverUrl } = useAuth();
  const [serverModalVisible, setServerModalVisible] = useState(false);

  const roleName = user?.role?.name || 'MEMBER';

  const getRolePermissions = () => {
    switch (roleName) {
      case 'ADMIN':
        return [
          'Full administrative control over all projects and tasks.',
          'Assign user roles (Admin, Project Leader, Member).',
          'Create, update, and delete any project or task.',
          'View updates and activities across all workspaces.',
        ];
      case 'PROJECT_LEADER':
        return [
          'Create new projects and oversee deliverables.',
          'Assign tasks to specific team members.',
          'Post updates and progress metrics.',
          'Edit and delete owned projects.',
        ];
      case 'MEMBER':
      default:
        return [
          'View projects assigned directly to you.',
          'Manage tasks assigned to your account.',
          'Toggle completion and update task statuses.',
          'Submit comments and progress updates on tasks.',
        ];
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out from ISMO Project Management?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            await logout();
          },
        },
      ]
    );
  };

  const initials = user?.name
    ? user.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .substring(0, 2)
        .toUpperCase()
    : 'U';

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Profile Header Card */}
      <View style={styles.profileCard}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initials}</Text>
        </View>
        <Text style={styles.userName}>{user?.name || 'User'}</Text>
        <Text style={styles.userEmail}>{user?.email || 'user@ismo.dev'}</Text>
        <View style={styles.badgeWrapper}>
          <RoleBadge role={user?.role} />
        </View>
      </View>

      {/* Role Capabilities Card */}
      <View style={styles.sectionCard}>
        <View style={styles.sectionHeader}>
          <Ionicons name="shield-checkmark-outline" size={20} color="#4f46e5" />
          <Text style={styles.sectionTitle}>Role Permissions ({roleName})</Text>
        </View>
        <View style={styles.permList}>
          {getRolePermissions().map((perm, idx) => (
            <View key={idx} style={styles.permItem}>
              <Ionicons name="checkmark-circle" size={16} color="#10b981" style={styles.permIcon} />
              <Text style={styles.permText}>{perm}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Server & Network Connectivity Card */}
      <View style={styles.sectionCard}>
        <View style={styles.sectionHeader}>
          <Ionicons name="server-outline" size={20} color="#0284c7" />
          <Text style={styles.sectionTitle}>Backend Connection</Text>
        </View>
        <Text style={styles.serverDesc}>
          Active API endpoint used for all synchronizations:
        </Text>
        <View style={styles.serverUrlBox}>
          <Ionicons name="link-outline" size={16} color="#64748b" />
          <Text style={styles.serverUrlText} numberOfLines={1}>
            {serverUrl}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.serverBtn}
          onPress={() => setServerModalVisible(true)}
        >
          <Ionicons name="settings-outline" size={16} color="#0284c7" />
          <Text style={styles.serverBtnText}>Change Server IP / Test Connection</Text>
        </TouchableOpacity>
      </View>

      {/* Security & Token Storage */}
      <View style={styles.sectionCard}>
        <View style={styles.sectionHeader}>
          <Ionicons name="lock-closed-outline" size={20} color="#16a34a" />
          <Text style={styles.sectionTitle}>Security & Keystore</Text>
        </View>
        <Text style={styles.securityText}>
          Your JWT authentication token is encrypted and stored in the Android Keystore / iOS Keychain via expo-secure-store for hardware-backed protection.
        </Text>
      </View>

      {/* Sign Out Button */}
      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
        <Ionicons name="log-out-outline" size={20} color="#e11d48" />
        <Text style={styles.logoutBtnText}>Sign Out</Text>
      </TouchableOpacity>

      <Text style={styles.versionText}>ISMO Mobile v1.0.0 • Pure React Native</Text>

      {/* In-app Server Configuration Modal */}
      <ServerModal
        visible={serverModalVisible}
        onClose={() => setServerModalVisible(false)}
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  profileCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#4f46e5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarText: {
    fontSize: 26,
    fontWeight: '700',
    color: '#ffffff',
  },
  userName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 12,
  },
  badgeWrapper: {
    marginTop: 4,
  },
  sectionCard: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1e293b',
  },
  permList: {
    gap: 8,
  },
  permItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  permIcon: {
    marginTop: 2,
  },
  permText: {
    fontSize: 13,
    color: '#475569',
    flex: 1,
    lineHeight: 18,
  },
  serverDesc: {
    fontSize: 13,
    color: '#64748b',
    marginBottom: 8,
  },
  serverUrlBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 12,
  },
  serverUrlText: {
    fontSize: 13,
    color: '#334155',
    fontFamily: 'monospace',
    flex: 1,
  },
  serverBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#f0f9ff',
    borderRadius: 8,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#bae6fd',
  },
  serverBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0284c7',
  },
  securityText: {
    fontSize: 13,
    color: '#475569',
    lineHeight: 19,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#fff1f2',
    borderRadius: 12,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: '#fecdd3',
    marginTop: 8,
    marginBottom: 16,
  },
  logoutBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#e11d48',
  },
  versionText: {
    textAlign: 'center',
    fontSize: 12,
    color: '#94a3b8',
    marginBottom: 20,
  },
});

