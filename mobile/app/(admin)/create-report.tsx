import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity,
  Alert, ActivityIndicator, Image as RNImage,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { openPdfPreview, downloadAndSharePdf } from '../../src/utils/pdfHelper';
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

  // Section 0: Theme selector state
  const [themeType, setThemeType] = useState<'CORPORATE' | 'CULTURAL' | 'TECHNICAL' | 'SEMINAR' | 'SUSTAINABLE'>('CORPORATE');

  // Section 1: Logos
  const [logos, setLogos] = useState<(string | null)[]>([null, null, null, null]);

  // Section 2: Title
  const [title, setTitle] = useState('');

  // Section 3: Event Details
  const [eventDetails, setEventDetails] = useState<EventDetailField[]>(DEFAULT_EVENT_DETAILS);

  interface ContentBlock {
    heading: string;
    text: string;
    images: (string | null)[];
  }

  // Section 4: Content blocks (sections containing Heading, Text, and Photos)
  const [contentBlocks, setContentBlocks] = useState<ContentBlock[]>([
    { heading: 'About the Event', text: '', images: [null, null] }
  ]);

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

  // ---------- Content Blocks Helpers ----------
  const updateBlockHeading = (index: number, heading: string) => {
    const updated = [...contentBlocks];
    updated[index] = { ...updated[index], heading };
    setContentBlocks(updated);
  };

  const updateBlockText = (index: number, text: string) => {
    const updated = [...contentBlocks];
    updated[index] = { ...updated[index], text };
    setContentBlocks(updated);
  };

  const addContentBlock = () => {
    setContentBlocks([
      ...contentBlocks,
      { heading: `Section ${contentBlocks.length + 1}`, text: '', images: [null, null] }
    ]);
  };

  const removeContentBlock = (index: number) => {
    if (contentBlocks.length <= 1) return;
    setContentBlocks(contentBlocks.filter((_, i) => i !== index));
  };

  const moveBlockUp = (index: number) => {
    if (index === 0) return;
    const updated = [...contentBlocks];
    const temp = updated[index];
    updated[index] = updated[index - 1];
    updated[index - 1] = temp;
    setContentBlocks(updated);
  };

  const moveBlockDown = (index: number) => {
    if (index === contentBlocks.length - 1) return;
    const updated = [...contentBlocks];
    const temp = updated[index];
    updated[index] = updated[index + 1];
    updated[index + 1] = temp;
    setContentBlocks(updated);
  };

  // ---------- Block Images Helpers ----------
  const pickBlockImage = async (blockIdx: number, imgIdx: number) => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      const updatedBlocks = [...contentBlocks];
      const updatedImages = [...updatedBlocks[blockIdx].images];
      updatedImages[imgIdx] = result.assets[0].uri;
      updatedBlocks[blockIdx] = { ...updatedBlocks[blockIdx], images: updatedImages };
      setContentBlocks(updatedBlocks);
    }
  };

  const addBlockImageField = (blockIdx: number) => {
    const updatedBlocks = [...contentBlocks];
    const updatedImages = [...updatedBlocks[blockIdx].images, null];
    updatedBlocks[blockIdx] = { ...updatedBlocks[blockIdx], images: updatedImages };
    setContentBlocks(updatedBlocks);
  };

  const removeBlockImageField = (blockIdx: number, imgIdx: number) => {
    const updatedBlocks = [...contentBlocks];
    if (updatedBlocks[blockIdx].images.length <= 1) return;
    const updatedImages = updatedBlocks[blockIdx].images.filter((_, i) => i !== imgIdx);
    updatedBlocks[blockIdx] = { ...updatedBlocks[blockIdx], images: updatedImages };
    setContentBlocks(updatedBlocks);
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

      // Step 2: Create the Event (using selected theme type)
      const getDetail = (key: string) => eventDetails.find((d) => d.key === key)?.value || '';

      const newEventData = {
        name: getDetail('Event Name') || title || 'New Event',
        type: 'OTHER',
        department: 'General',
        date: new Date().toISOString(),
        venue: getDetail('Venue of the Event') || 'TBD',
        convener: getDetail('Event Convenor') || 'Admin',
        themeType: themeType,
      };

      const { data: eventRes } = await eventApi.create(newEventData);
      const newEventId = eventRes.data.event._id;

      // Step 3: Create the report
      const { data: reportData } = await reportApi.create(newEventId);
      const reportId = reportData.data.report._id;

      // Step 4: Update front page
      const frontPage = {
        logos: uploadedLogos,
        eventTitle: title,
        eventDetails: eventDetails
          .filter((d) => d.key.trim() && d.value.trim())
          .map((d) => ({ key: d.key, value: d.value })),
      };
      await reportApi.updateFrontPage(reportId, frontPage);

      // Step 5: Save sections and upload images section-by-section
      for (let i = 0; i < contentBlocks.length; i++) {
        const block = contentBlocks[i];
        const text = block.text.trim();
        // Create section if it has text or images
        if (text || block.images.some((img) => img !== null)) {
          const sectionData = {
            type: i === 0 ? 'ABOUT' : 'CUSTOM',
            heading: block.heading.trim() || `Section ${i + 1}`,
            content: { paragraphs: text ? [text] : [] },
            sortOrder: i,
          };
          const { data: sectionRes } = await reportApi.addSection(reportId, sectionData);
          const sectionId = sectionRes.data.section._id;

          // Upload images for this section
          const sectionImages = block.images.filter((img) => img !== null) as string[];
          for (const imgUri of sectionImages) {
            const formData = new FormData();
            formData.append('images', {
              uri: imgUri,
              type: 'image/jpeg',
              name: 'photo.jpg',
            } as any);
            await imageApi.upload(sectionId, formData);
          }
        }
      }

      // Step 6: Submit the report
      await reportApi.submit(reportId);

      // Step 7: Generate PDF
      try {
        const pdfUrl = await generatePdf(reportId);
        Alert.alert('Success!', 'Report created and PDF generated.', [
          { text: 'Preview PDF', onPress: () => openPdfPreview(pdfUrl) },
          { text: 'Download PDF', onPress: () => downloadAndSharePdf(pdfUrl, `report-${reportId}.pdf`) },
          { text: 'Done', onPress: () => router.back() },
        ]);
      } catch {
        Alert.alert('Report Created', 'Report was submitted but PDF generation failed. You can try generating the PDF later from the Reports tab.', [
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

      {/* ===== SECTION 0: THEME SELECTOR ===== */}
      <View style={styles.sectionContainer}>
        <View style={styles.sectionHeader}>
          <Ionicons name="color-palette-outline" size={20} color={colors.primary} />
          <Text style={styles.sectionTitle}>Select Report Theme</Text>
        </View>
        <Text style={styles.sectionHint}>Select the theme style to be applied to the background and layout</Text>
        <View style={styles.themeGrid}>
          {(['CORPORATE', 'CULTURAL', 'TECHNICAL', 'SEMINAR', 'SUSTAINABLE'] as const).map((t) => (
            <TouchableOpacity
              key={t}
              style={[
                styles.themeBtn,
                themeType === t && styles.themeBtnActive,
              ]}
              onPress={() => setThemeType(t)}
            >
              <Text style={[styles.themeBtnText, themeType === t && styles.themeBtnTextActive]}>
                {t === 'CORPORATE' ? 'Default (Corporate)' : t.charAt(0) + t.slice(1).toLowerCase()}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

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

      {/* ===== SECTION 4: CONTENT CARDS ===== */}
      <View style={styles.sectionContainer}>
        <View style={styles.sectionHeader}>
          <Ionicons name="document-text-outline" size={20} color={colors.primary} />
          <Text style={styles.sectionTitle}>Content Sections</Text>
        </View>
        <Text style={styles.sectionHint}>Each card becomes a rounded card over the parent background. You can add images directly to each section.</Text>
        {contentBlocks.map((block, idx) => (
          <View key={idx} style={styles.blockCard}>
            <View style={styles.blockHeader}>
              <View style={styles.blockControlsLeft}>
                <Text style={styles.blockLabel}>Section {idx + 1}</Text>
                <View style={styles.reorderButtons}>
                  <TouchableOpacity onPress={() => moveBlockUp(idx)} disabled={idx === 0} style={[styles.reorderBtn, idx === 0 && styles.disabledBtn]}>
                    <Ionicons name="arrow-up" size={16} color={idx === 0 ? colors.textMuted : colors.primary} />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => moveBlockDown(idx)} disabled={idx === contentBlocks.length - 1} style={[styles.reorderBtn, idx === contentBlocks.length - 1 && styles.disabledBtn]}>
                    <Ionicons name="arrow-down" size={16} color={idx === contentBlocks.length - 1 ? colors.textMuted : colors.primary} />
                  </TouchableOpacity>
                </View>
              </View>
              {contentBlocks.length > 1 && (
                <TouchableOpacity onPress={() => removeContentBlock(idx)}>
                  <Ionicons name="trash-outline" size={18} color={colors.error} />
                </TouchableOpacity>
              )}
            </View>

            <TextInput
              style={[styles.input, { marginBottom: spacing.sm }]}
              placeholder="Section Heading (e.g. About the Event)"
              placeholderTextColor={colors.textMuted}
              value={block.heading}
              onChangeText={(t) => updateBlockHeading(idx, t)}
            />

            <TextInput
              style={styles.textArea}
              value={block.text}
              onChangeText={(t) => updateBlockText(idx, t)}
              multiline
              numberOfLines={4}
              placeholder="Enter section content text..."
              placeholderTextColor={colors.textMuted}
              textAlignVertical="top"
            />

            {/* Section Images Grid */}
            <Text style={styles.blockSubLabel}>Section Photos</Text>
            <View style={styles.blockImageGrid}>
              {block.images.map((uri, imgIdx) => (
                <View key={imgIdx} style={styles.logoSlot}>
                  <TouchableOpacity style={styles.blockImagePicker} onPress={() => pickBlockImage(idx, imgIdx)}>
                    {uri ? (
                      <RNImage source={{ uri }} style={styles.logoPreview} />
                    ) : (
                      <View style={styles.logoPlaceholder}>
                        <Ionicons name="add" size={20} color={colors.textMuted} />
                        <Text style={{ fontSize: 8, color: colors.textMuted }}>Photo {imgIdx + 1}</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                  {block.images.length > 1 && (
                    <TouchableOpacity style={styles.removeBtn} onPress={() => removeBlockImageField(idx, imgIdx)}>
                      <Ionicons name="close-circle" size={16} color={colors.error} />
                    </TouchableOpacity>
                  )}
                </View>
              ))}
              <TouchableOpacity style={styles.addPhotoBtn} onPress={() => addBlockImageField(idx)}>
                <Ionicons name="add" size={20} color={colors.primary} />
                <Text style={styles.addPhotoBtnText}>Add Slot</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
        <Button variant="outline" size="sm" title="Add Section Card" icon={<Ionicons name="add" size={16} color={colors.primary} />} onPress={addContentBlock} style={styles.addBtn} />
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

  // Themes
  themeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.xs },
  themeBtn: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.bg,
  },
  themeBtnActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  themeBtnText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    fontWeight: fontWeight.semibold,
  },
  themeBtnTextActive: {
    color: '#FFFFFF',
  },

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

  // Content cards / blocks
  blockCard: {
    backgroundColor: colors.bgElevated,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  blockHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  blockControlsLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  blockLabel: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: colors.text,
  },
  reorderButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  reorderBtn: {
    padding: 4,
    backgroundColor: colors.bg,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  disabledBtn: {
    opacity: 0.5,
  },
  blockSubLabel: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
    color: colors.textSecondary,
    marginTop: spacing.md,
    marginBottom: spacing.xs,
    textTransform: 'uppercase',
  },
  blockImageGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    alignItems: 'center',
  },
  blockImagePicker: {
    width: 60,
    height: 60,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: 'dashed',
    overflow: 'hidden',
  },
  addPhotoBtn: {
    width: 60,
    height: 60,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: colors.primary,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addPhotoBtnText: {
    fontSize: 8,
    color: colors.primary,
    fontWeight: fontWeight.bold,
    marginTop: 2,
  },
  textArea: {
    backgroundColor: colors.bg, borderWidth: 1, borderColor: colors.border,
    borderRadius: borderRadius.md, padding: spacing.md,
    fontSize: fontSize.sm, color: colors.text,
    minHeight: 80,
  },

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
