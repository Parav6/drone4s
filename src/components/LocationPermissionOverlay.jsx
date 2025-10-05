"use client";
import React, { useEffect, useState } from 'react';
import useLocation from '@/hooks/useLocation';

// Self-contained overlay using the location hook directly
const LocationPermissionOverlay = ({ initialDelayMs = 900 }) => {
    // Use the hook in lightweight (UI) mode: don't autoTrack here to avoid duplicate watches.
    const {
        locationStatus,
        isLoading,
        error,
        requestLocationPermission,
        isLocationEnabled,
        isLocationDenied,
        needsPermission
    } = useLocation({ autoTrack: false, highAccuracy: false });
    const [urgentMessage, setUrgentMessage] = useState('');
    const [description, setDescription] = useState('');
    const [showAction, setShowAction] = useState(false);

    // Grace delay so that quick permission resolution (cached granted) doesn't flash the prompt
    useEffect(() => {
        if (isLocationEnabled) return; // no need
        if (locationStatus === 'checking') {
            setShowAction(false);
            const t = setTimeout(() => {
                // Only allow button after delay if still not enabled
                setShowAction(true);
            }, initialDelayMs);
            return () => clearTimeout(t);
        } else {
            // For prompt / denied states, still respect a tiny delay to avoid flicker
            const t = setTimeout(() => setShowAction(true), 250);
            return () => clearTimeout(t);
        }
    }, [locationStatus, isLocationEnabled, initialDelayMs]);

    useEffect(() => {
        setUrgentMessage(getUrgentMessage());
        setDescription(getDescription());
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isLocationDenied, needsPermission, locationStatus, error]);

    const getUrgentMessage = () => {
        if (isLocationEnabled) return '';
        if (locationStatus === 'checking') return '🔍 Checking Location';
        if (isLocationDenied) return '🚨 Location Access Required!';
        if (needsPermission) return '📍 Enable Location Access';
        if (locationStatus === 'not-supported') return '⚠️ Location Not Supported';
        return '📍 Location Required';
    };

    const getDescription = () => {
        if (isLocationEnabled) return '';
        if (locationStatus === 'checking') return 'Please wait while we verify permission...';
        if (isLocationDenied) return 'Location was denied. Enable it to continue.';
        if (needsPermission) return 'This app needs your location to work properly.';
        if (locationStatus === 'not-supported') return "Your browser doesn't support location services.";
        return 'Preparing location...';
    };

    if (isLocationEnabled) return null; // nothing if already enabled

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[1500]">
            <div className="bg-white rounded-lg shadow-xl p-6 max-w-sm mx-4 animate-pulse">
                <div className="text-center">
                    <div className="text-2xl mb-3 font-bold text-gray-900">{urgentMessage}</div>
                    <p className="text-gray-800 mb-4 text-sm font-medium">{description}</p>
                    {error && (
                        <div className="mb-4 p-2 bg-red-100 border border-red-400 text-red-700 rounded text-xs">{error}</div>
                    )}
                    {locationStatus !== 'not-supported' && showAction && !isLocationEnabled && (
                        <button
                            onClick={requestLocationPermission}
                            disabled={isLoading || locationStatus === 'checking'}
                            className={`w-full py-3 px-4 rounded-lg font-semibold text-white transition-all ${(isLoading || locationStatus === 'checking')
                                ? 'bg-gray-400 cursor-not-allowed'
                                : 'bg-red-500 hover:bg-red-600 shadow-lg hover:shadow-xl transform hover:scale-105'}`}
                        >
                            {(isLoading || locationStatus === 'checking') ? (
                                <div className="flex items-center justify-center">
                                    <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                                    {locationStatus === 'checking' ? 'Checking...' : 'Requesting...'}
                                </div>
                            ) : (
                                '🔓 Enable Location Now'
                            )}
                        </button>
                    )}
                    {locationStatus === 'checking' && !showAction && (
                        <div className="mt-2 text-xs text-gray-500 animate-pulse">Initializing…</div>
                    )}
                    {isLocationDenied && (
                        <div className="mt-3 text-xs text-gray-600">
                            💡 Tip: Click the location icon in your browser's address bar if the popup doesn't appear
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default LocationPermissionOverlay;
