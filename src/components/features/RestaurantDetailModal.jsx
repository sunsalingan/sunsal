import React from "react";
import { X, MapPin, Star, User, Heart } from "lucide-react";

const RestaurantDetailModal = ({
    restaurant,
    onClose,
    user,
    allReviews = [],
    onOpenReview,
    onToggleWishlist,
    isWishlisted
}) => {
    // Safety check - if no restaurant, don't render anything that could block clicks
    if (!restaurant) return null;

    // Calculate score
    const score = restaurant.globalScore || (Math.random() * 1.9 + 8.1).toFixed(1);
    // Find reviews for this restaurant
    // For now we just show a dummy list or filter from allReviews if structured that way.
    // In the original App.jsx `handleOpenDetail` just set `selectedRestaurant`.
    // The logic for displaying reviews was inside the modal JSX in App.jsx.
    // We need to replicate that logic.

    // Actually, we can generate mock reviews here or pass them.
    // The original App.jsx used `generateMockReviews(restaurant.name)`.
    // I should import that util.

    // NOTE: I cannot import from `../../data/mock` inside this artifact block without validation,
    // but I just created it.

    // Since I can't easily dynamically import inside the component without the file existing securely?
    // I'll import it.

    return (
        <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-[9999] animate-in fade-in duration-200" style={{ pointerEvents: 'auto' }}>
            <div className="bg-white w-full max-w-md h-[80vh] sm:h-auto sm:rounded-2xl rounded-t-3xl shadow-xl flex flex-col overflow-hidden relative">
                {/* Global Close Button for Modal */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 z-[9999] p-2 bg-black/20 text-white rounded-full hover:bg-black/40 backdrop-blur-sm cursor-pointer transition-colors"
                >
                    <X size={20} />
                </button>

                <div className="relative h-40 bg-indigo-600 shrink-0">
                    <div className="absolute bottom-0 left-0 w-full p-6 text-white bg-gradient-to-t from-black/60 to-transparent">
                        <span className="px-2 py-1 bg-white/20 backdrop-blur-sm rounded text-[10px] font-bold mb-2 inline-block">
                            {restaurant.category}
                        </span>
                        <h2 className="text-2xl font-bold">{restaurant.name}</h2>
                        <div className="flex items-center gap-1 text-xs opacity-90 mt-1">
                            <MapPin size={12} />
                            {restaurant.address || "주소 정보 없음"}
                        </div>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto bg-slate-50 p-4">
                    <div className="flex gap-2 mb-6 overflow-x-auto pb-2 scrollbar-hide">
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

                    <div className="space-y-3">
                        {/* We need to use `generateMockReviews`, but I'll implement a simple version or expect props. 
                 Ideally, I should import it. */}
                        <ReviewList
                            restaurantName={restaurant.name}
                            allReviews={allReviews}
                            onOpenProfile={onOpenProfile}
                        />
                    </div>
                </div>

                <div className="p-4 border-t bg-white safe-area-bottom flex gap-2">
                    <button
                        onClick={onToggleWishlist}
                        className={`flex-1 py-3 rounded-xl font-bold transition-all active:scale-95 flex items-center justify-center gap-2 ${isWishlisted
                            ? "bg-slate-100 text-slate-500 hover:bg-slate-200"
                            : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                            }`}
                    >
                        <Heart size={20} className={isWishlisted ? "fill-slate-500" : "text-slate-400"} />
                        {isWishlisted ? "제거" : "찜하기"}
                    </button>
                    <button
                        onClick={onOpenReview}
                        className="flex-[2] py-3 bg-indigo-600 text-white rounded-xl font-bold shadow-lg shadow-indigo-200 hover:bg-indigo-700 active:scale-95 flex items-center justify-center gap-2"
                    >
                        <Star size={18} className="fill-white/20" />
                        리뷰 쓰기
                    </button>
                </div>
            </div>
        </div>
    );
};

const ReviewList = ({ restaurantName, allReviews, onOpenProfile }) => {
    // Filter reviews for this restaurant
    const reviews = allReviews.filter(r => r.name === restaurantName);

    if (reviews.length === 0) {
        return <div className="text-center py-6 text-slate-400 text-sm">아직 등록된 리뷰가 없습니다.</div>;
    }

    return (
        <>
            {reviews.map((review) => (
                <div key={review.id} className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
                    <div className="flex justify-between items-start mb-2">
                        <div
                            className="flex items-center gap-2 cursor-pointer group"
                            onClick={() => onOpenProfile && onOpenProfile(review.userId)}
                        >
                            <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center overflow-hidden">
                                {review.userPhoto ? (
                                    <img src={review.userPhoto} alt={review.userName} className="w-full h-full object-cover" />
                                ) : (
                                    <User size={14} className="text-slate-500" />
                                )}
                            </div>
                            <div>
                                <div className="font-bold text-sm text-slate-800 group-hover:text-indigo-600 transition-colors">
                                    {review.userName || "익명 사용자"}
                                </div>
                                <div className="text-[10px] text-slate-400">
                                    {review.timestamp?.toDate ? new Date(review.timestamp.toDate()).toLocaleDateString() : "최근"}
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-1 bg-yellow-50 px-2 py-0.5 rounded text-yellow-600 font-bold text-xs">
                            <Star size={10} className="fill-yellow-600" /> {review.globalScore}
                        </div>
                    </div>
                    <p className="text-sm text-slate-600 leading-relaxed">{review.comment}</p>
                </div>
            ))}
        </>
    );
}

export default RestaurantDetailModal;
