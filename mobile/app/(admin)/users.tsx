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
import { Card, Button, Input } from '../../src/components/ui';
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

  // User Options Modal State
  const [selectedOptUser, setSelectedOptUser] = useState<any>(null);
  const [isOptionsModalVisible, setIsOptionsModalVisible] = useState(false);

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

  const handleDeactivateUser = (id: string, name: string) => {
    Alert.alert(
      'Deactivate User',
      `Are you sure you want to deactivate ${name}? They will no longer be able to log in.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Deactivate',
          style: 'destructive',
          onPress: async () => {
            try {
              await userApi.delete(id);
              Alert.alert('Success', 'User deactivated successfully.');
              setIsOptionsModalVisible(false);
              loadUsers();
            } catch (error) {
              Alert.alert('Error', 'Failed to deactivate user.');
              console.error(error);
            }
          }
        }
      ]
    );
  };

  const handlePermanentDelete = (id: string, name: string) => {
    Alert.alert(
      'Delete User Permanently',
      `WARNING: This will permanently delete ${name} and all their associated data from the system. This action CANNOT be undone.\n\nAre you sure you want to proceed?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Permanently',
          style: 'destructive',
          onPress: async () => {
            try {
              await userApi.delete(id, { permanent: true });
              Alert.alert('Success', 'User deleted permanently.');
              setIsOptionsModalVisible(false);
              loadUsers();
            } catch (error) {
              Alert.alert('Error', 'Failed to delete user.');
              console.error(error);
            }
          }
        }
      ]
    );
  };

  const handleSubmit = async () => {
    if (!formName.trim() || !formEmail.trim() || !formDepartment.trim()) {
      setFormError('Please fill in Name, Email, and Department.');
      return;
    }
    if (!editingUser && !formPassword.trim()) {
      setFormError('Password is required for new users.');
      return;
    }
    if (!editingUser && formPassword.trim().length < 6) {
      setFormError('Password must be at least 6 characters.');
      return;
    }

    setIsSubmitting(true);
    setFormError('');
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

        {users.map((u) => (
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

        {users.length === 0 && !isLoading && (
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
                  onChangeText={setFormName}
                  icon="person-outline"
                />
                
                <Input
                  label="Email Address"
                  placeholder="Enter email address"
                  value={formEmail}
                  onChangeText={setFormEmail}
                  icon="mail-outline"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  editable={!editingUser}
                />

                <Input
                  label="Phone / Mobile"
                  placeholder="Enter phone number"
                  value={formPhone}
                  onChangeText={setFormPhone}
                  icon="call-outline"
                  keyboardType="phone-pad"
                />

                <Input
                  label={editingUser ? 'Password (leave blank to keep unchanged)' : 'Password'}
                  placeholder="Enter password"
                  value={formPassword}
                  onChangeText={setFormPassword}
                  icon="lock-closed-outline"
                  secureTextEntry
                />

                <Input
                  label="Department"
                  placeholder="Enter department (e.g. CSE, IT)"
                  value={formDepartment}
                  onChangeText={setFormDepartment}
                  icon="business-outline"
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
              <Text style={styles.optionsTitle}>User Options</Text>
              {selectedOptUser && (
                <Text style={styles.optionsSubTitle}>{selectedOptUser.name} ({selectedOptUser.email})</Text>
              )}
            </View>

            <View style={styles.optionsDivider} />

            {selectedOptUser?.isActive === false ? (
              <TouchableOpacity 
                style={styles.optionItem} 
                onPress={() => handleActivateUser(selectedOptUser._id)}
              >
                <Ionicons name="checkmark-circle-outline" size={24} color={colors.success} />
                <Text style={[styles.optionText, styles.optionTextSuccess]}>Activate User</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity 
                style={styles.optionItem} 
                onPress={() => handleDeactivateUser(selectedOptUser?._id, selectedOptUser?.name)}
              >
                <Ionicons name="ban-outline" size={24} color={colors.warning} />
                <Text style={[styles.optionText, styles.optionTextWarning]}>Deactivate User</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity 
              style={[styles.optionItem, styles.optionItemDanger]} 
              onPress={() => handlePermanentDelete(selectedOptUser?._id, selectedOptUser?.name)}
            >
              <Ionicons name="trash-outline" size={24} color={colors.error} />
              <Text style={[styles.optionText, styles.optionTextDanger]}>Delete Permanently</Text>
            </TouchableOpacity>

            <View style={styles.optionsDivider} />

            <TouchableOpacity 
              style={[styles.optionItem, { justifyContent: 'center' }]} 
              onPress={() => setIsOptionsModalVisible(false)}
            >
              <Text style={[styles.optionText, { marginLeft: 0 }]}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
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
  },
  optionsSubTitle: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    marginTop: 4,
  },
  optionsDivider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.md,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.md,
  },
  optionItemDanger: {
    // any extra style if needed
  },
  optionText: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.medium,
    color: colors.text,
    marginLeft: spacing.md,
  },
  optionTextSuccess: {
    color: colors.success,
  },
  optionTextWarning: {
    color: colors.warning,
  },
  optionTextDanger: {
    color: colors.error,
  },
});
