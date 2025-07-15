import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { getStorage, type Storage } from 'firebase/storage';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyC8-Z_3Qc5Pdl6H9_AzJn5-oNYLlVx2NuY",
  authDomain: "clinicflow-5e4g7.firebaseapp.com",
  databaseURL: "https://clinicflow-5e4g7-default-rtdb.firebaseio.com",
  projectId: "clinicflow-5e4g7",
  storageBucket: "clinicflow-5e4g7.appspot.com",
  messagingSenderId: "850332513266",
  appId: "1:850332513266:web:142266b1561fbafc76716b"
};

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;
let storage: Storage | null = null;

try {
  app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
  auth = getAuth(app);
  db = getFirestore(app);
  storage = getStorage(app);
} catch (e) {
  console.error("Failed to initialize Firebase. Please check your configuration.", e);
}


export { app, auth, db, storage };
