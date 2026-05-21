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
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../src/stores/authStore';
import { useEventStore } from '../../src/stores/eventStore';
import { useReportStore } from '../../src/stores/reportStore';
import { Card, StatCard, Button, Input } from '../../src/components/ui';
import { colors, spacing, fontSize, fontWeight, borderRadius } from '../../src/theme';
import { userApi } from '../../src/services';

export default function DashboardScreen() {
  const { user, logout, updateUser } = useAuthStore();
  const { events, fetchEvents, isLoading: eventsLoading } = useEventStore();
  const { reports, fetchReports, isLoading: reportsLoading } = useReportStore();
  const router = useRouter();

  // Profile Modal State
  const [isProfileVisible, setIsProfileVisible] = useState(false);
  const [profileName, setProfileName] = useState('');
  const [profileEmail, setProfileEmail] = useState('');
  const [profilePhone, setProfilePhone] = useState('');
  const [profilePassword, setProfilePassword] = useState('');
  const [profileDepartment, setProfileDepartment] = useState('');
  const [profileCollege, setProfileCollege] = useState('');
  const [avatarColor, setAvatarColor] = useState('#6C3CE0');
  const [isProfileSaving, setIsProfileSaving] = useState(false);
  const [profileError, setProfileError] = useState('');
  const [profileNameError, setProfileNameError] = useState('');
  const [profileEmailError, setProfileEmailError] = useState('');
  const [profilePhoneError, setProfilePhoneError] = useState('');
  const [profilePasswordError, setProfilePasswordError] = useState('');
  const [profileDeptError, setProfileDeptError] = useState('');

  const loadData = () => {
    fetchEvents();
    fetchReports({ userId: user?._id });
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
      setAvatarColor(user.avatarColor || '#6C3CE0');
      setProfileError('');
      setProfileNameError('');
      setProfileEmailError('');
      setProfilePhoneError('');
      setProfilePasswordError('');
      setProfileDeptError('');
      setIsProfileVisible(true);
    }
  };

  const handleSaveProfile = async () => {
    let hasError = false;
    setProfileNameError('');
    setProfileEmailError('');
    setProfilePhoneError('');
    setProfilePasswordError('');
    setProfileDeptError('');
    setProfileError('');

    if (!profileName.trim()) {
      setProfileNameError('Name is required');
      hasError = true;
    } else if (profileName.trim().length < 2) {
      setProfileNameError('Name must be at least 2 characters');
      hasError = true;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!profileEmail.trim()) {
      setProfileEmailError('Email is required');
      hasError = true;
    } else if (!emailRegex.test(profileEmail.trim())) {
      setProfileEmailError('Please enter a valid email address');
      hasError = true;
    }

    if (profilePhone.trim() && !/^\d{10}$/.test(profilePhone.trim())) {
      setProfilePhoneError('Phone must be a 10-digit number');
      hasError = true;
    }

    if (profilePassword.trim() && profilePassword.trim().length < 6) {
      setProfilePasswordError('Password must be at least 6 characters');
      hasError = true;
    }

    if (!profileDepartment.trim()) {
      setProfileDeptError('Department is required');
      hasError = true;
    }

    if (hasError) {
      return;
    }

    setIsProfileSaving(true);
    try {
      const payload: any = {
        name: profileName.trim(),
        email: profileEmail.trim().toLowerCase(),
        phone: profilePhone.trim(),
        department: profileDepartment.trim(),
        college: profileCollege.trim(),
        avatarColor,
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

  const refreshing = eventsLoading || reportsLoading;

  // Password strength evaluation helper
  const getPasswordStrength = (password: string) => {
    if (!password) return { text: '', color: colors.textMuted, width: 0 };
    if (password.length < 6) return { text: 'Weak (min 6 characters)', color: colors.error, width: 33 };
    const hasNumberOrSymbol = /[\d!@#$%^&*(),.?":{}|<>]/.test(password);
    if (!hasNumberOrSymbol) return { text: 'Medium (add a number or symbol)', color: colors.warning, width: 66 };
    return { text: 'Strong', color: colors.success, width: 100 };
  };

  // Draft reports
  const drafts = reports.filter((report) => report.status === 'DRAFT' || report.status === 'REJECTED');

  // Compliance calculations
  const completedReportsCount = reports.filter((r) => r.status === 'SUBMITTED' || r.status === 'APPROVED').length;
  const totalEventsCount = events.length;
  const complianceRate = totalEventsCount > 0 ? Math.round((completedReportsCount / totalEventsCount) * 100) : 0;

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView 
        style={styles.container}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={loadData} tintColor={colors.primary} />}
      >
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Hello, {user?.name.split(' ')[0]}</Text>
            <Text style={styles.dept}>{user?.department}</Text>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity 
              onPress={openProfile} 
              style={[
                styles.avatarBadge, 
                { backgroundColor: user?.avatarColor || colors.primary }
              ]}
            >
              <Text style={styles.avatarInitial}>
                {user?.name ? user.name[0].toUpperCase() : 'U'}
              </Text>
            </TouchableOpacity>
            <Button variant="ghost" icon={<Ionicons name="log-out-outline" size={24} color={colors.error} />} onPress={logout} title="" />
          </View>
        </View>

        <View style={styles.statsRow}>
          <StatCard 
            title="Assigned Events" 
            value={events.length} 
            icon={<Ionicons name="calendar" size={24} color={colors.primary} />} 
            onPress={() => router.push('/(user)/events')}
            style={styles.statCard}
          />
          <StatCard 
            title="My Reports" 
            value={reports.length} 
            icon={<Ionicons name="document-text" size={24} color={colors.secondary} />} 
            color={colors.secondary}
            onPress={() => router.push('/(user)/reports')}
            style={styles.statCard}
          />
        </View>

        {/* Report Submission Compliance Progress */}
        <Card style={styles.complianceCard}>
          <View style={styles.complianceHeader}>
            <View style={{ flex: 1 }}>
              <Text style={styles.complianceTitle}>Submission Compliance</Text>
              <Text style={styles.complianceDesc}>
                {completedReportsCount} of {totalEventsCount} reports submitted
              </Text>
            </View>
            <View 
              style={[
                styles.complianceBadge, 
                { backgroundColor: complianceRate >= 80 ? colors.success + '15' : colors.warning + '15' }
              ]}
            >
              <Text 
                style={[
                  styles.compliancePctText, 
                  { color: complianceRate >= 80 ? colors.success : colors.warning }
                ]}
              >
                {complianceRate}%
              </Text>
            </View>
          </View>
          <View style={styles.complianceProgressTrack}>
            <View 
              style={[
                styles.complianceProgressBar, 
                { 
                  width: `${complianceRate}%`, 
                  backgroundColor: complianceRate >= 80 ? colors.success : colors.warning 
                }
              ]} 
            />
          </View>
        </Card>

        {/* Active Drafts Section */}
        {drafts.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>My Active Report Drafts</Text>
            </View>
            {drafts.map((draft) => (
              <Card key={draft._id} style={styles.draftCard}>
                <View style={styles.draftInfo}>
                  <Text style={styles.draftEventName} numberOfLines={1}>{draft.event?.name || 'Unknown Event'}</Text>
                  <Text style={[styles.draftStatusText, { color: draft.status === 'REJECTED' ? colors.error : colors.warning }]}>
                    Status: {draft.status}
                  </Text>
                </View>
                <Button 
                  title="Resume" 
                  size="sm"
                  onPress={() => router.push(`/(user)/create-report?eventId=${draft.event?._id || draft.event}&reportId=${draft._id}` as any)}
                  style={styles.resumeBtn}
                  icon={<Ionicons name="arrow-forward" size={14} color="#FFF" />}
                />
              </Card>
            ))}
          </View>
        )}

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

      {/* User Profile Edit Modal */}
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
                <Text style={styles.modalTitle}>User Profile</Text>
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
                  onChangeText={(val) => {
                    setProfileName(val);
                    if (profileNameError) setProfileNameError('');
                  }}
                  icon="person-outline"
                  error={profileNameError}
                />
                
                <Input
                  label="Email Address"
                  placeholder="Enter email address"
                  value={profileEmail}
                  onChangeText={(val) => {
                    setProfileEmail(val);
                    if (profileEmailError) setProfileEmailError('');
                  }}
                  icon="mail-outline"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  error={profileEmailError}
                />

                <Input
                  label="Phone / Mobile"
                  placeholder="Enter phone number"
                  value={profilePhone}
                  onChangeText={(val) => {
                    setProfilePhone(val);
                    if (profilePhoneError) setProfilePhoneError('');
                  }}
                  icon="call-outline"
                  keyboardType="phone-pad"
                  error={profilePhoneError}
                />

                {/* Avatar Color Selector */}
                <View style={styles.avatarColorSection}>
                  <Text style={styles.inputLabel}>Choose Profile Avatar Color</Text>
                  <View style={styles.colorPaletteRow}>
                    {['#6C3CE0', '#10B981', '#F59E0B', '#EF4444', '#3B82F6'].map((colorOption) => (
                      <TouchableOpacity
                        key={colorOption}
                        onPress={() => setAvatarColor(colorOption)}
                        style={[
                          styles.colorOptionCircle,
                          { backgroundColor: colorOption },
                          avatarColor === colorOption && styles.colorOptionCircleSelected
                        ]}
                      >
                        {avatarColor === colorOption && (
                          <Ionicons name="checkmark" size={16} color="#FFF" />
                        )}
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                <Input
                  label="Password (leave blank to keep unchanged)"
                  placeholder="Enter new password"
                  value={profilePassword}
                  onChangeText={(val) => {
                    setProfilePassword(val);
                    if (profilePasswordError) setProfilePasswordError('');
                  }}
                  icon="lock-closed-outline"
                  secureTextEntry
                  error={profilePasswordError}
                />

                {/* Password Strength Meter */}
                {profilePassword.length > 0 && (
                  <View style={styles.strengthMeterContainer}>
                    <Text style={[styles.strengthText, { color: getPasswordStrength(profilePassword).color }]}>
                      Password Strength: {getPasswordStrength(profilePassword).text}
                    </Text>
                    <View style={styles.strengthTrack}>
                      <View 
                        style={[
                          styles.strengthBar, 
                          { 
                            width: `${getPasswordStrength(profilePassword).width}%`, 
                            backgroundColor: getPasswordStrength(profilePassword).color 
                          }
                        ]} 
                      />
                    </View>
                  </View>
                )}

                <Input
                  label="Department"
                  placeholder="Enter department"
                  value={profileDepartment}
                  onChangeText={(val) => {
                    setProfileDepartment(val);
                    if (profileDeptError) setProfileDeptError('');
                  }}
                  icon="business-outline"
                  error={profileDeptError}
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
    </View>
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
    marginTop: Platform.OS === 'ios' ? 20 : 0,
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
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  profileIconBtn: {
    padding: spacing.xs,
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
    maxHeight: 400,
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
  avatarBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: colors.borderLight,
  },
  avatarInitial: {
    color: '#FFF',
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
  },
  statCard: {
    flex: 1,
  },
  complianceCard: {
    marginBottom: spacing.xl,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  complianceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  complianceTitle: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: colors.text,
  },
  complianceDesc: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    marginTop: 2,
  },
  complianceBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.sm,
  },
  compliancePctText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
  },
  complianceProgressTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.bgInput,
    overflow: 'hidden',
  },
  complianceProgressBar: {
    height: '100%',
  },
  draftCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  draftInfo: {
    flex: 1,
  },
  draftEventName: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.text,
    marginBottom: 2,
  },
  draftStatusText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
  },
  resumeBtn: {
    paddingHorizontal: spacing.md,
  },
  avatarColorSection: {
    marginBottom: spacing.md,
  },
  inputLabel: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    fontWeight: fontWeight.medium,
    marginBottom: spacing.xs,
  },
  colorPaletteRow: {
    flexDirection: 'row',
    marginTop: spacing.xs,
  },
  colorOptionCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: spacing.sm,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  colorOptionCircleSelected: {
    borderColor: '#FFF',
  },
  strengthMeterContainer: {
    marginBottom: spacing.md,
    paddingHorizontal: spacing.xs,
  },
  strengthText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
    marginBottom: 4,
  },
  strengthTrack: {
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.bgInput,
    overflow: 'hidden',
  },
  strengthBar: {
    height: '100%',
  },
});
