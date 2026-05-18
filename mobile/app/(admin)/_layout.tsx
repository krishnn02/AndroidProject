import { Stack } from 'expo-router';
import { colors } from '../../src/theme';

export default function AdminLayout() {
  return (
    <Stack screenOptions={{ 
      headerShown: true,
      headerStyle: { backgroundColor: colors.bgCard },
      headerTintColor: colors.text,
      contentStyle: { backgroundColor: colors.bg }
    }} />
  );
}
