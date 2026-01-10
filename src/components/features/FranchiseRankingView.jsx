import React from "react";
import { ChevronRight, ArrowLeft, Star, MapPin } from "lucide-react";
import { useData } from "../../contexts/DataContext";

const FranchiseRankingView = ({ handleOpenDetail }) => {
    const { franchiseStats, selectedFranchise, setSelectedFranchise, setViewMode } = useData();

    // 1. Level 2: Branch List (Specific Brand)
    if (selectedFranchise) {
        return (
            <div className="p-4 space-y-4">
                <button
                    onClick={() => setSelectedFranchise(null)}
                    className="flex items-center gap-1 text-sm font-bold text-slate-500 hover:text-indigo-600 mb-2"
                >
                    <ArrowLeft size={16} /> 전체 브랜드 보기
                </button>

                <div className="bg-indigo-50 p-4 rounded-xl mb-4">
                    <h2 className="text-xl font-bold text-indigo-900 mb-1">{selectedFranchise.brand}</h2>
                    <div className="flex items-center gap-2 text-sm text-indigo-700">
                        <span className="font-bold">Avg {selectedFranchise.avgScore}</span>
                        <span>•</span>
                        <span>{selectedFranchise.count}개 지점</span>
                    </div>
                </div>

                <div className="space-y-3">
                    {selectedFranchise.branches
                        .sort((a, b) => parseFloat(b.displayScore) - parseFloat(a.displayScore))
                        .map((branch, idx) => (
                            <div
                                key={branch.id}
                                onClick={() => handleOpenDetail(branch)}
                                className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm hover:shadow-md transition-all cursor-pointer flex justify-between items-center"
                            >
                                <div className="flex items-center gap-3">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-white text-sm ${idx === 0 ? "bg-yellow-400" :
                                            idx === 1 ? "bg-slate-400" :
                                                idx === 2 ? "bg-orange-400" : "bg-slate-200 text-slate-500"
                                        }`}>
                                        {idx + 1}
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-slate-800">{branch.name}</h3>
                                        <div className="flex items-center gap-1 text-xs text-slate-500 mt-1">
                                            <MapPin size={12} /> {branch.location || "위치 정보 없음"}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-1">
                                    <Star size={14} className="fill-yellow-400 text-yellow-400" />
                                    <span className="font-bold text-slate-800">{branch.displayScore}</span>
                                </div>
                            </div>
                        ))}
                </div>
            </div>
        );
    }

    // 2. Level 1: Brand List (All Franchises)
    return (
        <div className="p-4 space-y-4">
            <h2 className="text-lg font-bold text-slate-800 mb-2">🏢 프랜차이즈 랭킹</h2>
            <p className="text-xs text-slate-500 mb-4">지점이 2개 이상인 브랜드의 평균 평점 순위입니다.</p>

            {franchiseStats.length === 0 ? (
                <div className="text-center py-10 text-slate-400">
                    집계된 프랜차이즈 데이터가 없습니다.<br />
                    (데이터 리셋으로 테스트 데이터를 생성해보세요)
                </div>
            ) : (
                franchiseStats.map((brand, idx) => (
                    <div
                        key={brand.brand}
                        onClick={() => setSelectedFranchise(brand)}
                        className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm hover:ring-2 hover:ring-indigo-500 transition-all cursor-pointer relative overflow-hidden"
                    >
                        {/* Progress Bar Background */}
                        <div
                            className="absolute left-0 bottom-0 h-1 bg-indigo-500/20"
                            style={{ width: `${(parseFloat(brand.avgScore) / 10) * 100}%` }}
                        />

                        <div className="flex justify-between items-center z-10 relative">
                            <div className="flex items-center gap-3">
                                <div className="text-lg font-black text-indigo-900 w-6">{idx + 1}</div>
                                <div>
                                    <h3 className="font-bold text-slate-800">{brand.brand}</h3>
                                    <div className="text-xs text-slate-500">{brand.count}개 지점</div>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="text-right">
                                    <div className="text-xs text-slate-400">평균</div>
                                    <div className="font-bold text-lg text-indigo-600">{brand.avgScore}</div>
                                </div>
                                <ChevronRight size={18} className="text-slate-300" />
                            </div>
                        </div>
                    </div>
                ))
            )}
        </div>
    );
};

export default FranchiseRankingView;
