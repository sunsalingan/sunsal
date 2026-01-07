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
    addDoc,
    query,
    orderBy,
    onSnapshot,
    serverTimestamp,
    doc,
    getDoc,
    setDoc,
    deleteDoc,
} from "./lib/firebase";


import {
    MOCK_PLACES_DB,
    generateMockReviews,
    generateMockFriends,
    generateMockUsers,
    generateMockFollowList,
    getFallbackProfile,
} from "./data/mock";

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
import { resetAndSeedData } from "./utils/seeder";

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
    const useRealMap = true;
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

    // Bounds State for Filtering
    const [mapBounds, setMapBounds] = useState(null);

    // --- Social State ---
    const [followingList, setFollowingList] = useState([]);

    // --- Map State ---
    const mapElement = useRef(null);
    const [mapInstance, setMapInstance] = useState(null);
    const markersRef = useRef([]);
    const [zoom, setZoom] = useState(1);
    const [mapOffset, setMapOffset] = useState({ x: 0, y: 0 });
    const [selectedCluster, setSelectedCluster] = useState(null);
    const [isMapMoved, setIsMapMoved] = useState(false);



    // --- Folder Logic ---
    const [expandedFolders, setExpandedFolders] = useState({});
    const toggleFolder = (folderId) => {
        setExpandedFolders((prev) => ({ ...prev, [folderId]: !prev[folderId] }));
    };

    // --- Auth Effect ---
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            setUser(currentUser);
            if (currentUser) {
                const userRef = doc(db, "users", currentUser.uid);
                await setDoc(userRef, {
                    name: currentUser.displayName,
                    email: currentUser.email,
                    photoURL: currentUser.photoURL,
                    lastLogin: serverTimestamp(),
                }, { merge: true });

                const followRef = collection(db, "users", currentUser.uid, "following");
                onSnapshot(followRef, (snapshot) => {
                    const ids = snapshot.docs.map(doc => doc.id);
                    setFollowingList(ids);
                });
            } else {
                setFollowingList([]);
            }
        });
        return () => unsubscribe();
    }, []);

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

    // --- Derived Data ---
    const activeReviews = useMemo(() => {
        if (!reviews) return [];
        let filtered = reviews;
        if (viewMode === "MY") {
            if (!user) return [];
            filtered = reviews.filter((r) => r.userId === user.uid);
        } else if (viewMode === "FRIENDS") {
            if (!user) return [];
            filtered = reviews.filter((r) => followingList.includes(r.userId));
        }

        if (categoryFilter !== "전체") {
            filtered = filtered.filter(r => r.category === categoryFilter);
        }

        if (mapBounds && filtered.length > 0) {
            filtered = filtered.filter(r => {
                const lat = parseFloat(r.lat);
                const lng = parseFloat(r.lng);
                return lat >= mapBounds.south && lat <= mapBounds.north &&
                    lng >= mapBounds.west && lng <= mapBounds.east;
            });
        }

        return filtered;
    }, [reviews, viewMode, user, categoryFilter, mapBounds]);

    const displayedReviews = useMemo(() => {
        if (!activeReviews) return [];

        // Group by Name + Lat/Lng to prevent duplicates
        const uniqueMap = {};

        activeReviews.forEach(r => {
            const key = `${r.name}-${parseFloat(r.lat).toFixed(5)}-${parseFloat(r.lng).toFixed(5)}`;
            if (!uniqueMap[key]) {
                uniqueMap[key] = {
                    ...r,
                    reviewCount: 1,
                    reviews: [r],
                    // We can pick the max score or average. User said "Highest Rated" for map, let's stick to that for list rank?
                    // Or maybe for the LIST, we want to see the "Best" version of it.
                    // Let's use the object with the highest globalScore as the 'representative'
                    maxScore: parseFloat(r.globalScore || 0)
                };
            } else {
                uniqueMap[key].reviewCount += 1;
                uniqueMap[key].reviews.push(r);
                if (parseFloat(r.globalScore || 0) > uniqueMap[key].maxScore) {
                    uniqueMap[key] = {
                        ...r,
                        reviewCount: uniqueMap[key].reviewCount,
                        reviews: uniqueMap[key].reviews,
                        maxScore: parseFloat(r.globalScore || 0)
                    };
                }
            }
        });

        // Convert back to array
        const uniqueList = Object.values(uniqueMap);

        return uniqueList.map((r) => ({
            ...r,
            displayScore: r.globalScore || (Math.random() * (9.9 - 8.0) + 8.0).toFixed(1),
            friendScore: (Math.random() * (9.9 - 8.0) + 8.0).toFixed(1),
        })).sort((a, b) => (a.rankIndex || 0) - (b.rankIndex || 0));
    }, [activeReviews]);

    // --- Scoring Logic ---
    // --- Scoring Logic (Normal Distribution-like) ---
    const getRankScore = (myRank, totalCount) => {
        // 0. If it's the first review, give exactly 5.0
        if (totalCount === 0) return 5.0;

        // 1. Calculate percentile (0 ~ 1, where 0 is top rank)
        // myRank is 0-based index.
        const percentile = (myRank + 0.5) / (totalCount + 1);

        // 2. Inverse Error Function approximation (for Normal Distribution Z-score)
        // Or simplified: Linear spread based on count
        // For small N, we want tight spread. For large N, wider spread.

        // Base score is 5.0
        const baseScore = 5.0;

        // Spread factor: Increases with N, maxing out at some point
        // e.g., at N=1, spread=0.5 -> scores around 4.5 ~ 5.5
        // at N=100, spread=4.0 -> scores around 1.0 ~ 9.0
        const maxSpread = 4.5;
        const spreadRequest = Math.log10(totalCount + 1) * 2.5;
        const spread = Math.min(maxSpread, spreadRequest);

        // Map percentile to Z-score (-2 to +2 roughly covers 95%)
        // Simple linear mapping for UI feel: (0.5 - p) * 2 * 2 (approx Z)
        // Let's use cosine for smooth bell curve shape or just linear for simplicity in rank?
        // Rank lists usually want distinct values. 
        // Linear map: Top(0) -> +1, Bottom(1) -> -1
        const position = 0.5 - percentile; // +0.5 (top) to -0.5 (bottom)
        const zScore = position * 4; // +2.0 to -2.0

        let score = baseScore + (zScore * (spread / 2));

        // Clamp between 1.0 and 9.9
        score = Math.max(1.0, Math.min(9.9, score));

        return score.toFixed(1);
    };

    const mapClusters = useMemo(() => {
        const clusters = [];
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

    const handleSearchPlace = () => {
        setRestaurantSearchOpen(true);
    };

    const handleSelectRestaurantFromSearch = (place) => {
        if (reviewModalOpen) {
            setSelectedNewPlace(place);
            setRestaurantSearchOpen(false);
        } else {
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

    const [friendsData, setFriendsData] = useState([]);

    // Fetch Friend Profiles
    useEffect(() => {
        const fetchFriends = async () => {
            if (followingList.length === 0) {
                setFriendsData([]);
                return;
            }
            try {
                // Fetch all users in followingList
                const promises = followingList.map(uid => getDoc(doc(db, "users", uid)));
                const snaps = await Promise.all(promises);
                const loadedFriends = snaps
                    .filter(s => s.exists())
                    .map(s => ({
                        id: s.id,
                        ...s.data(),
                        // Calculate match rate (mock for now or based on shared categories)
                        matchRate: Math.floor(Math.random() * 30 + 70)
                    }));
                setFriendsData(loadedFriends);
            } catch (e) {
                console.error("Error fetching friends:", e);
            }
        };
        fetchFriends();
    }, [followingList]);

    // Handle Follow/Unfollow from Drawer
    const handleFollowUser = async (targetUser) => {
        if (!user) return;
        try {
            await setDoc(doc(db, "users", user.uid, "following", targetUser.id), {
                timestamp: serverTimestamp()
            });
        } catch (e) { console.error(e); }
    };

    const handleUnfollowUser = async (targetId) => {
        if (!user) return;
        try {
            await deleteDoc(doc(db, "users", user.uid, "following", targetId));
        } catch (e) { console.error(e); }
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
                    setIsMapMoved={setIsMapMoved}
                    selectedCluster={selectedCluster}
                    setSelectedCluster={setSelectedCluster}
                    handleZoom={(delta) => setZoom(z => Math.max(0.2, Math.min(3, z + delta * 0.2)))}
                    handleSearchInArea={() => {
                        setIsMapMoved(false);
                    }}
                    onBoundsChanged={setMapBounds}
                />

                <button
                    onClick={resetAndSeedData}
                    className="absolute bottom-6 left-6 z-50 bg-red-600 text-white px-3 py-1.5 rounded-full text-xs shadow-lg hover:bg-red-700 opacity-50 hover:opacity-100 transition-opacity"
                >
                    🚩 데이터 리셋
                </button>

                <RestaurantList
                    displayedReviews={displayedReviews}
                    activeReviews={activeReviews}
                    loading={loading}
                    handleOpenDetail={handleOpenDetail}
                    currentPage={currentPage}
                    viewMode={viewMode}
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
                    onFollow={handleFollowUser}
                    onUnfollow={handleUnfollowUser}
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
                handleSearchPlace={handleSearchPlace}
                categoryReviews={activeReviews.filter(r => r.category === selectedNewPlace?.category && r.userId === user?.uid)}
                allReviews={activeReviews.filter(r => r.userId === user?.uid)}
                onInsert={(targetId, position) => {
                    handleInsert(targetId, position);
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
                    onOpenProfile={handleOpenProfile}
                />
            )}

            <RestaurantSearchModal
                isOpen={restaurantSearchOpen}
                onClose={() => setRestaurantSearchOpen(false)}
                mockRestaurantSearch={searchNaverPlaces}
                onSelectRestaurant={handleSelectRestaurantFromSearch}
            />
        </div>
    );
}

export default App;
