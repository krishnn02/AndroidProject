import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity,
  Alert, ActivityIndicator, Image as RNImage,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { downloadAndSharePdf } from '../../src/utils/pdfHelper';
import { useRouter, useLocalSearchParams } from 'expo-router';
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
  { key: 'Date', value: '', editable: false },
  { key: 'Venue', value: '', editable: false },
  { key: 'Event Type', value: '', editable: false },
  { key: 'Organized By', value: '', editable: false },
  { key: 'Event Objectives', value: '', editable: false },
  { key: 'Eminent Judges / Guests', value: '', editable: false },
  { key: 'Convener', value: '', editable: false },
  { key: 'Co-Convener', value: '', editable: false },
  { key: 'Program Faculty Coordinators', value: '', editable: false },
  { key: 'Supporting Faculty Members', value: '', editable: false },
  { key: 'Program Student Coordinators/ Volunteers', value: '', editable: false },
  { key: 'Social Media Coverage Link', value: '', editable: false },
];

const STANDARD_SECTIONS = [
  'About the Event',
  'Event Objectives',
  'Eminent Judges / Guests',
  'Key Outcomes / Highlights',
  'Social Media Coverage',
  'Photographs / Media / Reel',
  'Feedback Summary (Optional)',
  'Conclusion',
];

const THEMES = [
  { id: 'CORPORATE', name: 'Corporate (Default)', desc: 'Executive navy & royal blue accents. Professional & clean.', colors: ['#1E3A8A', '#3B82F6', '#64748B'] },
  { id: 'CULTURAL', name: 'Cultural / Creative', desc: 'Warm magenta & gold tones. Elegant & artistic.', colors: ['#9D174D', '#F59E0B', '#EF4444'] },
  { id: 'TECHNICAL', name: 'Technical / Modern', desc: 'Teal, slate gray & code accents. Sleek & futuristic.', colors: ['#0F766E', '#06B6D4', '#1E293B'] },
  { id: 'SEMINAR', name: 'Academic Seminar', desc: 'Indigo & classic blue borders. Formal & structural.', colors: ['#4338CA', '#6366F1', '#475569'] },
  { id: 'SUSTAINABLE', name: 'Sustainable / Eco', desc: 'Light to dark green gradient accents.', colors: ['#86EFAC', '#22C55E', '#14532D'] },
  { id: 'AQUA', name: 'Aqua Wave', desc: 'Deep sea blue and cyan accents. Fluid & refreshing.', colors: ['#67E8F9', '#06B6D4', '#083344'] },
] as const;

interface ContentBlock {
  _id?: string;
  heading: string;
  text: string;
  images: (string | null)[];
  originalImages?: any[];
}

