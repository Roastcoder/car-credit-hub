#!/bin/bash

# Build Mehar Finance APK using Bubblewrap

echo "Building web app..."
npm run build

echo "Starting Bubblewrap init..."
echo "You'll need to provide:"
echo "1. App name: Mehar Finance"
echo "2. Package ID: com.meharfinance.app"
echo "3. Host: your-deployed-url.com"
echo "4. Manifest URL: https://your-deployed-url.com/manifest.json"
echo "5. Start URL: https://your-deployed-url.com/"

# Note: You need to deploy the app first and replace the URL below
# bubblewrap init --manifest https://your-deployed-url.com/manifest.json

echo ""
echo "Next steps:"
echo "1. Deploy your app to a live URL (Netlify, Vercel, etc.)"
echo "2. Run: bubblewrap init --manifest https://your-url.com/manifest.json"
echo "3. Run: bubblewrap build"
echo "4. APK will be generated in the current directory"
