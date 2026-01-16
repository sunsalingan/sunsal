
import React, { useEffect, useState } from "react"; // [FIX] Add useEffect, useState
import { User, MessageCircle, UserPlus, UserMinus, Settings } from "lucide-react";
import { doc, onSnapshot, db, collection } from "../../lib/firebase"; // [FIX] Import Firebase collection

/**
 * UserProfileHeader
 * Displays user info, stats, and actions at the top of the Profile Page.
 */
const UserProfileHeader = (props) => {
    const {
        user,
        currentUser,
        isFollowing,
        onFollow,
        onUnfollow,
        onMessage,
        onOpenFollowers,
        onOpenFollowing,
        onEditProfile,
        matchRate,
        totalReviewsCount // Prop passed from parent
    } = props;

    // Safety Debug
    console.log("UserProfileHeader Render PROPS:", props);

    if (!user) return null;

    const isMe = currentUser && currentUser.uid === user.id;

    // [FIX] Robust Fallback for display count
    const displayReviewCount = (totalReviewsCount !== undefined && totalReviewsCount !== null)
        ? totalReviewsCount
        : (user.ranking ? user.ranking.length : 0);

    // [FIX] Real-time Listener for Target User (to sync Followers/Following counts instantly)
    // The user requested to "Calculate counts from the collections directly", rejecting the stored field approach.

    const [realFollowerCount, setRealFollowerCount] = useState(0);
    const [realFollowingCount, setRealFollowingCount] = useState(0);

    useEffect(() => {
        if (!user) return;

        // Initialize with prop values to avoid 0 flickering if possible, or just wait for snap
        // setRealFollowerCount(user.followers || 0);

        // Listen to Followers Collection
        const followersCollection = collection(db, "users", user.id, "followers");
        const unsubFollowers = onSnapshot(followersCollection, (snap) => {
            setRealFollowerCount(snap.size);
        });

        // Listen to Following Collection
        const followingCollection = collection(db, "users", user.id, "following");
        const unsubFollowing = onSnapshot(followingCollection, (snap) => {
            setRealFollowingCount(snap.size);
        });

        return () => {
            unsubFollowers();
            unsubFollowing();
        };
    }, [user.id]);

    const displayFollowers = realFollowerCount;
    const displayFollowing = realFollowingCount;

    return (
        <div className="bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 pb-4 px-4 pt-2 mb-2 transition-colors">
            <div className="flex items-center gap-4 mb-4">
                {/* Avatar */}
                <div className="relative shrink-0">
                    <div className="w-20 h-20 rounded-full bg-slate-100 dark:bg-slate-800 p-1 shadow-md">
                        <div className="w-full h-full rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-400 overflow-hidden">
                            {user.userPhoto ? (
                                <img src={user.userPhoto} alt={user.nickname} className="w-full h-full object-cover" />
                            ) : (
                                <User size={32} />
                            )}
                        </div>
                    </div>
                </div>

                {/* Stats */}
                <div className="flex-1 flex justify-around text-center">
                    <div className="flex flex-col">
                        <span className="text-lg font-bold text-slate-800 dark:text-slate-100">{displayReviewCount}</span>
                        <span className="text-xs text-slate-500 dark:text-slate-400">리뷰</span>
                    </div>
                    <button onClick={onOpenFollowers} className="flex flex-col hover:opacity-70 transition-opacity">
                        <span className="text-lg font-bold text-slate-800 dark:text-slate-100">{displayFollowers}</span>
                        <span className="text-xs text-slate-500 dark:text-slate-400">팔로워</span>
                    </button>
                    <button onClick={onOpenFollowing} className="flex flex-col hover:opacity-70 transition-opacity">
                        <span className="text-lg font-bold text-slate-800 dark:text-slate-100">{displayFollowing}</span>
                        <span className="text-xs text-slate-500 dark:text-slate-400">팔로잉</span>
                    </button>
                </div>
            </div>

            {/* Bio & Name */}
            <div className="mb-4">
                <div className="flex items-center gap-2">
                    <h2 className="text-lg font-bold text-slate-800 dark:text-white">
                        {user.nickname || (user.email ? user.email.split('@')[0] : "익명 유저")}
                    </h2>
                    {matchRate !== undefined && !isMe && (
                        <span className="text-xs font-bold text-white bg-gradient-to-r from-pink-500 to-rose-500 px-3 py-1 rounded-full shadow-sm flex items-center gap-1">
                            <span>❤️</span> {matchRate}% 일치
                        </span>
                    )}
                </div>
                {user.bio && (
                    <p className="text-sm text-slate-600 dark:text-slate-400 mt-1 whitespace-pre-wrap">{user.bio}</p>
                )}
            </div>

            {/* Actions */}
            <div className="flex gap-2">
                {isMe ? (
                    <button
                        onClick={onEditProfile}
                        className="flex-1 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg text-sm font-bold border border-slate-200 dark:border-slate-700 hover:bg-slate-200"
                    >
                        프로필 편집
                    </button>
                ) : (
                    <>
                        {isFollowing ? (
                            <button
                                onClick={() => onUnfollow(user.id)}
                                className="flex-1 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg text-sm font-bold border border-slate-200 dark:border-slate-700 flex items-center justify-center gap-1"
                            >
                                팔로잉
                            </button>
                        ) : (
                            <button
                                onClick={() => onFollow(user)}
                                className="flex-1 py-1.5 bg-indigo-600 text-white rounded-lg text-sm font-bold hover:bg-indigo-700 flex items-center justify-center gap-1"
                            >
                                <UserPlus size={16} /> 팔로우
                            </button>
                        )}
                        <button
                            onClick={onMessage}
                            className="flex-1 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg text-sm font-bold border border-slate-200 dark:border-slate-700"
                        >
                            메시지
                        </button>
                    </>
                )}
            </div>
        </div >
    );
};

export default UserProfileHeader;
