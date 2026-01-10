import React from "react";
import { X, Trophy, User, Users, Settings, LogOut, ChevronRight, Search, Heart, Map } from "lucide-react";

const Sidebar = ({
    isOpen,
    onClose,
    user,
    handleLogout,
    onChangeViewMode,
    currentViewMode,
    onOpenMyProfile,
    onOpenFriendManagement,
    darkMode,
    toggleDarkMode
}) => {
    return (
        <>
            {/* Backdrop */}
            {isOpen && (
                <div
                    className="absolute inset-0 bg-black/50 z-[9998] backdrop-blur-sm"
                    onClick={onClose}
                />
            )}

            {/* Sidebar Pane */}
            <div
                className={`absolute top-0 left-0 w-64 h-full bg-white z-[9999] shadow-2xl transform transition-transform duration-300 ease-in-out ${isOpen ? "translate-x-0" : "-translate-x-full"
                    } flex flex-col`}
            >
                {/* Header */}
                <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-indigo-600 text-white">
                    <div className="flex items-center gap-2 font-bold text-lg">
                        <Trophy size={20} className="text-yellow-300" />
                        <span>RankEats</span>
                    </div>
                    <button onClick={onClose} className="p-1 hover:bg-white/20 rounded-full transition-colors">
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto py-4">
                    <div className="space-y-1">
                        {/* 1. Ranking Section (Top 3) */}
                        <SidebarItem
                            icon={<Trophy size={18} className="text-indigo-500" />}
                            label="🏆 전국 통합 랭킹"
                            onClick={() => { onChangeViewMode("GLOBAL"); onClose(); }}
                            isActive={currentViewMode === "GLOBAL"}
                        />
                        <SidebarItem
                            icon={<User size={18} className="text-emerald-500" />}
                            label="🎖️ 내 랭킹"
                            onClick={() => { onChangeViewMode("MY"); onClose(); }}
                            isActive={currentViewMode === "MY"}
                        />
                        <SidebarItem
                            icon={<Users size={18} className="text-pink-500" />}
                            label="👥 지인 랭킹"
                            onClick={() => { onChangeViewMode("FRIENDS"); onClose(); }}
                            isActive={currentViewMode === "FRIENDS"}
                        />

                        {/* Divider */}
                        <div className="my-4 border-t border-slate-100 mx-3" />

                        {/* 2. Features Section */}
                        <SidebarItem
                            icon={<Search size={18} className="text-orange-500" />}
                            label="🏢 프랜차이즈 랭킹"
                            onClick={() => { onChangeViewMode("FRANCHISE"); onClose(); }}
                            isActive={currentViewMode === "FRANCHISE"}
                        />
                        <SidebarItem
                            icon={<Heart size={18} className="text-red-500" />}
                            label="💖 가고싶어요"
                            onClick={() => { onChangeViewMode("WISHLIST"); onClose(); }}
                            isActive={currentViewMode === "WISHLIST"}
                        />

                        {/* Divider */}
                        <div className="my-4 border-t border-slate-100 mx-3" />

                        {/* 3. Management Section */}
                        <SidebarItem
                            icon={<Settings size={18} />} // Using Settings icon for generic management or Users
                            label="🛠️ 친구 관리"
                            onClick={onOpenFriendManagement}
                        />
                        <SidebarItem
                            icon={<User size={18} />}
                            label="👤 마이 페이지"
                            onClick={onOpenMyProfile}
                        />

                        {/* Settings with Toggle */}
                        <div className="px-3 py-3 flex items-center justify-between cursor-pointer hover:bg-slate-50 rounded-lg mx-2 transition-colors">
                            <div className="flex items-center gap-3 text-slate-600">
                                <Settings size={18} />
                                <span className="font-medium text-sm">설정 (다크모드)</span>
                            </div>
                            <div
                                onClick={(e) => {
                                    e.stopPropagation();
                                    toggleDarkMode();
                                }}
                                className={`w-10 h-5 rounded-full relative transition-colors ${darkMode ? "bg-indigo-600" : "bg-slate-300"}`}
                            >
                                <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-transform ${darkMode ? "left-6" : "left-1"}`} />
                            </div>
                        </div>

                    </div>
                </div>

                {/* Footer (User Info) */}
                <div className="p-4 border-t border-slate-100 bg-slate-50 dark:bg-slate-950 dark:border-slate-800">
                    {user ? (
                        <button
                            onClick={handleLogout}
                            className="w-full flex items-center justify-center gap-2 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-xl font-bold hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                        >
                            <LogOut size={18} />
                            로그아웃
                        </button>
                    ) : (
                        <div className="text-center text-sm text-slate-500 dark:text-slate-400">
                            로그인이 필요합니다
                        </div>
                    )}
                </div>
            </div>
        </>
    );
};

const SidebarItem = ({ icon, label, onClick, isActive }) => (
    <button
        onClick={onClick}
        className={`w-full flex items-center justify-between p-3.5 rounded-xl group transition-all ${isActive ? "bg-indigo-50 text-indigo-700 font-bold" : "hover:bg-indigo-50 text-slate-700 font-medium"
            }`}
    >
        <div className="flex items-center gap-3 group-hover:text-indigo-600">
            <span className={`${isActive ? "text-indigo-600" : "text-slate-400 group-hover:text-indigo-500"}`}>{icon}</span>
            <span className="text-sm">{label}</span>
        </div>
        {isActive && <ChevronRight size={14} className="text-indigo-600" />}
    </button>
);

export default Sidebar;