export default function CreateReportScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const eventId = params.eventId as string;
  const reportId = params.reportId as string;

  const { generatePdf } = useReportStore();

  const [isLoadingData, setIsLoadingData] = useState(true);

  // Section 0: Theme selector state
  const [themeType, setThemeType] = useState<'CORPORATE' | 'CULTURAL' | 'TECHNICAL' | 'SEMINAR' | 'SUSTAINABLE' | 'AQUA'>('CORPORATE');

  // Section 1: Logos
  const [logos, setLogos] = useState<(string | null)[]>([null, null, null, null, null]);

  // Section 2: Title
  const [title, setTitle] = useState('');

  // Section 3: Event Details
  const [eventDetails, setEventDetails] = useState<EventDetailField[]>(DEFAULT_EVENT_DETAILS);

  // Section 4: Content blocks
  const [contentBlocks, setContentBlocks] = useState<ContentBlock[]>(
    STANDARD_SECTIONS.map(heading => ({ heading, text: '', images: [null, null] }))
  );

  // Track deleted sections
  const [deletedSectionIds, setDeletedSectionIds] = useState<string[]>([]);

  // Validation States
  const [titleError, setTitleError] = useState('');
  const [detailsErrors, setDetailsErrors] = useState<string[]>([]);
  const [blocksErrors, setBlocksErrors] = useState<{ heading?: string; text?: string }[]>([]);

  const [isSubmitting, setIsSubmitting] = useState(false);

  // ---------- Fetch Event & Report Details ----------
  useEffect(() => {
    const loadAllData = async () => {
      if (!eventId) {
        Alert.alert('Error', 'Missing Event ID.');
        router.back();
        return;
      }
      setIsLoadingData(true);
      try {
        // Fetch Event Details
        const { data: eventRes } = await eventApi.getById(eventId);
        const event = eventRes.data.event;
        setThemeType(event.themeType || 'CORPORATE');

        // Formulate pre-populated values from the event object
        const prepopulated = {
          'Event Name': event.name || '',
          'Date': event.date && !isNaN(Date.parse(event.date)) ? new Date(event.date).toISOString().split('T')[0] : '',
          'Venue': event.venue || '',
          'Event Type': event.type || '',
          'Organized By': event.department || '',
          'Event Objectives': '',
          'Eminent Judges / Guests': '',
          'Convener': event.convener || '',
          'Co-Convener': event.coConvener || '',
          'Program Faculty Coordinators': event.facultyCoordinator || '',
          'Supporting Faculty Members': '',
          'Program Student Coordinators/ Volunteers': [event.studentCoordinator, ...(event.volunteers || [])].filter(Boolean).join(', '),
          'Social Media Coverage Link': event.socialMediaLinks ? Object.values(event.socialMediaLinks).join(', ') : '',
        };

        if (reportId) {
          // Fetch existing report
          const { data: reportRes } = await reportApi.getById(reportId);
          const report = reportRes.data.report;

          setTitle(report.frontPage?.eventTitle || event.name || '');

          // Setup logos
          const savedLogos = report.frontPage?.logos || [];
          const paddedLogos = [...savedLogos];
          while (paddedLogos.length < 5) {
            paddedLogos.push(null);
          }
          setLogos(paddedLogos);

          // Setup details (Key-Value)
          const savedDetails = report.frontPage?.eventDetails || [];
          const finalDetails = DEFAULT_EVENT_DETAILS.map(defField => {
            const saved = savedDetails.find((d: any) => d.key === defField.key);
            const fallbackValue = prepopulated[defField.key as keyof typeof prepopulated] || '';
            return { ...defField, value: saved ? saved.value : fallbackValue };
          });

          // Append any custom keys that aren't in the default details
          savedDetails.forEach((d: any) => {
            if (!DEFAULT_EVENT_DETAILS.some(def => def.key === d.key)) {
              finalDetails.push({ key: d.key, value: d.value, editable: true });
            }
          });
          setEventDetails(finalDetails);

          // Setup sections
          const savedSections = report.sections || [];
          const sorted = [...savedSections].sort((a, b) => a.sortOrder - b.sortOrder);
          const savedBlocks = sorted.map((sec: any) => ({
            _id: sec._id,
            heading: sec.heading || '',
            text: sec.content?.paragraphs?.join('\n\n') || '',
            images: sec.images?.map((img: any) => img.url) || [null, null],
            originalImages: sec.images || []
          }));

          const finalBlocks = [...savedBlocks];
          STANDARD_SECTIONS.forEach(heading => {
            if (!savedBlocks.some(b => b.heading.toLowerCase() === heading.toLowerCase())) {
              finalBlocks.push({
                _id: undefined,
                heading,
                text: '',
                images: [null, null],
                originalImages: []
              });
            }
          });
          setContentBlocks(finalBlocks);
        } else {
          // New report creation scenario
          setTitle(event.name || '');
          const initialDetails = DEFAULT_EVENT_DETAILS.map(field => ({
            ...field,
            value: prepopulated[field.key as keyof typeof prepopulated] || ''
          }));
          setEventDetails(initialDetails);
        }
      } catch (err: any) {
        console.error('Failed to load data:', err);
        Alert.alert('Error', 'Failed to retrieve event or report details.');
      } finally {
        setIsLoadingData(false);
      }
    };

    loadAllData();
  }, [eventId, reportId]);

  // ---------- Logo Helpers ----------
  const pickLogo = async (index: number) => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.8,
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
    setDetailsErrors([...detailsErrors, '']);
  };

  const removeDetailField = (index: number) => {
    setEventDetails(eventDetails.filter((_, i) => i !== index));
    setDetailsErrors(detailsErrors.filter((_, i) => i !== index));
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
    setBlocksErrors([...blocksErrors, {}]);
  };

  const removeContentBlock = (index: number) => {
    if (contentBlocks.length <= 1) return;
    const block = contentBlocks[index];
    if (block._id) {
      setDeletedSectionIds([...deletedSectionIds, block._id]);
    }
    setContentBlocks(contentBlocks.filter((_, i) => i !== index));
    setBlocksErrors(blocksErrors.filter((_, i) => i !== index));
  };

  const moveBlockUp = (index: number) => {
    if (index === 0) return;
    const updated = [...contentBlocks];
    const temp = updated[index];
    updated[index] = updated[index - 1];
    updated[index - 1] = temp;
    setContentBlocks(updated);

    const updatedErr = [...blocksErrors];
    const tempErr = updatedErr[index];
    updatedErr[index] = updatedErr[index - 1];
    updatedErr[index - 1] = tempErr;
    setBlocksErrors(updatedErr);
  };

  const moveBlockDown = (index: number) => {
    if (index === contentBlocks.length - 1) return;
    const updated = [...contentBlocks];
    const temp = updated[index];
    updated[index] = updated[index + 1];
    updated[index + 1] = temp;
    setContentBlocks(updated);

    const updatedErr = [...blocksErrors];
    const tempErr = updatedErr[index];
    updatedErr[index] = updatedErr[index + 1];
    updatedErr[index + 1] = tempErr;
    setBlocksErrors(updatedErr);
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
    let hasError = false;
    setTitleError('');
    setDetailsErrors([]);
    setBlocksErrors([]);

    if (!title.trim()) {
      setTitleError('Report Title is required.');
      hasError = true;
    } else if (title.trim().length < 3) {
      setTitleError('Report Title must be at least 3 characters.');
      hasError = true;
    }

    const newDetailsErrors = eventDetails.map((detail) => {
      if (detail.editable) {
        if (!detail.key.trim() && !detail.value.trim()) {
          return 'Both key and value must be filled, or remove this field.';
        }
        if (!detail.key.trim()) {
          return 'Field key is required.';
        }
        if (!detail.value.trim()) {
          return 'Field value is required.';
        }
      }
      return '';
    });
    if (newDetailsErrors.some(err => err !== '')) {
      setDetailsErrors(newDetailsErrors);
      hasError = true;
    }

    const newBlocksErrors = contentBlocks.map((block) => {
      const err: { heading?: string; text?: string } = {};
      if (!block.heading.trim()) {
        err.heading = 'Section heading is required.';
      }
      return err;
    });
    if (newBlocksErrors.some(err => err.heading)) {
      setBlocksErrors(newBlocksErrors);
      hasError = true;
    }

    if (hasError) {
      return;
    }

    setIsSubmitting(true);
    try {
      // Step 1: Upload logos
      const uploadedLogos: string[] = [];
      for (const logoUri of logos) {
        if (logoUri) {
          if (logoUri.startsWith('http')) {
            uploadedLogos.push(logoUri);
          } else {
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
      }

      // Step 2: Update event theme selection
      await eventApi.update(eventId, { themeType });

      // Step 3: Fetch/create report draft
      let activeReportId = reportId;
      if (!activeReportId) {
        const { data: reportRes } = await reportApi.create(eventId);
        activeReportId = reportRes.data.report._id;
      }

      // Step 4: Update front page
      const frontPage = {
        logos: uploadedLogos,
        eventTitle: title,
        eventDetails: eventDetails
          .filter((d) => d.key.trim() && d.value.trim())
          .map((d) => ({ key: d.key, value: d.value })),
      };
      await reportApi.updateFrontPage(activeReportId, frontPage);

      // Step 5: Delete sections marked for deletion
      for (const sId of deletedSectionIds) {
        try {
          await reportApi.deleteSection(sId);
        } catch (e) {
          console.error(`Failed to delete section ${sId}`, e);
        }
      }

      // Step 6: Save sections and upload images section-by-section
      for (let i = 0; i < contentBlocks.length; i++) {
        const block = contentBlocks[i];
        const text = block.text.trim();
        
        if (block._id) {
          // Update existing section
          await reportApi.updateSection(block._id, {
            heading: block.heading.trim() || `Section ${i + 1}`,
            content: { paragraphs: text ? [text] : [] },
            sortOrder: i,
          });

          // Check if any original images were deleted
          const remainingUrls = block.images.filter(img => img && img.startsWith('http'));
          const originalImages = block.originalImages || [];
          const removedImages = originalImages.filter((orig: any) => !remainingUrls.includes(orig.url));

          for (const img of removedImages) {
            try {
              await imageApi.delete(img._id);
            } catch (err) {
              console.error('Failed to delete image:', img._id, err);
            }
          }

          // Upload new local images for this section
          const newLocalImages = block.images.filter(img => img && !img.startsWith('http')) as string[];
          for (const imgUri of newLocalImages) {
            const formData = new FormData();
            formData.append('images', {
              uri: imgUri,
              type: 'image/jpeg',
              name: 'photo.jpg',
            } as any);
            await imageApi.upload(block._id, formData);
          }

        } else {
          // Create new section
          if (text || block.images.some((img) => img !== null)) {
            const sectionData = {
              type: i === 0 ? 'ABOUT' : 'CUSTOM',
              heading: block.heading.trim() || `Section ${i + 1}`,
              content: { paragraphs: text ? [text] : [] },
              sortOrder: i,
            };
            const { data: sectionRes } = await reportApi.addSection(activeReportId, sectionData);
            const sectionId = sectionRes.data.section._id;

            // Upload images for this section
            const sectionImages = block.images.filter((img) => img !== null && !img.startsWith('http')) as string[];
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
      }

      // Step 7: Submit the report
      await reportApi.submit(activeReportId);

      // Step 8: Generate PDF
      try {
        const pdfUrl = await generatePdf(activeReportId);
        Alert.alert('Success!', 'Report created and PDF generated.', [

          { text: 'Download PDF', onPress: () => downloadAndSharePdf(pdfUrl, `report-${activeReportId}.pdf`) },
          { text: 'Done', onPress: () => router.back() },
        ]);
      } catch {
        Alert.alert('Report Saved', 'Report was submitted successfully but PDF generation failed. You can try generating the PDF later from the Reports tab.', [
          { text: 'OK', onPress: () => router.back() },
        ]);
      }
    } catch (error: any) {
      console.error('Submit error:', error);
      Alert.alert('Error', error?.response?.data?.message || error.message || 'Failed to submit report');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ---------- Render Loading ----------
  if (isLoadingData) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={{ marginTop: spacing.md, color: colors.textSecondary }}>Loading details...</Text>
      </View>
    );
  }

  // ---------- Render Content ----------
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      <Text style={styles.pageTitle}>{reportId ? 'Edit Event Report' : 'Create Event Report'}</Text>
      <Text style={styles.pageSubtitle}>Fill in the sections below to generate a styled PDF report</Text>

      {/* ===== SECTION 0: THEME SELECTOR ===== */}
      <View style={styles.sectionContainer}>
        <View style={styles.sectionHeader}>
          <Ionicons name="color-palette-outline" size={20} color={colors.primary} />
          <Text style={styles.sectionTitle}>Select Report Theme</Text>
        </View>
        <Text style={styles.sectionHint}>Select the theme style to be applied to the background and layout</Text>
        <View style={styles.themeList}>
          {THEMES.map((theme) => {
            const isSelected = themeType === theme.id;
            return (
              <TouchableOpacity
                key={theme.id}
                style={[
                  styles.themeCard,
                  isSelected && styles.themeCardActive,
                ]}
                onPress={() => setThemeType(theme.id)}
              >
                <View style={styles.themeCardHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.themeCardName, isSelected && styles.themeCardNameActive]}>
                      {theme.name}
                    </Text>
                    <Text style={[styles.themeCardDesc, isSelected && styles.themeCardDescActive]}>
                      {theme.desc}
                    </Text>
                  </View>
                  <View style={styles.colorSwatches}>
                    {theme.colors.map((c, idx) => (
                      <View key={idx} style={[styles.colorDot, { backgroundColor: c, marginLeft: idx === 0 ? 0 : -6 }]} />
                    ))}
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}
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
                    <Ionicons name="cloud-upload-outline" size={28} color={colors.primary} />
                    <Text style={[styles.logoLabel, { color: colors.primary, marginTop: 4, textAlign: 'center' }]}>
                      {idx === logos.length - 1 ? 'Tap to add\nMain Logo' : `Tap to add\nLogo ${idx + 1}`}
                    </Text>
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
          style={[styles.input, titleError ? styles.inputError : null]}
          placeholder="e.g. Expert Session on ER Diagrams"
          placeholderTextColor={colors.textMuted}
          value={title}
          onChangeText={(val) => {
            setTitle(val);
            if (titleError) setTitleError('');
          }}
        />
        {titleError ? <Text style={styles.errorText}>{titleError}</Text> : null}
      </View>

      {/* ===== SECTION 3: EVENT DETAILS ===== */}
      <View style={styles.sectionContainer}>
        <View style={styles.sectionHeader}>
          <Ionicons name="list-outline" size={20} color={colors.primary} />
          <Text style={styles.sectionTitle}>Event Details</Text>
        </View>
        <Text style={styles.sectionHint}>Key-value table rendered in the PDF</Text>
        {eventDetails.map((detail, idx) => (
          <View key={idx} style={{ marginBottom: spacing.md }}>
            <View style={styles.kvRow}>
              {detail.editable ? (
                <TextInput
                  style={[
                    styles.kvKey,
                    styles.kvKeyEditable,
                    detailsErrors[idx] ? styles.inputError : null
                  ]}
                  value={detail.key}
                  onChangeText={(t) => {
                    updateDetailKey(idx, t);
                    if (detailsErrors[idx]) {
                      const updated = [...detailsErrors];
                      updated[idx] = '';
                      setDetailsErrors(updated);
                    }
                  }}
                  placeholder="Custom Key"
                  placeholderTextColor={colors.textMuted}
                />
              ) : (
                <Text style={styles.kvKey}>{detail.key}</Text>
              )}
              <TextInput
                style={[
                  styles.kvValue,
                  detailsErrors[idx] ? styles.inputError : null
                ]}
                value={detail.value}
                onChangeText={(t) => {
                  updateDetailValue(idx, t);
                  if (detailsErrors[idx]) {
                    const updated = [...detailsErrors];
                    updated[idx] = '';
                    setDetailsErrors(updated);
                  }
                }}
                placeholder="Enter value..."
                placeholderTextColor={colors.textMuted}
              />
              {detail.editable && (
                <TouchableOpacity onPress={() => removeDetailField(idx)} style={styles.kvRemove}>
                  <Ionicons name="trash-outline" size={18} color={colors.error} />
                </TouchableOpacity>
              )}
            </View>
            {detailsErrors[idx] ? <Text style={styles.errorText}>{detailsErrors[idx]}</Text> : null}
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
              style={[
                styles.input,
                { marginBottom: spacing.xs },
                blocksErrors[idx]?.heading ? styles.inputError : null
              ]}
              placeholder="Section Heading (e.g. About the Event)"
              placeholderTextColor={colors.textMuted}
              value={block.heading}
              onChangeText={(t) => {
                updateBlockHeading(idx, t);
                if (blocksErrors[idx]?.heading) {
                  const updated = [...blocksErrors];
                  updated[idx] = { ...updated[idx], heading: undefined };
                  setBlocksErrors(updated);
                }
              }}
            />
            {blocksErrors[idx]?.heading ? <Text style={[styles.errorText, { marginBottom: spacing.sm }]}>{blocksErrors[idx].heading}</Text> : null}

            <TextInput
              style={[
                styles.textArea,
                blocksErrors[idx]?.text ? styles.inputError : null
              ]}
              value={block.text}
              onChangeText={(t) => {
                updateBlockText(idx, t);
                if (blocksErrors[idx]?.text) {
                  const updated = [...blocksErrors];
                  updated[idx] = { ...updated[idx], text: undefined };
                  setBlocksErrors(updated);
                }
              }}
              multiline
              numberOfLines={4}
              placeholder="Enter section content text..."
              placeholderTextColor={colors.textMuted}
              textAlignVertical="top"
            />
            {blocksErrors[idx]?.text ? <Text style={[styles.errorText, { marginTop: spacing.xs }]}>{blocksErrors[idx].text}</Text> : null}

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
            <Text style={styles.submitText}>{reportId ? 'Save & Submit Report' : 'Generate Report'}</Text>
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
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },

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
  inputError: {
    borderColor: colors.error,
  },
  errorText: {
    color: colors.error,
    fontSize: fontSize.xs,
    marginTop: spacing.xs,
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

  // New Theme Card Styles
  themeList: {
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  themeCard: {
    backgroundColor: colors.bg,
    borderRadius: borderRadius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    padding: spacing.md,
  },
  themeCardActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + '08',
  },
  themeCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  themeCardName: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: colors.text,
    marginBottom: 2,
  },
  themeCardNameActive: {
    color: colors.primary,
  },
  themeCardDesc: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    lineHeight: 16,
  },
  themeCardDescActive: {
    color: colors.text,
  },
  colorSwatches: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  colorDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 1.5,
    borderColor: colors.bgCard,
  },
});
