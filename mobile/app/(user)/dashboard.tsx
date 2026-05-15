import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../src/stores/authStore';
import { useEventStore } from '../../src/stores/eventStore';
import { useReportStore } from '../../src/stores/reportStore';
import { Card, StatCard, Button } from '../../src/components/ui';
import { colors, spacing, fontSize, fontWeight, borderRadius } from '../../src/theme';

export default function DashboardScreen() {
  const { user, logout } = useAuthStore();
  const { events, fetchEvents, isLoading: eventsLoading } = useEventStore();
  const { reports, fetchReports, isLoading: reportsLoading } = useReportStore();
  const router = useRouter();

  const loadData = () => {
    fetchEvents();
    fetchReports({ userId: user?._id });
  };

  useEffect(() => {
    loadData();
  }, []);

  const refreshing = eventsLoading || reportsLoading;

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={loadData} tintColor={colors.primary} />}
    >
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Hello, {user?.name.split(' ')[0]}</Text>
          <Text style={styles.dept}>{user?.department}</Text>
        </View>
        <Button variant="ghost" icon={<Ionicons name="log-out-outline" size={24} color={colors.error} />} onPress={logout} title="" />
      </View>

      <View style={styles.statsRow}>
        <StatCard 
          title="Assigned Events" 
          value={events.length} 
          icon={<Ionicons name="calendar" size={24} color={colors.primary} />} 
          onPress={() => router.push('/(user)/events')}
        />
        <StatCard 
          title="My Reports" 
          value={reports.length} 
          icon={<Ionicons name="document-text" size={24} color={colors.secondary} />} 
          color={colors.secondary}
          onPress={() => router.push('/(user)/reports')}
        />
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Events</Text>
          <Button title="View All" variant="ghost" size="sm" onPress={() => router.push('/(user)/events')} />
        </View>

        {events.slice(0, 3).map((event) => (
          <Card key={event._id} style={styles.eventCard} onPress={() => router.push(`/(user)/events/${event._id}` as any)}>
            <View style={styles.eventIcon}>
              <Ionicons name="calendar-outline" size={20} color={colors.primary} />
            </View>
            <View style={styles.eventInfo}>
              <Text style={styles.eventName} numberOfLines={1}>{event.name}</Text>
              <Text style={styles.eventDate}>{new Date(event.date).toLocaleDateString()}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
          </Card>
        ))}

        {events.length === 0 && !eventsLoading && (
          <Text style={styles.emptyText}>No events assigned to you yet.</Text>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: spacing.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  greeting: {
    fontSize: fontSize.xxl,
    fontWeight: fontWeight.bold,
    color: colors.text,
  },
  dept: {
    fontSize: fontSize.sm,
    color: colors.primaryLight,
    marginTop: 2,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.xl,
    gap: spacing.md,
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.text,
  },
  eventCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  eventIcon: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  eventInfo: {
    flex: 1,
  },
  eventName: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.text,
    marginBottom: 2,
  },
  eventDate: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
  },
  emptyText: {
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.lg,
    fontStyle: 'italic',
  }
});
