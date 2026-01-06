import React, { useRef, useEffect, useState } from "react";
import { Search, RefreshCcw, ZoomIn, ZoomOut, X } from "lucide-react";

const MapArea = ({
    showMap,
    mapInstance,
    setMapInstance,
    markersRef,
    displayedReviews,
    handleOpenDetail,
    currentPage,
    setRestaurantSearchOpen,
    isMapMoved,
    setIsMapMoved,
    handleSearchInArea,
    handleZoom,
    onBoundsChanged,
}) => {
    const mapElement = useRef(null);
    const [selectedClusterItems, setSelectedClusterItems] = useState(null);

    // Map Initialization
    useEffect(() => {
        if (!showMap) return;

        // Prevent re-initialization if already exists
        if (mapInstance) return;

        const initMap = () => {
            // Check if Naver script is ready
            if (!window.naver || !window.naver.maps) {
                return; // Wait for next interval
            }

            const el = mapElement.current;
            if (!el) return;

            try {
                // Basic Map Options
                const mapOptions = {
                    center: new window.naver.maps.LatLng(37.5665, 126.9780), // Seoul City Hall
                    zoom: 13,
                    minZoom: 8,
                    maxZoom: 18,
                };

                const map = new window.naver.maps.Map(el, mapOptions);
                setMapInstance(map);
                console.log("Map Initialized Standard Mode");

                // Bind Events
                window.naver.maps.Event.addListener(map, 'dragend', () => setIsMapMoved && setIsMapMoved(true));
                window.naver.maps.Event.addListener(map, 'zoom_changed', () => setIsMapMoved && setIsMapMoved(true));
                window.naver.maps.Event.addListener(map, 'click', () => setSelectedClusterItems(null));

                // Bounds Change (Optional optimization)
                if (onBoundsChanged) {
                    window.naver.maps.Event.addListener(map, 'idle', () => {
                        const bounds = map.getBounds();
                        onBoundsChanged({
                            north: bounds.getNE().lat(),
                            east: bounds.getNE().lng(),
                            south: bounds.getSW().lat(),
                            west: bounds.getSW().lng()
                        });
                    });
                }

            } catch (err) {
                console.error("Map Init Failed:", err);
            }
        };

        const interval = setInterval(() => {
            if (window.naver && window.naver.maps) {
                clearInterval(interval);
                initMap();
            }
        }, 100);

        return () => clearInterval(interval);
    }, [showMap, mapInstance, setMapInstance, setIsMapMoved, onBoundsChanged]);


    // Cluster / Marker Logic
    useEffect(() => {
        if (!mapInstance || !window.naver || !displayedReviews) return;

        // Clear existing markers
        if (markersRef.current) {
            markersRef.current.forEach(m => m.setMap(null));
            markersRef.current = [];
        }

        try {
            const newMarkers = [];
            const clusters = [];
            const zoomLevel = mapInstance.getZoom() || 13;
            const threshold = 0.02 / Math.pow(2, zoomLevel - 13);

            // Sort reviews by rank
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

            // Create Markers from Clusters
            clusters.forEach(cluster => {
                const representative = cluster[0];
                const count = cluster.length;
                const position = new window.naver.maps.LatLng(representative.lat, representative.lng);

                const markerContent = `
                    <div style="position:relative; cursor:pointer;">
                        <div style="padding:6px 10px; background:white; border:2px solid #4f46e5; border-radius:30px; font-size:11px; font-weight:bold; box-shadow: 0 4px 6px rgba(0,0,0,0.15); white-space:nowrap; color:#1e293b; display:flex; align-items:center; gap:4px;">
                            <span>${representative.name}</span>
                            <span style="color:#f59e0b;">★</span>
                            <span>${representative.globalScore || '0.0'}</span>
                        </div>
                        ${count > 1 ? `<div style="position: absolute; top: -8px; right: -8px; background: #ef4444; color: white; width: 20px; height: 20px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 10px; font-weight: 800; border: 2px solid white;">+${count - 1}</div>` : ""}
                        <div style="width:0; height:0; border-left:6px solid transparent; border-right:6px solid transparent; border-top:8px solid #4f46e5; position:absolute; bottom:-8px; left:50%; transform:translateX(-50%);"></div>
                    </div>
                `;

                const marker = new window.naver.maps.Marker({
                    position,
                    map: mapInstance,
                    icon: {
                        content: markerContent,
                        anchor: new window.naver.maps.Point(count > 1 ? 30 : 50, 45),
                    },
                });

                window.naver.maps.Event.addListener(marker, "click", () => {
                    if (count > 1) setSelectedClusterItems(cluster);
                    else if (handleOpenDetail) handleOpenDetail(representative);
                });

                newMarkers.push(marker);
            });

            markersRef.current = newMarkers;

        } catch (e) {
            console.error("Cluster Logic Error:", e);
        }

    }, [mapInstance, displayedReviews, markersRef, handleOpenDetail]);

    if (!showMap) return null;

    return (
        <div className="relative w-full h-[320px] bg-slate-200 border-b border-slate-200">
            <div ref={mapElement} className="w-full h-full" />

            {/* Custom Controls */}
            {currentPage === "MAIN" && (
                <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 w-full max-w-xs px-4">
                    <button
                        onClick={() => setRestaurantSearchOpen && setRestaurantSearchOpen(true)}
                        className="w-full bg-white shadow-lg rounded-full py-3 px-4 flex items-center text-slate-400 text-sm font-medium hover:bg-slate-50 transition-colors"
                    >
                        <Search size={16} className="mr-2 text-indigo-500" /> 방문한 식당 검색...
                    </button>
                </div>
            )}

            {isMapMoved && (
                <div className="absolute top-16 left-1/2 -translate-x-1/2 z-20">
                    <button
                        onClick={handleSearchInArea}
                        className="bg-blue-600 text-white px-4 py-2 rounded-full shadow-lg text-sm font-semibold hover:bg-blue-700 transition-colors flex items-center gap-2"
                    >
                        <RefreshCcw size={16} /> 재검색
                    </button>
                </div>
            )}

            <div className="absolute bottom-4 right-4 z-20 flex flex-col gap-1 shadow-md rounded-lg overflow-hidden border border-slate-200">
                <button onClick={() => handleZoom && handleZoom(1)} className="bg-white p-2 hover:bg-slate-50 border-b border-slate-100">
                    <ZoomIn size={18} className="text-slate-600" />
                </button>
                <button onClick={() => handleZoom && handleZoom(-1)} className="bg-white p-2 hover:bg-slate-50">
                    <ZoomOut size={18} className="text-slate-600" />
                </button>
            </div>

            {/* Cluster Popup */}
            {selectedClusterItems && (
                <div className="absolute inset-0 bg-black/20 z-50 flex items-center justify-center p-4">
                    <div className="w-[300px] bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
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
                                        if (handleOpenDetail) handleOpenDetail(review);
                                        setSelectedClusterItems(null);
                                    }}
                                    className="w-full flex items-center justify-between p-3 bg-white hover:bg-indigo-50 rounded-xl border border-slate-100 transition-colors shadow-sm group text-left"
                                >
                                    <div className="flex flex-col gap-0.5 overflow-hidden">
                                        <span className="text-xs font-bold text-slate-800 truncate">{review.name}</span>
                                        <span className="text-[10px] text-slate-400">{review.category} · {review.globalScore || '0.0'}점</span>
                                    </div>
                                    <div className="text-indigo-600 font-bold text-[10px] shrink-0">{(review.rankIndex || 0) + 1}위</div>
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
