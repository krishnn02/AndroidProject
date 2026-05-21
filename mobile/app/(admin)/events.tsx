import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  RefreshControl, 
  Alert, 
  Modal, 
  TouchableOpacity, 
  ActivityIndicator, 
  KeyboardAvoidingView, 
  Platform 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { eventApi, userApi } from '../../src/services';
import { Card, Button, Input } from '../../src/components/ui';
import { colors, spacing, fontSize, fontWeight, borderRadius } from '../../src/theme';

export default function AdminEventsScreen() {
  const router = useRouter();
  const [events, setEvents] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Edit Event Modal State
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [editingEvent, setEditingEvent] = useState<any>(null);
  const [eventName, setEventName] = useState('');
  const [eventType, setEventType] = useState('CULTURAL');
  const [eventDept, setEventDept] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [eventVenue, setEventVenue] = useState('');
  const [eventConvener, setEventConvener] = useState('');
  const [eventCoConvener, setEventCoConvener] = useState('');
  const [eventFaculty, setEventFaculty] = useState('');
  const [eventStudent, setEventStudent] = useState('');
  const [eventStatus, setEventStatus] = useState('DRAFT');
  const [eventTheme, setEventTheme] = useState('CORPORATE');
  const [isEventSaving, setIsEventSaving] = useState(false);
  const [eventError, setEventError] = useState('');

  // Assign Users Modal State
  const [isAssignModalVisible, setIsAssignModalVisible] = useState(false);
  const [assigningEventId, setAssigningEventId] = useState<string | null>(null);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [isAssigning, setIsAssigning] = useState(false);
  const [isUsersLoading, setIsUsersLoading] = useState(false);

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

  const handleEditEvent = (event: any) => {
    setEditingEvent(event);
    setEventName(event.name || '');
    setEventType(event.type || 'CULTURAL');
    setEventDept(event.department || '');
    // format date as YYYY-MM-DD
    setEventDate(event.date ? new Date(event.date).toISOString().split('T')[0] : '');
    setEventVenue(event.venue || '');
    setEventConvener(event.convener || '');
    setEventCoConvener(event.coConvener || '');
    setEventFaculty(event.facultyCoordinator || '');
    setEventStudent(event.studentCoordinator || '');
    setEventStatus(event.status || 'DRAFT');
    setEventTheme(event.themeType || 'CORPORATE');
    setEventError('');
    setIsEditModalVisible(true);
  };

  const handleSaveEvent = async () => {
    if (!eventName.trim() || !eventDept.trim() || !eventDate.trim() || !eventVenue.trim() || !eventConvener.trim()) {
      setEventError('Please fill in all required fields (Name, Dept, Date, Venue, Convener).');
      return;
    }
    
    // validate date format
    const dateParsed = Date.parse(eventDate);
    if (isNaN(dateParsed)) {
      setEventError('Please enter a valid Date in YYYY-MM-DD format.');
      return;
    }

    setIsEventSaving(true);
    setEventError('');
    try {
      const payload = {
        name: eventName.trim(),
        type: eventType,
        department: eventDept.trim(),
        date: new Date(eventDate),
        venue: eventVenue.trim(),
        convener: eventConvener.trim(),
        coConvener: eventCoConvener.trim() || undefined,
        facultyCoordinator: eventFaculty.trim() || undefined,
        studentCoordinator: eventStudent.trim() || undefined,
        status: eventStatus,
        themeType: eventTheme,
      };
      await eventApi.update(editingEvent._id, payload);
      setIsEditModalVisible(false);
      Alert.alert('Success', 'Event updated successfully.');
      loadEvents();
    } catch (err: any) {
      setEventError(err.response?.data?.message || 'Failed to update event.');
    } finally {
      setIsEventSaving(false);
    }
  };

  const handleAssignUsers = async (eventId: string) => {
    setAssigningEventId(eventId);
    setIsAssignModalVisible(true);
    setIsUsersLoading(true);
    setSelectedUserIds([]);
    try {
      const usersRes = await userApi.getAll({ limit: 100 });
      const usersList = usersRes.data.data.users || [];
      const eligibleUsers = usersList.filter((u: any) => u.role !== 'ADMIN');
      setAllUsers(eligibleUsers);

      const assignRes = await eventApi.getAssignments(eventId);
      const currentAssignments = assignRes.data.data.assignments || [];
      const currentAssignedIds = currentAssignments.map((a: any) => {
        return typeof a.user === 'object' ? a.user?._id : a.user;
      });
      setSelectedUserIds(currentAssignedIds);
    } catch (err) {
      console.error('Failed to load assignments:', err);
      Alert.alert('Error', 'Failed to load users or current event assignments.');
      setIsAssignModalVisible(false);
    } finally {
      setIsUsersLoading(false);
    }
  };

  const toggleUserSelection = (userId: string) => {
    if (selectedUserIds.includes(userId)) {
      setSelectedUserIds(selectedUserIds.filter(id => id !== userId));
    } else {
      setSelectedUserIds([...selectedUserIds, userId]);
    }
  };

  const handleSaveAssignments = async () => {
    if (!assigningEventId) return;
    setIsAssigning(true);
    try {
      await eventApi.assignUsers(assigningEventId, selectedUserIds);
      Alert.alert('Success', 'User assignments updated successfully.');
      setIsAssignModalVisible(false);
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to update user assignments.');
    } finally {
      setIsAssigning(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return colors.success;
      case 'COMPLETED': return colors.primary;
      case 'CANCELLED': return colors.error;
      default: return colors.textMuted;
    }
  };

  const typesList = ['CULTURAL', 'TECHNICAL', 'SEMINAR', 'WORKSHOP', 'INDUSTRIAL_VISIT', 'OTHER'];
  const statusList = ['DRAFT', 'ACTIVE', 'COMPLETED', 'CANCELLED'];
  const themesList = ['CORPORATE', 'CULTURAL', 'TECHNICAL', 'SEMINAR', 'ENVIRONMENT', 'SUSTAINABLE'];

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
              <Button variant="outline" size="sm" title="Edit" onPress={() => handleEditEvent(event)} style={styles.actionBtn} />
              <Button variant="primary" size="sm" title="Assign" onPress={() => handleAssignUsers(event._id)} style={styles.actionBtn} />
            </View>
          </Card>
        ))}

        {events.length === 0 && !isLoading && (
          <Text style={styles.emptyText}>No events found.</Text>
        )}
      </ScrollView>

      {/* Edit Event Modal */}
      <Modal
        visible={isEditModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsEditModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView 
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.modalContainer}
          >
            <Card style={styles.modalCard}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Edit Event</Text>
                <TouchableOpacity onPress={() => setIsEditModalVisible(false)} style={styles.closeBtn}>
                  <Ionicons name="close" size={24} color={colors.text} />
                </TouchableOpacity>
              </View>

              {eventError ? (
                <View style={styles.errorBox}>
                  <Text style={styles.errorText}>{eventError}</Text>
                </View>
              ) : null}

              <ScrollView showsVerticalScrollIndicator={false} style={styles.modalForm}>
                <Input
                  label="Event Name *"
                  placeholder="Enter event name"
                  value={eventName}
                  onChangeText={setEventName}
                  icon="bookmark-outline"
                />

                <Input
                  label="Department *"
                  placeholder="Enter department (e.g. CSE, IT)"
                  value={eventDept}
                  onChangeText={setEventDept}
                  icon="business-outline"
                />

                <Input
                  label="Date (YYYY-MM-DD) *"
                  placeholder="e.g. 2026-05-21"
                  value={eventDate}
                  onChangeText={setEventDate}
                  icon="calendar-outline"
                />

                <Input
                  label="Venue *"
                  placeholder="Enter venue"
                  value={eventVenue}
                  onChangeText={setEventVenue}
                  icon="location-outline"
                />

                <Input
                  label="Convener *"
                  placeholder="Enter convener name"
                  value={eventConvener}
                  onChangeText={setEventConvener}
                  icon="person-outline"
                />

                <Input
                  label="Co-Convener"
                  placeholder="Enter co-convener name"
                  value={eventCoConvener}
                  onChangeText={setEventCoConvener}
                  icon="people-outline"
                />

                <Input
                  label="Faculty Coordinator"
                  placeholder="Enter faculty coordinator"
                  value={eventFaculty}
                  onChangeText={setEventFaculty}
                  icon="school-outline"
                />

                <Input
                  label="Student Coordinator"
                  placeholder="Enter student coordinator"
                  value={eventStudent}
                  onChangeText={setEventStudent}
                  icon="person-outline"
                />

                {/* Event Type Select (Badges) */}
                <Text style={styles.selectLabel}>Event Type</Text>
                <View style={styles.badgesContainer}>
                  {typesList.map((t) => (
                    <TouchableOpacity 
                      key={t} 
                      onPress={() => setEventType(t)} 
                      style={[styles.badgeBtn, eventType === t && styles.badgeBtnActive]}
                    >
                      <Text style={[styles.badgeBtnText, eventType === t && styles.badgeBtnTextActive]}>
                        {t.replace('_', ' ')}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Status Select (Badges) */}
                <Text style={styles.selectLabel}>Event Status</Text>
                <View style={styles.badgesContainer}>
                  {statusList.map((s) => (
                    <TouchableOpacity 
                      key={s} 
                      onPress={() => setEventStatus(s)} 
                      style={[styles.badgeBtn, eventStatus === s && styles.badgeBtnActive]}
                    >
                      <Text style={[styles.badgeBtnText, eventStatus === s && styles.badgeBtnTextActive]}>
                        {s}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Theme Select (Badges) */}
                <Text style={styles.selectLabel}>Branding Theme</Text>
                <View style={styles.badgesContainer}>
                  {themesList.map((th) => (
                    <TouchableOpacity 
                      key={th} 
                      onPress={() => setEventTheme(th)} 
                      style={[styles.badgeBtn, eventTheme === th && styles.badgeBtnActive]}
                    >
                      <Text style={[styles.badgeBtnText, eventTheme === th && styles.badgeBtnTextActive]}>
                        {th}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
                
                <View style={styles.modalActions}>
                  <Button
                    title="Cancel"
                    variant="outline"
                    onPress={() => setIsEditModalVisible(false)}
                    style={styles.actionBtn}
                  />
                  <Button
                    title="Save"
                    onPress={handleSaveEvent}
                    loading={isEventSaving}
                    style={styles.actionBtn}
                  />
                </View>
              </ScrollView>
            </Card>
          </KeyboardAvoidingView>
        </View>
      </Modal>

      {/* Assign Users Modal */}
      <Modal
        visible={isAssignModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsAssignModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContainer, { height: '70%', width: '90%', maxWidth: 400 }]}>
            <Card style={[styles.modalCard, { flex: 1 }]}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Assign Users</Text>
                <TouchableOpacity onPress={() => setIsAssignModalVisible(false)} style={styles.closeBtn}>
                  <Ionicons name="close" size={24} color={colors.text} />
                </TouchableOpacity>
              </View>

              {isUsersLoading ? (
                <View style={styles.centered}>
                  <ActivityIndicator size="large" color={colors.primary} />
                  <Text style={styles.loadingText}>Loading users...</Text>
                </View>
              ) : (
                <View style={{ flex: 1 }}>
                  <ScrollView showsVerticalScrollIndicator={false} style={styles.userListScroll}>
                    {allUsers.map((u) => {
                      const isSelected = selectedUserIds.includes(u._id);
                      return (
                        <TouchableOpacity 
                          key={u._id} 
                          style={[styles.userRow, isSelected && styles.userRowSelected]} 
                          onPress={() => toggleUserSelection(u._id)}
                          activeOpacity={0.7}
                        >
                          <View style={[styles.avatar, { backgroundColor: isSelected ? colors.primary : colors.bgInput }]}>
                            <Text style={styles.avatarText}>{u.name.charAt(0).toUpperCase()}</Text>
                          </View>
                          <View style={styles.userRowInfo}>
                            <Text style={styles.userRowName}>{u.name}</Text>
                            <Text style={styles.userRowEmail}>{u.email} • {u.department}</Text>
                          </View>
                          <Ionicons 
                            name={isSelected ? 'checkbox' : 'square-outline'} 
                            size={24} 
                            color={isSelected ? colors.primaryLight : colors.textMuted} 
                          />
                        </TouchableOpacity>
                      );
                    })}

                    {allUsers.length === 0 && (
                      <Text style={styles.emptyText}>No eligible users found.</Text>
                    )}
                  </ScrollView>

                  <View style={styles.modalActions}>
                    <Button
                      title="Cancel"
                      variant="outline"
                      onPress={() => setIsAssignModalVisible(false)}
                      style={styles.actionBtn}
                    />
                    <Button
                      title="Save"
                      onPress={handleSaveAssignments}
                      loading={isAssigning}
                      style={styles.actionBtn}
                    />
                  </View>
                </View>
              )}
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
    flex: 1,
    minWidth: 80,
  },
  emptyText: {
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.xl,
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
  selectLabel: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    fontWeight: fontWeight.medium,
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
  },
  badgesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  badgeBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.bgInput,
  },
  badgeBtnActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + '15',
  },
  badgeBtnText: {
    color: colors.textSecondary,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
  },
  badgeBtnTextActive: {
    color: colors.primaryLight,
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
  userListScroll: {
    flex: 1,
    marginBottom: spacing.md,
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.sm,
    borderRadius: borderRadius.md,
    marginBottom: spacing.xs,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  userRowSelected: {
    borderColor: colors.primary + '30',
    backgroundColor: colors.primary + '08',
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  avatarText: {
    color: colors.text,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
  },
  userRowInfo: {
    flex: 1,
  },
  userRowName: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.text,
  },
  userRowEmail: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
  }
});
