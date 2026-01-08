import React, { useState } from "react";
import { X, Search, UserPlus, UserCheck, User } from "lucide-react";
import { useData } from "../../contexts/DataContext";
import { useAuth } from "../../contexts/AuthContext";

const UserSearchModal = ({ isOpen, onClose }) => {
    const { searchUsers, followUser, unfollowUser } = useData();
    const { user: currentUser, followingList } = useAuth();

    const [query, setQuery] = useState("");
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searched, setSearched] = useState(false);

    if (!isOpen) return null;

    const handleSearch = async (e) => {
        e.preventDefault();
        if (!query.trim()) return;

        setLoading(true);
        try {
            const users = await searchUsers(query);
            // Filter out self
            setResults(users.filter(u => u.id !== currentUser?.uid));
        } catch (error) {
            console.error("Search failed", error);
        } finally {
            setLoading(false);
            setSearched(true);
        }
    };

    const isFollowing = (targetId) => {
        // followingList in DataContext/AuthContext is just an array of IDs? 
        // Need to verify standard in DataContext.
        // Assuming followingList is an array of IDs from AuthContext or DataContext.
        return followingList && followingList.includes(targetId);
    };

    const handleToggleFollow = async (targetUser) => {
        if (isFollowing(targetUser.id)) {
            await unfollowUser(targetUser.id);
        } else {
            await followUser(targetUser.id);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[70] animate-in fade-in duration-200 p-4">
            <div className="bg-white w-full max-w-sm rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[600px]">

                {/* Header */}
                <div className="p-4 border-b flex items-center justify-between bg-white shrink-0">
                    <h2 className="font-bold text-lg flex items-center gap-2">
                        <UserPlus size={20} className="text-indigo-600" />
                        친구 찾기
                    </h2>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-slate-100 transition-colors">
                        <X size={20} className="text-slate-500" />
                    </button>
                </div>

                {/* Search Bar */}
                <div className="p-4 bg-slate-50 shrink-0">
                    <form onSubmit={handleSearch} className="relative">
                        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            placeholder="닉네임 또는 이메일 검색..."
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                            autoFocus
                        />
                        <button
                            type="submit"
                            disabled={loading || !query.trim()}
                            className="absolute right-2 top-1/2 -translate-y-1/2 bg-indigo-600 text-white text-xs font-bold px-3 py-1.5 rounded-lg disabled:opacity-50 hover:bg-indigo-700 transition-colors"
                        >
                            검색
                        </button>
                    </form>
                </div>

                {/* Results List */}
                <div className="flex-1 overflow-y-auto p-2">
                    {loading ? (
                        <div className="flex items-center justify-center h-40">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                        </div>
                    ) : results.length > 0 ? (
                        <div className="space-y-1">
                            {results.map((u) => (
                                <div key={u.id} className="flex items-center justify-between p-3 hover:bg-slate-50 rounded-xl transition-colors">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center overflow-hidden border border-slate-100">
                                            {u.photoURL ? (
                                                <img src={u.photoURL} alt={u.name} className="w-full h-full object-cover" />
                                            ) : (
                                                <User size={18} className="text-slate-500" />
                                            )}
                                        </div>
                                        <div>
                                            <div className="font-bold text-sm text-slate-800">{u.name || "알 수 없음"}</div>
                                            <div className="text-xs text-slate-400">{u.email}</div>
                                        </div>
                                    </div>

                                    <button
                                        onClick={() => handleToggleFollow(u)}
                                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${isFollowing(u.id)
                                            ? "bg-slate-100 text-slate-500 hover:bg-red-50 hover:text-red-500 border border-slate-200"
                                            : "bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm shadow-indigo-200"
                                            }`}
                                    >
                                        {isFollowing(u.id) ? (
                                            <>
                                                <UserCheck size={14} /> 팔로잉
                                            </>
                                        ) : (
                                            <>
                                                <UserPlus size={14} /> 팔로우
                                            </>
                                        )}
                                    </button>
                                </div>
                            ))}
                        </div>
                    ) : searched ? (
                        <div className="flex flex-col items-center justify-center h-40 text-slate-400 text-sm gap-2">
                            <Search size={32} className="opacity-20" />
                            <p>검색 결과가 없습니다.</p>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-40 text-slate-400 text-xs gap-2">
                            <p>유저 닉네임을 입력하여<br />친구를 찾아보세요.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default UserSearchModal;
