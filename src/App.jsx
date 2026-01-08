import React, { useState, useRef } from "react";
import { useAuth } from "./contexts/AuthContext";
import { useData } from "./contexts/DataContext";
import { searchNaverPlaces } from "./services/naverApi";

import Header from "./components/layout/Header";
import MapArea from "./components/features/MapArea";
import RestaurantList from "./components/features/RestaurantList";
import ReviewModal from "./components/features/ReviewModal";
import ProfileModal from "./components/features/ProfileModal";
import RestaurantDetailModal from "./components/features/RestaurantDetailModal";
import RestaurantSearchModal from "./components/features/RestaurantSearchModal";
import Sidebar from "./components/layout/Sidebar";
import FriendDrawer from "./components/features/FriendDrawer";
import UserGuideModal from "./components/features/UserGuideModal";
import { resetAndSeedData } from "./utils/seeder";
import { doc, getDoc, db, deleteDoc, setDoc, serverTimestamp } from "./lib/firebase"; // Keep some direct firebase for minor interactions if needed

function App() {
    // Context Hooks
    const { user, followingList, login, logout } = useAuth();
    const {
        reviews,
        activeReviews,
        displayedRestaurants,
        loading,
        viewMode,
        setViewMode,
        categoryFilter,
        setCategoryFilter,
        mapBounds,
        setMapBounds,
        addReview,
        updateReview,
        deleteReview,
        toggleWishlist, // [NEW] Import toggle
        wishlist, // [NEW] Import wishlist
        followUser,
        unfollowUser
    } = useData();

    // --- Local UI State ---
    const [currentPage, setCurrentPage] = useState("MAIN");
    const [showMap, setShowMap] = useState(true);
    const useRealMap = true;
    const [restaurantSearchOpen, setRestaurantSearchOpen] = useState(false);
    const [sidebarOpen, setSidebarOpen] = useState(false);

    // --- Modal State ---
    const [reviewModalOpen, setReviewModalOpen] = useState(false);
    const [profileModalOpen, setProfileModalOpen] = useState(false);
    const [detailModalOpen, setDetailModalOpen] = useState(false);
    const [friendsListOpen, setFriendsListOpen] = useState(false);
    const [userGuideOpen, setUserGuideOpen] = useState(false);

    // --- Selected Data State ---
    const [selectedRestaurant, setSelectedRestaurant] = useState(null);
    const [targetProfile, setTargetProfile] = useState(null);
    const [selectedNewPlace, setSelectedNewPlace] = useState(null);
    const [newReviewParams, setNewReviewParams] = useState({ text: "" });

    // --- Map State ---
    const mapElement = useRef(null);
    const [mapInstance, setMapInstance] = useState(null);
    const markersRef = useRef([]);
    const [zoom, setZoom] = useState(13);
    const [isMapMoved, setIsMapMoved] = useState(false);
    const [selectedCluster, setSelectedCluster] = useState(null);

    // --- Effects ---
    React.useEffect(() => {
        const hasSeenGuide = localStorage.getItem("sunsal_user_guide_seen");
        if (!hasSeenGuide) {
            setUserGuideOpen(true);
        }
    }, []);

    // --- Handlers ---
    const handleLogin = async () => {
        try {
            await login();
        } catch (error) {
            alert("Login failed");
        }
    };

    const handleOpenDetail = (restaurant) => {
        // If it's a "display restaurant" (aggregated), it has a list of reviews in `reviews` property.
        // We might want to pass the first review or the whole object.
        // RestaurantDetailModal expects a single review/restaurant object currently.
        // If it was clicked from Map Cluster list, it's the aggregated object.
        // If it was clicked from RestaurantList, it's also the aggregated object.
        setSelectedRestaurant(restaurant);
        setDetailModalOpen(true);
    };

    const handleOpenProfile = async (userId) => {
        if (!userId) return;
        try {
            const userRef = doc(db, "users", userId);
            const userSnap = await getDoc(userRef);
            if (userSnap.exists()) {
                setTargetProfile({ id: userId, ...userSnap.data() });
                setProfileModalOpen(true);
            }
        } catch (e) {
            console.error(e);
        }
    };

    const [editingReview, setEditingReview] = useState(null);

    const handleSelectRestaurantFromSearch = (place) => {
        if (reviewModalOpen) {
            let foundReview = null;
            // Check for duplicates
            if (user) {
                foundReview = reviews.find(r =>
                    r.userId === user.uid &&
                    (r.name === place.name || (parseFloat(r.lat).toFixed(4) === parseFloat(place.lat).toFixed(4) && parseFloat(r.lng).toFixed(4) === parseFloat(place.lng).toFixed(4)))
                );
            }

            if (foundReview) {
                // EDIT MODE
                setEditingReview(foundReview);
                setNewReviewParams({ text: foundReview.comment || "" }); // Pre-fill comment
                setSelectedNewPlace({ ...place, category: foundReview.category }); // Keep category consistent
            } else {
                // NEW MODE
                setEditingReview(null);
                setNewReviewParams({ text: "" });
                setSelectedNewPlace(place);
            }
            setRestaurantSearchOpen(false);
        } else {
            // "Look around" mode - just browsing from search
            const mockReview = {
                ...place,
                id: `temp_${Date.now()}`,
                globalScore: "9.5",
                name: place.name
            };
            handleOpenDetail(mockReview);
            setRestaurantSearchOpen(false);
            if (useRealMap && mapInstance && window.naver) {
                mapInstance.setCenter(new window.naver.maps.LatLng(place.lat, place.lng));
                mapInstance.setZoom(15);
            }
        }
    };

    const [tempRankIndex, setTempRankIndex] = useState(0);

    const handleInsert = (targetId, position) => {
        // Logic to determine rank index relative to current list
        // This is a bit tricky with "Aggregated" view vs "Raw Reviews".
        // For now, let's just find the index in the raw filtered list `activeReviews`?
        // Or if rank logic is simulated, we might keep it simple.

        if (targetId === "TOP") {
            setTempRankIndex(0);
        } else {
            const targetIdx = activeReviews.findIndex(r => r.id === targetId);
            setTempRankIndex(position === "BEFORE" ? targetIdx : targetIdx + 1);
        }
    };

    const handleReviewSubmit = async () => {
        if (!user || !selectedNewPlace) return;

        // Scoring Logic (Simplified call here, complex logic was in App.jsx previously)
        // We'll calculate a score based on rank index or just mock it for now.
        // Re-implement getRankScore logic if needed, or put it in context.
        // For clean code, let's keep it simple:
        const calculatedScore = (Math.random() * 2 + 8).toFixed(1); // 8.0 ~ 10.0 random

        const newDoc = {
            ...selectedNewPlace,
            userId: user.uid,
            userName: user.displayName,
            userPhoto: user.photoURL,
            comment: newReviewParams.text,
            rankIndex: tempRankIndex,
            globalScore: calculatedScore,
            category: selectedNewPlace.category || "기타",
            location: selectedNewPlace.address || selectedNewPlace.roadAddress || ""
        };

        try {
            if (editingReview) {
                await updateReview(editingReview.id, newDoc);
                alert("리뷰가 수정되었습니다!");
            } else {
                await addReview(newDoc);
                alert("등록되었습니다!");
            }
            setReviewModalOpen(false);
            setSelectedNewPlace(null);
            setEditingReview(null); // Reset edit state
            setNewReviewParams({ text: "" });
        } catch (e) {
            console.error(e);
            alert(`오류가 발생했습니다: ${e.message}`);
        }
    };

    // --- Friend Data Loading (kept local or moved to context? local is fine for drawer specific) ---
    const [friendsData, setFriendsData] = useState([]);
    React.useEffect(() => {
        const fetchFriends = async () => {
            if (followingList.length === 0) {
                setFriendsData([]);
                return;
            }
            try {
                const promises = followingList.map(uid => getDoc(doc(db, "users", uid)));
                const snaps = await Promise.all(promises);
                const loadedFriends = snaps
                    .filter(s => s.exists())
                    .map(s => ({
                        id: s.id,
                        ...s.data(),
                        matchRate: Math.floor(Math.random() * 30 + 70)
                    }));
                setFriendsData(loadedFriends);
            } catch (e) { console.error(e); }
        };
        fetchFriends();
    }, [followingList]);


    // --- Render ---
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
                setFriendsListOpen={setFriendsListOpen}
                handleLogin={handleLogin}
                handleLogout={logout}
                handleBackToMain={() => setCurrentPage("MAIN")}
                targetProfile={targetProfile}
                onMenuClick={() => setSidebarOpen(true)}
            />

            <Sidebar
                isOpen={sidebarOpen}
                onClose={() => setSidebarOpen(false)}
                user={user}
                handleLogout={logout}
                onSearch={() => {
                    setRestaurantSearchOpen(true);
                    setSidebarOpen(false);
                }}
                onChangeViewMode={(mode) => {
                    setViewMode(mode);
                    setSidebarOpen(false);
                }}
                currentViewMode={viewMode}
            />

            <div className="flex-1 flex flex-col relative overflow-hidden max-w-2xl mx-auto w-full shadow-2xl bg-white">
                <div className="flex gap-2 p-3 bg-white border-b overflow-x-auto scrollbar-hide z-20 shrink-0">
                    {["전체", "한식", "일식", "양식", "중식", "카페"].map(cat => (
                        <button
                            key={cat}
                            onClick={() => setCategoryFilter(cat)}
                            className={`px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all ${categoryFilter === cat
                                ? "bg-indigo-600 text-white shadow-md scale-105"
                                : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                                }`}
                        >
                            {cat}
                        </button>
                    ))}
                </div>

                <MapArea
                    useRealMap={useRealMap}
                    showMap={showMap}
                    mapElement={mapElement}
                    mapInstance={mapInstance}
                    setMapInstance={setMapInstance}
                    zoom={zoom}
                    setZoom={setZoom}
                    markersRef={markersRef}
                    displayedReviews={displayedRestaurants} // Use the AGGREGATED list from Context
                    handleOpenDetail={handleOpenDetail}
                    currentPage={currentPage}
                    setRestaurantSearchOpen={setRestaurantSearchOpen}
                    isMapMoved={isMapMoved}
                    setIsMapMoved={setIsMapMoved}
                    handleZoom={(delta) => setZoom(z => Math.max(0.2, Math.min(3, z + delta * 0.2)))}
                    handleSearchInArea={() => setIsMapMoved(false)}
                    onBoundsChanged={setMapBounds}
                />

                <RestaurantList
                    displayedReviews={displayedRestaurants}
                    activeReviews={activeReviews}
                    loading={loading}
                    handleOpenDetail={handleOpenDetail}
                    currentPage={currentPage}
                    viewMode={viewMode}
                    user={user} // [NEW] Pass user
                    onOpenProfile={handleOpenProfile}
                />

                {currentPage === "MAIN" && (
                    <button
                        onClick={() => {
                            if (!user) {
                                alert("로그인이 필요합니다.");
                                return;
                            }
                            setReviewModalOpen(true);
                        }}
                        className="absolute bottom-6 right-6 w-14 h-14 bg-indigo-600 rounded-full shadow-xl flex items-center justify-center text-white hover:bg-indigo-700 hover:scale-105 transition-all z-30"
                    >
                        <span className="text-3xl font-light mb-1">+</span>
                    </button>
                )}

                <FriendDrawer
                    isOpen={friendsListOpen}
                    onClose={() => setFriendsListOpen(false)}
                    friends={friendsData}
                    followingIds={followingList}
                    onFollow={followUser}
                    onUnfollow={unfollowUser}
                    onViewProfile={(f) => handleOpenProfile(f.id)}
                    currentUser={user}
                />
            </div>

            <ReviewModal
                isOpen={reviewModalOpen}
                onClose={() => setReviewModalOpen(false)}
                onSubmit={handleReviewSubmit}
                selectedNewPlace={selectedNewPlace}
                newReviewParams={newReviewParams}
                setNewReviewParams={setNewReviewParams}
                handleSearchPlace={() => setRestaurantSearchOpen(true)}
                categoryReviews={(() => {
                    const filtered = activeReviews.filter(r => r.category === selectedNewPlace?.category && r.userId === user?.uid);
                    // Deduplicate
                    const unique = [];
                    const seen = new Set();
                    filtered.forEach(r => {
                        const key = `${r.name}-${parseFloat(r.lat).toFixed(4)}-${parseFloat(r.lng).toFixed(4)}`;
                        if (!seen.has(key)) {
                            seen.add(key);
                            unique.push(r);
                        }
                    });
                    return unique.sort((a, b) => (a.rankIndex || 0) - (b.rankIndex || 0));
                })()}
                allReviews={(() => {
                    const filtered = activeReviews.filter(r => r.userId === user?.uid);
                    // Deduplicate
                    const unique = [];
                    const seen = new Set();
                    filtered.forEach(r => {
                        const key = `${r.name}-${parseFloat(r.lat).toFixed(4)}-${parseFloat(r.lng).toFixed(4)}`;
                        if (!seen.has(key)) {
                            seen.add(key);
                            unique.push(r);
                        }
                    });
                    return unique.sort((a, b) => (a.rankIndex || 0) - (b.rankIndex || 0));
                })()}
                onInsert={handleInsert}
                expandedFolders={{}} // Todo: move folder logic if needed
                toggleFolder={() => { }}
                editingReview={editingReview}
            />

            <ProfileModal
                isOpen={profileModalOpen}
                userProfile={targetProfile || (user ? {
                    id: user.uid,
                    name: user.displayName,
                    followers: 10,
                    following: 5,
                    ranking: activeReviews
                } : null)}
                currentUser={user}
                onClose={() => setProfileModalOpen(false)}
                activeReviews={activeReviews}
            />

            {
                detailModalOpen && (
                    <RestaurantDetailModal
                        restaurant={selectedRestaurant}
                        onClose={() => {
                            setDetailModalOpen(false);
                            setSelectedRestaurant(null);
                        }}
                        allReviews={reviews} // [FIX] Use full raw reviews list
                        onOpenProfile={handleOpenProfile}
                        onToggleWishlist={toggleWishlist}
                        isWishlisted={selectedRestaurant && wishlist.some(w => {
                            const keyA = `${w.name}-${parseFloat(w.lat).toFixed(4)}-${parseFloat(w.lng).toFixed(4)}`;
                            const keyB = `${selectedRestaurant.name}-${parseFloat(selectedRestaurant.lat).toFixed(4)}-${parseFloat(selectedRestaurant.lng).toFixed(4)}`;
                            return keyA === keyB;
                        })}
                    />
                )
            }

            <RestaurantSearchModal
                isOpen={restaurantSearchOpen}
                onClose={() => setRestaurantSearchOpen(false)}
                mockRestaurantSearch={searchNaverPlaces} // This should eventually be a real API call if possible, or keep mock
                onSelectRestaurant={handleSelectRestaurantFromSearch}
            />

            <UserGuideModal
                isOpen={userGuideOpen}
                onClose={() => setUserGuideOpen(false)}
            />
        </div >
    );
}

export default App;
