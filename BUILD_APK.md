# Build APK Instructions

## Prerequisites
- Install Android Studio: https://developer.android.com/studio
- Install Java JDK 17 or higher

## Steps to Build APK

### 1. Build the web app
```bash
npm run build
```

### 2. Sync Capacitor
```bash
npx cap sync android
```

### 3. Open in Android Studio
```bash
npx cap open android
```

### 4. Build APK in Android Studio
- Click **Build** → **Build Bundle(s) / APK(s)** → **Build APK(s)**
- APK will be in: `android/app/build/outputs/apk/debug/app-debug.apk`

### 5. Build Release APK (Signed)
- Click **Build** → **Generate Signed Bundle / APK**
- Select **APK**
- Create or select keystore
- APK will be in: `android/app/build/outputs/apk/release/app-release.apk`

## Quick Commands
```bash
# Build web app
npm run build

# Sync to Android
npx cap sync android

# Open Android Studio
npx cap open android
```

## Alternative: Use PWABuilder (Easier)
1. Deploy app to live URL
2. Go to https://www.pwabuilder.com/
3. Enter your URL
4. Click "Build" → "Android"
5. Download APK
