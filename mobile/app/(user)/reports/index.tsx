import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl, TextInput, TouchableOpacity, ScrollView, Modal, ActivityIndicator, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useReportStore } from '../../../src/stores/reportStore';
import { useAuthStore } from '../../../src/stores/authStore';
import { Card } from '../../../src/components/ui';
import { colors, spacing, fontSize, fontWeight, borderRadius } from '../../../src/theme';
import { openPdfPreview, downloadAndSharePdf } from '../../../src/utils/pdfHelper';

export default function ReportsScreen() {
  const { reports, fetchReports, isLoading, submitReport, generatePdf } = useReportStore();
  const { user } = useAuthStore();
  const router = useRouter();

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('ALL');

  // Modal State
  const [selectedReport, setSelectedReport] = useState<any>(null);
  const [isOptionsVisible, setIsOptionsVisible] = useState(false);
  const [isPdfLoading, setIsPdfLoading] = useState(false);
  const [isSubmittingReport, setIsSubmittingReport] = useState(false);

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

  const handlePreview = async (report: any) => {
    if (!report) return;
    setIsPdfLoading(true);
    try {
      const url = await generatePdf(report._id);
      await openPdfPreview(url);
    } catch (err: any) {
      Alert.alert('Preview Failed', err.message || 'Could not generate report preview.');
    } finally {
      setIsPdfLoading(false);
    }
  };

  const handleDownload = async (report: any) => {
    if (!report) return;
    setIsPdfLoading(true);
    try {
      const url = await generatePdf(report._id);
      await downloadAndSharePdf(url, `report-${report._id}.pdf`);
    } catch (err: any) {
      Alert.alert('Download Failed', err.message || 'Could not download report.');
    } finally {
      setIsPdfLoading(false);
    }
  };

  const handleSubmitReport = async (report: any) => {
    if (!report) return;
    setIsSubmittingReport(true);
    try {
      await submitReport(report._id);
      await fetchReports({ userId: user?._id });
      setIsOptionsVisible(false);
      setSelectedReport(null);
      Alert.alert('Success', 'Report submitted successfully.');
    } catch (err: any) {
      Alert.alert('Submission Failed', err.message || 'Could not submit report.');
    } finally {
      setIsSubmittingReport(false);
    }
  };

  const handleEditReport = (report: any) => {
    setIsOptionsVisible(false);
    router.push(`/(user)/create-report?eventId=${report.event?._id || report.event}&reportId=${report._id}` as any);
  };

  const filteredReports = reports.filter((report) => {
    const matchesSearch = report.event?.name?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = selectedStatus === 'ALL' || report.status === selectedStatus;
    return matchesSearch && matchesStatus;
  });

  return (
    <View style={styles.container}>
      {/* Search Input */}
      <View style={styles.headerFiltersContainer}>
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={18} color={colors.textMuted} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search reports by event name..."
            placeholderTextColor={colors.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCorrect={false}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearSearchBtn}>
              <Ionicons name="close-circle" size={18} color={colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>

        {/* Status Filter Chips */}
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false} 
          style={styles.filterChipsScroll}
          contentContainerStyle={styles.filterChipsContainer}
        >
          {['ALL', 'DRAFT', 'SUBMITTED', 'APPROVED', 'REJECTED'].map((status) => (
            <TouchableOpacity
              key={status}
              onPress={() => setSelectedStatus(status)}
              style={[
                styles.filterChip,
                selectedStatus === status && styles.filterChipActive
              ]}
            >
              <Text 
                style={[
                  styles.filterChipText,
                  selectedStatus === status && styles.filterChipTextActive
                ]}
              >
                {status}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <FlatList
        data={filteredReports}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={() => fetchReports({ userId: user?._id })} tintColor={colors.primary} />}
        renderItem={({ item }) => (
          <Card 
            style={styles.card} 
            onPress={() => {
              setSelectedReport(item);
              setIsOptionsVisible(true);
            }}
          >
            <View style={styles.header}>
              <View style={[styles.badge, { backgroundColor: getStatusColor(item.status) + '20' }]}>
                <Text style={[styles.badgeText, { color: getStatusColor(item.status) }]}>{item.status}</Text>
              </View>
              <Text style={styles.dateText}>{item.createdAt ? new Date(item.createdAt).toLocaleDateString() : 'Unknown date'}</Text>
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
        ListEmptyComponent={!isLoading ? <Text style={styles.emptyText}>No reports found</Text> : null}
      />

      {/* Options Menu Modal */}
      <Modal
        visible={isOptionsVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsOptionsVisible(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => {
            if (!isPdfLoading && !isSubmittingReport) {
              setIsOptionsVisible(false);
            }
          }}
        >
          <View style={styles.modalContainer}>
            <Card style={styles.modalCard}>
              {/* Header */}
              <View style={styles.modalHeader}>
                <View style={styles.modalTitleRow}>
                  <Text style={styles.modalTitle} numberOfLines={1}>
                    {selectedReport?.event?.name || 'Report Options'}
                  </Text>
                  {selectedReport && (
                    <View style={[styles.badge, { backgroundColor: getStatusColor(selectedReport.status) + '20', marginLeft: spacing.sm }]}>
                      <Text style={[styles.badgeText, { color: getStatusColor(selectedReport.status) }]}>
                        {selectedReport.status}
                      </Text>
                    </View>
                  )}
                </View>
                <TouchableOpacity 
                  onPress={() => setIsOptionsVisible(false)} 
                  style={styles.closeBtn}
                  disabled={isPdfLoading || isSubmittingReport}
                >
                  <Ionicons name="close" size={24} color={colors.text} />
                </TouchableOpacity>
              </View>

              {/* Option Actions List */}
              <View style={styles.modalOptionsContainer}>
                {/* 1. Preview Option */}
                <TouchableOpacity 
                  style={[styles.optionItem, (isPdfLoading || isSubmittingReport) && styles.optionItemDisabled]}
                  onPress={() => handlePreview(selectedReport)}
                  disabled={isPdfLoading || isSubmittingReport}
                >
                  <View style={[styles.optionIconContainer, { backgroundColor: colors.info + '15' }]}>
                    {isPdfLoading ? (
                      <ActivityIndicator size="small" color={colors.info} />
                    ) : (
                      <Ionicons name="eye-outline" size={20} color={colors.info} />
                    )}
                  </View>
                  <Text style={styles.optionText}>Preview Report</Text>
                </TouchableOpacity>

                {/* 2 & 3. Edit & Submit Options (Only for DRAFT or REJECTED) */}
                {(selectedReport?.status === 'DRAFT' || selectedReport?.status === 'REJECTED') && (
                  <>
                    <TouchableOpacity 
                      style={[styles.optionItem, (isPdfLoading || isSubmittingReport) && styles.optionItemDisabled]}
                      onPress={() => handleEditReport(selectedReport)}
                      disabled={isPdfLoading || isSubmittingReport}
                    >
                      <View style={[styles.optionIconContainer, { backgroundColor: colors.primary + '15' }]}>
                        <Ionicons name="create-outline" size={20} color={colors.primaryLight} />
                      </View>
                      <Text style={styles.optionText}>Edit Report</Text>
                    </TouchableOpacity>

                    <TouchableOpacity 
                      style={[styles.optionItem, (isPdfLoading || isSubmittingReport) && styles.optionItemDisabled]}
                      onPress={() => handleSubmitReport(selectedReport)}
                      disabled={isPdfLoading || isSubmittingReport}
                    >
                      <View style={[styles.optionIconContainer, { backgroundColor: colors.success + '15' }]}>
                        {isSubmittingReport ? (
                          <ActivityIndicator size="small" color={colors.success} />
                        ) : (
                          <Ionicons name="checkmark-circle-outline" size={20} color={colors.success} />
                        )}
                      </View>
                      <Text style={styles.optionText}>Submit Report</Text>
                    </TouchableOpacity>
                  </>
                )}

                {/* 4. Download Option (Only for APPROVED) */}
                {selectedReport?.status === 'APPROVED' && (
                  <TouchableOpacity 
                    style={[styles.optionItem, (isPdfLoading || isSubmittingReport) && styles.optionItemDisabled]}
                    onPress={() => handleDownload(selectedReport)}
                    disabled={isPdfLoading || isSubmittingReport}
                  >
                    <View style={[styles.optionIconContainer, { backgroundColor: colors.success + '15' }]}>
                      {isPdfLoading ? (
                        <ActivityIndicator size="small" color={colors.success} />
                      ) : (
                        <Ionicons name="download-outline" size={20} color={colors.success} />
                      )}
                    </View>
                    <Text style={styles.optionText}>Download Report</Text>
                  </TouchableOpacity>
                )}
              </View>
            </Card>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  headerFiltersContainer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgInput,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
  },
  searchIcon: {
    marginRight: spacing.sm,
  },
  searchInput: {
    flex: 1,
    color: colors.text,
    fontSize: fontSize.sm,
    paddingVertical: spacing.sm,
  },
  clearSearchBtn: {
    padding: spacing.xs,
  },
  filterChipsScroll: {
    marginBottom: spacing.md,
  },
  filterChipsContainer: {
    gap: spacing.xs,
    paddingRight: spacing.md,
  },
  filterChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.bgCard,
  },
  filterChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterChipText: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    fontWeight: fontWeight.medium,
  },
  filterChipTextActive: {
    color: '#FFF',
    fontWeight: fontWeight.bold,
  },
  list: { paddingHorizontal: spacing.lg, paddingBottom: spacing.lg },
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

  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    width: '100%',
  },
  modalCard: {
    borderTopLeftRadius: borderRadius.lg,
    borderTopRightRadius: borderRadius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.bgCard,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingBottom: spacing.sm,
  },
  modalTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: spacing.md,
  },
  modalTitle: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: colors.text,
    flexShrink: 1,
  },
  closeBtn: {
    padding: spacing.xs,
  },
  modalOptionsContainer: {
    marginTop: spacing.xs,
    gap: spacing.sm,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgInput,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  optionItemDisabled: {
    opacity: 0.5,
  },
  optionIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  optionText: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.text,
  },
});
