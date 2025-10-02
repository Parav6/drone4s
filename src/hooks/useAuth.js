'use client';

import { useFirebase } from '../context/Firebase';

/**
 * Custom hook for Firebase authentication with additional utilities
 * @returns {Object} Authentication state and methods
 */
export const useAuth = () => {
    const {
        user,
        userProfile,
        loading,
        error,
        signInWithGoogle,
        signInWithGoogleRedirect,
        logout,
        clearError,
        isAuthenticated,
        isAdmin,
        isModerator,
        updateUserRole,
        getUserById,
        getAllUsers
    } = useFirebase();

    /**
     * Sign in with Google with error handling
     * @param {boolean} useRedirect - Whether to use redirect instead of popup
     * @returns {Promise<Object|null>} User object or null if failed
     */
    const signIn = async (useRedirect = false) => {
        try {
            if (useRedirect) {
                await signInWithGoogleRedirect();
                return null; // Redirect doesn't return user immediately
            } else {
                const user = await signInWithGoogle();
                return user;
            }
        } catch (error) {
            console.error('Sign-in error:', error);
            return null;
        }
    };

    /**
     * Sign out with error handling
     * @returns {Promise<boolean>} Success status
     */
    const signOut = async () => {
        try {
            await logout();
            return true;
        } catch (error) {
            console.error('Sign-out error:', error);
            return false;
        }
    };

    /**
     * Get user display information
     * @returns {Object} User display data
     */
    const getUserDisplayInfo = () => {
        if (!user) return null;

        return {
            name: user.displayName || user.email?.split('@')[0] || 'Anonymous',
            email: user.email,
            avatar: user.photoURL,
            initials: user.displayName
                ? user.displayName.split(' ').map(n => n[0]).join('').toUpperCase()
                : user.email?.[0]?.toUpperCase() || 'U'
        };
    };

    /**
     * Check if user has specific permissions or roles
     * @param {string} permission - Permission to check
     * @returns {boolean} Whether user has permission
     */
    const hasPermission = (permission) => {
        if (!isAuthenticated) return false;

        const userRole = user?.role || 'user';

        switch (permission) {
            case 'admin':
                return userRole === 'admin';
            case 'moderator':
                return ['admin', 'moderator'].includes(userRole);
            case 'user':
                return ['admin', 'moderator', 'user'].includes(userRole);
            default:
                return false;
        }
    };

    /**
     * Check if user can manage other users
     * @returns {boolean} Whether user can manage users
     */
    const canManageUsers = () => {
        return isAdmin;
    };

    /**
     * Check if user can moderate content
     * @returns {boolean} Whether user can moderate
     */
    const canModerate = () => {
        return isModerator;
    };

    return {
        // User state
        user,
        userProfile,
        loading,
        error,
        isAuthenticated,
        isAdmin,
        isModerator,

        // Enhanced methods
        signIn,
        signOut,
        clearError,

        // Database methods
        updateUserRole,
        getUserById,
        getAllUsers,

        // Utility methods
        getUserDisplayInfo,
        hasPermission,
        canManageUsers,
        canModerate,

        // Raw Firebase methods (for advanced use)
        signInWithGoogle,
        signInWithGoogleRedirect,
        logout
    };
};

export default useAuth;