import React, { useState, useEffect } from "react";
import { X, UserX, UserCheck, Users } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { useData } from "../../contexts/DataContext";

const FriendManagementModal = ({ isOpen, onClose, onOpenProfile }) => {
    const { user, followingList } = useAuth();
    const { searchUsers, followUser, unfollowUser } = useData();
    const [activeTab, setActiveTab] = useState("following"); // following, followers, blocked

    // Mock Blocked Users for now (Since we don't have block logic yet)
    const [blockedUsers, setBlockedUsers] = useState([]);

    // Derived Lists
    const [followingData, setFollowingData] = useState([]);
    const [followersData, setFollowersData] = useState([]);

    useEffect(() => {
        if (!isOpen || !user) return;

        // Fetch Data Logic
        // 1. Following: We have IDs in followingList. Need to fetch details? 
        // Actually, AuthContext followingList is just an array of IDs usually, or objects?
        // Let's assume we need to resolving IDs to Names if possible, or just use what we have.
        // For simplicity, let's reuse the 'fetchFriends' logic from App.jsx or just pass it in?
        // To keep it self-contained, let's just use what's available.
        // Wait, App.jsx already has 'friendsData'. Maybe we should pass that?
        // But for independence, let's just fetch profiles if needed.
        // Ideally, we passed 'friendsData' to UserListModal. 
        // Let's assume for this specific modal, we might just re-fetch or use a simple heuristic.

        // Actually, let's use searchUsers simply to 'find' by ID if we could, but we can't.
        // Let's Mock for the UI demonstration as requested, combining with real followingList for following.

        const loadData = async () => {
            // Real Following List
            setFollowingData(followingList.map(id => ({ id, name: "친구 " + id.substr(0, 4), matchRate: 88 })));

            // Mock Followers (Random)
            setFollowersData([
                { id: "f1", name: "팔로워1", matchRate: 90 },
                { id: "f2", name: "팔로워2", matchRate: 85 }
            ]);

            // Mock Blocked
            setBlockedUsers([
                { id: "b1", name: "차단된 유저1" }
            ]);
        };
        loadData();

    }, [isOpen, user, followingList]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

            <div className="bg-white rounded-2xl w-full max-w-md z-10 overflow-hidden shadow-2xl flex flex-col h-[600px]">
                {/* Header */}
                <div className="p-4 border-b flex justify-between items-center bg-slate-50">
                    <h2 className="font-bold text-lg flex items-center gap-2">
                        <Users size={20} className="text-indigo-600" />
                        친구 관리
                    </h2>
                    <button onClick={onClose}>
                        <X className="text-slate-400 hover:text-slate-600" />
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex border-b">
                    <button
                        onClick={() => setActiveTab("following")}
                        className={`flex-1 py-3 text-sm font-bold transition-colors ${activeTab === "following" ? "text-indigo-600 border-b-2 border-indigo-600" : "text-slate-400 hover:bg-slate-50"}`}
                    >
                        팔로잉 ({followingData.length})
                    </button>
                    <button
                        onClick={() => setActiveTab("followers")}
                        className={`flex-1 py-3 text-sm font-bold transition-colors ${activeTab === "followers" ? "text-indigo-600 border-b-2 border-indigo-600" : "text-slate-400 hover:bg-slate-50"}`}
                    >
                        팔로워 ({followersData.length})
                    </button>
                    <button
                        onClick={() => setActiveTab("blocked")}
                        className={`flex-1 py-3 text-sm font-bold transition-colors ${activeTab === "blocked" ? "text-red-500 border-b-2 border-red-500" : "text-slate-400 hover:bg-slate-50"}`}
                    >
                        차단 목록 ({blockedUsers.length})
                    </button>
                </div>

                {/* List Content */}
                <div className="flex-1 overflow-y-auto p-0 bg-slate-50">
                    {activeTab === "following" && (
                        <UserList items={followingData} type="following" onAction={unfollowUser} actionLabel="언팔로우" />
                    )}
                    {activeTab === "followers" && (
                        <UserList items={followersData} type="follower" onAction={followUser} actionLabel="맞팔로우" />
                    )}
                    {activeTab === "blocked" && (
                        <div className="p-4 space-y-2">
                            {blockedUsers.map(u => (
                                <div key={u.id} className="bg-white p-3 rounded-xl border flex justify-between items-center">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-slate-200" />
                                        <span className="font-bold text-slate-700">{u.name}</span>
                                    </div>
                                    <button className="text-xs bg-red-100 text-red-600 px-3 py-1.5 rounded-full font-bold">
                                        차단 해제
                                    </button>
                                </div>
                            ))}
                            {blockedUsers.length === 0 && <div className="text-center p-10 text-slate-400">차단한 사용자가 없습니다.</div>}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

const UserList = ({ items, type, onAction, actionLabel }) => {
    if (items.length === 0) return <div className="text-center p-10 text-slate-400">목록이 비어있습니다.</div>;

    return (
        <div className="divide-y divide-slate-100 bg-white">
            {items.map(user => (
                <div key={user.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-slate-200 border overflow-hidden">
                            {/* Placeholder Avatar */}
                            <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user.id}`} alt="avatar" />
                        </div>
                        <div>
                            <p className="font-bold text-slate-800 text-sm">{user.name || "알 수 없음"}</p>
                            <p className="text-xs text-slate-500">일치도 {user.matchRate || 80}%</p>
                        </div>
                    </div>
                    <button
                        onClick={() => onAction && onAction(user.id)}
                        className={`px-3 py-1.5 rounded-full text-xs font-bold transition-colors ${type === 'following' ? 'bg-slate-100 text-slate-500' : 'bg-indigo-100 text-indigo-600'}`}
                    >
                        {actionLabel}
                    </button>
                </div>
            ))}
        </div>
    );
};

export default FriendManagementModal;
