// Cache Buster: 2026-01-15_1215
import React, { useState, useRef } from "react";
import { Search, LayoutList } from "lucide-react"; // [NEW]
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
import RestaurantSearchModal from "./components/features/RestaurantSearchModal";
import RestaurantDetailModal from "./components/features/RestaurantDetailModal";
import Sidebar from "./components/layout/Sidebar";
import FriendDrawer from "./components/features/FriendDrawer";
import UserGuideModal from "./components/features/UserGuideModal";
import UserSearchModal from "./components/features/UserSearchModal";
import UserListModal from "./components/features/UserListModal"; // [NEW]
import FranchiseRankingView from "./components/features/FranchiseRankingView"; // [NEW]
import FriendManagementModal from "./components/features/FriendManagementModal"; // [NEW]
import ProfileEditModal from "./components/features/ProfileEditModal"; // [NEW]
const AdminPage = React.lazy(() => import("./pages/AdminPage"));
const RankingPrototype = React.lazy(() => import("./pages/RankingPrototype")); // [NEW] Prototype // [NEW]
// import { resetAndSeedData } from "./utils/seeder"; // [DISABLED]
import { getMatchRate } from "./utils/matchRate"; // [NEW]
import { normalizeCategory } from "./utils/categoryHelper";
import { doc, getDoc, db, deleteDoc, setDoc, serverTimestamp, collection, getDocs, writeBatch } from "./lib/firebase"; // Keep some direct firebase for minor interactions if needed

