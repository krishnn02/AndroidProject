import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Linking from 'expo-linking';
import { useReportStore } from '../../../../src/stores/reportStore';
import { Card, Button } from '../../../../src/components/ui';
import { colors, spacing, fontSize, fontWeight } from '../../../../src/theme';

export default function ReportBuilderScreen() {
  const { id } = useLocalSearchParams();
  const { currentReport, fetchReport, isLoading, submitReport, generatePdf, isSaving } = useReportStore();
  const router = useRouter();

  useEffect(() => {
    if (id) fetchReport(id as string);
  }, [id]);

  const handleSubmit = () => {
    Alert.alert('Submit Report', 'Are you sure you want to submit this report for approval?', [
      { text: 'Cancel', style: 'cancel' },
      { 
        text: 'Submit', 
        onPress: async () => {
          try {
            await submitReport(id as string);
            Alert.alert('Success', 'Report submitted successfully');
          } catch {}
        }
      }
    ]);
  };

  const handleGeneratePdf = async () => {
    try {
      const url = await generatePdf(id as string);
      if (url) Linking.openURL(url);
    } catch {}
  };

  if (isLoading || !currentReport) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const isEditable = currentReport.status === 'DRAFT' || currentReport.status === 'REJECTED';

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: spacing.lg }}>
      <Card style={styles.headerCard}>
        <Text style={styles.status}>Status: {currentReport.status}</Text>
        <Text style={styles.title}>{currentReport.event?.name}</Text>
        {currentReport.rejectionNote && (
          <View style={styles.rejectionBox}>
            <Text style={styles.rejectionText}>Reason for rejection: {currentReport.rejectionNote}</Text>
          </View>
        )}
      </Card>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Builder Tools</Text>
        
        <Card style={styles.toolCard} onPress={() => router.push(`/(user)/reports/${id}/front-page`)}>
          <Ionicons name="image-outline" size={24} color={colors.primary} />
          <Text style={styles.toolText}>Front Page & Logos</Text>
        </Card>

        <Card style={styles.toolCard} onPress={() => router.push(`/(user)/reports/${id}/sections`)}>
          <Ionicons name="list-outline" size={24} color={colors.primary} />
          <Text style={styles.toolText}>Manage Sections ({currentReport.sections?.length || 0})</Text>
        </Card>

        <Card style={styles.toolCard} onPress={() => router.push(`/(user)/reports/${id}/budget`)}>
          <Ionicons name="cash-outline" size={24} color={colors.primary} />
          <Text style={styles.toolText}>Budget Summary ({currentReport.budgets?.length || 0})</Text>
        </Card>
      </View>

      <View style={styles.actions}>
        <Button 
          title="Preview PDF" 
          variant="outline" 
          icon={<Ionicons name="eye-outline" size={20} color={colors.primary} />}
          onPress={handleGeneratePdf}
          loading={isSaving}
          style={{ marginBottom: spacing.md }}
        />
        
        {isEditable && (
          <Button 
            title="Submit for Approval" 
            icon={<Ionicons name="checkmark-circle-outline" size={20} color="#fff" />}
            onPress={handleSubmit}
          />
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  centered: { justifyContent: 'center', alignItems: 'center' },
  headerCard: { padding: spacing.xl, marginBottom: spacing.xl },
  status: { fontSize: fontSize.sm, color: colors.primaryLight, fontWeight: fontWeight.bold, marginBottom: spacing.xs },
  title: { fontSize: fontSize.xl, fontWeight: fontWeight.bold, color: colors.text },
  rejectionBox: { marginTop: spacing.md, padding: spacing.sm, backgroundColor: colors.error + '20', borderRadius: 8 },
  rejectionText: { color: colors.error, fontSize: fontSize.sm },
  section: { marginBottom: spacing.xl },
  sectionTitle: { fontSize: fontSize.lg, fontWeight: fontWeight.bold, color: colors.text, marginBottom: spacing.md },
  toolCard: { flexDirection: 'row', alignItems: 'center', padding: spacing.md, marginBottom: spacing.sm, gap: spacing.md },
  toolText: { fontSize: fontSize.md, fontWeight: fontWeight.medium, color: colors.text },
  actions: { marginTop: spacing.lg },
});
