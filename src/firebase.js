import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, FacebookAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAnalytics } from "firebase/analytics";

// Configuración de Firebase
// Prioridad: Variables de entorno > Valores hardcodeados
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyC3umF6aSN5ghjYygbEzvhczdhxzxzYtrY",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "playup-3a22d.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "playup-3a22d",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "playup-3a22d.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "988140616118",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:988140616118:web:4888d1b6fda35456fe2917",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-V8418M1CXH"
};

// Validar que Firebase esté configurado
export const isFirebaseConfigured = () => {
  return firebaseConfig.apiKey !== "YOUR_API_KEY" && 
         firebaseConfig.projectId !== "YOUR_PROJECT_ID" &&
         firebaseConfig.apiKey.includes("AIza");
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// Inicializar Analytics solo en el cliente (no en SSR)
let analytics = null;
if (typeof window !== 'undefined') {
  try {
    analytics = getAnalytics(app);
  } catch (error) {
    console.warn('Analytics no disponible:', error);
  }
}
export { analytics };

// Configurar providers
export const googleProvider = new GoogleAuthProvider();
googleProvider.addScope('email');
googleProvider.addScope('profile');
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

export const facebookProvider = new FacebookAuthProvider();
facebookProvider.addScope('email');
facebookProvider.addScope('public_profile');




