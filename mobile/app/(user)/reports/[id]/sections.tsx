import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Alert, TouchableOpacity, Image as RNImage } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useReportStore } from '../../../../src/stores/reportStore';
import { imageApi } from '../../../../src/services';
import { Card, Button, Input } from '../../../../src/components/ui';
import { colors, spacing, fontSize, fontWeight, borderRadius } from '../../../../src/theme';

const SECTION_TYPES = ['ABOUT', 'OBJECTIVES', 'HIGHLIGHTS', 'WINNERS', 'CONCLUSION', 'GALLERY', 'CUSTOM'];

export default function SectionManagerScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { currentReport, fetchReport, addSection, updateSection, deleteSection, isSaving, isLoading } = useReportStore();

  const [newSectionType, setNewSectionType] = useState('');
  const [newSectionHeading, setNewSectionHeading] = useState('');
  const [editingSection, setEditingSection] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [uploading, setUploading] = useState<string | null>(null);

  useEffect(() => {
    if (!currentReport || currentReport._id !== id) {
      fetchReport(id as string);
    }
  }, [id]);

  const handleAddSection = async () => {
    if (!newSectionType || !newSectionHeading) {
      Alert.alert('Validation Error', 'Please provide both type and heading.');
      return;
    }
    try {
      await addSection(id as string, {
        type: newSectionType.toUpperCase(),
        heading: newSectionHeading,
        sortOrder: currentReport?.sections?.length || 0,
        content: { paragraphs: [], bullets: [] }
      });
      setNewSectionType('');
      setNewSectionHeading('');
    } catch (e) {
      Alert.alert('Error', 'Failed to add section');
    }
  };

  const handleDeleteSection = (sectionId: string) => {
    Alert.alert('Confirm Delete', 'Are you sure you want to delete this section and all its images?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', onPress: () => deleteSection(sectionId), style: 'destructive' }
    ]);
  };

  const pickAndUploadImages = async (sectionId: string) => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      Alert.alert('Permission Denied', 'You need to allow camera roll permissions to upload images.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      quality: 0.8,
      selectionLimit: 10,
    });

    if (result.canceled || !result.assets || result.assets.length === 0) return;

    setUploading(sectionId);
    try {
      const formData = new FormData();
      result.assets.forEach((asset, index) => {
        const filename = asset.uri.split('/').pop() || `image_${index}.jpg`;
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : 'image/jpeg';
        formData.append('images', {
          uri: asset.uri,
          name: filename,
          type,
        } as any);
      });

      await imageApi.upload(sectionId, formData);
      await fetchReport(id as string);
      Alert.alert('Success', `${result.assets.length} image(s) uploaded successfully`);
    } catch (error: any) {
      console.error('Upload error:', error);
      Alert.alert('Upload Failed', error.response?.data?.message || 'Failed to upload images. Check your connection.');
    } finally {
      setUploading(null);
    }
  };

  const handleDeleteImage = (imageId: string) => {
    Alert.alert('Delete Image', 'Remove this image?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive', onPress: async () => {
          try {
            await imageApi.delete(imageId);
            await fetchReport(id as string);
          } catch {
            Alert.alert('Error', 'Failed to delete image');
          }
        }
      }
    ]);
  };

  const handleEditText = (section: any) => {
    setEditingSection(section._id);
    const paragraphs = section.content?.paragraphs || [];
    setEditText(paragraphs.join('\n\n'));
  };

  const handleSaveText = async (sectionId: string) => {
    const paragraphs = editText.split('\n\n').filter(p => p.trim());
    try {
      await updateSection(sectionId, { content: { paragraphs, bullets: [] } });
      await fetchReport(id as string);
      setEditingSection(null);
      setEditText('');
    } catch {
      Alert.alert('Error', 'Failed to save text');
    }
  };

  if (isLoading || !currentReport) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const sortedSections = [...(currentReport.sections || [])].sort((a, b) => a.sortOrder - b.sortOrder);

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: spacing.lg }}>
      
      {/* List Existing Sections */}
      <View style={styles.listContainer}>
        {sortedSections.length === 0 && (
          <Text style={styles.emptyText}>No sections added yet.</Text>
        )}
        
        {sortedSections.map((section, index) => (
          <Card key={section._id || index.toString()} style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.sectionType}>{section.type}</Text>
                <Text style={styles.sectionHeading}>{section.heading}</Text>
              </View>
              <TouchableOpacity onPress={() => handleDeleteSection(section._id)}>
                <Ionicons name="trash-outline" size={20} color={colors.error} />
              </TouchableOpacity>
            </View>

            {/* Show section text preview */}
            {section.content?.paragraphs && section.content.paragraphs.length > 0 && (
              <Text style={styles.contentPreview} numberOfLines={2}>
                {section.content.paragraphs[0]}
              </Text>
            )}

            {/* Inline text editor */}
            {editingSection === section._id && (
              <View style={styles.editContainer}>
                <Input
                  label="Section Content (separate paragraphs with empty lines)"
                  placeholder="Enter text content..."
                  value={editText}
                  onChangeText={setEditText}
                  multiline
                  numberOfLines={6}
                  style={{ minHeight: 120, textAlignVertical: 'top' }}
                />
                <View style={styles.editActions}>
                  <Button title="Cancel" variant="ghost" size="sm" onPress={() => setEditingSection(null)} />
                  <Button title="Save" size="sm" onPress={() => handleSaveText(section._id)} loading={isSaving} />
                </View>
              </View>
            )}

            {/* Image thumbnails */}
            {section.images && section.images.length > 0 && (
              <View style={styles.imageGrid}>
                {section.images.map((img: any) => (
                  <View key={img._id} style={styles.imageThumbnailContainer}>
                    <RNImage source={{ uri: img.url }} style={styles.imageThumbnail} />
                    <TouchableOpacity style={styles.imageDeleteBtn} onPress={() => handleDeleteImage(img._id)}>
                      <Ionicons name="close-circle" size={22} color={colors.error} />
                    </TouchableOpacity>
                    {img.caption && <Text style={styles.imageCaption} numberOfLines={1}>{img.caption}</Text>}
                  </View>
                ))}
              </View>
            )}
            
            <View style={styles.sectionActions}>
              <Button 
                title={uploading === section._id ? "Uploading..." : "Add Image"} 
                variant="outline" 
                size="sm"
                icon={uploading === section._id 
                  ? <ActivityIndicator size="small" color={colors.primary} />
                  : <Ionicons name="image-outline" size={16} color={colors.primary} />
                }
                onPress={() => pickAndUploadImages(section._id)}
                disabled={uploading === section._id}
              />
              <Button 
                title="Edit Text" 
                variant="outline" 
                size="sm"
                icon={<Ionicons name="create-outline" size={16} color={colors.primary} />}
                onPress={() => handleEditText(section)}
              />
            </View>
          </Card>
        ))}
      </View>

      {/* Add New Section Form */}
      <Card style={styles.addCard}>
        <Text style={styles.addTitle}>Add New Section</Text>
        
        {/* Section type picker */}
        <Text style={styles.typeLabel}>Section Type</Text>
        <View style={styles.typePills}>
          {SECTION_TYPES.map((type) => (
            <TouchableOpacity 
              key={type}
              style={[styles.typePill, newSectionType === type && styles.typePillActive]}
              onPress={() => setNewSectionType(type)}
            >
              <Text style={[styles.typePillText, newSectionType === type && styles.typePillTextActive]}>{type}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Input
          label="Heading"
          placeholder="Enter heading"
          value={newSectionHeading}
          onChangeText={setNewSectionHeading}
        />
        <Button 
          title="Add Section" 
          onPress={handleAddSection} 
          loading={isSaving}
          style={styles.addBtn}
        />
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  centered: { justifyContent: 'center', alignItems: 'center' },
  listContainer: { marginBottom: spacing.xl },
  emptyText: { textAlign: 'center', color: colors.textMuted, fontStyle: 'italic', marginBottom: spacing.lg },
  sectionCard: { padding: spacing.md, marginBottom: spacing.md },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: spacing.sm },
  sectionType: { fontSize: fontSize.xs, color: colors.primary, fontWeight: fontWeight.bold, marginBottom: 2 },
  sectionHeading: { fontSize: fontSize.md, fontWeight: fontWeight.bold, color: colors.text },
  contentPreview: { fontSize: fontSize.sm, color: colors.textSecondary, marginBottom: spacing.sm, fontStyle: 'italic' },
  sectionActions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm },
  editContainer: { marginBottom: spacing.sm, padding: spacing.sm, backgroundColor: colors.bgInput, borderRadius: borderRadius.sm },
  editActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: spacing.sm, marginTop: spacing.sm },
  imageGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginVertical: spacing.sm },
  imageThumbnailContainer: { position: 'relative' },
  imageThumbnail: { width: 80, height: 80, borderRadius: borderRadius.sm, backgroundColor: colors.bgElevated },
  imageDeleteBtn: { position: 'absolute', top: -6, right: -6, backgroundColor: colors.bgCard, borderRadius: 11 },
  imageCaption: { fontSize: 9, color: colors.textMuted, width: 80, textAlign: 'center', marginTop: 2 },
  addCard: { padding: spacing.lg, backgroundColor: colors.bgCard, borderWidth: 1, borderColor: colors.border },
  addTitle: { fontSize: fontSize.lg, fontWeight: fontWeight.bold, marginBottom: spacing.md, color: colors.text },
  typeLabel: { fontSize: fontSize.sm, color: colors.textSecondary, fontWeight: fontWeight.semibold, marginBottom: spacing.sm },
  typePills: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, marginBottom: spacing.md },
  typePill: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: borderRadius.full, borderWidth: 1, borderColor: colors.border },
  typePillActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  typePillText: { fontSize: fontSize.xs, color: colors.textSecondary },
  typePillTextActive: { color: '#fff', fontWeight: fontWeight.bold },
  addBtn: { marginTop: spacing.md },
});
