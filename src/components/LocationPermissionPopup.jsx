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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg p-6 max-w-sm w-full shadow-xl">
                <div className="text-center">
                    <div className="text-6xl mb-4">🚨</div>
                    <h2 className="text-xl font-bold text-gray-900 mb-2">
                        Emergency SOS
                    </h2>
                    <p className="text-gray-600 mb-6">
                        Please enable location access to activate emergency tracking.
                    </p>
                    <div className="space-y-3">
                        <button
                            onClick={requestLocationPermission}
                            disabled={isRequesting}
                            className="w-full px-4 py-3 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isRequesting ? (
                                <div className="flex items-center justify-center space-x-2">
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                    <span>Requesting...</span>
                                </div>
                            ) : (
                                <>🌍 Enable Location</>
                            )}
                        </button>
                        <button
                            onClick={onClose}
                            disabled={isRequesting}
                            className="w-full px-4 py-3 bg-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-400 transition-colors disabled:opacity-50"
                        >
                            Cancel
                        </button>
                    </div>
                </div>

                {/* Emergency Instructions */}
                <div className="mt-6 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <h4 className="font-semibold text-yellow-800 text-sm mb-1">If location is blocked:</h4>
                    <ol className="text-xs text-yellow-700 space-y-1 ml-4 list-decimal">
                        <li>Click the location icon (🌍) in browser address bar</li>
                        <li>Select "Allow" or "Always allow"</li>
                        <li>Refresh and try again</li>
                    </ol>
                </div>
            </div>
        </div>
    );
}