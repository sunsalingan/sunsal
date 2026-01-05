import React, { useState } from "react";
import { X, Check, Search, CreditCard, MapPin } from "lucide-react";
import RecursiveRankingGroup from "./RecursiveRankingGroup";

const ReviewModal = ({
    isOpen,
    onClose,
    onSubmit, // Final submit handler with (restaurantData, score) or similar
    // Props for Step 1
    selectedNewPlace,
    newReviewParams,
    setNewReviewParams,
    handleSearchPlace, // logic to open search or just handle input
    // Props for Step 2
    categoryReviews, // Restaurants in same category for comparison
    onInsert, // Handler for ranking insertion
    // Props for Step 3
    allReviews, // All restaurants for final comparison
    expandedFolders,
    toggleFolder,
    mockRestaurantSearch, // function to search
}) => {
    const [step, setStep] = useState(1);
    const [localSearchTerm, setLocalSearchTerm] = useState("");
    const [searchResults, setSearchResults] = useState([]);

    if (!isOpen) return null;

    const handleNext = () => {
        if (step === 1) {
            if (!selectedNewPlace || !newReviewParams.text) {
                alert("식당을 선택하고 한줄 평을 입력해주세요.");
                return;
            }
            setStep(2);
        } else if (step === 2) {
            setStep(3);
        } else {
            // Final submit
            onSubmit();
        }
    };

    const currentStepTitle =
        step === 1
            ? "1단계: 인증 및 정보"
            : step === 2
                ? "2단계: 카테고리 내 비교"
                : "3단계: 전체 랭킹 확정";

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl w-full max-w-md max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                <div className="px-5 py-4 border-b flex justify-between items-center bg-white sticky top-0 z-10">
                    <h2 className="font-bold text-lg">{currentStepTitle}</h2>
                    <button
                        onClick={onClose}
                        className="p-1 rounded-full hover:bg-slate-100"
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className="p-5 overflow-y-auto flex-1 bg-slate-50">
                    {step === 1 && (
                        <div className="space-y-6">
                            <div className="grid grid-cols-2 gap-3">
                                <div className="border border-green-200 bg-green-50 p-4 rounded-xl flex flex-col items-center justify-center gap-2 text-green-700">
                                    <div className="p-2 bg-white rounded-full shadow-sm">
                                        <Check size={20} className="text-green-600" />
                                    </div>
                                    <span className="text-xs font-bold">위치 인증됨</span>
                                </div>
                                <div className="border border-blue-200 bg-blue-50 p-4 rounded-xl flex flex-col items-center justify-center gap-2 text-blue-700">
                                    <div className="p-2 bg-white rounded-full shadow-sm">
                                        <Check size={20} className="text-blue-600" />
                                    </div>
                                    <span className="text-xs font-bold">영수증 인증됨</span>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold text-indigo-600 ml-1">
                                    인식된 식당
                                </label>
                                {selectedNewPlace ? (
                                    <div className="p-4 bg-white border border-indigo-100 rounded-xl font-bold flex justify-between items-center shadow-sm">
                                        {selectedNewPlace.name}
                                        <span className="text-xs font-normal text-slate-400 bg-slate-100 px-2 py-1 rounded">
                                            {selectedNewPlace.category}
                                        </span>
                                    </div>
                                ) : (
                                    <button
                                        onClick={handleSearchPlace} // Call parent's search opener
                                        className="w-full p-4 bg-white border border-dashed border-slate-300 rounded-xl text-slate-400 flex items-center justify-center gap-2 hover:bg-slate-50 hover:border-indigo-300 transition-colors"
                                    >
                                        <Search size={16} /> 식당 검색하기
                                    </button>
                                )}
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold text-indigo-600 ml-1">
                                    한줄 평
                                </label>
                                <textarea
                                    className="w-full p-4 bg-white border border-indigo-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 min-h-[100px] resize-none shadow-sm placeholder:text-slate-300"
                                    placeholder="어떤 점이 좋았나요?"
                                    value={newReviewParams.text}
                                    onChange={(e) =>
                                        setNewReviewParams({ ...newReviewParams, text: e.target.value })
                                    }
                                />
                            </div>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="space-y-4">
                            <div className="bg-amber-50 p-4 rounded-xl border border-amber-100 text-sm text-amber-800 font-bold mb-4 animate-pulse">
                                📂 같은 종류끼리 먼저 비교해요
                                <div className="font-normal mt-1 opacity-80 text-xs">
                                    {selectedNewPlace?.name} ({selectedNewPlace?.category})과 같은
                                    카테고리 식당들입니다. 어디쯤 위치하나요?
                                </div>
                            </div>

                            <button
                                onClick={() => {
                                    // Logic: Insert at Top -> Trigger handler -> Auto next step?
                                    // For prototype, let's just properly call onInsert then next.
                                    onInsert("TOP", "TOP");
                                    handleNext(); // Auto advance for better UX
                                }}
                                className="w-full py-3 border-2 border-dashed border-indigo-300 rounded-xl text-indigo-600 bg-indigo-50 hover:bg-indigo-100 transition-all text-sm font-bold mb-4"
                            >
                                ↑ 이 카테고리 1등으로 선정
                            </button>

                            <RecursiveRankingGroup
                                items={categoryReviews}
                                onInsert={(targetId, position) => {
                                    onInsert(targetId, position);
                                    handleNext();
                                }}
                                startIndex={0}
                                expandedFolders={expandedFolders}
                                toggleFolder={toggleFolder}
                            />
                        </div>
                    )}

                    {step === 3 && (
                        <div className="space-y-4">
                            <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100 text-sm text-indigo-800 font-bold mb-4">
                                👑 전체 랭킹에서의 위치는?
                                <div className="font-normal mt-1 opacity-80 text-xs">
                                    다른 종류의 식당들과 비교해보세요.
                                </div>
                            </div>
                            <button
                                onClick={() => {
                                    onInsert("TOP", "TOP");
                                    handleNext();
                                }}
                                className="w-full py-3 border-2 border-dashed border-indigo-300 rounded-xl text-indigo-600 bg-indigo-50 hover:bg-indigo-100 transition-all text-sm font-bold mb-4"
                            >
                                ↑ 전체 1등으로 선정
                            </button>
                            <RecursiveRankingGroup
                                items={allReviews}
                                onInsert={(targetId, position) => {
                                    onInsert(targetId, position);
                                    handleNext();
                                }}
                                startIndex={0}
                                showTotalRank={true}
                                allReviews={allReviews}
                                expandedFolders={expandedFolders}
                                toggleFolder={toggleFolder}
                            />
                        </div>
                    )}
                </div>

                <div className="p-4 border-t bg-white">
                    <button
                        onClick={handleNext}
                        className="w-full bg-indigo-600 text-white py-4 rounded-xl font-bold text-lg shadow-lg hover:bg-indigo-700 transition-transform active:scale-95 flex items-center justify-center gap-2"
                    >
                        {step === 3 ? "랭킹 등록 완료 ✨" : `다음: ${step === 1 ? '순위 정하기' : '전체 순위 확인'}`}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ReviewModal;
