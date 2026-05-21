import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  RefreshControl, 
  Alert, 
  Modal, 
  TouchableOpacity, 
  KeyboardAvoidingView, 
  Platform 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { userApi } from '../../src/services';
import { Card, Button, Input, SafetyModal } from '../../src/components/ui';
import { colors, spacing, fontSize, fontWeight, borderRadius } from '../../src/theme';

export default function AdminUsersScreen() {
  const [users, setUsers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modal & Form State
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formPassword, setFormPassword] = useState('');
  const [formDepartment, setFormDepartment] = useState('');
  const [formCollege, setFormCollege] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [formNameError, setFormNameError] = useState('');
  const [formEmailError, setFormEmailError] = useState('');
  const [formPhoneError, setFormPhoneError] = useState('');
  const [formPasswordError, setFormPasswordError] = useState('');
  const [formDeptError, setFormDeptError] = useState('');

  // User Options Modal State
  const [selectedOptUser, setSelectedOptUser] = useState<any>(null);
  const [isOptionsModalVisible, setIsOptionsModalVisible] = useState(false);

  // Search & Filters State
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');
  const [deptFilter, setDeptFilter] = useState('ALL');

  // Safety Confirmation Modals State
  const [isDeactivateVisible, setIsDeactivateVisible] = useState(false);
  const [isDeleteVisible, setIsDeleteVisible] = useState(false);
  const [safetyActionLoading, setSafetyActionLoading] = useState(false);

  const loadUsers = async () => {
    setIsLoading(true);
    try {
      const { data } = await userApi.getAll({ limit: 100 });
      setUsers(data.data.users || []);
    } catch (error) {
      console.error('Failed to load users:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleNewUser = () => {
    setEditingUser(null);
    setFormName('');
    setFormEmail('');
    setFormPhone('');
    setFormPassword('');
    setFormDepartment('');
    setFormCollege('');
    setFormError('');
    setFormNameError('');
    setFormEmailError('');
    setFormPhoneError('');
    setFormPasswordError('');
    setFormDeptError('');
    setIsModalVisible(true);
  };

  const handleEditUser = (user: any) => {
    setEditingUser(user);
    setFormName(user.name || '');
    setFormEmail(user.email || '');
    setFormPhone(user.phone || '');
    setFormPassword(''); // Keep blank unless resetting
    setFormDepartment(user.department || '');
    setFormCollege(user.college || '');
    setFormError('');
    setFormNameError('');
    setFormEmailError('');
    setFormPhoneError('');
    setFormPasswordError('');
    setFormDeptError('');
    setIsModalVisible(true);
  };

  const handleOpenOptions = (user: any) => {
    setSelectedOptUser(user);
    setIsOptionsModalVisible(true);
  };

  const handleActivateUser = async (id: string) => {
    setIsSubmitting(true);
    try {
      await userApi.update(id, { isActive: true });
      Alert.alert('Success', 'User activated successfully.');
      setIsOptionsModalVisible(false);
      loadUsers();
    } catch (error) {
      Alert.alert('Error', 'Failed to activate user.');
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeactivateConfirm = async () => {
    if (!selectedOptUser) return;
    setSafetyActionLoading(true);
    try {
      await userApi.delete(selectedOptUser._id);
      Alert.alert('Success', 'User deactivated successfully.');
      setIsDeactivateVisible(false);
      setIsOptionsModalVisible(false);
      loadUsers();
    } catch (error) {
      Alert.alert('Error', 'Failed to deactivate user.');
      console.error(error);
    } finally {
      setSafetyActionLoading(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!selectedOptUser) return;
    setSafetyActionLoading(true);
    try {
      await userApi.delete(selectedOptUser._id, { permanent: true });
      Alert.alert('Success', 'User deleted permanently.');
      setIsDeleteVisible(false);
      setIsOptionsModalVisible(false);
      loadUsers();
    } catch (error) {
      Alert.alert('Error', 'Failed to delete user.');
      console.error(error);
    } finally {
      setSafetyActionLoading(false);
    }
  };

  const handleSubmit = async () => {
    let hasError = false;
    setFormNameError('');
    setFormEmailError('');
    setFormPhoneError('');
    setFormPasswordError('');
    setFormDeptError('');
    setFormError('');

    if (!formName.trim()) {
      setFormNameError('Name is required');
      hasError = true;
    } else if (formName.trim().length < 2) {
      setFormNameError('Name must be at least 2 characters');
      hasError = true;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formEmail.trim()) {
      setFormEmailError('Email is required');
      hasError = true;
    } else if (!emailRegex.test(formEmail.trim())) {
      setFormEmailError('Please enter a valid email address');
      hasError = true;
    }

    if (formPhone.trim() && !/^\d{10}$/.test(formPhone.trim())) {
      setFormPhoneError('Phone must be a 10-digit number');
      hasError = true;
    }

    if (!editingUser && !formPassword.trim()) {
      setFormPasswordError('Password is required for new users');
      hasError = true;
    } else if (formPassword.trim() && formPassword.trim().length < 6) {
      setFormPasswordError('Password must be at least 6 characters');
      hasError = true;
    }

    if (!formDepartment.trim()) {
      setFormDeptError('Department is required');
      hasError = true;
    }

    if (hasError) {
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: any = {
        name: formName.trim(),
        email: formEmail.trim().toLowerCase(),
        phone: formPhone.trim(),
        department: formDepartment.trim(),
        college: formCollege.trim(),
      };

      if (editingUser) {
        if (formPassword.trim()) {
          payload.password = formPassword.trim();
        }
        await userApi.update(editingUser._id, payload);
        Alert.alert('Success', 'User updated successfully.');
      } else {
        payload.password = formPassword.trim();
        payload.role = 'USER';
        await userApi.create(payload);
        Alert.alert('Success', 'User registered successfully.');
      }

      setIsModalVisible(false);
      loadUsers();
    } catch (err: any) {
      setFormError(err.response?.data?.message || 'Something went wrong.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const departments = ['ALL', ...Array.from(new Set(users.map(u => u.department).filter(Boolean)))];

  const filteredUsers = users.filter(u => {
    const matchesSearch = 
      u.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.department?.toLowerCase().includes(searchQuery.toLowerCase());
      
    const matchesStatus = 
      statusFilter === 'ALL' ||
      (statusFilter === 'ACTIVE' && u.isActive !== false) ||
      (statusFilter === 'INACTIVE' && u.isActive === false);
      
    const matchesDept = 
      deptFilter === 'ALL' || 
      u.department === deptFilter;
      
    return matchesSearch && matchesStatus && matchesDept;
  });

  return (
    <View style={styles.container}>
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={loadUsers} tintColor={colors.primary} />}
      >
        <View style={styles.header}>
          <Text style={styles.title}>User Management</Text>
          <Button size="sm" icon={<Ionicons name="person-add" size={20} color={colors.text} />} title="New User" onPress={handleNewUser} />
        </View>

        <View style={styles.searchContainer}>
          <Input
            placeholder="Search users by name, email..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            icon="search-outline"
            containerStyle={{ marginBottom: spacing.sm }}
          />
        </View>

        <View style={styles.filterSection}>
          <Text style={styles.filterLabel}>Status:</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterChipsRow}>
            {(['ALL', 'ACTIVE', 'INACTIVE'] as const).map(status => (
              <TouchableOpacity
                key={status}
                onPress={() => setStatusFilter(status)}
                style={[styles.chip, statusFilter === status && styles.chipActive]}
              >
                <Text style={[styles.chipText, statusFilter === status && styles.chipTextActive]}>
                  {status}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {departments.length > 2 && (
          <View style={[styles.filterSection, { marginTop: spacing.sm, marginBottom: spacing.md }]}>
            <Text style={styles.filterLabel}>Dept:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterChipsRow}>
              {departments.map(dept => (
                <TouchableOpacity
                  key={dept}
                  onPress={() => setDeptFilter(dept)}
                  style={[styles.chip, deptFilter === dept && styles.chipActive]}
                >
                  <Text style={[styles.chipText, deptFilter === dept && styles.chipTextActive]}>
                    {dept}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {filteredUsers.map((u) => (
          <Card key={u._id} style={styles.userCard}>
            <View style={[styles.avatarContainer, u.isActive === false && styles.avatarInactive]}>
              <Text style={styles.avatarText}>{u.name.charAt(0).toUpperCase()}</Text>
            </View>
            
            <View style={styles.userInfo}>
              <Text style={[styles.userName, u.isActive === false && styles.textInactive]} numberOfLines={1}>
                {u.name}
              </Text>
              <Text style={styles.userEmail} numberOfLines={1}>{u.email}</Text>
              <View style={styles.badgeRow}>
                <View style={styles.roleBadge}>
                  <Text style={styles.roleText}>{u.role}</Text>
                </View>
                {u.isActive === false ? (
                  <View style={[styles.statusBadge, { backgroundColor: colors.error + '20' }]}>
                    <Text style={[styles.statusText, { color: colors.error }]}>Inactive</Text>
                  </View>
                ) : (
                  <View style={[styles.statusBadge, { backgroundColor: '#10b98120' }]}>
                    <Text style={[styles.statusText, { color: '#10b981' }]}>Active</Text>
                  </View>
                )}
                <Text style={styles.deptText} numberOfLines={1}>{u.department}</Text>
              </View>
            </View>

            <View style={styles.actionRow}>
              <Button 
                variant="ghost" 
                icon={<Ionicons name="create-outline" size={20} color={colors.primary} />} 
                title="" 
                onPress={() => handleEditUser(u)} 
              />
              {u.role !== 'ADMIN' && (
                <Button 
                  variant="ghost" 
                  icon={<Ionicons name="ellipsis-vertical-outline" size={20} color={colors.textSecondary} />} 
                  title="" 
                  onPress={() => handleOpenOptions(u)} 
                />
              )}
            </View>
          </Card>
        ))}

        {filteredUsers.length === 0 && !isLoading && (
          <Text style={styles.emptyText}>No users found.</Text>
        )}
      </ScrollView>

      {/* User Form Modal */}
      <Modal
        visible={isModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView 
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.modalContainer}
          >
            <Card style={styles.modalCard}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>
                  {editingUser ? 'Edit User' : 'Create User'}
                </Text>
                <TouchableOpacity onPress={() => setIsModalVisible(false)} style={styles.closeBtn}>
                  <Ionicons name="close" size={24} color={colors.text} />
                </TouchableOpacity>
              </View>

              {formError ? (
                <View style={styles.errorBox}>
                  <Text style={styles.errorText}>{formError}</Text>
                </View>
              ) : null}

              <ScrollView showsVerticalScrollIndicator={false} style={styles.modalForm}>
                <Input
                  label="Full Name"
                  placeholder="Enter full name"
                  value={formName}
                  onChangeText={(val) => {
                    setFormName(val);
                    if (formNameError) setFormNameError('');
                  }}
                  icon="person-outline"
                  error={formNameError}
                />
                
                <Input
                  label="Email Address"
                  placeholder="Enter email address"
                  value={formEmail}
                  onChangeText={(val) => {
                    setFormEmail(val);
                    if (formEmailError) setFormEmailError('');
                  }}
                  icon="mail-outline"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  editable={!editingUser}
                  error={formEmailError}
                />

                <Input
                  label="Phone / Mobile"
                  placeholder="Enter phone number"
                  value={formPhone}
                  onChangeText={(val) => {
                    setFormPhone(val);
                    if (formPhoneError) setFormPhoneError('');
                  }}
                  icon="call-outline"
                  keyboardType="phone-pad"
                  error={formPhoneError}
                />

                <Input
                  label={editingUser ? 'Password (leave blank to keep unchanged)' : 'Password'}
                  placeholder="Enter password"
                  value={formPassword}
                  onChangeText={(val) => {
                    setFormPassword(val);
                    if (formPasswordError) setFormPasswordError('');
                  }}
                  icon="lock-closed-outline"
                  secureTextEntry
                  error={formPasswordError}
                />

                <Input
                  label="Department"
                  placeholder="Enter department (e.g. CSE, IT)"
                  value={formDepartment}
                  onChangeText={(val) => {
                    setFormDepartment(val);
                    if (formDeptError) setFormDeptError('');
                  }}
                  icon="business-outline"
                  error={formDeptError}
                />

                <Input
                  label="College"
                  placeholder="Enter college (optional)"
                  value={formCollege}
                  onChangeText={setFormCollege}
                  icon="school-outline"
                />
                
                <View style={styles.modalActions}>
                  <Button
                    title="Cancel"
                    variant="outline"
                    onPress={() => setIsModalVisible(false)}
                    style={styles.actionBtn}
                  />
                  <Button
                    title={editingUser ? 'Save' : 'Create'}
                    onPress={handleSubmit}
                    loading={isSubmitting}
                    style={styles.actionBtn}
                  />
                </View>
              </ScrollView>
            </Card>
          </KeyboardAvoidingView>
        </View>
      </Modal>

      {/* User Options Modal */}
      <Modal
        visible={isOptionsModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsOptionsModalVisible(false)}
      >
        <TouchableOpacity 
          style={styles.optionsOverlay} 
          activeOpacity={1} 
          onPress={() => setIsOptionsModalVisible(false)}
        >
          <View style={styles.optionsContainer}>
            <View style={styles.optionsHeader}>
              <View style={styles.optionsBar} />
              <Text style={styles.optionsTitle}>User Settings</Text>
              {selectedOptUser && (
                <View style={styles.optionsUserCard}>
                  <View style={[styles.avatarContainer, { width: 36, height: 36, marginRight: spacing.sm, marginBottom: 0 }, selectedOptUser.isActive === false && styles.avatarInactive]}>
                    <Text style={[styles.avatarText, { fontSize: fontSize.md }]}>{selectedOptUser.name.charAt(0).toUpperCase()}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.optionsUserName}>{selectedOptUser.name}</Text>
                    <Text style={styles.optionsUserEmail}>{selectedOptUser.email}</Text>
                  </View>
                  <View style={[styles.statusIndicator, { backgroundColor: selectedOptUser.isActive === false ? colors.error : colors.success }]} />
                </View>
              )}
            </View>

            <View style={styles.optionsDivider} />

            <View style={styles.optionsGrid}>
              <TouchableOpacity 
                style={styles.gridItem}
                onPress={() => {
                  setIsOptionsModalVisible(false);
                  handleEditUser(selectedOptUser);
                }}
              >
                <View style={[styles.gridIconCircle, { backgroundColor: colors.primary + '15' }]}>
                  <Ionicons name="create" size={24} color={colors.primaryLight} />
                </View>
                <Text style={styles.gridText}>Edit Profile</Text>
              </TouchableOpacity>

              {selectedOptUser?.isActive === false ? (
                <TouchableOpacity 
                  style={styles.gridItem} 
                  onPress={() => handleActivateUser(selectedOptUser._id)}
                >
                  <View style={[styles.gridIconCircle, { backgroundColor: colors.success + '15' }]}>
                    <Ionicons name="checkmark-circle" size={24} color={colors.success} />
                  </View>
                  <Text style={[styles.gridText, { color: colors.success }]}>Activate</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity 
                  style={styles.gridItem} 
                  onPress={() => {
                    setIsDeactivateVisible(true);
                  }}
                >
                  <View style={[styles.gridIconCircle, { backgroundColor: colors.warning + '15' }]}>
                    <Ionicons name="ban" size={24} color={colors.warning} />
                  </View>
                  <Text style={[styles.gridText, { color: colors.warning }]}>Deactivate</Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity 
                style={styles.gridItem} 
                onPress={() => {
                  setIsDeleteVisible(true);
                }}
              >
                <View style={[styles.gridIconCircle, { backgroundColor: colors.error + '15' }]}>
                  <Ionicons name="trash" size={24} color={colors.error} />
                </View>
                <Text style={[styles.gridText, { color: colors.error }]}>Delete</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.optionsDivider} />

            <Button 
              title="Close" 
              variant="secondary"
              onPress={() => setIsOptionsModalVisible(false)} 
              style={{ width: '100%' }}
            />
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Safety Confirmation Modals */}
      <SafetyModal
        visible={isDeactivateVisible}
        title="Deactivate User"
        description={`Are you sure you want to deactivate ${selectedOptUser?.name}? They will no longer be able to log in.`}
        expectedText="DEACTIVATE"
        confirmText="Deactivate"
        onConfirm={handleDeactivateConfirm}
        onCancel={() => setIsDeactivateVisible(false)}
        isConfirming={safetyActionLoading}
      />

      <SafetyModal
        visible={isDeleteVisible}
        title="Permanently Delete User"
        description={`WARNING: This will permanently delete ${selectedOptUser?.name} and all their data from the database. This action CANNOT be undone.`}
        expectedText={selectedOptUser?.name || 'DELETE'}
        confirmText="Delete Permanently"
        onConfirm={handleDeleteConfirm}
        onCancel={() => setIsDeleteVisible(false)}
        isConfirming={safetyActionLoading}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  scrollContent: {
    padding: spacing.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  title: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.text,
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  avatarContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  avatarInactive: {
    backgroundColor: colors.border,
  },
  avatarText: {
    color: colors.text,
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
  },
  userInfo: {
    flex: 1,
    marginRight: spacing.sm,
  },
  userName: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: colors.text,
    marginBottom: 2,
  },
  textInactive: {
    color: colors.textMuted,
    textDecorationLine: 'line-through',
  },
  userEmail: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  roleBadge: {
    backgroundColor: colors.secondary + '20',
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.full,
    marginRight: spacing.sm,
  },
  roleText: {
    color: colors.secondary,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
  },
  statusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.full,
    marginRight: spacing.sm,
  },
  statusText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
  },
  deptText: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    flex: 1,
  },
  emptyText: {
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.xl,
    fontStyle: 'italic',
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    padding: spacing.md,
  },
  modalContainer: {
    maxHeight: '90%',
  },
  modalCard: {
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingBottom: spacing.sm,
  },
  modalTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.text,
  },
  closeBtn: {
    padding: spacing.xs,
  },
  modalForm: {
    maxHeight: 450,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  actionBtn: {
    flex: 1,
  },
  errorBox: {
    backgroundColor: colors.error + '20',
    padding: spacing.md,
    borderRadius: borderRadius.sm,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.error + '50',
  },
  errorText: {
    color: colors.error,
    fontSize: fontSize.sm,
    textAlign: 'center',
  },
  optionsOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  optionsContainer: {
    backgroundColor: colors.bgCard,
    borderTopLeftRadius: borderRadius.lg,
    borderTopRightRadius: borderRadius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  optionsHeader: {
    alignItems: 'center',
    width: '100%',
  },
  optionsBar: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.textMuted + '50',
    marginBottom: spacing.sm,
  },
  optionsTitle: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: colors.text,
    marginBottom: spacing.md,
  },
  optionsUserCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgInput,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    width: '100%',
    borderWidth: 1,
    borderColor: colors.border,
  },
  optionsUserName: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: colors.text,
  },
  optionsUserEmail: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  statusIndicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  optionsDivider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.md,
  },
  optionsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  gridItem: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: colors.bgInput,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  gridIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  gridText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.text,
  },
  searchContainer: {
    marginBottom: spacing.sm,
  },
  filterSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  filterLabel: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    fontWeight: fontWeight.semibold,
    marginRight: spacing.sm,
    width: 50,
  },
  filterChipsRow: {
    flexDirection: 'row',
  },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: spacing.xs,
    backgroundColor: colors.bgInput,
  },
  chipActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + '20',
  },
  chipText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
    color: colors.textSecondary,
  },
  chipTextActive: {
    color: colors.primaryLight,
  },
});
