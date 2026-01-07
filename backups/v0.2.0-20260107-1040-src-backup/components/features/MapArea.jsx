import React, { useRef, useEffect, useState } from "react";
import { Coffee, Home, Utensils, Search, RotateCcw, ZoomIn, ZoomOut, X, Crosshair } from "lucide-react";

const NAVER_CLIENT_ID = "jod7e9zh3o";

const MapArea = ({
    useRealMap,
    showMap,
    mapElement,
    mapInstance,
    setMapInstance,
    mapClusters,
    zoom,
    setZoom,
    markersRef,
    displayedReviews,
    handleOpenDetail,
    currentPage,
    setRestaurantSearchOpen,
    isMapMoved,
    handleSearchInArea,
    handleZoom,
    setIsMapMoved,
    onBoundsChanged, // New prop
}) => {
    const [selectedClusterItems, setSelectedClusterItems] = useState(null);

    // Track latest bounds without triggering re-renders or parent updates
    const latestBoundsRef = useRef(null);

    // Naver Map Init
    useEffect(() => {
        if (!useRealMap) return;

        const init = () => {
            if (window.naver && window.naver.maps) {
                initNaverMap();
            } else {
                setTimeout(init, 100);
            }
        };
        init();
    }, [useRealMap]);

    const initNaverMap = () => {
        if (!mapElement.current || !window.naver) return;
        const center = new window.naver.maps.LatLng(37.5665, 126.9780);
        const mapOptions = {
            center: center,
            zoom: 13,
            minZoom: 1,
            zoomControl: false,
            mapTypeControl: false,
        };
        const map = new window.naver.maps.Map(mapElement.current, mapOptions);
        setMapInstance(map);

        window.naver.maps.Event.addListener(map, 'dragend', () => setIsMapMoved(true));
        window.naver.maps.Event.addListener(map, 'zoom_changed', () => setIsMapMoved(true));
        window.naver.maps.Event.addListener(map, 'click', () => setSelectedClusterItems(null));

        // Bounds Change Listener - JUST TRACK, DON'T UPDATE PARENT YET
        window.naver.maps.Event.addListener(map, 'idle', () => {
            const bounds = map.getBounds();
            const ne = bounds.getNE();
            const sw = bounds.getSW();
            latestBoundsRef.current = {
                north: ne.lat(),
                east: ne.lng(),
                south: sw.lat(),
                west: sw.lng()
            };
        });
    };

    // ... (Clustering logic remains same)

    const handleResearchClick = () => {
        if (latestBoundsRef.current && onBoundsChanged) {
            onBoundsChanged(latestBoundsRef.current);
        }
        handleSearchInArea(); // Hides the button
    };

    // Clustering and Markers
    useEffect(() => {
        if (!useRealMap || !mapInstance || !window.naver) return;

        // 1. Grouping Logic
        const clusters = [];
        const zoomLevel = mapInstance.getZoom();
        const threshold = 0.025 / Math.pow(1.5, zoomLevel - 10); // Dynamic threshold (increased for better grouping)

        const sortedReviews = [...displayedReviews].sort((a, b) => (a.rankIndex || 0) - (b.rankIndex || 0));

        sortedReviews.forEach(review => {
            if (!review.lat || !review.lng) return;
            let added = false;
            for (let cluster of clusters) {
                const rep = cluster[0];
                const dist = Math.sqrt(Math.pow(review.lat - rep.lat, 2) + Math.pow(review.lng - rep.lng, 2));
                if (dist < threshold) {
                    cluster.push(review);
                    added = true;
                    break;
                }
            }
            if (!added) clusters.push([review]);
        });

        // 2. Clear old markers
        markersRef.current.forEach(m => m.setMap(null));
        const newMarkers = [];

        // 3. Create new cluster markers
        clusters.forEach(cluster => {
            const representative = cluster[0];
            const count = cluster.length;

            const marker = new window.naver.maps.Marker({
                position: new window.naver.maps.LatLng(representative.lat, representative.lng),
                map: mapInstance,
                icon: {
                    content: `
                        <div style="position:relative; cursor:pointer;">
                            <div style="padding:6px 10px; background:white; border:2px solid #4f46e5; border-radius:30px; font-size:11px; font-weight:bold; box-shadow: 0 4px 6px rgba(0,0,0,0.15); white-space:nowrap; color:#1e293b; display:flex; align-items:center; gap:4px; max-width: 150px;">
                                <span style="font-size:12px;">${representative.name}</span>
                                <span style="color:#f59e0b;">★</span>
                                <span>${representative.globalScore || '9.0'}</span>
                            </div>
                            
                            ${count > 1 ? `
                                <div style="
                                    position: absolute;
                                    top: -8px;
                                    right: -8px;
                                    background: #ef4444;
                                    color: white;
                                    width: 20px;
                                    height: 20px;
                                    border-radius: 50%;
                                    display: flex;
                                    align-items: center;
                                    justify-content: center;
                                    font-size: 10px;
                                    font-weight: 800;
                                    border: 2px solid white;
                                    box-shadow: 0 2px 4px rgba(0,0,0,0.2);
                                    z-index: 10;
                                ">
                                    +${count - 1}
                                </div>
                            ` : ""}

                            <div style="width:0; height:0; border-left:6px solid transparent; border-right:6px solid transparent; border-top:8px solid #4f46e5; position:absolute; bottom:-8px; left:50%; transform:translateX(-50%);"></div>
                        </div>
                    `,
                    anchor: new window.naver.maps.Point(count > 1 ? 30 : 50, 45), // Anchor 조정
                },
            });

            window.naver.maps.Event.addListener(marker, "click", () => {
                if (count > 1) {
                    setSelectedClusterItems(cluster);
                } else {
                    handleOpenDetail(representative);
                }
            });
            newMarkers.push(marker);
        });

        markersRef.current = newMarkers;
    }, [mapInstance, displayedReviews, useRealMap]);


    // Virtual Map Handlers
    const handleCurrentLocation = () => {
        if (!navigator.geolocation) {
            alert("Geolocation is not supported by your browser");
            return;
        }
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                if (mapInstance && window.naver) {
                    const newCenter = new window.naver.maps.LatLng(latitude, longitude);
                    mapInstance.setCenter(newCenter);
                    mapInstance.setZoom(15);
                    setIsMapMoved(false);
                }
            },
            () => {
                alert("Unable to retrieve your location");
            }
        );
    };


    return (
        <div
            className={`relative transition-all duration-300 ease-in-out bg-slate-200 overflow-hidden border-b border-slate-200 group ${showMap ? "h-80 shrink-0" : "h-0"
                }`}
        >
            <div ref={mapElement} className="w-full h-full" />
            {!mapInstance && (
                <div className="absolute inset-0 flex items-center justify-center bg-slate-100/50 pointer-events-none">
                    <span className="text-sm font-bold text-slate-500">
                        네이버 지도 로딩 중... (URL 등록 확인)
                    </span>
                </div>
            )}

            {currentPage === "MAIN" && (
                <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 w-full max-w-xs px-4">
                    <button
                        onClick={() => setRestaurantSearchOpen(true)}
                        className="w-full bg-white shadow-lg rounded-full py-3 px-4 flex items-center text-slate-400 text-sm font-medium hover:bg-slate-50 transition-colors"
                    >
                        <Search size={16} className="mr-2 text-indigo-500" /> 방문한 식당
                        검색...
                    </button>
                </div>
            )}
            {isMapMoved && (
                <div className="absolute top-16 left-1/2 -translate-x-1/2 z-20">
                    <button
                        onClick={handleResearchClick}
                        className="bg-white text-indigo-600 px-4 py-2 rounded-full shadow-lg text-xs font-bold flex gap-2"
                    >
                        <RotateCcw size={14} /> 현 지도에서 재검색
                    </button>
                </div>
            )}
            <div className="absolute bottom-4 right-4 z-20 flex flex-col gap-1 shadow-md rounded-lg overflow-hidden border border-slate-200">
                <button
                    onClick={() => handleZoom(1)}
                    className="bg-white p-2 hover:bg-slate-50 text-slate-600 border-b border-slate-100"
                >
                    <ZoomIn size={18} />
                </button>
                <button
                    onClick={() => handleZoom(-1)}
                    className="bg-white p-2 hover:bg-slate-50 text-slate-600 border-b border-slate-100"
                >
                    <ZoomOut size={18} />
                </button>
                <button
                    onClick={handleCurrentLocation}
                    className="bg-white p-2 hover:bg-slate-50 text-slate-600"
                >
                    <Crosshair size={18} />
                </button>
            </div>

            {/* Cluster List Popup */}
            {selectedClusterItems && (
                <div className="absolute inset-0 bg-black/20 z-50 flex items-center justify-center p-4">
                    <div className="w-[300px] bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
                        <div className="bg-indigo-600 px-4 py-3 flex justify-between items-center text-white shrink-0">
                            <span className="text-sm font-bold">이 지역 식당 ({selectedClusterItems.length})</span>
                            <button onClick={() => setSelectedClusterItems(null)} className="p-1 hover:bg-white/10 rounded-full">
                                <X size={16} />
                            </button>
                        </div>
                        <div className="max-h-[300px] overflow-y-auto p-2 bg-slate-50 space-y-2">
                            {selectedClusterItems.map((review) => (
                                <button
                                    key={review.id}
                                    onClick={() => {
                                        handleOpenDetail(review);
                                        setSelectedClusterItems(null);
                                    }}
                                    className="w-full flex items-center justify-between p-3 bg-white hover:bg-indigo-50 rounded-xl border border-slate-100 transition-colors shadow-sm group text-left"
                                >
                                    <div className="flex flex-col gap-0.5 overflow-hidden">
                                        <span className="text-xs font-bold text-slate-800 truncate">
                                            {review.name}
                                        </span>
                                        <span className="text-[10px] text-slate-400">
                                            {review.category} · {review.globalScore || '9.0'}점
                                        </span>
                                    </div>
                                    <div className="text-indigo-600 font-bold text-[10px] shrink-0">
                                        {(review.rankIndex || 0) + 1}위
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
export default MapArea;
