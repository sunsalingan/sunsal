import React, { useState, useEffect } from "react";
import { X } from "lucide-react";

const ProfileEditModal = ({ isOpen, user, onClose, onUpdate }) => {
    const [nickname, setNickname] = useState(user?.nickname || "");
    const [photoURL, setPhotoURL] = useState(user?.photoURL || "");
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (user) {
            setNickname(user.nickname || "");
            setPhotoURL(user.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.uid}`);
        }
    }, [user]);

    const handleRandomizeAvatar = () => {
        const randomSeed = Math.random().toString(36).substring(7);
        setPhotoURL(`https://api.dicebear.com/7.x/avataaars/svg?seed=${randomSeed}`);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await onUpdate(nickname, photoURL);
            onClose();
        } catch (error) {
            alert(error.message);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[80] animate-in fade-in duration-200">
            <div className="bg-white w-full max-w-sm rounded-2xl p-6 relative shadow-xl">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-1 hover:bg-slate-100 rounded-full transition-colors"
                >
                    <X size={20} className="text-slate-500" />
                </button>

                <h2 className="text-xl font-bold mb-6 text-slate-800">프로필 편집</h2>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Avatar Selection */}
                    <div className="flex flex-col items-center gap-3">
                        <div className="w-24 h-24 rounded-full bg-slate-100 overflow-hidden border-2 border-indigo-100 shadow-sm relative group cursor-pointer" onClick={handleRandomizeAvatar}>
                            <img src={photoURL} alt="Avatar" className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <span className="text-white text-xs font-bold">변경</span>
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={handleRandomizeAvatar}
                            className="text-xs text-indigo-600 font-bold bg-indigo-50 px-3 py-1 rounded-full hover:bg-indigo-100 refresh-btn"
                        >
                            🎲 랜덤 프로필 사진
                        </button>
                    </div>

                    {/* Nickname Input Only */}
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1.5">
                            닉네임 (표시용 이름)
                        </label>
                        <input
                            type="text"
                            value={nickname}
                            onChange={(e) => setNickname(e.target.value)}
                            className="w-full p-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-bold text-center text-lg"
                            placeholder="닉네임 (2~10자)"
                            maxLength={10}
                        />
                        <p className="text-xs text-slate-400 mt-2 leading-relaxed text-center">
                            * 닉네임은 <span className="font-bold text-indigo-600">중복 불가</span>하며, <br />실명 데이터는 저장되지 않습니다.
                        </p>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3.5 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all mt-2 shadow-md shadow-indigo-200"
                    >
                        {loading ? (
                            <div className="flex items-center justify-center gap-2">
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                <span>저장 중...</span>
                            </div>
                        ) : "저장하기"}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default ProfileEditModal;
