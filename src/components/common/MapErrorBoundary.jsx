import React from 'react';
import { RefreshCcw } from 'lucide-react';

class MapErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        console.error("Map Area Crashed:", error, errorInfo);
    }

    handleRetry = () => {
        this.setState({ hasError: false, error: null });
        window.location.reload(); // Hard refresh to clear Naver gl context if needed
    };

    render() {
        if (this.state.hasError) {
            return (
                <div className="h-60 bg-red-50 flex flex-col items-center justify-center p-4 text-center border-b border-red-100">
                    <div className="bg-red-100 p-3 rounded-full mb-3">
                        <span className="text-2xl">🗺️💀</span>
                    </div>
                    <h3 className="text-red-800 font-bold mb-1">지도 시스템 오류</h3>
                    <p className="text-xs text-red-600 mb-4 max-w-xs break-keep">
                        {this.state.error?.message || "알 수 없는 오류가 발생했습니다."}
                    </p>
                    <button
                        onClick={this.handleRetry}
                        className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-full text-sm font-bold shadow-md hover:bg-red-700 transition"
                    >
                        <RefreshCcw size={16} /> 지도 다시 불러오기
                    </button>
                    <p className="mt-4 text-[10px] text-slate-400">
                        지도 모듈을 격리하여 앱 충돌을 방지했습니다.
                    </p>
                </div>
            );
        }

        return this.props.children;
    }
}

export default MapErrorBoundary;
