import React, { useEffect, useState } from 'react';
import { isInAppBrowser, isAndroid, isIOS, redirectToExternalBrowser } from '../../utils/inAppHandler';
import { ExternalLink, Copy } from 'lucide-react'; // Assuming lucide-react is installed

const InAppBrowserGuard = ({ children }) => {
    const [isBlocked, setIsBlocked] = useState(false);

    useEffect(() => {
        // 1. Check if we are in an In-App Browser
        if (isInAppBrowser()) {
            // 2. Try to redirect automatically on Android
            if (isAndroid()) {
                const redirected = redirectToExternalBrowser();
                if (redirected) {
                    // Even if redirected, we might want to show a blank screen or a "Redirecting..." message
                    // preventing the app from loading further.
                    setIsBlocked(true);
                    return;
                }
            }

            // 3. For iOS or failed Android redirect, show the manual guide
            // Always block the main app view to prevent 403 errors during login attempts
            setIsBlocked(true);
        }
    }, []);

    const handleCopyLink = () => {
        navigator.clipboard.writeText(window.location.href);
        alert('주소가 복사되었습니다. 사파리나 크롬 주소창에 붙여넣어주세요.');
    };

    if (isBlocked) {
        return (
            <div className="fixed inset-0 z-[9999] bg-slate-900 text-white flex flex-col items-center justify-center p-6 text-center">
                <div className="max-w-md w-full space-y-8">
                    <div className="space-y-4">
                        <h1 className="text-2xl font-bold text-yellow-400">🚨 외부 브라우저를 이용해주세요</h1>
                        <p className="text-slate-300 leading-relaxed">
                            카카오톡/라인 등 <strong>인앱 브라우저</strong>에서는<br />
                            구글 보안 정책으로 인해 로그인이 불가능합니다.
                        </p>
                    </div>

                    <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 animate-pulse">
                        {isIOS() ? (
                            <div className="space-y-4">
                                <p className="font-semibold text-lg text-indigo-300">아이폰(iOS) 사용자</p>
                                <ol className="text-sm text-left list-decimal list-inside space-y-2 text-slate-300">
                                    <li>화면 상단(또는 하단)의 <span className="inline-block bg-slate-700 px-2 py-0.5 rounded">...</span> 또는 <span className="inline-block bg-slate-700 px-2 py-0.5 rounded">공유</span> 버튼 클릭</li>
                                    <li><span className="text-white font-bold">Safari로 열기</span> 선택</li>
                                </ol>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <p className="font-semibold text-lg text-indigo-300">안드로이드 사용자</p>
                                <p className="text-sm text-slate-400">
                                    자동으로 크롬 브라우저가 열리지 않았다면,<br />
                                    우측 상단 메뉴에서 <strong>다른 브라우저로 열기</strong>를 선택해주세요.
                                </p>
                            </div>
                        )}
                    </div>

                    <div className="pt-4">
                        <button
                            onClick={handleCopyLink}
                            className="flex items-center justify-center gap-2 w-full py-3 px-4 bg-white text-slate-900 rounded-xl font-bold hover:bg-slate-100 transition-colors"
                        >
                            <Copy size={20} />
                            링크 복사하기
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return children;
};

export default InAppBrowserGuard;
