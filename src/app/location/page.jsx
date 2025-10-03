"use client";
import { useEffect, useRef, useState } from "react";
import { useFirebase } from "@/context/Firebase";
import {
    ref,
    set,
    serverTimestamp
} from "firebase/database";

export default function ShareLocation() {
    const { user, loading, signInWithGoogle, database } = useFirebase();
    const [isSharing, setIsSharing] = useState(false);
    const watchIdRef = useRef(null);

    const handleSignIn = async () => {
        try {
            await signInWithGoogle();
        } catch (error) {
            console.error('Sign in error:', error);
        }
    };

    const startSharing = () => {
        if (!user) return alert("Please sign in first!");

        setIsSharing(true);
        watchIdRef.current = navigator.geolocation.watchPosition(
            async (pos) => {
                try {
                    const { latitude, longitude } = pos.coords;
                    const locationRef = ref(database, `locations/${user.uid}`);
                    await set(locationRef, {
                        lat: latitude,
                        lng: longitude,
                        lastUpdated: serverTimestamp(),
                        isSharing: true,
                        name: user.displayName || user.email,
                        uid: user.uid
                    });
                } catch (error) {
                    console.error('Error updating location:', error);
                }
            },
            (err) => {
                console.error('Geolocation error:', err);
                alert('Error getting location. Please check your location permissions.');
                setIsSharing(false);
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 60000
            }
        );
    };

    const stopSharing = async () => {
        if (watchIdRef.current) {
            navigator.geolocation.clearWatch(watchIdRef.current);
            watchIdRef.current = null;
        }

        setIsSharing(false);

        if (user) {
            try {
                const locationRef = ref(database, `locations/${user.uid}`);
                await set(locationRef, {
                    isSharing: false,
                    lastUpdated: serverTimestamp(),
                    name: user.displayName || user.email,
                    uid: user.uid
                });
            } catch (error) {
                console.error('Error stopping location sharing:', error);
            }
        }
    };

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (watchIdRef.current) {
                navigator.geolocation.clearWatch(watchIdRef.current);
            }
        };
    }, []);

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="container mx-auto px-4">
                <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg p-6">
                    <h1 className="text-2xl font-bold text-gray-800 mb-6 text-center">
                        Share Location
                    </h1>

                    {!user ? (
                        <div className="text-center">
                            <p className="text-gray-600 mb-4">
                                Sign in to start sharing your location
                            </p>
                            <button
                                onClick={handleSignIn}
                                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                            >
                                Sign in with Google
                            </button>
                        </div>
                    ) : (
                        <div>
                            <div className="text-center mb-6">
                                <p className="text-gray-700 mb-2">
                                    Signed in as <strong>{user.displayName || user.email}</strong>
                                </p>
                                <div className={`inline-block px-3 py-1 rounded-full text-sm ${isSharing
                                        ? 'bg-green-100 text-green-800'
                                        : 'bg-gray-100 text-gray-800'
                                    }`}>
                                    {isSharing ? 'Sharing Location' : 'Not Sharing'}
                                </div>
                            </div>

                            <div className="space-y-4">
                                {!isSharing ? (
                                    <button
                                        onClick={startSharing}
                                        className="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition-colors font-medium"
                                    >
                                        Start Sharing Location
                                    </button>
                                ) : (
                                    <button
                                        onClick={stopSharing}
                                        className="w-full bg-red-600 text-white py-3 rounded-lg hover:bg-red-700 transition-colors font-medium"
                                    >
                                        Stop Sharing Location
                                    </button>
                                )}

                                <div className="text-sm text-gray-500 text-center">
                                    <p>
                                        Your location will be shared securely with other users
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
