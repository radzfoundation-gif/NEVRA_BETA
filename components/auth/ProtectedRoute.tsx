import React from 'react';
import { useUser } from '@/lib/authContext';
import { Navigate, useLocation } from 'react-router-dom';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
    children: React.ReactNode;
    requireNickname?: boolean;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, requireNickname = true }) => {
    const { isLoaded, isSignedIn, user } = useUser();
    const location = useLocation();

    // Show loading state while checking authentication
    if (!isLoaded) {
        return (
            <div className="flex items-center justify-center h-screen bg-[#050505] text-white">
                <div className="text-center space-y-4">
                    <Loader2 className="w-12 h-12 mx-auto animate-spin text-purple-500" />
                    <p className="text-gray-400">Loading...</p>
                </div>
            </div>
        );
    }

    // Redirect to sign-in if not authenticated
    if (!isSignedIn) {
        return <Navigate to="/sign-in" state={{ from: location.pathname }} replace />;
    }

    // Redirect to nickname setup if nickname is missing
    if (requireNickname && user && !user.nickname) {
        return <Navigate to="/nickname" replace />;
    }

    // Render protected content
    return <>{children}</>;
};

export default ProtectedRoute;
