# BukkaPay Expo

## Overview
A React Native / Expo mobile payment app cloned from https://github.com/profyk/BukkaPay-Expo.

## Tech Stack
- **Framework**: React Native with Expo (Expo Router)
- **Language**: TypeScript
- **Backend**: Supabase
- **Navigation**: Expo Router (file-based) + React Navigation (bottom tabs)
- **State Management**: TanStack React Query
- **Auth**: Supabase Auth + expo-local-authentication (biometrics)
- **Payments**: Custom BukkaPay integration
- **QR**: react-native-qrcode-svg
- **Storage**: AsyncStorage

## Project Structure
- `app/` - Expo Router screens and layouts
- `components/` - Reusable UI components
- `hooks/` - Custom React hooks
- `lib/` - Utility/helper libraries
- `pages/` - Additional page components
- `assets/` - Images, fonts, and other static assets

## Running the App
- `npm run start` - Start the Expo dev server
- `npm run android` - Start for Android
- `npm run ios` - Start for iOS
- `npm run web` - Start for web

## Build & Deploy
- Uses EAS (Expo Application Services) for builds
- `eas.json` contains build profiles
