import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { userApi } from '../../src/services';
import { Card, Button } from '../../src/components/ui';
import { colors, spacing, fontSize, fontWeight, borderRadius } from '../../src/theme';

export default function AdminUsersScreen() {
  const [users, setUsers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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

  return (
    <View style={styles.container}>
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={loadUsers} tintColor={colors.primary} />}
      >
        <View style={styles.header}>
          <Text style={styles.title}>User Management</Text>
          <Button size="sm" icon={<Ionicons name="person-add" size={20} color={colors.surface} />} title="New User" onPress={() => {}} />
        </View>

        {users.map((u) => (
          <Card key={u._id} style={styles.userCard}>
            <View style={styles.avatarContainer}>
              <Text style={styles.avatarText}>{u.name.charAt(0).toUpperCase()}</Text>
            </View>
            
            <View style={styles.userInfo}>
              <Text style={styles.userName} numberOfLines={1}>{u.name}</Text>
              <Text style={styles.userEmail} numberOfLines={1}>{u.email}</Text>
              <View style={styles.badgeRow}>
                <View style={styles.roleBadge}>
                  <Text style={styles.roleText}>{u.role}</Text>
                </View>
                <Text style={styles.deptText} numberOfLines={1}>{u.department}</Text>
              </View>
            </View>

            <Button 
              variant="ghost" 
              icon={<Ionicons name="create-outline" size={20} color={colors.primary} />} 
              title="" 
              onPress={() => {}} 
            />
          </Card>
        ))}

        {users.length === 0 && !isLoading && (
          <Text style={styles.emptyText}>No users found.</Text>
        )}
      </ScrollView>
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
  avatarText: {
    color: colors.surface,
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
    borderRadius: borderRadius.pill,
    marginRight: spacing.sm,
  },
  roleText: {
    color: colors.secondary,
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
  }
});
