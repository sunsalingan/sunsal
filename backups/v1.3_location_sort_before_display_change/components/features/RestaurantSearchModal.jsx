import React, { useState, useEffect } from "react";
import { Search, MapPin, X, Loader2 } from "lucide-react";
import { searchNaverPlaces } from "../../services/naverApi";

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
        const R = 6371; // Radius of the earth in km
        const dLat = deg2rad(lat2 - lat1);
        const dLon = deg2rad(lon2 - lon1);
        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const d = R * c; // Distance in km
        return d;
    };

    const deg2rad = (deg) => {
        return deg * (Math.PI / 180);
    };

    const [userLocation, setUserLocation] = useState(null);

    useEffect(() => {
        if (isOpen && navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    setUserLocation({
                        lat: position.coords.latitude,
                        lng: position.coords.longitude
                    });
                },
                (error) => {
                    console.error("Geolocation denied or error:", error);
                    // Fallback to map center if available immediately? 
                    // Or just let the existing logic handle 'mapInstance' fallback if we want.
                    // User explicitly requested User Location, so we prioritize that.
                },
                { enableHighAccuracy: true, timeout: 5000 }
            );
        }
    }, [isOpen]);

    useEffect(() => {
        const timer = setTimeout(async () => {
            if (isOpen && searchTerm.trim()) {
                setIsSearching(true);
                const data = await searchNaverPlaces(searchTerm);

                // Sort Preference: User Location > Map Center
                let origin = null;
                if (userLocation) {
                    origin = { y: userLocation.lat, x: userLocation.lng };
                } else if (mapInstance && window.naver) {
                    // Fallback to Map Center if user location not found yet
                    // But User specifically asked for User Location. 
                    // If we have mapInstance, it's better than nothing, but let's prioritize userLocation clearly.
                    origin = mapInstance.getCenter();
                }

                if (origin) {
                    const centerLat = origin.y;
                    const centerLng = origin.x;

                    console.log("Sorting by distance from:", centerLat, centerLng);

                    const sortedData = data.map(place => {
                        const dist = getDistanceFromLatLonInKm(
                            centerLat,
                            centerLng,
                            parseFloat(place.lat),
                            parseFloat(place.lng)
                        );
                        return { ...place, distance: dist };
                    }).sort((a, b) => a.distance - b.distance);

                    setResults(sortedData);
                } else {
                    setResults(data);
                }
                setIsSearching(false);
            } else {
                setResults([]);
            }
        }, 500); // 0.5s debounce
        return () => clearTimeout(timer);
    }, [searchTerm, isOpen, mapInstance, userLocation]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-start justify-center pt-20 px-4 z-[60] animate-in fade-in duration-200">
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
