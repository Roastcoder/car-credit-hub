import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { requestNotificationPermission, subscribeUserToPush } from "./lib/notifications";

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js').then(async () => {
    const permission = await requestNotificationPermission();
    if (permission === 'granted') {
      await subscribeUserToPush();
    }
  });
}

createRoot(document.getElementById("root")!).render(<App />);
