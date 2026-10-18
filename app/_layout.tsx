/**
 * app/_layout.tsx  (the ROOT layout, NOT the one inside (tabs))
 *
 * 1. Keeps the native splash up until OpeningScreen is painted.
 * 2. Renders your navigation (the tabs) underneath.
 * 3. Draws OpeningScreen on top, then removes it after its fade-out.
 *
 * ALREADY HAVE A ROOT LAYOUT? Keep yours and add the 4 marked pieces.
 * Make sure the wrapper View has flex: 1.
 */

import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import React, { useState } from 'react';
import { View } from 'react-native';
import OpeningScreen from '../components/OpeningScreen'; // (1) import

// (2) Top level, outside the component, not awaited.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  // (3) Is the opening screen still showing?
  const [showOpening, setShowOpening] = useState(true);

  return (
    <View style={{ flex: 1 }}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
      </Stack>

      {/* (4) OpeningScreen positions and sizes itself, so no wrapper is needed */}
      {showOpening && <OpeningScreen onFinish={() => setShowOpening(false)} />}
    </View>
  );
}