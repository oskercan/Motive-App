/**
 * app/(tabs)/profile.tsx  (PLACEHOLDER)
 *
 * The tab layout points at a "profile" route, so this file has to exist or
 * Expo Router will warn about a missing screen. Replace the body when you
 * design the real Profile screen.
 *
 * Planned for this screen:
 *  - Avatar + name (editable)
 *  - Contacts list (view / remove / search), moved here from the create form
 *  - Sign out
 */

import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top + 16 }]}>
      <Text style={styles.title}>Profile</Text>
      <Text style={styles.subtitle}>Your info and contacts will live here.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', paddingHorizontal: 22 },
  title: { fontSize: 30, fontWeight: '700', color: '#2B2B2B' },
  subtitle: { fontSize: 16, color: '#8E8E8E', marginTop: 6 },
});