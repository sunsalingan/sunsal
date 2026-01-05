import React from "react";
import { Trophy, Users, ArrowLeft, LogIn, LogOut } from "lucide-react";

const Header = ({
    currentPage,
    targetProfile,
    user,
    useRealMap,
    showMap,
    viewMode,
    setFriendsListOpen,
    setShowMap,
    handleBackToMain,
    setViewMode,
    handleLogin,
    handleLogout,
}) => {
    return (
        <header className="bg-white shadow-sm z-30 shrink-0">
            <div className="max-w-2xl mx-auto px-4 py-3 flex justify-between items-center">
                {currentPage === "MAIN" ? (
                    <>
                        <div className="flex items-center gap-2">
                            <div className="bg-indigo-600 p-2 rounded-lg text-white">
                                <Trophy size={18} />
                            </div>
                            <h1 className="text-lg font-bold text-slate-900">RankEats</h1>
                        </div>
                        <div className="flex gap-2">
                            <div className="flex items-center gap-2">
                                {user ? (
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs font-bold text-slate-600">
                                            {user.displayName}
                                        </span>
                                        <button
                                            onClick={handleLogout}
                                            className="p-2 bg-slate-100 rounded-full text-xs"
                                        >
                                            <LogOut size={16} />
                                        </button>
                                    </div>
                                ) : (
                                    <button
                                        onClick={handleLogin}
                                        className="flex items-center gap-1 bg-indigo-100 text-indigo-600 px-3 py-1.5 rounded-full text-xs font-bold"
                                    >
                                        <LogIn size={14} /> 로그인
                                    </button>
                                )}
                            </div>
                            <button
                                onClick={() => setFriendsListOpen(true)}
                                className="p-2 bg-slate-100 rounded-full"
                            >
                                <Users size={20} />
                            </button>
                        </div>
                    </>
                ) : (
                    <>
                        <div className="flex items-center gap-2">
                            <button onClick={handleBackToMain}>
                                <ArrowLeft />
                            </button>
                            <h1 className="text-lg font-bold">{targetProfile?.name}</h1>
                        </div>
                        <button
                            onClick={() => setShowMap(!showMap)}
                            className="text-xs font-bold px-3 py-2 border rounded-full"
                        >
                            {showMap ? "접기" : "지도"}
                        </button>
                    </>
                )}
            </div>
            {currentPage === "MAIN" && (
                <div className="flex border-t border-slate-100">
                    <button
                        onClick={() => setViewMode("GLOBAL")}
                        className={`flex-1 py-3 text-sm font-bold ${viewMode === "GLOBAL"
                            ? "text-indigo-600 border-b-2 border-indigo-600"
                            : "text-slate-400"
                            }`}
                    >
                        전체
                    </button>
                    <button
                        onClick={() => setViewMode("MY")}
                        className={`flex-1 py-3 text-sm font-bold ${viewMode === "MY"
                            ? "text-emerald-600 border-b-2 border-emerald-600"
                            : "text-slate-400"
                            }`}
                    >
                        내 랭킹
                    </button>
                    <button
                        onClick={() => setViewMode("FRIENDS")}
                        className={`flex-1 py-3 text-sm font-bold ${viewMode === "FRIENDS"
                            ? "text-pink-600 border-b-2 border-pink-600"
                            : "text-slate-400"
                            }`}
                    >
                        친구
                    </button>
                </div>
            )}
        </header>
    );
};

export default Header;
