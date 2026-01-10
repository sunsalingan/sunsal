import React, { useState, useEffect } from "react";
import { Search, MapPin, X, Loader2 } from "lucide-react";
import { searchNaverPlaces, getRegionFromCoords } from "../../services/naverApi";

const RestaurantSearchModal = ({
    isOpen,
    onClose,
    mockRestaurantSearch, // Function to search
    onSelectRestaurant, // Handler when a restaurant is clicked
    mapInstance, // [NEW] Map instance for location sort
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

    // Helper: Calculate distance in km
    const getDistanceFromLatLonInKm = (lat1, lon1, lat2, lon2) => {
        const R = 6371;
        const dLat = deg2rad(lat2 - lat1);
        const dLon = deg2rad(lon2 - lon1);
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    };

    const deg2rad = (deg) => deg * (Math.PI / 180);

    const [userLocation, setUserLocation] = useState(null);
    const [currentRegion, setCurrentRegion] = useState(""); // e.g., "Munjeong-dong"

    useEffect(() => {
        if (isOpen && navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                async (position) => {
                    const lat = position.coords.latitude;
                    const lng = position.coords.longitude;
                    // Try to identify region name for better search context
                    try {
                        const dongName = await getRegionFromCoords(lat, lng);
                        if (dongName) {
                            setCurrentRegion(dongName);
                            console.log("Detected User Dong:", dongName);
                        }
                    } catch (e) {
                        console.error("Region detection failed", e);
                    }
                },
                (error) => console.error("Geolocation error:", error),
                { enableHighAccuracy: true, timeout: 5000 }
            );
        }
    }, [isOpen]);

    // Helper to filter only restaurants
    const filterRestaurants = (items) => {
        const validCategories = ["음식점", "식당", "카페", "한식", "양식", "중식", "일식", "분식", "주점", "술집", "베이커리", "패스트푸드", "육류", "고기", "해산물", "면", "요리"];
        return items.filter(item => {
            const cat = (item.category || "").replace(/\s/g, ""); // remove spaces
            return validCategories.some(v => cat.includes(v));
        });
    };

    useEffect(() => {
        const timer = setTimeout(async () => {
            if (isOpen && searchTerm.trim()) {
                setIsSearching(true);
                let data = [];
                let usedFallback = false;

                // 1. Context Search: Try "Dong + Keyword" first (e.g., "Munjeong-dong Lotteria")
                if (currentRegion) {
                    const contextQuery = `${currentRegion} ${searchTerm}`;
                    console.log(`Attempting Context Search: ${contextQuery}`);
                    data = await searchNaverPlaces(contextQuery);
                }

                // 2. Fallback Search: If no results (or no region), use raw Keyword
                if (!data || data.length === 0) {
                    console.log(`Fallback to Raw Search: ${searchTerm}`);
                    data = await searchNaverPlaces(searchTerm);
                    usedFallback = true;
                }

                // [NEW] Filter Non-Restaurants
                const filteredData = filterRestaurants(data);

                // 3. Sort by Distance
                // Sort Preference: User Location > Map Center
                let origin = null;
                if (userLocation) {
                    origin = { y: userLocation.lat, x: userLocation.lng };
                } else if (mapInstance && window.naver) {
                    origin = mapInstance.getCenter();
                }

                if (origin) {
                    const centerLat = origin.y;
                    const centerLng = origin.x;
                    const sortedData = filteredData.map(place => ({
                        ...place,
                        distance: getDistanceFromLatLonInKm(centerLat, centerLng, parseFloat(place.lat), parseFloat(place.lng))
                    })).sort((a, b) => a.distance - b.distance);
                    setResults(sortedData);
                } else {
                    setResults(filteredData);
                }
                setIsSearching(false);
            } else {
                setResults([]);
            }
        }, 500);
        return () => clearTimeout(timer);
    }, [searchTerm, isOpen, mapInstance, userLocation, currentRegion]);

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 bg-black/50 flex items-start justify-center pt-20 px-4 animate-in fade-in duration-200"
            style={{ zIndex: 20002 }} // Force high z-index
        >
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
                                        <div className="font-bold text-slate-800 flex items-center gap-2">
                                            {place.name}
                                            {place.distance !== undefined && (
                                                <span className="text-[10px] text-indigo-500 bg-indigo-50 px-1.5 py-0.5 rounded-full font-bold">
                                                    {place.distance < 1
                                                        ? `${(place.distance * 1000).toFixed(0)}m`
                                                        : `${place.distance.toFixed(1)}km`}
                                                </span>
                                            )}
                                        </div>
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
