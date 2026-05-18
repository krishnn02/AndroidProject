import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useReportStore } from '../../../../src/stores/reportStore';
import { Card, Button, Input } from '../../../../src/components/ui';
import { colors, spacing } from '../../../../src/theme';
import { Ionicons } from '@expo/vector-icons';

export default function FrontPageEditorScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { currentReport, fetchReport, updateFrontPage, isSaving, isLoading } = useReportStore();

  const [formData, setFormData] = useState({
    institutionName: '',
    departmentName: '',
    subtitle: '',
    logoUrl: '', // Stub for future logo uploads
  });

  useEffect(() => {
    if (!currentReport || currentReport._id !== id) {
      fetchReport(id as string);
    }
  }, [id]);

  useEffect(() => {
    if (currentReport?.frontPage) {
      setFormData({
        institutionName: currentReport.frontPage.institutionName || '',
        departmentName: currentReport.frontPage.departmentName || '',
        subtitle: currentReport.frontPage.subtitle || '',
        logoUrl: currentReport.frontPage.logoUrl || '',
      });
    }
  }, [currentReport]);

  const handleSave = async () => {
    try {
      await updateFrontPage(id as string, formData);
      Alert.alert('Success', 'Front page details saved successfully');
      router.back();
    } catch (error) {
      Alert.alert('Error', 'Failed to save front page details');
    }
  };

  if (isLoading || !currentReport) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: spacing.lg }}>
      <Card style={styles.card}>
        <Input
          label="Institution Name"
          placeholder="Enter the name of the institution"
          value={formData.institutionName}
          onChangeText={(text) => setFormData({ ...formData, institutionName: text })}
        />
        <Input
          label="Department Name"
          placeholder="Enter the department name"
          value={formData.departmentName}
          onChangeText={(text) => setFormData({ ...formData, departmentName: text })}
        />
        <Input
          label="Report Subtitle"
          placeholder="E.g. Technical Symposium 2026"
          value={formData.subtitle}
          onChangeText={(text) => setFormData({ ...formData, subtitle: text })}
        />
        
        {/* Placeholder for future logo upload */}
        <Button 
          title="Upload Logo (Coming Soon)" 
          variant="outline" 
          icon={<Ionicons name="image-outline" size={20} color={colors.primary} />}
          onPress={() => Alert.alert('Coming Soon', 'Logo upload will be implemented soon.')}
          style={styles.uploadBtn}
        />
      </Card>

      <View style={styles.actions}>
        <Button 
          title="Save Changes" 
          onPress={handleSave} 
          loading={isSaving}
          icon={<Ionicons name="save-outline" size={20} color="#fff" />}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  centered: { justifyContent: 'center', alignItems: 'center' },
  card: { padding: spacing.xl, marginBottom: spacing.xl, gap: spacing.md },
  uploadBtn: { marginTop: spacing.md },
  actions: { marginTop: spacing.md },
});
