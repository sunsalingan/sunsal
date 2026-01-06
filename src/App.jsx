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
} from "./lib/firebase";
import { getDocs, deleteDoc } from "firebase/firestore";

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
// import { resetAndSeedData } from "./utils/seeder"; // Removed

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

    // --- Seeder Logic (Inlined) ---
    const handleResetAndSeed = async () => {
        if (!window.confirm("정말로 모든 데이터를 삭제하고 '순살' 더미 데이터로 초기화하시겠습니까? (되돌릴 수 없습니다!)")) return;
        console.log("Starting data reset...");

        try {
            // 1. Delete all existing reviews
            const reviewsSnapshot = await getDocs(collection(db, "reviews"));
            const deleteReviewPromises = reviewsSnapshot.docs.map(d => deleteDoc(d.ref));
            await Promise.all(deleteReviewPromises);
            console.log(`Deleted ${deleteReviewPromises.length} reviews.`);

            // 2. Delete all existing users
            const usersSnapshot = await getDocs(collection(db, "users"));
            const deleteUserPromises = usersSnapshot.docs.map(d => deleteDoc(d.ref));
            await Promise.all(deleteUserPromises);
            console.log(`Deleted ${deleteUserPromises.length} users.`);

            // 3. Create new dummy users (순살1 ~ 순살5)
            const dummyUsers = [];
            for (let i = 1; i <= 5; i++) {
                dummyUsers.push({
                    uid: `soonsal_user_${i}`,
                    name: `순살${i}`,
                    email: `soonsal${i}@example.com`,
                    photoURL: `https://api.dicebear.com/7.x/avataaars/svg?seed=Soonsal${i}`,
                    createdAt: serverTimestamp()
                });
            }

            for (const user of dummyUsers) {
                await setDoc(doc(db, "users", user.uid), user);
            }
            console.log("Created 5 dummy users.");

            // 4. Create dummy reviews
            const locations = [
                { name: "교촌치킨 강남점", lat: 37.4979, lng: 127.0276, category: "치킨" },
                { name: "스타벅스 역삼점", lat: 37.5006, lng: 127.0365, category: "카페" },
                { name: "우래옥 본점", lat: 37.5682, lng: 126.9987, category: "한식" },
                { name: "몽탄", lat: 37.5318, lng: 126.9715, category: "고기" },
                { name: "다운타우너 한남", lat: 37.5358, lng: 127.0019, category: "버거" },
                { name: "랜디스도넛 연남", lat: 37.5626, lng: 126.9256, category: "디저트" },
                { name: "명동교자", lat: 37.5625, lng: 126.9856, category: "한식" },
                { name: "을지면옥", lat: 37.5663, lng: 126.9922, category: "한식" },
                { name: "블루보틀 성수", lat: 37.5480, lng: 127.0450, category: "카페" },
                { name: "쉐이크쉑 강남", lat: 37.5026, lng: 127.0257, category: "버거" }
            ];

            const comments = [
                "진짜 인생 맛집입니다!",
                "웨이팅이 좀 길지만 기다릴만 해요.",
                "사장님이 친절하고 양이 푸짐합니다.",
                "분위기가 깡패네요. 데이트 코스로 추천!",
                "맛은 있는데 가격이 좀 비싸요.",
                "친구들이랑 가기 딱 좋은 곳.",
                "재방문 의사 있습니다.",
                "솔직히 기대 이하였어요 ㅠㅠ",
                "비주얼 굿! 인스타 감성 낭낭합니다.",
                "평범하지만 깔끔해요."
            ];

            let reviewCount = 0;
            for (const user of dummyUsers) {
                const numReviews = Math.floor(Math.random() * 4) + 3;
                for (let j = 0; j < numReviews; j++) {
                    const place = locations[Math.floor(Math.random() * locations.length)];
                    const comment = comments[Math.floor(Math.random() * comments.length)];
                    const score = (Math.random() * 2 + 8).toFixed(1);

                    const reviewId = `review_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

                    await setDoc(doc(db, "reviews", reviewId), {
                        userId: user.uid,
                        userName: user.name,
                        userPhoto: user.photoURL,
                        name: place.name,
                        category: place.category,
                        lat: place.lat + (Math.random() * 0.002 - 0.001),
                        lng: place.lng + (Math.random() * 0.002 - 0.001),
                        address: "서울 어딘가",
                        comment: comment,
                        globalScore: score,
                        rankIndex: j,
                        timestamp: serverTimestamp()
                    });
                    reviewCount++;
                }
            }
            console.log(`Created ${reviewCount} dummy reviews.`);

            // 5. Create Follows
            const user1 = dummyUsers[0];
            const user2 = dummyUsers[1];
            const user3 = dummyUsers[2];

            await setDoc(doc(db, "users", user1.uid, "following", user2.uid), {});
            await setDoc(doc(db, "users", user1.uid, "following", user3.uid), {});
            await setDoc(doc(db, "users", user2.uid, "following", user1.uid), {});
            await setDoc(doc(db, "users", user2.uid, "following", user3.uid), {});

            console.log("Created follow relationships.");

            alert("데이터 초기화 완료! 페이지를 새로고침하면 적용됩니다.");
            window.location.reload();

        } catch (e) {
            console.error("Error seeding data:", e);
            alert("데이터 초기화 중 오류가 발생했습니다: " + e.message);
        }
    };

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
        return (activeReviews || []).map((r) => ({
            ...r,
            displayScore: r.globalScore || (Math.random() * (9.9 - 8.0) + 8.0).toFixed(1),
            friendScore: (Math.random() * (9.9 - 8.0) + 8.0).toFixed(1),
        })).sort((a, b) => (a.rankIndex || 0) - (b.rankIndex || 0));
    }, [activeReviews]);

    // --- Scoring Logic ---
    const getRankScore = (myRank, totalCount) => {
        if (totalCount === 0) return 10;
        const percentile = ((myRank + 1) / (totalCount + 1)) * 100;

        if (percentile <= 1) return 10;
        if (percentile <= 5) return 9.5;
        if (percentile <= 15) return 9.0;
        if (percentile <= 30) return 8.5;
        if (percentile <= 50) return 7.5;
        return 6.0;
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
                    onClick={handleResetAndSeed}
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

                <div
                    className={`fixed inset-y-0 right-0 w-80 bg-white shadow-2xl transform transition-transform duration-300 ease-in-out z-50 ${friendsListOpen ? "translate-x-0" : "translate-x-full"
                        }`}
                >
                    <div className="flex flex-col h-full">
                        <div className="p-4 border-b flex justify-between items-center bg-indigo-600 text-white">
                            <h2 className="text-lg font-bold">친구 목록</h2>
                            <button onClick={() => setFriendsListOpen(false)} className="p-1 hover:bg-white/20 rounded-full">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4 space-y-4">
                            {(generateMockFriends() || []).map(f => (
                                <div key={f.id} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer">
                                    <div className={`w-10 h-10 rounded-full ${f.avatarColor || "bg-gray-300"} flex items-center justify-center text-white font-bold`}>
                                        {f.name[0]}
                                    </div>
                                    <div className="flex-1">
                                        <div className="font-bold text-sm">{f.name}</div>
                                        <div className="text-xs text-slate-500">{f.topPick} 매니아</div>
                                    </div>
                                    <div className="flex flex-col items-end">
                                        <span className="text-indigo-600 font-bold text-xs">{f.matchRate}%</span>
                                        <span className="text-[10px] text-slate-400">일치</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {friendsListOpen && (
                    <div
                        className="fixed inset-0 bg-black/20 z-40"
                        onClick={() => setFriendsListOpen(false)}
                    />
                )}

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
