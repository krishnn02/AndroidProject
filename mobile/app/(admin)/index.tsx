import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../src/stores/authStore';
import { analyticsApi, reportApi } from '../../src/services';
import { Card, StatCard, Button } from '../../src/components/ui';
import { colors, spacing, fontSize, fontWeight, borderRadius } from '../../src/theme';

export default function AdminDashboardScreen() {
  const { user, logout } = useAuthStore();
  const [overview, setOverview] = useState<any>(null);
  const [recentReports, setRecentReports] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'APPROVED': return colors.success;
      case 'REJECTED': return colors.error;
      case 'SUBMITTED': return colors.warning;
      default: return colors.textMuted;
    }
  };

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={<RefreshControl refreshing={isLoading} onRefresh={loadData} tintColor={colors.primary} />}
    >
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Admin Portal</Text>
          <Text style={styles.dept}>Welcome back, {user?.name.split(' ')[0]}</Text>
        </View>
        <Button variant="ghost" icon={<Ionicons name="log-out-outline" size={24} color={colors.error} />} onPress={logout} title="" />
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
          <Card key={report._id} style={styles.reportCard}>
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
    color: colors.textSecondary,
    marginTop: 2,
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
    borderRadius: borderRadius.pill,
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
  }
});
