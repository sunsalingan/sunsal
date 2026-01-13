import React, { useState } from 'react';
import HierarchicalRankingSelector from '../components/features/HierarchicalRankingSelector';
import { useData } from '../contexts/DataContext';

// Dummy Data Generator
const generateDummyRestaurants = (count) => {
    return Array.from({ length: count }, (_, i) => ({
        id: `mock-${i + 1}`,
        name: `Mock Restaurant ${i + 1}`,
        category: "KOREAN", // Mock category
        rank: i + 1,
        score: (10.0 - (i * 0.1)).toFixed(1) // Visual score
    }));
};

const RankingPrototype = () => {
    const { rankingInterval, setRankingInterval } = useData();
    const [dummyItems] = useState(generateDummyRestaurants(35)); // 35 items

    return (
        <div className="min-h-screen bg-slate-100 dark:bg-slate-900 p-4 font-sans text-slate-800 dark:text-slate-100 flex flex-col items-center">
            <header className="w-full max-w-md bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm mb-6 flex flex-col gap-4">
                <div className="flex justify-between items-center">
                    <h1 className="text-xl font-black bg-gradient-to-r from-indigo-500 to-purple-500 bg-clip-text text-transparent">
                        Ranking Component Test
                    </h1>
                    <div className="text-xs font-bold px-2 py-1 bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 rounded">
                        INTEGRATION
                    </div>
                </div>

                <div className="flex flex-col gap-2 p-3 bg-slate-50 dark:bg-slate-900 rounded-lg text-xs text-slate-500">
                    <p>⚠️ 랭킹 그룹 단위(5/10/20) 변경은 <strong>사이드바 {'>'} 설정</strong>에서 가능합니다.</p>
                    <p>현재 설정값: <strong>{rankingInterval}개 단위</strong></p>
                </div>
            </header>

            <main className="w-full max-w-md space-y-4">
                <div className="p-4 bg-white dark:bg-slate-800 rounded-xl shadow-sm">
                    <h2 className="font-bold mb-4">Hierarchical Selector Rendering:</h2>
                    <HierarchicalRankingSelector
                        items={dummyItems}
                        onInsert={(id, pos) => alert(`Insert action: ${pos} ${id}`)}
                        startIndex={0}
                    />
                </div>
            </main>
        </div>
    );
};

export default RankingPrototype;
