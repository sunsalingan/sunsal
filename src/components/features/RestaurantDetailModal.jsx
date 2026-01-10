import React from "react";
import { X, MapPin, Star, User, Heart } from "lucide-react";

/**
 * RestaurantDetailModal
 * Displays details of a selected restaurant, including its category rank, mock hashtags, and reviews.
 * Allows toggling "Wishlist" status.
 */
const RestaurantDetailModal = ({
    restaurant,
    onClose,
    allReviews = [],
    onOpenProfile,
    isWishlisted,
    onToggleWishlist
}) => {
    // Safety check
    if (!restaurant) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-[9999] animate-in fade-in duration-200" style={{ pointerEvents: 'auto' }}>
            <div className="bg-white w-full max-w-md h-[80vh] sm:h-[600px] sm:rounded-2xl rounded-t-3xl shadow-xl flex flex-col overflow-hidden relative">

                {/* Global Close Button for Modal */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 z-[9999] p-2 bg-black/20 text-white rounded-full hover:bg-black/40 backdrop-blur-sm cursor-pointer transition-colors"
                >
                    <X size={20} />
                </button>

                {/* Fixed Header */}
                <div className="relative h-40 bg-indigo-600 shrink-0">
                    <div className="absolute bottom-0 left-0 w-full p-6 text-white bg-gradient-to-t from-black/60 to-transparent">
                        <span className="px-2 py-1 bg-white/20 backdrop-blur-sm rounded text-[10px] font-bold mb-2 inline-block">
                            {restaurant.category}
                        </span>
                        <h2 className="text-2xl font-bold truncate pr-8">{restaurant.name}</h2>
                        <div className="flex items-center gap-1 text-xs opacity-90 mt-1">
                            <MapPin size={12} />
                            <span className="truncate">{restaurant.address || "주소 정보 없음"}</span>
                        </div>
                    </div>
                </div>

                {/* Scrollable Body */}
                <div className="flex-1 overflow-y-auto bg-slate-50 p-4">
                    <div className="flex gap-2 mb-6 overflow-x-auto pb-2 scrollbar-hide shrink-0">
                        {/* Mock Hashtags */}
                        {["분위기좋은", "데이트", "친절한 사장님", "재방문각"].map(
                            (tag, i) => (
                                <span
                                    key={i}
                                    className="px-3 py-1.5 bg-white border border-slate-200 rounded-full text-xs text-slate-600 whitespace-nowrap shadow-sm"
                                >
                                    #{tag}
                                </span>
                            )
                        )}
                    </div>

                    <h3 className="font-bold text-slate-800 mb-3 flex items-center gap-2">
                        <Star size={18} className="text-yellow-400 fill-yellow-400" />
                        친구들의 리얼 리뷰
                    </h3>

                    <div className="space-y-3 pb-20">
                        <ReviewList
                            restaurantName={restaurant.name}
                            allReviews={allReviews}
                            onOpenProfile={onOpenProfile}
                        />
                    </div>
                </div>

                {/* Fixed Footer */}
                <div className="absolute bottom-0 left-0 w-full p-4 border-t bg-white safe-area-bottom z-10">
                    <button
                        onClick={() => onToggleWishlist && onToggleWishlist(restaurant)}
                        className={`w-full py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2 ${isWishlisted
                            ? "bg-pink-50 text-pink-600 border border-pink-200 hover:bg-pink-100"
                            : "bg-indigo-600 text-white hover:bg-indigo-700"
                            }`}
                    >
                        <Heart size={20} className={isWishlisted ? "fill-current" : ""} />
                        {isWishlisted ? "가고싶어요 취소" : "가고싶어요 (+내 리스트)"}
                    </button>
                </div>
            </div >
        </div >
    );
};

const ReviewList = ({ restaurantName, allReviews, onOpenProfile }) => {
    // 1. Filter reviews for this restaurant
    const rawReviews = allReviews.filter(r => r.name === restaurantName);

    // 2. Deduplicate: Keep only the latest review per user
    const uniqueReviewsMap = new Map();
    rawReviews.forEach(r => {
        // If sorting isn't guaranteed, we should check timestamp. 
        // Assuming 'orderBy("timestamp", "desc")' from query, first one is latest.
        // But to be safe, let's compare dates if map already has entry.
        if (!uniqueReviewsMap.has(r.userId)) {
            uniqueReviewsMap.set(r.userId, r);
        } else {
            const existing = uniqueReviewsMap.get(r.userId);
            // If new one is newer (larger timestamp), replace.
            const existingTime = existing.timestamp?.seconds || 0;
            const newTime = r.timestamp?.seconds || 0;
            if (newTime > existingTime) {
                uniqueReviewsMap.set(r.userId, r);
            }
        }
    });

    const reviews = Array.from(uniqueReviewsMap.values());

    if (reviews.length === 0) {
        return <div className="text-center py-6 text-slate-400 text-sm">아직 등록된 리뷰가 없습니다.</div>;
    }

    const formatDate = (ts) => {
        if (!ts) return "";
        const date = ts.toDate ? ts.toDate() : new Date(ts); // Handle Firestore Timestamp or JS Date
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");
        return `${year}.${month}.${day}`;
    };

    return (
        <>
            {reviews.map((review) => (
                <div key={review.id} className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm relative">
                    <div className="flex justify-between items-start mb-2">
                        <div
                            className="flex items-center gap-2 cursor-pointer group"
                            onClick={() => onOpenProfile && onOpenProfile(review.userId)}
                        >
                            <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center overflow-hidden border border-slate-100">
                                {review.userPhoto ? (
                                    <img src={review.userPhoto} alt={review.userName} className="w-full h-full object-cover" />
                                ) : (
                                    <User size={14} className="text-slate-500" />
                                )}
                            </div>
                            <div>
                                <div className="flex items-center gap-2">
                                    <div className="font-bold text-sm text-slate-800 group-hover:text-indigo-600 transition-colors">
                                        {review.userName || "익명 사용자"}
                                    </div>
                                    <div className="flex items-center gap-1 bg-yellow-50 px-1.5 py-0.5 rounded text-yellow-600 font-bold text-[10px]">
                                        <Star size={8} className="fill-yellow-600" /> {review.globalScore}
                                    </div>
                                </div>
                                <div className="text-[10px] text-slate-400 mt-0.5">
                                    {formatDate(review.timestamp)}
                                </div>
                            </div>
                        </div>
                    </div>
                    <p className="text-sm text-slate-600 leading-relaxed pl-10 -mt-2">{review.comment}</p>
                </div>
            ))}
        </>
    );
}

export default RestaurantDetailModal;
