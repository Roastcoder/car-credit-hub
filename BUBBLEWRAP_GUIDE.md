# Generate APK with Bubblewrap (FREE)

## Step 1: Deploy your app
Deploy to any free hosting:
- **Netlify**: https://netlify.com (drag & drop `dist` folder)
- **Vercel**: https://vercel.com (connect GitHub repo)
- **GitHub Pages**: Free with GitHub

## Step 2: Initialize Bubblewrap
```bash
bubblewrap init --manifest https://your-deployed-url.com/manifest.json
```

Answer the prompts:
- App name: `Mehar Finance`
- Package ID: `com.meharfinance.app`
- Host: `your-deployed-url.com`
- Start URL: `https://your-deployed-url.com/`

## Step 3: Build APK
```bash
bubblewrap build
```

APK will be generated: `app-release-signed.apk`

## Step 4: Install on Android
Transfer the APK to your phone and install it.

## Quick Deploy to Netlify
```bash
npm run build
# Drag & drop the 'dist' folder to netlify.com/drop
# Get your URL and use it in bubblewrap init
```
