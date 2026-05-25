import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import * as Linking from 'expo-linking';
import { Platform, Alert } from 'react-native';
import * as SecureStore from 'expo-secure-store';

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
 * Downloads the document to the device's local system.
 */
export const downloadAndSharePdf = async (url: string, filename: string) => {
  if (!url) {
    Alert.alert('Error', 'No URL available to download.');
    return;
  }

  const cleanUrl = fixUrlForEmulator(ensureProtocol(url));

  try {
    const isDocx = filename.endsWith('.docx');
    const mimeType = isDocx 
        ? 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' 
        : 'application/pdf';

    const token = await SecureStore.getItemAsync('accessToken');
    const headers: Record<string, string> = {};
    if (token && !cleanUrl.includes('cloudinary.com')) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    if (Platform.OS === 'android') {
      const permissions = await FileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync();
      if (!permissions.granted) {
        Alert.alert('Permission Denied', 'Storage permission is required to save files.');
        return;
      }
      
      const localUri = FileSystem.cacheDirectory + filename;
      const downloadResult = await FileSystem.downloadAsync(cleanUrl, localUri, { headers });
      
      if (downloadResult.status !== 200) throw new Error(`Download failed with status ${downloadResult.status}`);
      
      const base64 = await FileSystem.readAsStringAsync(downloadResult.uri, { encoding: FileSystem.EncodingType.Base64 });
      const savedUri = await FileSystem.StorageAccessFramework.createFileAsync(permissions.directoryUri, filename, mimeType);
      await FileSystem.writeAsStringAsync(savedUri, base64, { encoding: FileSystem.EncodingType.Base64 });
      
      Alert.alert('Success', `File downloaded to your selected folder: ${filename}`);
    } else {
      // iOS
      const localUri = FileSystem.documentDirectory + filename;
      const downloadResult = await FileSystem.downloadAsync(cleanUrl, localUri, { headers });
      if (downloadResult.status !== 200) throw new Error(`Download failed with status ${downloadResult.status}`);
      
      const isSharingAvailable = await Sharing.isAvailableAsync();
      if (isSharingAvailable) {
        await Sharing.shareAsync(downloadResult.uri, {
          mimeType,
          dialogTitle: `Save ${filename}`,
        });
      } else {
        Alert.alert('Success', 'File downloaded to app documents.');
      }
    }
  } catch (error: any) {
    console.error('[Helper] Download error:', error);
    Alert.alert('Download Failed', 'Could not download the document. ' + (error.message || ''));
  }
};
