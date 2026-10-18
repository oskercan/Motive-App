[README.md](https://github.com/user-attachments/files/33639260/README.md)
# Motive 🎉

### *Make hanging out simpler.* 🤝

A modern, cross-platform mobile app built with **React Native**, **Expo** and **TypeScript**. Motive takes the group-chat chaos out of planning: pick a place, pick a time, invite your people, share your live location on the way, split the bill afterward and keep the photos from the night. 📸

---

## 📱 About the Project

Deciding where to go and when is half the work of hanging out. Motive puts it all in one place. Create a hangout (a *motive*), invite your contacts, and watch it move from **Ongoing** to **Past** on its own. Everything follows a clean, card-based design from Figma, with a bold blue gradient opening screen to set the mood. 💙

---

## 🚦 Status

Motive is an early work in progress. Here's where things stand:

| Area | Status |
| --- | --- |
| 🎬 Opening screen (gradient, wordmark, tagline) | ✅ Done |
| 🧭 Tab bar (Home, Map, Bills, Profile) | ✅ Done |
| 🏠 Home tab: create and browse motives | ✅ Done (local state only) |
| 👥 Contacts: add and invite from the create form | ✅ Done (local state only) |
| 🔎 Motive detail screen | ⏳ Not started |
| 🗺️ Map tab (live location sharing) | ⏳ Not started |
| 🧾 Bills tab (bill splitting) | ⏳ Not started |
| 🙋 Profile tab | 🚧 Placeholder only |
| ☁️ Backend, accounts, saved data | ⏳ Not started |

---

## 🛠️ Tech Stack

* ⚛️ **Framework:** React Native (via Expo)
* 🟦 **Language:** TypeScript
* 🧭 **Routing & Navigation:** Expo Router (file-based `app/` directory)
* 🎨 **Icons:** `@expo/vector-icons` (Ionicons)
* 🔤 **Fonts:** Google Fonts via `@expo-google-fonts` (Notable for the wordmark)
* 🖼️ **Media:** `expo-image-picker` for cover photos
* 📅 **Dates:** `@react-native-community/datetimepicker`
* 🧪 **Testing:** Jest

---

## ✨ Key Features

### 🏠 Home Tab: *"What's the Motive?"*
* 👋 Friendly greeting header with the user's avatar.
* ➕ **Start a Motive** opens a bottom-sheet form with:
  * 📷 a cover photo, picked from your photo library
  * 📝 a title, location and details
  * 🗓️ a date and time, using native pickers (the start must be in the future)
  * ⏱️ a duration, in hours
  * 💌 the contacts you want to invite
* 🔄 **Ongoing / Past toggle.** A motive moves to Past automatically once its start time plus duration has passed, with no refresh needed.
* 🎠 A horizontal, snapping carousel of photo cards, with a frosted-style label showing the title and location.
* ⭐ Past cards show a star rating once one exists.
* 🫙 Friendly empty states on both tabs.

### 👥 Contacts
* 🔗 Add a contact by name and Motive username (like `@alex_k`) without leaving the create form.
* ✅ Tap contact chips to invite or uninvite people. A new contact is invited automatically.
* 🚫 Duplicate usernames are blocked.

### 🎬 Opening Screen
* 🎨 Built entirely from React Native views, with no image file, so it's sharp on every screen.
* 🌈 A smooth blue gradient (`#0072B5` to `#00174A`) made from stacked color strips, so it needs no gradient package.
* 🔠 The **MOTIVE** wordmark in Notable, with the tagline underneath.
* 🌫️ Fades in, holds for about 1.8 seconds, then fades out over the app.

### 🧭 Navigation
* 4️⃣ Four icon-only tabs: **Home** 🏠, **Map** 🗺️, **Bills** 🧾 and **Profile** 🙋.
* 🔴 A little red dot sits under whichever tab is active.

---

## ⚙️ Getting Started Locally

To run this project on your machine:

1. **Clone the repository:** 📥
   ```bash
   git clone https://github.com/oskercan/Motive-App.git
   cd Motive-App
   ```

2. **Install dependencies:** 📦
   ```bash
   npm install
   ```

3. **Make sure these extras are installed:** 🧩
   ```bash
   npx expo install expo-font expo-image-picker \
     @react-native-community/datetimepicker \
     react-native-safe-area-context \
     @expo-google-fonts/notable
   ```
   Most come with the default Expo template. `expo-font`, `expo-image-picker`, `@react-native-community/datetimepicker` and `@expo-google-fonts/notable` are the ones you'll most likely need to add.

4. **Run the application:** ▶️
   ```bash
   npx expo start
   ```
   *Scan the QR code with **Expo Go** on your phone, or launch an iOS/Android simulator.*

> 🧹 **Something looks stale** (fonts, splash, imports)? Clear the cache with `npx expo start -c`.

### 🧪 Testing the splash screen and app icon

The native splash color and the app icon are applied at **build time**, so a reload won't change them and Expo Go shows its own icon. To see them for real, make a development build:

```bash
npx expo prebuild --clean
npx expo run:ios      # or: npx expo run:android
```

---

## 📂 Project Structure

```text
Motive-App/
├── app/                      # Expo Router file-based screens and tabs
│   ├── _layout.tsx           # Root layout: navigation + opening screen overlay
│   ├── index.tsx             # Entry screen
│   └── (tabs)/               # Main tab navigation views
│       ├── _layout.tsx       # Bottom tab bar (Home, Map, Bills, Profile)
│       ├── motive.tsx        # 🏠 Home tab (renders MotiveScreen)
│       ├── map.tsx           # 🗺️ Live map (to build)
│       ├── bills.tsx         # 🧾 Bill splitting (to build)
│       └── profile.tsx       # 🙋 Profile (placeholder)
├── assets/                   # Images, splash screens, and icons
├── components/               # Reusable UI components and test files
│   └── OpeningScreen.tsx     # 🎬 Animated opening screen
├── constants/                # Theme colors and app constants
├── app.json                  # Expo configuration
└── package.json              # Dependencies and scripts
```

> 💡 Route names in `app/(tabs)/_layout.tsx` must match the filenames inside `app/(tabs)/` exactly.

The Home tab's screen code lives in `MotiveScreen.tsx`. Re-export it from `app/(tabs)/motive.tsx`, for example:

```tsx
export { default } from '../../screens/MotiveScreen';
```

---

## 🧱 Data Model

```ts
interface Friend {
  id: string;
  name: string;
  handle: string;        // Motive username, without the "@"
  avatarUri?: string;
}

interface MotiveItem {
  id: string;
  title: string;
  location: string;
  description: string;
  startsAt: number;      // timestamp in ms
  durationHours: number;
  coverUri?: string;
  invitedIds: string[];  // Friend ids
  rating?: number;       // set after the hangout
}
```

`MotiveScreen` accepts optional props so the parent decides where taps go:

| Prop | Fires when |
| --- | --- |
| `onOpenMotive(motive)` | 🃏 a card is tapped (go to the detail screen) |
| `onViewAll()` | 👀 "View all" is tapped |
| `onPressAvatar()` | 🙂 the avatar is tapped (go to Profile) |

---

## 🎨 Design

Colors and layout follow the Figma design.

| Use | Color |
| --- | --- |
| 🔵 Primary button | `#0088FF` |
| ⚫ Headings, selected pill | `#2B2B2B` |
| 🔘 Muted text | `#8E8E8E` |
| 🌈 Opening gradient | `#0072B5` to `#00174A` |
| 🟦 Native splash color | `#004884` |
| 🔴 Active tab dot | `#FF3B30` |

The wordmark uses **Notable** from Google Fonts. All other text uses the system font for now.

---

## 🗺️ Roadmap

1. 🧠 **Shared state:** move `motives` and `friends` into a context or store so every screen can read them, and move the types into a shared file.
2. 🔎 **Detail screen** (`app/motive/[id].tsx`): overview and details tabs, duration, weather and people count, with a **Chat** 💬 button while ongoing and **Share Media** 📤 once past.
3. 🧾 **Bills tab:** split a bill after a hangout (evenly or by item) and send payment reminders.
4. 📍 **Map tab:** live location sharing during a hangout, with arrival ETAs.
5. 🙋 **Profile tab:** edit name and avatar, manage contacts (view, remove, search).
6. ☁️ **Backend:** accounts, saved motives, invites, photo storage, chat and realtime location (for example Supabase or Firebase). Until then, nothing is saved when the app closes.
7. 👤 **Real user and avatar:** replace the hardcoded user ("David") with the signed-in user.
8. 💅 **Polish:** a truly frosted-glass card label with `expo-blur`, fonts that match the Figma, and a dedicated square app icon.

---

## ⚠️ Known Limitations

* 💾 All data is held in memory and resets when the app closes.
* 🧑 The user is hardcoded as "David".
* 🕵️ Contacts are typed in by hand and aren't checked against real accounts.
* 🖼️ The icon paths in `app.json` (`icon.png`, `adaptive-icon.png`) need to point to real square images.
* 🚧 The Map and Bills tabs need screens before they show anything.

---

## 📄 License

This project is open-source and available under the terms of the [LICENSE](LICENSE) file.
