import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Alert, Image as RNImage, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { useReportStore } from '../../../../src/stores/reportStore';
import { imageApi } from '../../../../src/services';
import { Card, Button, Input } from '../../../../src/components/ui';
import { colors, spacing, fontSize, fontWeight, borderRadius } from '../../../../src/theme';
import { Ionicons } from '@expo/vector-icons';

type LogoField = 'collegeLogo' | 'departmentLogo' | 'eventLogo' | 'heroBanner';

export default function FrontPageEditorScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { currentReport, fetchReport, updateFrontPage, isSaving, isLoading } = useReportStore();
  const [uploadingField, setUploadingField] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    institutionName: '',
    departmentName: '',
    eventTitle: '',
    eventSubtitle: '',
    venueDate: '',
    collegeLogo: '',
    departmentLogo: '',
    eventLogo: '',
    heroBanner: '',
  });

  useEffect(() => {
    if (!currentReport || currentReport._id !== id) {
      fetchReport(id as string);
    }
  }, [id]);

  useEffect(() => {
    if (currentReport) {
      const fp = currentReport.frontPage || {};
      const event = currentReport.event;
      setFormData({
        institutionName: fp.institutionName || '',
        departmentName: fp.departmentName || event?.department || '',
        eventTitle: fp.eventTitle || event?.name || '',
        eventSubtitle: fp.eventSubtitle || '',
        venueDate: fp.venueDate || (event?.date ? new Date(event.date).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' }) : ''),
        collegeLogo: fp.collegeLogo || '',
        departmentLogo: fp.departmentLogo || '',
        eventLogo: fp.eventLogo || '',
        heroBanner: fp.heroBanner || '',
      });
    }
  }, [currentReport]);

  const pickAndUploadLogo = async (field: LogoField) => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      Alert.alert('Permission Denied', 'Camera roll permission is required.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 0.9,
      aspect: field === 'heroBanner' ? [16, 9] : [1, 1],
    });

    if (result.canceled || !result.assets || result.assets.length === 0) return;

    setUploadingField(field);
    try {
      const asset = result.assets[0];
      const filename = asset.uri.split('/').pop() || 'logo.jpg';
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : 'image/jpeg';

      const fd = new FormData();
      fd.append('logo', { uri: asset.uri, name: filename, type } as any);

      const { data } = await imageApi.uploadLogo(fd);
      setFormData(prev => ({ ...prev, [field]: data.data.url }));
      Alert.alert('Success', 'Image uploaded successfully');
    } catch (error: any) {
      console.error('Logo upload error:', error);
      Alert.alert('Upload Failed', error.response?.data?.message || 'Failed to upload image');
    } finally {
      setUploadingField(null);
    }
  };

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

  const renderImageUploader = (label: string, field: LogoField, aspectHint: string) => (
    <View style={styles.uploaderBlock}>
      <Text style={styles.uploaderLabel}>{label}</Text>
      {formData[field] ? (
        <View style={styles.previewContainer}>
          <RNImage 
            source={{ uri: formData[field] }} 
            style={[styles.previewImage, field === 'heroBanner' && styles.bannerPreview]} 
          />
          <View style={styles.previewActions}>
            <TouchableOpacity 
              style={styles.removeBtn}
              onPress={() => setFormData(prev => ({ ...prev, [field]: '' }))}
            >
              <Ionicons name="close-circle" size={20} color={colors.error} />
              <Text style={styles.removeBtnText}>Remove</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.replaceBtn}
              onPress={() => pickAndUploadLogo(field)}
            >
              <Ionicons name="refresh-outline" size={16} color={colors.primary} />
              <Text style={styles.replaceBtnText}>Replace</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <TouchableOpacity 
          style={styles.uploadPlaceholder}
          onPress={() => pickAndUploadLogo(field)}
          disabled={uploadingField === field}
        >
          {uploadingField === field ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : (
            <>
              <Ionicons name="cloud-upload-outline" size={28} color={colors.textMuted} />
              <Text style={styles.uploadText}>Tap to upload {aspectHint}</Text>
            </>
          )}
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: spacing.lg, paddingBottom: 60 }}>
      
      {/* Logos Section */}
      <Card style={styles.card}>
        <Text style={styles.cardTitle}>Logos & Banner</Text>
        <View style={styles.logoRow}>
          {renderImageUploader('College Logo', 'collegeLogo', '(1:1)')}
          {renderImageUploader('Dept Logo', 'departmentLogo', '(1:1)')}
          {renderImageUploader('Event Logo', 'eventLogo', '(1:1)')}
        </View>
        {renderImageUploader('Hero Banner Image', 'heroBanner', '(16:9 landscape)')}
      </Card>

      {/* Text Details */}
      <Card style={styles.card}>
        <Text style={styles.cardTitle}>Report Details</Text>
        <Input
          label="Institution Name"
          placeholder="Enter the name of the institution"
          value={formData.institutionName}
          onChangeText={(text) => setFormData({ ...formData, institutionName: text })}
        />
        <View style={{ height: spacing.sm }} />
        <Input
          label="Department Name"
          placeholder="Enter the department name"
          value={formData.departmentName}
          onChangeText={(text) => setFormData({ ...formData, departmentName: text })}
        />
        <View style={{ height: spacing.sm }} />
        <Input
          label="Event Title"
          placeholder="Main title displayed on the cover"
          value={formData.eventTitle}
          onChangeText={(text) => setFormData({ ...formData, eventTitle: text })}
        />
        <View style={{ height: spacing.sm }} />
        <Input
          label="Event Subtitle (optional)"
          placeholder="E.g. Technical Symposium 2026"
          value={formData.eventSubtitle}
          onChangeText={(text) => setFormData({ ...formData, eventSubtitle: text })}
        />
        <View style={{ height: spacing.sm }} />
        <Input
          label="Venue / Date Line"
          placeholder="E.g. 19 May 2026 | Main Auditorium"
          value={formData.venueDate}
          onChangeText={(text) => setFormData({ ...formData, venueDate: text })}
        />
      </Card>

      <View style={styles.actions}>
        <Button 
          title="Save Front Page" 
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
  card: { padding: spacing.lg, marginBottom: spacing.lg },
  cardTitle: { fontSize: fontSize.lg, fontWeight: fontWeight.bold, color: colors.text, marginBottom: spacing.md },
  logoRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md },
  uploaderBlock: { flex: 1, marginBottom: spacing.sm },
  uploaderLabel: { fontSize: fontSize.xs, color: colors.textSecondary, fontWeight: fontWeight.semibold, marginBottom: spacing.xs },
  uploadPlaceholder: { 
    height: 90, borderRadius: borderRadius.md, borderWidth: 1, borderColor: colors.border, borderStyle: 'dashed',
    alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bgInput,
  },
  uploadText: { fontSize: 10, color: colors.textMuted, marginTop: 4, textAlign: 'center' },
  previewContainer: { alignItems: 'center' },
  previewImage: { width: 80, height: 80, borderRadius: borderRadius.md, backgroundColor: colors.bgElevated },
  bannerPreview: { width: '100%', height: 120, borderRadius: borderRadius.md },
  previewActions: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.xs },
  removeBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  removeBtnText: { fontSize: fontSize.xs, color: colors.error },
  replaceBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  replaceBtnText: { fontSize: fontSize.xs, color: colors.primary },
  actions: { marginTop: spacing.md },
});
