import React from 'react';
import { Heart } from 'lucide-react';

const customStyles = `
    @keyframes spin {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
    }
    
    @keyframes pulse {
        0%, 100% { transform: scale(1); opacity: 1; }
        50% { transform: scale(1.2); opacity: 0.5; }
    }
    
    @keyframes bounce {
        0%, 100% { transform: translateY(0); }
        50% { transform: translateY(-10px); }
    }
    
    @keyframes float {
        0%, 100% { transform: translateY(0px); }
        50% { transform: translateY(-20px); }
    }
    
    @keyframes slideIn {
        from { opacity: 0; transform: translateY(20px); }
        to { opacity: 1; transform: translateY(0); }
    }
    
    .heart-rotate {
        animation: spin 3s linear infinite;
    }
    
    .heart-pulse {
        animation: pulse 1.5s ease-in-out infinite;
    }
    
    .dot-bounce {
        animation: bounce 1s ease-in-out infinite;
    }
`;

export default function Loading() {
    return (
        <>
            <style>{customStyles}</style>
            
            <div className="min-h-screen w-full bg-black flex items-center justify-center overflow-hidden relative">
                
                {/* Background Glow Elements (Responsive & Subtle) */}
                <div className="absolute top-[-10%] left-[-10%] w-72 h-72 bg-sky-400/10 blur-[100px] rounded-full"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-72 h-72 bg-blue-900/20 blur-[100px] rounded-full"></div>

                {/* Main Container */}
                <div className="flex flex-col items-center justify-center gap-8 z-10">
                    
                    {/* Animated Hearts Circle */}
                    <div className="relative w-32 h-32">
                        {/* Center Heart */}
                        <div className="absolute inset-0 flex items-center justify-center heart-pulse">
                            <Heart className="w-12 h-12 text-sky-400 fill-sky-400" />
                        </div>
                        
                        {/* Rotating Hearts */}
                        <div className="absolute inset-0 heart-rotate">
                            <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-2">
                                <Heart className="w-6 h-6 text-sky-500 fill-sky-500" />
                            </div>
                            <div className="absolute right-0 top-1/2 transform translate-x-2 -translate-y-1/2">
                                <Heart className="w-6 h-6 text-blue-600 fill-blue-600" />
                            </div>
                            <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-2">
                                <Heart className="w-6 h-6 text-sky-500 fill-sky-500" />
                            </div>
                            <div className="absolute left-0 top-1/2 transform -translate-x-2 -translate-y-1/2">
                                <Heart className="w-6 h-6 text-blue-600 fill-blue-600" />
                            </div>
                        </div>
                        
                        {/* Outer Rings */}
                        <div className="absolute inset-0 border-2 border-sky-400/20 rounded-full" style={{ animation: 'spin 4s linear infinite' }}></div>
                        <div className="absolute inset-4 border-2 border-blue-600/10 rounded-full" style={{ animation: 'spin 6s linear infinite reverse' }}></div>
                    </div>
                    
                    {/* Text with Animation */}
                    <div className="text-center px-4" style={{ animation: 'slideIn 0.8s ease-out' }}>
                        <h2 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-sky-400 to-blue-600 bg-clip-text text-transparent mb-2 tracking-tight">
                            Finding Your Match
                        </h2>
                        <p className="text-gray-400 text-lg">Loading amazing people...</p>
                    </div>
                    
                    {/* Bouncing Dots */}
                    <div className="flex gap-2">
                        <div className="w-3 h-3 bg-sky-400 rounded-full dot-bounce" style={{ animationDelay: '0s' }}></div>
                        <div className="w-3 h-3 bg-sky-500 rounded-full dot-bounce" style={{ animationDelay: '0.2s' }}></div>
                        <div className="w-3 h-3 bg-blue-600 rounded-full dot-bounce" style={{ animationDelay: '0.4s' }}></div>
                    </div>
                </div>
                
                {/* Bottom Text */}
                <div className="absolute bottom-10 text-center text-gray-500">
                    <p className="text-sm font-medium tracking-widest uppercase opacity-60">
                        💙 Connecting Hearts Together
                    </p>
                </div>
            </div>
        </>
    );
}