import React, { useState, useEffect } from "react";
import { User, X, MapPin } from "lucide-react";
import { db, doc, setDoc, deleteDoc, getDoc } from "../../lib/firebase";
import { useData } from "../../contexts/DataContext"; // [NEW]
import { useAuth } from "../../contexts/AuthContext"; // [NEW]

const ProfileModal = ({
    isOpen, // Added isOpen prop
    userProfile,
    currentUser, // Added currentUser prop
    onClose,
    activeReviews,
    onOpenDetail,
    onViewMap, // [NEW] Handler to view user's map
}) => {
    if (!isOpen || !userProfile) return null;

    // Safety: ensure ranking is array
    if (!userProfile.ranking) userProfile.ranking = [];

    const { followUser, unfollowUser } = useData(); // [FIX] Use centralized context
    const { followingList } = useAuth(); // Import useAuth too

    const isMe = currentUser && currentUser.uid === userProfile.id;
    const isFollowing = followingList && followingList.includes(userProfile.id);

    const handleFollowToggle = async () => {
        if (!currentUser) {
            alert("로그인이 필요합니다.");
            return;
        }
        try {
            if (isFollowing) {
                await unfollowUser(userProfile.id);
            } else {
                await followUser(userProfile);
            }
        } catch (e) {
            console.error(e);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-[10000] animate-in fade-in duration-200">
            <div className="fixed inset-0 z-[10001] bg-white sm:max-w-md sm:mx-auto sm:h-[85vh] sm:my-10 sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col animate-in slide-in-from-bottom duration-300">
                {/* Close Button */}
                <div className="absolute top-4 right-4 z-50">
                    <button
                        onClick={onClose}
                        className="bg-black/20 hover:bg-black/40 text-white p-2 rounded-full backdrop-blur-sm transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>      <div className="relative z-10 px-6 pt-12 pb-6 flex flex-col items-center">
                    <div className="w-24 h-24 rounded-full bg-white p-1 shadow-lg mb-3">
                        <div className="w-full h-full rounded-full bg-slate-100 flex items-center justify-center text-slate-300">
                            <User size={40} />
                        </div>
                    </div>
                    <h2 className="text-xl font-bold text-slate-800">{userProfile.nickname || "익명 사용자"}</h2>
                    <div className="flex gap-2 text-xs text-slate-500 mt-1 mb-4">
                        <span>팔로워 {userProfile.followers}</span>
                        <span>•</span>
                        <span>팔로잉 {userProfile.following || 0}</span>
                    </div>

                    {!isMe && (
                        <div className="flex w-full gap-2 mb-6">
                            <button
                                onClick={handleFollowToggle}
                                className={`flex-1 py-3 rounded-xl text-sm font-bold shadow-md transition-colors ${isFollowing
                                    ? "bg-slate-200 text-slate-700 hover:bg-slate-300"
                                    : "bg-indigo-600 text-white hover:bg-indigo-700"
                                    }`}>
                                {isFollowing ? "팔로잉" : "팔로우"}
                            </button>
                            <button
                                onClick={() => onViewMap && onViewMap(userProfile)}
                                className="flex-1 py-3 border border-indigo-100 bg-indigo-50 text-indigo-600 rounded-xl text-sm font-bold hover:bg-indigo-100 flex items-center justify-center gap-2"
                            >
                                프로필 페이지 방문
                            </button>
                        </div>
                    )}

                    <div className="w-full">
                        <h3 className="text-xs font-bold text-slate-400 mb-3 uppercase tracking-wider">
                            Top 5 Pick
                        </h3>
                        <div className="space-y-2">
                            {userProfile.ranking && userProfile.ranking.length > 0 ? (
                                userProfile.ranking.slice(0, 5).map((item, idx) => (
                                    <div
                                        key={idx}
                                        onClick={() => onOpenDetail && onOpenDetail(item)}
                                        className="bg-slate-50 p-3 rounded-xl flex items-center justify-between cursor-pointer hover:bg-slate-100 border border-slate-100"
                                    >
                                        <div className="flex items-center gap-3">
                                            <span className={`w-5 h-5 rounded flex items-center justify-center text-[10px] font-bold text-white ${idx === 0 ? 'bg-yellow-400' : idx === 1 ? 'bg-slate-400' : idx === 2 ? 'bg-amber-600' : 'bg-slate-300'}`}>
                                                {item.rank || idx + 1}
                                            </span>
                                            <span className="text-sm font-bold text-slate-700">{item.name}</span>
                                        </div>
                                        <span className="text-[10px] text-slate-400">{item.category}</span>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-4 text-xs text-slate-400">랭킹 정보가 없습니다.</div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProfileModal;
