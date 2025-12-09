// src/lib/firebase.ts
import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { initializeAppCheck, ReCaptchaV3Provider } from "firebase/app-check";

const firebaseConfig = {
  apiKey: "AIzaSyCei3PaasaKTO69Qt0vBisGE-4wZCvyz2E",
  authDomain: "workshop-starter-480301.firebaseapp.com",
  projectId: "workshop-starter-480301",
  storageBucket: "workshop-starter-480301.firebasestorage.app",
  messagingSenderId: "268288153956",
  appId: "1:268288153956:web:5079eecb2258f59fd50271"
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);
const storage = getStorage(app);

// Initialize App Check (only in browser environment)
if (typeof window !== "undefined") {
  try {
      const recaptchaKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;
      
      // Only initialize if a key is present and not the default placeholder text we might have used in docs
      if (recaptchaKey && recaptchaKey !== "PLACEHOLDER_KEY") {
          initializeAppCheck(app, {
            provider: new ReCaptchaV3Provider(recaptchaKey),
            isTokenAutoRefreshEnabled: true,
          });
      }
  } catch (e) {
      // Silently fail or log to analytics in prod
      // console.error("App Check initialization failed", e);
  }
}

export { db, storage, app };
