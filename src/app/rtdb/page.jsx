"use client";
import React, { useEffect, useState, useRef } from "react";
import { getDatabase, ref, set, onValue } from "firebase/database";

export default function RealTimeDatabasePage() {
    const [currentLocation, setCurrentLocation] = useState(null);
    const [isTracking, setIsTracking] = useState(false);
    const [permissionStatus, setPermissionStatus] = useState('unknown'); // 'granted', 'denied', 'prompt', 'unknown'
    const [permissionMessage, setPermissionMessage] = useState('');
    const watchIdRef = useRef(null);

    const checkCurrentPermissionStatus = async () => {
        // Check if we're in a secure context
        const isSecureContext = window.isSecureContext || location.protocol === 'https:' || location.hostname === 'localhost';

        if (!isSecureContext) {
            setPermissionMessage('⚠️ Location requires HTTPS. Please use HTTPS or localhost.');
            return;
        }

        if (typeof window !== 'undefined' && navigator.permissions) {
            try {
                const result = await navigator.permissions.query({ name: 'geolocation' });
                setPermissionStatus(result.state);
                console.log('Current permission status:', result.state);

                if (result.state === 'denied') {
                    setPermissionMessage('🚫 Location previously denied. Enable in browser settings or use HTTPS.');
                }
            } catch (error) {
                console.log('Permission API not supported, status unknown');
                setPermissionStatus('unknown');
            }
        }
    };

    const checkAndRequestPermission = async () => {
        console.log('Requesting location permission...');
        setPermissionMessage('Requesting location permission...');

        if (typeof window !== 'undefined' && navigator.geolocation) {
            // Force browser to show permission popup
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    console.log('Permission granted!', position.coords);
                    setPermissionStatus('granted');
                    setPermissionMessage('Location permission granted!');
                },
                (error) => {
                    console.log('Permission error:', error);
                    handleLocationError(error);
                },
                {
                    enableHighAccuracy: true,
                    timeout: 15000,
                    maximumAge: 0 // Force fresh permission request
                }
            );
        } else {
            setPermissionMessage('Geolocation is not supported by this browser.');
        }
    };

    const checkLocationPermission = async () => {
        if (typeof window !== 'undefined' && navigator.permissions) {
            try {
                const result = await navigator.permissions.query({ name: 'geolocation' });
                setPermissionStatus(result.state);

                result.addEventListener('change', () => {
                    setPermissionStatus(result.state);
                });

                return result.state;
            } catch (error) {
                console.log('Permission API not supported');
                return 'unknown';
            }
        }
        return 'unknown';
    };

    const requestLocationPermission = () => {
        console.log('Button clicked - requesting permission');
        checkAndRequestPermission();
    };

    const handleLocationError = (error) => {
        console.error('Geolocation error:', error);
        setIsTracking(false);

        switch (error.code) {
            case error.PERMISSION_DENIED:
                setPermissionStatus('denied');
                setPermissionMessage('❌ Location access denied! To enable: Click the location icon (🌍) in your browser address bar and select "Allow", then refresh the page.');
                break;
            case error.POSITION_UNAVAILABLE:
                setPermissionMessage('📍 Location information is unavailable. Please check your GPS/internet connection and try again.');
                break;
            case error.TIMEOUT:
                setPermissionMessage('⏰ Location request timed out. Please check your connection and try again.');
                break;
            default:
                setPermissionMessage(`❓ An error occurred: ${error.message || 'Unknown error'}`);
                break;
        }
    };

    const startLocationTracking = async () => {
        // Check if geolocation is available (browser environment)
        if (typeof window !== 'undefined' && navigator.geolocation) {
            // Check current permission status
            const currentPermission = await checkLocationPermission();

            if (currentPermission === 'denied') {
                setPermissionMessage('Location access is denied. Please enable location permissions in your browser settings.');
                return;
            }

            setIsTracking(true);
            setPermissionMessage('Starting location tracking...');

            watchIdRef.current = navigator.geolocation.watchPosition(
                (position) => {
                    const { latitude, longitude, accuracy } = position.coords;
                    const timestamp = position.timestamp || Date.now();

                    const locationData = {
                        lat: latitude,
                        lng: longitude,
                        accuracy: accuracy,
                        timestamp: new Date(timestamp).toISOString()
                    };

                    // Log coordinates each time they change
                    console.log('Location updated:', {
                        latitude: latitude,
                        longitude: longitude,
                        accuracy: accuracy,
                        timestamp: new Date(timestamp).toLocaleString()
                    });

                    setCurrentLocation(locationData);
                    setPermissionStatus('granted');
                    setPermissionMessage('Location tracking active ✅');
                },
                (error) => {
                    handleLocationError(error);
                },
                {
                    enableHighAccuracy: true,
                    timeout: 10000,
                    maximumAge: 60000 // Cache position for 1 minute
                }
            );
        } else {
            setPermissionMessage('Geolocation is not supported by this browser.');
        }
    };

    const stopLocationTracking = () => {
        if (watchIdRef.current && typeof window !== 'undefined') {
            navigator.geolocation.clearWatch(watchIdRef.current);
            watchIdRef.current = null;
            setIsTracking(false);
            setPermissionMessage('Location tracking stopped.');
            console.log('Location tracking stopped');
        }
    };

    // useEffect(() => {
    //     writeUserData('1', 'John Doe', 'john.doe@example.com', 'https://example.com/john.jpg');
    // }, []);

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="p-6 max-w-md mx-auto bg-white rounded-lg shadow-lg border">

                <div className="mb-6">
                    <h2 className="text-xl font-bold mb-4 text-gray-900">Location Tracking</h2>

                    {/* HTTPS Info */}
                    {typeof window !== 'undefined' && !window.isSecureContext && location.protocol !== 'https:' && location.hostname !== 'localhost' && (
                        <div className="mb-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                            <h3 className="font-semibold text-amber-800 mb-2">🔒 HTTPS Required</h3>
                            <p className="text-sm text-amber-700 mb-2">
                                Location services require a secure connection (HTTPS) or localhost.
                            </p>
                            <p className="text-xs text-amber-600">
                                Current: {typeof window !== 'undefined' ? window.location.protocol + '//' + window.location.host : 'Unknown'}
                            </p>
                        </div>
                    )}

                    {/* Local Development Helper */}
                    {typeof window !== 'undefined' && location.hostname === 'localhost' && location.protocol === 'http:' && (
                        <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                            <h3 className="font-semibold text-blue-800 mb-2">💡 Development Tip</h3>
                            <p className="text-sm text-blue-700 mb-2">
                                For better location support, run with HTTPS:
                            </p>
                            <code className="text-xs bg-blue-100 px-2 py-1 rounded text-blue-800 block">
                                npm run dev:https
                            </code>
                        </div>
                    )}

                    {/* Permission Status & Message */}
                    <div className="mb-4 p-3 rounded-lg border">
                        <div className="mb-2">
                            <span className="text-base font-medium text-gray-800">Status: </span>
                            <span className={`font-bold ${isTracking ? 'text-green-600' : 'text-red-600'}`}>
                                {isTracking ? '🟢 Tracking Active' : '🔴 Not Tracking'}
                            </span>
                        </div>

                        {/* Permission Status */}
                        <div className="mb-2">
                            <span className="text-base font-medium text-gray-800">Permission: </span>
                            <span className={`font-semibold ${permissionStatus === 'granted' ? 'text-green-600' :
                                permissionStatus === 'denied' ? 'text-red-600' :
                                    'text-yellow-600'
                                }`}>
                                {permissionStatus === 'granted' ? '✅ Granted' :
                                    permissionStatus === 'denied' ? '❌ Denied' :
                                        permissionStatus === 'prompt' ? '⚠️ Need Permission' :
                                            '❓ Unknown'}
                            </span>
                        </div>

                        {/* Message */}
                        {permissionMessage && (
                            <div className={`text-sm p-2 rounded ${permissionStatus === 'denied' ? 'bg-red-50 text-red-700 border border-red-200' :
                                permissionStatus === 'granted' ? 'bg-green-50 text-green-700 border border-green-200' :
                                    'bg-blue-50 text-blue-700 border border-blue-200'
                                }`}>
                                {permissionMessage}
                            </div>
                        )}
                    </div>

                    {/* Permission Request Button */}
                    {(permissionStatus === 'unknown' || permissionStatus === 'prompt' || permissionStatus === 'denied') && !isTracking && (
                        <div className="mb-4 space-y-3">
                            {/* Instructions for denied permission */}
                            {permissionStatus === 'denied' && (
                                <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
                                    <h4 className="font-semibold text-yellow-800 mb-2">📋 How to Enable Location Access:</h4>
                                    <ol className="text-sm text-yellow-700 space-y-1 ml-4 list-decimal">
                                        <li>Look for the location icon (🌍) in your browser's address bar</li>
                                        <li>Click on it and select "Allow" or "Always allow"</li>
                                        <li>Refresh this page</li>
                                        <li>Or go to browser Settings → Privacy → Location → Allow this site</li>
                                    </ol>
                                </div>
                            )}

                            <button
                                onClick={requestLocationPermission}
                                className="w-full px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
                            >
                                🌍 {permissionStatus === 'denied' ? 'Try Again After Enabling' : 'Allow Location Access'}
                            </button>

                            {/* Debug/Force button */}
                            <button
                                onClick={() => {
                                    console.log('Force requesting permission...');
                                    if (navigator.geolocation) {
                                        navigator.geolocation.getCurrentPosition(
                                            (pos) => {
                                                console.log('Success:', pos);
                                                setPermissionStatus('granted');
                                                setPermissionMessage('✅ Permission granted! You can now start tracking.');
                                            },
                                            (err) => {
                                                console.log('Error:', err);
                                                handleLocationError(err);
                                            },
                                            { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
                                        );
                                    }
                                }}
                                className="w-full px-4 py-2 bg-gray-500 text-white text-sm rounded-lg hover:bg-gray-600 transition-colors"
                            >
                                🚨 Force Request (Debug)
                            </button>
                        </div>
                    )}                    {currentLocation && (
                        <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg text-base">
                            <h3 className="font-bold text-blue-900 mb-3">Current Location:</h3>
                            <div className="space-y-2">
                                <p className="text-gray-800">
                                    <strong className="text-blue-700">Latitude:</strong>
                                    <span className="font-mono ml-2 text-gray-900">{currentLocation.lat.toFixed(6)}</span>
                                </p>
                                <p className="text-gray-800">
                                    <strong className="text-blue-700">Longitude:</strong>
                                    <span className="font-mono ml-2 text-gray-900">{currentLocation.lng.toFixed(6)}</span>
                                </p>
                                <p className="text-gray-800">
                                    <strong className="text-blue-700">Accuracy:</strong>
                                    <span className="font-mono ml-2 text-gray-900">{currentLocation.accuracy.toFixed(1)}m</span>
                                </p>
                                <p className="text-gray-800">
                                    <strong className="text-blue-700">Last Update:</strong>
                                    <span className="font-mono ml-2 text-gray-900">{new Date(currentLocation.timestamp).toLocaleTimeString()}</span>
                                </p>
                            </div>
                        </div>
                    )}

                    <div className="mt-6 space-y-3">
                        <button
                            onClick={startLocationTracking}
                            disabled={isTracking}
                            className="w-full px-6 py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                        >
                            {isTracking ? '✅ Tracking Started' : '📍 Start Tracking'}
                        </button>
                        <button
                            onClick={stopLocationTracking}
                            disabled={!isTracking}
                            className="w-full px-6 py-3 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                        >
                            {!isTracking ? '⏹️ Tracking Stopped' : '🛑 Stop Tracking'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
