"use client";
import React, { useState, useRef, useEffect } from "react";
import { useFirebase } from "@/context/Firebase";
import { ref, set, serverTimestamp } from "firebase/database";
import LocationPermissionPopup from "./LocationPermissionPopup";

export default function SOSButton() {
    const { user, database } = useFirebase();
    const [isSOSActive, setIsSOSActive] = useState(false);
    const [showLocationPopup, setShowLocationPopup] = useState(false);
    const [showSOSConfirm, setShowSOSConfirm] = useState(false);
    const [showCancelConfirm, setShowCancelConfirm] = useState(false);
    const [currentLocation, setCurrentLocation] = useState(null);
    const watchIdRef = useRef(null);

    const handleSOSClick = async () => {
        if (!user) {
            alert("Please sign in first to use SOS!");
            return;
        }

        // Show confirmation popup first
        setShowSOSConfirm(true);
    };

    const confirmSOS = async () => {
        setShowSOSConfirm(false);

        // Check if geolocation is available
        if (!navigator.geolocation) {
            alert("Location services not supported by this browser!");
            return;
        }

        // Try to get location immediately
        navigator.geolocation.getCurrentPosition(
            (position) => {
                // Permission granted - start SOS tracking
                startSOSTracking(position);
            },
            (error) => {
                // Permission denied or error - show popup
                console.log('Location error:', error);
                setShowLocationPopup(true);
            },
            {
                enableHighAccuracy: true,
                timeout: 5000,
                maximumAge: 0
            }
        );
    };

    const startSOSTracking = (initialPosition = null) => {
        setIsSOSActive(true);
        setShowLocationPopup(false);

        if (initialPosition) {
            updateSOSLocation(initialPosition);
        }

        // Start continuous tracking
        watchIdRef.current = navigator.geolocation.watchPosition(
            (position) => {
                updateSOSLocation(position);
            },
            (error) => {
                console.error('SOS tracking error:', error);
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 60000
            }
        );

        console.log("🚨 SOS ACTIVATED - Location tracking started");
    };

    const updateSOSLocation = async (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        const timestamp = Date.now();

        const sosData = {
            userId: user.uid,
            userName: user.displayName || user.email,
            latitude: latitude,
            longitude: longitude,
            accuracy: accuracy,
            timestamp: serverTimestamp(),
            status: 'ACTIVE',
            lastUpdate: new Date(timestamp).toISOString()
        };

        try {
            // Save to Firebase under SOS collection
            const sosRef = ref(database, `sos/${user.uid}`);
            await set(sosRef, sosData);

            setCurrentLocation({
                lat: latitude,
                lng: longitude,
                accuracy: accuracy,
                timestamp: timestamp
            });

            console.log("📍 SOS Location updated:", latitude, longitude);
        } catch (error) {
            console.error("Error updating SOS location:", error);
        }
    };

    const stopSOS = () => {
        // Show cancel confirmation popup
        setShowCancelConfirm(true);
    };

    const confirmCancelSOS = async () => {
        setShowCancelConfirm(false);

        if (watchIdRef.current) {
            navigator.geolocation.clearWatch(watchIdRef.current);
            watchIdRef.current = null;
        }

        setIsSOSActive(false);
        setCurrentLocation(null);

        // Update status to inactive in database
        if (user) {
            try {
                const sosRef = ref(database, `sos/${user.uid}`);
                await set(sosRef, {
                    userId: user.uid,
                    status: 'INACTIVE',
                    timestamp: serverTimestamp(),
                    lastUpdate: new Date().toISOString()
                });
            } catch (error) {
                console.error("Error stopping SOS:", error);
            }
        }

        console.log("✅ SOS DEACTIVATED");
    };

    const handleLocationPermissionGranted = (position) => {
        startSOSTracking(position);
    };

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (watchIdRef.current) {
                navigator.geolocation.clearWatch(watchIdRef.current);
            }
        };
    }, []);

    return (
        <>
            {/* Main SOS Button Area - Fixed to bottom right */}
            <div className="fixed bottom-6 right-6 z-50">
                {!isSOSActive ? (
                    <button
                        onClick={handleSOSClick}
                        className="w-16 h-16 bg-red-600 hover:bg-red-700 text-white rounded-full shadow-lg transition-all duration-200 hover:scale-110 focus:outline-none focus:ring-4 focus:ring-red-300"
                    >
                        <span className="text-2xl font-bold">SOS</span>
                    </button>
                ) : (
                    <div className="flex flex-col items-center space-y-2">
                        {/* Active SOS Status */}
                        <div className="bg-green-600 text-white px-4 py-2 rounded-lg shadow-lg animate-pulse">
                            <div className="flex items-center space-x-2">
                                <div className="text-lg">🚨</div>
                                <div className="text-center">
                                    <div className="font-bold text-sm">SOS ACTIVE</div>
                                    <div className="text-xs opacity-90">Help is on way!</div>
                                    {currentLocation && (
                                        <div className="text-xs opacity-75">
                                            {currentLocation.lat.toFixed(4)}, {currentLocation.lng.toFixed(4)}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                        {/* Stop SOS Button */}
                        <button
                            onClick={stopSOS}
                            className="w-12 h-12 bg-red-600 hover:bg-red-700 text-white rounded-full shadow-lg transition-all duration-200 hover:scale-110 focus:outline-none focus:ring-4 focus:ring-red-300"
                        >
                            <span className="text-lg">✕</span>
                        </button>
                    </div>
                )}
            </div>

            {/* SOS Cancel Confirmation Popup */}
            {showCancelConfirm && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg p-6 max-w-sm w-full shadow-xl">
                        <div className="text-center">
                            <div className="text-6xl mb-4">⚠️</div>
                            <h2 className="text-xl font-bold text-gray-900 mb-2">
                                Cancel SOS?
                            </h2>
                            <p className="text-gray-600 mb-6">
                                Are you sure you want to stop emergency tracking? Help may already be on the way.
                            </p>
                            <div className="space-y-3">
                                <button
                                    onClick={confirmCancelSOS}
                                    className="w-full px-4 py-3 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition-colors"
                                >
                                    🛑 YES, STOP SOS
                                </button>
                                <button
                                    onClick={() => setShowCancelConfirm(false)}
                                    className="w-full px-4 py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors"
                                >
                                    ✅ KEEP SOS ACTIVE
                                </button>
                            </div>
                        </div>

                        {/* Emergency Note */}
                        <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                            <p className="text-xs text-yellow-700 text-center">
                                <strong>Important:</strong> If help is already dispatched, contact emergency services directly.
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* SOS Confirmation Popup */}
            {showSOSConfirm && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg p-6 max-w-sm w-full shadow-xl">
                        <div className="text-center">
                            <div className="text-6xl mb-4">🚨</div>
                            <h2 className="text-xl font-bold text-gray-900 mb-2">
                                Emergency SOS
                            </h2>
                            <p className="text-gray-600 mb-6">
                                Are you sure you need emergency assistance? This will activate location tracking and alert emergency services.
                            </p>
                            <div className="space-y-3">
                                <button
                                    onClick={confirmSOS}
                                    className="w-full px-4 py-3 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition-colors"
                                >
                                    🚨 YES, I NEED HELP
                                </button>
                                <button
                                    onClick={() => setShowSOSConfirm(false)}
                                    className="w-full px-4 py-3 bg-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-400 transition-colors"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>

                        {/* Emergency Note */}
                        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                            <p className="text-xs text-red-700 text-center">
                                <strong>Note:</strong> Only use for real emergencies. False alarms may result in charges.
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Location Permission Popup */}
            <LocationPermissionPopup
                isOpen={showLocationPopup}
                onClose={() => setShowLocationPopup(false)}
                onPermissionGranted={handleLocationPermissionGranted}
            />
        </>
    );
}