"use client";
import Script from "next/script";
import React, { useEffect, useRef, useState, useCallback, useMemo } from "react";
import useLocation from "@/hooks/useLocation";
import useRealTimeTracking from "@/hooks/useRealTimeTracking";
import useUserLocationTracking from "@/hooks/useUserLocationTracking";
import LocationPermissionOverlay from "./LocationPermissionOverlay";
import { useFirebase } from "@/context/Firebase";
import { ref, onValue } from "firebase/database";
import InternetConnection from "./InternetConnection";

const Map = ({
    center = { lat: 29.860, lng: 77.900 },
    zoom = 17,
    followUser = true, // auto pan map with user movement
    apiKey = process.env.NEXT_PUBLIC_MAP_MY_INDIA_API_KEY,
    // New props for multiple device support
    additionalMarkers = [], // Array of {id, lat, lng, label, color} objects
    trackUserIds = [], // Array of user IDs to track from Firebase - e.g. ['user1', 'user2']
    publishCurrentUser = false, // Publish current user's location to Firebase
    enableRealTimeTracking = false, // Enable Firebase real-time tracking for current device (deprecated)
    deviceId = null, // Current device ID for real-time tracking (deprecated)
    onMapReady = null // Callback when map is ready
}) => {
    const mapRef = useRef(null);
    const mapInstanceRef = useRef(null);
    const userMarkerRef = useRef(null);
    const additionalMarkersRef = useRef({}); // Store additional markers as object
    const firstFixRef = useRef(false);
    const stableCenterRef = useRef(center);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isFollowing, setIsFollowing] = useState(followUser);

    // Firebase context
    const { database, user } = useFirebase();

    // Debug Firebase context
    useEffect(() => {
        console.log('[DEBUG MAP] Firebase context:', {
            hasDatabase: !!database,
            databaseApp: database?.app?.name || 'none',
            databaseURL: database?.app?.options?.databaseURL || 'none'
        });
    }, [database]);

    // Memoize trackUserIds to prevent infinite re-renders
    const memoizedTrackUserIds = useMemo(() => {
        if (!trackUserIds || !Array.isArray(trackUserIds) || trackUserIds.length === 0) {
            return [];
        }
        return [...trackUserIds];
    }, [JSON.stringify(trackUserIds)]);

    // Early return if no users to track
    const hasUsersToTrack = memoizedTrackUserIds.length > 0;

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

    // User location tracking hook (new approach)
    const userLocationTracking = useUserLocationTracking();

    // State for tracked users
    const [trackedUsers, setTrackedUsers] = useState([]);
    const [userPresenceState, setUserPresenceState] = useState({});
    const [connectionMonitor, setConnectionMonitor] = useState({});

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

    // Track specific user IDs from Firebase with real-time presence
    useEffect(() => {
        if (!database || !hasUsersToTrack) {
            setTrackedUsers([]);
            setUserPresenceState({});
            setConnectionMonitor({});
            return;
        }

        console.log('[DEBUG USER TRACKING] Setting up enhanced tracking for users:', memoizedTrackUserIds);

        // Listen to both user_locations and user_presence for comprehensive tracking
        const userLocationsRef = ref(database, 'user_locations');
        const userPresenceRef = ref(database, 'user_presence');

        // Enhanced listener for user locations
        const unsubscribeLocations = onValue(userLocationsRef, (snapshot) => {
            const locationData = snapshot.val();
            console.log('[DEBUG USER TRACKING] Location snapshot data:', locationData);

            if (!locationData) {
                console.log('[DEBUG USER TRACKING] No user location data found in Firebase');
                setTrackedUsers([]);
                return;
            }

            console.log('[DEBUG USER TRACKING] Available users in Firebase:', Object.keys(locationData));
            const now = Date.now();
            const users = [];
            const newConnectionMonitor = {};

            // Process each tracked user
            memoizedTrackUserIds.forEach(userId => {
                console.log(`[DEBUG USER TRACKING] Checking user: ${userId}`);
                const userData = locationData[userId];

                if (!userData) {
                    console.log(`[DEBUG USER TRACKING] No data found for user: ${userId}`);
                    console.log(`[DEBUG USER TRACKING] Available users are:`, Object.keys(locationData));
                    newConnectionMonitor[userId] = {
                        status: 'no_data',
                        lastSeen: null,
                        reason: 'User not found in Firebase'
                    };
                    return;
                }

                console.log(`[DEBUG USER TRACKING] Found data for user ${userId}:`, userData);

                // Enhanced activity checking
                const lastUpdate = userData.lastUpdate || 0;
                const heartbeat = userData.heartbeat || 0;
                const lastActivity = Math.max(lastUpdate, heartbeat);
                const timeSinceActivity = now - (typeof lastActivity === 'number' ? lastActivity : 0);

                // More flexible time checks for testing
                const isVeryRecent = timeSinceActivity < 30000; // 30 seconds
                const isRecent = timeSinceActivity < 300000; // 5 minutes
                const isStale = timeSinceActivity > 600000; // 10 minutes

                const isOnline = userData.status === 'online' && userData.isOnline !== false;
                const hasValidLocation = userData.lat && userData.lng &&
                    !isNaN(parseFloat(userData.lat)) &&
                    !isNaN(parseFloat(userData.lng));

                const connectionState = userData.connectionState || 'unknown';
                const sessionId = userData.sessionId || 'no_session';

                // Update connection monitor
                newConnectionMonitor[userId] = {
                    status: isOnline ? (isVeryRecent ? 'active' : 'online') : 'offline',
                    lastSeen: lastActivity,
                    timeSinceActivity,
                    connectionState,
                    sessionId,
                    hasValidLocation,
                    reason: !hasValidLocation ? 'Invalid location' :
                        isStale ? 'Stale data' :
                            !isOnline ? 'Marked offline' : 'Active'
                };

                console.log(`[DEBUG USER TRACKING] User ${userId} analysis:`, {
                    isOnline,
                    hasValidLocation,
                    isVeryRecent,
                    isRecent,
                    isStale,
                    timeSinceActivity: Math.round(timeSinceActivity / 1000) + 's',
                    connectionState,
                    status: userData.status,
                    lat: userData.lat,
                    lng: userData.lng
                });

                // Show user if they have valid location and are either:
                // 1. Currently online, OR
                // 2. Recently active (within 10 minutes for testing)
                if (hasValidLocation && (isOnline || !isStale)) {
                    const userMarkerData = {
                        id: userId,
                        userId: userId,
                        lat: parseFloat(userData.lat),
                        lng: parseFloat(userData.lng),
                        label: userData.displayName?.substring(0, 2)?.toUpperCase() || userId.substring(0, 2)?.toUpperCase(),
                        color: getUserColor(userId),
                        lastUpdate: userData.lastUpdate,
                        timeSinceActivity: timeSinceActivity,
                        deviceName: userData.deviceName || `User ${userId}`,
                        displayName: userData.displayName || userId,
                        status: isOnline ? 'online' : 'offline',
                        connectionState: connectionState,
                        isActive: isVeryRecent,
                        isRecent: isRecent,
                        sessionId: sessionId
                    };

                    users.push(userMarkerData);
                    console.log(`[DEBUG USER TRACKING] ✅ Added user ${userId} to map at lat: ${userData.lat}, lng: ${userData.lng}`);
                } else {
                    console.log(`[DEBUG USER TRACKING] ❌ User ${userId} filtered out:`, {
                        hasValidLocation,
                        isOnline,
                        isStale,
                        timeSinceActivity: Math.round(timeSinceActivity / 1000) + 's'
                    });
                }
            });

            console.log(`[DEBUG USER TRACKING] 📍 Tracking ${users.length} users from user_locations:`,
                users.map(u => ({ userId: u.userId, status: u.status, isActive: u.isActive })));

            // Update connection monitor
            setConnectionMonitor(newConnectionMonitor);

            // Provide helpful debugging when no users found
            if (users.length === 0 && memoizedTrackUserIds.length > 0) {
                console.warn(`[DEBUG USER TRACKING] ⚠️ No users found! Expecting: ${memoizedTrackUserIds.join(', ')}`);
                console.warn('[DEBUG USER TRACKING] � Troubleshooting steps:');
                console.warn('[DEBUG USER TRACKING] 1. Check if target user is logged in and publishing location');
                console.warn('[DEBUG USER TRACKING] 2. Verify useUserLocationTracking.startPublishing() was called');
                console.warn('[DEBUG USER TRACKING] 3. Confirm user ID matches Firebase Auth UID exactly');
                console.warn('[DEBUG USER TRACKING] 4. Check Firebase database rules allow read access');
                console.warn('[DEBUG USER TRACKING] 5. Verify user has recent location data (within 10 minutes)');
                console.warn('[DEBUG USER TRACKING] Current connection monitor:', newConnectionMonitor);
            }

            // Only update state if there are actual changes
            setTrackedUsers(prevUsers => {
                const hasChanges = JSON.stringify(prevUsers.map(u => ({
                    id: u.id, lat: u.lat, lng: u.lng, status: u.status
                }))) !== JSON.stringify(users.map(u => ({
                    id: u.id, lat: u.lat, lng: u.lng, status: u.status
                })));
                return hasChanges ? users : prevUsers;
            });
        }, (error) => {
            console.error('[DEBUG USER TRACKING] Firebase location listener error:', error);
            setTrackedUsers([]);
            setConnectionMonitor({});
        });

        // Enhanced presence listener
        const unsubscribePresence = onValue(userPresenceRef, (snapshot) => {
            const presenceData = snapshot.val();
            console.log('[DEBUG PRESENCE] Presence data:', presenceData);

            if (presenceData) {
                const presenceState = {};
                memoizedTrackUserIds.forEach(userId => {
                    const userPresence = presenceData[userId];
                    if (userPresence) {
                        presenceState[userId] = {
                            status: userPresence.status,
                            lastSeen: userPresence.lastSeen,
                            disconnectReason: userPresence.disconnectReason
                        };
                    }
                });
                setUserPresenceState(presenceState);
            }
        }, (error) => {
            console.error('[DEBUG PRESENCE] Firebase presence listener error:', error);
        });

        return () => {
            unsubscribeLocations();
            unsubscribePresence();
        };
    }, [database, memoizedTrackUserIds, hasUsersToTrack]);

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

    // Build a simple, reliable marker icon with user name label
    const buildUserMarkerIcon = (size = 44, color = '#ff4d4f', label = 'ME', opacity = 1.0, userName = null) => {
        try {
            const displayName = userName || label;
            // Simple and working SVG
            const svgIcon = `
                <svg xmlns="http://www.w3.org/2000/svg" width="60" height="70" viewBox="0 0 60 70">
                    <!-- Name label background -->
                    <rect x="5" y="5" width="50" height="20" fill="rgba(0,0,0,0.8)" rx="10" stroke="${color}" stroke-width="1"/>
                    <!-- Name text -->
                    <text x="30" y="18" text-anchor="middle" fill="white" font-family="Arial" font-size="10" font-weight="bold">${displayName.substring(0, 8)}</text>
                    <!-- Marker pin -->
                    <circle cx="30" cy="45" r="15" fill="${color}" stroke="white" stroke-width="2" opacity="${opacity}"/>
                    <!-- Inner dot -->
                    <circle cx="30" cy="45" r="6" fill="white"/>
                </svg>
            `;

            return 'data:image/svg+xml;base64,' + btoa(svgIcon);
        } catch (error) {
            console.warn('SVG marker failed, using simple fallback:', error);
            // Simple working fallback
            return `data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24'%3E%3Ccircle cx='12' cy='12' r='10' fill='${encodeURIComponent(color)}'/%3E%3C/svg%3E`;
        }
    };

    // Update additional markers (other devices) with enhanced status indicators
    const updateAdditionalMarkers = useCallback(() => {
        if (!mapInstanceRef.current || !window.mappls || !additionalMarkersRef.current) return;

        const map = mapInstanceRef.current;
        const currentMarkers = additionalMarkersRef.current;

        // Combine static additional markers with real-time tracking markers and tracked users
        const allAdditionalMarkers = [
            ...additionalMarkers,
            ...(realTimeTracking?.connectedDevices || []),
            ...trackedUsers
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

            // Simplify status indicator - no emojis
            let statusText = 'ACTIVE';
            if (timeSinceActivity > 5000) statusText = 'STALE';
            if (timeSinceActivity > 10000) statusText = 'OLD';

            const iconUrl = buildUserMarkerIcon(40, color, label, opacity, markerData.displayName || markerData.userId);

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
                        const updatedIconUrl = buildUserMarkerIcon(40, color, label, opacity, markerData.displayName || markerData.userId);
                        existingMarker.setIcon(updatedIconUrl);
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
                        icon_url: iconUrl
                    });

                    currentMarkers[id] = newMarker;
                    console.log(`[DEBUG MAP] Successfully created marker for device: ${id} with status: ${statusText}`);

                    // Add popup with device info and activity status
                    if (newMarker.bindPopup) {
                        const activityText = timeSinceActivity < 1000 ? 'Just now' :
                            timeSinceActivity < 5000 ? `${Math.round(timeSinceActivity / 1000)}s ago` :
                                timeSinceActivity < 60000 ? `${Math.round(timeSinceActivity / 1000)}s ago` :
                                    `${Math.round(timeSinceActivity / 60000)}m ago`;
                        newMarker.bindPopup(`Device: ${label}<br/>Last active: ${activityText}<br/>Status: ${statusText}`);
                    }
                } catch (e) {
                    console.error(`[DEBUG MAP] Failed to create marker for device ${id}:`, e);
                }
            }
        });

        console.log('[DEBUG MAP] Current markers on map:', Object.keys(currentMarkers));
    }, [additionalMarkers, realTimeTracking?.connectedDevices, trackedUsers]);

    // Create or update user marker
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

        // Desired marker size
        const baseSize = 40;
        const currentUser = userLocationTracking.currentUserId;
        const userName = user?.displayName || user?.email?.split('@')[0] || 'ME';
        const iconUrl = buildUserMarkerIcon(baseSize, '#ff4d4f', 'ME', 1.0, userName);

        if (!userMarkerRef.current) {
            try {
                userMarkerRef.current = new window.mappls.Marker({
                    position: newPosition,
                    map,
                    icon_url: iconUrl
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
    }, [additionalMarkers, realTimeTracking?.connectedDevices, trackedUsers, updateAdditionalMarkers]);

    // Real-time tracking integration (legacy)
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

    // User location tracking integration (new approach)
    useEffect(() => {
        console.log('[DEBUG MAP] User location tracking useEffect:', {
            publishCurrentUser,
            hasLatitude: !!latitude,
            hasLongitude: !!longitude,
            isPublishing: userLocationTracking.isPublishing,
            currentUserId: userLocationTracking.currentUserId
        });

        if (publishCurrentUser && latitude && longitude) {
            // Auto-start publishing when location is available
            if (!userLocationTracking.isPublishing) {
                console.log('[DEBUG MAP] Starting user location publishing...');
                userLocationTracking.startPublishing(latitude, longitude);
            } else {
                // Update location in Firebase
                userLocationTracking.updateLocation(latitude, longitude);
            }
        } else {
            console.log('[DEBUG MAP] Not publishing because:', {
                publishCurrentUser,
                hasLocation: !!(latitude && longitude)
            });
        }
    }, [publishCurrentUser, latitude, longitude, userLocationTracking]);

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
            <InternetConnection />
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
                    {isLocationEnabled && !isFollowing && (
                        <button onClick={followUserAgain} style={controlBtnStyle}>Recenter</button>
                    )}


                    {/* Additional markers count */}
                    {additionalMarkers.length > 0 && (
                        <div style={coordStyle}>
                            Static Markers: {additionalMarkers.length}
                        </div>
                    )}

                    {/* Tracked users count */}
                    {trackedUsers.length > 0 && (
                        <div style={coordStyle}>
                            Tracked Users: {trackedUsers.length}
                            <br />User IDs: {trackedUsers.map(u => u.userId).join(', ')}
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

// Helper function to assign consistent colors to users
const getUserColor = (userId) => {
    const colors = [
        '#e74c3c', // Red
        '#3498db', // Blue
        '#2ecc71', // Green
        '#f39c12', // Orange
        '#9b59b6', // Purple
        '#1abc9c', // Turquoise
        '#34495e', // Dark gray
        '#e67e22'  // Dark orange
    ];

    // Create a simple hash from userId to pick consistent color
    let hash = 0;
    for (let i = 0; i < userId.length; i++) {
        hash = userId.charCodeAt(i) + ((hash << 5) - hash);
    }

    return colors[Math.abs(hash) % colors.length];
};

export default Map;