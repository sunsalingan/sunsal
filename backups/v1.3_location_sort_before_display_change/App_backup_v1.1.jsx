import React, { useState, useEffect, useMemo, useRef } from "react";
import { X } from "lucide-react";

import {
    auth,
    db,
    googleProvider,
    signInWithPopup,
    signOut,
    onAuthStateChanged,
    collection,
    query,
    orderBy,
    onSnapshot,
    serverTimestamp,
    doc,
    setDoc,
    deleteDoc
} from "./lib/firebase";

import {
    MOCK_PLACES_DB,
    generateMockReviews,
    generateMockFriends,
} from "./data/mock";

// import { searchNaverPlaces } from "./services/naverApi";

import Header from "./components/layout/Header";
import MapArea from "./components/features/MapArea";
import RestaurantList from "./components/features/RestaurantList";
import Sidebar from "./components/layout/Sidebar";
import { getRecommendations } from "./utils/recommendation";
import { resetAndSeedData } from "./utils/seeder";



// import ReviewModal from "./components/features/ReviewModal";
// import ProfileModal from "./components/features/ProfileModal";
import RestaurantDetailModal from "./components/features/RestaurantDetailModal";
import RestaurantSearchModal from "./components/features/RestaurantSearchModal";

// Dummy Modals (SAFE MODE - FIXING CRASH)
const ReviewModal = () => null;
const ProfileModal = () => null;
// Real Modal is imported above
// const RestaurantSearchModal = () => null;


