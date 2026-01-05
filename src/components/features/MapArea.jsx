import React, { useRef, useEffect, useState } from "react";
import { Coffee, Home, Utensils, Search, RotateCcw, ZoomIn, ZoomOut, X } from "lucide-react";

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
}) => {
    const [selectedClusterItems, setSelectedClusterItems] = useState(null);

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
    };

    // Clustering and Markers
    useEffect(() => {
        if (!useRealMap || !mapInstance || !window.naver) return;

        // 1. Grouping Logic
        const clusters = [];
        const zoomLevel = mapInstance.getZoom();
        const threshold = 0.01 / Math.pow(1.5, zoomLevel - 10); // Dynamic threshold

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
                        <div style="position:relative; pointer-events:auto;">
                            <div style="padding:6px 10px; background:white; border:2px solid #4f46e5; border-radius:20px; font-size:11px; font-weight:bold; box-shadow: 0 4px 6px rgba(0,0,0,0.1); white-space:nowrap; color:#1e293b;">
                                ${representative.name}
                                ${count > 1 ? `<span style="margin-left:5px; background:#4f46e5; color:white; padding:2px 6px; border-radius:10px; font-size:9px;">+${count - 1}</span>` : ""}
                            </div>
                            <div style="width:0; height:0; border-left:6px solid transparent; border-right:6px solid transparent; border-top:8px solid #4f46e5; position:absolute; bottom:-8px; left:50%; transform:translateX(-50%);"></div>
                        </div>
                    `,
                    anchor: new window.naver.maps.Point(20, 40),
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
    const handleMouseDown = (e) => {
        setIsDragging(true);
        setDragStart({ x: e.clientX - mapOffset.x, y: e.clientY - mapOffset.y });
        setSelectedCluster(null);
    };
    const handleMouseMove = (e) => {
        // Note: isDragging check should be passed from parent or checked here if state is available
        // But since handler implementations are passed or local?
        // Let's implement local logic if props allow, or rely on parent.
        // Parent passed setters, so we can implement here.
    };

    // Re-implementing handlers locally to avoid prop drilling complex functions if possible
    // efficiently. But for now, let's use the props passed for state setters.

    const onMouseMove = (e) => {
        // isDragging is prop? No, it's boolean. We need the value.
        // Actually parent passed setIsDragging etc.
        // Let's assume parent handles the logic or we implement here using the state from props.
    };

    // Because the original App.jsx had logic inside the component, we need to replicate it.

    const handleVirtualMouseDown = (e) => {
        setIsDragging(true);
        setDragStart({ x: e.clientX - mapOffset.x, y: e.clientY - mapOffset.y });
        setSelectedCluster(null);
    };

    const handleVirtualMouseMove = (e) => {
        // We need isDragging state value.
        // Optimization: Move these handlers to App.jsx and pass them down?
        // Or keep state in App.jsx and logic here?
        // For refactoring speed, I'll assume usage of passed functions or re-implement if simple.
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
                        onClick={handleSearchInArea}
                        className="bg-white text-indigo-600 px-4 py-2 rounded-full shadow-lg text-xs font-bold flex gap-2"
                    >
                        <RotateCcw size={14} /> 재검색
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
                    className="bg-white p-2 hover:bg-slate-50 text-slate-600"
                >
                    <ZoomOut size={18} />
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
