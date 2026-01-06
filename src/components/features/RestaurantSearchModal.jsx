import React, { useState, useEffect } from "react";
import { Search, MapPin, X, Loader2 } from "lucide-react";
import { searchNaverPlaces } from "../../services/naverApi";

const RestaurantSearchModal = ({
    isOpen,
    onClose,
    mockRestaurantSearch, // Function to search
    onSelectRestaurant, // Handler when a restaurant is clicked
}) => {
    const [searchTerm, setSearchTerm] = useState("");
    const [results, setResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setSearchTerm("");
            setResults([]);
        }
    }, [isOpen]);

    useEffect(() => {
        const timer = setTimeout(async () => {
            if (isOpen && searchTerm.trim()) {
                setIsSearching(true);
                const data = await searchNaverPlaces(searchTerm);
                setResults(data);
                setIsSearching(false);
            } else {
                setResults([]);
            }
        }, 500); // 0.5s debounce
        return () => clearTimeout(timer);
    }, [searchTerm, isOpen]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-start justify-center pt-20 px-4 z-50 animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col max-h-[70vh]">
                <div className="p-4 border-b flex items-center gap-2">
                    <Search className="text-slate-400" />
                    <input
                        className="flex-1 outline-none text-base font-medium placeholder:text-slate-300"
                        placeholder="지역명, 주소 검색 (예: 강남대로 390)"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        autoFocus
                    />
                    {isSearching && <Loader2 className="animate-spin text-indigo-500" size={16} />}
                    <button
                        onClick={onClose}
                        className="p-1 rounded-full hover:bg-slate-100"
                    >
                        <X size={20} />
                    </button>
                </div>
                <div className="overflow-y-auto flex-1 p-2">
                    {results.length > 0 ? (
                        results.map((place, idx) => (
                            <div
                                key={idx}
                                onClick={() => {
                                    onSelectRestaurant(place);
                                }}
                                className="p-3 hover:bg-slate-50 rounded-xl cursor-pointer flex items-center justify-between group transition-colors"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center group-hover:bg-indigo-100 transition-colors">
                                        <MapPin
                                            size={16}
                                            className="text-slate-400 group-hover:text-indigo-600 transition-colors"
                                        />
                                    </div>
                                    <div>
                                        <div className="font-bold text-slate-800">{place.name}</div>
                                        <div className="text-xs text-slate-400">
                                            {place.address}
                                        </div>
                                    </div>
                                </div>
                                <span className="text-xs font-medium text-slate-400 bg-slate-100 px-2 py-1 rounded group-hover:bg-white transition-colors">
                                    {place.category}
                                </span>
                            </div>
                        ))
                    ) : (
                        <div className="py-10 text-center text-slate-400 text-sm">
                            {searchTerm ? "검색 결과가 없습니다. 도로명 주소로 검색해보세요." : "방문한 식당의 주소를 검색해보세요."}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default RestaurantSearchModal;
