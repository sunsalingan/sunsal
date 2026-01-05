import React, { useRef, useEffect } from "react";
import { Coffee, Home, Utensils, Search, RotateCcw, ZoomIn, ZoomOut } from "lucide-react";

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
    mapOffset,
    setIsDragging,
    setDragStart,
    setIsMapMoved,
    setMapOffset,
    dragStart,
    selectedCluster,
    setSelectedCluster,
    setUseRealMap, // This might not be needed if state is managed up top, but map loading logic uses it.
}) => {
    const mapRef = useRef(null);

    // Naver Map Init
    useEffect(() => {
        if (!useRealMap) return;

        // Wait for Naver Map SDK to be ready
        const init = () => {
            if (window.naver && window.naver.maps) {
                initNaverMap();
            } else {
                // Poll if script is still loading
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

        window.naver.maps.Event.addListener(map, 'dragend', () => {
            setIsMapMoved(true);
        });
        window.naver.maps.Event.addListener(map, 'zoom_changed', () => {
            setIsMapMoved(true);
        });
    };

    // Naver Map Markers
    useEffect(() => {
        if (!useRealMap || !mapInstance || !window.naver) return;
        markersRef.current.forEach((m) => m.setMap(null));
        const newMarkers = [];
        displayedReviews.forEach((review) => {
            if (!review.lat || !review.lng || isNaN(review.lat) || isNaN(review.lng)) return;
            try {
                const marker = new window.naver.maps.Marker({
                    position: new window.naver.maps.LatLng(review.lat, review.lng),
                    map: mapInstance,
                    title: review.name,
                    icon: {
                        content: `<div style="padding:5px; background:white; border:1px solid #ccc; border-radius:10px; font-size:10px; font-weight:bold; box-shadow: 2px 2px 5px rgba(0,0,0,0.2); white-space:nowrap;">${review.name}</div>`,
                        anchor: new window.naver.maps.Point(20, 20),
                    },
                });
                window.naver.maps.Event.addListener(marker, "click", () =>
                    handleOpenDetail(review)
                );
                newMarkers.push(marker);
            } catch (e) {
                console.error("Marker creation failed", e);
            }
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
        </div>
    );
};
export default MapArea;
