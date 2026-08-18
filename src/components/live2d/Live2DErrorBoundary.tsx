import React, { Component, ReactNode } from 'react';

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
    onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

/**
 * Error Boundary for Live2D components.
 * If Live2D fails to load or crashes, this will catch the error
 * and display a fallback UI instead of crashing the entire app.
 */
export class Live2DErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        console.error('[Live2DErrorBoundary] Caught error:', error, errorInfo);
        this.props.onError?.(error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            // Fallback UI
            return this.props.fallback || (
                <div className="w-full h-full flex items-center justify-center bg-slate-900/80 rounded-xl border border-red-500/30">
                    <div className="text-center p-4 space-y-2">
                        <div className="text-4xl">⚠️</div>
                        <div className="text-red-400 font-mono text-sm">Live2D 加载失败</div>
                        <div className="text-gray-500 text-xs max-w-[200px]">
                            {this.state.error?.message || '未知错误'}
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
