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
    editingReview, // [NEW] If not null, we are editing
    // Props for Step 2
    categoryReviews = [], // Restaurants in same category for comparison
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

    // [FIX] Reset state when modal opens
    React.useEffect(() => {
        if (isOpen) {
            setStep(1);
            setIsLocationAuthed(false);
            setIsReceiptAuthed(false);
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
        // Fallback: Default to Top 1 (Index 0) if bottom button is clicked without specific selection
        if (onSubmit) {
            onSubmit(0);
        }
    };

    const currentStepTitle =
        step === 1
            ? (editingReview ? "1단계: 리뷰 수정 (인증 및 정보)" : "1단계: 인증 및 정보")
            : step === 2
                ? "2단계: 카테고리 내 비교"
                : "3단계: 전체 랭킹 확정";

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-[9999]">
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
                                    // Step 2 is just for show/mental model, doesn't set global rank directly yet.
                                    // Or maybe we want to use this input? 
                                    // For now, let's proceed to Step 3 for Global Ranking which is what really matters.
                                    handleNext();
                                }}
                                className="w-full py-3 border-2 border-dashed border-indigo-300 rounded-xl text-indigo-600 bg-indigo-50 hover:bg-indigo-100 transition-all text-sm font-bold mb-4"
                            >
                                ↑ 이 카테고리 1등으로 선정
                            </button>

                            <RecursiveRankingGroup
                                items={(categoryReviews || []).filter(r => r.id !== editingReview?.id)}
                                onInsert={(targetId, position) => {
                                    // Just proceed to Step 3
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
                                {editingReview && (
                                    <div className="mt-2 text-xs bg-white/50 p-2 rounded text-indigo-900 border border-indigo-200">
                                        💡 기존 위치:
                                        <strong>
                                            {(() => {
                                                const targetKey = `${editingReview.name}-${parseFloat(editingReview.lat).toFixed(4)}-${parseFloat(editingReview.lng).toFixed(4)}`;

                                                const hasIt = allReviews.some(r => {
                                                    const k = `${r.name}-${parseFloat(r.lat).toFixed(4)}-${parseFloat(r.lng).toFixed(4)}`;
                                                    return k === targetKey;
                                                });

                                                let sortedList = allReviews;
                                                if (!hasIt) {
                                                    sortedList = [...allReviews, editingReview];
                                                }
                                                sortedList.sort((a, b) => (a.rankIndex || 0) - (b.rankIndex || 0));

                                                const myIndex = sortedList.findIndex(r => {
                                                    const k = `${r.name}-${parseFloat(r.lat).toFixed(4)}-${parseFloat(r.lng).toFixed(4)}`;
                                                    return k === targetKey;
                                                });

                                                if (myIndex === -1) return "정보 없음";
                                                return ` ${myIndex + 1}번째 가고 싶은 집`;
                                            })()}
                                        </strong>
                                    </div>
                                )}
                            </div>
                            <button
                                onClick={() => {
                                    // Calculate Rank: TOP (0)
                                    const rankIndex = 0;
                                    onSubmit(rankIndex);
                                }}
                                className="w-full py-3 border-2 border-dashed border-indigo-300 rounded-xl text-indigo-600 bg-indigo-50 hover:bg-indigo-100 transition-all text-sm font-bold mb-4"
                            >
                                ↑ 전체 1등으로 선정
                            </button>
                            <RecursiveRankingGroup
                                items={(allReviews || []).filter(r => r.id !== editingReview?.id)} // Exclude self
                                onInsert={(targetId, position) => {
                                    // Calculate Rank LOCALLY to avoid async state issues
                                    let rankIndex = 0;
                                    const targetIdx = allReviews.findIndex(r => r.id === targetId);
                                    if (targetIdx !== -1) {
                                        rankIndex = position === "BEFORE" ? targetIdx : targetIdx + 1;
                                    }
                                    onSubmit(rankIndex);
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
                        {step === 3 ? (editingReview ? "수정 완료 ✨" : "랭킹 등록 완료 ✨") : `다음: ${step === 1 ? '순위 정하기' : '전체 순위 확인'}`}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ReviewModal;
