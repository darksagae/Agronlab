import { initializeApp } from 'firebase/app';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getAuth, initializeAuth, getReactNativePersistence, connectAuthEmulator } from 'firebase/auth';
import { getStorage, connectStorageEmulator } from 'firebase/storage';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Firebase configuration
// Updated with actual credentials from your Firebase console
const firebaseConfig = {
  apiKey: "AIzaSyAPqAFqia-2SsOiyJ322HczYsDNymhX52Q", // From your Firebase console
  authDomain: "agrof-ef825.firebaseapp.com", // Project ID: agrof-ef825
  projectId: "agrof-ef825", // Your actual project ID
  storageBucket: "agrof-ef825.appspot.com", // Based on your project ID
  messagingSenderId: "471115379901", // Your project number
  appId: "1:471115379901:web:agrof-mobile-app", // Generated app ID for mobile
  measurementId: "G-XXXXXXXXXX" // Will be generated when you enable Analytics
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const db = getFirestore(app, 'default'); // Use the 'default' database instead of '(default)'

// Initialize Auth with React Native persistence (sessions survive app restarts)
export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage)
});

export const storage = getStorage(app);

console.log('🔐 Firebase Auth initialized with AsyncStorage persistence');

// Optional: Connect to Firebase emulators for development
// Uncomment these lines if you want to use local emulators
/*
if (__DEV__) {
  try {
    connectFirestoreEmulator(db, 'localhost', 8080);
    connectAuthEmulator(auth, 'http://localhost:9099');
    connectStorageEmulator(storage, 'localhost', 9199);
    console.log('🔥 Connected to Firebase emulators');
  } catch (error) {
    console.log('⚠️ Emulators already connected or not available');
  }
}
*/

export default app;
