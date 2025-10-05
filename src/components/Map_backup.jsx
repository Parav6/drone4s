"use client";
import Script from "next/script";
import React, { useEffect, useRef, useState, useCallback } from "react";
import useLocation from "@/hooks/useLocation";
import useRealTimeTracking from "@/hooks/useRealTimeTracking";
import LocationPermissionOverlay from "./LocationPermissionOverlay";

const Map = ({
    center = { lat: 29.860, lng: 77.900 },
    zoom = 17,
    followUser = true, // auto pan map with user movement
    apiKey = process.env.NEXT_PUBLIC_MAP_MY_INDIA_API_KEY,
    // New props for multiple device support
    additionalMarkers = [], // Array of {id, lat, lng, label, color} objects
    enableRealTimeTracking = false, // Enable Firebase real-time tracking
    deviceId = null, // Current device ID for real-time tracking
    onMapReady = null // Callback when map is ready
}) => {
    const mapRef = useRef(null);
    const mapInstanceRef = useRef(null);
    const userMarkerRef = useRef(null);
    const additionalMarkersRef = useRef({}); // Store additional markers as object
    const firstFixRef = useRef(false);
    const stableCenterRef = useRef(center);
    const [isLoading, setIsLoading] = useState(true); // We will NOT hide the map container while loading
    const [error, setError] = useState(null);
    const [isFollowing, setIsFollowing] = useState(followUser);

    // Hook for location with more optimized settings
    const {
        locationStatus,
        latitude,
        longitude,
        currentPosition,
        requestLocationPermission,
        isLocationEnabled,
        error: locationError,
        startTracking,
        stopTracking,
        isTracking
    } = useLocation({
        autoTrack: true,
        minimumDistanceMeters: 5, // Increased to reduce noise
        highAccuracy: false // Better performance
    });

    // Real-time tracking hook (conditional)
    const realTimeTracking = enableRealTimeTracking ? useRealTimeTracking(deviceId) : null;

    // Debug real-time tracking
    useEffect(() => {
        console.log('[DEBUG MAP HOOK] Real-time tracking state:', {
            enableRealTimeTracking,
            deviceId,
            hasRealTimeTracking: !!realTimeTracking,
            isPublishing: realTimeTracking?.isPublishing,
            connectedDevicesCount: realTimeTracking?.connectedDevices?.length || 0
        });
    }, [enableRealTimeTracking, deviceId, realTimeTracking?.isPublishing, realTimeTracking?.connectedDevices]);

    // Helper to ensure map recalculates its size (different SDKs expose different APIs)
    const forceMapResize = (map) => {
        // Try a few common resize/invalidate methods safely
        try {
            if (!map) return;
            // Run on next frame to ensure DOM painted
            requestAnimationFrame(() => {
                if (typeof map.invalidateSize === 'function') map.invalidateSize();
                if (typeof map.resize === 'function') map.resize();
                if (typeof map.refresh === 'function') map.refresh();
                // As a fallback, dispatch a window resize which many libs listen for
                window.dispatchEvent(new Event('resize'));
            });
        } catch (e) {
            console.warn('Map resize attempt failed:', e);
        }
    };

    // Initialize the map when the script is loaded
    const initializeMap = () => {
        if (window.mappls && mapRef.current && !mapInstanceRef.current) {
            try {
                setError(null);

                const map = new window.mappls.Map('map', {
                    center: stableCenterRef.current,
                    zoom: zoom
                });
                mapInstanceRef.current = map;
                // Attach zoom-based marker scaling once marker exists
                try {
                    const zoomHandler = () => {
                        // Defer to after potential marker creation
                        requestAnimationFrame(() => {
                            if (!userMarkerRef.current) return;
                            try {
                                const z = map.getZoom ? map.getZoom() : zoom;
                                // Reference zoom 17 => base 44px. Scale linearly, clamp.
                                const base = 44;
                                const size = Math.max(30, Math.min(70, Math.round(base * (z / 17))));
                                // Recreate / update icon based on existing accuracy logic (no pulse here; we keep consistency)
                                const iconSvg = 'data:image/svg+xml;utf8,' + encodeURIComponent(`\n                                    <svg xmlns='http://www.w3.org/2000/svg' width='${size}' height='${size}' viewBox='0 0 24 24'>\n                                        <circle cx='12' cy='12' r='11' fill='rgba(0,123,255,0.18)'></circle>\n                                        <circle cx='12' cy='12' r='6' fill='rgba(0,123,255,1)' stroke='white' stroke-width='2' />\n                                    </svg>`);
                                console.log(userMarkerRef.current.setIcon);

                                if (userMarkerRef.current.setIcon) {
                                    userMarkerRef.current.setIcon({ url: iconSvg, width: size, height: size, anchor: [size / 2, size / 2] });
                                } else {
                                    // Fallback recreate
                                    const pos = userMarkerRef.current.getPosition ? userMarkerRef.current.getPosition() : { lat: latitude, lng: longitude };
                                    userMarkerRef.current.remove && userMarkerRef.current.remove();
                                    userMarkerRef.current = new window.mappls.Marker({
                                        map,
                                        position: pos,
                                        // icon: { url: iconSvg, width: size, height: size, anchor: [size / 2, size / 2] }
                                        // icon_url: iconSvg
                                        icon_url: 'https://apis.mappls.com/map_v3/1.png'
                                    });
                                }
                            } catch (e) {
                                // ignore
                            }
                        });
                    };
                    // Try common event names
                    const events = ['zoomend', 'zoomchange', 'zoom'];
                    events.forEach(evt => { try { map.on && map.on(evt, zoomHandler); } catch { } });
                    // Initial scale apply
                    zoomHandler();
                } catch { }

                // Mark loading complete BEFORE forcing resize so container is visible
                setIsLoading(false);
                forceMapResize(map);
                // Extra delayed resize to be super sure (some tiles load async)
                setTimeout(() => forceMapResize(map), 150);
                setTimeout(() => forceMapResize(map), 500);

                // Callback when map is ready
                if (onMapReady) {
                    onMapReady(map);
                }

                console.log('Mappls Map initialized successfully');
            } catch (error) {
                console.error('Error initializing Mappls map:', error);
                setError(error.message);
                setIsLoading(false);
            }
        }
    };

    useEffect(() => {
        // Check if Mappls SDK is loaded
        if (window.mappls) {
            initializeMap();
        }
    }, []);

    useEffect(() => {
        if (!mapInstanceRef.current) return;
        if (!center) return;
        const prev = stableCenterRef.current;
        const changed = !prev || prev.lat !== center.lat || prev.lng !== center.lng;
        if (changed) {
            stableCenterRef.current = center;
            try { mapInstanceRef.current.setCenter && mapInstanceRef.current.setCenter(center); } catch { }
        }
    }, [center.lat, center.lng]);

    const handleScriptLoad = () => {
        console.log('Mappls SDK loaded successfully');
        initializeMap();
    };

    const handleScriptError = (e) => {
        console.error('Failed to load Mappls SDK:', e);
        setError('Failed to load map SDK');
        setIsLoading(false);
    };

    // Throttle marker updates to reduce lag
    const lastUpdateRef = useRef(0);
    const updateThrottleMs = 150; // Max 6-7 updates per second

    // Build a clean pinpoint SVG with status indicators (solid pin + inner dot + subtle shadow + opacity)
    const buildUserMarkerIcon = (size = 44, color = '#ff4d4f', label = 'ME', opacity = 1.0) => {
        const pinWidth = size;
        const pinHeight = Math.round(size * 1.25);
        const uniqueId = Math.random().toString(36).substr(2, 9);

        // Apply opacity to colors
        const mainColor = opacity < 1 ? `${color}${Math.round(opacity * 255).toString(16).padStart(2, '0')}` : color;
        const gradientColor = opacity < 1 ? `${color}${Math.round(opacity * 153).toString(16).padStart(2, '0')}` : `${color}99`;

        // Clean SVG without extra whitespace
        const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${pinWidth}" height="${pinHeight}" viewBox="0 0 48 60"><defs><radialGradient id="grad_${uniqueId}" cx="50%" cy="35%" r="60%"><stop offset="0%" stop-color="${mainColor}"/><stop offset="80%" stop-color="${gradientColor}"/></radialGradient></defs><path d="M24 0C14.1 0 6 8.2 6 18.4 6 32 24 60 24 60s18-28 18-41.6C42 8.2 33.9 0 24 0Z" fill="url(#grad_${uniqueId})" stroke="white" stroke-width="2" opacity="${opacity}"/><circle cx="24" cy="19" r="7" fill="white" opacity="${opacity}"/><circle cx="24" cy="19" r="4" fill="${mainColor}" opacity="${opacity}"/>${label ? `<text x="24" y="45" text-anchor="middle" fill="white" font-size="8" font-weight="bold" opacity="${opacity}">${label}</text>` : ''}</svg>`;

        return 'data:image/svg+xml;base64,' + btoa(svg);
    };

    // Icons working properly - test removed

    // Update additional markers (other devices) with enhanced status indicators
    const updateAdditionalMarkers = useCallback(() => {
        if (!mapInstanceRef.current || !window.mappls || !additionalMarkersRef.current) return;

        const map = mapInstanceRef.current;
        const currentMarkers = additionalMarkersRef.current;

        // Combine static additional markers with real-time tracking markers
        const allAdditionalMarkers = [
            ...additionalMarkers,
            ...(realTimeTracking?.connectedDevices || [])
        ];

        console.log('[DEBUG MAP] All additional markers:', allAdditionalMarkers);
        console.log('[DEBUG MAP] Real-time connected devices:', realTimeTracking?.connectedDevices);

        // Remove markers that no longer exist
        for (const [markerId, marker] of Object.entries(currentMarkers)) {
            const exists = allAdditionalMarkers.find(m => m.id === markerId);
            if (!exists) {
                try {
                    if (marker.remove) marker.remove();
                    delete currentMarkers[markerId];
                    console.log(`[DEBUG MAP] Removed marker for disconnected device: ${markerId}`);
                } catch (e) {
                    console.warn('Failed to remove marker:', e);
                }
            }
        }

        // Add or update markers
        allAdditionalMarkers.forEach(markerData => {
            const { id, lat, lng, label = '', color = '#00ff00', timeSinceActivity = 0 } = markerData;

            console.log(`[DEBUG MAP] Processing marker for device ${id}:`, { lat, lng, label, color });

            if (lat == null || lng == null) {
                console.warn(`[DEBUG MAP] Skipping device ${id} - no location data`);
                return;
            }

            const position = { lat, lng };

            // Determine marker opacity based on how recent the activity is
            let opacity = 1.0;
            let statusIndicator = '🟢'; // Green for active

            if (timeSinceActivity > 5000) { // More than 5 seconds
                opacity = 0.8;
                statusIndicator = '🟡'; // Yellow for slightly stale
            }
            if (timeSinceActivity > 10000) { // More than 10 seconds
                opacity = 0.6;
                statusIndicator = '🟠'; // Orange for stale
            }

            const displayLabel = `${statusIndicator}${label}`;
            const iconUrl = buildUserMarkerIcon(40, color, displayLabel, opacity);

            if (currentMarkers[id]) {
                // Update existing marker
                const existingMarker = currentMarkers[id];
                console.log(`[DEBUG MAP] Updating existing marker for device ${id}`);
                try {
                    if (typeof existingMarker.setPosition === 'function') {
                        existingMarker.setPosition(position);
                    } else if (typeof existingMarker.setLatLng === 'function') {
                        existingMarker.setLatLng(position);
                    }

                    // Update icon to reflect current status
                    if (existingMarker.setIcon) {
                        existingMarker.setIcon({
                            url: iconUrl,
                            size: [40, 50],
                            anchor: [20, 45]
                        });
                    }
                } catch (e) {
                    console.warn('Failed to update marker:', e);
                }
            } else {
                // Create new marker
                console.log(`[DEBUG MAP] Creating new marker for device ${id} at position:`, position);
                try {
                    const newMarker = new window.mappls.Marker({
                        position: position,
                        map,
                        icon: {
                            url: iconUrl,
                            size: [40, 50],
                            anchor: [20, 45]
                        }
                    });

                    // Fallback methods to set icon
                    if (!newMarker.getIcon || !newMarker.getIcon()) {
                        if (newMarker.setIcon) {
                            newMarker.setIcon(iconUrl);
                        } else if (newMarker.setImage) {
                            newMarker.setImage(iconUrl);
                        }
                    }

                    currentMarkers[id] = newMarker;
                    console.log(`[DEBUG MAP] Successfully created marker for device: ${id} with status: ${statusIndicator}`);

                    // Add popup with device info and activity status
                    if (newMarker.bindPopup) {
                        const activityText = timeSinceActivity < 1000 ? 'Just now' :
                            timeSinceActivity < 5000 ? `${Math.round(timeSinceActivity / 1000)}s ago` :
                                timeSinceActivity < 60000 ? `${Math.round(timeSinceActivity / 1000)}s ago` :
                                    `${Math.round(timeSinceActivity / 60000)}m ago`;
                        newMarker.bindPopup(`Device: ${label}<br/>Last active: ${activityText}<br/>Status: ${statusIndicator}`);
                    }
                } catch (e) {
                    console.error(`[DEBUG MAP] Failed to create marker for device ${id}:`, e);
                }
            }
        });

        console.log('[DEBUG MAP] Current markers on map:', Object.keys(currentMarkers));
    }, [additionalMarkers, realTimeTracking?.connectedDevices]);

    // Create or update user marker + accuracy representation
    const updateUserMarker = useCallback(() => {
        // Throttle updates for performance
        const now = Date.now();
        if (now - lastUpdateRef.current < updateThrottleMs) {
            return;
        }
        lastUpdateRef.current = now;

        if (!mapInstanceRef.current || !window.mappls) return;
        if (latitude == null || longitude == null) return;

        const map = mapInstanceRef.current;
        const newPosition = { lat: latitude, lng: longitude };

        // Desired marker size (pin height will be ~1.25x)
        const baseSize = 40; // a bit smaller (less chance of clipping) 
        const iconUrl = buildUserMarkerIcon(baseSize, '#ff4d4f', 'ME');
        const pinHeight = Math.round(baseSize * 1.25);
        const anchorX = baseSize / 2; // horizontal center
        const anchorY = pinHeight - 2; // near bottom tip

        if (!userMarkerRef.current) {
            try {
                userMarkerRef.current = new window.mappls.Marker({
                    position: newPosition,
                    map,
                    icon: iconUrl
                });
                console.log('[LOC] User marker created');
            } catch (e) {
                console.error('[LOC] Failed to create user marker:', e);
            }
        } else {
            // Update only the position
            try {
                if (typeof userMarkerRef.current.setPosition === 'function') {
                    userMarkerRef.current.setPosition(newPosition);
                } else if (typeof userMarkerRef.current.setLatLng === 'function') {
                    userMarkerRef.current.setLatLng(newPosition);
                }
            } catch (e) {
                console.warn('[LOC] Failed to update user marker position:', e);
            }
        }

        // Auto-follow with debounced center update
        if (!firstFixRef.current) {
            firstFixRef.current = true;
            if (followUser) {
                try {
                    map.setCenter && map.setCenter(newPosition);
                    if (map.setZoom) map.setZoom(18);
                    console.log('[LOC] First fix recenter applied');
                } catch (e) { console.warn('[LOC] First fix center failed:', e); }
            } else {
                setIsFollowing(false);
            }
        } else if (isFollowing) {
            requestAnimationFrame(() => {
                try { map.setCenter && map.setCenter(newPosition); } catch { }
            });
        }

    }, [latitude, longitude, isFollowing]);

    // Update marker with throttled coordination changes
    useEffect(() => {
        if (!mapInstanceRef.current || latitude == null || longitude == null) return;

        // Use requestAnimationFrame to batch updates
        const updateId = requestAnimationFrame(() => {
            updateUserMarker();
        });

        return () => cancelAnimationFrame(updateId);
    }, [latitude, longitude, updateUserMarker]);

    // Update additional markers when they change
    useEffect(() => {
        console.log('[DEBUG] useEffect triggered for additional markers, mapReady:', !!mapInstanceRef.current);
        console.log('[DEBUG] additionalMarkers prop:', additionalMarkers);

        if (!mapInstanceRef.current) return;

        // Direct update without animation frame for real-time smoothness
        updateAdditionalMarkers();
    }, [additionalMarkers, realTimeTracking?.connectedDevices, updateAdditionalMarkers]);

    // Real-time tracking integration
    useEffect(() => {
        if (realTimeTracking && latitude && longitude) {
            // Auto-start publishing when location is available
            if (!realTimeTracking.isPublishing) {
                const deviceName = deviceId?.split('_')[1]?.substr(0, 4) || 'Device';
                realTimeTracking.startPublishing(latitude, longitude, deviceName);
            } else {
                // Update location in Firebase
                realTimeTracking.updateLocation(latitude, longitude);
            }
        }
    }, [realTimeTracking, latitude, longitude, deviceId]);

    // Trigger initial additional markers when map is ready
    useEffect(() => {
        if (mapInstanceRef.current && !isLoading) {
            console.log('[DEBUG] Map ready, triggering initial additional markers update');
            setTimeout(() => updateAdditionalMarkers(), 500);
        }
    }, [mapInstanceRef.current, isLoading, updateAdditionalMarkers]);

    // Stop following when user manually pans (heuristic)
    useEffect(() => {
        if (!mapInstanceRef.current) return;
        const map = mapInstanceRef.current;
        const disableFollow = () => setIsFollowing(false);
        const events = ['dragstart', 'zoomstart', 'touchstart', 'wheel', 'dblclick'];
        events.forEach(evt => { try { map.on && map.on(evt, disableFollow); } catch { } });
        return () => { events.forEach(evt => { try { map.off && map.off(evt, disableFollow); } catch { } }); };
    }, [mapInstanceRef.current]);

    const followUserAgain = () => setIsFollowing(true);

    return (
        <>
            <LocationPermissionOverlay />
            <div
                style={{
                    width: '100vw',
                    height: '100vh',
                    zIndex: 1000,
                    margin: 0,
                    padding: 0
                }}
            >
                {/* Load Mappls SDK */}
                <Script
                    src={`https://apis.mappls.com/advancedmaps/api/${apiKey}/map_sdk?v=3.0&layer=vector`}
                    onLoad={handleScriptLoad}
                    onError={handleScriptError}
                    strategy="afterInteractive"
                />

                {isLoading && (
                    <div
                        style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            width: '100%',
                            height: '100%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            background: 'rgba(0,0,0,0.35)',
                            color: '#fff',
                            backdropFilter: 'blur(2px)',
                            zIndex: 1001,
                            fontSize: '14px',
                            fontFamily: 'system-ui, sans-serif'
                        }}
                    >
                        Loading map...
                    </div>
                )}

                {error && (
                    <div
                        style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            width: '100%',
                            height: '100%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            background: '#ffebee',
                            color: '#c62828',
                            padding: '20px',
                            textAlign: 'center',
                            zIndex: 1001
                        }}
                    >
                        <div>
                            <p>Error loading map: {error}</p>
                            <p style={{ fontSize: '0.9em', marginTop: '10px' }}>
                                Please check your API key and internet connection.
                            </p>
                        </div>
                    </div>
                )}

                <div
                    id="map"
                    ref={mapRef}
                    style={{
                        width: '100%',
                        height: '100%',
                        margin: 0,
                        padding: 0,
                        // Always keep it rendered so SDK can compute correct size
                        visibility: error ? 'hidden' : 'visible'
                    }}
                />

                {/* Floating Controls */}
                <div style={{ position: 'absolute', top: 12, left: 12, zIndex: 1200, display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {locationStatus !== 'granted' && (
                        <button onClick={requestLocationPermission} style={controlBtnStyle}>Enable Location</button>
                    )}
                    {isLocationEnabled && !isTracking && (
                        <button onClick={startTracking} style={controlBtnStyle}>Start Tracking</button>
                    )}
                    {isLocationEnabled && isTracking && (
                        <button onClick={stopTracking} style={controlBtnStyle}>Stop Tracking</button>
                    )}
                    {isLocationEnabled && !isFollowing && (
                        <button onClick={followUserAgain} style={controlBtnStyle}>Recenter</button>
                    )}
                    {latitude && longitude && (
                        <div style={coordStyle}>Lat: {latitude.toFixed(5)}<br />Lng: {longitude.toFixed(5)}</div>
                    )}
                    {locationError && <div style={{ ...coordStyle, background: '#8b0000' }}>Loc Err</div>}

                    {/* Enhanced real-time tracking status */}
                    {enableRealTimeTracking && realTimeTracking && (
                        <div style={coordStyle}>
                            {realTimeTracking.isPublishing ? '🟢 Live Sharing' : '🔴 Not Sharing'}
                            <br />Connected: {(realTimeTracking.connectedDevices?.length || 0) + 1} devices
                            <br />Active: {realTimeTracking.connectedDevices?.filter(d => (d.timeSinceActivity || 0) < 5000).length || 0} devices
                        </div>
                    )}

                    {/* Additional markers count */}
                    {additionalMarkers.length > 0 && (
                        <div style={coordStyle}>
                            Static Markers: {additionalMarkers.length}
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}

// Inline styles for controls
const controlBtnStyle = {
    background: '#1f2937',
    color: '#fff',
    border: '1px solid #374151',
    padding: '6px 10px',
    fontSize: 12,
    borderRadius: 6,
    cursor: 'pointer'
};

const coordStyle = {
    background: 'rgba(31,41,55,0.85)',
    color: '#fff',
    padding: '6px 8px',
    fontSize: 11,
    lineHeight: 1.3,
    borderRadius: 6,
    fontFamily: 'ui-monospace, monospace'
};

export default Map;