import { View, ActivityIndicator } from 'react-native';
import { colors } from '../src/theme';

export default function IndexScreen() {
  return (
    <View style={{ flex: 1, backgroundColor: colors.bg, justifyContent: 'center', alignItems: 'center' }}>
      <ActivityIndicator size="large" color={colors.primary} />
    </View>
  );
}
