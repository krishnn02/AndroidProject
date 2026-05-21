import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  RefreshControl, 
  Modal, 
  TouchableOpacity, 
  Alert, 
  ActivityIndicator, 
  Image,
  TextInput,
  Platform,
  KeyboardAvoidingView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../src/stores/authStore';
import { analyticsApi, reportApi, userApi } from '../../src/services';
import { Card, StatCard, Button, Input } from '../../src/components/ui';
import { colors, spacing, fontSize, fontWeight, borderRadius, shadows } from '../../src/theme';

export default function AdminDashboardScreen() {
  const { user, logout, updateUser } = useAuthStore();
  const [overview, setOverview] = useState<any>(null);
  const [recentReports, setRecentReports] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Profile Modal State
  const [isProfileVisible, setIsProfileVisible] = useState(false);
  const [profileName, setProfileName] = useState('');
  const [profileEmail, setProfileEmail] = useState('');
  const [profilePhone, setProfilePhone] = useState('');
  const [profilePassword, setProfilePassword] = useState('');
  const [profileDepartment, setProfileDepartment] = useState('');
  const [profileCollege, setProfileCollege] = useState('');
  const [isProfileSaving, setIsProfileSaving] = useState(false);
  const [profileError, setProfileError] = useState('');

  // Report Modal State
  const [selectedReport, setSelectedReport] = useState<any>(null);
  const [isReportModalVisible, setIsReportModalVisible] = useState(false);
  const [isReportLoading, setIsReportLoading] = useState(false);
  const [rejectionNote, setRejectionNote] = useState('');
  const [isRejecting, setIsRejecting] = useState(false);
  const [isActioning, setIsActioning] = useState(false);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [overviewRes, reportsRes] = await Promise.all([
        analyticsApi.getOverview(),
        reportApi.getAll({ limit: 5 })
      ]);
      
      setOverview(overviewRes.data.data);
      setRecentReports(reportsRes.data.data.reports || []);
    } catch (error) {
      console.error('Failed to load admin dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openProfile = () => {
    if (user) {
      setProfileName(user.name || '');
      setProfileEmail(user.email || '');
      setProfilePhone(user.phone || '');
      setProfilePassword('');
      setProfileDepartment(user.department || '');
      setProfileCollege(user.college || '');
      setProfileError('');
      setIsProfileVisible(true);
    }
  };

  const handleSaveProfile = async () => {
    if (!profileName.trim() || !profileEmail.trim() || !profileDepartment.trim()) {
      setProfileError('Please fill in Name, Email and Department.');
      return;
    }
    setIsProfileSaving(true);
    setProfileError('');
    try {
      const payload: any = {
        name: profileName.trim(),
        email: profileEmail.trim().toLowerCase(),
        phone: profilePhone.trim(),
        department: profileDepartment.trim(),
        college: profileCollege.trim(),
      };
      if (profilePassword.trim()) {
        payload.password = profilePassword.trim();
      }
      const { data } = await userApi.update(user!._id, payload);
      const updatedUser = data.data.user;
      
      updateUser(updatedUser);
      setIsProfileVisible(false);
      Alert.alert('Success', 'Profile updated successfully.');
    } catch (err: any) {
      setProfileError(err.response?.data?.message || 'Failed to update profile.');
    } finally {
      setIsProfileSaving(false);
    }
  };

  const handleReportClick = async (reportId: string) => {
    setIsReportLoading(true);
    setIsReportModalVisible(true);
    setRejectionNote('');
    setIsRejecting(false);
    try {
      const { data } = await reportApi.getById(reportId);
      setSelectedReport(data.data.report || data.data);
    } catch (err) {
      console.error('Failed to load report details:', err);
      Alert.alert('Error', 'Failed to load report details.');
      setIsReportModalVisible(false);
    } finally {
      setIsReportLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!selectedReport) return;
    setIsActioning(true);
    try {
      await reportApi.approve(selectedReport._id);
      Alert.alert('Approved', 'Report has been approved successfully.');
      setIsReportModalVisible(false);
      loadData();
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to approve report.');
    } finally {
      setIsActioning(false);
    }
  };

  const handleReject = async () => {
    if (!selectedReport) return;
    if (!rejectionNote.trim()) {
      Alert.alert('Error', 'Please enter a rejection reason.');
      return;
    }
    setIsActioning(true);
    try {
      await reportApi.reject(selectedReport._id, rejectionNote.trim());
      Alert.alert('Rejected', 'Report has been rejected.');
      setIsReportModalVisible(false);
      loadData();
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to reject report.');
    } finally {
      setIsActioning(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'APPROVED': return colors.success;
      case 'REJECTED': return colors.error;
      case 'SUBMITTED': return colors.warning;
      default: return colors.textMuted;
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView 
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={loadData} tintColor={colors.primary} />}
      >
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Admin Portal</Text>
            <Text style={styles.dept}>Welcome back, {user?.name.split(' ')[0]}</Text>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity onPress={openProfile} style={styles.profileIconBtn}>
              <Ionicons name="person-circle-outline" size={32} color={colors.primaryLight} />
            </TouchableOpacity>
            <Button variant="ghost" icon={<Ionicons name="log-out-outline" size={24} color={colors.error} />} onPress={logout} title="" />
          </View>
        </View>

        <View style={styles.statsGrid}>
          <StatCard 
            title="Total Users" 
            value={overview?.totalUsers || 0} 
            icon={<Ionicons name="people" size={24} color={colors.primary} />} 
            style={styles.statCard}
          />
          <StatCard 
            title="Active Events" 
            value={overview?.activeEvents || 0} 
            icon={<Ionicons name="calendar" size={24} color={colors.success} />} 
            style={styles.statCard}
            color={colors.success}
          />
          <StatCard 
            title="Pending Reports" 
            value={overview?.pendingReports || 0} 
            icon={<Ionicons name="time" size={24} color={colors.warning} />} 
            style={styles.statCard}
            color={colors.warning}
          />
          <StatCard 
            title="Approved" 
            value={overview?.approvedReports || 0} 
            icon={<Ionicons name="checkmark-circle" size={24} color={colors.secondary} />} 
            style={styles.statCard}
            color={colors.secondary}
          />
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Report Submissions</Text>
          </View>

          {recentReports.map((report) => (
            <Card key={report._id} style={styles.reportCard} onPress={() => handleReportClick(report._id)}>
              <View style={styles.reportHeader}>
                <Text style={styles.eventName} numberOfLines={1}>{report.event?.name || 'Unknown Event'}</Text>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(report.status) + '20' }]}>
                  <Text style={[styles.statusText, { color: getStatusColor(report.status) }]}>{report.status}</Text>
                </View>
              </View>
              <Text style={styles.authorName}>By: {report.createdBy?.name} • {report.createdBy?.department}</Text>
              <Text style={styles.reportDate}>
                {report.submittedAt ? new Date(report.submittedAt).toLocaleDateString() : 'Not submitted yet'}
              </Text>
            </Card>
          ))}

          {recentReports.length === 0 && !isLoading && (
            <Text style={styles.emptyText}>No recent reports found.</Text>
          )}
        </View>
      </ScrollView>

      {/* Profile Edit Modal */}
      <Modal
        visible={isProfileVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsProfileVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView 
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.modalContainer}
          >
            <Card style={styles.modalCard}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Admin Profile</Text>
                <TouchableOpacity onPress={() => setIsProfileVisible(false)} style={styles.closeBtn}>
                  <Ionicons name="close" size={24} color={colors.text} />
                </TouchableOpacity>
              </View>

              {profileError ? (
                <View style={styles.errorBox}>
                  <Text style={styles.errorText}>{profileError}</Text>
                </View>
              ) : null}

              <ScrollView showsVerticalScrollIndicator={false} style={styles.modalForm}>
                <Input
                  label="Full Name"
                  placeholder="Enter full name"
                  value={profileName}
                  onChangeText={setProfileName}
                  icon="person-outline"
                />
                
                <Input
                  label="Email Address"
                  placeholder="Enter email address"
                  value={profileEmail}
                  onChangeText={setProfileEmail}
                  icon="mail-outline"
                  keyboardType="email-address"
                  autoCapitalize="none"
                />

                <Input
                  label="Phone / Mobile"
                  placeholder="Enter phone number"
                  value={profilePhone}
                  onChangeText={setProfilePhone}
                  icon="call-outline"
                  keyboardType="phone-pad"
                />

                <Input
                  label="Password (leave blank to keep unchanged)"
                  placeholder="Enter new password"
                  value={profilePassword}
                  onChangeText={setProfilePassword}
                  icon="lock-closed-outline"
                  secureTextEntry
                />

                <Input
                  label="Department"
                  placeholder="Enter department"
                  value={profileDepartment}
                  onChangeText={setProfileDepartment}
                  icon="business-outline"
                />

                <Input
                  label="College"
                  placeholder="Enter college"
                  value={profileCollege}
                  onChangeText={setProfileCollege}
                  icon="school-outline"
                />
                
                <View style={styles.modalActions}>
                  <Button
                    title="Cancel"
                    variant="outline"
                    onPress={() => setIsProfileVisible(false)}
                    style={styles.actionBtn}
                  />
                  <Button
                    title="Save"
                    onPress={handleSaveProfile}
                    loading={isProfileSaving}
                    style={styles.actionBtn}
                  />
                </View>
              </ScrollView>
            </Card>
          </KeyboardAvoidingView>
        </View>
      </Modal>

      {/* Report Detail Modal */}
      <Modal
        visible={isReportModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsReportModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContainer, { height: '85%', width: '95%', maxWidth: 500 }]}>
            <Card style={[styles.modalCard, { flex: 1, padding: spacing.md }]}>
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { flex: 1 }]} numberOfLines={1}>
                  {selectedReport?.event?.name || 'Report Detail'}
                </Text>
                <TouchableOpacity onPress={() => setIsReportModalVisible(false)} style={styles.closeBtn}>
                  <Ionicons name="close" size={24} color={colors.text} />
                </TouchableOpacity>
              </View>

              {isReportLoading ? (
                <View style={styles.centered}>
                  <ActivityIndicator size="large" color={colors.primary} />
                  <Text style={styles.loadingText}>Fetching report details...</Text>
                </View>
              ) : selectedReport ? (
                <View style={{ flex: 1 }}>
                  <ScrollView showsVerticalScrollIndicator={false} style={styles.reportDetailScroll}>
                    {/* Event Details Card */}
                    <View style={styles.detailSection}>
                      <Text style={styles.detailSectionTitle}>Report Information</Text>
                      <View style={styles.detailRowVal}>
                        <Text style={styles.detailLabel}>Author:</Text>
                        <Text style={styles.detailTextVal}>{selectedReport.createdBy?.name} ({selectedReport.createdBy?.department})</Text>
                      </View>
                      <View style={styles.detailRowVal}>
                        <Text style={styles.detailLabel}>Status:</Text>
                        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(selectedReport.status) + '20', alignSelf: 'flex-start' }]}>
                          <Text style={[styles.statusText, { color: getStatusColor(selectedReport.status) }]}>{selectedReport.status}</Text>
                        </View>
                      </View>
                      {selectedReport.rejectionNote ? (
                        <View style={[styles.detailRowVal, { backgroundColor: colors.error + '10', padding: spacing.sm, borderRadius: borderRadius.sm, marginTop: spacing.xs }]}>
                          <Text style={[styles.detailLabel, { color: colors.error }]}>Rejection Note:</Text>
                          <Text style={[styles.detailTextVal, { color: colors.error }]}>{selectedReport.rejectionNote}</Text>
                        </View>
                      ) : null}
                    </View>

                    {/* Sections */}
                    {selectedReport.sections && selectedReport.sections.length > 0 ? (
                      <View style={styles.detailSection}>
                        <Text style={styles.detailSectionTitle}>Content Sections</Text>
                        {selectedReport.sections.map((sec: any) => (
                          <View key={sec._id} style={styles.sectionBlock}>
                            <Text style={styles.blockHeading}>{sec.heading}</Text>
                            
                            {sec.content?.paragraphs?.map((p: string, pIdx: number) => (
                              <Text key={pIdx} style={styles.blockParagraph}>{p}</Text>
                            ))}
                            
                            {sec.content?.bullets?.map((b: string, bIdx: number) => (
                              <Text key={bIdx} style={styles.blockBullet}>• {b}</Text>
                            ))}

                            {sec.content?.richText ? (
                              <Text style={styles.blockRichText}>{sec.content.richText}</Text>
                            ) : null}

                            {/* Images inside section */}
                            {sec.images && sec.images.length > 0 ? (
                              <View style={styles.blockImagesGrid}>
                                {sec.images.map((img: any) => (
                                  <View key={img._id} style={styles.blockImageContainer}>
                                    <Image source={{ uri: img.url }} style={styles.blockImage} resizeMode="cover" />
                                    {img.caption ? (
                                      <Text style={styles.blockImageCaption}>{img.caption}</Text>
                                    ) : null}
                                  </View>
                                ))}
                              </View>
                            ) : null}
                          </View>
                        ))}
                      </View>
                    ) : null}

                    {/* Budgets */}
                    {selectedReport.budgets && selectedReport.budgets.length > 0 ? (
                      <View style={styles.detailSection}>
                        <Text style={styles.detailSectionTitle}>Budget Details</Text>
                        <View style={styles.budgetTable}>
                          <View style={[styles.budgetRow, styles.budgetHeader]}>
                            <Text style={[styles.budgetItem, styles.bold]}>Item</Text>
                            <Text style={[styles.budgetQty, styles.bold]}>Qty</Text>
                            <Text style={[styles.budgetCost, styles.bold]}>Cost</Text>
                            <Text style={[styles.budgetTotal, styles.bold]}>Total</Text>
                          </View>
                          {selectedReport.budgets.map((b: any) => (
                            <View key={b._id} style={styles.budgetRow}>
                              <Text style={styles.budgetItem} numberOfLines={1}>{b.item}</Text>
                              <Text style={styles.budgetQty}>{b.quantity}</Text>
                              <Text style={styles.budgetCost}>${b.unitCost}</Text>
                              <Text style={styles.budgetTotal}>${b.totalCost}</Text>
                            </View>
                          ))}
                        </View>
                      </View>
                    ) : null}
                  </ScrollView>

                  {/* Actions Bar */}
                  {selectedReport.status === 'SUBMITTED' ? (
                    <View style={styles.approvalActionsBar}>
                      {isRejecting ? (
                        <View style={styles.rejectionContainer}>
                          <Text style={styles.inputLabel}>Reason for Rejection</Text>
                          <TextInput
                            style={styles.textArea}
                            placeholder="Enter rejection reason..."
                            placeholderTextColor={colors.textMuted}
                            value={rejectionNote}
                            onChangeText={setRejectionNote}
                            multiline
                            numberOfLines={3}
                          />
                          <View style={styles.rejectionButtons}>
                            <Button 
                              title="Cancel" 
                              variant="outline" 
                              onPress={() => setIsRejecting(false)} 
                              style={styles.actionBtn}
                            />
                            <Button 
                              title="Reject Report" 
                              onPress={handleReject} 
                              loading={isActioning}
                              style={[styles.actionBtn, { backgroundColor: colors.error }]}
                            />
                          </View>
                        </View>
                      ) : (
                        <View style={styles.modalActions}>
                          <TouchableOpacity 
                            onPress={() => setIsRejecting(true)} 
                            style={[styles.circleActionBtn, { borderColor: colors.error }]}
                          >
                            <Ionicons name="close-circle" size={20} color={colors.error} />
                            <Text style={[styles.circleActionText, { color: colors.error }]}>Reject</Text>
                          </TouchableOpacity>

                          <TouchableOpacity 
                            onPress={handleApprove} 
                            style={[styles.circleActionBtn, { borderColor: colors.success, backgroundColor: colors.success + '15' }]}
                          >
                            <Ionicons name="checkmark-circle" size={20} color={colors.success} />
                            <Text style={[styles.circleActionText, { color: colors.success }]}>Approve</Text>
                          </TouchableOpacity>
                        </View>
                      )}
                    </View>
                  ) : null}
                </View>
              ) : null}
            </Card>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: spacing.lg,
    backgroundColor: colors.bg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xl,
    marginTop: Platform.OS === 'ios' ? 20 : 0,
  },
  greeting: {
    fontSize: fontSize.xxl,
    fontWeight: fontWeight.bold,
    color: colors.text,
  },
  dept: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  profileIconBtn: {
    padding: spacing.xs,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: spacing.xl,
    gap: spacing.md,
  },
  statCard: {
    width: '47%',
    marginBottom: spacing.sm,
  },
  section: {
    marginBottom: spacing.xxl,
  },
  sectionHeader: {
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.text,
  },
  reportCard: {
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  reportHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.xs,
  },
  eventName: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
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
  authorName: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  reportDate: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
  },
  emptyText: {
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.lg,
    fontStyle: 'italic',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.md,
  },
  modalContainer: {
    width: '100%',
    maxHeight: '90%',
  },
  modalCard: {
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
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
  modalTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.text,
  },
  closeBtn: {
    padding: spacing.xs,
  },
  modalForm: {
    maxHeight: 450,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  actionBtn: {
    flex: 1,
  },
  errorBox: {
    backgroundColor: colors.error + '20',
    padding: spacing.md,
    borderRadius: borderRadius.sm,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.error + '50',
  },
  errorText: {
    color: colors.error,
    fontSize: fontSize.sm,
    textAlign: 'center',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  loadingText: {
    marginTop: spacing.md,
    color: colors.textSecondary,
    fontSize: fontSize.md,
  },
  reportDetailScroll: {
    flex: 1,
  },
  detailSection: {
    marginBottom: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border + '50',
    paddingBottom: spacing.md,
  },
  detailSectionTitle: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: colors.primaryLight,
    marginBottom: spacing.sm,
  },
  detailRowVal: {
    flexDirection: 'row',
    marginBottom: spacing.xs,
  },
  detailLabel: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    fontWeight: fontWeight.semibold,
    width: 80,
  },
  detailTextVal: {
    fontSize: fontSize.sm,
    color: colors.text,
    flex: 1,
  },
  sectionBlock: {
    backgroundColor: colors.bgInput,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.md,
  },
  blockHeading: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  blockParagraph: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    lineHeight: 20,
    marginBottom: spacing.sm,
  },
  blockBullet: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    lineHeight: 20,
    marginLeft: spacing.sm,
    marginBottom: spacing.xs,
  },
  blockRichText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  blockImagesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  blockImageContainer: {
    width: '47%',
    backgroundColor: colors.bgCard,
    borderRadius: borderRadius.sm,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
  },
  blockImage: {
    width: '100%',
    height: 100,
  },
  blockImageCaption: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    padding: spacing.xs,
    textAlign: 'center',
  },
  budgetTable: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    overflow: 'hidden',
  },
  budgetRow: {
    flexDirection: 'row',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.bgCard,
    alignItems: 'center',
  },
  budgetHeader: {
    backgroundColor: colors.bgInput,
  },
  budgetItem: {
    flex: 2,
    fontSize: fontSize.sm,
    color: colors.text,
  },
  budgetQty: {
    flex: 0.5,
    fontSize: fontSize.sm,
    color: colors.text,
    textAlign: 'center',
  },
  budgetCost: {
    flex: 1,
    fontSize: fontSize.sm,
    color: colors.text,
    textAlign: 'right',
  },
  budgetTotal: {
    flex: 1,
    fontSize: fontSize.sm,
    color: colors.text,
    textAlign: 'right',
  },
  bold: {
    fontWeight: fontWeight.bold,
    color: colors.textSecondary,
  },
  approvalActionsBar: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.md,
    marginTop: spacing.sm,
  },
  circleActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderWidth: 1.5,
    borderRadius: borderRadius.md,
    gap: spacing.xs,
  },
  circleActionText: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
  },
  rejectionContainer: {
    width: '100%',
  },
  inputLabel: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    fontWeight: fontWeight.medium,
    marginBottom: spacing.xs,
  },
  textArea: {
    backgroundColor: colors.bgInput,
    color: colors.text,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    fontSize: fontSize.sm,
    textAlignVertical: 'top',
    marginBottom: spacing.md,
  },
  rejectionButtons: {
    flexDirection: 'row',
    gap: spacing.sm,
  }
});
