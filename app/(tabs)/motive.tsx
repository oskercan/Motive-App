/**
 * MotiveScreen.tsx  (the Home / "Motives" tab)
 *
 * WHAT THIS SCREEN DOES
 *  1. Greets the user (avatar + "Hi, David").
 *  2. "Start a Motive" button opens a bottom-sheet form to create a hangout.
 *  3. Shows hangouts in a horizontal carousel, split by an Ongoing / Past toggle.
 *  4. Lets you add contacts (profiles) and invite them to a hangout.
 *
 * HOW THE FILE IS ORGANIZED (top to bottom)
 *  - Types              : the shape of our data (Friend, MotiveItem)
 *  - Helpers            : small pure functions (formatting, fallback colors)
 *  - MotiveScreen       : state + logic + the JSX that gets drawn
 *  - styles             : all styling, at the bottom
 *
 * DEPENDENCIES (install once)
 *   npx expo install expo-image-picker @react-native-community/datetimepicker react-native-safe-area-context
 *   (@expo/vector-icons ships with Expo already.)
 *
 * NOTE: this file keeps everything in local state so you can see it work today.
 * When you build the detail screen, profile tab, and backend, the state below
 * has to move somewhere shared. See "NOTES FOR OTHER FILES" at the very bottom.
 */

import React, { useEffect, useMemo, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  Modal,
  FlatList,
  ScrollView,
  ImageBackground,
  Image,
  KeyboardAvoidingView,
  Platform,
  useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import DateTimePicker, {
  DateTimePickerAndroid,
} from '@react-native-community/datetimepicker';

/* -------------------------------------------------------------------------- */
/*  TYPES                                                                     */
/* -------------------------------------------------------------------------- */

// A contact / another user's profile.
export interface Friend {
  id: string;
  name: string;
  handle: string; // their Motive username, stored without the "@"
  avatarUri?: string;
}

// One hangout. This is the object the detail screen will also need.
export interface MotiveItem {
  id: string;
  title: string;
  location: string;
  description: string;
  startsAt: number; // timestamp in ms (Date.getTime())
  durationHours: number; // the detail screen shows "3 hours"
  coverUri?: string; // cover photo; we draw a colored fallback if missing
  invitedIds: string[]; // ids of Friends who are invited
  rating?: number; // average rating, filled in AFTER the hangout (shown on Past cards)
}

type Tab = 'ongoing' | 'past';

// Props let the parent (your navigator) decide where taps go.
// They are optional so this screen runs on its own while you build the rest.
interface Props {
  onOpenMotive?: (motive: MotiveItem) => void; // card tapped -> go to detail screen
  onViewAll?: () => void; // "View all" tapped
  onPressAvatar?: () => void; // avatar tapped -> go to profile
}

/* -------------------------------------------------------------------------- */
/*  HELPERS                                                                   */
/* -------------------------------------------------------------------------- */

// TODO: replace with the logged-in user (from auth / a profile context).
const CURRENT_USER = { name: 'David', avatarUri: undefined as string | undefined };

const HOUR_MS = 60 * 60 * 1000;

// Cards with no cover photo get one of these colors (same id -> same color).
const FALLBACK_COLORS = ['#1F6FEB', '#0B3D91', '#2E7D6B', '#7A4E2D', '#5B3FA8'];
const fallbackColor = (id: string) => {
  let sum = 0;
  for (let i = 0; i < id.length; i++) sum += id.charCodeAt(i);
  return FALLBACK_COLORS[sum % FALLBACK_COLORS.length];
};

// A hangout is "past" once its end time (start + duration) has gone by.
const endsAt = (m: MotiveItem) => m.startsAt + m.durationHours * HOUR_MS;

// Default start time in the form: the top of the next hour.
const nextHour = () => {
  const d = new Date(Date.now() + HOUR_MS);
  d.setMinutes(0, 0, 0);
  return d;
};

const formatWhen = (d: Date) =>
  d.toLocaleString([], {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });

/* -------------------------------------------------------------------------- */
/*  SCREEN                                                                    */
/* -------------------------------------------------------------------------- */

export default function MotiveScreen({
  onOpenMotive,
  onViewAll,
  onPressAvatar,
}: Props) {
  const insets = useSafeAreaInsets(); // keeps content below the notch
  const { width } = useWindowDimensions();

  // Card size is based on screen width so the NEXT card peeks in, like the Figma.
  const CARD_W = Math.round(width * 0.63);
  const CARD_H = Math.round(CARD_W * 1.5);
  const CARD_GAP = 16;

  /* ---------- Data state ---------- */
  const [motives, setMotives] = useState<MotiveItem[]>([]);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [tab, setTab] = useState<Tab>('ongoing');

  // "now" ticks every minute so a hangout moves from Ongoing -> Past by itself.
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 60 * 1000);
    return () => clearInterval(id); // cleanup when the screen unmounts
  }, []);

  /* ---------- Create-form state ---------- */
  const [modalVisible, setModalVisible] = useState(false);
  const [title, setTitle] = useState('');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [startsAt, setStartsAt] = useState<Date>(nextHour());
  const [durationHours, setDurationHours] = useState(2);
  const [coverUri, setCoverUri] = useState<string | undefined>();
  const [invitedIds, setInvitedIds] = useState<string[]>([]);

  /* ---------- Add-contact state (inside the form) ---------- */
  const [addingFriend, setAddingFriend] = useState(false);
  const [friendName, setFriendName] = useState('');
  const [friendHandle, setFriendHandle] = useState('');

  /* ---------- Derived data ---------- */
  // useMemo = only recompute when motives / tab / now change.
  const visibleMotives = useMemo(() => {
    if (tab === 'ongoing') {
      return motives
        .filter((m) => endsAt(m) > now)
        .sort((a, b) => a.startsAt - b.startsAt); // soonest first
    }
    return motives
      .filter((m) => endsAt(m) <= now)
      .sort((a, b) => endsAt(b) - endsAt(a)); // most recent first
  }, [motives, tab, now]);

  const isInPast = startsAt.getTime() <= Date.now();
  const canSubmit = title.trim() !== '' && !isInPast;

  /* ---------- Form actions ---------- */
  const resetForm = () => {
    setTitle('');
    setLocation('');
    setDescription('');
    setStartsAt(nextHour());
    setDurationHours(2);
    setCoverUri(undefined);
    setInvitedIds([]);
    setAddingFriend(false);
    setFriendName('');
    setFriendHandle('');
  };

  const closeModal = () => {
    setModalVisible(false);
    resetForm();
  };

  const createMotive = () => {
    if (!canSubmit) return;
    const newMotive: MotiveItem = {
      id: Date.now().toString(), // TODO: your backend will generate real ids
      title: title.trim(),
      location: location.trim(),
      description: description.trim(),
      startsAt: startsAt.getTime(),
      durationHours,
      coverUri,
      invitedIds,
    };
    setMotives((prev) => [newMotive, ...prev]);
    setTab('ongoing'); // jump to the tab where the new card lives
    closeModal();
  };

  const pickCover = async () => {
    // Opens the photo library. `canceled` is true if the user backs out.
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [2, 3], // matches the tall card shape
      quality: 0.8,
    });
    if (!result.canceled) setCoverUri(result.assets[0].uri);
  };

  // iOS shows an inline date+time picker. Android can only open a popup,
  // so we open the date popup, then the time popup.
  const openAndroidPicker = () => {
    DateTimePickerAndroid.open({
      value: startsAt,
      mode: 'date',
      minimumDate: new Date(),
      onChange: (e, pickedDate) => {
        if (e.type !== 'set' || !pickedDate) return;
        DateTimePickerAndroid.open({
          value: pickedDate,
          mode: 'time',
          onChange: (e2, pickedTime) => {
            if (e2.type === 'set' && pickedTime) setStartsAt(pickedTime);
          },
        });
      },
    });
  };

  const toggleInvite = (id: string) => {
    setInvitedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const addFriend = () => {
    const handle = friendHandle.trim().replace(/^@/, ''); // strip a leading @
    if (handle === '') return;
    const duplicate = friends.some(
      (f) => f.handle.toLowerCase() === handle.toLowerCase()
    );
    if (duplicate) return;
    const newFriend: Friend = {
      id: Date.now().toString(),
      name: friendName.trim() || handle,
      handle,
    };
    setFriends((prev) => [...prev, newFriend]);
    setInvitedIds((prev) => [...prev, newFriend.id]); // auto-invite who you just added
    setFriendName('');
    setFriendHandle('');
    setAddingFriend(false);
  };

  /* ---------------------------------------------------------------------- */
  /*  RENDER HELPERS                                                        */
  /* ---------------------------------------------------------------------- */

  // One card in the carousel.
  const renderCard = ({ item }: { item: MotiveItem }) => {
    // Inner content shared by the photo and fallback versions.
    const glass = (
      <View style={styles.glass}>
        <Text style={styles.cardTitle} numberOfLines={1}>
          {item.title}
        </Text>
        <View style={styles.glassRow}>
          <View style={styles.glassLeft}>
            <Ionicons name="location-outline" size={18} color="#E8E1D8" />
            <Text style={styles.cardLocation} numberOfLines={1}>
              {item.location || 'No location yet'}
            </Text>
          </View>
          {/* Star rating only appears on Past cards that have been rated */}
          {tab === 'past' && item.rating !== undefined && (
            <View style={styles.glassLeft}>
              <Ionicons name="star-outline" size={16} color="#E8E1D8" />
              <Text style={styles.cardLocation}>{item.rating.toFixed(1)}</Text>
            </View>
          )}
        </View>
      </View>
    );

    return (
      // Outer View holds the shadow. Inner View clips the image to rounded corners.
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={() => onOpenMotive?.(item)}
        style={[styles.cardShadow, { width: CARD_W, height: CARD_H }]}
      >
        <View style={styles.cardClip}>
          {item.coverUri ? (
            <ImageBackground source={{ uri: item.coverUri }} style={styles.cardFill}>
              {glass}
            </ImageBackground>
          ) : (
            <View style={[styles.cardFill, { backgroundColor: fallbackColor(item.id) }]}>
              {glass}
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  /* ---------------------------------------------------------------------- */
  /*  JSX                                                                   */
  /* ---------------------------------------------------------------------- */

  return (
    
    <ScrollView 
      style={{ flex: 1, backgroundColor: '#fff' }}
      contentContainerStyle={{ flexGrow: 1, paddingTop: insets.top + 16, paddingBottom: 40 }}
      showsVerticalScrollIndicator={false}
    >
      {/* ---------- Header: greeting + avatar ---------- */}
      <View style={styles.header}>
        <View style={styles.headerText}>
          <Text style={styles.greeting}>Hi, {CURRENT_USER.name} 👋</Text>
          <Text style={styles.subtitle}>Create a Hangout</Text>
        </View>
        <TouchableOpacity onPress={onPressAvatar} activeOpacity={0.8}>
          {CURRENT_USER.avatarUri ? (
            <Image source={{ uri: CURRENT_USER.avatarUri }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.avatarFallback]}>
              <Text style={styles.avatarInitial}>{CURRENT_USER.name[0]}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* ---------- Primary action ---------- */}
      <TouchableOpacity
        style={styles.startButton}
        onPress={() => setModalVisible(true)}
        activeOpacity={0.85}
      >
        <Text style={styles.startButtonText}>Start a Motive</Text>
      </TouchableOpacity>

      {/* ---------- Section header ---------- */}
      <View style={styles.sectionRow}>
        <Text style={styles.sectionTitle}>Motives</Text>
        <TouchableOpacity onPress={onViewAll}>
          <Text style={styles.viewAll}>View all</Text>
        </TouchableOpacity>
      </View>

      {/* ---------- Ongoing / Past toggle ---------- */}
      <View style={styles.toggleRow}>
        {(['ongoing', 'past'] as Tab[]).map((t) => {
          const active = tab === t;
          return (
            <TouchableOpacity
              key={t}
              style={[styles.pill, active && styles.pillActive]}
              onPress={() => setTab(t)}
              activeOpacity={0.85}
            >
              <Text style={[styles.pillText, active && styles.pillTextActive]}>
                {t === 'ongoing' ? 'Ongoing' : 'Past'}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* ---------- Carousel (or empty state) ---------- */}
      {visibleMotives.length === 0 ? (
        <Text style={styles.empty}>
          {tab === 'ongoing'
            ? 'Nothing planned yet. Tap "Start a Motive" to get the group together.'
            : 'Past motives show up here once your hangouts are over.'}
        </Text>
      ) : (
        <FlatList
          data={visibleMotives}
          keyExtractor={(item) => item.id}
          renderItem={renderCard}
          horizontal
          showsHorizontalScrollIndicator={false}
          // Snapping makes each swipe land neatly on a card.
          snapToInterval={CARD_W + CARD_GAP}
          decelerationRate="fast"
          ItemSeparatorComponent={() => <View style={{ width: CARD_GAP }} />}
          contentContainerStyle={styles.carousel}
        />
      )}
    
      {/* ====================================================================
          CREATE MOTIVE MODAL (bottom sheet)
          ==================================================================== */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent
        onRequestClose={closeModal} // Android back button
      >
        <KeyboardAvoidingView
          style={styles.overlay}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={styles.sheet}>
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>Start a Motive</Text>
              <TouchableOpacity onPress={closeModal}>
                <Text style={styles.cancel}>Cancel</Text>
              </TouchableOpacity>
            </View>

            <ScrollView
              keyboardShouldPersistTaps="handled" // taps on buttons work while keyboard is open
              showsVerticalScrollIndicator={false}
            >
              {/* Cover photo */}
              <TouchableOpacity style={styles.coverPicker} onPress={pickCover} activeOpacity={0.85}>
                {coverUri ? (
                  <Image source={{ uri: coverUri }} style={styles.coverImage} />
                ) : (
                  <View style={styles.coverEmpty}>
                    <Ionicons name="image-outline" size={26} color="#8E8E8E" />
                    <Text style={styles.coverHint}>Add a cover photo</Text>
                  </View>
                )}
              </TouchableOpacity>

              <Text style={styles.label}>What's the plan?</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., Sunday Bowling"
                placeholderTextColor="#A0A0A0"
                value={title}
                onChangeText={setTitle}
              />

              <Text style={styles.label}>Where?</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., Markham, ON"
                placeholderTextColor="#A0A0A0"
                value={location}
                onChangeText={setLocation}
              />

              {/* Date + time */}
              <Text style={styles.label}>When?</Text>
              {Platform.OS === 'ios' ? (
                <View style={styles.dateRowIos}>
                  <DateTimePicker
                    value={startsAt}
                    mode="datetime"
                    display="compact"
                    minimumDate={new Date()}
                    onChange={(_, d) => d && setStartsAt(d)}
                  />
                </View>
              ) : (
                <TouchableOpacity style={styles.input} onPress={openAndroidPicker}>
                  <Text style={styles.dateText}>{formatWhen(startsAt)}</Text>
                </TouchableOpacity>
              )}
              {isInPast && (
                <Text style={styles.error}>Pick a time in the future.</Text>
              )}

              {/* Duration stepper */}
              <Text style={styles.label}>How long?</Text>
              <View style={styles.stepper}>
                <TouchableOpacity
                  style={styles.stepBtn}
                  onPress={() => setDurationHours((h) => Math.max(1, h - 1))}
                >
                  <Ionicons name="remove" size={20} color="#2B2B2B" />
                </TouchableOpacity>
                <Text style={styles.stepValue}>
                  {durationHours} {durationHours === 1 ? 'hour' : 'hours'}
                </Text>
                <TouchableOpacity
                  style={styles.stepBtn}
                  onPress={() => setDurationHours((h) => Math.min(12, h + 1))}
                >
                  <Ionicons name="add" size={20} color="#2B2B2B" />
                </TouchableOpacity>
              </View>

              <Text style={styles.label}>Details (optional)</Text>
              <TextInput
                style={[styles.input, styles.multiline]}
                placeholder="Meet at 7:00 pm, tell the front desk the reservation name..."
                placeholderTextColor="#A0A0A0"
                value={description}
                onChangeText={setDescription}
                multiline
              />

              {/* Invite contacts */}
              <View style={styles.inviteHeader}>
                <Text style={styles.label}>Who's invited?</Text>
                {!addingFriend && (
                  <TouchableOpacity onPress={() => setAddingFriend(true)}>
                    <Text style={styles.link}>Add a contact</Text>
                  </TouchableOpacity>
                )}
              </View>

              {addingFriend && (
                <View style={styles.addFriendBox}>
                  <TextInput
                    style={styles.input}
                    placeholder="Name"
                    placeholderTextColor="#A0A0A0"
                    value={friendName}
                    onChangeText={setFriendName}
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="Their Motive username (e.g., @alex_k)"
                    placeholderTextColor="#A0A0A0"
                    autoCapitalize="none"
                    autoCorrect={false}
                    value={friendHandle}
                    onChangeText={setFriendHandle}
                  />
                  <View style={styles.btnRow}>
                    <TouchableOpacity
                      style={[styles.smallBtn, styles.smallBtnGhost]}
                      onPress={() => setAddingFriend(false)}
                    >
                      <Text style={styles.smallBtnGhostText}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.smallBtn} onPress={addFriend}>
                      <Text style={styles.smallBtnText}>Add contact</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              {friends.length === 0 && !addingFriend ? (
                <Text style={styles.hint}>Add contacts to invite them to this motive.</Text>
              ) : (
                <View style={styles.chips}>
                  {friends.map((f) => {
                    const selected = invitedIds.includes(f.id);
                    return (
                      <TouchableOpacity
                        key={f.id}
                        style={[styles.chip, selected && styles.chipSelected]}
                        onPress={() => toggleInvite(f.id)}
                      >
                        <Text style={[styles.chipText, selected && styles.chipTextSelected]}>
                          {f.name} @{f.handle}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}
            </ScrollView>

            <TouchableOpacity
              style={[styles.startButton, styles.createButton, !canSubmit && styles.disabled]}
              onPress={createMotive}
              disabled={!canSubmit}
              activeOpacity={0.85}
            >
              <Text style={styles.startButtonText}>Create motive</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </ScrollView>
  );
}

/* -------------------------------------------------------------------------- */
/*  STYLES  (colors/sizes taken from the Figma)                               */
/* -------------------------------------------------------------------------- */

const INK = '#2B2B2B'; // headings + selected pill
const MUTED = '#8E8E8E'; // subtitle, "View all"
const LINE = '#E3E3E3';
const BLUE = '#0088FF'; // primary button
const SURFACE = '#F2F2F2'; // unselected pill

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },

  /* Header */
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 22,
    marginBottom: 22,
  },
  headerText: { flex: 1 },
  greeting: { fontSize: 30, fontWeight: '700', color: INK },
  subtitle: { fontSize: 18, color: MUTED, marginTop: 2 },
  avatar: { width: 46, height: 46, borderRadius: 23 },
  avatarFallback: {
    backgroundColor: '#E8EEF4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: { fontSize: 18, fontWeight: '700', color: INK },

  /* Primary button (also reused for "Create motive") */
  startButton: {
    marginHorizontal: 22,
    height: 52,
    borderRadius: 26,
    backgroundColor: BLUE,
    borderWidth: 2,
    borderColor: '#D5D5D5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  startButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  disabled: { opacity: 0.4 },

  /* Section header */
  sectionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 22,
    marginTop: 28,
    marginBottom: 16,
  },
  sectionTitle: { fontSize: 20, fontWeight: '700', color: INK },
  viewAll: { fontSize: 14, fontWeight: '600', color: MUTED },

  /* Ongoing / Past pills */
  toggleRow: {
    flexDirection: 'row',
    gap: 14,
    paddingHorizontal: 22,
    marginBottom: 22,
  },
  pill: {
    paddingVertical: 14,
    paddingHorizontal: 30,
    borderRadius: 20,
    backgroundColor: SURFACE,
  },
  pillActive: {
    backgroundColor: INK,
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  pillText: { fontSize: 15, fontWeight: '500', color: '#B5B5B5' },
  pillTextActive: { color: '#fff' },

  /* Carousel + cards */
  carousel: { paddingHorizontal: 22, paddingBottom: 24 },
  cardShadow: {
    borderRadius: 36,
    backgroundColor: '#fff', // shadows need a background to render on iOS
    shadowColor: '#000',
    shadowOpacity: 0.22,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 14 },
    elevation: 8,
  },
  cardClip: { flex: 1, borderRadius: 36, overflow: 'hidden' },
  cardFill: { flex: 1, justifyContent: 'flex-end', padding: 14 },
  // "Glass" label. Plain translucent view for now; swap for expo-blur's BlurView for real frosting.
  glass: {
    backgroundColor: 'rgba(40, 28, 16, 0.55)',
    borderRadius: 20,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  glassRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
    gap: 8,
  },
  glassLeft: { flexDirection: 'row', alignItems: 'center', gap: 6, flexShrink: 1 },
  cardTitle: { color: '#fff', fontSize: 17, fontWeight: '600' },
  cardLocation: { color: '#E8E1D8', fontSize: 14 },
  empty: {
    textAlign: 'center',
    color: MUTED,
    fontSize: 15,
    paddingHorizontal: 40,
    marginTop: 20,
  },

  /* Modal */
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
  },
  sheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 20,
    paddingBottom: 32,
    maxHeight: '92%',
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  sheetTitle: { fontSize: 22, fontWeight: '700', color: INK },
  cancel: { fontSize: 16, color: MUTED },

  coverPicker: {
    height: 150,
    borderRadius: 20,
    overflow: 'hidden',
    marginTop: 12,
    backgroundColor: SURFACE,
    borderWidth: 1,
    borderColor: LINE,
    borderStyle: 'dashed',
  },
  coverImage: { width: '100%', height: '100%' },
  coverEmpty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 6 },
  coverHint: { color: MUTED, fontSize: 14 },

  label: { fontSize: 14, fontWeight: '600', color: INK, marginTop: 16, marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderColor: LINE,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 14,
    fontSize: 16,
    color: INK,
    backgroundColor: '#fff',
    marginBottom: 4,
  },
  multiline: { minHeight: 80, textAlignVertical: 'top' },
  dateRowIos: { alignItems: 'flex-start' },
  dateText: { fontSize: 16, color: INK },
  error: { color: '#D93025', fontSize: 13, marginTop: 4 },

  stepper: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  stepBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: SURFACE,
    borderWidth: 1,
    borderColor: LINE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepValue: { fontSize: 16, color: INK, minWidth: 80, textAlign: 'center' },

  /* Contacts */
  inviteHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  link: { color: BLUE, fontSize: 14, fontWeight: '600', marginBottom: 6 },
  hint: { color: MUTED, fontSize: 14, marginTop: 4 },
  addFriendBox: {
    backgroundColor: SURFACE,
    borderRadius: 16,
    padding: 12,
    marginTop: 4,
    marginBottom: 8,
    gap: 8,
  },
  btnRow: { flexDirection: 'row', gap: 12 },
  smallBtn: {
    flex: 1,
    backgroundColor: BLUE,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
  },
  smallBtnText: { color: '#fff', fontWeight: '600' },
  smallBtnGhost: { backgroundColor: 'transparent', borderWidth: 1, borderColor: LINE },
  smallBtnGhostText: { color: MUTED, fontWeight: '600' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 6 },
  chip: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: LINE,
    backgroundColor: '#fff',
  },
  chipSelected: { backgroundColor: INK, borderColor: INK },
  chipText: { color: INK, fontSize: 14 },
  chipTextSelected: { color: '#fff' },

  createButton: { marginHorizontal: 0, marginTop: 16 },
});

/* ============================================================================
   NOTES FOR OTHER FILES  (things this screen expects the rest of the app to do)

   1. SHARED STATE  ->  e.g. context/MotiveContext.tsx (or Zustand / Redux)
      `motives` and `friends` live in this file's useState right now. The detail
      screen, profile tab, and map tab all need them, so move them into a shared
      store and have this screen read from it. Also move the `Friend` and
      `MotiveItem` types into types/index.ts and import them everywhere.

   2. DETAIL SCREEN  ->  e.g. app/motive/[id].tsx  (your "Sunday Bowling" design)
      Pass the tapped motive in via `onOpenMotive`. With expo-router:
        <MotiveScreen onOpenMotive={(m) => router.push(`/motive/${m.id}`)} />
      The detail screen looks the motive up by id from the shared store.
      It already has what it needs: title, location, description, durationHours,
      invitedIds (people count = invitedIds.length + 1 for the host).
      Bottom button should switch by status: "Chat" while ongoing,
      "Share Media" once past. The 16 C weather chip needs a weather API
      call using the location (Open-Meteo is free and needs no key).

   3. TAB LAYOUT  ->  app/(tabs)/_layout.tsx
      Your design has three tabs: Home, Map, Profile (with a red dot under the
      active tab). Map holds live location sharing. Profile holds the contacts
      list and avatar editing.

   4. PROFILE TAB / CONTACTS
      Contacts are only added inside the create form for now. A proper contacts
      list belongs on the Profile tab (view, remove, search). Later, replace the
      manual "@username" box with a real username search once you have a backend,
      or import from the phone with expo-contacts.

   5. CURRENT USER  ->  context/AuthContext.tsx
      CURRENT_USER is hardcoded as David. Replace it with the signed-in user's
      name and avatar.

   6. BACKEND / PERSISTENCE
      Everything resets when the app closes. Quick fix: AsyncStorage. Real fix:
      Firebase or Supabase (auth, hangouts, invites, photo storage, realtime chat
      and location). `rating` should be written by a post-hangout rating prompt.

   7. SPLASH SCREEN  ->  app.json + assets
      The blue gradient "MOTIVE" splash from your Figma is set up through
      expo-splash-screen / app.json (export it from Figma as a PNG).

   8. FONTS
      Your Figma uses a Montserrat-style heading font and a serif-style wordmark.
      Load them with expo-font or @expo-google-fonts, then add fontFamily to the
      greeting / sectionTitle styles.
   ============================================================================ */