import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../src/theme';

export default function UserLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: true,
        headerStyle: { backgroundColor: colors.bgCard, elevation: 0, shadowOpacity: 0, borderBottomWidth: 1, borderBottomColor: colors.border },
        headerTintColor: colors.text,
        tabBarStyle: { backgroundColor: colors.bgCard, borderTopColor: colors.border },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        sceneStyle: { backgroundColor: colors.bg }
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color, size }) => <Ionicons name="home-outline" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="events/index"
        options={{
          title: 'My Events',
          href: '/(user)/events',
          tabBarIcon: ({ color, size }) => <Ionicons name="calendar-outline" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="reports/index"
        options={{
          title: 'Reports',
          href: '/(user)/reports',
          tabBarIcon: ({ color, size }) => <Ionicons name="document-text-outline" size={size} color={color} />,
        }}
      />

      {/* Hide nested screens from the tab bar */}
      <Tabs.Screen name="events/[id]" options={{ href: null }} />
      <Tabs.Screen name="reports/[id]/index" options={{ href: null }} />
      <Tabs.Screen name="reports/[id]/budget" options={{ href: null }} />
      <Tabs.Screen name="reports/[id]/front-page" options={{ href: null }} />
      <Tabs.Screen name="reports/[id]/sections" options={{ href: null }} />
      <Tabs.Screen name="create-report" options={{ title: 'Create Report', href: null }} />
    </Tabs>
  );
}
