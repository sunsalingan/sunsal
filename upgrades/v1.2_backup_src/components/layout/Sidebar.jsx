import React from "react";
import { X, Trophy, User, Users, Settings, LogOut, ChevronRight } from "lucide-react";

const Sidebar = ({ isOpen, onClose, user, handleLogout }) => {
    return (
        <>
            {/* Backdrop */}
            <div
                className={`fixed inset-0 bg-black/50 z-[100] transition-opacity duration-300 ${isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
                    }`}
                onClick={onClose}
            />

            {/* Sidebar Content */}
            <div
                className={`fixed top-0 left-0 h-full w-[280px] bg-white z-[101] shadow-2xl transition-transform duration-300 ease-out ${isOpen ? "translate-x-0" : "-translate-x-full"
                    } flex flex-col`}
            >
                <div className="p-6 border-b flex justify-between items-center bg-indigo-600 text-white">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                            <Trophy size={20} />
                        </div>
                        <span className="font-bold text-lg">RankEats</span>
                    </div>
                    <button onClick={onClose} className="p-1 hover:bg-white/10 rounded-full">
                        <X size={24} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto py-4">
                    {user && (
                        <div className="px-6 py-4 mb-4 bg-slate-50 border-y border-slate-100 flex items-center gap-3">
                            <img
                                src={user.photoURL || "https://via.placeholder.com/40"}
                                alt="profile"
                                className="w-12 h-12 rounded-full border-2 border-white shadow-sm"
                            />
                            <div>
                                <div className="font-bold text-slate-800">{user.displayName}</div>
                                <div className="text-xs text-slate-500">{user.email}</div>
                            </div>
                        </div>
                    )}

                    <div className="space-y-1 px-3">
                        <SidebarItem icon={<Trophy size={18} />} label="🏆 전국 통합 랭킹" onClick={() => { alert("서비스 준비중입니다."); onClose(); }} />
                        <SidebarItem icon={<Users size={18} />} label="👥 친구 관리" onClick={() => { alert("서비스 준비중입니다."); onClose(); }} />
                        <SidebarItem icon={<User size={18} />} label="👤 마이 페이지" onClick={() => { alert("서비스 준비중입니다."); onClose(); }} />
                        <div className="my-4 border-t border-slate-100 mx-3" />
                        <SidebarItem icon={<Settings size={18} />} label="⚙️ 설정" onClick={() => { alert("서비스 준비중입니다."); onClose(); }} />
                    </div>
                </div>

                {user && (
                    <div className="p-4 border-t border-slate-100">
                        <button
                            onClick={() => {
                                handleLogout();
                                onClose();
                            }}
                            className="w-full flex items-center justify-center gap-2 py-3 text-slate-500 font-medium hover:bg-slate-50 rounded-xl transition-colors"
                        >
                            <LogOut size={18} /> 로그아웃
                        </button>
                    </div>
                )}
            </div>
        </>
    );
};

const SidebarItem = ({ icon, label, onClick }) => (
    <button
        onClick={onClick}
        className="w-full flex items-center justify-between p-3.5 hover:bg-indigo-50 rounded-xl group transition-all"
    >
        <div className="flex items-center gap-3 text-slate-700 font-medium group-hover:text-indigo-600">
            <span className="text-slate-400 group-hover:text-indigo-500">{icon}</span>
            <span className="text-sm">{label}</span>
        </div>
        <ChevronRight size={14} className="text-slate-300 group-hover:text-indigo-400" />
    </button>
);

export default Sidebar;
