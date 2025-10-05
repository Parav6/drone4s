import { useState, useEffect, useRef } from 'react';
import { useFirebase } from '@/context/Firebase';
import { ref, onValue, set, update, serverTimestamp, onDisconnect } from 'firebase/database';

export const useRealTimeTracking = (deviceId = null) => {
    const { database, user } = useFirebase(); // Get Firebase context
    const [connectedDevices, setConnectedDevices] = useState([]);
    const [isPublishing, setIsPublishing] = useState(false);
    const locationUpdateRef = useRef(null);
    const heartbeatRef = useRef(null);
    const sessionIdRef = useRef(null);

    // Debug hook initialization
    useEffect(() => {
        console.log('[DEBUG HOOK] useRealTimeTracking initialized with:', {
            deviceId,
            hasDatabase: !!database,
            hasUser: !!user,
            userUid: user?.uid
        });
    }, [deviceId, database, user]);

    // Generate unique session ID for this tab/window
    const getSessionId = () => {
        if (!sessionIdRef.current) {
            sessionIdRef.current = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        }
        return sessionIdRef.current;
    };

    // Start publishing current device location with enhanced presence detection
    const startPublishing = async (lat, lng, deviceName = 'Unknown') => {
        console.log('[DEBUG PUBLISH] startPublishing called with:', {
            deviceId,
            lat,
            lng,
            deviceName,
            hasDatabase: !!database
        });

        if (!deviceId || !database) {
            console.error('[DEBUG PUBLISH] Missing requirements:', {
                hasDeviceId: !!deviceId,
                hasDatabase: !!database
            });
            return;
        }

        // First, cleanup any old sessions for this device
        try {
            const deviceRef = ref(database, `live_tracking/${deviceId}`);
            const snapshot = await new Promise((resolve, reject) => {
                onValue(deviceRef, resolve, reject, { onlyOnce: true });
            });

            const existingData = snapshot.val();
            if (existingData && existingData.sessionId !== getSessionId()) {
                // Replace old session silently
            }
        } catch (error) {
            // No existing session, starting fresh
        }

        setIsPublishing(true);

        const deviceRef = ref(database, `live_tracking/${deviceId}`);

        // Set up Firebase presence detection - automatically mark as offline when connection is lost
        try {
            const disconnectRef = onDisconnect(deviceRef);
            await disconnectRef.update({
                status: 'offline',
                lastUpdate: Date.now(),
                disconnectedAt: Date.now(),
                reason: 'connection_lost'
            });
            console.log('Firebase presence detection set up for device:', deviceId);
        } catch (error) {
            console.warn('Failed to set up presence detection:', error);
        }

        // Set the initial device data
        set(deviceRef, {
            lat,
            lng,
            deviceName,
            userId: user?.uid || 'anonymous',
            lastUpdate: Date.now(),
            heartbeat: Date.now(),
            status: 'online',
            sessionId: getSessionId() // Unique session identifier
        }).catch(error => {
            console.error('Failed to publish location:', error);
            setIsPublishing(false);
        });
    };    // Update location for current device
    const updateLocation = (lat, lng) => {
        if (!deviceId || !isPublishing || !database) return;

        // Faster updates every 50ms for ultra-smooth tracking and quick presence detection
        const now = Date.now();
        if (locationUpdateRef.current && now - locationUpdateRef.current < 50) {
            return;
        }
        locationUpdateRef.current = now;

        const deviceRef = ref(database, `live_tracking/${deviceId}`);
        update(deviceRef, {
            lat,
            lng,
            lastUpdate: now,
            status: 'online',
            heartbeat: now // Additional timestamp for presence detection
        }).catch(error => {
            console.error('Failed to update location:', error);
        });
    };

    // Stop publishing
    const stopPublishing = () => {
        if (!deviceId || !database) return;

        setIsPublishing(false);

        const deviceRef = ref(database, `live_tracking/${deviceId}`);
        update(deviceRef, {
            status: 'offline',
            lastUpdate: Date.now()
        }).catch(error => {
            console.error('Failed to stop publishing:', error);
        });
    };

    // Aggressive heartbeat system to quickly detect disconnected devices
    useEffect(() => {
        if (!database) return;

        const checkDeviceStatuses = async () => {
            try {
                const trackingRef = ref(database, 'live_tracking');
                const snapshot = await new Promise((resolve, reject) => {
                    onValue(trackingRef, resolve, reject, { onlyOnce: true });
                });

                const data = snapshot.val();
                if (!data) return;

                const now = Date.now();
                const offlinePromises = [];
                const deletePromises = [];

                Object.entries(data).forEach(([id, device]) => {
                    if (device.status === 'online') {
                        const lastUpdate = device.lastUpdate || 0;
                        const timeSinceUpdate = now - lastUpdate;

                        // Mark as offline if no update in 10 seconds (faster detection)
                        if (timeSinceUpdate > 10000) {
                            console.log(`Marking device ${id} as offline - no update for ${timeSinceUpdate}ms`);

                            const deviceRef = ref(database, `live_tracking/${id}`);
                            const updatePromise = update(deviceRef, {
                                status: 'offline',
                                lastUpdate: now,
                                disconnectedAt: now
                            });

                            offlinePromises.push(updatePromise);
                        }
                    } else if (device.status === 'offline') {
                        // Remove completely offline devices after 2 minutes to clean up
                        const lastUpdate = device.lastUpdate || device.disconnectedAt || 0;
                        const timeSinceOffline = now - lastUpdate;

                        if (timeSinceOffline > 120000) { // 2 minutes
                            console.log(`Removing inactive device ${id} - offline for ${timeSinceOffline}ms`);
                            const deviceRef = ref(database, `live_tracking/${id}`);
                            const deletePromise = set(deviceRef, null); // Remove completely
                            deletePromises.push(deletePromise);
                        }
                    }
                });

                // Execute all updates
                const allPromises = [...offlinePromises, ...deletePromises];
                if (allPromises.length > 0) {
                    await Promise.all(allPromises);
                    console.log(`Processed ${offlinePromises.length} offline updates and ${deletePromises.length} deletions`);
                }
            } catch (error) {
                console.error('Heartbeat check failed:', error);
            }
        };

        // Much faster heartbeat - every 3 seconds for real-time detection
        heartbeatRef.current = setInterval(checkDeviceStatuses, 3000);

        // Initial check
        checkDeviceStatuses();

        return () => {
            if (heartbeatRef.current) {
                clearInterval(heartbeatRef.current);
                heartbeatRef.current = null;
            }
        };
    }, [database]);

    // Listen to all devices with enhanced filtering
    useEffect(() => {
        console.log('[DEBUG LISTENER] Setting up Firebase listener with:', {
            hasDatabase: !!database,
            deviceId,
            databaseURL: database?.app?.options?.databaseURL
        });

        if (!database || !deviceId) {
            console.log('[DEBUG LISTENER] Missing requirements - clearing devices');
            setConnectedDevices([]);
            return;
        }

        console.log('[DEBUG LISTENER] Creating Firebase reference: live_tracking');
        const trackingRef = ref(database, 'live_tracking');

        const unsubscribe = onValue(trackingRef, (snapshot) => {
            const data = snapshot.val();
            if (!data) {
                console.log('[DEBUG] No tracking data found in Firebase');
                setConnectedDevices([]);
                return;
            }

            console.log('[DEBUG] Firebase tracking data:', Object.keys(data));
            console.log('[DEBUG] Current deviceId:', deviceId);

            // Create a map to track unique devices (latest session wins)
            const deviceMap = new Map();
            const now = Date.now();

            Object.entries(data).forEach(([id, device]) => {
                console.log(`[DEBUG] Processing device ${id}:`, {
                    status: device.status,
                    hasLat: !!device.lat,
                    hasLng: !!device.lng,
                    lastUpdate: device.lastUpdate,
                    heartbeat: device.heartbeat,
                    deviceName: device.deviceName
                });

                // Filter out current device and offline devices
                const isOtherDevice = id !== deviceId;
                const isOnline = device.status === 'online';
                const hasLocation = device.lat && device.lng && !isNaN(device.lat) && !isNaN(device.lng);

                // Relaxed check: ensure device was recently active (within last 30 seconds)
                const lastActivity = Math.max(
                    device.lastUpdate || 0,
                    device.heartbeat || 0
                );
                const timeSinceActivity = now - lastActivity;
                const isRecentlyActive = timeSinceActivity < 30000; // 30 seconds tolerance

                console.log(`[DEBUG] Device ${id} filters:`, {
                    isOtherDevice,
                    isOnline,
                    hasLocation,
                    timeSinceActivity,
                    isRecentlyActive
                });

                if (isOtherDevice && isOnline && hasLocation && isRecentlyActive) {
                    console.log(`[DEBUG] Device ${id} passed all filters - adding to map`);

                    const deviceKey = id;

                    const deviceInfo = {
                        id,
                        lat: parseFloat(device.lat),
                        lng: parseFloat(device.lng),
                        label: device.deviceName?.substring(0, 2)?.toUpperCase() || 'D',
                        color: getDeviceColor(id),
                        lastUpdate: device.lastUpdate,
                        lastActivity: lastActivity,
                        userId: device.userId,
                        sessionId: device.sessionId,
                        timeSinceActivity: timeSinceActivity
                    };

                    deviceMap.set(deviceKey, deviceInfo);
                    console.log(`[DEBUG] Added device to map:`, deviceInfo);
                } else {
                    console.log(`[DEBUG] Device ${id} filtered out:`, {
                        isOtherDevice,
                        isOnline,
                        hasLocation,
                        isRecentlyActive
                    });
                }
            });

            const devices = Array.from(deviceMap.values());

            console.log(`Real-time tracking: ${devices.length} active devices detected`);

            // Immediate state update for smooth UI
            setConnectedDevices(devices);
        }, (error) => {
            console.error('Firebase listener error:', error);
            setConnectedDevices([]);
        });

        return () => unsubscribe();
    }, [deviceId, database]);    // Enhanced cleanup on unmount and window events
    useEffect(() => {
        const handleBeforeUnload = () => {
            if (isPublishing && deviceId && database) {
                // Synchronously mark as offline when tab/window closes
                const deviceRef = ref(database, `live_tracking/${deviceId}`);
                update(deviceRef, {
                    status: 'offline',
                    lastUpdate: Date.now(),
                    disconnectedAt: Date.now(),
                    reason: 'beforeunload'
                }).catch(() => {
                    // Ignore errors during cleanup
                });
            }
        };

        const handleVisibilityChange = () => {
            if (document.hidden && isPublishing) {
                // Page hidden - mark as offline immediately
                console.log('Page hidden - marking device offline');
                const deviceRef = ref(database, `live_tracking/${deviceId}`);
                update(deviceRef, {
                    status: 'offline',
                    lastUpdate: Date.now(),
                    disconnectedAt: Date.now(),
                    reason: 'page_hidden'
                }).catch(() => { });

                setIsPublishing(false);
            } else if (!document.hidden && !isPublishing && deviceId) {
                // Page visible again - device ready to restart tracking
                console.log('Page visible again - ready to restart tracking');
            }
        };

        // Handle page focus/blur for additional cleanup
        const handlePageFocus = () => {
            // Page regained focus
            if (!isPublishing && deviceId) {
                console.log('Page focused - ready to restart tracking');
            }
        };

        const handlePageBlur = () => {
            // Page lost focus - prepare for potential disconnection
            if (isPublishing && deviceId && database) {
                console.log('Page blurred - updating status');
                const deviceRef = ref(database, `live_tracking/${deviceId}`);
                update(deviceRef, {
                    status: 'online', // Keep online but mark the blur time
                    lastUpdate: Date.now(),
                    lastBlur: Date.now()
                }).catch(() => { });
            }
        };

        // Add all event listeners
        window.addEventListener('beforeunload', handleBeforeUnload);
        document.addEventListener('visibilitychange', handleVisibilityChange);
        window.addEventListener('focus', handlePageFocus);
        window.addEventListener('blur', handlePageBlur);

        // Mobile-specific events
        window.addEventListener('pagehide', handleBeforeUnload);
        window.addEventListener('pageshow', handlePageFocus);

        return () => {
            // Cleanup on unmount
            handleBeforeUnload();

            // Remove all event listeners
            window.removeEventListener('beforeunload', handleBeforeUnload);
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            window.removeEventListener('focus', handlePageFocus);
            window.removeEventListener('blur', handlePageBlur);
            window.removeEventListener('pagehide', handleBeforeUnload);
            window.removeEventListener('pageshow', handlePageFocus);

            // Clear heartbeat
            if (heartbeatRef.current) {
                clearInterval(heartbeatRef.current);
                heartbeatRef.current = null;
            }

            if (isPublishing) {
                stopPublishing();
            }
        };
    }, [isPublishing, deviceId, database]);

    return {
        connectedDevices,
        isPublishing,
        startPublishing,
        updateLocation,
        stopPublishing
    };
};

// Helper function to assign consistent colors to devices
const getDeviceColor = (deviceId) => {
    const colors = [
        '#00ff00', // Green
        '#0066ff', // Blue  
        '#ff6600', // Orange
        '#ff00ff', // Magenta
        '#ffff00', // Yellow
        '#00ffff', // Cyan
        '#ff3366', // Pink
        '#9966ff'  // Purple
    ];

    // Create a simple hash from deviceId to pick consistent color
    let hash = 0;
    for (let i = 0; i < deviceId.length; i++) {
        hash = deviceId.charCodeAt(i) + ((hash << 5) - hash);
    }

    return colors[Math.abs(hash) % colors.length];
};

export default useRealTimeTracking;