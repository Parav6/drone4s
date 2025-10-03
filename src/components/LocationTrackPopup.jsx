"use client";
import React, { useState } from "react";

export default function LocationPermissionPopup({ isOpen, onClose, onPermissionGranted }) {
    const [isRequesting, setIsRequesting] = useState(false);

    const requestLocationPermission = () => {
        setIsRequesting(true);

        if (!navigator.geolocation) {
            alert("Location services not supported by this browser!");
            setIsRequesting(false);
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                // Permission granted
                console.log('Location permission granted:', position.coords);
                setIsRequesting(false);
                onPermissionGranted(position);
                onClose();
            },
            (error) => {
                // Permission denied or error
                console.log('Location permission error:', error);
                setIsRequesting(false);

                switch (error.code) {
                    case error.PERMISSION_DENIED:
                        alert("Location access denied. Please enable location in browser settings and try again.");
                        break;
                    case error.POSITION_UNAVAILABLE:
                        alert("Location information is unavailable. Please check your GPS/internet connection.");
                        break;
                    case error.TIMEOUT:
                        alert("Location request timed out. Please try again.");
                        break;
                    default:
                        alert("An error occurred while accessing location. Please try again.");
                        break;
                }
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 0
            }
        );
    };

    if (!isOpen) return null;

    return (
        <>
            {/* Main SOS Button */}
            <div className="fixed bottom-6 right-6 z-50">
                {!isSOSActive ? (
                    <button
                        onClick={handleSOSClick}
                        className="w-16 h-16 bg-red-600 hover:bg-red-700 text-white rounded-full shadow-lg transition-all duration-200 hover:scale-110 focus:outline-none focus:ring-4 focus:ring-red-300"
                    >
                        <span className="text-2xl font-bold">SOS</span>
                    </button>
                ) : (
                    <button
                        onClick={stopSOS}
                        className="w-16 h-16 bg-green-600 hover:bg-green-700 text-white rounded-full shadow-lg transition-all duration-200 hover:scale-110 focus:outline-none focus:ring-4 focus:ring-green-300 animate-pulse"
                    >
                        <span className="text-xl">✓</span>
                    </button>
                )}
            </div>

            {/* Location Permission Prompt */}
            {showLocationPrompt && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg p-6 max-w-sm w-full">
                        <div className="text-center">
                            <div className="text-6xl mb-4">�</div>
                            <h2 className="text-xl font-bold text-gray-900 mb-2">
                                Emergency SOS
                            </h2>
                            <p className="text-gray-600 mb-6">
                                Please enable location access to activate SOS tracking.
                            </p>
                            <div className="space-y-3">
                                <button
                                    onClick={enableLocation}
                                    className="w-full px-4 py-3 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition-colors"
                                >
                                    🌍 Enable Location
                                </button>
                                <button
                                    onClick={() => setShowLocationPrompt(false)}
                                    className="w-full px-4 py-3 bg-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-400 transition-colors"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* SOS Status Indicator */}
            {isSOSActive && currentLocation && (
                <div className="fixed top-4 left-4 bg-red-600 text-white p-3 rounded-lg shadow-lg z-40">
                    <div className="flex items-center space-x-2">
                        <div className="animate-pulse">🚨</div>
                        <div>
                            <div className="font-bold text-sm">SOS ACTIVE</div>
                            <div className="text-xs opacity-90">
                                {currentLocation.lat.toFixed(4)}, {currentLocation.lng.toFixed(4)}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
