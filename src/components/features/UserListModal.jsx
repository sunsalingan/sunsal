import React from "react";
import { X, UserPlus, UserMinus } from "lucide-react";

const UserListModal = ({
    isOpen,
    onClose,
    title,
    users,
    followingIds,
    onFollow,
    onUnfollow,
    onViewProfile,
    currentUser
}) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-[60] animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl w-full max-w-sm max-h-[80vh] flex flex-col shadow-2xl overflow-hidden relative">
                {/* Header */}
                <div className="p-4 border-b flex justify-between items-center bg-slate-50">
                    <h2 className="text-xl font-bold text-slate-800">{title}</h2>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-slate-200 rounded-full text-slate-500 transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* List */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {users && users.length > 0 ? (
                        users.map((u) => (
                            <div
                                key={u.id}
                                className="flex items-center gap-3 p-3 bg-white border border-slate-100 rounded-xl shadow-sm hover:border-indigo-200 transition-all"
                            >
                                <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center overflow-hidden shrink-0">
                                    {u.userPhoto ? (
                                        <img src={u.userPhoto} alt={u.name} className="w-full h-full object-cover" />
                                    ) : (
                                        <span className="font-bold text-slate-400">{u.name?.[0]}</span>
                                    )}
                                </div>
                                <div
                                    className="flex-1 min-w-0 cursor-pointer"
                                    onClick={() => {
                                        onViewProfile(u);
                                        onClose(); // Close list when viewing profile
                                    }}
                                >
                                    <div className="font-bold text-slate-800 truncate">{u.name}</div>
                                    <div className="text-[10px] text-slate-400">
                                        {u.matchRate ? `${u.matchRate}% 일치` : "활동 중"}
                                    </div>
                                </div>

                                {currentUser && currentUser.uid !== u.id && (
                                    <div className="shrink-0">
                                        {followingIds.includes(u.id) ? (
                                            <button
                                                onClick={() => onUnfollow(u.id)}
                                                className="p-2 bg-slate-100 text-slate-500 rounded-lg hover:bg-red-50 hover:text-red-500 transition-colors"
                                            >
                                                <UserMinus size={16} />
                                            </button>
                                        ) : (
                                            <button
                                                onClick={() => onFollow(u)}
                                                className="p-2 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 transition-colors"
                                            >
                                                <UserPlus size={16} />
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>
                        ))
                    ) : (
                        <div className="text-center py-10 text-slate-400 text-sm">
                            목록이 비어있습니다.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default UserListModal;
