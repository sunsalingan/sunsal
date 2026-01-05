import React from "react";
import { Search } from "lucide-react";
import { calculateMyScore } from "../../utils";

const RestaurantList = ({
    displayedReviews,
    activeReviews,
    loading,
    handleOpenDetail,
    currentPage,
    viewMode,
}) => {
    return (
        <main className="flex-1 overflow-y-auto px-4 py-6 bg-slate-50">
            {loading ? (
                <div className="text-center py-10 text-slate-400">
                    데이터 로딩 중...
                </div>
            ) : displayedReviews.length > 0 ? (
                displayedReviews.map((review, index) => {
                    const myRankIndex = activeReviews.findIndex(
                        (r) => r.id === review.id
                    );
                    const myScore = calculateMyScore(myRankIndex, activeReviews.length);
                    const displayScore =
                        currentPage === "MAIN" && viewMode === "GLOBAL"
                            ? (review.globalScore || "0.0")
                            : currentPage === "MAIN" && viewMode === "FRIENDS"
                                ? (review.friendScore || "-")
                                : (myScore || "-");
                    const scoreColor =
                        currentPage === "MAIN" && viewMode === "GLOBAL"
                            ? "text-indigo-600"
                            : "text-emerald-600";
                    return (
                        <div
                            key={review.id}
                            onClick={() => handleOpenDetail(review)}
                            className="bg-white p-4 rounded-xl shadow-sm border mb-3 flex justify-between items-center cursor-pointer hover:border-indigo-300 transition-colors"
                        >
                            <div className="flex items-center gap-3">
                                <div
                                    className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-white text-sm ${index === 0 ? "bg-yellow-400" : "bg-slate-300"
                                        }`}
                                >
                                    {index + 1}
                                </div>
                                <div>
                                    <div className="font-bold">{review.name}</div>
                                    <div className="text-xs text-slate-500">
                                        {review.location ? review.location.split(" ")[1] : ""}
                                    </div>
                                </div>
                            </div>
                            <div className="text-right">
                                <span
                                    className={`block text-xl font-black leading-none ${scoreColor}`}
                                >
                                    {displayScore}점
                                </span>
                            </div>
                        </div>
                    );
                })
            ) : (
                <div className="py-16 text-center border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/50">
                    <Search className="mx-auto text-slate-300 mb-2" size={32} />
                    <p className="text-slate-500 font-bold text-sm">
                        등록된 맛집이 없습니다.
                        <br />첫 번째 맛집을 등록해보세요!
                    </p>
                </div>
            )}
        </main>
    );
};

export default RestaurantList;
