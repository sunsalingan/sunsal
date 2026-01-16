import React from "react";
import { X, UserPlus, UserMinus, MessageSquare } from "lucide-react";

const FriendDrawer = ({
    isOpen,
    onClose,
    friends,
    followingIds,
    onFollow,
    onUnfollow,
    onViewProfile,
    currentUser,
    title, // [NEW]
}) => {
    return (
        <>
            {/* Overlay Backback */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/20 z-[40] transition-opacity"
                    onClick={onClose}
                />
            )}

            {/* Drawer */}
            <div
                className={`fixed right-0 top-0 h-full w-80 bg-white z-[50] shadow-2xl transform transition-transform duration-300 ease-in-out ${isOpen ? "translate-x-0" : "translate-x-full"
                    } flex flex-col`}
            >
                <div className="p-4 border-b flex justify-between items-center bg-slate-50">
                    <h2 className="text-xl font-bold text-slate-800">{title || "친구 목록"}</h2>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-slate-200 rounded-full text-slate-500 transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {friends.length > 0 ? (
                        friends.map((f) => (
                            <div
                                key={f.id}
                                className="flex items-center gap-3 p-3 bg-white border border-slate-100 rounded-xl shadow-sm hover:border-indigo-200 transition-all group"
                            >
                                <div
                                    className={`w-10 h-10 rounded-full ${f.avatarColor || "bg-indigo-100 text-indigo-500"
                                        } flex items-center justify-center font-bold relative`}
                                >
                                    {f.userPhoto ? (
                                        <img src={f.userPhoto} alt={f.name} className="w-full h-full rounded-full object-cover" />
                                    ) : (
                                        (f.nickname || f.name)?.[0] || "?"
                                    )}
                                </div>
                                <div
                                    className="flex-1 min-w-0 cursor-pointer"
                                    onClick={() => onViewProfile(f)}
                                >
                                    <div className="font-bold text-slate-800 truncate hover:text-indigo-600 transition-colors">{f.nickname || f.name}</div>
                                    <div className="text-[10px] text-slate-400 mt-0.5">
                                        {f.matchRate ? `취향 일치도 ${f.matchRate}%` : "활동 중"}
                                    </div>
                                </div>
                                <div className="flex gap-1">
                                    {followingIds.includes(f.id) ? (
                                        <button
                                            onClick={() => onUnfollow(f.id)}
                                            className="p-2 hover:bg-red-50 text-red-500 rounded-lg transition-colors"
                                            title="언팔로우"
                                        >
                                            <UserMinus size={16} />
                                        </button>
                                    ) : (
                                        <button
                                            onClick={() => onFollow(f)}
                                            className="p-2 hover:bg-emerald-50 text-emerald-600 rounded-lg transition-colors"
                                            title="팔로우"
                                        >
                                            <UserPlus size={16} />
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="text-center py-20 text-slate-400">
                            <p className="text-sm">추천할 친구가 아직 없습니다.</p>
                        </div>
                    )}
                </div>

                <div className="p-4 bg-slate-50 border-t">
                    <p className="text-[10px] text-slate-400 text-center">
                        팔로우한 친구의 리뷰는 '친구' 탭에서 확인할 수 있습니다.
                    </p>
                </div>
            </div>
        </>
    );
};

export default FriendDrawer;
