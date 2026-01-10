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
    const [viewMode, setViewMode] = useState("GLOBAL"); // GLOBAL, MY, FRIENDS, FRANCHISE
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
            filtered = filtered.filter(r => r.category === categoryFilter);
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
    }, [reviews, viewMode, user, followingList, categoryFilter, mapBounds, searchTerm]);

    // --- Derived Data: Displayed Restaurants (Aggregated) ---
    const displayedRestaurants = useMemo(() => {
        if (!activeReviews) return [];

        // Group by Name + Lat/Lng to prevent duplicates
        const uniqueMap = {};

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
                    // Add dummy item for Wishlist entry with no reviews
                    finalDisplayList.push({
                        ...w,
                        id: w.id || `wish_${Date.now()}_${Math.random()}`,
                        reviewCount: 0,
                        reviews: [],
                        displayScore: w.globalScore || "0.0", // Snapshot score or 0
                        maxScore: 0,
                        friendScore: "-"
                    });
                }
            });
        }

        return finalDisplayList.map((r) => {
            // Calculate Average Score
            // Handle 0 reviews case safely
            let avgScore = "0.0";
            if (r.reviews && r.reviews.length > 0) {
                const totalScore = r.reviews.reduce((sum, rev) => sum + parseFloat(rev.globalScore || 0), 0);
                avgScore = (totalScore / r.reviews.length).toFixed(1);
            } else if (r.displayScore) {
                avgScore = r.displayScore; // Fallback to snapshot
            }

            return {
                ...r,
                displayScore: avgScore, // Use Average Score
                maxScore: r.maxScore || 0, // Keep max for reference if needed
                friendScore: r.friendScore || (Math.random() * (9.9 - 8.0) + 8.0).toFixed(1),
            };
        }).sort((a, b) => {
            // Sort by Score Descending (High score first)
            return parseFloat(b.displayScore) - parseFloat(a.displayScore);
        });
    }, [activeReviews, viewMode, wishlist]); // Added viewMode, wishlist deps

    // --- Actions ---
    const addReview = async (reviewData) => {
        return await addDoc(collection(db, "reviews"), {
            ...reviewData,
            timestamp: serverTimestamp()
        });
    };

    const deleteReview = async (reviewId) => {
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

    const followUser = async (targetInput) => {
        if (!user || !targetInput) return;
        const targetId = typeof targetInput === 'string' ? targetInput : targetInput.id;
        if (!targetId) return;

        // Save some snapshot data if available (useful for lists)
        const snapshotData = typeof targetInput === 'object' ? {
            name: targetInput.name || null,
            userPhoto: targetInput.userPhoto || null,
            email: targetInput.email || null,
        } : {};

        await setDoc(doc(db, "users", user.uid, "following", targetId), {
            uid: targetId,
            ...snapshotData,
            timestamp: serverTimestamp()
        });
    };

    const unfollowUser = async (targetId) => {
        if (!user) return;
        await deleteDoc(doc(db, "users", user.uid, "following", targetId));
    };

    // [NEW] Search Users (Prefix Search)
    const searchUsers = async (term) => {
        if (!term) return [];
        try {
            const q = query(
                collection(db, "users"),
                where("name", ">=", term),
                where("name", "<=", term + "\uf8ff"),
                limit(10)
            );
            const snapshot = await getDocs(q);
            return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        } catch (error) {
            console.error("Error searching users:", error);
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
        followUser,
        unfollowUser,
        searchUsers // [NEW] Export search
    };

    return (
        <DataContext.Provider value={value} >
            {children}
        </DataContext.Provider >
    );
}