function App() {
    // Context Hooks
    const { user, followingList, login, logout, updateUserProfile, followUser, unfollowUser } = useAuth();
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
        addReview,
        updateReview,
        deleteReview,
        toggleWishlist, // [NEW] Import toggle
        setTargetUserFilter, // [NEW]
        searchTerm, // [NEW]
        setSearchTerm // [NEW]
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
    const [profileEditModalOpen, setProfileEditModalOpen] = useState(false); // [NEW]

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
        setShowMap(false);

        // [FIX] Reset Filters to ensure we see the target user's reviews
        setTargetUserFilter(userProfile.id);
        setViewMode("USER_DETAIL");
        setCategoryFilter("전체");

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
        // [NEW] Check for Admin & Demo URLs
        const path = window.location.pathname;
        if (path === "/admin") {
            setCurrentPage("ADMIN");
        } else if (path === "/ranking-demo") {
            setCurrentPage("RANKING_DEMO");
        }

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

        // [FIX] Force close ReviewModal to prevent it covering the DetailModal (z-index conflict)
        reviewModal.setIsOpen(false);
        setRestaurantSearchOpen(false); // Also close search if open

        setSelectedRestaurant(restaurant);
        setDetailModalOpen(true);
    };

    const handleOpenProfile = async (userId) => {
        if (!userId) return;
        try {
            // [FIX] Direct Navigation (Skip ProfileModal)
            const userRef = doc(db, "users", userId);
            const userSnap = await getDoc(userRef);

            if (userSnap.exists()) {
                const userData = { id: userId, ...userSnap.data() };

                // Emulate handleVisitProfile logic directly
                setProfileViewUser(userData);

                // Close any open modals
                setProfileModalOpen(false); // Ensure closed
                setDetailModalOpen(false);
                setUserSearchOpen(false);
                setRestaurantSearchOpen(false);

                // Switch View
                setCurrentPage("USER_PROFILE");
                setShowMap(false);
                setTargetUserFilter(userId);
                setViewMode("USER_DETAIL");
                setCategoryFilter("전체");

            } else {
                alert("유저 정보를 찾을 수 없습니다.");
            }
        } catch (e) {
            console.error("handleOpenProfile Error:", e);
            alert("프로필을 불러오는 중 오류가 발생했습니다.");
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
                id: `temp_${Date.now()} `,
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
            // [FIX] Find index in the USER's full list (filtered by context if needed, but for 'rankIndex' we typically want relative to the displayed list in Modal)
            // The Modal displays `categoryReviews` or `allReviews`. PREVIOUSLY it relied on `activeReviews`.
            // BUT `activeReviews` changes. 
            // We should trust the `rankIndex` logic in `HierarchicalRankingSelector` (which passes `targetId`).
            // We need to find the `targetId` in the *same list* that was displayed.

            // However, `handleInsert` in `App.jsx` was calculating `tempRankIndex`.
            // Let's use `reviews` (global raw) filtered by User to find the absolute index?
            // Actually, `ReviewModal` is what calls this.
            // If Step 2 (Category), we only care about Category rank? No, we need GLOBAL rank eventually.
            // Wait, the new logic uses `HierarchicalRankingSelector` which calls `onInsert`.
            // The logic in `ReviewModal`'s `onInsert` implementation (lines 240, 300 in ReviewModal.jsx) ALREADY handles calculating `rankIndex` locally for submission!
            // It calls `handleNext` or `onSubmit`.
            // It does NOT call this `handleInsert` prop from App.jsx anymore in the new `ReviewModal` code I wrote!
            // Let's verify ReviewModal code.

            // In ReviewModal.jsx (New):
            // Step 2: onInsert={(targetId, pos) => handleNext()} (Ignores ID, just goes validation?) NO.
            // Step 3: onInsert={(targetId, pos) => { local Calc; onSubmit(rankIndex) }}

            // So `App.jsx`'s `handleInsert` might be OBSOLETE or used only if I didn't fully replace usage.
            // Let's check ReviewModal usage in App.jsx. It passes `onInsert={handleInsert}`.
            // Does ReviewModal USE it?
            // "onInsert={handleInsert}" is passed to ReviewModal.
            // Inside ReviewModal: "const ReviewModal = ({ ..., onInsert, ... })"
            // Step 2 usage: "onInsert={(targetId, position) => { handleNext(); }}" -> IGNORES prop `onInsert`.
            // Step 3 usage: "onInsert={... local logic ...}" -> IGNORES prop `onInsert`.

            // Wait. Step 2 in ReviewModal (Hierarchy) just says "Next". It doesn't actually SAVE the category rank. 
            // The user wanted "Category Selection" then "Global Selection".
            // Currently my implementation in Step 2 just skips to Step 3. 
            // In Step 3 (Global), it calculates rank and SUBMITS.

            // So this `handleInsert` in App.jsx is effectively DEAD CODE for the new Modal.
            // I'll leave it for now or update it just in case, but the real fix was in the props passed above.

            // But wait, `ReviewModal` Step 2 logic:
            // "Step 2 is just for show/mental model... For now, let's proceed to Step 3".
            // This matches the implementation plan? 
            // Plan said: "Step 3: 계층적 랭킹 선택... Step 4: 전체 순위 선정".
            // Actually, Step 2 is Category, Step 3 is Global.
            // If Step 2 selection is ignored, does it matter?
            // Ideally Step 2 helps position for Step 3? 
            // Providing context is fine.

            // Back to `handleInsert`: I will update it to be safe, searching in `reviews` filter by user.
            const userTotalReviews = reviews.filter(r => r.userId === user.uid);
            userTotalReviews.sort((a, b) => (a.rankIndex || 0) - (b.rankIndex || 0));

            const targetIdx = userTotalReviews.findIndex(r => r.id === targetId);
            reviewModal.setTempRankIndex(position === "BEFORE" ? targetIdx : targetIdx + 1);
        }
    };

    // [FIX] Centralized Delete Handler
    const handleReviewDelete = async (reviewOrId) => {
        const reviewId = typeof reviewOrId === 'object' ? reviewOrId.id : reviewOrId;
        if (!reviewId) return;

        if (window.confirm("정말로 리뷰를 삭제하시겠습니까? (이 작업은 되돌릴 수 없습니다)")) {
            try {
                // 1. Delete from DB
                await deleteReview(reviewId);

                // 2. Recalculate Scores for remaining reviews
                if (user) {
                    const remainingReviews = reviews.filter(r => r.userId === user.uid && r.id !== reviewId);

                    const { calculateScores } = await import("./utils/scoreCalculator");
                    const updatedReviews = calculateScores(remainingReviews);

                    if (updatedReviews.length > 0) {
                        const batch = writeBatch(db);
                        updatedReviews.forEach((rev, index) => {
                            const docRef = doc(db, "reviews", rev.id);
                            batch.update(docRef, {
                                globalScore: rev.globalScore,
                                rankIndex: index
                            });
                        });
                        await batch.commit();
                        console.log("Scores and Ranks recalculated after delete.");
                    }
                }

                // 3. Close Modals
                reviewModal.close();
                setDetailModalOpen(false);
                alert("리뷰가 삭제되었습니다.");

            } catch (err) {
                console.error("Error deleting review:", err);
                alert("리뷰 삭제 중 오류가 발생했습니다: " + err.message);
            }
        }
    };

    const [isSubmitting, setIsSubmitting] = useState(false); // [FIX] Add submission lock

    const handleReviewSubmit = async (rankIndexFromModal) => {

        // [FIX] Safety Checks:
        // 1. Must have User and Place
        // 2. Modal must be open (prevents ghost submits after close)
        // 3. Must not be already submitting (prevents double clicks / loops)
        if (!user || !reviewModal.selectedNewPlace) {
            console.error("Missing User or Place");
            return;
        }
        if (!reviewModal.isOpen) {
            console.warn("Blocked submit: Modal is closed.");
            return;
        }
        if (isSubmitting) {
            console.warn("Blocked submit: Already submitting.");
            return;
        }

        setIsSubmitting(true); // Lock
        // Note: globalScore will be set to 0 initially, but recalculated immediately below.
        const finalRankIndex = (rankIndexFromModal !== undefined && rankIndexFromModal !== null)
            ? rankIndexFromModal
            : reviewModal.tempRankIndex;

        // [FIX] Sanitize Data: Explicitly construct object to avoid undefined fields (especially 'x' or 'y')
        const baseReviewData = {
            name: reviewModal.selectedNewPlace.name,
            category: reviewModal.selectedNewPlace.category || "기타",
            address: reviewModal.selectedNewPlace.address || "",
            roadAddress: reviewModal.selectedNewPlace.roadAddress || "",
            // Use lat/lng, ignore mapx/mapy/x/y unless needed strictly
            lat: reviewModal.selectedNewPlace.lat,
            lng: reviewModal.selectedNewPlace.lng,

            userId: user.uid,
            userName: user.displayName || "익명",
            userPhoto: user.photoURL || null,
            comment: reviewModal.newReviewParams.text,
            location: reviewModal.selectedNewPlace.address || reviewModal.selectedNewPlace.roadAddress || "",
            timestamp: serverTimestamp()
        };

        try {
            // 2. Fetch ALL Active Reviews for this User (to recalculate everything)
            // We need to include the NEW one in this list to calculate scores correctly.
            // Since we haven't saved the new one to DB yet, we simulate the list.

            // [FIX] Strict Deduplication: Find ALL existing reviews for this place (User + PlaceName)
            // This handles "Ghost" reviews that might be causing average score issues.
            const allUserReviews = reviews.filter(r => r.userId === user.uid);

            // Find duplicates to DELETE (excluding the one we are editing if we keep ID, but actually we overwrite it)
            // Strategy: We will RE-SAVE the target review (new/edit) and DELETE any other duplicates found.
            const targetPlaceName = baseReviewData.name;
            const duplicateReviews = allUserReviews.filter(r =>
                r.name === targetPlaceName ||
                (r.placeId && baseReviewData.placeId && r.placeId === baseReviewData.placeId)
            );

            const duplicatesToDelete = duplicateReviews.filter(r => {
                // If we are editing, we might want to keep the ID.
                if (reviewModal.editingReview && r.id === reviewModal.editingReview.id) return false;
                return true;
            });

            // Filter existing reviews for this user from GLOBAL LIST (not just active view)
            // We remove ALL instances of this place from the list we use for calculation
            let userReviews = allUserReviews.filter(r =>
                r.name !== targetPlaceName &&
                (r.placeId ? r.placeId !== baseReviewData.placeId : true)
            );

            // [FIX] Sort existing reviews by rankIndex to ensure splice position is correct
            userReviews.sort((a, b) => (a.rankIndex || 0) - (b.rankIndex || 0));

            // Create the new review object (with temporary ID if new)
            // Ensure rankIndex is valid number
            const safeRankIndex = typeof finalRankIndex === 'number' ? finalRankIndex : 0;

            const newReviewObj = {
                ...baseReviewData,
                // If editing, keep ID. If New, use temp.
                id: reviewModal.editingReview ? reviewModal.editingReview.id : `temp_${Date.now()}`,
                rankIndex: safeRankIndex,
                // Explicitly set globalScore to avoid undefined during partial calc, though calc will overwrite
                globalScore: "0.0"
            };

            // [FIX] Insert at the exact position requested using Splice
            const insertPos = Math.min(Math.max(0, safeRankIndex), userReviews.length);
            console.log("Splicing at:", insertPos);

            userReviews.splice(insertPos, 0, newReviewObj);

            // [FIX] Re-assign sequential rankIndex immediately to avoid collisions or sort ambiguity
            const allReviewsForCalc = userReviews.map((r, index) => ({
                ...r,
                rankIndex: index
            }));

            // 3. Recalculate Scores
            // Dynamically import to ensure it's loaded (or just use import at top)
            const { calculateScores } = await import("./utils/scoreCalculator");
            const updatedReviews = calculateScores(allReviewsForCalc);

            console.log("Scores Recalculated:", updatedReviews.length);

            // 4. Batch Write to Firestore
            // We need to update ALL reviews that have changed scores (or just all to be safe).
            const batch = writeBatch(db);

            // 4.1. Clean up Duplicates
            duplicatesToDelete.forEach(dup => {
                const ref = doc(db, "reviews", dup.id);
                batch.delete(ref);
            });

            // 4.2. Update/Set Active Reviews
            updatedReviews.forEach(rev => {
                let reviewRef;
                if (rev.id.toString().startsWith("temp_")) {
                    reviewRef = doc(collection(db, "reviews")); // Auto ID
                } else {
                    reviewRef = doc(db, "reviews", rev.id);
                }

                // If it's the NEW/EDITED one, update all fields.
                // If it's just a ripple update, update only rank/score.
                const isTarget = (rev.id === newReviewObj.id);

                if (isTarget) {
                    // Full Update/Set
                    batch.set(reviewRef, {
                        ...rev,
                        id: reviewRef.id // Ensure ID is saved if new
                    }, { merge: true });
                } else {
                    // Partial Update (Ripple)
                    batch.update(reviewRef, {
                        rankIndex: rev.rankIndex,
                        globalScore: rev.globalScore
                    });
                }
            });

            console.log("Committing Batch...");
            await batch.commit();
            console.log("Batch Committed.");

            alert(reviewModal.editingReview ? "리뷰가 수정되고 랭킹점수가 갱신되었습니다!" : "등록되고 랭킹점수가 산정되었습니다!"); // 5. Close Modal & Reset
            reviewModal.close();
            setDetailModalOpen(false); // [FIX] Close detail modal as well if we were editing from there, so user sees updated list
        } catch (err) {
            console.error("Error while saving review:", err);

            // [FIX] More detailed error message
            let msg = "리뷰 저장 중 오류가 발생했습니다.\n";
            if (err.code === "permission-denied") msg += "(권한 부족: 로그인을 다시 시도해주세요)";
            else if (err.message) msg += `(${err.message})`;
            else msg += JSON.stringify(err);

            alert(msg);
        } finally {
            setIsSubmitting(false); // [FIX] Release lock
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
    if (currentPage === "ADMIN") {
        return <AdminPage onBack={() => {
            window.history.pushState(null, "", "/"); // Reset URL
            setCurrentPage("MAIN");
        }} />;
    }

    if (currentPage === "RANKING_DEMO") {
        return <RankingPrototype />;
    }

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
                    setTargetUserFilter(null); // [NEW] Reset filter
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
                onRequestFixData={async () => {
                    if (!user) return;
                    if (!window.confirm("랭킹 순서와 점수를 재정렬하여 오류를 수정합니다. 진행하시겠습니까?")) return;

                    try {
                        const { calculateScores } = await import("./utils/scoreCalculator");

                        // 1. Get User Reviews
                        const userReviews = reviews.filter(r => r.userId === user.uid);

                        // 2. Sort by Rank Index (Primary) -> Timestamp (Secondary) to resolve duplicates
                        userReviews.sort((a, b) => {
                            const rankDiff = (a.rankIndex || 0) - (b.rankIndex || 0);
                            if (rankDiff !== 0) return rankDiff;
                            return (b.timestamp?.seconds || 0) - (a.timestamp?.seconds || 0); // Newer first? No, Stable sort
                        });

                        // 3. Re-assign sequential rankIndex & Recalculate Scores
                        const updated = calculateScores(userReviews.map((r, i) => ({ ...r, rankIndex: i })));

                        // 4. Batch Update
                        const batch = writeBatch(db);
                        updated.forEach(r => {
                            const ref = doc(db, "reviews", r.id);
                            batch.update(ref, {
                                rankIndex: r.rankIndex,
                                globalScore: r.globalScore
                            });
                        });

                        await batch.commit();
                        alert("랭킹 및 점수 오류가 수정되었습니다. 다시 확인해주세요.");
                        // Force refresh? Context usually listens to snapshot, so it should auto-update.
                    } catch (e) {
                        console.error(e);
                        alert("수정 중 오류 발생");
                    }
                }}
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
                            setDrawerTitle(`${profileViewUser.nickname || profileViewUser.name}님의 팔로워`);
                            try {
                                const q = collection(db, "users", profileViewUser.id, "followers"); // [FIX] 'followers' subcollection
                                const snap = await getDocs(q);
                                if (!snap.empty) {
                                    const list = snap.docs.map(d => ({
                                        id: d.id,
                                        ...d.data(),
                                    }));
                                    setFriendsData(list);
                                } else {
                                    setFriendsData([]);
                                }
                            } catch (e) {
                                console.error(e);
                                setFriendsData([]);
                            }
                            setShowUserListModal(true);
                        }}
                        onOpenFollowing={async () => {
                            setDrawerTitle(`${profileViewUser.nickname || profileViewUser.name}님의 팔로잉`);
                            try {
                                const q = collection(db, "users", profileViewUser.id, "following");
                                const snap = await getDocs(q);
                                if (!snap.empty) {
                                    const list = snap.docs.map(d => ({
                                        id: d.id,
                                        ...d.data(),
                                        // matchRate: getMatchRate(reviews, user?.uid, d.id) // Simplification to avoid errors if vars missing
                                    }));
                                    setFriendsData(list);
                                } else {
                                    setFriendsData([]);
                                }
                            } catch (e) {
                                console.error(e);
                                setFriendsData([]);
                            }
                            setShowUserListModal(true);
                        }}
                        matchRate={profileViewUser.id !== user?.uid ? getMatchRate(reviews, user?.uid, profileViewUser.id) : undefined}
                        onEditProfile={() => setProfileEditModalOpen(true)}
                        totalReviewsCount={finalDisplayedRestaurants ? finalDisplayedRestaurants.length : 0} // [RENAME]
                    />
                )}

                <div className="flex gap-2 p-3 bg-white dark:bg-slate-900 border-b dark:border-slate-800 overflow-x-auto scrollbar-hide z-20 shrink-0 items-center transition-colors">
                    {/* [NEW] Global Map Toggle Button */}
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

                    {["전체", "한식", "일식", "양식", "중식", "아시안", "카페"].map(cat => (
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
                    (finalDisplayedRestaurants && finalDisplayedRestaurants.length > 0) || loading ? (
                        <RestaurantList
                            displayedReviews={finalDisplayedRestaurants} // [MODIFIED] Use computed list
                            activeReviews={activeReviews}
                            loading={loading}
                            handleOpenDetail={handleOpenDetail}
                            currentPage={currentPage}
                            viewMode={viewMode}
                            user={user}
                            onOpenProfile={handleOpenProfile}
                            isWishlisted={wishlist.some(w => w.id === selectedRestaurant?.id)}
                            onToggleWishlist={toggleWishlist}
                            currentUser={user} // [NEW]
                            onEditReview={(review) => {
                                // [FIX] Close detail modal first to prevent layering/freeze issues
                                setDetailModalOpen(false);

                                // [FIX] Manually populate ReviewModal state to ensure all fields (x, y, address) are present.
                                // Simply passing 'review' caused crashes if x/y were missing.
                                reviewModal.setEditingReview(review);

                                reviewModal.setSelectedNewPlace({
                                    id: review.placeId || selectedRestaurant?.id || review.id,
                                    name: review.name || selectedRestaurant?.name,
                                    address: review.location || selectedRestaurant?.address,
                                    category: review.category || selectedRestaurant?.category,
                                    roadAddress: review.location || "",
                                    x: selectedRestaurant?.x, // Important for maps
                                    y: selectedRestaurant?.y,
                                    lat: review.lat,
                                    lng: review.lng
                                });

                                reviewModal.setNewReviewParams({
                                    text: review.comment,
                                    rating: review.rating || 0,
                                    rankIndex: review.rankIndex
                                });

                                reviewModal.setTempRankIndex(review.rankIndex !== undefined ? review.rankIndex : 0);
                                reviewModal.setIsOpen(true);
                            }}
                        />
                    ) : (
                        <div className="flex flex-col items-center justify-center py-20 text-center animate-in fade-in zoom-in duration-300">
                            <div className="bg-slate-100 p-6 rounded-full mb-4 shadow-inner">
                                <LayoutList size={48} className="text-slate-300" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-700 mb-2">랭킹 데이터가 없습니다</h3>
                            <p className="text-slate-500 max-w-xs mx-auto leading-relaxed">
                                아직 등록된 맛집 랭킹이 없습니다.<br />
                                <span className="text-indigo-500 font-bold">첫 번째 리뷰</span>를 작성하여<br />
                                랭킹의 주인공이 되어보세요!
                            </p>
                        </div>
                    )
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
                onClose={() => {
                    reviewModal.close(); // Use hook's close to reset state
                    setDetailModalOpen(false); // Ensure detail is closed too
                }}
                onSubmit={handleReviewSubmit} // [FIX] Pass submit handler
                onDelete={handleReviewDelete} // [FIX] Pass delete handler
                handleSearchPlace={() => setRestaurantSearchOpen(true)} // [FIX] Enable Search from Modal
                currentUser={user} // [FIX] For Debugging
                // State & Data
                selectedNewPlace={reviewModal.selectedNewPlace}
                newReviewParams={reviewModal.newReviewParams}
                setNewReviewParams={reviewModal.setNewReviewParams}
                editingReview={reviewModal.editingReview} // [FIX] Pass editing state
                setEditingReview={reviewModal.setEditingReview} // Pass setter for editingReview

                // Data for Ranking Steps
                categoryReviews={(() => {
                    // [FIX] Always use ALL reviews from the current user for ranking comparison, NOT just 'activeReviews' which might be filtered by viewMode.
                    if (!user) return [];
                    let myReviews = reviews.filter(r => r.userId === user.uid);

                    // [FIX] Exclude the review currently being edited to avoid duplicates in the anchor list
                    if (reviewModal.editingReview) {
                        myReviews = myReviews.filter(r => r.id !== reviewModal.editingReview.id);
                    }

                    // Sort by rankIndex (ascending) to show top ranked first
                    myReviews.sort((a, b) => (a.rankIndex || 0) - (b.rankIndex || 0));

                    const targetCat = normalizeCategory(reviewModal.selectedNewPlace?.category);

                    return myReviews.filter(r => {
                        // Strict category match? Or Broad?
                        // User wants Broad for grouping.
                        const rCat = normalizeCategory(r.category);
                        const match = rCat === targetCat;
                        return match;
                    });
                })()}
                allReviews={(() => {
                    // [FIX] Same fix for Global Ranking step
                    if (!user) return [];
                    let myReviews = reviews.filter(r => r.userId === user.uid);

                    // [FIX] Exclude editing review
                    if (reviewModal.editingReview) {
                        myReviews = myReviews.filter(r => r.id !== reviewModal.editingReview.id);
                    }

                    myReviews.sort((a, b) => (a.rankIndex || 0) - (b.rankIndex || 0));
                    return myReviews;
                })()}
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
                            const key1 = `${w.name} -${parseFloat(w.lat).toFixed(4)} -${parseFloat(w.lng).toFixed(4)} `;
                            const key2 = `${selectedRestaurant.name} -${parseFloat(selectedRestaurant.lat).toFixed(4)} -${parseFloat(selectedRestaurant.lng).toFixed(4)} `;
                            return key1 === key2;
                        })}
                        onToggleWishlist={(r) => toggleWishlist(r)}
                        currentUser={user} // [NEW] Pass current user for ID check
                        onDeleteReview={handleReviewDelete}
                        onEditReview={(review) => {
                            // [FIX] Close detail modal first
                            setDetailModalOpen(false);

                            // [FIX] Manually populate ReviewModal state to ensure all fields (x, y, address) are present.
                            reviewModal.setEditingReview(review);

                            reviewModal.setSelectedNewPlace({
                                id: review.placeId || selectedRestaurant?.id || review.id,
                                name: review.name || selectedRestaurant?.name,
                                address: review.location || selectedRestaurant?.address,
                                category: review.category || selectedRestaurant?.category,
                                roadAddress: review.location || "",
                                x: selectedRestaurant?.x,
                                y: selectedRestaurant?.y,
                                lat: review.lat,
                                lng: review.lng
                            });

                            reviewModal.setNewReviewParams({
                                text: review.comment,
                                rating: review.rating || 0,
                                rankIndex: review.rankIndex
                            });

                            reviewModal.setTempRankIndex(review.rankIndex !== undefined ? review.rankIndex : 0);
                            reviewModal.setIsOpen(true);
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


            {userSearchOpen && (
                <UserSearchModal
                    isOpen={userSearchOpen}
                    onClose={() => setUserSearchOpen(false)}
                    onOpenProfile={handleOpenProfile}
                />
            )}

            {/* [NEW] Profile Edit Modal */}
            <ProfileEditModal
                isOpen={profileEditModalOpen}
                user={user}
                onClose={() => setProfileEditModalOpen(false)}
                onUpdate={updateUserProfile}
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
