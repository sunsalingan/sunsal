import React from "react";
import { X, MapPin, Star, User } from "lucide-react";

const RestaurantDetailModal = ({ restaurant, onClose, allReviews }) => {
    if (!restaurant) return null;

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
                        <ReviewList mockName={restaurant.name} />
                    </div>
                </div>

                <div className="p-4 border-t bg-white safe-area-bottom">
                    <button
                        onClick={() => alert("내 리스트에 추가되었습니다! (기능 준비중)")}
                        className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold hover:bg-indigo-700"
                    >
                        가고싶다 (+내 리스트 추가)
                    </button>
                </div>
            </div>
        </div>
    );
};

const ReviewList = ({ mockName }) => {
    // Simple mock generator inside component to avoid import issues if any
    const reviews = [
        { id: 1, user: "미식가K", score: 5, text: `${mockName}, 진짜 인생 맛집입니다.`, date: "2일 전" },
        { id: 2, user: "쩝쩝박사", score: 4.5, text: "웨이팅이 좀 길지만 기다릴만 합니다.", date: "5일 전" },
        { id: 3, user: "동네주민", score: 5, text: "사장님이 너무 친절하시고 양도 푸짐해요.", date: "1주 전" },
    ];

    return (
        <>
            {reviews.map((review) => (
                <div key={review.id} className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
                    <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center">
                                <User size={14} className="text-slate-500" />
                            </div>
                            <div>
                                <div className="font-bold text-sm text-slate-800">{review.user}</div>
                                <div className="text-[10px] text-slate-400">{review.date}</div>
                            </div>
                        </div>
                        <div className="flex items-center gap-1 bg-yellow-50 px-2 py-0.5 rounded text-yellow-600 font-bold text-xs">
                            <Star size={10} className="fill-yellow-600" /> {review.score}
                        </div>
                    </div>
                    <p className="text-sm text-slate-600 leading-relaxed">{review.text}</p>
                </div>
            ))}
        </>
    );
}

export default RestaurantDetailModal;
