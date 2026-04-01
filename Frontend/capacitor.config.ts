import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.meharfinance.app',
  appName: 'Mehar Finance',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
    // In dev mode, you can use the live reload server:
    // url: 'http://192.168.1.XX:5000',
    // cleartext: true
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#ffffff',
      showSpinner: true,
      androidScaleType: 'CENTER_CROP',
    },
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert'],
    },
  },
};

export default config;
