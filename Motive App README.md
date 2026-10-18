# Motive App 🚀

A modern, cross-platform mobile application built with **React Native**, **Expo**, and **TypeScript**, designed to streamline social hangouts and event planning with friends.

## 📱 About the Project
Motive simplifies how groups decide on activities, locations, and schedules. By combining seamless navigation, custom interactive views, and a clean user interface, the app provides a smooth experience for organizing plans on the go.

## 🛠️ Tech Stack
* **Framework:** React Native (via Expo)
* **Language:** TypeScript
* **Routing & Navigation:** Expo Router (`app/` directory structure)
* **Testing:** Jest

## ✨ Key Features
* **Interactive Map Integration:** View hangout locations and nearby spots seamlessly (`app/(tabs)/map.tsx`).
* **Custom Event Discovery:** Explore tailored activities and social motives (`app/(tabs)/motive.tsx`).
* **User Profiles & Management:** Personalized user profiles and preferences (`app/(tabs)/profile.tsx`).
* **Utility Tools:** Integrated billing and expense tracking features for group outings (`app/(tabs)/bills.tsx`).

## ⚙️ Getting Started Locally

To run this project locally on your machine, follow these steps:

1. **Clone the repository:**
   ```bash
   git clone https://github.com/oskercan/Motive-App.git
   cd Motive-App
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Run the application:**
   ```bash
   npx expo start
   ```
   *Scan the QR code using the **Expo Go** app on your physical device, or launch an iOS/Android simulator.*

## 📂 Project Structure
```text
Motive-App/
├── app/                  # Expo Router file-based screens and tabs
│   ├── (tabs)/           # Main tab navigation views (map, motive, profile, bills)
│   └── index.tsx         # Entry screen
├── assets/               # Images, splash screens, and icons
├── components/           # Reusable UI components and test files
├── constants/            # Theme colors and app constants
├── app.json              # Expo configuration
└── package.json          # Dependencies and scripts
```

## 📄 License
This project is open-source and available under the terms of the [LICENSE](LICENSE) file.
