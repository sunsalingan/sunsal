import React from 'react';
import { UserPlus, UserCheck } from 'lucide-react';

const FriendRecommendation = ({ recommendations, onFollow, followingList = [] }) => {
    if (!recommendations || recommendations.length === 0) return null;

    return (
        <div className="mt-6 w-full max-w-sm mx-auto">
            <h3 className="text-sm font-bold text-slate-500 dark:text-slate-400 mb-3 px-2 flex items-center justify-between">
                <span>✨ 취향이 비슷한 친구 추천</span>
                <span className="text-xs font-normal text-indigo-500 bg-indigo-50 dark:bg-indigo-900/30 px-2 py-0.5 rounded-full">
                    Beta
                </span>
            </h3>

            <div className="flex flex-col gap-3">
                {recommendations.map((user) => {
                    const isFollowing = followingList.includes(user.id);
                    const similarity = Math.min(100, Math.round(user.similarityScore * 10)); // Rough % conversion logic

                    return (
                        <div
                            key={user.id}
                            className="bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm flex items-center justify-between gap-3 transition-transform hover:scale-[1.01]"
                        >
                            <div className="flex items-center gap-3 overflow-hidden">
                                <div className="w-10 h-10 rounded-full bg-slate-200 shrink-0 overflow-hidden border border-slate-100 dark:border-slate-600">
                                    {user.photoURL ? (
                                        <img src={user.photoURL} alt={user.name} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-lg">👤</div>
                                    )}
                                </div>
                                <div className="min-w-0">
                                    <div className="font-bold text-slate-800 dark:text-slate-100 truncate text-sm">
                                        {user.nickname || user.name || "익명 사용자"}
                                    </div>
                                    <div className="text-xs text-indigo-600 dark:text-indigo-400 font-medium flex items-center gap-1">
                                        <span>💖 취향 일치도 {similarity}%</span>
                                    </div>
                                    <div className="text-[10px] text-slate-400 truncate">
                                        위시리스트 {user.similarityDetails?.wishlistCount || 0}개 • 리뷰 {user.similarityDetails?.reviewCount || 0}개 일치
                                    </div>
                                </div>
                            </div>

                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onFollow(user.id);
                                }}
                                disabled={isFollowing}
                                className={`shrink-0 w-8 h-8 flex items-center justify-center rounded-full transition-all ${isFollowing
                                        ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                                        : "bg-indigo-50 hover:bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:hover:bg-indigo-900/50 dark:text-indigo-300"
                                    }`}
                            >
                                {isFollowing ? <UserCheck size={16} /> : <UserPlus size={16} />}
                            </button>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default FriendRecommendation;