function App() {
    // --- Auth State ---
    const [user, setUser] = useState(null);

    // --- Data State ---
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);

    // --- UI State ---
    const [currentPage, setCurrentPage] = useState("MAIN");
    const [viewMode, setViewMode] = useState("GLOBAL");
    const [showMap, setShowMap] = useState(true);
    const useRealMap = true; // ENABLED (Protected by ErrorBoundary)
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [categoryFilter, setCategoryFilter] = useState("전체");

    // --- Modal State ---
    const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
    const [selectedRestaurant, setSelectedRestaurant] = useState(null);
    const [detailModalOpen, setDetailModalOpen] = useState(false);
    const [targetProfile, setTargetProfile] = useState(null); // For Profile Modal
    const [friendsListOpen, setFriendsListOpen] = useState(false); // If friends list is a modal

    // --- Ranking Group State ---
    const [expandedFolders, setExpandedFolders] = useState({});
    const toggleFolder = (folderId) => {
        setExpandedFolders(prev => ({ ...prev, [folderId]: !prev[folderId] }));
    };

    const [followingList, setFollowingList] = useState([]);
    const [wishlist, setWishlist] = useState([]);

    // --- Map State ---
    const [mapInstance, setMapInstance] = useState(null);
    const markersRef = useRef([]);
    const [isMapMoved, setIsMapMoved] = useState(false);
    const [mapBounds, setMapBounds] = useState(null);
    const [restaurantSearchOpen, setRestaurantSearchOpen] = useState(false);

    // --- Seeder Logic ---
    const handleResetAndSeed = async () => {
        if (confirm("정말 모든 데이터를 초기화하시겠습니까? (Mock 데이터로 복구됨)")) {
            await resetAndSeedData();
            window.location.reload();
        }
    };

    // --- Auth Subscription ---
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            setUser(currentUser);
            if (currentUser) {
                try {
                    const followRef = collection(db, "users", currentUser.uid, "following");
                    onSnapshot(followRef, (snapshot) => {
                        setFollowingList(snapshot.docs.map(d => d.id));
                    });
                    // Subscribe Wishlist
                    onSnapshot(collection(db, "users", currentUser.uid, "wishlist"), (snap) => {
                        setWishlist(snap.docs.map(d => ({ id: d.id, ...d.data() })));
                    });
                } catch (e) { console.error(e) }
            } else {
                setFollowingList([]);
                setWishlist([]);
            }
        });
        return () => unsubscribe();
    }, []);

    // --- Main Data Subscription ---
    useEffect(() => {
        // Safety Fallback
        const safetyTimer = setTimeout(() => {
            if (loading && reviews.length === 0) {
                console.warn("Safety Timer: Loading Mock Data");
                setReviews(generateMockReviews());
                setLoading(false);
            }
        }, 2000);

        try {
            const q = query(collection(db, "reviews"), orderBy("timestamp", "desc"));
            const unsubscribe = onSnapshot(q, (snapshot) => {
                const loaded = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setReviews(loaded.length > 0 ? loaded : generateMockReviews());
                setLoading(false);
                clearTimeout(safetyTimer);
            }, (err) => {
                console.error("Firestore Error:", err);
                setReviews(generateMockReviews());
                setLoading(false);
            });
            return () => unsubscribe();
        } catch (e) {
            console.error("Query Error:", e);
        }
    }, []);

    // --- Derived List ---
    const activeReviews = useMemo(() => {
        if (!reviews) return [];
        let list = reviews;
        if (viewMode === "WISHLIST") return wishlist.map(w => ({ id: w.id, name: w.name, category: w.category, location: w.address, globalScore: "-", rankIndex: 0 }));
        if (viewMode === "AI_RECOMMEND") return getRecommendations(user, reviews, followingList);
        if (viewMode === "MY" && user) list = list.filter(r => r.userId === user.uid);
        else if (viewMode === "FRIENDS") list = list.filter(r => followingList.includes(r.userId));
        if (categoryFilter !== "전체") list = list.filter(r => r.category === categoryFilter);
        return list;
    }, [reviews, viewMode, user, categoryFilter, followingList, wishlist]);

    const displayedReviews = useMemo(() => {
        if (viewMode === "WISHLIST" || viewMode === "AI_RECOMMEND") return activeReviews;
        return (activeReviews || []).map((r) => ({
            ...r,
            displayScore: r.globalScore || (Math.random() * (9.9 - 8.0) + 8.0).toFixed(1),
        }));
    }, [activeReviews, viewMode]);


    // Handlers
    const handleLogin = async () => { try { await signInWithPopup(auth, googleProvider); } catch (e) { console.error(e); } };
    const handleLogout = () => signOut(auth);
    const handleSidebarNavigate = (menu) => {
        if (menu === "GLOBAL") setViewMode("GLOBAL");
        if (menu === "WISHLIST") setViewMode("WISHLIST");
        if (menu === "AI_RECOMMEND") setViewMode("AI_RECOMMEND");
        setSidebarOpen(false);
    };

    const handleOpenDetail = (restaurant) => {
        setSelectedRestaurant(restaurant);
        setDetailModalOpen(true);
    };

    const handleOpenProfile = (uid) => {
        setTargetProfile(uid);
    };

    return (
        <div className="h-screen w-full flex flex-col bg-slate-100 overflow-hidden font-sans text-slate-800">
            <Header
                currentPage={currentPage}
                user={user}
                viewMode={viewMode}
                showMap={showMap}
                useRealMap={useRealMap}
                setViewMode={setViewMode}
                setShowMap={setShowMap}
                setFriendsListOpen={() => setFriendsListOpen(true)} // Example if header button triggers it
                handleLogin={handleLogin}
                handleLogout={handleLogout}
                handleBackToMain={() => setCurrentPage("MAIN")}
                targetProfile={null}
                onMenuClick={() => setSidebarOpen(true)}
            />

            <Sidebar
                isOpen={sidebarOpen}
                onClose={() => setSidebarOpen(false)}
                user={user}
                handleLogout={handleLogout}
                onNavigate={handleSidebarNavigate}
            />

            <div className="flex-1 flex flex-col relative overflow-hidden max-w-2xl mx-auto w-full shadow-2xl bg-white">
                <div className="flex gap-2 p-3 bg-white border-b overflow-x-auto scrollbar-hide z-20 shrink-0">
                    {["전체", "한식", "일식", "양식", "중식", "카페"].map(cat => (
                        <button key={cat} onClick={() => setCategoryFilter(cat)}
                            className={`px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all ${categoryFilter === cat ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-500"}`}>
                            {cat}
                        </button>
                    ))}
                </div>

                {showMap && (
                    <MapArea
                        showMap={showMap}
                        mapInstance={mapInstance}
                        setMapInstance={setMapInstance}
                        markersRef={markersRef}
                        displayedReviews={displayedReviews}
                        handleOpenDetail={handleOpenDetail}
                        currentPage={currentPage}
                        setRestaurantSearchOpen={setRestaurantSearchOpen}
                        isMapMoved={isMapMoved}
                        setIsMapMoved={setIsMapMoved}
                        handleSearchInArea={() => setIsMapMoved(false)}
                        handleZoom={(d) => mapInstance && mapInstance.setZoom(mapInstance.getZoom() + d)}
                        onBoundsChanged={setMapBounds}
                    />
                )}

                <RestaurantList
                    displayedReviews={displayedReviews}
                    activeReviews={activeReviews}
                    loading={loading}
                    handleOpenDetail={handleOpenDetail}
                    currentPage={currentPage}
                    viewMode={viewMode}
                    onOpenProfile={handleOpenProfile}
                />
            </div>

            {/* --- MODALS --- */}
            {restaurantSearchOpen && (
                <RestaurantSearchModal
                    isOpen={true} // Fixed: Modal requires this prop to render
                    onClose={() => setRestaurantSearchOpen(false)} // Pass correctly
                    user={user}
                    onSelect={(place) => {
                        // Logic to add review or move map
                        setSelectedRestaurant({ ...place, isNew: true });
                        setIsReviewModalOpen(true);
                        setRestaurantSearchOpen(false);
                    }}
                />
            )}

            {detailModalOpen && selectedRestaurant && (
                <RestaurantDetailModal
                    restaurant={selectedRestaurant}
                    onClose={() => setDetailModalOpen(false)}
                    user={user}
                    allReviews={activeReviews}
                    onOpenReview={() => setIsReviewModalOpen(true)}
                    // Add handlers if needed for wishlist
                    onToggleWishlist={() => { }}
                    isWishlisted={false}
                />
            )}

            {isReviewModalOpen && selectedRestaurant && (
                <ReviewModal
                    restaurant={selectedRestaurant}
                    user={user}
                    onClose={() => setIsReviewModalOpen(false)}
                    onReviewSubmit={() => {
                        setIsReviewModalOpen(false);
                        // Refresh logic if needed
                    }}
                />
            )}

            {/* If you have a ProfileModal */}
            {targetProfile && (
                <ProfileModal
                    targetUserId={targetProfile}
                    onClose={() => setTargetProfile(null)}
                    currentUser={user}
                />
            )}

        </div>
    );
}

export default App;
