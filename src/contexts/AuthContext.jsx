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
    getDoc
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
        // [NEW] Dev Login Backdoor
        const params = new URLSearchParams(window.location.search);
        if (params.get("dev_login") === "true") {
            console.log("Dev Login Activated");
            const mockUser = {
                uid: "dev_admin_user",
                displayName: "개발자",
                email: "dev@sunsal.com",
                photoURL: "https://api.dicebear.com/7.x/avataaars/svg?seed=Dev",
                isMock: true
            };
            localStorage.setItem("sunsal_mock_user", JSON.stringify(mockUser));
        }

        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            try {
                if (currentUser) {
                    setUser(currentUser);
                    // Sync user data to Firestore
                    const userRef = doc(db, "users", currentUser.uid);

                    // [FIX] First get existing data to avoid overwriting custom Changes
                    const userSnap = await getDoc(userRef);

                    if (userSnap.exists()) {
                        await setDoc(userRef, {
                            lastLogin: serverTimestamp(),
                            // Only update email if strictly necessary, but avoid overwriting name/photo
                            email: currentUser.email
                        }, { merge: true });
                    } else {
                        // New User - Initialize
                        await setDoc(userRef, {
                            name: currentUser.displayName, // Real Name as default
                            email: currentUser.email,
                            photoURL: currentUser.photoURL,
                            nickname: null, // Start with no nickname
                            lastLogin: serverTimestamp(),
                            createdAt: serverTimestamp()
                        });
                    }

                    // Logged in with updated data
                    const userData = userSnap.exists() ? userSnap.data() : {};

                    setUser({
                        ...currentUser,
                        ...userData, // Merge Firestore data (nickname, etc)
                        // [FIX] Prefer Nickname -> Name -> Google
                        displayName: userData.nickname || userData.name || currentUser.displayName,
                        uid: currentUser.uid,
                        email: currentUser.email
                    });

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
            } catch (error) {
                console.error("Auth State Change Error:", error);
                // Don't force logout on data fetch error. 
                // User is already set to 'currentUser' at start of try block.
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
        setUser(null); // Force clear if it was mock
    };

    // [NEW] Check Nickname Availability
    const checkNicknameAvailability = async (nickname) => {
        if (!nickname) return false;
        const q = query(collection(db, "users"), where("nickname", "==", nickname));
        const snapshot = await getDocs(q);

        if (snapshot.empty) return true;

        // [FIX] If query found something, check if ANY of them is ME
        if (user) {
            const isOwnedByMe = snapshot.docs.some(doc => doc.id === user.uid);
            if (isOwnedByMe) {
                console.log("Nickname owned by current user. Allow update.");
                return true;
            }
            console.error("Nickname taken by OTHER user(s):", snapshot.docs.map(d => d.id));
        }

        return false;
    };

    const updateUserProfile = async (newName, newNickname) => {
        if (!user) return;

        // Validation
        if (!newName || newName.trim() === "") {
            throw new Error("이름을 입력해주세요.");
        }
        if (newNickname) {
            if (newNickname.length < 2 || newNickname.length > 10) {
                throw new Error("닉네임은 2자 이상 10자 이하여야 합니다.");
            }
        }

        try {
            setLoading(true);

            // Check Uniqueness if nickname changed
            if (newNickname && newNickname !== user.nickname) {
                const isAvailable = await checkNicknameAvailability(newNickname);
                if (!isAvailable) {
                    throw new Error("이미 사용 중인 닉네임입니다.");
                }
            }

            // 1. Update Firestore User Doc
            const userRef = doc(db, "users", user.uid);
            const updateData = { name: newName };
            if (newNickname) {
                updateData.nickname = newNickname;
            }

            await setDoc(userRef, updateData, { merge: true });

            // 2. Batch Update Reviews (Update author object)
            // We update the full author object to ensure consistency
            const authorUpdate = {
                "author.name": newName,
                "author.nickname": newNickname || "",
                // We don't update photoURL here unless we have it, 
                // but user might want to keep old photo? 
                // Usually profile update includes photo, but here we only have name/nickname args.
                // Let's assume photo doesn't change here or we use current user's photo.
                "author.photoURL": user.photoURL || ""
            };

            // Legacy field compatibility (for older listeners/components)
            const legacyUpdate = { userName: newNickname || newName };

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

            // 3. Update Local State
            // 3. Update Local State
            setUser(prev => ({
                ...prev,
                displayName: newNickname || newName || prev.displayName,
                name: newName,
                nickname: newNickname // Update even if empty string (to remove it)
            }));

            alert("프로필이 성공적으로 업데이트되었습니다!");
        } catch (error) {
            console.error("Profile update failed", error);
            // Re-throw to let component handle alert
            throw error;
        } finally {
            setLoading(false);
        }
    };

    // [NEW] Follow Logic moved to AuthContext
    const followUser = async (targetInput) => {
        if (!user) {
            alert("로그인이 필요합니다.");
            return;
        }

        const targetId = typeof targetInput === 'string' ? targetInput : targetInput.id;
        if (!targetId) return;

        // Optimistic Update (Immediate Feedback)
        setFollowingList(prev => {
            if (prev.includes(targetId)) return prev;
            return [...prev, targetId];
        });

        // Save snapshot data
        const snapshotData = typeof targetInput === 'object' ? {
            name: targetInput.name || null,
            userPhoto: targetInput.userPhoto || null,
            email: targetInput.email || null,
            nickname: targetInput.nickname || null
        } : {};

        try {
            // [NEW] Atomic Counters
            const batch = writeBatch(db);

            // 1. Add to my 'following' subcollection
            const followingRef = doc(db, "users", user.uid, "following", targetId);
            batch.set(followingRef, {
                uid: targetId,
                ...snapshotData,
                timestamp: serverTimestamp()
            });

            // 2. Increment my 'following' count
            const myRef = doc(db, "users", user.uid);
            batch.update(myRef, {
                following: increment(1)
            });

            // 3. Increment target's 'followers' count
            const targetRef = doc(db, "users", targetId);
            batch.update(targetRef, {
                followers: increment(1)
            });

            await batch.commit();
        } catch (error) {
            console.error("Follow failed:", error);
            // Revert on failure
            setFollowingList(prev => prev.filter(id => id !== targetId));
            alert("팔로우 실패: " + error.message);
        }
    };

    const unfollowUser = async (targetId) => {
        if (!user) return;

        // Optimistic Update
        setFollowingList(prev => prev.filter(id => id !== targetId));

        try {
            const batch = writeBatch(db);

            // 1. Remove from subcollection
            const followingRef = doc(db, "users", user.uid, "following", targetId);
            batch.delete(followingRef);

            // 2. Decrement my 'following' count
            const myRef = doc(db, "users", user.uid);
            batch.update(myRef, {
                following: increment(-1)
            });

            // 3. Decrement target's 'followers' count
            const targetRef = doc(db, "users", targetId);
            batch.update(targetRef, {
                followers: increment(-1)
            });

            await batch.commit();
        } catch (error) {
            console.error("Unfollow failed:", error);
            // Revert
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
        followUser, // [EXPORT]
        unfollowUser // [EXPORT]
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
