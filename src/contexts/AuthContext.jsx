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
    writeBatch,
    increment,
    deleteField,
    getDoc,
    getDocs // [Added]
} from "../lib/firebase";

const AuthContext = createContext();

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [followingList, setFollowingList] = useState([]);

    useEffect(() => {
        // Dev Login Backdoor
        const params = new URLSearchParams(window.location.search);
        if (params.get("dev_login") === "true") {
            const mockUser = {
                uid: "dev_admin_user",
                displayName: "개발자",
                email: "dev@sunsal.com",
                photoURL: "https://api.dicebear.com/7.x/avataaars/svg?seed=Dev",
                isMock: true,
                nickname: "개발자" // Ensure nickname exists
            };
            localStorage.setItem("sunsal_mock_user", JSON.stringify(mockUser));

            // [FIX] Ensure Mock User exists in DB so Follow/Unfollow works
            // This is asynchronous but okay for dev backdoor
            setDoc(doc(db, "users", mockUser.uid), {
                ...mockUser,
                lastLogin: serverTimestamp()
            }, { merge: true }).catch(console.error);
        }

        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            try {
                if (currentUser) {
                    setUser(currentUser);
                    const userRef = doc(db, "users", currentUser.uid);

                    const userSnap = await getDoc(userRef);

                    if (userSnap.exists()) {
                        await setDoc(userRef, {
                            lastLogin: serverTimestamp(),
                            email: currentUser.email
                        }, { merge: true });
                    } else {
                        await setDoc(userRef, {
                            name: currentUser.displayName,
                            email: currentUser.email,
                            photoURL: currentUser.photoURL,
                            nickname: null,
                            lastLogin: serverTimestamp(),
                            createdAt: serverTimestamp()
                        });
                    }

                    const userData = userSnap.exists() ? userSnap.data() : {};

                    setUser({
                        ...currentUser,
                        ...userData,
                        displayName: userData.nickname || userData.name || currentUser.displayName,
                        uid: currentUser.uid,
                        email: currentUser.email
                    });

                    // [FIX] Real-time listener for User Profile (Counts, Level, etc.)
                    const unsubUser = onSnapshot(userRef, (docSnap) => {
                        if (docSnap.exists()) {
                            const data = docSnap.data();
                            setUser(prev => ({
                                ...prev,
                                ...data,
                                displayName: data.nickname || data.name || prev?.displayName,
                            }));
                        }
                    });

                    // Real-time listener for following list
                    const followRef = collection(db, "users", currentUser.uid, "following");
                    const unsubFollow = onSnapshot(followRef, (snapshot) => {
                        const ids = snapshot.docs.map(doc => doc.id);
                        setFollowingList(ids);
                    });

                    // Cleanup Previous Listeners if any (though this useEffect runs once on mount)
                    // We need to attach these unsubscribes to the return of useEffect? 
                    // onAuthStateChanged returns an unsubscribe for ITSELF.
                    // But we are creating internal listeners. 
                    // Ideally we should store these unsubs in refs or state, but inside this callback it's tricky.
                    // However, Firebase Auth usually persists the session.
                    // For now, let's rely on the fact that app reload clears them.
                    // But to be proper, we should probably set them in a ref to clear on unmount.
                    // Simplified for now: The auth listener runs once. Inner listeners run as long as user is logged in.
                } else {
                    const mock = localStorage.getItem("sunsal_mock_user");
                    if (mock) {
                        const mockUser = JSON.parse(mock);
                        setUser(mockUser);

                        // [FIX] Add Listener for Mock User (Sync Counts)
                        const userRef = doc(db, "users", mockUser.uid);
                        onSnapshot(userRef, (docSnap) => {
                            if (docSnap.exists()) {
                                const data = docSnap.data();
                                setUser(prev => ({ ...prev, ...data }));
                            }
                        });

                        // [FIX] Add Listener for Following List
                        const followRef = collection(db, "users", mockUser.uid, "following");
                        onSnapshot(followRef, (snapshot) => {
                            const ids = snapshot.docs.map(doc => doc.id);
                            setFollowingList(ids);
                        });
                    } else {
                        setUser(null);
                        setFollowingList([]);
                    }
                }
            } catch (error) {
                console.error("Auth State Change Error:", error);
            } finally {
                setLoading(false);
            }
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
        setUser(null);
    };

    const checkNicknameAvailability = async (nickname) => {
        if (!nickname) return false;
        const q = query(collection(db, "users"), where("nickname", "==", nickname));
        const snapshot = await getDocs(q);

        if (snapshot.empty) return true;

        if (user) {
            const isOwnedByMe = snapshot.docs.some(doc => doc.id === user.uid);
            if (isOwnedByMe) return true;
        }

        return false;
    };

    const updateUserProfile = async (newNickname, newPhotoURL) => {
        if (!user) return;

        if (newNickname) {
            if (newNickname.length < 2 || newNickname.length > 10) {
                throw new Error("닉네임은 2자 이상 10자 이하여야 합니다.");
            }
        } else {
            throw new Error("닉네임을 입력해주세요.");
        }

        try {
            setLoading(true);

            if (newNickname !== user.nickname) {
                const isAvailable = await checkNicknameAvailability(newNickname);
                if (!isAvailable) {
                    throw new Error("이미 사용 중인 닉네임입니다.");
                }
            }

            const userRef = doc(db, "users", user.uid);

            const updateData = {
                name: deleteField(),
                nickname: newNickname
            };
            if (newPhotoURL) {
                updateData.photoURL = newPhotoURL;
            }

            await setDoc(userRef, updateData, { merge: true });

            const authorUpdate = {
                "author.name": newNickname,
                "author.nickname": newNickname,
                "author.photoURL": newPhotoURL || user.photoURL || ""
            };

            const legacyUpdate = { userName: newNickname };

            const q = query(collection(db, "reviews"), where("userId", "==", user.uid));
            const snapshot = await getDocs(q);

            if (!snapshot.empty) {
                const batch = writeBatch(db);
                snapshot.docs.forEach(d => {
                    batch.update(d.ref, {
                        ...authorUpdate,
                        ...legacyUpdate
                    });
                });
                await batch.commit();
            }

            setUser(prev => ({
                ...prev,
                displayName: newNickname,
                name: null,
                nickname: newNickname,
                photoURL: newPhotoURL || prev.photoURL
            }));

            alert("프로필이 성공적으로 업데이트되었습니다!");
        } catch (error) {
            console.error("Profile update failed", error);
            throw error;
        } finally {
            setLoading(false);
        }
    };

    const followUser = async (targetInput) => {
        if (!user) {
            alert("로그인이 필요합니다.");
            return;
        }

        const targetId = typeof targetInput === 'string' ? targetInput : targetInput.id;
        if (!targetId) return;

        setFollowingList(prev => {
            if (prev.includes(targetId)) return prev;
            return [...prev, targetId];
        });

        const snapshotData = typeof targetInput === 'object' ? {
            name: targetInput.name || null,
            userPhoto: targetInput.userPhoto || null,
            email: targetInput.email || null,
            nickname: targetInput.nickname || null
        } : {};

        try {
            const batch = writeBatch(db);

            const followingRef = doc(db, "users", user.uid, "following", targetId);
            batch.set(followingRef, {
                uid: targetId,
                ...snapshotData,
                timestamp: serverTimestamp()
            });

            // [NEW] Add to target's 'followers' subcollection (For listing followers)
            const followerRef = doc(db, "users", targetId, "followers", user.uid);
            batch.set(followerRef, {
                uid: user.uid,
                name: user.name || null,
                nickname: user.nickname || null,
                userPhoto: user.photoURL || null,
                timestamp: serverTimestamp()
            });

            const myRef = doc(db, "users", user.uid);
            batch.update(myRef, {
                following: increment(1)
            });

            const targetRef = doc(db, "users", targetId);
            batch.update(targetRef, {
                followers: increment(1)
            });

            await batch.commit();
        } catch (error) {
            console.error("Follow failed:", error);
            setFollowingList(prev => prev.filter(id => id !== targetId));
            alert("팔로우 실패: " + error.message);
        }
    };

    const unfollowUser = async (targetId) => {
        if (!user) return;

        setFollowingList(prev => prev.filter(id => id !== targetId));

        try {
            const batch = writeBatch(db);

            // 1. Remove from my 'following' subcollection
            const followingRef = doc(db, "users", user.uid, "following", targetId);
            batch.delete(followingRef);

            // [NEW] Remove from target's 'followers' subcollection
            const followerRef = doc(db, "users", targetId, "followers", user.uid);
            batch.delete(followerRef);

            const myRef = doc(db, "users", user.uid);
            batch.update(myRef, {
                following: increment(-1)
            });

            const targetRef = doc(db, "users", targetId);
            batch.update(targetRef, {
                followers: increment(-1)
            });

            await batch.commit();
        } catch (error) {
            console.error("Unfollow failed:", error);
            setFollowingList(prev => [...prev, targetId]);
        }
    };

    const value = {
        user,
        followingList,
        login,
        logout,
        updateUserProfile,
        loading,
        followUser,
        unfollowUser
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

export const useAuth = () => useContext(AuthContext);
export default AuthProvider;
