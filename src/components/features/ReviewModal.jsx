import React, { useState } from "react";
import { X, Check, Search, CreditCard, MapPin, Trash2 } from "lucide-react";
import HierarchicalRankingSelector from "./HierarchicalRankingSelector";

const ReviewModal = ({
    isOpen,
    onClose,
    onSubmit, // Final submit handler with (restaurantData, score) or similar
    // Props for Step 1
    selectedNewPlace,
    newReviewParams,
    setNewReviewParams,
    handleSearchPlace, // logic to open search or just handle input
    editingReview, // [NEW] If not null, we are editing
    // Props for Step 2
    categoryReviews = [], // Restaurants in same category for comparison
    onDelete, // [FIX] Handler for deletion
    onInsert, // Handler for ranking insertion
    // Props for Step 3
    allReviews = [], // All restaurants for final comparison
    expandedFolders = {},
    toggleFolder = () => { },
    mockRestaurantSearch, // function to search
}) => {
    const [step, setStep] = useState(1);
    const [isLocationAuthed, setIsLocationAuthed] = useState(false);
    const [isReceiptAuthed, setIsReceiptAuthed] = useState(false);

    // [NEW] Bounded Ranking State: 0-based index range [min, max) keys in global list
    const [globalBounds, setGlobalBounds] = useState({ min: 0, max: Infinity });

    // [FIX] Reset state when modal opens
    React.useEffect(() => {
        if (isOpen) {
            setStep(1);
            setIsLocationAuthed(false);
            setIsReceiptAuthed(false);
            setGlobalBounds({ min: 0, max: Infinity });
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const handleNext = () => {
        if (step === 1) {
            // If editing, skip auth check if desired, or keep it. user said "existing way is same", so keep auth?
            // "기존의 리뷰작성하는 방식은 그대로지만... 위치인증 영수증인증하면 한줄평에 기존에 적었던게 적혀있고"
            // So auth is still needed.
            if (!isLocationAuthed || !isReceiptAuthed) {
                alert("방문 인증(위치 및 영수증)을 먼저 완료해주세요.");
                return;
            }
            if (!selectedNewPlace || !newReviewParams.text) {
                alert("식당을 선택하고 한줄 평을 입력해주세요.");
                return;
            }
            setStep(2);
        } else if (step === 2) {
            setStep(3);
        } else {
            handleSubmit();
        }
    };

    const handleSubmit = async () => {
        // Fallback user clicked the main CTA. Use current/temp rank.
        if (onSubmit) {
            onSubmit();
        }
    };
    const currentStepTitle =
        step === 1
            ? (editingReview ? "1단계: 리뷰 수정 (인증 및 정보)" : "1단계: 인증 및 정보")
            : step === 2
                ? "2단계: 카테고리 내 비교"
                : "3단계: 전체 랭킹 확정";

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-[10000]">
            <div className="bg-white rounded-2xl w-full max-w-md max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                <div className="px-5 py-4 border-b flex justify-between items-center bg-white sticky top-0 z-10">
                    <h2 className="font-bold text-lg">{currentStepTitle}</h2>
                    <div className="flex gap-2">
                        {editingReview && (
                            <button
                                onClick={() => {
                                    if (window.confirm("정말로 이 리뷰를 삭제하시겠습니까? 복구할 수 없습니다.")) {
                                        if (onDelete) onDelete(editingReview);
                                    }
                                }}
                                className="p-2 rounded-full text-red-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                                title="리뷰 삭제"
                            >
                                <Trash2 size={20} />
                            </button>
                        )}
                        <button
                            onClick={onClose}
                            className="p-1 rounded-full hover:bg-slate-100"
                        >
                            <X size={20} />
                        </button>
                    </div>
                </div>

                <div className="p-5 overflow-y-auto flex-1 bg-slate-50">
                    {step === 1 && (
                        <div className="space-y-6">
                            {editingReview && (
                                <div className="bg-indigo-50 p-3 rounded-lg text-indigo-700 text-sm font-bold border border-indigo-100 flex items-center gap-2">
                                    <Check size={16} />
                                    기존 리뷰를 수정합니다.
                                </div>
                            )}

                            {/* 1. Restaurant Search (First) */}
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-indigo-600 ml-1">
                                    식당 선택
                                </label>
                                {selectedNewPlace ? (
                                    <div className="p-4 bg-white border border-indigo-100 rounded-xl font-bold flex justify-between items-center shadow-sm">
                                        <span className="truncate max-w-[200px]">{selectedNewPlace.name}</span>
                                        <div className="flex gap-2">
                                            <span className="text-xs font-normal text-slate-400 bg-slate-100 px-2 py-1 rounded whitespace-nowrap">
                                                {selectedNewPlace.category}
                                            </span>
                                            {!editingReview && (
                                                <button
                                                    onClick={() => {
                                                        // Allow re-selecting if not editing (or even if editing? maybe restricted for edit)
                                                        setNewReviewParams(prev => ({ ...prev, text: "" })); // optionally clear
                                                        handleSearchPlace();
                                                    }}
                                                    className="text-xs text-slate-400 hover:text-indigo-600 underline"
                                                >
                                                    변경
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ) : (
                                    <button
                                        onClick={handleSearchPlace}
                                        className="w-full p-4 bg-white border border-dashed border-slate-300 rounded-xl text-slate-400 flex items-center justify-center gap-2 hover:bg-slate-50 hover:border-indigo-300 transition-colors"
                                    >
                                        <Search size={16} /> 식당 검색하기
                                    </button>
                                )}
                            </div>

                            {/* 2. Auth Buttons (Dependent on Search) */}
                            <div className={`grid grid-cols-2 gap-3 transition-opacity ${!selectedNewPlace ? "opacity-50 grayscale pointer-events-none" : ""}`}>
                                <button
                                    disabled={!selectedNewPlace}
                                    onClick={() => {
                                        setIsLocationAuthed(true);
                                        alert("위치 인증 완료!");
                                    }}
                                    className={`p-4 rounded-xl flex flex-col items-center justify-center gap-2 transition-all ${isLocationAuthed
                                        ? "bg-green-50 border border-green-200 text-green-700"
                                        : "bg-white border border-slate-200 text-slate-400 hover:border-indigo-300 hover:text-indigo-600"}`}
                                >
                                    <div className={`p-2 rounded-full shadow-sm ${isLocationAuthed ? "bg-white" : "bg-slate-50"}`}>
                                        <MapPin size={20} className={isLocationAuthed ? "text-green-600" : "text-slate-300"} />
                                    </div>
                                    <span className="text-xs font-bold">{isLocationAuthed ? "위치 인증됨" : "위치 인증하기"}</span>
                                </button>
                                <button
                                    disabled={!selectedNewPlace}
                                    onClick={() => {
                                        setIsReceiptAuthed(true);
                                        alert("영수증 OCR 인증 완료!");
                                    }}
                                    className={`p-4 rounded-xl flex flex-col items-center justify-center gap-2 transition-all ${isReceiptAuthed
                                        ? "bg-blue-50 border border-blue-200 text-blue-700"
                                        : "bg-white border border-slate-200 text-slate-400 hover:border-indigo-300 hover:text-indigo-600"}`}
                                >
                                    <div className={`p-2 rounded-full shadow-sm ${isReceiptAuthed ? "bg-white" : "bg-slate-50"}`}>
                                        <CreditCard size={20} className={isReceiptAuthed ? "text-blue-600" : "text-slate-300"} />
                                    </div>
                                    <span className="text-xs font-bold">{isReceiptAuthed ? "영수증 인증됨" : "영수증 인증하기"}</span>
                                </button>
                            </div>

                            <div className="space-y-2">
                                <div className="flex justify-between items-center px-1">
                                    <label className="text-xs font-bold text-indigo-600">
                                        한줄 평 (30자 제한)
                                    </label>
                                    <span className={`text-xs font-medium ${newReviewParams.text.length >= 30 ? "text-red-500" : "text-slate-500"}`}>
                                        {newReviewParams.text.length} / 30
                                    </span>
                                </div>
                                <textarea
                                    className="w-full p-4 bg-white border border-indigo-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 min-h-[80px] resize-none shadow-sm placeholder:text-slate-400 text-sm"
                                    placeholder="핵심만 간결하게! (30자 이내)"
                                    value={newReviewParams.text}
                                    onChange={(e) => {
                                        // Length Limit 30
                                        if (e.target.value.length <= 30) {
                                            setNewReviewParams({ ...newReviewParams, text: e.target.value });
                                        }
                                    }}
                                    maxLength={30}
                                />
                            </div>

                            {/* Score Input Removed (as per user request "When did we decide stars?") */}
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
                                {editingReview && (
                                    <div className="mt-3 text-sm bg-orange-100 p-3 rounded-lg text-orange-900 border-2 border-orange-200 flex items-center justify-center gap-2 shadow-sm animate-pulse">
                                        <span className="text-xl">💡</span>
                                        <div>
                                            기존 순위:
                                            <strong className="text-lg ml-1 text-orange-700">
                                                {(() => {
                                                    const targetKey = `${editingReview.name}-${parseFloat(editingReview.lat).toFixed(4)}-${parseFloat(editingReview.lng).toFixed(4)}`;
                                                    const hasIt = categoryReviews.some(r => {
                                                        const k = `${r.name}-${parseFloat(r.lat).toFixed(4)}-${parseFloat(r.lng).toFixed(4)}`;
                                                        return k === targetKey;
                                                    });

                                                    let sortedList = categoryReviews;
                                                    if (!hasIt) {
                                                        sortedList = [...categoryReviews, editingReview];
                                                    }
                                                    sortedList.sort((a, b) => (a.rankIndex || 0) - (b.rankIndex || 0));

                                                    const myIndex = sortedList.findIndex(r => {
                                                        const k = `${r.name}-${parseFloat(r.lat).toFixed(4)}-${parseFloat(r.lng).toFixed(4)}`;
                                                        return k === targetKey;
                                                    });

                                                    if (myIndex === -1) return "정보 없음";
                                                    return ` ${myIndex + 1}위`;
                                                })()}
                                            </strong>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <button
                                onClick={() => {
                                    // [FIX] BOUNDED LOGIC: Top 1 in Category
                                    let maxLimit = allReviews.length;
                                    // Get sorted category list
                                    const catList = (categoryReviews || []).filter(r => r.id !== editingReview?.id);
                                    catList.sort((a, b) => (a.rankIndex || 0) - (b.rankIndex || 0));

                                    if (catList.length > 0) {
                                        const topCatItem = catList[0];
                                        const globalItem = allReviews.find(r => r.id === topCatItem.id);
                                        // If I am Top 1 in Category, I must be ranked BEFORE the current Top 1 (lower index)
                                        if (globalItem) maxLimit = globalItem.rankIndex;
                                    }
                                    setGlobalBounds({ min: 0, max: maxLimit });
                                    handleNext();
                                }}
                                className="w-full py-3 border-2 border-dashed border-indigo-300 rounded-xl text-indigo-600 bg-indigo-50 hover:bg-indigo-100 transition-all text-sm font-bold mb-4"
                            >
                                ↑ 이 카테고리 1등으로 선정
                            </button>

                            <HierarchicalRankingSelector
                                items={(categoryReviews || []).filter(r => r.id !== editingReview?.id)}
                                onInsert={(targetId, position) => {
                                    // [FIX] BOUNDED LOGIC: Insert After X
                                    const catList = (categoryReviews || []).filter(r => r.id !== editingReview?.id);
                                    catList.sort((a, b) => (a.rankIndex || 0) - (b.rankIndex || 0));

                                    let minGlobal = 0;
                                    let maxGlobal = allReviews.length; // Default to end

                                    const targetIdx = catList.findIndex(r => r.id === targetId);
                                    if (targetIdx !== -1) {
                                        // Lower Bound (Item I am after)
                                        const lowerItem = catList[targetIdx];
                                        const lowerGlobal = allReviews.find(r => r.id === lowerItem.id);
                                        if (lowerGlobal) {
                                            minGlobal = lowerGlobal.rankIndex + 1;
                                        }

                                        // Upper Bound (Next Item in Category)
                                        const upperItem = catList[targetIdx + 1];
                                        if (upperItem) {
                                            const upperGlobal = allReviews.find(r => r.id === upperItem.id);
                                            if (upperGlobal) {
                                                maxGlobal = upperGlobal.rankIndex;
                                            }
                                        }
                                    }

                                    // [FIX] Safety Clamp: prevent min > max (which causes confusing UI)
                                    if (maxGlobal < minGlobal) {
                                        maxGlobal = minGlobal;
                                    }

                                    setGlobalBounds({ min: minGlobal, max: maxGlobal });
                                    handleNext();
                                }}
                                startIndex={0}
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
                                <div className="mt-2 pt-2 border-t border-indigo-200/50 text-xs font-normal text-slate-600">
                                    선택 가능한 랭킹 구간: <span className="font-bold text-indigo-600">
                                        {globalBounds.min >= globalBounds.max
                                            ? `${globalBounds.min + 1}위 (고정)`
                                            : `${globalBounds.min + 1}위 ~ ${globalBounds.max === Infinity ? "끝" : globalBounds.max + "위"}`
                                        }
                                    </span>
                                </div>
                            </div>

                            {/* Top 1 Button - Only show if min is 0 */}
                            {globalBounds.min === 0 && (
                                <button
                                    onClick={() => {
                                        onSubmit(0);
                                    }}
                                    className="w-full py-3 border-2 border-dashed border-indigo-300 rounded-xl text-indigo-600 bg-indigo-50 hover:bg-indigo-100 transition-all text-sm font-bold mb-4"
                                >
                                    ↑ 전체 1등으로 선정
                                </button>
                            )}

                            {/* Tight Bound Fallback: If range is empty (e.g. inserting between 4 and 5 -> Rank 5), show direct confirm */}
                            {globalBounds.min >= globalBounds.max && (
                                <button
                                    onClick={() => onSubmit(globalBounds.min)}
                                    className="w-full py-4 bg-indigo-600 text-white rounded-xl font-bold shadow-lg hover:bg-indigo-700 animate-pulse"
                                >
                                    {globalBounds.min + 1}위로 등록하기 (자동 확정)
                                </button>
                            )}

                            <HierarchicalRankingSelector
                                items={(allReviews || [])
                                    .filter(r => r.id !== editingReview?.id)
                                    .filter(r => (r.rankIndex || 0) >= globalBounds.min && (r.rankIndex || 0) < globalBounds.max)
                                }
                                initialTargetRank={editingReview?.rankIndex}
                                onInsert={(targetId, position) => {
                                    // Find exact target in global list to be safe
                                    const targetItem = allReviews.find(r => r.id === targetId);
                                    if (targetItem) {
                                        // Insert After Target
                                        onSubmit(targetItem.rankIndex + 1);
                                    } else {
                                        onSubmit(globalBounds.min);
                                    }
                                }}
                                startIndex={globalBounds.min}
                            />
                        </div>
                    )}
                </div>

                <div className="p-4 border-t bg-white">
                    <button
                        onClick={handleNext}
                        className="w-full bg-indigo-600 text-white py-4 rounded-xl font-bold text-lg shadow-lg hover:bg-indigo-700 transition-transform active:scale-95 flex items-center justify-center gap-2"
                    >
                        {step === 3 ? (editingReview ? "수정 완료 ✨" : "랭킹 등록 완료 ✨") : `다음: ${step === 1 ? '순위 정하기' : '전체 순위 확인'}`}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ReviewModal;
