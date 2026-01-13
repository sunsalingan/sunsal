import React, { useState, useEffect } from "react";
import { CornerDownRight, ChevronLeft } from "lucide-react";
import { useData } from "../../contexts/DataContext";

const HierarchicalRankingSelector = ({
    items = [],
    onInsert,
    startIndex = 0,
    initialTargetRank = null // [NEW] Optional: Auto-focus range containing this rank (0-based index in 'items')
}) => {
    const { rankingInterval } = useData();
    const [step, setStep] = useState(1);
    const [selectedRange, setSelectedRange] = useState(null);

    // [FIX] Initialize or Reset logic
    useEffect(() => {
        // Validation: items change
        if (initialTargetRank !== null && initialTargetRank !== undefined && items.length > 0) {
            // Auto-focus logic
            const groupIndex = Math.floor(initialTargetRank / rankingInterval);
            const groupStart = groupIndex * rankingInterval;
            if (groupStart < items.length) {
                setSelectedRange({
                    items: items.slice(groupStart, groupStart + rankingInterval),
                    startIndex: startIndex + groupStart
                });
                setStep(2);
                return;
            }
        }
        // Default reset
        setStep(1);
        setSelectedRange(null);
    }, [items.length, rankingInterval, initialTargetRank]);

    // --- Threshold Check ---
    // If items are small enough, just show list.
    // Threshold: Let's use rankingInterval * 2. 
    // e.g. if interval is 5, threshold is 10. If 11 items, we group.
    const isSimpleMode = items.length <= (rankingInterval * 2);

    if (!items || items.length === 0) {
        return <div className="p-4 text-center text-slate-400 text-xs">비교할 리뷰가 없습니다. 1등으로 등록해보세요!</div>;
    }

    // --- Simple List Renderer (Reused for both Simple Mode & Step 2) ---
    const renderSimpleList = (listItems, baseIndex) => (
        <div className="flex flex-col gap-4 border-l-2 border-slate-100 pl-4 ml-2 animate-in fade-in duration-300">
            {listItems.map((review, idx) => {
                const currentRank = baseIndex + idx + 1;
                return (
                    <div key={review.id} className="relative">
                        {/* Item Card */}
                        <div className="bg-white p-3 rounded-xl shadow-sm border border-slate-200 flex justify-between items-center z-10 relative">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-500 text-sm">
                                    {currentRank}위
                                </div>
                                <div className="overflow-hidden">
                                    <div className="font-bold text-slate-800 truncate">{review.name}</div>
                                    <div className="text-xs text-slate-400 truncate">
                                        {review.category} · {review.location ? review.location.split(" ")[1] : ""}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Insert Buttons (Between Items) */}
                        {/* 1. Above First Item (Only if it's the very first of the rendered list? 
                            Actually, 'onInsert' usually handles "Insert BEFORE X". 
                            In the provided UI prototype, we had buttons ABOVE and BELOW.
                            But standard logic is "Insert After". 
                            Let's keep "Insert Here" buttons consistent. 
                            The prototype placed buttons in gaps.
                         */}

                        {/* Button: Insert AFTER this item */}
                        {/* If this is the start of a range, we might also want 'Insert Before' 
                            But usually 'Insert After N' covers 'Before N+1'.
                            Except for 1st place. 
                            
                            In 'ReviewModal', we used to have "Top 1" button separately.
                            Here, let's just Provide "Insert Next" buttons.
                         */}

                        <button
                            onClick={() => onInsert(review.id, "AFTER")}
                            className="w-full mt-2 py-2 border-2 border-dashed border-indigo-100 rounded-xl text-indigo-400 hover:bg-indigo-50 hover:border-indigo-400 hover:text-indigo-600 transition-all text-xs font-medium flex items-center justify-center gap-1"
                        >
                            <CornerDownRight size={14} />
                            {currentRank}위와 {currentRank + 1}위 사이에 등록
                        </button>
                    </div>
                );
            })}
        </div>
    );

    // --- Simple Mode ---
    if (isSimpleMode) {
        return renderSimpleList(items, startIndex);
    }

    // --- Hierarchy Mode ---

    // Step 1: Ladder View (Anchors)
    if (step === 1) {
        // Group items
        const groups = [];
        for (let i = 0; i < items.length; i += rankingInterval) {
            groups.push(items.slice(i, i + rankingInterval));
        }

        return (
            <div className="space-y-4 animate-in slide-in-from-right duration-300">
                <div className="mb-2 p-2 bg-indigo-50 rounded-lg text-xs text-indigo-700 font-bold text-center">
                    식당이 많아 구간을 먼저 선택합니다. ({rankingInterval}개 단위)
                </div>

                {groups.map((group, gIndex) => {
                    const topItem = group[0]; // Anchor
                    const topRank = startIndex + (gIndex * rankingInterval) + 1;

                    const nextGroup = groups[gIndex + 1];
                    const nextItem = nextGroup ? nextGroup[0] : null;

                    return (
                        <React.Fragment key={gIndex}>
                            {/* Anchor Card */}
                            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4 relative">
                                <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-black text-lg shrink-0">
                                    {topRank}
                                </div>
                                <div className="overflow-hidden">
                                    <h3 className="font-bold text-lg text-slate-800 truncate">{topItem.name}</h3>
                                    <p className="text-xs text-slate-400">대표 기준점 (Anchor)</p>
                                </div>
                            </div>

                            {/* Range Selection Button */}
                            <button
                                onClick={() => {
                                    setSelectedRange({
                                        items: group,
                                        startIndex: startIndex + (gIndex * rankingInterval)
                                    });
                                    setStep(2);
                                }}
                                className="w-full py-4 border-2 border-dashed border-slate-300 rounded-xl flex flex-col items-center justify-center gap-1 hover:bg-indigo-50 hover:border-indigo-400 transition-all group"
                            >
                                <div className="text-slate-400 group-hover:text-indigo-500 font-bold text-sm">
                                    {nextItem
                                        ? `⬇️ "${topItem.name}" 와(과) "${nextItem.name}" 사이 순위`
                                        : `⬇️ "${topItem.name}" 보다 아래 순위`
                                    }
                                </div>
                                <div className="text-xs text-slate-300 group-hover:text-indigo-400">
                                    {topRank}위 ~ {topRank + group.length - 1}위 구간 선택
                                </div>
                            </button>
                        </React.Fragment>
                    );
                })}
            </div>
        );
    }

    // Step 2: Detail View
    if (step === 2 && selectedRange) {
        return (
            <div className="space-y-4 animate-in slide-in-from-right duration-300">
                <button
                    onClick={() => {
                        setStep(1);
                        setSelectedRange(null);
                    }}
                    className="flex items-center gap-1 text-sm font-bold text-slate-500 hover:text-indigo-600 mb-2"
                >
                    <ChevronLeft size={16} /> 구간 다시 선택하기
                </button>

                <div className="bg-indigo-50 p-3 rounded-xl border border-indigo-100 text-center mb-4">
                    <span className="text-indigo-600 font-bold text-sm">
                        선택된 구간: {selectedRange.startIndex + 1}위 ~ {selectedRange.startIndex + selectedRange.items.length}위
                    </span>
                </div>

                {renderSimpleList(selectedRange.items, selectedRange.startIndex)}
            </div>
        );
    }

    return null;
};

export default HierarchicalRankingSelector;
