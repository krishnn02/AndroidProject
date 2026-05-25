import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { reportApi } from '../../src/services';
import { useReportStore } from '../../src/stores/reportStore';
import { Card, Button } from '../../src/components/ui';
import { colors, spacing, fontSize, fontWeight, borderRadius } from '../../src/theme';
import { downloadAndSharePdf } from '../../src/utils/pdfHelper';

export default function AdminReportsScreen() {
  const [reports, setReports] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState('ALL'); // ALL, SUBMITTED, APPROVED, REJECTED
  
  const { approveReport, rejectReport, generatePdf, generateDocx } = useReportStore();

  const loadReports = async () => {
    setIsLoading(true);
    try {
      const { data } = await reportApi.getAll({ limit: 100 });
      setReports(data.data.reports || []);
    } catch (error) {
      console.error('Failed to load reports:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadReports();
  }, []);

  const handleApprove = async (id: string) => {
    Alert.alert('Approve Report', 'Are you sure you want to approve this report?', [
      { text: 'Cancel', style: 'cancel' },
      { 
        text: 'Approve', 
        style: 'default',
        onPress: async () => {
          try {
            await approveReport(id);
            Alert.alert('Success', 'Report approved successfully');
            loadReports();
          } catch (e: any) {
            Alert.alert('Error', e.message || 'Failed to approve');
          }
        }
      }
    ]);
  };

  const handleReject = async (id: string) => {
    Alert.prompt('Reject Report', 'Please enter a reason for rejection:', [
      { text: 'Cancel', style: 'cancel' },
      { 
        text: 'Reject', 
        style: 'destructive',
        onPress: async (note?: string) => {
          try {
            await rejectReport(id, note || 'No reason provided');
            Alert.alert('Success', 'Report rejected successfully');
            loadReports();
          } catch (e: any) {
            Alert.alert('Error', e.message || 'Failed to reject');
          }
        }
      }
    ]);
  };

  const handleViewPdf = async (report: any) => {
    try {
      Alert.alert(
        'Report Options',
        'Choose how you want to access the report.',
        [

          {
            text: 'Download PDF',
            onPress: async () => {
              try {
                let url = report.pdfUrl;
                if (!url) {
                  url = await generatePdf(report._id);
                }
                if (url) {
                  downloadAndSharePdf(url, `report-${report._id}.pdf`);
                } else {
                  Alert.alert('Error', 'Failed to generate PDF for this report.');
                }
              } catch (e: any) {
                Alert.alert('Error', 'Failed to download PDF: ' + (e.message || e));
              }
            }
          },
          {
            text: 'Download Word (DOCX)',
            onPress: async () => {
              try {
                const url = await generateDocx(report._id);
                if (url) {
                  downloadAndSharePdf(url, `report-${report._id}.docx`);
                } else {
                  Alert.alert('Error', 'Failed to generate Word document for this report.');
                }
              } catch (e: any) {
                Alert.alert('Error', 'Failed to generate Word document: ' + (e.message || e));
              }
            }
          },
          { text: 'Cancel', style: 'cancel' }
        ]
      );
    } catch (error: any) {
      Alert.alert('Error', 'Failed to open options: ' + (error.message || error));
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'APPROVED': return colors.success;
      case 'REJECTED': return colors.error;
      case 'SUBMITTED': return colors.warning;
      case 'DRAFT': return colors.textSecondary;
      default: return colors.textMuted;
    }
  };

  const filteredReports = reports.filter(r => filter === 'ALL' || r.status === filter);

  return (
    <View style={styles.container}>
      <View style={styles.filterTabs}>
        {['ALL', 'SUBMITTED', 'APPROVED', 'REJECTED'].map((f) => (
          <Button 
            key={f}
            title={f} 
            variant={filter === f ? 'primary' : 'outline'} 
            size="sm" 
            style={styles.filterBtn}
            onPress={() => setFilter(f)}
          />
        ))}
      </View>

      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={loadReports} tintColor={colors.primary} />}
      >
        {filteredReports.map((report) => (
          <Card key={report._id} style={styles.reportCard}>
            <View style={styles.reportHeader}>
              <Text style={styles.eventName} numberOfLines={2}>{report.event?.name}</Text>
              <View style={[styles.statusBadge, { backgroundColor: getStatusColor(report.status) + '20' }]}>
                <Text style={[styles.statusText, { color: getStatusColor(report.status) }]}>{report.status}</Text>
              </View>
            </View>
            
            <View style={styles.authorRow}>
              <Ionicons name="person-circle-outline" size={16} color={colors.textSecondary} />
              <Text style={styles.authorText}>{report.createdBy?.name} • {report.createdBy?.department}</Text>
            </View>

            <View style={styles.dateRow}>
              <Ionicons name="time-outline" size={16} color={colors.textSecondary} />
              <Text style={styles.dateText}>
                {report.submittedAt ? `Submitted: ${new Date(report.submittedAt).toLocaleDateString()}` : 'Not submitted'}
              </Text>
            </View>

            <View style={styles.actionsRow}>
              <Button variant="outline" size="sm" title="Options" onPress={() => handleViewPdf(report)} style={styles.actionBtn} icon={<Ionicons name="document-text-outline" size={16} color={colors.primary} />} />
              {report.status === 'SUBMITTED' && (
                <>
                  <Button variant="outline" size="sm" title="Reject" onPress={() => handleReject(report._id)} style={[styles.actionBtn, { borderColor: colors.error }]} />
                  <Button variant="primary" size="sm" title="Approve" onPress={() => handleApprove(report._id)} style={[styles.actionBtn, { backgroundColor: colors.success }]} />
                </>
              )}
            </View>
          </Card>
        ))}

        {filteredReports.length === 0 && !isLoading && (
          <Text style={styles.emptyText}>No reports found for this filter.</Text>
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
  filterTabs: {
    flexDirection: 'row',
    padding: spacing.md,
    backgroundColor: colors.bgCard,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: spacing.sm,
  },
  filterBtn: {
    flex: 1,
    paddingHorizontal: 0,
  },
  scrollContent: {
    padding: spacing.lg,
  },
  reportCard: {
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  reportHeader: {
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
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  authorText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginLeft: spacing.xs,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  dateText: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    marginLeft: spacing.xs,
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
