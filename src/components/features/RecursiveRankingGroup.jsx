import React from "react";
import { Folder, FolderOpen, ChevronRight, ChevronDown, CornerDownRight } from "lucide-react";

const RecursiveRankingGroup = ({
    items = [],
    onInsert,
    startIndex,
    showTotalRank = false,
    expandedFolders,
    toggleFolder,
    allReviews,
    readOnly = false,
    onOpenDetail,
}) => {
    const folderSize = 4;
    // Safety check to prevent white screen crashes
    if (!items || !Array.isArray(items) || items.length === 0) return null;

    if (items.length <= folderSize) {
        return (
            <div className="flex flex-col gap-2 border-l-2 border-slate-100 pl-2 ml-1">
                {items.map((review, idx) => {
                    const actualRank = startIndex + idx + 1;
                    const totalRank =
                        showTotalRank && allReviews
                            ? allReviews.findIndex((r) => r.id === review.id) + 1
                            : null;

                    return (
                        <React.Fragment key={review.id}>
                            <div
                                className={`opacity-80 bg-slate-50 p-3 rounded-lg flex justify-between items-center text-sm border border-slate-200 ${readOnly ? "cursor-pointer hover:bg-slate-100" : ""
                                    }`}
                                onClick={(e) => {
                                    if (readOnly && onOpenDetail) {
                                        e.stopPropagation();
                                        onOpenDetail(review);
                                    }
                                }}
                            >
                                <div className="flex items-center gap-2">
                                    <span className="font-bold w-12 text-center text-indigo-600 bg-indigo-50 rounded px-1 text-xs whitespace-nowrap">
                                        {showTotalRank ? `전체${totalRank}위` : `${actualRank}위`}
                                    </span>
                                    <div className="flex flex-col overflow-hidden">
                                        <span className="font-bold text-slate-700 truncate">
                                            {review.name}
                                        </span>
                                        <span className="text-[10px] text-slate-400 truncate">
                                            {review.category} ·{" "}
                                            {review.location ? review.location.split(" ")[1] : ""}
                                        </span>
                                    </div>
                                </div>
                            </div>
                            {!readOnly && (
                                <button
                                    onClick={() => {
                                        if (onInsert) onInsert(review.id, "AFTER");
                                    }}
                                    className="w-full py-2 border-2 border-dashed border-indigo-100 rounded-xl text-indigo-400 hover:bg-indigo-50 hover:border-indigo-400 hover:text-indigo-600 transition-all text-xs font-medium flex items-center justify-center gap-1"
                                >
                                    <CornerDownRight size={14} /> 여기(다음)에 끼워넣기
                                </button>
                            )}
                        </React.Fragment>
                    );
                })}
            </div>
        );
    }

    const chunks = [];
    for (let i = 0; i < items.length; i += folderSize) {
        chunks.push(items.slice(i, i + folderSize));
    }

    return (
        <div className="space-y-3">
            {chunks.map((chunk, chunkIndex) => {
                const chunkStartIndex = startIndex + chunkIndex * folderSize;
                const chunkEndIndex = chunkStartIndex + chunk.length;
                const folderId = `group-${chunkStartIndex}-${chunkEndIndex}-${items[0].id}-${readOnly}`;
                const isOpen = expandedFolders[folderId];
                const lastItem = chunk[chunk.length - 1];

                return (
                    <div
                        key={folderId}
                        className={`border rounded-xl overflow-hidden bg-white transition-all ${isOpen ? "border-indigo-300 shadow-md" : "border-slate-200"
                            }`}
                    >
                        <button
                            onClick={() => toggleFolder(folderId)}
                            className={`w-full flex flex-col p-3 text-left transition-colors ${isOpen ? "bg-indigo-50" : "bg-white hover:bg-slate-50"
                                }`}
                        >
                            <div className="flex items-center justify-between w-full mb-1">
                                <div className="flex items-center gap-2 font-bold text-slate-700">
                                    {isOpen ? (
                                        <FolderOpen size={18} className="text-amber-500" />
                                    ) : (
                                        <Folder size={18} className="text-amber-500" />
                                    )}
                                    <span className="text-sm">
                                        {showTotalRank
                                            ? "순위 그룹"
                                            : `${chunkStartIndex + 1}위 ~ ${chunkEndIndex}위 그룹`}
                                    </span>
                                </div>
                                {isOpen ? (
                                    <ChevronDown size={16} className="text-slate-400" />
                                ) : (
                                    <ChevronRight size={16} className="text-slate-400" />
                                )}
                            </div>
                            {!isOpen && lastItem && !readOnly && (
                                <div className="text-xs text-slate-500 pl-7 flex items-center gap-1 truncate">
                                    <span className="bg-slate-100 px-1.5 py-0.5 rounded text-[10px] font-bold text-slate-600 whitespace-nowrap">
                                        기준
                                    </span>
                                    <span className="truncate">
                                        {lastItem.name} 보다 맛있나요?
                                    </span>
                                </div>
                            )}
                        </button>
                        {isOpen && (
                            <div className="p-3 bg-white border-t border-indigo-100 animate-in slide-in-from-top-2 duration-200">
                                <RecursiveRankingGroup
                                    items={chunk}
                                    onInsert={onInsert}
                                    startIndex={chunkStartIndex}
                                    showTotalRank={showTotalRank}
                                    expandedFolders={expandedFolders}
                                    toggleFolder={toggleFolder}
                                    allReviews={allReviews}
                                    readOnly={readOnly}
                                    onOpenDetail={onOpenDetail}
                                />
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
};

export default RecursiveRankingGroup;
