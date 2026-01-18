import React, { useState, useEffect } from 'react';

const DynamicBackground: React.FC = () => {
    const [timeOfDay, setTimeOfDay] = useState<'morning' | 'noon' | 'afternoon' | 'night'>('morning');

    useEffect(() => {
        const updateTime = () => {
            const hour = new Date().getHours();
            // Morning: 5 AM - 10:59 AM
            if (hour >= 5 && hour < 11) setTimeOfDay('morning');
            // Noon: 11 AM - 3:59 PM (16:00)
            else if (hour >= 11 && hour < 16) setTimeOfDay('noon');
            // Afternoon/Sunset: 4 PM (16:00) - 6:59 PM (19:00)
            else if (hour >= 16 && hour < 19) setTimeOfDay('afternoon');
            // Night: 7 PM (19:00) - 4:59 AM
            else setTimeOfDay('night');

            // Toggle Dark Mode Class
            if (hour >= 19 || hour < 5) {
                document.documentElement.classList.add('dark');
            } else {
                document.documentElement.classList.remove('dark');
            }
        };

        updateTime();
        // Update every minute
        const interval = setInterval(updateTime, 60000);
        return () => clearInterval(interval);
    }, []);

    const getBackgroundStyle = () => {
        switch (timeOfDay) {
            case 'morning':
                // Soft morning sky: Light Blue to Cyan/White
                return { background: 'linear-gradient(to bottom, #87CEEB 0%, #E0F7FA 100%)' };
            case 'noon':
                // Bright Noon: Vivid Blue to White
                return { background: 'linear-gradient(to bottom, #4FC3F7 0%, #FFFFFF 100%)' };
            case 'afternoon':
                // Sunset: Orange to Purple/Pink
                return { background: 'linear-gradient(to bottom, #FF8C00 0%, #FFBD59 40%, #D68FBC 100%)' };
            case 'night':
                // Night: Deep Blue/Black
                return { background: 'linear-gradient(to bottom, #0B1026 0%, #2B32B2 100%)' };
            default:
                return { background: '#f8f9fa' };
        }
    };

    return (
        <div
            className="fixed inset-0 pointer-events-none transition-all duration-[3000ms] -z-50 overflow-hidden"
            style={getBackgroundStyle()}
        >
            {/* --- MORNING --- */}
            {timeOfDay === 'morning' && (
                <div className="absolute top-0 left-0 w-full h-full animate-in fade-in duration-[2000ms]">
                    {/* Sun rising (Generic soft glow) */}
                    <div className="absolute top-10 left-[10%] w-32 h-32 bg-yellow-100 rounded-full blur-[60px] opacity-60"></div>

                    {/* Clouds (SVG) */}
                    <div className="absolute top-[10%] left-[10%] animate-pulse duration-[8000ms] opacity-80">
                        <CloudIcon size={120} color="white" />
                    </div>
                    <div className="absolute top-[20%] right-[15%] animate-pulse duration-[10000ms] opacity-60 scale-75">
                        <CloudIcon size={120} color="white" />
                    </div>
                </div>
            )}

            {/* --- NOON --- */}
            {timeOfDay === 'noon' && (
                <div className="absolute top-0 left-0 w-full h-full animate-in fade-in duration-[2000ms]">
                    {/* Bright Sun */}
                    <div className="absolute top-10 right-10 animate-spin-slow" style={{ animationDuration: '30s' }}>
                        <div className="w-24 h-24 bg-yellow-300 rounded-full shadow-[0_0_80px_rgba(255,223,0,0.8)]"></div>
                    </div>
                    {/* Lens flare effect */}
                    <div className="absolute top-20 right-20 w-40 h-40 bg-white rounded-full blur-[80px] opacity-30"></div>
                </div>
            )}

            {/* --- AFTERNOON (Sunset) --- */}
            {timeOfDay === 'afternoon' && (
                <div className="absolute top-0 left-0 w-full h-full animate-in fade-in duration-[2000ms]">
                    {/* Sinking Sun */}
                    <div className="absolute bottom-[20%] left-1/2 transform -translate-x-1/2 w-48 h-48 bg-gradient-to-t from-red-500 to-yellow-500 rounded-full blur-[20px] opacity-80"></div>
                    {/* Horizon glow */}
                    <div className="absolute bottom-0 left-0 right-0 h-1/3 bg-gradient-to-t from-orange-600/40 to-transparent"></div>
                </div>
            )}

            {/* --- NIGHT --- */}
            {timeOfDay === 'night' && (
                <div className="absolute top-0 left-0 w-full h-full animate-in fade-in duration-[2000ms]">
                    <div className="absolute top-10 right-10">
                        {/* Moon */}
                        <div className="w-16 h-16 bg-gray-100/90 rounded-full shadow-[0_0_40px_rgba(255,255,255,0.4)] relative overflow-hidden">
                            <div className="absolute top-2 left-3 w-4 h-4 bg-gray-200/50 rounded-full"></div>
                            <div className="absolute bottom-4 right-4 w-6 h-6 bg-gray-200/50 rounded-full"></div>
                        </div>
                    </div>
                    {/* Stars */}
                    <div className="absolute top-[15%] left-[20%] w-1 h-1 bg-white rounded-full animate-pulse"></div>
                    <div className="absolute top-[25%] left-[50%] w-1.5 h-1.5 bg-white rounded-full animate-pulse delay-75"></div>
                    <div className="absolute top-[40%] left-[80%] w-1 h-1 bg-white rounded-full animate-pulse delay-150"></div>
                    <div className="absolute top-[5%] left-[60%] w-0.5 h-0.5 bg-white rounded-full animate-pulse delay-300"></div>
                    <div className="absolute bottom-[40%] left-[10%] w-1 h-1 bg-white rounded-full animate-pulse delay-500"></div>
                </div>
            )}
        </div>
    );
};

// Simple SVG Cloud Component
const CloudIcon = ({ size, color }: { size: number, color: string }) => (
    <svg width={size} height={size * 0.6} viewBox="0 0 100 60" fill={color} xmlns="http://www.w3.org/2000/svg">
        <path d="M25 50 Q10 50 10 35 Q10 20 25 20 Q30 5 50 5 Q70 5 75 20 Q90 20 90 35 Q90 50 75 50 Z" />
    </svg>
);

export default DynamicBackground;
