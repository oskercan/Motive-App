/**
 * app/(tabs)/_layout.tsx
 *
 * The bottom tab bar, styled to match the Figma:
 *   Home  |  Map  |  Bills  |  Profile
 * - No text labels, just icons.
 * - The active icon is filled and dark, with a small red dot underneath.
 * - Inactive icons are outlined and grey.
 *
 * HOW EXPO ROUTER USES THIS FILE
 *  Each <Tabs.Screen name="x" /> must match a file in the same folder:
 *    app/(tabs)/motive.tsx   -> name="motive"   (your MotiveScreen / Home)
 *    app/(tabs)/map.tsx      -> name="map"
 *    app/(tabs)/bills.tsx    -> name="bills"
 *    app/(tabs)/profile.tsx  -> name="profile"  (NEW, a placeholder is included)
 *  The ORDER of the Tabs.Screen entries below is the order of the icons.
 */

import { Tabs } from 'expo-router';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Colors from the Figma
const ACTIVE = '#2B2B2B'; // dark icon when selected
const INACTIVE = '#8E8E8E'; // grey icon when not selected
const DOT = '#FF3B30'; // red dot under the active icon

type IconName = React.ComponentProps<typeof Ionicons>['name'];

/**
 * One tab icon. Filled version when focused, outline when not,
 * plus the red dot that only shows on the active tab.
 * The wrapper has a fixed height so the icon doesn't jump when the dot appears.
 */
function TabIcon({
  focused,
  active,
  inactive,
}: {
  focused: boolean;
  active: IconName; // e.g. 'home'
  inactive: IconName; // e.g. 'home-outline'
}) {
  return (
    <View style={styles.iconWrap}>
      <Ionicons
        name={focused ? active : inactive}
        size={26}
        color={focused ? ACTIVE : INACTIVE}
      />
      {focused && <View style={styles.dot} />}
    </View>
  );
}

export default function TabLayout() {
  // Keeps the bar above the iPhone home indicator / Android gesture bar.
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        headerShown: false, // the Figma screens have no top header bar
        tabBarShowLabel: false, // icons only
        tabBarStyle: {
          backgroundColor: '#fff',
          borderTopWidth: 0, // removes the default thin line
          elevation: 0, // removes the Android shadow
          height: 58 + insets.bottom,
          paddingTop: 10,
        },
      }}
    >
      {/* Tab 1: Home (create + browse motives) */}
      <Tabs.Screen
        name="motive"
        options={{
          title: 'Motive',
          tabBarAccessibilityLabel: 'Motives home',
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} active="home" inactive="home-outline" />
          ),
        }}
      />

      {/* Tab 2: Live map (live location sharing) */}
      <Tabs.Screen
        name="map"
        options={{
          title: 'Map',
          tabBarAccessibilityLabel: 'Live map',
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} active="map" inactive="map-outline" />
          ),
        }}
      />

      {/* Tab 3: Bills (split the bill after a hangout) */}
      <Tabs.Screen
        name="bills"
        options={{
          title: 'Bills',
          tabBarAccessibilityLabel: 'Bills',
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} active="receipt" inactive="receipt-outline" />
          ),
        }}
      />

      {/* Tab 4: Profile (your info + contacts) */}
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarAccessibilityLabel: 'Profile',
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} active="person" inactive="person-outline" />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  iconWrap: {
    width: 36,
    height: 38,
    alignItems: 'center',
  },
  dot: {
    position: 'absolute',
    bottom: 0,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: DOT,
  },
});