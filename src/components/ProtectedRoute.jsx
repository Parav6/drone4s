// 'use client';

import { redirect } from 'next/navigation';
import { useFirebase } from '../context/Firebase';

const ProtectedRoute = ({ children, fallback = null }) => {
    const { user, loading } = useFirebase();

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
                <span className="ml-3 text-lg">Loading...</span>
            </div>
        );
    }

    if (!user) {
        return fallback || (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">
                        Authentication Required
                    </h2>
                    <p className="text-gray-600">
                        Please sign in to access this page.
                    </p>
                </div>
            </div>
        );
        // redirect('/login'); // Redirect to home or login page
    }

    return children;
};

export default ProtectedRoute;