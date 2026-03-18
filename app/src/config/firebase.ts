import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyBJfYTin19PncHS0-N6HTu_UCpStyP6sKQ',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'base-f5700.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'base-f5700',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'base-f5700.firebasestorage.app',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '346094727172',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:346094727172:web:662c18350260b405afc551',
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || 'G-WY99SKRJ5P',
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

export default app;
