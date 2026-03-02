# Update APK for New Domain

If your domain changes, follow these steps:

## 1. Update twa-manifest.json
Edit the `host` field with your new domain:
```json
{
  "host": "your-new-domain.com",
  ...
}
```

## 2. Update with Bubblewrap
```bash
bubblewrap update --manifest https://your-new-domain.com/manifest.json
```

## 3. Rebuild APK
```bash
bubblewrap build
```

## 4. New APK Generated
- `app-release-signed.apk` - Install on phones
- `app-release-bundle.aab` - Upload to Play Store

## Important Notes
- Users must uninstall old app and install new one
- Or increment version code in twa-manifest.json for updates
- Keep the same package ID (`com.meharfinance.app`) for updates
