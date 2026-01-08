import React, { useState, useEffect } from "react";
import { X, CheckCircle, ChevronRight, ChevronLeft, Search, Camera, ArrowUp, Zap, MapPin, Star } from "lucide-react";

/**
 * UserGuideModal
 * Multi-step wizard to explain Sunsal's core value and usage.
 * Iteration 2: Map Visuals, Back Button, Enhanced Animations.
 */
const UserGuideModal = ({ isOpen, onClose }) => {
    const [dontShowAgain, setDontShowAgain] = useState(false);
    const [step, setStep] = useState(0);

    // Reset step when opened
    useEffect(() => {
        if (isOpen) setStep(0);
    }, [isOpen]);

    const handleClose = () => {
        if (dontShowAgain) {
            localStorage.setItem("sunsal_user_guide_seen", "true");
        }
        onClose();
    };

    if (!isOpen) return null;

    // --- Custom Visual Components ---

    const InflationDiagram = () => (
        <div className="w-full max-w-[280px] h-40 relative bg-slate-100 rounded-xl overflow-hidden border border-slate-200 shadow-inner">
            {/* Map Grid Background */}
            <div className="absolute inset-0 grid grid-cols-4 grid-rows-4 opacity-20 pointer-events-none">
                {[...Array(16)].map((_, i) => (
                    <div key={i} className="border-r border-b border-indigo-200" />
                ))}
            </div>

            {/* Popping Markers */}
            {[
                { top: '20%', left: '20%', delay: '0ms' },
                { top: '30%', left: '70%', delay: '400ms' },
                { top: '60%', left: '40%', delay: '800ms' },
                { top: '70%', left: '80%', delay: '1200ms' },
                { top: '20%', left: '50%', delay: '1600ms' },
            ].map((pos, i) => (
                <div
                    key={i}
                    className="absolute flex flex-col items-center animate-in zoom-in slide-in-from-bottom-2 duration-500 fill-mode-forwards"
                    style={{ top: pos.top, left: pos.left, animationDelay: pos.delay }}
                >
                    <div className="relative">
                        {/* Bubble */}
                        <div className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded shadow-lg animate-bounce" style={{ animationDuration: '2s' }}>
                            5.0
                        </div>
                        {/* Pin */}
                        <MapPin size={16} className="text-red-500 fill-current mt-0.5 drop-shadow-md" />
                    </div>
                </div>
            ))}

            {/* Confused User/Cursor */}
            <div className="absolute bottom-2 left-2 bg-white/90 backdrop-blur px-2 py-1 rounded shadow text-[10px] text-slate-600 font-bold border border-slate-200 animate-pulse">
                "Where is real?"
            </div>
        </div>
    );

    const RankingDiagram = () => (
        <div className="w-full max-w-[220px] flex flex-col gap-2 relative p-2 bg-slate-50 rounded-xl border border-slate-100">
            <div className="bg-white border border-slate-200 p-3 rounded-lg shadow-sm text-xs text-slate-500 flex justify-between items-center opacity-60">
                <span className="font-bold">1. 우래옥</span> <span className="text-slate-400">9.5</span>
            </div>

            {/* Inserting Item */}
            <div className="bg-indigo-600 p-3 rounded-lg shadow-xl text-white text-xs font-bold flex justify-between items-center transform scale-105 z-10 animate-in slide-in-from-left duration-700">
                <div className="flex items-center gap-1.5">
                    <span className="bg-white/20 px-1 rounded text-[10px]">NEW</span>
                    <span>새로운 식당</span>
                </div>
                <span className="text-indigo-200 animate-pulse">Insert!</span>
            </div>

            <div className="bg-white border border-slate-200 p-3 rounded-lg shadow-sm text-xs text-slate-500 flex justify-between items-center opacity-60">
                <span className="font-bold">3. 진미평양냉면</span> <span className="text-slate-400">9.2</span>
            </div>

            {/* Visual Indicators */}
            <div className="absolute -left-2 top-1/2 -translate-y-1/2 flex flex-col gap-8 text-slate-300">
                <ArrowUp size={14} />
                <ArrowUp size={14} className="rotate-180" />
            </div>
        </div>
    );

    const AIDiagram = () => (
        <div className="w-full max-w-[240px] h-36 relative">
            <svg className="absolute inset-0 w-full h-full pointer-events-none">
                {/* Connecting lines */}
                <line x1="50%" y1="20%" x2="20%" y2="80%" stroke="#e2e8f0" strokeWidth="2" strokeDasharray="4" />
                <line x1="50%" y1="20%" x2="80%" y2="80%" stroke="#a855f7" strokeWidth="3" strokeLinecap="round" className="animate-[pulse_1.5s_ease-in-out_infinite]" />
            </svg>

            {/* Nodes */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 flex flex-col items-center z-20">
                <div className="w-14 h-14 bg-indigo-100 rounded-full border-4 border-white shadow-lg flex items-center justify-center font-bold text-xs text-indigo-700">
                    YOU
                </div>
            </div>

            <div className="absolute bottom-4 left-6 flex flex-col items-center z-10 opacity-50">
                <div className="w-10 h-10 bg-slate-100 rounded-full border-2 border-slate-200 flex items-center justify-center text-[10px] text-slate-500">
                    A
                </div>
            </div>

            <div className="absolute bottom-4 right-6 flex flex-col items-center z-20">
                <div className="absolute -top-6 bg-purple-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-md animate-bounce">
                    98% Match
                </div>
                <div className="w-12 h-12 bg-purple-50 rounded-full border-2 border-purple-500 flex items-center justify-center shadow-lg relative overflow-hidden">
                    <Zap size={20} className="text-purple-600 fill-purple-600 animate-pulse" />
                </div>
                <span className="text-[10px] font-bold text-purple-700 mt-1">Soulmate</span>
            </div>
        </div>
    );


    const slides = [
        {
            // Step 1: Problem
            visual: <InflationDiagram />,
            title: "지도 위 수많은 5.0점,\n어디가 진짜일까요?",
            desc: "모두가 만점인 세상에선\n진짜 맛집을 찾을 수 없습니다.",
            color: "bg-slate-50 text-slate-900"
        },
        {
            // Step 2: Solution (Relative Ranking)
            visual: <RankingDiagram />,
            title: "비교하면 보입니다.\n'상대평가' 랭킹",
            desc: "새로운 식당을 기존 리스트 사이에 끼워넣으세요.\n자연스럽게 진짜 서열이 정해집니다.",
            color: "bg-indigo-50 text-indigo-900"
        },
        {
            // Step 3: How to (Search & Auth)
            visual: (
                <div className="relative w-32 h-32 flex items-center justify-center">
                    <div className="absolute inset-0 bg-blue-100 rounded-full opacity-20 animate-ping"></div>
                    <div className="bg-white p-4 rounded-2xl shadow-lg border border-blue-100 relative z-10">
                        <Search size={40} className="text-blue-500" />
                        <div className="absolute -bottom-2 -right-2 bg-green-500 text-white p-1.5 rounded-full border-2 border-white shadow-sm">
                            <CheckCircle size={14} />
                        </div>
                    </div>
                </div>
            ),
            title: "1. 안심 검색,\n철저한 인증",
            desc: "우측 하단 + 버튼으로 검색하세요.\n위치/영수증 인증된 데이터만 기록됩니다.",
            color: "bg-blue-50 text-blue-900"
        },
        {
            // Step 4: How to (Ranking)
            visual: (
                <div className="flex gap-4 items-center justify-center h-32">
                    <div className="flex flex-col items-center gap-1 opacity-40">
                        <span className="text-2xl font-bold text-slate-300">A</span>
                        <div className="h-12 w-1 bg-slate-300 rounded-full"></div>
                    </div>
                    <div className="flex flex-col items-center gap-2 animate-bounce">
                        <span className="text-xs font-bold bg-green-100 text-green-700 px-2 py-0.5 rounded-full">Better?</span>
                        <div className="w-16 h-24 bg-white border-2 border-green-500 rounded-xl shadow-lg flex items-center justify-center">
                            <ArrowUp size={24} className="text-green-500" />
                        </div>
                        <span className="text-xs font-bold bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">Worse?</span>
                    </div>
                    <div className="flex flex-col items-center gap-1 opacity-40">
                        <div className="h-12 w-1 bg-slate-300 rounded-full"></div>
                        <span className="text-2xl font-bold text-slate-300">B</span>
                    </div>
                </div>
            ),
            title: "2. 고민하는 순간\n랭킹이 됩니다",
            desc: "\"여기가 아까 거기보다 맛있나?\"\n간단한 비교가 정교한 미식 지도를 만듭니다.",
            color: "bg-green-50 text-green-900"
        },
        {
            // Step 5: AI Recommendation (New)
            visual: <AIDiagram />,
            title: "AI가 찾아주는\n입맛 소울메이트",
            desc: "나의 랭킹 데이터를 분석해\n취향이 똑같은 사람의 '인생 맛집'을 추천합니다.",
            color: "bg-purple-50 text-purple-900"
        },
        {
            // Step 6: Personal Archive
            visual: (
                <div className="relative">
                    <div className="absolute inset-0 bg-yellow-400 blur-xl opacity-20"></div>
                    <MapPin size={80} className="text-indigo-600 drop-shadow-2xl relative z-10" />
                    <Star size={30} className="text-yellow-400 fill-yellow-400 absolute top-0 right-0 animate-spin-slow z-20" />
                </div>
            ),
            title: "당신의 미식 기록,\n지금 시작하세요!",
            desc: "신뢰할 수 있는 나만의 맛집 지도를\n친구들과 공유해보세요.",
            color: "bg-white text-slate-900"
        }
    ];

    const currentSlide = slides[step];

    const handleNext = () => {
        if (step < slides.length - 1) {
            setStep(step + 1);
        } else {
            handleClose();
        }
    };

    const handlePrev = () => {
        if (step > 0) {
            setStep(step - 1);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[100] animate-in fade-in duration-300 backdrop-blur-sm p-4">
            <div className="bg-white w-full max-w-[360px] md:max-w-[400px] rounded-[32px] shadow-2xl overflow-hidden relative flex flex-col h-[600px] border border-white/20 ring-1 ring-black/5">

                {/* Skip Button */}
                <div className="absolute top-6 right-6 z-20">
                    <button
                        onClick={handleClose}
                        className="text-xs font-bold text-slate-400 hover:text-slate-600 px-2 py-1 bg-white/50 rounded-full backdrop-blur-md transition-colors"
                    >
                        Skip
                    </button>
                </div>

                {/* Content Area */}
                <div className={`flex-1 flex flex-col items-center justify-center p-8 text-center transition-colors duration-700 ease-in-out ${currentSlide.color}`}>

                    {/* Visual Container */}
                    <div className="h-48 w-full flex items-end justify-center mb-6">
                        <div className="transform transition-all duration-500 hover:scale-105 w-full flex justify-center">
                            {currentSlide.visual}
                        </div>
                    </div>

                    <h2 className="text-2xl font-extrabold mb-4 whitespace-pre-wrap leading-tight tracking-tight">
                        {currentSlide.title}
                    </h2>

                    <p className="text-sm font-medium leading-relaxed whitespace-pre-wrap opacity-80 max-w-[280px] mx-auto">
                        {currentSlide.desc}
                    </p>
                </div>

                {/* Footer Navigation */}
                <div className="p-6 bg-white shrink-0 pb-8 border-t border-slate-50">
                    {/* Dots */}
                    <div className="flex justify-center gap-1.5 mb-6">
                        {slides.map((_, i) => (
                            <div
                                key={i}
                                className={`h-1.5 rounded-full transition-all duration-500 ${i === step ? "w-6 bg-indigo-600" : "w-1.5 bg-slate-200"}`}
                            />
                        ))}
                    </div>

                    <div className="flex gap-3">
                        {step > 0 && (
                            <button
                                onClick={handlePrev}
                                className="w-14 h-14 rounded-2xl border border-slate-200 text-slate-500 flex items-center justify-center hover:bg-slate-50 active:scale-95 transition-all"
                            >
                                <ChevronLeft size={24} />
                            </button>
                        )}

                        <button
                            onClick={handleNext}
                            className="flex-1 h-14 bg-indigo-600 text-white rounded-2xl font-bold shadow-xl shadow-indigo-100 hover:bg-indigo-700 hover:shadow-indigo-200 active:scale-[0.98] transition-all flex items-center justify-center gap-2 text-lg"
                        >
                            {step === slides.length - 1 ? (
                                <>시작하기 <CheckCircle size={20} /></>
                            ) : (
                                <>다음 <ChevronRight size={20} /></>
                            )}
                        </button>
                    </div>

                    {step === slides.length - 1 && (
                        <div className="flex items-center justify-center mt-5 gap-2 cursor-pointer group" onClick={() => setDontShowAgain(!dontShowAgain)}>
                            <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-colors ${dontShowAgain ? 'bg-indigo-600 border-indigo-600' : 'border-slate-300 bg-slate-50 group-hover:border-indigo-400'}`}>
                                {dontShowAgain && <CheckCircle size={12} className="text-white" />}
                            </div>
                            <span className="text-xs text-slate-500 font-medium select-none group-hover:text-indigo-600 transition-colors">다시 보지 않기</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default UserGuideModal;
