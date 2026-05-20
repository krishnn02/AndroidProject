import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity,
  Alert, ActivityIndicator, Image as RNImage,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as Linking from 'expo-linking';
import { useRouter } from 'expo-router';
import { reportApi, imageApi, eventApi } from '../../src/services';
import { useReportStore } from '../../src/stores/reportStore';
import { Button } from '../../src/components/ui';
import { colors, spacing, fontSize, fontWeight, borderRadius } from '../../src/theme';

interface EventDetailField {
  key: string;
  value: string;
  editable: boolean; // whether the key itself is editable (custom fields)
}

const DEFAULT_EVENT_DETAILS: EventDetailField[] = [
  { key: 'Event Name', value: '', editable: false },
  { key: 'Date of the Event', value: '', editable: false },
  { key: 'Venue of the Event', value: '', editable: false },
  { key: 'Speaker', value: '', editable: false },
  { key: 'Event Convenor', value: '', editable: false },
  { key: 'Faculty Coordinator', value: '', editable: false },
  { key: 'Target Audience', value: '', editable: false },
];

export default function CreateReportScreen() {
  const router = useRouter();
  const { generatePdf } = useReportStore();

  // Section 1: Logos
  const [logos, setLogos] = useState<(string | null)[]>([null, null, null, null]);

  // Section 2: Title
  const [title, setTitle] = useState('');

  // Section 3: Event Details
  const [eventDetails, setEventDetails] = useState<EventDetailField[]>(DEFAULT_EVENT_DETAILS);

  // Section 4: Content
  const [contentBlocks, setContentBlocks] = useState<string[]>(['']);

  // Section 5: Images
  const [images, setImages] = useState<(string | null)[]>([null, null]);

  const [isSubmitting, setIsSubmitting] = useState(false);

  // ---------- Logo Helpers ----------
  const pickLogo = async (index: number) => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.8,
      allowsEditing: true,
    });
    if (!result.canceled && result.assets[0]) {
      const updated = [...logos];
      updated[index] = result.assets[0].uri;
      setLogos(updated);
    }
  };

  const addLogoField = () => setLogos([...logos, null]);

  const removeLogoField = (index: number) => {
    if (logos.length <= 1) return;
    setLogos(logos.filter((_, i) => i !== index));
  };

  // ---------- Event Details Helpers ----------
  const updateDetailValue = (index: number, value: string) => {
    const updated = [...eventDetails];
    updated[index] = { ...updated[index], value };
    setEventDetails(updated);
  };

  const updateDetailKey = (index: number, key: string) => {
    const updated = [...eventDetails];
    updated[index] = { ...updated[index], key };
    setEventDetails(updated);
  };

  const addDetailField = () => {
    setEventDetails([...eventDetails, { key: '', value: '', editable: true }]);
  };

  const removeDetailField = (index: number) => {
    setEventDetails(eventDetails.filter((_, i) => i !== index));
  };

  // ---------- Content Helpers ----------
  const updateContent = (index: number, text: string) => {
    const updated = [...contentBlocks];
    updated[index] = text;
    setContentBlocks(updated);
  };

  const addContentBlock = () => setContentBlocks([...contentBlocks, '']);

  const removeContentBlock = (index: number) => {
    if (contentBlocks.length <= 1) return;
    setContentBlocks(contentBlocks.filter((_, i) => i !== index));
  };

  // ---------- Image Helpers ----------
  const pickImage = async (index: number) => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      const updated = [...images];
      updated[index] = result.assets[0].uri;
      setImages(updated);
    }
  };

  const addImageField = () => setImages([...images, null]);

  const removeImageField = (index: number) => {
    if (images.length <= 1) return;
    setImages(images.filter((_, i) => i !== index));
  };

  // ---------- Submit ----------
  const handleSubmit = async () => {
    if (!title.trim()) {
      Alert.alert('Required', 'Please enter a report title.');
      return;
    }

    setIsSubmitting(true);
    try {
      // Step 1: Upload logos
      const uploadedLogos: string[] = [];
      for (const logoUri of logos) {
        if (logoUri) {
          const formData = new FormData();
          formData.append('logo', {
            uri: logoUri,
            type: 'image/jpeg',
            name: 'logo.jpg',
          } as any);
          const { data } = await imageApi.uploadLogo(formData);
          uploadedLogos.push(data.data.url);
        }
      }

      // Step 2: Create the underlying Event
      const getDetail = (key: string) => eventDetails.find((d) => d.key === key)?.value || '';
      
      const newEventData = {
        name: getDetail('Event Name') || title || 'New Event',
        type: 'OTHER',
        department: 'General',
        date: new Date().toISOString(),
        venue: getDetail('Venue of the Event') || 'TBD',
        convener: getDetail('Event Convenor') || 'Admin',
        themeType: 'CORPORATE'
      };
      
      const { data: eventRes } = await eventApi.create(newEventData);
      const newEventId = eventRes.data.event._id;

      // Step 2b: Create the report linked to this new event
      const { data: reportData } = await reportApi.create(newEventId);
      const reportId = reportData.data.report._id;

      // Step 3: Update front page with logos, title, and event details
      const frontPage = {
        logos: uploadedLogos,
        eventTitle: title,
        eventDetails: eventDetails
          .filter((d) => d.key.trim() && d.value.trim())
          .map((d) => ({ key: d.key, value: d.value })),
      };
      await reportApi.updateFrontPage(reportId, frontPage);

      // Step 4: Create sections for each content block
      for (let i = 0; i < contentBlocks.length; i++) {
        const text = contentBlocks[i].trim();
        if (text) {
          const sectionData = {
            type: 'CUSTOM',
            heading: i === 0 ? 'About the Event' : `Section ${i + 1}`,
            content: { paragraphs: [text] },
            sortOrder: i,
          };
          await reportApi.addSection(reportId, sectionData);
        }
      }

      // Step 5: Create a gallery section for images
      const uploadedImages = images.filter((img) => img !== null) as string[];
      if (uploadedImages.length > 0) {
        const galleryData = {
          type: 'GALLERY',
          heading: 'Photographs',
          content: {},
          sortOrder: contentBlocks.length,
        };
        const { data: sectionRes } = await reportApi.addSection(reportId, galleryData);
        const sectionId = sectionRes.data.section._id;

        // Upload images to the gallery section
        for (const imgUri of uploadedImages) {
          const formData = new FormData();
          formData.append('images', {
            uri: imgUri,
            type: 'image/jpeg',
            name: 'photo.jpg',
          } as any);
          await imageApi.upload(sectionId, formData);
        }
      }

      // Step 6: Submit the report
      await reportApi.submit(reportId);

      // Step 7: Generate PDF
      try {
        const pdfUrl = await generatePdf(reportId);
        Alert.alert('Success!', 'Report created and PDF generated.', [
          { text: 'View PDF', onPress: () => Linking.openURL(pdfUrl) },
          { text: 'Done', onPress: () => router.back() },
        ]);
      } catch {
        Alert.alert('Report Created', 'Report was submitted but PDF generation requires Cloudinary configuration.', [
          { text: 'OK', onPress: () => router.back() },
        ]);
      }
    } catch (error: any) {
      console.error('Submit error:', error);
      Alert.alert('Error', error?.response?.data?.message || error.message || 'Failed to create report');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ---------- Render ----------
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      <Text style={styles.pageTitle}>Create Event Report</Text>
      <Text style={styles.pageSubtitle}>Fill in the sections below to generate a styled PDF report</Text>

      {/* ===== SECTION 1: LOGOS ===== */}
      <View style={styles.sectionContainer}>
        <View style={styles.sectionHeader}>
          <Ionicons name="images-outline" size={20} color={colors.primary} />
          <Text style={styles.sectionTitle}>Logos</Text>
        </View>
        <Text style={styles.sectionHint}>The last logo will be the main event highlight in the center of the page.</Text>
        <View style={styles.logoGrid}>
          {logos.map((uri, idx) => (
            <View key={idx} style={styles.logoSlot}>
              <TouchableOpacity style={styles.logoPicker} onPress={() => pickLogo(idx)}>
                {uri ? (
                  <RNImage source={{ uri }} style={styles.logoPreview} />
                ) : (
                  <View style={styles.logoPlaceholder}>
                    <Ionicons name="add" size={28} color={colors.textMuted} />
                    <Text style={styles.logoLabel}>{idx === logos.length - 1 ? 'Main' : `Logo ${idx + 1}`}</Text>
                  </View>
                )}
              </TouchableOpacity>
              {logos.length > 1 && (
                <TouchableOpacity style={styles.removeBtn} onPress={() => removeLogoField(idx)}>
                  <Ionicons name="close-circle" size={20} color={colors.error} />
                </TouchableOpacity>
              )}
            </View>
          ))}
        </View>
        <Button variant="outline" size="sm" title="Add Logo" icon={<Ionicons name="add" size={16} color={colors.primary} />} onPress={addLogoField} style={styles.addBtn} />
      </View>

      {/* ===== SECTION 2: TITLE ===== */}
      <View style={styles.sectionContainer}>
        <View style={styles.sectionHeader}>
          <Ionicons name="text-outline" size={20} color={colors.primary} />
          <Text style={styles.sectionTitle}>Title</Text>
        </View>
        <TextInput
          style={styles.input}
          placeholder="e.g. Expert Session on ER Diagrams"
          placeholderTextColor={colors.textMuted}
          value={title}
          onChangeText={setTitle}
        />
      </View>

      {/* ===== SECTION 3: EVENT DETAILS ===== */}
      <View style={styles.sectionContainer}>
        <View style={styles.sectionHeader}>
          <Ionicons name="list-outline" size={20} color={colors.primary} />
          <Text style={styles.sectionTitle}>Event Details</Text>
        </View>
        <Text style={styles.sectionHint}>Key-value table rendered in the PDF</Text>
        {eventDetails.map((detail, idx) => (
          <View key={idx} style={styles.kvRow}>
            {detail.editable ? (
              <TextInput
                style={[styles.kvKey, styles.kvKeyEditable]}
                value={detail.key}
                onChangeText={(t) => updateDetailKey(idx, t)}
                placeholder="Custom Key"
                placeholderTextColor={colors.textMuted}
              />
            ) : (
              <Text style={styles.kvKey}>{detail.key}</Text>
            )}
            <TextInput
              style={styles.kvValue}
              value={detail.value}
              onChangeText={(t) => updateDetailValue(idx, t)}
              placeholder="Enter value..."
              placeholderTextColor={colors.textMuted}
            />
            {detail.editable && (
              <TouchableOpacity onPress={() => removeDetailField(idx)} style={styles.kvRemove}>
                <Ionicons name="trash-outline" size={18} color={colors.error} />
              </TouchableOpacity>
            )}
          </View>
        ))}
        <Button variant="outline" size="sm" title="Add Field" icon={<Ionicons name="add" size={16} color={colors.primary} />} onPress={addDetailField} style={styles.addBtn} />
      </View>

      {/* ===== SECTION 4: CONTENT ===== */}
      <View style={styles.sectionContainer}>
        <View style={styles.sectionHeader}>
          <Ionicons name="document-text-outline" size={20} color={colors.primary} />
          <Text style={styles.sectionTitle}>Content</Text>
        </View>
        <Text style={styles.sectionHint}>Each block becomes a separate styled card in the PDF</Text>
        {contentBlocks.map((text, idx) => (
          <View key={idx} style={styles.contentBlock}>
            <View style={styles.contentBlockHeader}>
              <Text style={styles.contentBlockLabel}>Block {idx + 1}</Text>
              {contentBlocks.length > 1 && (
                <TouchableOpacity onPress={() => removeContentBlock(idx)}>
                  <Ionicons name="trash-outline" size={18} color={colors.error} />
                </TouchableOpacity>
              )}
            </View>
            <TextInput
              style={styles.textArea}
              value={text}
              onChangeText={(t) => updateContent(idx, t)}
              multiline
              numberOfLines={5}
              placeholder="Enter content for this section..."
              placeholderTextColor={colors.textMuted}
              textAlignVertical="top"
            />
          </View>
        ))}
        <Button variant="outline" size="sm" title="Add Content Block" icon={<Ionicons name="add" size={16} color={colors.primary} />} onPress={addContentBlock} style={styles.addBtn} />
      </View>

      {/* ===== SECTION 5: IMAGES ===== */}
      <View style={styles.sectionContainer}>
        <View style={styles.sectionHeader}>
          <Ionicons name="camera-outline" size={20} color={colors.primary} />
          <Text style={styles.sectionTitle}>Images</Text>
        </View>
        <Text style={styles.sectionHint}>Event photographs for the gallery section</Text>
        <View style={styles.imageGrid}>
          {images.map((uri, idx) => (
            <View key={idx} style={styles.imageSlot}>
              <TouchableOpacity style={styles.imagePicker} onPress={() => pickImage(idx)}>
                {uri ? (
                  <RNImage source={{ uri }} style={styles.imagePreview} />
                ) : (
                  <View style={styles.imagePlaceholder}>
                    <Ionicons name="add" size={28} color={colors.textMuted} />
                  </View>
                )}
              </TouchableOpacity>
              {images.length > 1 && (
                <TouchableOpacity style={styles.removeBtn} onPress={() => removeImageField(idx)}>
                  <Ionicons name="close-circle" size={20} color={colors.error} />
                </TouchableOpacity>
              )}
            </View>
          ))}
        </View>
        <Button variant="outline" size="sm" title="Add Image" icon={<Ionicons name="add" size={16} color={colors.primary} />} onPress={addImageField} style={styles.addBtn} />
      </View>

      {/* ===== SUBMIT ===== */}
      <TouchableOpacity
        style={[styles.submitBtn, isSubmitting && styles.submitBtnDisabled]}
        onPress={handleSubmit}
        disabled={isSubmitting}
      >
        {isSubmitting ? (
          <ActivityIndicator color="white" />
        ) : (
          <>
            <Ionicons name="document-attach" size={22} color="white" />
            <Text style={styles.submitText}>Generate Report</Text>
          </>
        )}
      </TouchableOpacity>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  scrollContent: { padding: spacing.lg },
  pageTitle: { fontSize: fontSize.xxl, fontWeight: fontWeight.bold, color: colors.text, marginBottom: 4 },
  pageSubtitle: { fontSize: fontSize.sm, color: colors.textSecondary, marginBottom: spacing.xl },

  sectionContainer: {
    backgroundColor: colors.bgCard,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm },
  sectionTitle: { fontSize: fontSize.lg, fontWeight: fontWeight.bold, color: colors.text, marginLeft: spacing.sm },
  sectionHint: { fontSize: fontSize.xs, color: colors.textMuted, marginBottom: spacing.md, fontStyle: 'italic' },

  // Logos
  logoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  logoSlot: { position: 'relative' },
  logoPicker: { width: 80, height: 80, borderRadius: borderRadius.md, borderWidth: 2, borderColor: colors.border, borderStyle: 'dashed', overflow: 'hidden' },
  logoPreview: { width: '100%', height: '100%', resizeMode: 'contain' },
  logoPlaceholder: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  logoLabel: { fontSize: 8, color: colors.textMuted, marginTop: 2 },
  removeBtn: { position: 'absolute', top: -6, right: -6, backgroundColor: colors.bgCard, borderRadius: 10 },

  // Inputs
  input: {
    backgroundColor: colors.bg, borderWidth: 1, borderColor: colors.border,
    borderRadius: borderRadius.md, padding: spacing.md,
    fontSize: fontSize.md, color: colors.text,
  },

  // Key-Value rows
  kvRow: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm, gap: spacing.sm },
  kvKey: {
    width: '35%', fontSize: fontSize.sm, fontWeight: fontWeight.semibold,
    color: colors.primary, paddingVertical: spacing.sm,
  },
  kvKeyEditable: {
    backgroundColor: colors.bg, borderWidth: 1, borderColor: colors.border,
    borderRadius: borderRadius.sm, paddingHorizontal: spacing.sm,
  },
  kvValue: {
    flex: 1, backgroundColor: colors.bg, borderWidth: 1, borderColor: colors.border,
    borderRadius: borderRadius.sm, padding: spacing.sm,
    fontSize: fontSize.sm, color: colors.text,
  },
  kvRemove: { padding: 4 },

  // Content blocks
  contentBlock: { marginBottom: spacing.md },
  contentBlockHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.xs },
  contentBlockLabel: { fontSize: fontSize.sm, fontWeight: fontWeight.semibold, color: colors.textSecondary },
  textArea: {
    backgroundColor: colors.bg, borderWidth: 1, borderColor: colors.border,
    borderRadius: borderRadius.md, padding: spacing.md,
    fontSize: fontSize.sm, color: colors.text,
    minHeight: 100,
  },

  // Images
  imageGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  imageSlot: { position: 'relative' },
  imagePicker: { width: 100, height: 100, borderRadius: borderRadius.md, borderWidth: 2, borderColor: colors.border, borderStyle: 'dashed', overflow: 'hidden' },
  imagePreview: { width: '100%', height: '100%', resizeMode: 'cover' },
  imagePlaceholder: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  addBtn: { marginTop: spacing.md, alignSelf: 'flex-start' },

  // Submit
  submitBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: colors.primary, borderRadius: borderRadius.lg,
    padding: spacing.lg, gap: spacing.sm, marginTop: spacing.md,
  },
  submitBtnDisabled: { opacity: 0.6 },
  submitText: { fontSize: fontSize.lg, fontWeight: fontWeight.bold, color: 'white' },
});
