'use client';

import { useFirebase } from '../context/Firebase';

const AuthButton = () => {
    const { user, loading, error, signInWithGoogle, logout, clearError } = useFirebase();

    const handleSignIn = async () => {
        try {
            await signInWithGoogle();
        } catch (error) {
            console.error('Sign-in failed:', error);
        }
    };

    const handleSignOut = async () => {
        try {
            await logout();
        } catch (error) {
            console.error('Sign-out failed:', error);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center p-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                <span className="ml-2">Loading...</span>
            </div>
        );
    }

    if (user) {
        return (
            <div className="flex items-center space-x-4 p-4 bg-green-50 rounded-lg border border-green-200">
                {user.photoURL && (
                    <img
                        src={user.photoURL}
                        alt="Profile"
                        className="w-10 h-10 rounded-full"
                    />
                )}
                <div className="flex-1">
                    <p className="font-medium text-green-800">
                        Welcome, {user.displayName || user.email}!
                    </p>
                    <p className="text-sm text-green-600">{user.email}</p>
                </div>
                <button
                    onClick={handleSignOut}
                    className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors"
                >
                    Sign Out
                </button>
            </div>
        );
    }

    return (
        <div className="p-4">
            {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
                    <div className="flex justify-between items-center">
                        <p className="text-sm text-red-600">{error}</p>
                        <button
                            onClick={clearError}
                            className="text-red-400 hover:text-red-600"
                        >
                            ×
                        </button>
                    </div>
                </div>
            )}

            <button
                onClick={handleSignIn}
                disabled={loading}
                className="w-full flex items-center justify-center px-4 py-3 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                    <path
                        fill="currentColor"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                        fill="currentColor"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                        fill="currentColor"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                        fill="currentColor"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                </svg>
                Sign in with Google
            </button>
        </div>
    );
};

export default AuthButton;