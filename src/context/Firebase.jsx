"use client";
import { createContext, useContext, useState, useEffect } from "react";
import { initializeApp } from "firebase/app";
import {
    getAuth,
    GoogleAuthProvider,
    signInWithPopup,
    signInWithRedirect,
    getRedirectResult,
    signOut,
    onAuthStateChanged
} from "firebase/auth";
import {
    getDatabase,
    ref,
    set,
    get,
    onValue,
    serverTimestamp
} from "firebase/database";

const FirebaseContext = createContext(null);

const firebaseConfig = {
    apiKey: "AIzaSyBBWG3nQIXH_f7cWxWjyMOURT_Kq4V4wOY",
    authDomain: "drone4s-406d4.firebaseapp.com",
    databaseURL: "https://drone4s-406d4-default-rtdb.asia-southeast1.firebasedatabase.app/",
    projectId: "drone4s-406d4",
    storageBucket: "drone4s-406d4.firebasestorage.app",
    messagingSenderId: "283191484161",
    appId: "1:283191484161:web:c104d33345a7e712f94500",
    measurementId: "G-FCGSEWZSJ8"
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);
const firebaseAuth = getAuth(app);
const database = getDatabase(app);
const googleProvider = new GoogleAuthProvider();

// Configure Google Provider
googleProvider.setCustomParameters({
    prompt: 'select_account',
    // Force popup instead of redirect
    display: 'popup'
});

// Add popup configuration to handle cancellation better
googleProvider.addScope('email');
googleProvider.addScope('profile');

export const useFirebase = () => useContext(FirebaseContext);

