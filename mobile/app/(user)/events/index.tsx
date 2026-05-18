import React, { useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useEventStore } from '../../../src/stores/eventStore';
import { Card } from '../../../src/components/ui';
import { colors, spacing, fontSize, fontWeight, borderRadius } from '../../../src/theme';

export default function EventsScreen() {
  const { events, fetchEvents, isLoading } = useEventStore();
  const router = useRouter();

  useEffect(() => {
    fetchEvents();
  }, []);

  return (
    <View style={styles.container}>
      <FlatList
        data={events}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={fetchEvents} tintColor={colors.primary} />}
        renderItem={({ item }) => (
          <Card style={styles.card} onPress={() => router.push(`/(user)/events/${item._id}` as any)}>
            <View style={styles.header}>
              <View style={[styles.badge, { backgroundColor: item.status === 'ACTIVE' ? colors.success + '20' : colors.warning + '20' }]}>
                <Text style={[styles.badgeText, { color: item.status === 'ACTIVE' ? colors.success : colors.warning }]}>{item.status}</Text>
              </View>
              <Text style={styles.typeText}>{item.type}</Text>
            </View>
            <Text style={styles.name}>{item.name}</Text>
            <View style={styles.detailsRow}>
              <View style={styles.detail}>
                <Ionicons name="calendar-outline" size={14} color={colors.textMuted} />
                <Text style={styles.detailText}>{new Date(item.date).toLocaleDateString()}</Text>
              </View>
              <View style={styles.detail}>
                <Ionicons name="location-outline" size={14} color={colors.textMuted} />
                <Text style={styles.detailText}>{item.venue}</Text>
              </View>
            </View>
          </Card>
        )}
        ListEmptyComponent={!isLoading ? <Text style={styles.emptyText}>No assigned events</Text> : null}
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
  typeText: { fontSize: fontSize.xs, color: colors.primaryLight, fontWeight: fontWeight.semibold },
  name: { fontSize: fontSize.lg, fontWeight: fontWeight.bold, color: colors.text, marginBottom: spacing.sm },
  detailsRow: { flexDirection: 'row', gap: spacing.lg },
  detail: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  detailText: { fontSize: fontSize.sm, color: colors.textSecondary },
  emptyText: { color: colors.textMuted, textAlign: 'center', marginTop: spacing.xl },
});
