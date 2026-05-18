import { useEffect } from 'react';
import { Slot, useRouter, useSegments } from 'expo-router';
import { useAuthStore } from '../src/stores/authStore';
import { View, ActivityIndicator } from 'react-native';
import { colors } from '../src/theme';
import '../global.css';

export default function RootLayout() {
  const { isAuthenticated, isLoading, loadUser, user } = useAuthStore();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    loadUser();
  }, []);

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === '(auth)';

    if (!isAuthenticated && !inAuthGroup) {
      // Redirect to login if not authenticated
      setTimeout(() => router.replace('/(auth)/login'), 0);
    } else if (isAuthenticated && inAuthGroup) {
      // Redirect away from login if authenticated
      if (user?.role === 'ADMIN') {
        setTimeout(() => router.replace('/(admin)/dashboard'), 0);
      } else {
        setTimeout(() => router.replace('/(user)/dashboard'), 0);
      }
    }
  }, [isAuthenticated, isLoading, segments, user]);

  if (isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return <Slot />;
}
