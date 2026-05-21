import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useEventStore } from '../../../src/stores/eventStore';
import { useReportStore } from '../../../src/stores/reportStore';
import { reportApi } from '../../../src/services';
import { Card, Button, SafetyModal } from '../../../src/components/ui';
import { colors, spacing, fontSize, fontWeight, borderRadius } from '../../../src/theme';

export default function EventDetailScreen() {
  const { id } = useLocalSearchParams();
  const { currentEvent, fetchEvent, isLoading: eventLoading } = useEventStore();
  const { createReport, deleteReport, isLoading: reportLoading } = useReportStore();
  const [existingReport, setExistingReport] = useState<any>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const router = useRouter();

  const checkExistingReport = async () => {
    try {
      const { data } = await reportApi.getAll({ eventId: id });
      if (data.data.reports && data.data.reports.length > 0) {
        setExistingReport(data.data.reports[0]);
      } else {
        setExistingReport(null);
      }
    } catch (error) {
      console.error('Failed to check existing report:', error);
    }
  };

  useEffect(() => {
    if (id) {
      fetchEvent(id as string);
      checkExistingReport();
    }
  }, [id]);

  const handleCreateReport = async () => {
    if (!currentEvent) return;
    router.push(`/(user)/create-report?eventId=${currentEvent._id}` as any);
  };

  const getStatusColor = (status: string) => {
    switch (status?.toUpperCase()) {
      case 'APPROVED':
        return colors.success;
      case 'SUBMITTED':
        return colors.secondary;
      case 'REJECTED':
        return colors.error;
      case 'DRAFT':
      default:
        return colors.warning;
    }
  };

  if (eventLoading || !currentEvent) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  // Determine current step index for the lifecycle progress tracker
  const steps = ['Assigned', 'Active', 'Draft', 'Submitted', 'Approved'];
  let currentStepIndex = 0;
  if (existingReport) {
    if (existingReport.status === 'APPROVED') {
      currentStepIndex = 4;
    } else if (existingReport.status === 'SUBMITTED') {
      currentStepIndex = 3;
    } else {
      currentStepIndex = 2; // DRAFT or REJECTED
    }
  } else if (currentEvent.status === 'ACTIVE' || currentEvent.status === 'COMPLETED') {
    currentStepIndex = 1;
  } else {
    currentStepIndex = 0;
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: spacing.lg }}>
      {/* Progress Roadmap Tracker */}
      <View style={styles.progressContainer}>
        <Text style={styles.progressTitle}>Event Progress Roadmap</Text>
        <View style={styles.stepsWrapper}>
          {steps.map((step, idx) => {
            const isCompleted = idx < currentStepIndex;
            const isActive = idx === currentStepIndex;

            let nodeColor = colors.border;
            let textColor = colors.textMuted;
            if (isCompleted) {
              nodeColor = colors.success;
              textColor = colors.success;
            } else if (isActive) {
              nodeColor = colors.primaryLight;
              textColor = colors.primaryLight;
            }

            return (
              <View key={step} style={{ flexDirection: 'row', alignItems: 'center', flex: idx === 0 ? 0 : 1 }}>
                {idx > 0 && (
                  <View 
                    style={{ 
                      flex: 1, 
                      height: 2, 
                      backgroundColor: idx <= currentStepIndex ? colors.success : colors.border,
                      marginHorizontal: -2 
                    }} 
                  />
                )}
                <View style={styles.stepNodeContainer}>
                  <View 
                    style={[
                      styles.stepNode, 
                      { 
                        borderColor: nodeColor, 
                        backgroundColor: isActive ? colors.primary : isCompleted ? colors.success : colors.bgCard 
                      }
                    ]}
                  >
                    {isCompleted ? (
                      <Ionicons name="checkmark" size={12} color="#fff" />
                    ) : (
                      <Text style={[styles.stepNumber, { color: isActive ? '#fff' : colors.textMuted }]}>
                        {idx + 1}
                      </Text>
                    )}
                  </View>
                  <Text style={[styles.stepLabel, { color: textColor, fontWeight: isActive || isCompleted ? fontWeight.semibold : fontWeight.regular }]}>
                    {step}
                  </Text>
                </View>
              </View>
            );
          })}
        </View>
      </View>

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

      {/* Report Actions / Creation Section */}
      {existingReport ? (
        <Card style={styles.reportStatusCard}>
          <View style={styles.reportStatusHeader}>
            <View style={styles.documentIconContainer}>
              <Ionicons name="document-text" size={24} color={colors.primaryLight} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.reportStatusTitle}>Your Event Report</Text>
              <View style={styles.statusBadgeRow}>
                <View style={[styles.statusDot, { backgroundColor: getStatusColor(existingReport.status) }]} />
                <Text style={[styles.reportBadge, { color: getStatusColor(existingReport.status) }]}>
                  {existingReport.status}
                </Text>
              </View>
            </View>
          </View>
          
          <View style={styles.reportActionsRow}>
            <Button 
              title="Edit Report" 
              onPress={() => router.push(`/(user)/create-report?eventId=${currentEvent._id}&reportId=${existingReport._id}` as any)}
              style={styles.reportActionBtn}
              icon={<Ionicons name="create-outline" size={16} color="#fff" />}
            />
            <Button 
              title="Recreate" 
              variant="outline"
              onPress={() => setShowDeleteModal(true)}
              style={styles.recreateBtn}
              textStyle={{ color: colors.error }}
              icon={<Ionicons name="trash-outline" size={16} color={colors.error} />}
            />
          </View>
        </Card>
      ) : (
        <Button 
          title="Create Report" 
          onPress={handleCreateReport} 
          loading={reportLoading}
          icon={<Ionicons name="document-text" size={20} color="#fff" />}
          style={{ marginTop: spacing.xl }}
        />
      )}

      {currentEvent.subEvents && currentEvent.subEvents.length > 0 && (
        <View style={styles.subEventsSection}>
          <Text style={styles.sectionTitle}>Sub-events</Text>
          {currentEvent.subEvents.map((subEvent: any) => (
            <Card 
              key={subEvent._id} 
              style={styles.subEventCard} 
              onPress={() => router.push(`/(user)/events/${subEvent._id}` as any)}
            >
              <View style={styles.subEventHeader}>
                <Ionicons name="calendar-outline" size={18} color={colors.primary} />
                <Text style={styles.subEventName}>{subEvent.name}</Text>
              </View>
              <Text style={styles.subEventDetails}>
                {new Date(subEvent.date).toLocaleDateString()} • {subEvent.venue}
              </Text>
            </Card>
          ))}
        </View>
      )}

      {/* Safety confirmation modal for deleting and recreating reports */}
      <SafetyModal
        visible={showDeleteModal}
        title="Delete & Recreate Report"
        description="Are you sure you want to delete this report? This will permanently delete all draft progress, paragraphs, budgets, and uploaded images. This action cannot be undone."
        expectedText="DELETE"
        confirmText="Delete & Recreate"
        cancelText="Keep Report"
        isConfirming={isDeleting}
        onConfirm={async () => {
          setIsDeleting(true);
          try {
            await deleteReport(existingReport._id);
            setExistingReport(null);
            setShowDeleteModal(false);
            router.push(`/(user)/create-report?eventId=${currentEvent._id}` as any);
          } catch (error) {
            Alert.alert('Error', 'Failed to delete report.');
          } finally {
            setIsDeleting(false);
          }
        }}
        onCancel={() => setShowDeleteModal(false)}
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
  
  // Progress tracker styles
  progressContainer: {
    backgroundColor: colors.bgCard,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  progressTitle: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.textSecondary,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  stepsWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  stepNodeContainer: {
    alignItems: 'center',
    width: 50,
  },
  stepNode: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  stepNumber: {
    fontSize: fontSize.xs - 1,
    fontWeight: fontWeight.bold,
  },
  stepLabel: {
    fontSize: 9,
    textAlign: 'center',
  },

  // Report status card styles
  reportStatusCard: {
    marginTop: spacing.xl,
    padding: spacing.md,
    borderColor: colors.borderLight,
    borderWidth: 1,
  },
  reportStatusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  documentIconContainer: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  reportStatusTitle: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.text,
  },
  statusBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  reportBadge: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
    textTransform: 'uppercase',
  },
  reportActionsRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  reportActionBtn: {
    flex: 2,
  },
  recreateBtn: {
    flex: 1,
    borderColor: colors.error + '50',
  },

  subEventsSection: {
    marginTop: spacing.xl,
  },
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.text,
    marginBottom: spacing.md,
  },
  subEventCard: {
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  subEventHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: 4,
  },
  subEventName: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.text,
  },
  subEventDetails: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginLeft: 22,
  },
});
