import React, { useState, useEffect } from "react";
import { Search, MapPin, X } from "lucide-react";

const RestaurantSearchModal = ({
    isOpen,
    onClose,
    mockRestaurantSearch, // Function to search
    onSelectRestaurant, // Handler when a restaurant is clicked
}) => {
    const [searchTerm, setSearchTerm] = useState("");
    const [results, setResults] = useState([]);

    useEffect(() => {
        if (isOpen) {
            setSearchTerm("");
            setResults(mockRestaurantSearch(""));
        }
    }, [isOpen]);

    useEffect(() => {
        const timer = setTimeout(() => {
            if (isOpen) {
                setResults(mockRestaurantSearch(searchTerm));
            }
        }, 200);
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
                        placeholder="식당 이름을 검색해보세요"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        autoFocus
                    />
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
                            검색 결과가 없습니다.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default RestaurantSearchModal;
