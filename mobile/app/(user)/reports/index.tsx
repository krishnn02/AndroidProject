import React, { useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useReportStore } from '../../../src/stores/reportStore';
import { useAuthStore } from '../../../src/stores/authStore';
import { Card } from '../../../src/components/ui';
import { colors, spacing, fontSize, fontWeight, borderRadius } from '../../../src/theme';

export default function ReportsScreen() {
  const { reports, fetchReports, isLoading } = useReportStore();
  const { user } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    fetchReports({ userId: user?._id });
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'APPROVED': return colors.success;
      case 'REJECTED': return colors.error;
      case 'SUBMITTED': return colors.warning;
      default: return colors.primaryLight;
    }
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={reports}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={() => fetchReports({ userId: user?._id })} tintColor={colors.primary} />}
        renderItem={({ item }) => (
          <Card style={styles.card} onPress={() => router.push(`/(user)/reports/${item._id}` as any)}>
            <View style={styles.header}>
              <View style={[styles.badge, { backgroundColor: getStatusColor(item.status) + '20' }]}>
                <Text style={[styles.badgeText, { color: getStatusColor(item.status) }]}>{item.status}</Text>
              </View>
              <Text style={styles.dateText}>{new Date(item.createdAt).toLocaleDateString()}</Text>
            </View>
            <Text style={styles.name}>{item.event?.name || 'Unknown Event'}</Text>
            <View style={styles.detailsRow}>
              <View style={styles.detail}>
                <Ionicons name="document-text-outline" size={14} color={colors.textMuted} />
                <Text style={styles.detailText}>{item.event?.type}</Text>
              </View>
            </View>
          </Card>
        )}
        ListEmptyComponent={!isLoading ? <Text style={styles.emptyText}>No reports created</Text> : null}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  list: { padding: spacing.lg },
  card: { marginBottom: spacing.md },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm },
  badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: borderRadius.sm },
  badgeText: { fontSize: fontSize.xs, fontWeight: fontWeight.bold },
  dateText: { fontSize: fontSize.xs, color: colors.textSecondary },
  name: { fontSize: fontSize.lg, fontWeight: fontWeight.bold, color: colors.text, marginBottom: spacing.sm },
  detailsRow: { flexDirection: 'row', gap: spacing.lg },
  detail: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  detailText: { fontSize: fontSize.sm, color: colors.textSecondary },
  emptyText: { color: colors.textMuted, textAlign: 'center', marginTop: spacing.xl },
});
