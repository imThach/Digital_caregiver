import React from 'react';
import Lottie from 'lottie-react';

class LottieErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError() {
        return { hasError: true };
    }

    componentDidCatch(error, errorInfo) {
        console.warn('Lottie Animation Render Warning:', error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="flex h-full w-full items-center justify-center">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#0058be] border-t-transparent" />
                </div>
            );
        }
        return this.props.children;
    }
}

export function LottieAnimation({ animationData, className = "h-full w-full object-contain" }) {
    if (!animationData) {
        return (
            <div className="flex h-full w-full items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#0058be] border-t-transparent" />
            </div>
        );
    }

    return (
        <LottieErrorBoundary>
            <div className={className}>
                <Lottie
                    animationData={animationData}
                    loop={true}
                    autoplay={true}
                    style={{ width: '100%', height: '100%' }}
                />
            </div>
        </LottieErrorBoundary>
    );
}

export default LottieAnimation;
