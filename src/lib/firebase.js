import { initializeApp } from "firebase/app";
import { getFunctions, httpsCallable } from "firebase/functions";
import {
    getAuth,
    GoogleAuthProvider,
    signInWithPopup,
    signOut,
    onAuthStateChanged,
} from "firebase/auth";
import {
    getFirestore,
    collection,
    doc,
    getDoc,
    setDoc,
    updateDoc,
    addDoc,
    deleteDoc,
    query,
    where,
    orderBy,
    onSnapshot,
    serverTimestamp,
    arrayUnion,
    arrayRemove,
    getDocs,
    limit,
    writeBatch,
    increment,
    deleteField
} from "firebase/firestore";

const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
    measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const functions = getFunctions(app, 'us-central1'); // [NEW] Export functions instance
export const googleProvider = new GoogleAuthProvider();

export {
    signInWithPopup,
    signOut,
    onAuthStateChanged,
    collection,
    doc,
    setDoc,
    getDoc,
    updateDoc,
    addDoc,
    deleteDoc,
    query,
    where,
    orderBy,
    onSnapshot,
    serverTimestamp,
    arrayUnion,
    arrayRemove,
    getDocs,
    limit,
    writeBatch,
    increment,

    deleteField,
    httpsCallable // [NEW] Export httpsCallable
};
