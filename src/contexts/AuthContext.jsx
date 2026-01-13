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
    onSnapshot,
    query,
    where,
    getDocs,
    writeBatch
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
            if (currentUser) {
                setUser(currentUser);
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
            } else {
                // Check for Mock User
                const mock = localStorage.getItem("sunsal_mock_user");
                if (mock) {
                    const mockUser = JSON.parse(mock);
                    setUser(mockUser);
                    setFollowingList([]); // No real following for mock unless we mock this too
                } else {
                    setUser(null);
                    setFollowingList([]);
                }
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const login = async (options) => {
        if (options && options.mock) {
            const mockUser = {
                uid: "mock_user_123",
                displayName: "테스트유저",
                email: "test@sunsal.com",
                photoURL: "https://api.dicebear.com/7.x/avataaars/svg?seed=Felix",
                isMock: true
            };
            localStorage.setItem("sunsal_mock_user", JSON.stringify(mockUser));
            setUser(mockUser);
            return;
        }

        try {
            await signInWithPopup(auth, googleProvider);
        } catch (error) {
            console.error("Login failed", error);
            throw error;
        }
    };

    const logout = () => {
        localStorage.removeItem("sunsal_mock_user");
        signOut(auth);
        setUser(null); // Force clear if it was mock
    };

    const updateUserProfile = async (newName) => {
        if (!user) return;
        if (!newName || newName.trim() === "") return;

        try {
            setLoading(true);
            // 1. Update Firestore User Doc
            const userRef = doc(db, "users", user.uid);
            await setDoc(userRef, { name: newName }, { merge: true });

            // 2. Batch Update Reviews (to keep consistency)
            const q = query(collection(db, "reviews"), where("userId", "==", user.uid));
            const snapshot = await getDocs(q);

            if (!snapshot.empty) {
                const batch = writeBatch(db);
                snapshot.docs.forEach(d => {
                    batch.update(d.ref, { userName: newName });
                });
                await batch.commit();
            }

            // 3. Update Local State
            // Note: Firebase Auth 'user' object is read-only for some properties or needs reload.
            // We'll update our local wrapper state.
            setUser(prev => ({ ...prev, displayName: newName, name: newName }));

            alert("닉네임 변경 및 리뷰 정보 업데이트 완료!");
        } catch (error) {
            console.error("Profile update failed", error);
            alert("업데이트 중 오류가 발생했습니다.");
        } finally {
            setLoading(false);
        }
    };

    const value = {
        user,
        followingList,
        login,
        logout,
        updateUserProfile, // [NEW]
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
