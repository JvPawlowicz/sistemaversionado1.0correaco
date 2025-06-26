import admin from 'firebase-admin';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';

const serviceAccount = {
  projectId: process.env.FIREBASE_PROJECT_ID,
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
};

// Check if all required environment variables are present
const hasAdminCredentials = serviceAccount.projectId && serviceAccount.clientEmail && serviceAccount.privateKey;

if (hasAdminCredentials && !admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    });
  } catch (error: any) {
    // In a serverless environment, sometimes initialization can be attempted multiple times.
    // We check if the error is about an existing app to avoid unnecessary noise in the logs.
    if (!/already exists/u.test(error.message)) {
      console.error('Firebase admin initialization error', error.stack);
    }
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
    console.warn("Firebase Admin SDK not initialized. Server-side Firebase features like user creation will not work. Please check your .env file and service account credentials.");
}


export const auth = authInstance as ReturnType<typeof getAuth>;
export const db = dbInstance as ReturnType<typeof getFirestore>;
export const storageAdmin = storageInstance as ReturnType<typeof getStorage>;
