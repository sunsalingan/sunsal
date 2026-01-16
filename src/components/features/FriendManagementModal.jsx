import React, { useState, useEffect } from "react";
import { X, UserX, UserCheck, Users } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { useData } from "../../contexts/DataContext";
import { db, collection, getDocs } from "../../lib/firebase";

const FriendManagementModal = ({ isOpen, onClose, onOpenProfile }) => {
    const { user, followingList, followUser, unfollowUser } = useAuth();
    const { searchUsers } = useData();
    const [activeTab, setActiveTab] = useState("following"); // following, followers, blocked

    // Mock Blocked Users for now (Since we don't have block logic yet)
    const [blockedUsers, setBlockedUsers] = useState([]);

    const [followingData, setFollowingData] = useState([]);
    const [followersData, setFollowersData] = useState([]);

    useEffect(() => {
        if (!isOpen || !user) return;

        const loadData = async () => {
            // 1. Load Following (My 'following' collection)
            const followingRef = collection(db, "users", user.uid, "following");
            const followingSnap = await getDocs(followingRef);
            const following = followingSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setFollowingData(following);

            // 2. Load Followers (My 'followers' collection)
            const followersRef = collection(db, "users", user.uid, "followers");
            const followersSnap = await getDocs(followersRef);
            const followers = followersSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setFollowersData(followers);

            // Blocked is still mock or unimplemented
            setBlockedUsers([]);
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
                        <UserList items={followingData} type="following" onAction={unfollowUser} actionLabel="언팔로우" onOpenProfile={onOpenProfile} />
                    )}
                    {activeTab === "followers" && (
                        <UserList items={followersData} type="follower" onAction={followUser} actionLabel="맞팔로우" onOpenProfile={onOpenProfile} />
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

const UserList = ({ items, type, onAction, actionLabel, onOpenProfile }) => {
    if (items.length === 0) return <div className="text-center p-10 text-slate-400">목록이 비어있습니다.</div>;

    return (
        <div className="divide-y divide-slate-100 bg-white">
            {items.map(user => (
                <div key={user.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                    <div className="flex items-center gap-3 cursor-pointer" onClick={() => onOpenProfile && onOpenProfile(user.id)}>
                        <div className="w-10 h-10 rounded-full bg-slate-200 border overflow-hidden">
                            {/* Placeholder Avatar */}
                            <img src={user.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.id}`} alt="avatar" />
                        </div>
                        <div>
                            {/* [FIX] Strict Privacy: Nickname Only */}
                            <p className="font-bold text-slate-800 text-sm hover:text-indigo-600 transition-colors">{user.nickname || "익명 유저"}</p>
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
