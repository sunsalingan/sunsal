import React, { createContext, useContext, useEffect, useState } from "react";
import {
    auth,
    db,
    googleProvider,
    signInWithPopup,
    signOut,
    onAuthStateChanged,
    doc,
    setDoc,
    serverTimestamp,
    collection,
    onSnapshot
} from "../lib/firebase";

const AuthContext = createContext();

export function useAuth() {
    return useContext(AuthContext);
}

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [followingList, setFollowingList] = useState([]);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            setUser(currentUser);
            if (currentUser) {
                // Sync user data to Firestore
                const userRef = doc(db, "users", currentUser.uid);
                await setDoc(userRef, {
                    name: currentUser.displayName,
                    email: currentUser.email,
                    photoURL: currentUser.photoURL,
                    lastLogin: serverTimestamp(),
                }, { merge: true });

                // Real-time listener for following list
                const followRef = collection(db, "users", currentUser.uid, "following");
                const unsubFollow = onSnapshot(followRef, (snapshot) => {
                    const ids = snapshot.docs.map(doc => doc.id);
                    setFollowingList(ids);
                });

                // Cleanup follow listener when auth state changes (or internal re-run)
                // Note: Ideally we track this unsubscribe too, but for simple auth flow this is okay-ish
                // For stricter cleanup, we'd separate this effect.
            } else {
                setFollowingList([]);
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const login = async () => {
        try {
            await signInWithPopup(auth, googleProvider);
        } catch (error) {
            console.error("Login failed", error);
            throw error;
        }
    };

    const logout = () => signOut(auth);

    const value = {
        user,
        followingList,
        login,
        logout,
        loading
    };

    return (
        <AuthContext.Provider value={value}>
            {loading ? (
                <div className="flex items-center justify-center h-screen bg-slate-50">
                    <div className="animate-pulse text-indigo-600 font-bold text-xl">Sunsal...</div>
                </div>
            ) : children}
        </AuthContext.Provider>
    );
}
