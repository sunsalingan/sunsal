
import { initializeApp } from "firebase/app";
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
} from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyAgKCb9Hnu1SVhDkcQ4qpcCcDwODNXXjHs",
    authDomain: "sunsal-ranking.firebaseapp.com",
    projectId: "sunsal-ranking",
    storageBucket: "sunsal-ranking.firebasestorage.app",
    messagingSenderId: "144649731408",
    appId: "1:144649731408:web:37cd49d6de1f1c4fdf8055",
    measurementId: "G-KVNRH9L4JG"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
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
};
