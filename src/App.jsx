import React, { useState, useEffect, useMemo, useRef } from "react";
import {
    auth,
    db,
    googleProvider,
    signInWithPopup,
    signOut,
    onAuthStateChanged,
    collection,
    addDoc,
    query,
    orderBy,
    onSnapshot,
    serverTimestamp,
} from "./lib/firebase";

import {
    MOCK_PLACES_DB,
    generateMockReviews,
    generateMockFriends,
    generateMockUsers,
    generateMockFollowList,
    getFallbackProfile,
    mockRestaurantSearch,
} from "./data/mock";

import Header from "./components/layout/Header";
import MapArea from "./components/features/MapArea";
import RestaurantList from "./components/features/RestaurantList";
import ReviewModal from "./components/features/ReviewModal";
import ProfileModal from "./components/features/ProfileModal";
import RestaurantDetailModal from "./components/features/RestaurantDetailModal";
import RestaurantSearchModal from "./components/features/RestaurantSearchModal";
import Sidebar from "./components/layout/Sidebar";

function App() {
    // --- Auth State ---
    const [user, setUser] = useState(null);

    // --- Data State ---
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);

    // --- UI State ---
    const [currentPage, setCurrentPage] = useState("MAIN"); // MAIN, PROFILE
    const [viewMode, setViewMode] = useState("GLOBAL"); // GLOBAL, MY, FRIENDS
    const [showMap, setShowMap] = useState(true);
    // const [useRealMap, setUseRealMap] = useState(false); // Removed Virtual Map
    const useRealMap = true; // Always true
    const [restaurantSearchOpen, setRestaurantSearchOpen] = useState(false);

    // --- Modal State ---
    const [reviewModalOpen, setReviewModalOpen] = useState(false);
    const [profileModalOpen, setProfileModalOpen] = useState(false);
    const [detailModalOpen, setDetailModalOpen] = useState(false);
    const [friendsListOpen, setFriendsListOpen] = useState(false);

    // --- Selected Data State ---
    const [selectedRestaurant, setSelectedRestaurant] = useState(null);
    const [targetProfile, setTargetProfile] = useState(null);
    const [selectedNewPlace, setSelectedNewPlace] = useState(null);
    const [newReviewParams, setNewReviewParams] = useState({ text: "" });
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [categoryFilter, setCategoryFilter] = useState("전체");

    // --- Map State ---
    const mapElement = useRef(null);
    const [mapInstance, setMapInstance] = useState(null);
    const markersRef = useRef([]);
    // Virtual Map
    const [zoom, setZoom] = useState(1);
    const [mapOffset, setMapOffset] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    const [selectedCluster, setSelectedCluster] = useState(null);
    const [isMapMoved, setIsMapMoved] = useState(false);

    // --- Folder Logic ---
    const [expandedFolders, setExpandedFolders] = useState({});
    const toggleFolder = (folderId) => {
        setExpandedFolders((prev) => ({ ...prev, [folderId]: !prev[folderId] }));
    };

    // --- Auth Effect ---
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
        });
        return () => unsubscribe();
    }, []);

    // --- Data Subscription ---
    useEffect(() => {
        // Updated: use 'timestamp' instead of 'createdAt' to match existing data
        const q = query(collection(db, "reviews"), orderBy("timestamp", "desc"));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const loadedReviews = snapshot.docs.map((doc) => {
                const data = doc.data();
                return {
                    id: doc.id,
                    ...data,
                    // Map 'address' from Firestore to 'location' for UI if needed
                    location: data.address || data.location || "",
                };
            });
            setReviews(loadedReviews);
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    // --- Derived Data ---
    const activeReviews = useMemo(() => {
        if (!reviews) return [];
        let filtered = reviews;
        if (viewMode === "MY") {
            if (!user) return [];
            filtered = reviews.filter((r) => r.userId === user.uid);
        }

        if (categoryFilter !== "전체") {
            filtered = filtered.filter(r => r.category === categoryFilter);
        }

        return filtered;
    }, [reviews, viewMode, user, categoryFilter]);

    const displayedReviews = useMemo(() => {
        return (activeReviews || []).map((r) => ({
            ...r,
            // Calculate score if not present, but usually it should be stored
            displayScore: r.globalScore || (Math.random() * (9.9 - 8.0) + 8.0).toFixed(1),
            friendScore: (Math.random() * (9.9 - 8.0) + 8.0).toFixed(1),
        })).sort((a, b) => (a.rankIndex || 0) - (b.rankIndex || 0));
    }, [activeReviews]);

    // --- Scoring Logic ---
    const getRankScore = (myRank, totalCount) => {
        if (totalCount === 0) return 10;
        const percentile = ((myRank + 1) / (totalCount + 1)) * 100; // 상위 n%

        if (percentile <= 1) return 10;   // 상위 1% : 인생 맛집 (10점)
        if (percentile <= 5) return 9.5;  // 상위 5% : 강력 추천 (9점 -> 9.5로 세분화 가능)
        if (percentile <= 15) return 9.0;
        if (percentile <= 30) return 8.5;
        if (percentile <= 50) return 7.5;
        return 6.0;
    };

    // --- Map Clusters ---
    const mapClusters = useMemo(() => {
        // Simple clustering
        const clusters = [];
        const threshold = 50 * (1 / zoom);

        // Use activeReviews for map? or all displayed?
        // Map usually shows everything.
        // Let's use displayedReviews.
        [...displayedReviews].forEach((review) => {
            // ... clustering logic from original code ...
            // Simplification for brevity in this thought trace, 
            // but code block below will have full logic.
            let added = false;
            for (let cluster of clusters) {
                const center = cluster[0];
                const dist = Math.sqrt(
                    Math.pow((review.x || 0) - (center.x || 0), 2) +
                    Math.pow((review.y || 0) - (center.y || 0), 2)
                );
                if (dist < threshold) {
                    cluster.push(review);
                    added = true;
                    break;
                }
            }
            if (!added) clusters.push([review]);
        });
        return clusters;
    }, [displayedReviews, zoom]);


    // --- Handlers ---
    const handleLogin = async () => {
        try {
            await signInWithPopup(auth, googleProvider);
        } catch (error) {
            console.error("Login failed", error);
        }
    };
    const handleLogout = () => signOut(auth);

    const handleOpenDetail = (review) => {
        setSelectedRestaurant(review);
        setDetailModalOpen(true);
    };

    const handleSearchPlace = () => {
        // In Step 1 of ReviewModal
        // We want to open search modal, select place, and pass it back.
        // But simpler: just open search modal from App context?
        // Since ReviewModal is open, we can stack modals.
        // Or ReviewModal has a "Search" button that invokes this.
        setRestaurantSearchOpen(true);
    };

    const handleSelectRestaurantFromSearch = (place) => {
        if (reviewModalOpen) {
            // If we are in review flow
            setSelectedNewPlace(place);
            setRestaurantSearchOpen(false);
        } else {
            // If search from Main Map
            // Move map to place or Open Detail?
            // Let's Open Detail mock
            // Actually try to find existing review for this place?
            // For now mock detail
            const mockReview = {
                ...place,
                id: `temp_${Date.now()}`,
                globalScore: "9.5",
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
        // Logic: Calculate target rankIndex based on neighbors
        // Simple implementation: for prototype, just set a value.
        // In real app, we would shift others or use Lexorank.
        if (targetId === "TOP") {
            setTempRankIndex(0);
        } else {
            const targetIdx = reviews.findIndex(r => r.id === targetId);
            setTempRankIndex(position === "BEFORE" ? targetIdx : targetIdx + 1);
        }
    };

    const handleReviewSubmit = async () => {
        if (!user || !selectedNewPlace) return;

        const totalCount = reviews.length;
        const calculatedScore = getRankScore(tempRankIndex, totalCount);

        const newDoc = {
            ...selectedNewPlace,
            userId: user.uid,
            userName: user.displayName,
            userPhoto: user.photoURL,
            comment: newReviewParams.text,
            timestamp: serverTimestamp(),
            rankIndex: tempRankIndex,
            globalScore: calculatedScore,
            // x, y for legacy schema
            x: Math.random() * 800 + 100,
            y: Math.random() * 800 + 100,
        };

        try {
            await addDoc(collection(db, "reviews"), newDoc);
            setReviewModalOpen(false);
            setSelectedNewPlace(null);
            setNewReviewParams({ text: "" });
            alert(`등록되었습니다! 확정 순위: ${tempRankIndex + 1}위 (점수: ${calculatedScore}점)`);
        } catch (e) {
            console.error(e);
            alert("오류가 발생했습니다.");
        }
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
                setFriendsListOpen={setFriendsListOpen}
                handleLogin={handleLogin}
                handleLogout={handleLogout}
                handleBackToMain={() => setCurrentPage("MAIN")}
                targetProfile={targetProfile}
                onMenuClick={() => setSidebarOpen(true)}
            />

            <Sidebar
                isOpen={sidebarOpen}
                onClose={() => setSidebarOpen(false)}
                user={user}
                handleLogout={handleLogout}
            />

            <div className="flex-1 flex flex-col relative overflow-hidden max-w-2xl mx-auto w-full shadow-2xl bg-white">
                {/* Category Quick Filter */}
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
                    mapClusters={mapClusters}
                    zoom={zoom}
                    setZoom={setZoom}
                    markersRef={markersRef}
                    displayedReviews={displayedReviews}
                    handleOpenDetail={handleOpenDetail}
                    currentPage={currentPage}
                    setRestaurantSearchOpen={setRestaurantSearchOpen}
                    isMapMoved={isMapMoved}
                    mapOffset={mapOffset}
                    setMapOffset={setMapOffset}
                    setIsDragging={setIsDragging}
                    setDragStart={setDragStart}
                    dragStart={dragStart}
                    setIsMapMoved={setIsMapMoved}
                    selectedCluster={selectedCluster}
                    setSelectedCluster={setSelectedCluster}
                    handleZoom={(delta) => setZoom(z => Math.max(0.2, Math.min(3, z + delta * 0.2)))}
                    handleSearchInArea={() => {
                        // Mock logic: just shuffle or reload
                        alert("이 지역 검색 (구현 예정)");
                        setIsMapMoved(false);
                    }}
                />

                <RestaurantList
                    displayedReviews={displayedReviews}
                    activeReviews={activeReviews}
                    loading={loading}
                    handleOpenDetail={handleOpenDetail}
                    currentPage={currentPage}
                    viewMode={viewMode}
                />

                {/* Floating Action Button - Always visible on Main Page */}
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

                {/* Friends Overlay (Simple List for Prototype) */}
                {friendsListOpen && (
                    <div className="absolute inset-x-0 bottom-0 top-16 bg-white z-40 p-4 animate-in slide-in-from-bottom-5">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-bold">친구 목록</h2>
                            <button onClick={() => setFriendsListOpen(false)} className="text-slate-400">닫기</button>
                        </div>
                        <div className="space-y-4">
                            {(generateMockFriends() || []).map(f => (
                                <div key={f.id} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                                    <div className={`w-10 h-10 rounded-full ${f.avatarColor || "bg-gray-300"}`} />
                                    <div className="flex-1">
                                        <div className="font-bold">{f.name}</div>
                                        <div className="text-xs text-slate-500">{f.topPick} 매니아</div>
                                    </div>
                                    <div className="text-indigo-600 font-bold text-sm">{f.matchRate}% 일치</div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

            </div>

            {/* Modals */}
            <ReviewModal
                isOpen={reviewModalOpen}
                onClose={() => setReviewModalOpen(false)}
                onSubmit={handleReviewSubmit}
                selectedNewPlace={selectedNewPlace}
                newReviewParams={newReviewParams}
                setNewReviewParams={setNewReviewParams}
                handleSearchPlace={handleSearchPlace}
                categoryReviews={activeReviews.filter(r => r.category === selectedNewPlace?.category && r.userId === user?.uid)}
                allReviews={activeReviews.filter(r => r.userId === user?.uid)}
                onInsert={(targetId, position) => {
                    handleInsert(targetId, position);
                    // We need to advance step in ReviewModal. 
                    // Since ReviewModal manages step state internally, passing a prop to trigger next step is tricky without lifting state or using ref.
                    // However, we can simply let ReviewModal wrap this.
                    // Actually, ReviewModal renders RecursiveRankingGroup.
                    // So we can change ReviewModal to handle the onInsert and call this prop + setStep.
                }}
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
            />

            {detailModalOpen && (
                <RestaurantDetailModal
                    restaurant={selectedRestaurant}
                    onClose={() => {
                        setDetailModalOpen(false);
                        setSelectedRestaurant(null);
                    }}
                    allReviews={reviews}
                />
            )}

            <RestaurantSearchModal
                isOpen={restaurantSearchOpen}
                onClose={() => setRestaurantSearchOpen(false)}
                mockRestaurantSearch={mockRestaurantSearch}
                onSelectRestaurant={handleSelectRestaurantFromSearch}
            />
        </div>
    );
}

export default App;
