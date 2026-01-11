import React, { useState, useRef } from "react";
import { Search } from "lucide-react"; // [NEW]
import { useAuth } from "./contexts/AuthContext";
import { useData } from "./contexts/DataContext";
import { searchNaverPlaces } from "./services/naverApi";
import { useReviewModal } from "./hooks/useReviewModal"; // [NEW]

import Header from "./components/layout/Header";
import MapArea from "./components/features/MapArea";
import RestaurantList from "./components/features/RestaurantList";
import ReviewModal from "./components/features/ReviewModal";
import ProfileModal from "./components/features/ProfileModal";
import UserProfileHeader from "./components/features/UserProfileHeader"; // [NEW]
import RestaurantDetailModal from "./components/features/RestaurantDetailModal";
import RestaurantSearchModal from "./components/features/RestaurantSearchModal";
import Sidebar from "./components/layout/Sidebar";
import FriendDrawer from "./components/features/FriendDrawer";
import UserGuideModal from "./components/features/UserGuideModal";
import UserSearchModal from "./components/features/UserSearchModal";
import UserListModal from "./components/features/UserListModal"; // [NEW]
import FranchiseRankingView from "./components/features/FranchiseRankingView"; // [NEW]
import FriendManagementModal from "./components/features/FriendManagementModal"; // [NEW]
import { resetAndSeedData } from "./utils/seeder";
import { getMatchRate } from "./utils/matchRate"; // [NEW]
import { doc, getDoc, db, deleteDoc, setDoc, serverTimestamp, collection, getDocs } from "./lib/firebase"; // Keep some direct firebase for minor interactions if needed

