import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { requestNotificationPermission, subscribeUserToPush } from "./lib/notifications";

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js').then(async () => {
    const permission = await requestNotificationPermission();
    if (permission === 'granted') {
      await subscribeUserToPush().catch(err => console.log('Push subscription failed:', err));
    }
  }).catch(err => console.log('SW registration failed:', err));
}

createRoot(document.getElementById("root")!).render(<App />);