export const FirebaseProvider = (props) => {
    const [user, setUser] = useState(null);
    const [userProfile, setUserProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Create or update user in database
    const createOrUpdateUser = async (authUser) => {
        try {
            const userRef = ref(database, `users/${authUser.uid}`);

            // Check if user already exists
            const snapshot = await get(userRef);
            const existingUser = snapshot.val();

            const userData = {
                uid: authUser.uid,
                email: authUser.email,
                displayName: authUser.displayName,
                photoURL: authUser.photoURL,
                emailVerified: authUser.emailVerified,
                lastLogin: serverTimestamp(),
                ...(existingUser || {
                    role: 'user', // Default role for new users
                    createdAt: serverTimestamp()
                })
            };

            await set(userRef, userData);
            return userData;
        } catch (error) {
            console.error('Error creating/updating user:', error);
            throw error;
        }
    };

    // Listen for user profile changes in database
    const listenToUserProfile = (uid) => {
        const userRef = ref(database, `users/${uid}`);

        const unsubscribe = onValue(userRef, (snapshot) => {
            const userData = snapshot.val();
            if (userData) {
                setUserProfile(userData);
                setUser({
                    uid: userData.uid,
                    email: userData.email,
                    displayName: userData.displayName,
                    photoURL: userData.photoURL,
                    emailVerified: userData.emailVerified,
                    role: userData.role || 'user',
                    createdAt: userData.createdAt,
                    lastLogin: userData.lastLogin
                });
            }
        }, (error) => {
            console.error('Error listening to user profile:', error);
        });

        return unsubscribe;
    };

    // Listen for authentication state changes
    useEffect(() => {
        let profileUnsubscribe = null;

        const authUnsubscribe = onAuthStateChanged(firebaseAuth, async (authUser) => {
            setLoading(true);

            if (authUser) {
                try {
                    // Create or update user in database
                    await createOrUpdateUser(authUser);

                    // Listen to user profile changes
                    profileUnsubscribe = listenToUserProfile(authUser.uid);
                } catch (error) {
                    console.error('Error handling auth state change:', error);
                    setError(error.message);
                    setUser(null);
                    setUserProfile(null);
                }
            } else {
                // User signed out
                setUser(null);
                setUserProfile(null);
                if (profileUnsubscribe) {
                    profileUnsubscribe();
                    profileUnsubscribe = null;
                }
            }
            setLoading(false);
        });

        return () => {
            authUnsubscribe();
            if (profileUnsubscribe) {
                profileUnsubscribe();
            }
        };
    }, []);

    // Check for redirect result on component mount
    useEffect(() => {
        getRedirectResult(firebaseAuth)
            .then((result) => {
                if (result) {
                    // User signed in via redirect
                    console.log('User signed in via redirect:', result.user);
                }
            })
            .catch((error) => {
                console.error('Redirect sign-in error:', error);
                setError(error.message);
            });
    }, []);

    // Sign in with Google popup
    const signInWithGoogle = async () => {
        try {
            setError(null);

            // Clear any existing auth errors before attempting sign-in
            await firebaseAuth.authStateReady();

            const result = await signInWithPopup(firebaseAuth, googleProvider);
            return result.user;
        } catch (error) {
            console.error('Google sign-in error:', error);

            // Handle different types of popup cancellation/blocking
            const cancellationCodes = [
                'auth/cancelled-popup-request',
                'auth/popup-closed-by-user',
                'auth/popup-blocked',
                'auth/operation-not-allowed',
                'auth/user-cancelled'
            ];

            // Check if it's a cancellation
            if (cancellationCodes.includes(error.code) ||
                error.message?.includes('popup') ||
                error.message?.includes('cancelled') ||
                error.message?.includes('closed')) {

                console.log('User cancelled sign-in or popup was blocked:', error.code);
                // Don't set error state for cancellations
                return null;
            }

            // For actual authentication errors
            console.error('Actual authentication error:', error.code, error.message);
            setError(error.message);
            throw error;
        } finally {
            setLoading(false);
        }
    };

    // Sign in with Google redirect (for mobile/compatibility)
    const signInWithGoogleRedirect = async () => {
        try {
            setError(null);
            await signInWithRedirect(firebaseAuth, googleProvider);
        } catch (error) {
            console.error('Google redirect sign-in error:', error);
            setError(error.message);
            throw error;
        }
    };

    // Sign out
    const logout = async () => {
        try {
            setError(null);
            await signOut(firebaseAuth);
        } catch (error) {
            console.error('Sign-out error:', error);
            setError(error.message);
            throw error;
        }
    };

    // Clear error
    const clearError = () => setError(null);

    // Clear any pending auth operations (useful for popup cancellations)
    const clearAuthState = () => {
        setError(null);
        setLoading(false);
    };

    // Update user role (admin function)
    const updateUserRole = async (uid, newRole) => {
        try {
            const userRef = ref(database, `users/${uid}`);
            const updates = {
                role: newRole,
                roleUpdatedAt: serverTimestamp()
            };
            await set(userRef, { ...userProfile, ...updates });
            return true;
        } catch (error) {
            console.error('Error updating user role:', error);
            setError(error.message);
            throw error;
        }
    };

    // Get user by UID
    const getUserById = async (uid) => {
        try {
            const userRef = ref(database, `users/${uid}`);
            const snapshot = await get(userRef);
            return snapshot.val();
        } catch (error) {
            console.error('Error getting user:', error);
            throw error;
        }
    };

    // Get all users (admin function)
    const getAllUsers = async () => {
        try {
            const usersRef = ref(database, 'users');
            const snapshot = await get(usersRef);
            return snapshot.val();
        } catch (error) {
            console.error('Error getting all users:', error);
            throw error;
        }
    };

    const value = {
        // Firebase instances
        app,
        auth: firebaseAuth,
        database,

        // User state
        user,
        userProfile,
        loading,
        error,

        // Auth methods
        signInWithGoogle,
        signInWithGoogleRedirect,
        logout,
        clearError,
        clearAuthState,

        // Database methods
        createOrUpdateUser,
        updateUserRole,
        getUserById,
        getAllUsers,

        // Utility methods
        isAuthenticated: !!user,
        isAdmin: user?.role === 'admin',
        isModerator: user?.role === 'moderator' || user?.role === 'admin'
    };

    return (
        <FirebaseContext.Provider value={value}>
            {props.children}
        </FirebaseContext.Provider>
    );
}