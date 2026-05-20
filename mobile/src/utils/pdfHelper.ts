import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import * as Linking from 'expo-linking';
import { Platform, Alert } from 'react-native';

/**
 * Fixes URLs for the Android emulator.
 * The backend may return URLs containing 'localhost' or '127.0.0.1',
 * which the Android emulator cannot reach. The emulator uses '10.0.2.2'
 * to access the host machine's localhost.
 * 
 * Cloudinary URLs (https://res.cloudinary.com/...) are left untouched.
 */
const fixUrlForEmulator = (url: string): string => {
  if (!url) return url;

  // Cloudinary or other external HTTPS URLs don't need fixing
  if (url.startsWith('https://')) return url;

  if (Platform.OS === 'android') {
    return url
      .replace('http://localhost', 'http://10.0.2.2')
      .replace('http://127.0.0.1', 'http://10.0.2.2');
  }
  return url;
};

/**
 * Ensures the URL has a proper HTTP(S) protocol prefix.
 */
const ensureProtocol = (url: string): string => {
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    return `https://${url}`;
  }
  return url;
};

/**
 * Opens the PDF URL inline for preview.
 * On iOS, this uses the native Safari PDF preview directly.
 * On Android, it uses the Google Docs Viewer to display it inline instead of forcing a download.
 */
export const openPdfPreview = async (url: string) => {
  if (!url) {
    Alert.alert('Error', 'No PDF URL available.');
    return;
  }

  const cleanUrl = fixUrlForEmulator(ensureProtocol(url));

  if (Platform.OS === 'android') {
    // For Cloudinary URLs, Google Docs Viewer works great
    if (cleanUrl.startsWith('https://')) {
      const googleDocsUrl = `https://docs.google.com/viewer?url=${encodeURIComponent(cleanUrl)}`;
      try {
        await Linking.openURL(googleDocsUrl);
        return;
      } catch (e) {
        console.warn('Failed to open PDF in Google Docs Viewer', e);
      }
    }

    // For local/emulator URLs, download first then share
    try {
      await downloadAndSharePdf(cleanUrl, 'preview-report.pdf');
    } catch (err) {
      // Last resort: try direct open
      try {
        await Linking.openURL(cleanUrl);
      } catch {
        Alert.alert('Error', 'Failed to open PDF. Please try the Download option instead.');
      }
    }
  } else {
    try {
      await Linking.openURL(cleanUrl);
    } catch (err) {
      Alert.alert('Error', 'Failed to open PDF link.');
    }
  }
};

/**
 * Downloads the PDF to the device's document directory and opens the native Share sheet.
 * This allows users on both Android and iOS to:
 * 1. Save the file to their local filesystem (e.g. "Save to Files", "Save to Downloads").
 * 2. Send it to other applications (WhatsApp, Gmail, Slack, etc.).
 */
export const downloadAndSharePdf = async (url: string, filename: string) => {
  if (!url) {
    Alert.alert('Error', 'No PDF URL available to download.');
    return;
  }

  const cleanUrl = fixUrlForEmulator(ensureProtocol(url));

  try {
    const isSharingAvailable = await Sharing.isAvailableAsync();
    if (!isSharingAvailable) {
      Alert.alert('Sharing Unavailable', 'Opening PDF in browser instead.');
      await Linking.openURL(cleanUrl);
      return;
    }

    const localUri = FileSystem.documentDirectory + filename;

    console.log('[PDF Helper] Downloading from:', cleanUrl);
    console.log('[PDF Helper] Saving to:', localUri);

    const downloadResult = await FileSystem.downloadAsync(cleanUrl, localUri);
    
    if (downloadResult.status !== 200) {
      throw new Error(`Download failed with status ${downloadResult.status}`);
    }

    console.log('[PDF Helper] Download complete, opening share sheet');
    
    await Sharing.shareAsync(downloadResult.uri, {
      mimeType: 'application/pdf',
      dialogTitle: 'Save or Share PDF Report',
    });
  } catch (error: any) {
    console.error('[PDF Helper] Download and share error:', error);
    
    // If download fails, try opening the URL directly in browser
    Alert.alert(
      'Download Failed',
      'Could not download the PDF file. Would you like to open it in a browser instead?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Open in Browser', 
          onPress: () => Linking.openURL(cleanUrl).catch(() => {
            Alert.alert('Error', 'Failed to open PDF.');
          })
        },
      ]
    );
  }
};
