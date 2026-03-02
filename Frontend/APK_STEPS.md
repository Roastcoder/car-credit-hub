# Generate APK - Manual Steps

Your app is live at: https://car-credit-hub.lovable.app/login

## Run this command:
```bash
bubblewrap init --manifest https://car-credit-hub.lovable.app/manifest.json
```

## Answer the prompts:

1. **Install JDK?** → Press `Y` and Enter
2. **Install Android SDK?** → Press `Y` and Enter  
3. **App name:** → `Mehar Finance`
4. **Package ID:** → `com.meharfinance.app`
5. **Host:** → `car-credit-hub.lovable.app`
6. **Start URL:** → `/`
7. **Display mode:** → `standalone`
8. **Status bar color:** → `#0f172a`
9. **Navigation bar color:** → `#0f172a`
10. **Orientation:** → `default`
11. **Icon URL:** → Press Enter (use default)
12. **Maskable icon:** → Press Enter (use default)
13. **Shortcuts:** → Press Enter (none)
14. **Enable notifications:** → `Y`

## After init completes, build APK:
```bash
bubblewrap build
```

## APK Location:
`app-release-signed.apk` will be created in the current directory.

## Install on Android:
Transfer the APK to your phone and install it.
