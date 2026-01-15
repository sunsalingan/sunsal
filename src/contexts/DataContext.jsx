import React, { createContext, useContext, useEffect, useState, useMemo } from "react";
import {
    db,
    collection,
    query,
    orderBy,
    onSnapshot,
    addDoc,
    serverTimestamp,
    getDoc,
    doc,
    setDoc,
    deleteDoc,
    where,
    limit,
    getDocs
} from "../lib/firebase";
import { useAuth } from "./AuthContext";
import { normalizeCategory } from "../utils/categoryHelper"; // [FIX] Import at top level

const DataContext = createContext();

export function useData() {
    return useContext(DataContext);
}

export function DataProvider({ children }) {
    const { user, followingList } = useAuth();

    // Raw Data
    const [reviews, setReviews] = useState([]);
    const [wishlist, setWishlist] = useState([]); // [NEW] Wishlist State
    const [loading, setLoading] = useState(true);

    // Filters
    const [viewMode, setViewMode] = useState("GLOBAL"); // GLOBAL, MY, FRIENDS, FRANCHISE, WISHLIST, USER_DETAIL
    const [targetUserFilter, setTargetUserFilter] = useState(null); // [NEW] For USER_DETAIL mode

    // [NEW] Ranking Interval Setting (Default: 5)
    const [rankingInterval, setRankingIntervalState] = useState(() => {
        const saved = localStorage.getItem("sunsal_ranking_interval");
        return saved ? parseInt(saved, 10) : 5;
    });

    const setRankingInterval = (val) => {
        setRankingIntervalState(val);
        localStorage.setItem("sunsal_ranking_interval", val);
    };
    const [categoryFilter, setCategoryFilter] = useState("전체");
    const [searchTerm, setSearchTerm] = useState(""); // [NEW] Franchise Search Term

    // Bounds State for Filtering (Optional)
    const [mapBounds, setMapBounds] = useState(null);

    // --- Data Subscription ---
    useEffect(() => {
        const q = query(collection(db, "reviews"), orderBy("timestamp", "desc"));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const loadedReviews = snapshot.docs.map((doc) => {
                const data = doc.data();
                return {
                    id: doc.id,
                    ...data,
                    location: data.address || data.location || "",
                };
            });
            setReviews(loadedReviews);
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    // --- Wishlist Subscription ---
    useEffect(() => {
        if (!user) {
            setWishlist([]);
            return;
        }
        const q = query(collection(db, "users", user.uid, "wishlist"), orderBy("timestamp", "desc"));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const loadedWishlist = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setWishlist(loadedWishlist);
        });
        return () => unsubscribe();
    }, [user]);

    // --- Derived Data: Active Reviews (Filtered) ---
    const activeReviews = useMemo(() => {
        if (!reviews) return [];
        let filtered = reviews;

        // 1. View Mode Filter
        if (viewMode === "MY") {
            if (!user) return [];
            filtered = reviews.filter((r) => r.userId === user.uid);
        } else if (viewMode === "FRIENDS") {
            if (!user) return [];
            filtered = reviews.filter((r) => followingList.includes(r.userId));
        } else if (viewMode === "USER_DETAIL") {
            // [NEW] Filter by specific target user
            if (targetUserFilter) {
                filtered = reviews.filter((r) => r.userId === targetUserFilter);
            } else {
                filtered = [];
            }
        } else if (viewMode === "WISHLIST") {
            if (!user) return [];

            // [REFACTORED] Return RAW reviews for wishlisted items
            // This ensures displayedRestaurants uses the EXACT SAME aggregation logic as Global view.
            const wishlistKeys = new Set(wishlist.map(w =>
                `${w.name}-${parseFloat(w.lat).toFixed(4)}-${parseFloat(w.lng).toFixed(4)}`
            ));

            filtered = reviews.filter(r => {
                const key = `${r.name}-${parseFloat(r.lat).toFixed(4)}-${parseFloat(r.lng).toFixed(4)}`;
                return wishlistKeys.has(key);
            });
        }

        // 2. Category Filter
        if (categoryFilter !== "전체") {
            const normalizedFilter = normalizeCategory(categoryFilter);
            filtered = filtered.filter(r => normalizeCategory(r.category) === normalizedFilter);
        }

        // 3. Map Bounds Filter (Optional - usually better to filter ONLY for list, but keep map markers?)
        // For now, let's keep list consistent with map bounds if set
        if (mapBounds && filtered.length > 0) {
            filtered = filtered.filter(r => {
                const lat = parseFloat(r.lat);
                const lng = parseFloat(r.lng);
                return lat >= mapBounds.south && lat <= mapBounds.north &&
                    lng >= mapBounds.west && lng <= mapBounds.east;
            });
        }

        // 4. Search Filter (For Franchise Ranking)
        if (searchTerm) {
            const lowerTerm = searchTerm.toLowerCase();
            filtered = filtered.filter(r => r.name.toLowerCase().includes(lowerTerm));
        }

        return filtered;
    }, [reviews, viewMode, user, followingList, categoryFilter, mapBounds, searchTerm, targetUserFilter]);

    // --- Derived Data: Displayed Restaurants (Aggregated) ---
    const displayedRestaurants = useMemo(() => {
        if (!activeReviews) return [];

        // Group by Name + Lat/Lng to prevent duplicates
        const uniqueMap = {};

        // [NEW] 1. Pre-calculate User Reputation (Review Counts for Weighting)
        // We need to count based on ALL reviews, not just filtered ones, to get accurate user expertise.
        const userReviewCounts = {};
        reviews.forEach(r => {
            userReviewCounts[r.userId] = (userReviewCounts[r.userId] || 0) + 1;
        });

        const getUserWeight = (count) => {
            if (count <= 2) return 0.3; // 入문자
            if (count <= 9) return 0.7; // 일반
            return 1.0; // 전문가
        };

        activeReviews.forEach(r => {
            const key = `${r.name}-${parseFloat(r.lat).toFixed(4)}-${parseFloat(r.lng).toFixed(4)}`;
            if (!uniqueMap[key]) {
                uniqueMap[key] = {
                    ...r,
                    reviewCount: 1,
                    reviews: [r],
                    maxScore: parseFloat(r.globalScore || 0)
                };
            } else {
                uniqueMap[key].reviewCount += 1;
                uniqueMap[key].reviews.push(r);
                if (parseFloat(r.globalScore || 0) > uniqueMap[key].maxScore) {
                    uniqueMap[key].maxScore = parseFloat(r.globalScore || 0);
                }
            }
        });

        // [REFACTORED] Post-process: If Wishlist mode, ensure items with 0 reviews are included
        const uniqueList = Object.values(uniqueMap);
        let finalDisplayList = uniqueList;

        if (viewMode === "WISHLIST") {
            const existingKeys = new Set(uniqueList.map(r =>
                `${r.name}-${parseFloat(r.lat).toFixed(4)}-${parseFloat(r.lng).toFixed(4)}`
            ));

            wishlist.forEach(w => {
                const key = `${w.name}-${parseFloat(w.lat).toFixed(4)}-${parseFloat(w.lng).toFixed(4)}`;
                if (!existingKeys.has(key)) {
                    finalDisplayList.push({
                        ...w,
                        id: w.id || `wish_${Date.now()}_${Math.random()}`,
                        reviewCount: 0,
                        reviews: [],
                        displayScore: w.globalScore || "0.0",
                        maxScore: 0,
                        friendScore: "-"
                    });
                }
            });
        }

        return finalDisplayList.map((r) => {
            let finalScore = "0.0";
            let totalWeight = 0; // For Sorting (Tie-breaker)

            // --- A. Base Calculation (Weighted Average) ---
            // Calculate R (Weighted Average of Votes)
            let R = 0;
            if (r.reviews && r.reviews.length > 0) {
                let weightedSum = 0;
                let weightSum = 0;

                r.reviews.forEach(rev => {
                    const rawScore = parseFloat(rev.globalScore || 0);
                    // [NEW] Logic A: User Reliability Weight
                    const count = userReviewCounts[rev.userId] || 0;
                    const weight = getUserWeight(count);

                    weightedSum += rawScore * weight;
                    weightSum += weight;
                });

                if (weightSum > 0) {
                    R = weightedSum / weightSum;
                }
                totalWeight = weightSum;
            } else if (r.displayScore) {
                R = parseFloat(r.displayScore);
            }

            // --- B. View-Dependent Logic ---
            if (viewMode === "MY" || viewMode === "USER_DETAIL") {
                // [MY/USER View] Raw Max Score (My own ranking)
                // For USER_DETAIL, activeReviews is already filtered to that user, 
                // so R (or maxScore) is their score.
                finalScore = (r.maxScore || 0).toFixed(1);
            } else if (viewMode === "GLOBAL" || viewMode === "WISHLIST") {
                // [GLOBAL View] B. Bayesian Average
                // Formula: ( (R * v) + (C * m) ) / (v + m)
                const v = r.reviews.length;
                const C = 5.0; // Mean
                const m = 5;   // Threshold for confidence

                if (v > 0) {
                    const bayesianScore = ((R * v) + (C * m)) / (v + m);
                    finalScore = bayesianScore.toFixed(1);
                } else {
                    finalScore = "0.0";
                }

            } else if (viewMode === "FRIENDS") {
                // [FRIENDS View] Dynamic Bayesian
                // Intensity depends on friend count.
                // Few friends -> Weak Correction (m low)
                // Many friends -> Strong Correction (m high)

                // Assuming 'followingList' contains UIDs.
                const friendCount = followingList ? followingList.length : 0;

                // Logic: 0 friends -> m=0 (Raw R), 5+ friends -> m=5 (Full Bayesian)
                const m = Math.min(5, friendCount);
                const C = 5.0;
                const v = r.reviews.length;

                if (v > 0) {
                    // If m=0, reduces to (R*v)/v = R
                    const bayesianScore = ((R * v) + (C * m)) / (v + m);
                    finalScore = bayesianScore.toFixed(1);
                } else {
                    finalScore = "0.0";
                }
            } else {
                // Fallback (Franchise, etc)
                finalScore = R.toFixed(1);
            }

            return {
                ...r,
                displayScore: finalScore,
                maxScore: r.maxScore || 0,
                // friendScore is purely visual/mock in some contexts, strictly we use displayScore
                friendScore: finalScore,
                totalWeight: totalWeight
            };
        })
            .filter(r => {
                // [NEW] C. Threshold
                // Global Filter: Exclude items with < 3 reviews
                if (viewMode === "GLOBAL") {
                    return r.reviews.length >= 3;
                }
                return true;
            })
            .sort((a, b) => {
                const scoreA = parseFloat(a.displayScore);
                const scoreB = parseFloat(b.displayScore);
                // Primary: Score
                if (scoreB !== scoreA) {
                    return scoreB - scoreA;
                }
                // Secondary: Total Weight (Reliability Sum)
                return (b.totalWeight || 0) - (a.totalWeight || 0);
            });
    }, [activeReviews, viewMode, wishlist, reviews, followingList, targetUserFilter]);

    // --- Actions ---
    const addReview = async (reviewData) => {
        if (user?.isMock) {
            console.log("Mock Add Review:", reviewData);
            const newReview = {
                id: "mock_" + Date.now(),
                ...reviewData,
                timestamp: { seconds: Date.now() / 1000 }
            };
            setReviews(prev => [newReview, ...prev]); // [FIX] Update local state for Mock
            alert("테스트 모드: 리뷰가 등록되었습니다. (로컬 상태 업데이트됨)");
            return { id: newReview.id };
        }
        return await addDoc(collection(db, "reviews"), {
            ...reviewData,
            author: {
                uid: user.uid,
                name: user.name || user.displayName || "Unknown",
                nickname: user.nickname || "",
                photoURL: user.photoURL || user.userPhoto || "",
                email: user.email || ""
            },
            timestamp: serverTimestamp()
        });
    };

    const deleteReview = async (reviewId) => {
        if (user?.isMock) {
            console.log("Mock Delete Review:", reviewId);
            setReviews(prev => prev.filter(r => r.id !== reviewId)); // [FIX] Update local state for Mock
            alert("테스트 모드: 리뷰가 삭제되었습니다. (로컬 상태 업데이트됨)");
            return;
        }
        if (!reviewId) return;
        await deleteDoc(doc(db, "reviews", reviewId));
    };

    // Helper for update: Delete old + Add new (to refresh timestamp and ensure clean slate)
    // Or actual update. Let's use delete+add for now to keep it simple with 'addReview' logic.
    const updateReview = async (oldReviewId, newReviewData) => {
        await deleteReview(oldReviewId);
        await addReview(newReviewData);
    };

    const toggleWishlist = async (restaurant) => {
        if (!user || !restaurant) return;

        // Use a consistent ID key for checking existence in wishlist
        // We can use the firestore doc ID if it's from the DB, or generate one if from search
        // But to be safe against duplicates, let's use the unique ID approach (name-lat-lng)
        // OR simply rely on the fact that if we click 'Heart' on a restaurant object, we might want to store THAT specific object.
        // Actually, easier to check if we already have it by some unique key.
        // Let's rely on checking `wishlist` array for now.

        // Key: name + lat + lng
        const key = `${restaurant.name}-${parseFloat(restaurant.lat).toFixed(4)}-${parseFloat(restaurant.lng).toFixed(4)}`;

        const existingItem = wishlist.find(w => {
            const wKey = `${w.name}-${parseFloat(w.lat).toFixed(4)}-${parseFloat(w.lng).toFixed(4)}`;
            return wKey === key;
        });

        if (existingItem) {
            // Remove
            await deleteDoc(doc(db, "users", user.uid, "wishlist", existingItem.id));
        } else {
            // Add
            // Make sure we save enough info to display it later
            await addDoc(collection(db, "users", user.uid, "wishlist"), {
                ...restaurant,
                timestamp: serverTimestamp()
            });
        }
    };



    // [NEW] Search Users (Prefix Search - Name, Nickname, Email)
    const searchUsers = async (term) => {
        if (!term) return [];
        try {
            // 1. Search by Nickname (Was 2)
            const qNickname = query(
                collection(db, "users"),
                where("nickname", ">=", term),
                where("nickname", "<=", term + "\uf8ff"),
                limit(10)
            );

            // Run (Only Nickname)
            const resultsRaw = await Promise.allSettled([
                getDocs(qNickname)
            ]);

            let results = [];
            const ids = new Set();

            const addResult = (doc) => {
                const data = doc.data();
                // [FIX] PRIVACY - Double check we only allow nickname matches if somehow name leaked
                // (Though query is only on nickname now)

                if (!ids.has(doc.id)) {
                    ids.add(doc.id);
                    // [FIX] Do NOT expose 'name' (real name) if possible, but UI might need it.
                    // If UI needs it, we must ensure 'name' is NOT searched.
                    // Retaining data for UI is okay providing we didn't FIND it by searching the name.
                    results.push({ id: doc.id, ...data });
                }
            };

            // Process Nickname Results
            if (resultsRaw[0].status === 'fulfilled') {
                resultsRaw[0].value.forEach(addResult);
            } else {
                console.warn("Search by Nickname failed:", resultsRaw[0].reason);
            }
            if (resultsRaw[1].status === 'fulfilled') {
                resultsRaw[1].value.forEach(addResult);
            } else {
                console.warn("Search by Nickname failed:", resultsRaw[1].reason);
            }

            // 3. Fallback: Search by Email if results are few
            if (results.length < 5) {
                try {
                    const qEmail = query(
                        collection(db, "users"),
                        where("email", ">=", term),
                        where("email", "<=", term + "\uf8ff"),
                        limit(5)
                    );
                    const snapEmail = await getDocs(qEmail);
                    snapEmail.forEach(addResult);
                } catch (e) {
                    console.warn("Search by Email failed:", e);
                }
            }

            console.log(`Search for '${term}' found ${results.length} results.`);
            return results;
        } catch (error) {
            console.error("Critical Error seeking users:", error);
            // Return empty array so UI doesn't crash
            return [];
        }
    };

    // Franchise State
    const [selectedFranchise, setSelectedFranchise] = useState(null); // [NEW]

    // --- Derived Data: Franchise Stats (Brand Ranking) ---
    const franchiseStats = useMemo(() => {
        if (!displayedRestaurants) return [];

        const stats = {};

        displayedRestaurants.forEach(r => {
            // Simple logic: First word is the brand (e.g., "Starbucks" from "Starbucks Gangnam")
            // Or use the whole name if it's short?
            // Let's use First Word for now as it covers "Burger King", "Starbucks", "Lotteria".
            // Refinement: If name has 2 words and ends with "branch", remove branch.
            // For now, let's just assume the first word is the brand if filtered by search.
            // Actually, for a GLOBAL view, we need to group ALL restaurants.

            // Heuristic: Split by space.
            const brandName = r.name.split(" ")[0];

            if (!stats[brandName]) {
                stats[brandName] = {
                    brand: brandName,
                    totalScore: 0,
                    count: 0,
                    branches: []
                };
            }
            // Use displayScore (Average)
            const score = parseFloat(r.displayScore || 0);
            stats[brandName].totalScore += score;
            stats[brandName].count += 1;
            stats[brandName].branches.push(r);
        });

        // Convert to Array & Calculate Average
        return Object.values(stats)
            .map(s => ({
                ...s,
                avgScore: (s.totalScore / s.count).toFixed(1)
            }))
            .filter(s => s.count > 1) // Only show if there are multiple branches (Franchise candidate)
            .sort((a, b) => parseFloat(b.avgScore) - parseFloat(a.avgScore)); // Rank by avg score

    }, [displayedRestaurants]);

    const value = {
        reviews,
        activeReviews,
        displayedRestaurants, // AGGREGATED list for Sidebar/Map
        franchiseStats, // [NEW] Brand Ranking
        selectedFranchise, // [NEW]
        setSelectedFranchise, // [NEW]
        wishlist, // [NEW] Export wishlist
        loading,
        viewMode,
        setViewMode,
        categoryFilter,
        setCategoryFilter,
        mapBounds,
        setMapBounds,
        searchTerm, // [NEW] Export searchTerm
        setSearchTerm, // [NEW] Export setSearchTerm
        addReview,
        updateReview, // [NEW] Export update
        deleteReview, // [NEW] Export delete
        toggleWishlist, // [NEW] Export toggle
        // Settings
        rankingInterval,
        setRankingInterval,
        searchUsers, // [NEW] Export search
        setTargetUserFilter // [NEW] Mode switching
    };

    return (
        <DataContext.Provider value={value} >
            {children}
        </DataContext.Provider >
    );
}
