import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { eventApi } from '../../src/services';
import { Card, Button } from '../../src/components/ui';
import { colors, spacing, fontSize, fontWeight, borderRadius } from '../../src/theme';

export default function AdminEventsScreen() {
  const router = useRouter();
  const [events, setEvents] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadEvents = async () => {
    setIsLoading(true);
    try {
      const { data } = await eventApi.getAll({ limit: 100 });
      setEvents(data.data.events || []);
    } catch (error) {
      console.error('Failed to load events:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadEvents();
  }, []);

  const handleNewEvent = () => {
    router.push('/(admin)/create-report');
  };

  const handleEditEvent = (id: string) => {
    Alert.alert('Edit Event', `Edit flow for event ID: ${id} will be here.`);
  };

  const handleAssignUsers = (id: string) => {
    Alert.alert('Assign Users', `User assignment modal for event ID: ${id} will appear here.`);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return colors.success;
      case 'COMPLETED': return colors.primary;
      case 'CANCELLED': return colors.error;
      default: return colors.textMuted;
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={loadEvents} tintColor={colors.primary} />}
      >
        <View style={styles.header}>
          <Text style={styles.title}>All Events</Text>
          <Button size="sm" icon={<Ionicons name="add" size={20} color={colors.text} />} title="New" onPress={handleNewEvent} />
        </View>

        {events.map((event) => (
          <Card key={event._id} style={styles.eventCard}>
            <View style={styles.eventHeader}>
              <Text style={styles.eventName} numberOfLines={2}>{event.name}</Text>
              <View style={[styles.statusBadge, { backgroundColor: getStatusColor(event.status) + '20' }]}>
                <Text style={[styles.statusText, { color: getStatusColor(event.status) }]}>{event.status}</Text>
              </View>
            </View>
            <View style={styles.eventDetails}>
              <View style={styles.detailRow}>
                <Ionicons name="calendar-outline" size={14} color={colors.textSecondary} style={styles.detailIcon} />
                <Text style={styles.detailText}>{new Date(event.date).toLocaleDateString()}</Text>
              </View>
              <View style={styles.detailRow}>
                <Ionicons name="business-outline" size={14} color={colors.textSecondary} style={styles.detailIcon} />
                <Text style={styles.detailText}>{event.department}</Text>
              </View>
              <View style={styles.detailRow}>
                <Ionicons name="pricetag-outline" size={14} color={colors.textSecondary} style={styles.detailIcon} />
                <Text style={styles.detailText}>{event.type}</Text>
              </View>
            </View>
            <View style={styles.actionsRow}>
              <Button variant="outline" size="sm" title="Edit" onPress={() => handleEditEvent(event._id)} style={styles.actionBtn} />
              <Button variant="primary" size="sm" title="Assign" onPress={() => handleAssignUsers(event._id)} style={styles.actionBtn} />
            </View>
          </Card>
        ))}

        {events.length === 0 && !isLoading && (
          <Text style={styles.emptyText}>No events found.</Text>
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
  eventCard: {
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  eventHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  eventName: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: colors.text,
    flex: 1,
    marginRight: spacing.sm,
  },
  statusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.full,
  },
  statusText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
  },
  eventDetails: {
    marginBottom: spacing.md,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  detailIcon: {
    marginRight: spacing.xs,
    width: 16,
  },
  detailText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.md,
    gap: spacing.sm,
  },
  actionBtn: {
    minWidth: 80,
  },
  emptyText: {
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.xl,
    fontStyle: 'italic',
  }
});
