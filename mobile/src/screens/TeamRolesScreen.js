import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Modal,
  TextInput,
  RefreshControl,
  ActivityIndicator,
  StyleSheet,
  Alert,
  Pressable,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext.js';
import { RoleBadge } from '../components/Badges.js';
import { userService, getErrorMessage } from '../services/api.js';

const AVAILABLE_ROLES = [
  {
    name: 'MEMBER',
    label: 'Member',
    description: 'Default role. Strictly sees only projects and tasks assigned to them.',
    icon: 'person-outline',
    color: '#64748b',
  },
  {
    name: 'PROJECT_LEADER',
    label: 'Project Leader',
    description: 'Can create projects, assign tasks to members, and log status updates.',
    icon: 'briefcase-outline',
    color: '#4f46e5',
  },
  {
    name: 'ADMIN',
    label: 'Administrator',
    description: 'Complete system visibility and sole authority to manage team roles.',
    icon: 'shield-checkmark-outline',
    color: '#7c3aed',
  },
];

export const TeamRolesScreen = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Role Edit Modal State
  const [selectedUser, setSelectedUser] = useState(null);
  const [targetRoleName, setTargetRoleName] = useState('MEMBER');
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [updating, setUpdating] = useState(false);

  const loadUsers = async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);
      setError(null);
      const data = await userService.getUsers();
      setUsers(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadUsers(true);
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadUsers(false);
  };

  const handleOpenRoleModal = (user) => {
    setSelectedUser(user);
    setTargetRoleName(user.role?.name || 'MEMBER');
    setIsModalVisible(true);
  };

  const handleCloseRoleModal = () => {
    if (updating) return;
    setIsModalVisible(false);
    setSelectedUser(null);
  };

  const executeRoleUpdate = async () => {
    if (!selectedUser) return;
    setUpdating(true);
    setError(null);
    try {
      await userService.updateUserRole(selectedUser.id, targetRoleName);
      setSuccessMessage(`Updated ${selectedUser.name}'s role to ${targetRoleName.replace('_', ' ')}.`);
      setIsModalVisible(false);
      setSelectedUser(null);
      await loadUsers(false);
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err) {
      Alert.alert('Role Update Failed', getErrorMessage(err));
    } finally {
      setUpdating(false);
    }
  };

  const handleSaveRole = () => {
    if (!selectedUser) return;
    const currentRole = selectedUser.role?.name || 'MEMBER';

    if (currentRole === targetRoleName) {
      setIsModalVisible(false);
      return;
    }

    // Safety warning if admin is editing their own role
    if (selectedUser.id === currentUser?.id && targetRoleName !== 'ADMIN') {
      Alert.alert(
        'Demoting Your Own Account',
        'You are about to remove your own Administrator privileges. Once changed, you will no longer have access to this Team Management tab. Are you sure?',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Yes, Change Role', style: 'destructive', onPress: executeRoleUpdate },
        ]
      );
      return;
    }

    executeRoleUpdate();
  };

  const filteredUsers = users.filter((u) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    const nameMatch = u.name?.toLowerCase().includes(query);
    const emailMatch = u.email?.toLowerCase().includes(query);
    return nameMatch || emailMatch;
  });

  const renderUserItem = ({ item }) => {
    const isSelf = item.id === currentUser?.id;
    const initials = item.name
      ? item.name
          .split(' ')
          .map((n) => n[0])
          .join('')
          .substring(0, 2)
          .toUpperCase()
      : 'U';

    return (
      <View style={styles.userCard}>
        <View style={styles.userHeader}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          <View style={styles.userInfo}>
            <View style={styles.userNameRow}>
              <Text style={styles.userName} numberOfLines={1}>
                {item.name}
              </Text>
              {isSelf && (
                <View style={styles.youBadge}>
                  <Text style={styles.youBadgeText}>You</Text>
                </View>
              )}
            </View>
            <Text style={styles.userEmail} numberOfLines={1}>
              {item.email}
            </Text>
          </View>
          <RoleBadge role={item.role} />
        </View>

        <View style={styles.userActionRow}>
          <Text style={styles.userIdText}>ID: {item.id.substring(0, 8)}...</Text>
          <TouchableOpacity
            style={styles.changeRoleBtn}
            onPress={() => handleOpenRoleModal(item)}
            activeOpacity={0.7}
          >
            <Ionicons name="swap-horizontal-outline" size={14} color="#4f46e5" />
            <Text style={styles.changeRoleBtnText}>Change Role</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Search Bar */}
      <View style={styles.searchBar}>
        <Ionicons name="search-outline" size={18} color="#94a3b8" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search team members by name or email..."
          placeholderTextColor="#94a3b8"
        />
        {searchQuery ? (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={16} color="#94a3b8" />
          </TouchableOpacity>
        ) : null}
      </View>

      {/* Success Banner */}
      {successMessage && (
        <View style={styles.successBanner}>
          <Ionicons name="checkmark-circle" size={16} color="#059669" />
          <Text style={styles.successBannerText}>{successMessage}</Text>
        </View>
      )}

      {/* Error Banner */}
      {error && (
        <View style={styles.errorBanner}>
          <Ionicons name="alert-circle" size={18} color="#be123c" />
          <Text style={styles.errorBannerText}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => loadUsers(true)}>
            <Text style={styles.retryBtnText}>Retry</Text>
          </TouchableOpacity>
        </View>
      )}

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#4f46e5" />
          <Text style={styles.loadingText}>Loading team members...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredUsers}
          keyExtractor={(item) => item.id}
          renderItem={renderUserItem}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#4f46e5']} />
          }
          ListHeaderComponent={
            <View style={styles.infoBanner}>
              <View style={styles.infoBannerHeader}>
                <Ionicons name="shield-checkmark" size={18} color="#4f46e5" />
                <Text style={styles.infoBannerTitle}>Role Access Control</Text>
              </View>
              <Text style={styles.infoBannerText}>
                As an Administrator, you can assign Project Leader and Member roles across your team. Members only see their own assigned work, while Leaders manage projects.
              </Text>
            </View>
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="people-outline" size={48} color="#cbd5e1" />
              <Text style={styles.emptyTitle}>No members found</Text>
              <Text style={styles.emptySubtitle}>
                {searchQuery ? 'Try adjusting your search criteria.' : 'No team members registered yet.'}
              </Text>
            </View>
          }
        />
      )}

      {/* Role Selection Modal */}
      <Modal
        visible={isModalVisible}
        transparent
        animationType="fade"
        onRequestClose={handleCloseRoleModal}
      >
        <Pressable style={styles.modalOverlay} onPress={handleCloseRoleModal}>
          <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Assign Role</Text>
                <Text style={styles.modalSubtitle} numberOfLines={1}>
                  {selectedUser?.name} ({selectedUser?.email})
                </Text>
              </View>
              <TouchableOpacity onPress={handleCloseRoleModal} disabled={updating}>
                <Ionicons name="close" size={22} color="#64748b" />
              </TouchableOpacity>
            </View>

            {selectedUser?.id === currentUser?.id && (
              <View style={styles.selfEditWarning}>
                <Ionicons name="warning-outline" size={16} color="#d97706" />
                <Text style={styles.selfEditWarningText}>
                  Caution: You are changing your own role. Removing Admin privileges cannot be undone by yourself.
                </Text>
              </View>
            )}

            <View style={styles.roleOptionsList}>
              {AVAILABLE_ROLES.map((r) => {
                const isSelected = targetRoleName === r.name;
                return (
                  <TouchableOpacity
                    key={r.name}
                    style={[styles.roleOptionCard, isSelected && styles.roleOptionCardActive]}
                    onPress={() => setTargetRoleName(r.name)}
                    activeOpacity={0.7}
                    disabled={updating}
                  >
                    <View style={styles.roleOptionHeader}>
                      <View style={[styles.roleIconWrapper, { backgroundColor: r.color + '15' }]}>
                        <Ionicons name={r.icon} size={18} color={r.color} />
                      </View>
                      <View style={styles.roleLabelWrapper}>
                        <Text style={[styles.roleOptionLabel, isSelected && styles.roleOptionLabelActive]}>
                          {r.label}
                        </Text>
                        <Text style={styles.roleOptionDesc}>{r.description}</Text>
                      </View>
                      <Ionicons
                        name={isSelected ? 'radio-button-on' : 'radio-button-off'}
                        size={20}
                        color={isSelected ? '#4f46e5' : '#cbd5e1'}
                      />
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>

            <View style={styles.modalActionRow}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={handleCloseRoleModal}
                disabled={updating}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.saveBtn, updating && styles.saveBtnDisabled]}
                onPress={handleSaveRole}
                disabled={updating}
              >
                {updating ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <Text style={styles.saveBtnText}>Save Role</Text>
                )}
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
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
  successBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ecfdf5',
    marginHorizontal: 16,
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#a7f3d0',
    gap: 8,
    marginBottom: 8,
  },
  successBannerText: {
    fontSize: 12,
    color: '#065f46',
    flex: 1,
    fontWeight: '500',
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff1f2',
    marginHorizontal: 16,
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#fecdd3',
    gap: 8,
    marginBottom: 8,
  },
  errorBannerText: {
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
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 13,
    color: '#64748b',
  },
  listContent: {
    padding: 16,
    paddingTop: 4,
    paddingBottom: 32,
  },
  infoBanner: {
    backgroundColor: '#eef2ff',
    borderRadius: 14,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e0e7ff',
  },
  infoBannerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  infoBannerTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#3730a3',
  },
  infoBannerText: {
    fontSize: 11,
    color: '#4338ca',
    lineHeight: 16,
  },
  userCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
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
  userHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#e0e7ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  avatarText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#4338ca',
  },
  userInfo: {
    flex: 1,
  },
  userNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  userName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a',
    maxWidth: 150,
  },
  youBadge: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  youBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#64748b',
  },
  userEmail: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
  },
  userActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f8fafc',
  },
  userIdText: {
    fontSize: 10,
    color: '#94a3b8',
    fontFamily: 'monospace',
  },
  changeRoleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#eef2ff',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    gap: 4,
  },
  changeRoleBtnText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#4f46e5',
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0f172a',
  },
  modalSubtitle: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
    maxWidth: 240,
  },
  selfEditWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fffbeb',
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#fef3c7',
    gap: 8,
    marginBottom: 14,
  },
  selfEditWarningText: {
    fontSize: 11,
    color: '#b45309',
    flex: 1,
    lineHeight: 15,
  },
  roleOptionsList: {
    gap: 10,
    marginBottom: 18,
  },
  roleOptionCard: {
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    borderRadius: 14,
    padding: 12,
    backgroundColor: '#f8fafc',
  },
  roleOptionCardActive: {
    borderColor: '#4f46e5',
    backgroundColor: '#eef2ff',
  },
  roleOptionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  roleIconWrapper: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  roleLabelWrapper: {
    flex: 1,
  },
  roleOptionLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1e293b',
  },
  roleOptionLabelActive: {
    color: '#4f46e5',
  },
  roleOptionDesc: {
    fontSize: 10,
    color: '#64748b',
    marginTop: 2,
    lineHeight: 14,
  },
  modalActionRow: {
    flexDirection: 'row',
    gap: 10,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
  },
  cancelBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748b',
  },
  saveBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#4f46e5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtnDisabled: {
    backgroundColor: '#a5b4fc',
  },
  saveBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#ffffff',
  },
});

