import admin from 'firebase-admin';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';

// In a Firebase/Google Cloud environment like App Hosting,
// the SDK can automatically discover the credentials.
if (!admin.apps.length) {
  try {
    admin.initializeApp({
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    });
  } catch (error: any) {
    console.error('Firebase admin initialization error', error.stack);
  }
}

let authInstance: ReturnType<typeof getAuth> | null = null;
let dbInstance: ReturnType<typeof getFirestore> | null = null;
let storageInstance: ReturnType<typeof getStorage> | null = null;

if (admin.apps.length > 0) {
    authInstance = getAuth();
    dbInstance = getFirestore();
    storageInstance = getStorage();
} else {
    // Provide a warning during development if the admin SDK is not initialized.
    // This will appear in the server-side logs (your terminal).
    console.warn("Firebase Admin SDK not initialized. Server-side Firebase features will not work. Please check your service account credentials.");
}


export const auth = authInstance as ReturnType<typeof getAuth>;
export const db = dbInstance as ReturnType<typeof getFirestore>;
export const storageAdmin = storageInstance as ReturnType<typeof getStorage>;