function App() {
    // Context Hooks
    const { user, followingList, login, logout } = useAuth();
    const {
        reviews,
        activeReviews,
        displayedRestaurants,
        franchiseStats, // [NEW]
        selectedFranchise, // [NEW]
        setSelectedFranchise, // [NEW]
        wishlist,
        loading,
        viewMode,
        setViewMode,
        categoryFilter,
        setCategoryFilter,
        mapBounds,
        setMapBounds,
        searchTerm, // [NEW]
        setSearchTerm, // [NEW]
        addReview,
        updateReview,
        deleteReview,
        toggleWishlist, // [NEW] Import toggle
        followUser,
        unfollowUser
    } = useData();

    // --- Local UI State ---
    const [currentPage, setCurrentPage] = useState("MAIN");
    const [showMap, setShowMap] = useState(true);
    const useRealMap = true;
    const [restaurantSearchOpen, setRestaurantSearchOpen] = useState(false);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [darkMode, setDarkMode] = useState(false); // [NEW] Dark Mode
    const [showFriendManagement, setShowFriendManagement] = useState(false); // [NEW]


    // --- Edit State (MOVED TO HOOK) ---
    // const [editingReview, setEditingReview] = useState(null); // [NEW] Review being edited

    // --- Modal State ---
    // const [reviewModalOpen, setReviewModalOpen] = useState(false);
    const reviewModal = useReviewModal(); // [NEW] Using Hook

    const [profileModalOpen, setProfileModalOpen] = useState(false);
    const [detailModalOpen, setDetailModalOpen] = useState(false);
    const [friendsListOpen, setFriendsListOpen] = useState(false);
    const [userGuideOpen, setUserGuideOpen] = useState(false);
    const [userSearchOpen, setUserSearchOpen] = useState(false);
    const [showUserListModal, setShowUserListModal] = useState(false); // [NEW]

    // --- Selected Data State ---
    const [selectedRestaurant, setSelectedRestaurant] = useState(null);
    const [targetProfile, setTargetProfile] = useState(null);
    const [profileViewUser, setProfileViewUser] = useState(null); // [NEW] Track which user's map we are viewing

    // const [selectedNewPlace, setSelectedNewPlace] = useState(null);
    // const [newReviewParams, setNewReviewParams] = useState({ text: "" });
    const [drawerTitle, setDrawerTitle] = useState("친구 목록"); // [NEW]
    const [expandedFolders, setExpandedFolders] = useState({}); // [NEW] For Ranking UI

    const toggleFolder = (id) => {
        setExpandedFolders(prev => ({
            ...prev,
            [id]: !prev[id]
        }));
    };

    // Handle "Visit Profile Page" from Profile Modal
    const handleVisitProfile = (userProfile) => {
        setProfileViewUser(userProfile);
        setProfileModalOpen(false);
        setDetailModalOpen(false);
        setCurrentPage("USER_PROFILE");
        setShowMap(false); // [CRITICAL] Hide map by default for profile page
        // We do NOT center map here because map is hidden.
        // But if user toggles map ON, it should be centered. 
        // We can set it when toggle happens or just pre-set it if possible.
        if (userProfile.ranking && userProfile.ranking.length > 0 && mapInstance && window.naver) {
            const top = userProfile.ranking[0];
            // We can still move the map instance even if hidden container (it exists in DOM)
            mapInstance.setCenter(new window.naver.maps.LatLng(top.lat, top.lng));
            mapInstance.setZoom(14);
        }
    };

    // --- Review Logic ---
    // (Consolidated below with other handlers)
    const mapElement = useRef(null);
    const [mapInstance, setMapInstance] = useState(null);
    const markersRef = useRef([]);
    const [zoom, setZoom] = useState(13);
    const [isMapMoved, setIsMapMoved] = useState(false);
    const [selectedCluster, setSelectedCluster] = useState(null);

    // [NEW] Compute Final Displayed Restaurants (Moved here to avoid ReferenceError)
    const finalDisplayedRestaurants = React.useMemo(() => {
        if (currentPage === "USER_PROFILE") {
            const targetUserId = profileViewUser ? profileViewUser.id : user?.uid;
            // Logic: Show all reviews from this user
            // Using `displayedRestaurants` from context is aggregated from `activeReviews`.
            // `activeReviews` is already filtered by `viewMode` in context, BUT:
            // Context might not know about `currentPage`.
            // If we are in "USER_PROFILE", we want to show THAT user's map.
            // We can manually filter `displayedRestaurants` here.
            return displayedRestaurants.filter(r => r.userId === targetUserId || r.reviews?.some(rev => rev.userId === targetUserId));
        }

        // [New] Franchise Mode Filtering for Map
        if (viewMode === "FRANCHISE") {
            if (selectedFranchise) {
                // Show only selected brand branches
                return displayedRestaurants.filter(r => r.name.split(" ")[0] === selectedFranchise.brand);
            } else {
                // Show ALL franchises (only those with >1 branches as per franchiseStats logic)
                // Get list of franchise brands
                const franchiseBrands = new Set(franchiseStats.map(f => f.brand));
                return displayedRestaurants.filter(r => franchiseBrands.has(r.name.split(" ")[0]));
            }
        }

        return displayedRestaurants;
    }, [displayedRestaurants, currentPage, profileViewUser, user, viewMode, selectedFranchise, franchiseStats]);

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

    // (Duplicate state removed)

    const handleSelectRestaurantFromSearch = (place) => {
        console.log("handleSelectRestaurantFromSearch Logic Check:", { reviewModalOpen: reviewModal.isOpen, place });
        if (reviewModal.isOpen) {
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
                reviewModal.openForEdit(foundReview);
            } else {
                // NEW MODE
                reviewModal.openForNew(place);
            }
            setRestaurantSearchOpen(false);
        } else {
            // "Look around" mode - just browsing from search
            const mockReview = {
                ...place,
                id: `temp_${Date.now()}`,
                globalScore: "0.0", // No score for look around
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

    // const [tempRankIndex, setTempRankIndex] = useState(0); // MOVED TO HOOK

    const handleInsert = (targetId, position) => {
        // ... (Keep existing logic)
        if (targetId === "TOP") {
            reviewModal.setTempRankIndex(0);
        } else {
            const targetIdx = activeReviews.findIndex(r => r.id === targetId);
            reviewModal.setTempRankIndex(position === "BEFORE" ? targetIdx : targetIdx + 1);
        }
    };

    const handleReviewSubmit = async (rankIndexFromModal) => {
        if (!user || !reviewModal.selectedNewPlace) return;

        // Score: User rejected manual star input.
        // We will default to 0.0 or some internal value if Score is no longer a concept.
        // Or if previously random, we might just set it to 0.
        // For now, let's keep it safe.
        const calculatedScore = 0;

        // Rank Index: Use the one passed from Modal (reliable) or fallback to temp state (unreliable)
        const finalRankIndex = (rankIndexFromModal !== undefined && rankIndexFromModal !== null)
            ? rankIndexFromModal
            : reviewModal.tempRankIndex;

        const newDoc = {
            ...reviewModal.selectedNewPlace,
            userId: user.uid,
            userName: user.displayName,
            userPhoto: user.photoURL,
            comment: reviewModal.newReviewParams.text,
            rankIndex: finalRankIndex,
            globalScore: calculatedScore,
            category: reviewModal.selectedNewPlace.category || "기타",
            location: reviewModal.selectedNewPlace.address || reviewModal.selectedNewPlace.roadAddress || ""
        };

        try {
            if (reviewModal.editingReview) {
                await updateReview(reviewModal.editingReview.id, newDoc);
                alert("리뷰가 수정되었습니다!");
            } else {
                await addReview(newDoc);
                alert("등록되었습니다!");
            }
            reviewModal.close();
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
                        matchRate: getMatchRate(user?.uid, s.id)
                    }));
                setFriendsData(loadedFriends);
            } catch (e) { console.error(e); }
        };
        fetchFriends();
    }, [followingList, user]);


    // --- Render ---
    return (
        <div className={`h-screen w-full flex flex-col overflow-hidden font-sans text-slate-800 transition-colors duration-300 ${darkMode ? "dark bg-slate-950 text-slate-100" : "bg-slate-100"}`}>
            {/* Outer Container with Dark Mode */}
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
                handleBackToMain={() => {
                    setCurrentPage("MAIN");
                    setProfileViewUser(null);
                    setShowMap(true); // [FIX] Show map when returning to main
                }}
                targetProfile={currentPage === "USER_PROFILE" ? profileViewUser : targetProfile}
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
                onOpenUserSearch={() => {
                    setUserSearchOpen(true);
                    setSidebarOpen(false);
                }}
                onOpenMyProfile={() => { // [NEW]
                    if (user) {
                        // [FIX] Construct a normalized profile object for the current user
                        // This ensures 'id' and 'name' are present as expected by Profile/Header components
                        const myProfileObj = {
                            ...user,
                            id: user.uid,
                            name: user.displayName,
                            // User object from Auth might differ from Firestore data structure
                            // Ideally we fetch from Firestore, but for speed we use Auth data
                            // The 'ranking' or 'followers' might be missing here if only using Auth object
                            // If we want full data, we should fetch it.
                            // But handleVisitProfile will eventually setProfileViewUser.
                        };
                        handleVisitProfile(myProfileObj);
                    }
                    else handleLogin();
                    setSidebarOpen(false);
                }}
                onOpenFriendManagement={() => { // [NEW]
                    // We'll implement a separate state for this modal
                    // For now let's reuse UserListModal but we need a dedicated "Management" modal as per request
                    // Let's create `showFriendManagement` state in App.jsx next
                    setShowFriendManagement(true);
                    setSidebarOpen(false);
                }}
                darkMode={darkMode} // [NEW]
                toggleDarkMode={() => setDarkMode(!darkMode)} // [NEW]
            />

            {/* Main Content Area */}
            {/* Dark Mode Background Application */}
            <div className={`flex-1 flex flex-col relative overflow-hidden max-w-2xl mx-auto w-full shadow-2xl transition-colors duration-300 ${darkMode ? "bg-slate-900 border-x border-slate-700" : "bg-white"}`}>
                {/* [NEW] Franchise Search Bar */}
                {viewMode === "FRANCHISE" && currentPage === "MAIN" && (
                    <div className="p-4 bg-white dark:bg-slate-900 border-b dark:border-slate-800 flex items-center gap-2 transition-colors">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                            <input
                                type="text"
                                placeholder="브랜드명 검색 (예: 스타벅스, 버거킹)"
                                className="w-full pl-10 pr-4 py-2 bg-slate-100 dark:bg-slate-800 rounded-xl border-none outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-slate-700 dark:text-slate-100 transition-colors"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                autoFocus
                            />
                        </div>
                    </div>
                )}

                {/* [NEW] User Profile Header */}
                {currentPage === "USER_PROFILE" && profileViewUser && (
                    <UserProfileHeader
                        user={profileViewUser}
                        currentUser={user}
                        isFollowing={followingList.includes(profileViewUser.id)}
                        onFollow={followUser}
                        onUnfollow={unfollowUser}
                        onMessage={() => alert("준비 중입니다.")}
                        onOpenFollowers={async () => {
                            setDrawerTitle(`${profileViewUser.name}님의 팔로워`);
                            setFriendsData(friendsData); // Mock or Real
                            setShowUserListModal(true); // [MODIFIED] Use Modal
                        }}
                        onOpenFollowing={async () => {
                            setDrawerTitle(`${profileViewUser.name}님의 팔로잉`);
                            try {
                                const q = collection(db, "users", profileViewUser.id, "following");
                                const snap = await getDocs(q);
                                if (!snap.empty) {
                                    const list = snap.docs.map(d => ({
                                        id: d.id,
                                        ...d.data(),
                                        matchRate: getMatchRate(user?.uid, d.id) // [NEW]
                                    }));
                                    setFriendsData(list);
                                } else {
                                    setFriendsData([]);
                                }
                            } catch (e) {
                                console.error(e);
                                setFriendsData([]);
                            }
                            setShowUserListModal(true); // [MODIFIED] Use Modal
                        }}
                        matchRate={getMatchRate(user?.uid, profileViewUser.id)} // [MODIFIED] Stable rate
                    />
                )}

                <div className="flex gap-2 p-3 bg-white dark:bg-slate-900 border-b dark:border-slate-800 overflow-x-auto scrollbar-hide z-20 shrink-0 items-center transition-colors">
                    {/* [NEW] Global Map Toggle Button */}
                    <button
                        onClick={() => setShowMap(!showMap)}
                        className={`px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all border flex items-center gap-1 ${showMap ? "bg-indigo-600 text-white border-indigo-600" : "bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-slate-700"
                            }`}
                    >
                        {showMap ? "지도 접기" : "지도 보기"}
                    </button>

                    {/* Vertical Divider */}
                    <div className="w-px h-4 bg-slate-200 dark:bg-slate-700 mx-1"></div>

                    {["전체", "한식", "일식", "양식", "중식", "카페"].map(cat => (
                        <button
                            key={cat}
                            onClick={() => setCategoryFilter(cat)}
                            className={`px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all ${categoryFilter === cat
                                ? "bg-indigo-600 text-white shadow-md scale-105"
                                : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
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
                    displayedReviews={finalDisplayedRestaurants} // [MODIFIED] Use computed list
                    handleOpenDetail={handleOpenDetail}
                    currentPage={currentPage}
                    setRestaurantSearchOpen={setRestaurantSearchOpen}
                    isMapMoved={isMapMoved}
                    setIsMapMoved={setIsMapMoved}
                    handleZoom={(delta) => setZoom(z => Math.max(0.2, Math.min(3, z + delta * 0.2)))}
                    handleSearchInArea={() => setIsMapMoved(false)}
                    onBoundsChanged={setMapBounds}
                />

                {viewMode === "FRANCHISE" ? (
                    <FranchiseRankingView
                        handleOpenDetail={handleOpenDetail}
                    />
                ) : (
                    <RestaurantList
                        displayedReviews={finalDisplayedRestaurants} // [MODIFIED] Use computed list
                        activeReviews={activeReviews}
                        loading={loading}
                        handleOpenDetail={handleOpenDetail}
                        currentPage={currentPage}
                        viewMode={viewMode}
                        user={user}
                        onOpenProfile={handleOpenProfile}
                    />
                )}

                {currentPage === "MAIN" && (
                    <button
                        onClick={() => {
                            if (!user) {
                                alert("로그인이 필요합니다.");
                                return;
                            }
                            reviewModal.setIsOpen(true);
                        }}
                        className="absolute bottom-6 right-6 w-14 h-14 bg-indigo-600 rounded-full shadow-xl flex items-center justify-center text-white hover:bg-indigo-700 hover:scale-105 transition-all z-30"
                    >
                        <span className="text-3xl font-light mb-1">+</span>
                    </button>
                )}

                {/* Friend Management Modal */}
                <FriendManagementModal
                    isOpen={showFriendManagement}
                    onClose={() => setShowFriendManagement(false)}
                    onOpenProfile={handleOpenProfile}
                />

                {/* Friend Drawer (Legacy or for quick access?) - Keeping for now if used elsewhere */}
                <FriendDrawer
                    isOpen={friendsListOpen}
                    onClose={() => setFriendsListOpen(false)}
                    friends={friendsData}
                    followingIds={followingList}
                    onFollow={followUser}
                    onUnfollow={unfollowUser}
                    onViewProfile={(f) => handleVisitProfile(f)} // Recursive navigation!
                    currentUser={user}
                    title={drawerTitle} // [NEW]
                />
            </div>

            <ReviewModal
                isOpen={reviewModal.isOpen}
                onClose={reviewModal.close}

                // State & Data
                selectedNewPlace={reviewModal.selectedNewPlace}
                newReviewParams={reviewModal.newReviewParams}
                setNewReviewParams={reviewModal.setNewReviewParams}
                editingReview={reviewModal.editingReview}

                // Actions
                onSubmit={handleReviewSubmit}


                handleSearchPlace={() => setRestaurantSearchOpen(true)}
                categoryReviews={(() => {
                    const safeReviews = activeReviews || [];
                    const filtered = safeReviews.filter(r => r.category === reviewModal.selectedNewPlace?.category && r.userId === user?.uid);
                    return filtered;
                })()}
                allReviews={activeReviews || []}
                onInsert={handleInsert}
                expandedFolders={expandedFolders}
                toggleFolder={toggleFolder}
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
                onViewMap={handleVisitProfile} // [MODIFIED] Use new handler
            />

            {
                detailModalOpen && (
                    <RestaurantDetailModal
                        restaurant={selectedRestaurant}
                        allReviews={reviews} // Pass ALL reviews, modal filters them
                        onClose={() => setDetailModalOpen(false)}
                        onOpenProfile={(uid) => handleOpenProfile(uid)}
                        isWishlisted={wishlist.some(w => {
                            if (!selectedRestaurant) return false;
                            const key1 = `${w.name}-${parseFloat(w.lat).toFixed(4)}-${parseFloat(w.lng).toFixed(4)}`;
                            const key2 = `${selectedRestaurant.name}-${parseFloat(selectedRestaurant.lat).toFixed(4)}-${parseFloat(selectedRestaurant.lng).toFixed(4)}`;
                            return key1 === key2;
                        })}
                        onToggleWishlist={(r) => toggleWishlist(r)}
                        currentUser={user} // [NEW] Pass current user for ID check
                        onDeleteReview={async (reviewId) => {
                            if (window.confirm("정말로 리뷰를 삭제하시겠습니까?")) {
                                await deleteReview(reviewId);
                            }
                        }}
                        onEditReview={(review) => {
                            reviewModal.openForEdit(review);
                        }}
                    />
                )
            }

            <RestaurantSearchModal
                isOpen={restaurantSearchOpen}
                onClose={() => setRestaurantSearchOpen(false)}
                mockRestaurantSearch={searchNaverPlaces} // This should eventually be a real API call if possible, or keep mock
                onSelectRestaurant={handleSelectRestaurantFromSearch}
                mapInstance={mapInstance} // [NEW] Pass map instance for location sorting
            />

            <UserGuideModal
                isOpen={userGuideOpen}
                onClose={() => setUserGuideOpen(false)}
            />

            <UserSearchModal
                isOpen={userSearchOpen}
                onClose={() => setUserSearchOpen(false)}
            />

            <UserListModal
                isOpen={showUserListModal}
                onClose={() => setShowUserListModal(false)}
                title={drawerTitle}
                users={friendsData}
                followingIds={followingList}
                onFollow={followUser}
                onUnfollow={unfollowUser}
                onViewProfile={handleVisitProfile}
                currentUser={user}
            />
        </div >
    );
}

export default App;
