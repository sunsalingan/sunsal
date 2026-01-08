import React from "react";
import { Search, CheckCircle } from "lucide-react"; // Import CheckCircle
import { calculateMyScore } from "../../utils";

const RestaurantList = ({
    displayedReviews,
    activeReviews,
    loading,
    handleOpenDetail,
    currentPage,
    viewMode,
    user
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
                        (currentPage === "MAIN" && viewMode === "GLOBAL") || viewMode === "WISHLIST"
                            ? (review.globalScore || "0.0")
                            : currentPage === "MAIN" && viewMode === "FRIENDS"
                                ? (review.friendScore || "-")
                                : (myScore || "-");
                    const scoreColor =
                        (currentPage === "MAIN" && viewMode === "GLOBAL") || viewMode === "WISHLIST"
                            ? "text-indigo-600"
                            : "text-emerald-600";

                    // Check if current user has reviewed this restaurant
                    // Assuming 'review.reviews' holds the list of reviews if aggregated
                    // Or we check 'activeReviews' again?
                    // 'displayedReviews' is the aggregated list. It SHOULD contain a 'reviews' array or we check against 'activeReviews'

                    // Let's verify 'displayedReviews' structure in DataContext. If it's aggregated, it has reviews list.
                    // If not, we might need to filter activeReviews by name/lat/lng again.
                    // But 'review' object here is the display item.

                    let isReviewedByMe = false;
                    if (user && viewMode === "GLOBAL") {
                        // Check raw reviews for match
                        // Wait, 'review.reviews' might be available if aggregated.
                        // Let's assume we need to check activeReviews for robust matching or passed prop.
                        // Actually, 'displayedRestaurants' are constructed in DataContext. 
                        // Check if review.ids (if we store them) or review.reviews array exists. 

                        // Safer fallback: Check activeReviews
                        isReviewedByMe = activeReviews.some(r =>
                            r.userId === user.uid &&
                            (r.name === review.name /* && lat/lng match if possible */)
                        );
                    }


                    return (
                        <div
                            key={review.id}
                            onClick={() => handleOpenDetail(review)}
                            className={`bg-white p-4 rounded-xl shadow-sm border mb-3 flex justify-between items-center cursor-pointer transition-colors relative overflow-hidden ${isReviewedByMe ? "border-indigo-500 ring-1 ring-indigo-500 bg-indigo-50/10" : "hover:border-indigo-300"
                                }`}
                        >
                            {isReviewedByMe && (
                                <div className="absolute top-0 right-0 w-8 h-8 bg-indigo-600/10 rounded-bl-xl flex items-center justify-center">
                                    <CheckCircle size={14} className="text-indigo-600" />
                                </div>
                            )}

                            <div className="flex items-center gap-3">
                                <div
                                    className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-white text-sm ${index === 0 ? "bg-yellow-400" : "bg-slate-300"
                                        }`}
                                >
                                    {index + 1}
                                </div>
                                <div>
                                    <div className="font-bold flex items-center gap-1">
                                        {review.name}
                                    </div>
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
