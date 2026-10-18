/**
 * components/OpeningScreen.tsx
 *
 * Figma opening screen, built with plain React Native views.
 * NO extra native packages for the gradient (no expo-linear-gradient), so
 * there is nothing that can fail to render.
 *
 * WHY THE LAST VERSION SHOWED ONLY WHITE TEXT
 *  It relied on the parent giving it a size (flex: 1). If the parent had no
 *  height, the background collapsed to 0px and only the overflowing text showed.
 *  This version sizes ITSELF to the full screen with explicit pixel dimensions,
 *  so it doesn't matter how the parent is set up.
 *
 * THE GRADIENT
 *  We stack 120 thin horizontal strips, each a slightly different blue, from
 *  the Figma top color to the bottom color. Each strip differs by about one
 *  color step, so it looks like a smooth gradient.
 *
 * INSTALL (only the font is needed)
 *   npx expo install expo-font @expo-google-fonts/notable
 */

import React, { useEffect, useMemo, useRef } from 'react';
import { Animated, Dimensions, StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { useFonts, Notable_400Regular } from '@expo-google-fonts/notable';

// Colors from the Figma
const TOP = { r: 0x00, g: 0x72, b: 0xb5 }; // #0072B5
const BOTTOM = { r: 0x00, g: 0x17, b: 0x4a }; // #00174A
const STRIPS = 120;

const WORDMARK_FONT = 'Notable_400Regular';

// Full physical screen size, so we always cover everything (including under the status bar)
const SCREEN = Dimensions.get('screen');

// Blend between the top and bottom color. t = 0 is the top, t = 1 is the bottom.
const colorAt = (t: number) => {
  const mix = (a: number, b: number) => Math.round(a + (b - a) * t);
  return `rgb(${mix(TOP.r, BOTTOM.r)}, ${mix(TOP.g, BOTTOM.g)}, ${mix(TOP.b, BOTTOM.b)})`;
};

interface Props {
  onFinish: () => void; // called after the fade-out so the parent can remove this screen
  holdMs?: number; // how long to show the screen before fading (default 1.8 s)
  fadeMs?: number; // fade-out length (default 0.45 s)
}

export default function OpeningScreen({ onFinish, holdMs = 1800, fadeMs = 450 }: Props) {
  const wordmarkSize = Math.round(SCREEN.width * 0.105);
  const taglineSize = Math.round(SCREEN.width * 0.043);

  // Build the list of strip colors once.
  const strips = useMemo(
    () => Array.from({ length: STRIPS }, (_, i) => colorAt(i / (STRIPS - 1))),
    []
  );

  const [fontsLoaded, fontError] = useFonts({ [WORDMARK_FONT]: Notable_400Regular });
  const fontReady = fontsLoaded || !!fontError;

  const screenOpacity = useRef(new Animated.Value(1)).current; // whole screen (fade-out)
  const intro = useRef(new Animated.Value(0)).current; // text (fade-in)

  // 1) The gradient is plain views, so it is painted right away.
  //    Drop the native splash on the first frame so you never get stuck on it.
  useEffect(() => {
    const t = setTimeout(() => SplashScreen.hideAsync(), 50);
    return () => clearTimeout(t);
  }, []);

  // 2) Once the font is ready: fade the text in, hold, then fade everything out.
  useEffect(() => {
    if (!fontReady) return;

    Animated.timing(intro, { toValue: 1, duration: 600, useNativeDriver: true }).start();

    const timer = setTimeout(() => {
      Animated.timing(screenOpacity, {
        toValue: 0,
        duration: fadeMs,
        useNativeDriver: true,
      }).start(({ finished }) => {
        if (finished) onFinish();
      });
    }, holdMs);

    return () => clearTimeout(timer);
  }, [fontReady]);

  const translateY = intro.interpolate({ inputRange: [0, 1], outputRange: [14, 0] });

  return (
    <Animated.View
      pointerEvents="auto" // blocks taps on the app underneath while showing
      style={[styles.container, { opacity: screenOpacity }]}
    >
      <StatusBar style="light" />

      {/* Gradient: a column of colored strips filling the whole screen */}
      <View style={StyleSheet.absoluteFill}>
        {strips.map((color, i) => (
          <View key={i} style={{ flex: 1, backgroundColor: color }} />
        ))}
      </View>

      {/* Wordmark + tagline, centered a little above the middle */}
      <View style={styles.center}>
        <Animated.View style={{ opacity: intro, transform: [{ translateY }], alignItems: 'center' }}>
          <Text style={[styles.wordmark, { fontFamily: WORDMARK_FONT, fontSize: wordmarkSize }]}>
            MOTIVE
          </Text>
          <Text style={[styles.tagline, { fontSize: taglineSize }]}>Make hanging out simpler.</Text>
        </Animated.View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: SCREEN.width,
    height: SCREEN.height, // explicit size: this is the actual fix
    backgroundColor: '#003F78', // safety net: you always see blue, even if something fails
    zIndex: 9999, // above everything on iOS
    elevation: 9999, // above everything on Android
  },
  center: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 40,
  },
  wordmark: {
    color: '#fff',
    letterSpacing: 1,
    includeFontPadding: false,
  },
  tagline: {
    color: 'rgba(255, 255, 255, 0.85)',
    marginTop: 18,
    fontWeight: '500',
    textAlign: 'center',
  },
});