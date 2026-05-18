import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useAuthStore } from '../../src/stores/authStore';
import { Button } from '../../src/components/ui';
import { colors, spacing, fontSize, fontWeight } from '../../src/theme';

export default function AdminDashboardScreen() {
  const { user, logout } = useAuthStore();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Admin Dashboard</Text>
      <Text style={styles.subtitle}>Welcome, {user?.name}</Text>
      
      <Button 
        title="Log Out" 
        variant="outline" 
        onPress={logout}
        style={{ marginTop: spacing.xl }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: spacing.xl, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: fontSize.xxl, fontWeight: fontWeight.bold, color: colors.text, marginBottom: spacing.md },
  subtitle: { fontSize: fontSize.md, color: colors.textSecondary },
});
