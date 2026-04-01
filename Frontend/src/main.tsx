import { createRoot } from "react-dom/client";
import { App as CapacitorApp } from '@capacitor/app';
import { SplashScreen } from '@capacitor/splash-screen';
import App from "./App";
import "./index.css";

// Register Service Worker and handle updates
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').then((registration) => {
      // Check for updates
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // New update available
              if (window.confirm('A new version of Mehar Finance is available. Reload to update?')) {
                window.location.reload();
              }
            }
          });
        }
      });
    });
  });
}

// Native Hardware Back Button Integration
CapacitorApp.addListener('backButton', ({ canGoBack }) => {
  if (!canGoBack) {
    CapacitorApp.exitApp();
  } else {
    window.history.back();
  }
});


// Hide splash screen when app is ready
SplashScreen.hide();

createRoot(document.getElementById("root")!).render(<App />);
