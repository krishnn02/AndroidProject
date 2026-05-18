import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Alert, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useReportStore } from '../../../../src/stores/reportStore';
import { Card, Button, Input } from '../../../../src/components/ui';
import { colors, spacing, fontSize, fontWeight } from '../../../../src/theme';

export default function SectionManagerScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { currentReport, fetchReport, addSection, updateSection, deleteSection, isSaving, isLoading } = useReportStore();

  const [newSectionType, setNewSectionType] = useState('');
  const [newSectionHeading, setNewSectionHeading] = useState('');
  const [editingSection, setEditingSection] = useState<any>(null);

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
    Alert.alert('Confirm Delete', 'Are you sure you want to delete this section?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', onPress: () => deleteSection(sectionId), style: 'destructive' }
    ]);
  };

  const pickImage = async (sectionId: string) => {
    // Request permission
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (permissionResult.granted === false) {
      Alert.alert('Permission Denied', 'You need to allow camera roll permissions to upload images.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      // Stub: Here we would use imageApi.upload to upload the asset, 
      // then update the section with the returned Cloudinary URL.
      Alert.alert('Image Selected', `Image URI: ${result.assets[0].uri}\n\nUploading will be enabled when backend is connected.`);
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
              <View>
                <Text style={styles.sectionType}>{section.type}</Text>
                <Text style={styles.sectionHeading}>{section.heading}</Text>
              </View>
              <TouchableOpacity onPress={() => handleDeleteSection(section._id)}>
                <Ionicons name="trash-outline" size={20} color={colors.error} />
              </TouchableOpacity>
            </View>
            
            <View style={styles.sectionActions}>
              <Button 
                title="Add Image" 
                variant="outline" 
                size="sm"
                icon={<Ionicons name="image-outline" size={16} color={colors.primary} />}
                onPress={() => pickImage(section._id)}
              />
              <Button 
                title="Edit Text" 
                variant="outline" 
                size="sm"
                icon={<Ionicons name="create-outline" size={16} color={colors.primary} />}
                onPress={() => Alert.alert('Edit Text', 'Text editing form goes here')}
              />
            </View>
          </Card>
        ))}
      </View>

      {/* Add New Section Form */}
      <Card style={styles.addCard}>
        <Text style={styles.addTitle}>Add New Section</Text>
        <Input
          label="Section Type (e.g. ABOUT, GALLERY)"
          placeholder="Enter section type"
          value={newSectionType}
          onChangeText={setNewSectionType}
        />
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
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: spacing.md },
  sectionType: { fontSize: fontSize.xs, color: colors.primary, fontWeight: fontWeight.bold, marginBottom: 2 },
  sectionHeading: { fontSize: fontSize.md, fontWeight: fontWeight.bold, color: colors.text },
  sectionActions: { flexDirection: 'row', gap: spacing.sm },
  addCard: { padding: spacing.lg, backgroundColor: colors.bgCard, borderWidth: 1, borderColor: colors.border },
  addTitle: { fontSize: fontSize.lg, fontWeight: fontWeight.bold, marginBottom: spacing.md, color: colors.text },
  addBtn: { marginTop: spacing.md },
});
