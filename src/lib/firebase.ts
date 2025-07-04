import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { getStorage, type Storage } from 'firebase/storage';

// This configuration object will be populated by environment variables.
let firebaseConfig: any = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// In a deployed Firebase App Hosting environment (or Vercel),
// a single environment variable `NEXT_PUBLIC_FIREBASE_CONFIG` is provided.
// This logic checks for it and overrides the individual variables if it exists.
if (process.env.NEXT_PUBLIC_FIREBASE_CONFIG) {
    try {
        const parsedConfig = JSON.parse(process.env.NEXT_PUBLIC_FIREBASE_CONFIG);
        if (parsedConfig && parsedConfig.projectId) {
            firebaseConfig = parsedConfig;
        }
    } catch (e) {
        console.error("Failed to parse NEXT_PUBLIC_FIREBASE_CONFIG.", e);
    }
}


let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;
let storage: Storage | null = null;

const hasFirebaseConfig = firebaseConfig?.apiKey && firebaseConfig?.projectId;

if (hasFirebaseConfig) {
  try {
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
    auth = getAuth(app);
    db = getFirestore(app);
    storage = getStorage(app);
  } catch (e) {
    console.error("Failed to initialize Firebase. Please check your configuration.", e);
  }
} else {
    console.warn("Firebase client-side configuration is missing or incomplete. Please add your config to the .env file or check your build environment variables.");
}

export { app, auth, db, storage };
