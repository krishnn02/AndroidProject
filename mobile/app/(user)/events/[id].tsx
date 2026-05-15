import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useEventStore } from '../../../src/stores/eventStore';
import { useReportStore } from '../../../src/stores/reportStore';
import { Card, Button } from '../../../src/components/ui';
import { colors, spacing, fontSize, fontWeight } from '../../../src/theme';

export default function EventDetailScreen() {
  const { id } = useLocalSearchParams();
  const { currentEvent, fetchEvent, isLoading: eventLoading } = useEventStore();
  const { createReport, isLoading: reportLoading } = useReportStore();
  const router = useRouter();

  useEffect(() => {
    if (id) fetchEvent(id as string);
  }, [id]);

  const handleCreateReport = async () => {
    if (!currentEvent) return;
    try {
      const reportId = await createReport(currentEvent._id);
      router.push(`/(user)/reports/${reportId}` as any);
    } catch (error) {
      // Error is logged by store
    }
  };

  if (eventLoading || !currentEvent) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: spacing.lg }}>
      <Card style={styles.mainCard}>
        <Text style={styles.type}>{currentEvent.type}</Text>
        <Text style={styles.name}>{currentEvent.name}</Text>
        <Text style={styles.dept}>{currentEvent.department}</Text>
        
        <View style={styles.divider} />
        
        <View style={styles.infoRow}>
          <Ionicons name="calendar" size={20} color={colors.primary} />
          <Text style={styles.infoText}>{new Date(currentEvent.date).toLocaleDateString()}</Text>
        </View>
        <View style={styles.infoRow}>
          <Ionicons name="location" size={20} color={colors.primary} />
          <Text style={styles.infoText}>{currentEvent.venue}</Text>
        </View>
        <View style={styles.infoRow}>
          <Ionicons name="person" size={20} color={colors.primary} />
          <Text style={styles.infoText}>Convener: {currentEvent.convener}</Text>
        </View>
      </Card>

      <Button 
        title="Create Report" 
        onPress={handleCreateReport} 
        loading={reportLoading}
        icon={<Ionicons name="document-text" size={20} color="#fff" />}
        style={{ marginTop: spacing.xl }}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  centered: { justifyContent: 'center', alignItems: 'center' },
  mainCard: { padding: spacing.xl },
  type: { fontSize: fontSize.sm, color: colors.primaryLight, fontWeight: fontWeight.bold, marginBottom: spacing.xs, textTransform: 'uppercase' },
  name: { fontSize: fontSize.xxl, fontWeight: fontWeight.bold, color: colors.text, marginBottom: 2 },
  dept: { fontSize: fontSize.md, color: colors.textSecondary, marginBottom: spacing.lg },
  divider: { height: 1, backgroundColor: colors.border, marginVertical: spacing.md },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.md },
  infoText: { fontSize: fontSize.md, color: colors.text },
});
