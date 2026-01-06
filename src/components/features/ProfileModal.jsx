import React, { useState, useEffect, useMemo } from "react";
import { User, X, MapPin, Star, Heart } from "lucide-react";
import { db, doc, setDoc, deleteDoc, getDoc, collection, onSnapshot, query, where, getDocs } from "../../lib/firebase";

const ProfileModal = ({
    isOpen,
    userProfile,
    currentUser,
    onClose,
    activeReviews, // Currently filtered reviews (for context)
    allReviews,    // All reviews (for accurate calculation)
    onOpenDetail,
}) => {
    if (!isOpen || !userProfile) return null;

    const isMe = currentUser && currentUser.uid === userProfile.id;
    const [isFollowing, setIsFollowing] = useState(false);
    const [followersCount, setFollowersCount] = useState(userProfile.followers || 0);
    const [followingCount, setFollowingCount] = useState(userProfile.following || 0);
    const [activeTab, setActiveTab] = useState("REVIEWS"); // REVIEWS | TASTE
    const [matchRate, setMatchRate] = useState(0);
    const [commonPlaces, setCommonPlaces] = useState([]);

    // 1. Check Follow Status & Real-time Counts
    useEffect(() => {
        if (currentUser && userProfile.id) {
            // Check if I follow this user
            const checkFollow = async () => {
                const docRef = doc(db, "users", currentUser.uid, "following", userProfile.id);
                const docSnap = await getDoc(docRef);
                setIsFollowing(docSnap.exists());
            };
            checkFollow();
        }

        // Get Real Followers Count
        const unsubscribeFollowers = onSnapshot(collection(db, "users", userProfile.id, "followers"), (snap) => {
            setFollowersCount(snap.size);
        });
        // Get Real Following Count
        const unsubscribeFollowing = onSnapshot(collection(db, "users", userProfile.id, "following"), (snap) => {
            setFollowingCount(snap.size);
        });

        return () => {
            unsubscribeFollowers();
            unsubscribeFollowing();
        };
    }, [currentUser, userProfile.id]);

    // 2. Calculate Taste Match Rate
    useEffect(() => {
        if (!currentUser || !allReviews) return;
        if (isMe) {
            setMatchRate(100);
            return;
        }

        const myReviews = allReviews.filter(r => r.userId === currentUser.uid);
        const targetReviews = allReviews.filter(r => r.userId === userProfile.id);

        if (myReviews.length === 0 || targetReviews.length === 0) {
            setMatchRate(0);
            return;
        }

        // Find common places (by name)
        const myPlaces = new Map(myReviews.map(r => [r.name, r]));
        const common = [];
        let totalScoreDiff = 0;
        let matchCount = 0;

        targetReviews.forEach(targetReview => {
            if (myPlaces.has(targetReview.name)) {
                const myReview = myPlaces.get(targetReview.name);
                common.push({
                    name: targetReview.name,
                    myScore: myReview.globalScore,
                    targetScore: targetReview.globalScore,
                    category: targetReview.category
                });
                // Calculate difference (max diff 10)
                // 10 - diff is the match score for this item
                const diff = Math.abs(myReview.globalScore - targetReview.globalScore);
                totalScoreDiff += diff;
                matchCount++;
            }
        });

        setCommonPlaces(common);

        if (matchCount > 0) {
            // Average difference
            const avgDiff = totalScoreDiff / matchCount;
            // Map avgDiff (0~10) to percentage (100% ~ 0%)
            // If avgDiff is 0, match is 100%. If avgDiff is 5, match is 50%.
            const percentage = Math.max(0, 100 - (avgDiff * 10));

            // Weight by number of common places (more matches = higher confidence)
            // But for simple UI, let's keep it raw percentage based on score similarity.
            setMatchRate(Math.round(percentage));
        } else {
            // No common places, try category matching?
            // For now, 0% or maybe a baseline based on category preference overlap
            setMatchRate(10); // Baseline 10%
        }

    }, [currentUser, userProfile.id, allReviews, isMe]);

    // 3. Get Target User's Reviews
    const targetUserReviews = useMemo(() => {
        return (allReviews || [])
            .filter(r => r.userId === userProfile.id)
            .sort((a, b) => b.timestamp - a.timestamp); // Latest first
    }, [allReviews, userProfile.id]);


    // Handlers
    const handleFollowToggle = async () => {
        if (!currentUser) {
            alert("로그인이 필요합니다.");
            return;
        }
        try {
            const myFollowRef = doc(db, "users", currentUser.uid, "following", userProfile.id);
            const targetFollowerRef = doc(db, "users", userProfile.id, "followers", currentUser.uid);

            if (isFollowing) {
                await deleteDoc(myFollowRef);
                await deleteDoc(targetFollowerRef);
                setIsFollowing(false);
            } else {
                const timestamp = new Date();
                const myProfile = {
                    uid: currentUser.uid,
                    name: currentUser.displayName || "Unknown",
                    photoURL: currentUser.photoURL,
                    timestamp
                };
                const targetProfileData = {
                    uid: userProfile.id,
                    name: userProfile.name,
                    photoURL: userProfile.photoURL,
                    timestamp
                };

                await setDoc(myFollowRef, targetProfileData);
                await setDoc(targetFollowerRef, myProfile);
                setIsFollowing(true);
            }
        } catch (e) {
            console.error(e);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-[9999] animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl relative flex flex-col max-h-[90vh]">
                {/* Header Background */}
                <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 z-0" />

                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 z-50 p-2 bg-black/20 hover:bg-black/40 rounded-full text-white backdrop-blur-sm cursor-pointer transition-colors"
                >
                    <X size={20} />
                </button>

                {/* Profile Info */}
                <div className="relative z-10 px-6 pt-16 flex flex-col items-center shrink-0">
                    <div className="w-28 h-28 rounded-full bg-white p-1.5 shadow-xl mb-4">
                        <div className="w-full h-full rounded-full bg-slate-100 flex items-center justify-center overflow-hidden border-2 border-indigo-100">
                            {userProfile.photoURL ? (
                                <img src={userProfile.photoURL} alt={userProfile.name} className="w-full h-full object-cover" />
                            ) : (
                                <User size={48} className="text-slate-300" />
                            )}
                        </div>
                    </div>

                    <h2 className="text-2xl font-bold text-slate-800 mb-1">{userProfile.name}</h2>

                    {/* Stats */}
                    <div className="flex items-center gap-6 text-sm text-slate-600 mb-6 bg-white/80 backdrop-blur-sm px-6 py-2 rounded-full shadow-sm border border-slate-100">
                        <div className="flex flex-col items-center">
                            <span className="font-bold text-slate-800">{targetUserReviews.length}</span>
                            <span className="text-xs">리뷰</span>
                        </div>
                        <div className="w-px h-6 bg-slate-200" />
                        <div className="flex flex-col items-center">
                            <span className="font-bold text-slate-800">{followersCount}</span>
                            <span className="text-xs">팔로워</span>
                        </div>
                        <div className="w-px h-6 bg-slate-200" />
                        <div className="flex flex-col items-center">
                            <span className="font-bold text-slate-800">{followingCount}</span>
                            <span className="text-xs">팔로잉</span>
                        </div>
                    </div>

                    {/* Match Rate (Only for others) */}
                    {!isMe && (
                        <div className="mb-6 flex flex-col items-center w-full">
                            <div className="flex items-center gap-2 mb-2">
                                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">나와의 취향 일치도</span>
                            </div>
                            <div className="w-full bg-slate-100 rounded-full h-8 relative overflow-hidden max-w-[240px]">
                                <div
                                    className="absolute top-0 left-0 h-full bg-gradient-to-r from-pink-500 to-indigo-500 transition-all duration-1000 ease-out"
                                    style={{ width: `${matchRate}%` }}
                                />
                                <div className="absolute inset-0 flex items-center justify-center text-xs font-bold text-white drop-shadow-md">
                                    {matchRate}% 일치!
                                </div>
                            </div>
                            {commonPlaces.length > 0 && (
                                <p className="text-[10px] text-slate-400 mt-2">
                                    함께 방문한 맛집 <b>{commonPlaces.length}곳</b>의 평점이 비슷해요
                                </p>
                            )}
                        </div>
                    )}

                    {/* Actions */}
                    {!isMe && (
                        <div className="flex w-full gap-2 mb-6 max-w-[280px]">
                            <button
                                onClick={handleFollowToggle}
                                className={`flex-1 py-2.5 rounded-xl text-sm font-bold shadow-md transition-all active:scale-95 ${isFollowing
                                    ? "bg-slate-100 text-slate-600 hover:bg-slate-200"
                                    : "bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-200"
                                    }`}>
                                {isFollowing ? "팔로잉 중" : "팔로우"}
                            </button>
                            <button className="px-4 py-2.5 border border-slate-200 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50 active:scale-95">
                                메시지
                            </button>
                        </div>
                    )}
                </div>

                {/* Tabs */}
                <div className="flex border-b border-slate-100 px-6 shrink-0">
                    <button
                        onClick={() => setActiveTab("REVIEWS")}
                        className={`flex-1 pb-3 text-sm font-bold border-b-2 transition-colors ${activeTab === "REVIEWS" ? "border-indigo-600 text-indigo-600" : "border-transparent text-slate-400 hover:text-slate-600"}`}
                    >
                        리뷰 ({targetUserReviews.length})
                    </button>
                    <button
                        onClick={() => setActiveTab("TASTE")}
                        className={`flex-1 pb-3 text-sm font-bold border-b-2 transition-colors ${activeTab === "TASTE" ? "border-indigo-600 text-indigo-600" : "border-transparent text-slate-400 hover:text-slate-600"}`}
                    >
                        취향 분석
                    </button>
                </div>

                {/* Content Area */}
                <div className="flex-1 overflow-y-auto p-4 bg-slate-50 min-h-0">
                    {activeTab === "REVIEWS" ? (
                        <div className="space-y-3">
                            {targetUserReviews.length > 0 ? (
                                targetUserReviews.map((review) => (
                                    <div
                                        key={review.id}
                                        onClick={() => {
                                            if (onOpenDetail) {
                                                onOpenDetail(review);
                                                // Should we close profile? maybe not.
                                            }
                                        }}
                                        className="bg-white p-3 rounded-xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                                    >
                                        <div className="flex justify-between items-start mb-1">
                                            <span className="font-bold text-slate-800 text-sm truncate pr-2">{review.name}</span>
                                            <span className="flex items-center gap-1 text-[10px] font-bold bg-yellow-100 text-yellow-700 px-1.5 py-0.5 rounded">
                                                <Star size={8} className="fill-current" /> {review.globalScore}
                                            </span>
                                        </div>
                                        <div className="text-[10px] text-slate-400 mb-2">{review.category} · {review.address || "서울 어딘가"}</div>
                                        <p className="text-xs text-slate-600 line-clamp-2">{review.comment}</p>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-10 text-slate-400 text-xs">
                                    작성한 리뷰가 없습니다.
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {!isMe && commonPlaces.length > 0 ? (
                                <>
                                    <div className="text-xs text-slate-500 font-bold px-1">공통으로 평가한 맛집</div>
                                    {commonPlaces.map((place, idx) => (
                                        <div key={idx} className="bg-white p-3 rounded-xl border border-slate-100 shadow-sm flex justify-between items-center">
                                            <div>
                                                <div className="font-bold text-sm text-slate-800">{place.name}</div>
                                                <div className="text-[10px] text-slate-400">{place.category}</div>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <div className="flex flex-col items-center">
                                                    <span className="text-[10px] text-slate-400">나</span>
                                                    <span className={`text-xs font-bold ${place.myScore >= 8 ? 'text-indigo-600' : 'text-slate-600'}`}>{place.myScore}</span>
                                                </div>
                                                <div className="w-px h-6 bg-slate-100" />
                                                <div className="flex flex-col items-center">
                                                    <span className="text-[10px] text-slate-400">상대</span>
                                                    <span className={`text-xs font-bold ${place.targetScore >= 8 ? 'text-indigo-600' : 'text-slate-600'}`}>{place.targetScore}</span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </>
                            ) : (
                                <div className="flex flex-col items-center justify-center py-10 text-slate-400 gap-2">
                                    <Heart size={32} className="text-slate-200" />
                                    <div className="text-center">
                                        <p className="text-sm font-bold text-slate-500">아직 겹치는 취향이 없어요</p>
                                        <p className="text-xs mt-1">서로 더 많은 리뷰를 남겨보세요!</p>
                                    </div>
                                </div>
                            )}

                            {/* Taste Radar (Visual Dummy) */}
                            <div className="bg-white p-4 rounded-xl border border-slate-100 mt-4">
                                <h4 className="text-xs font-bold text-slate-800 mb-3">선호 카테고리 분포</h4>
                                <div className="space-y-2">
                                    {["한식", "양식", "일식", "카페"].map(cat => {
                                        // Simple heuristic count
                                        const count = targetUserReviews.filter(r => r.category === cat).length;
                                        const total = Math.max(1, targetUserReviews.length);
                                        const percent = Math.round((count / total) * 100);
                                        return (
                                            <div key={cat} className="flex items-center gap-2">
                                                <span className="text-[10px] text-slate-500 w-8">{cat}</span>
                                                <div className="flex-1 bg-slate-100 h-1.5 rounded-full overflow-hidden">
                                                    <div className="bg-indigo-400 h-full rounded-full" style={{ width: `${percent}%` }} />
                                                </div>
                                                <span className="text-[10px] text-slate-400 w-6 text-right">{percent}%</span>
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ProfileModal;
