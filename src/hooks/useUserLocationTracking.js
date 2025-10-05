import { useState, useEffect, useRef } from 'react';
import { useFirebase } from '@/context/Firebase';
import { ref, set, update, onDisconnect, serverTimestamp, goOnline, goOffline } from 'firebase/database';

export const useUserLocationTracking = () => {
    const { database, user } = useFirebase();
    const [isPublishing, setIsPublishing] = useState(false);
    const [connectionState, setConnectionState] = useState('connecting');
    const locationUpdateRef = useRef(null);
    const heartbeatRef = useRef(null);
    const presenceRef = useRef(null);
    const disconnectHandlerRef = useRef(null);

    // Debug hook initialization
    useEffect(() => {
        console.log('[DEBUG USER LOCATION] Hook initialized with:', {
            hasDatabase: !!database,
            hasUser: !!user,
            userUid: user?.uid
        });
    }, [database, user]);

    // Start publishing user location directly by userId
    const startPublishing = async (lat, lng, displayName = null) => {
        console.log('[DEBUG USER LOCATION] startPublishing called with:', {
            lat, lng, displayName,
            user: user ? { uid: user.uid, email: user.email } : null,
            hasDatabase: !!database,
            databaseApp: database?.app?.name || 'none'
        });

        if (!user?.uid || !database) {
            console.error('[DEBUG USER LOCATION] Missing requirements:', {
                hasUser: !!user?.uid,
                hasDatabase: !!database,
                userUid: user?.uid || 'NO USER',
                databaseStatus: database ? 'Connected' : 'Not connected'
            });
            console.error('[DEBUG USER LOCATION] 🚨 SOLUTION: Make sure user is logged in and Firebase is initialized!');
            return;
        }

        const userId = user.uid;
        console.log('[DEBUG USER LOCATION] Starting publishing for user:', userId);

        setIsPublishing(true);
        setConnectionState('connecting');

        const userRef = ref(database, `user_locations/${userId}`);
        const presenceStatusRef = ref(database, `user_presence/${userId}`);
        presenceRef.current = userRef;

        // Enhanced Firebase presence detection
        try {
            // Set up multiple disconnect handlers for comprehensive offline detection
            const userDisconnectRef = onDisconnect(userRef);
            const presenceDisconnectRef = onDisconnect(presenceStatusRef);

            // User location disconnect handler
            await userDisconnectRef.update({
                status: 'offline',
                lastUpdate: serverTimestamp(),
                disconnectedAt: serverTimestamp(),
                reason: 'connection_lost',
                isOnline: false
            });

            // Separate presence status for better tracking
            await presenceDisconnectRef.set({
                status: 'offline',
                lastSeen: serverTimestamp(),
                userId: userId,
                disconnectReason: 'firebase_disconnect'
            });

            disconnectHandlerRef.current = { userDisconnectRef, presenceDisconnectRef };
            console.log('🟢 Enhanced presence detection set up for user:', userId);
            setConnectionState('connected');
        } catch (error) {
            console.warn('⚠️ Failed to set up presence detection:', error);
            setConnectionState('error');
        }

        // Set the initial user location data with enhanced status
        try {
            const initialData = {
                lat,
                lng,
                displayName: displayName || user.displayName || user.email || `User ${userId.substring(0, 8)}`,
                userId: userId,
                lastUpdate: serverTimestamp(),
                heartbeat: serverTimestamp(),
                status: 'online',
                isOnline: true,
                deviceName: getDeviceName(),
                browserInfo: getBrowserInfo(),
                startedAt: serverTimestamp(),
                sessionId: `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                connectionState: 'active'
            };

            await set(userRef, initialData);

            // Also update presence status
            await set(presenceStatusRef, {
                status: 'online',
                lastSeen: serverTimestamp(),
                userId: userId,
                sessionId: initialData.sessionId
            });

            console.log('✅ User location and presence published successfully for:', userId);
            setConnectionState('online');
        } catch (error) {
            console.error('❌ Failed to publish user location:', error);
            setIsPublishing(false);
            setConnectionState('error');
        }
    };

    // Update location for current user
    const updateLocation = (lat, lng) => {
        if (!user?.uid || !isPublishing || !database) return;

        // Throttle updates every 100ms for smooth tracking
        const now = Date.now();
        if (locationUpdateRef.current && now - locationUpdateRef.current < 100) {
            return;
        }
        locationUpdateRef.current = now;

        const userRef = ref(database, `user_locations/${user.uid}`);
        const presenceRef = ref(database, `user_presence/${user.uid}`);

        const updateData = {
            lat,
            lng,
            lastUpdate: serverTimestamp(),
            status: 'online',
            isOnline: true,
            heartbeat: serverTimestamp(),
            connectionState: 'active',
            movementDetected: true
        };

        // Update both location and presence
        Promise.all([
            update(userRef, updateData),
            update(presenceRef, {
                status: 'online',
                lastSeen: serverTimestamp(),
                lastActivity: 'location_update'
            })
        ]).catch(error => {
            console.error('Failed to update user location/presence:', error);
            setConnectionState('error');
        });
    };

    // Stop publishing with comprehensive cleanup
    const stopPublishing = async (reason = 'manual_stop') => {
        if (!user?.uid || !database) return;

        console.log(`🔴 Stopping publishing for user ${user.uid}, reason: ${reason}`);
        setIsPublishing(false);
        setConnectionState('disconnecting');

        const userRef = ref(database, `user_locations/${user.uid}`);
        const presenceRef = ref(database, `user_presence/${user.uid}`);

        try {
            // Update both location and presence status
            await Promise.all([
                update(userRef, {
                    status: 'offline',
                    isOnline: false,
                    lastUpdate: serverTimestamp(),
                    disconnectedAt: serverTimestamp(),
                    disconnectReason: reason,
                    connectionState: 'disconnected'
                }),
                update(presenceRef, {
                    status: 'offline',
                    lastSeen: serverTimestamp(),
                    disconnectReason: reason
                })
            ]);

            console.log('✅ Successfully marked user as offline');
            setConnectionState('offline');
        } catch (error) {
            console.error('❌ Failed to stop publishing:', error);
            setConnectionState('error');
        }
    };

    // Enhanced heartbeat with presence monitoring
    useEffect(() => {
        if (!isPublishing || !user?.uid || !database) return;

        const heartbeat = () => {
            const userRef = ref(database, `user_locations/${user.uid}`);
            const presenceRef = ref(database, `user_presence/${user.uid}`);

            const heartbeatData = {
                heartbeat: serverTimestamp(),
                status: 'online',
                isOnline: true,
                connectionState: 'active',
                lastActivity: 'heartbeat'
            };

            // Update both location and presence heartbeat
            Promise.all([
                update(userRef, heartbeatData),
                update(presenceRef, {
                    status: 'online',
                    lastSeen: serverTimestamp(),
                    lastActivity: 'heartbeat'
                })
            ]).catch((error) => {
                console.warn('Heartbeat failed, connection may be lost:', error);
                setConnectionState('error');
            });
        };

        // Send heartbeat every 3 seconds for better real-time tracking
        heartbeatRef.current = setInterval(heartbeat, 3000);

        // Initial heartbeat
        heartbeat();

        return () => {
            if (heartbeatRef.current) {
                clearInterval(heartbeatRef.current);
                heartbeatRef.current = null;
            }
        };
    }, [isPublishing, user?.uid, database]);

    // Enhanced cleanup with comprehensive event handling
    useEffect(() => {
        const handleBeforeUnload = () => {
            if (isPublishing && user?.uid && database) {
                console.log('🔴 Browser closing - marking user offline');
                // Use sendBeacon for reliable cleanup during page unload
                const userRef = ref(database, `user_locations/${user.uid}`);
                const presenceRef = ref(database, `user_presence/${user.uid}`);

                Promise.all([
                    update(userRef, {
                        status: 'offline',
                        isOnline: false,
                        lastUpdate: serverTimestamp(),
                        disconnectedAt: serverTimestamp(),
                        disconnectReason: 'beforeunload',
                        connectionState: 'disconnected'
                    }),
                    update(presenceRef, {
                        status: 'offline',
                        lastSeen: serverTimestamp(),
                        disconnectReason: 'beforeunload'
                    })
                ]).catch(() => {
                    // Ignore errors during cleanup
                });
            }
        };

        const handleVisibilityChange = () => {
            if (document.hidden && isPublishing) {
                console.log('📱 Page hidden - temporarily going offline');
                stopPublishing('page_hidden');
            } else if (!document.hidden && !isPublishing && user?.uid) {
                console.log('📱 Page visible - attempting to reconnect');
                // Could auto-restart if needed
            }
        };

        const handleOnline = () => {
            console.log('🌐 Internet connection restored');
            setConnectionState('online');
        };

        const handleOffline = () => {
            console.log('🚫 Internet connection lost');
            setConnectionState('offline');
            if (isPublishing) {
                stopPublishing('connection_lost');
            }
        };

        const handleFocus = () => {
            console.log('🔄 Window focused - checking connection');
            if (!isPublishing && user?.uid && database) {
                // Could auto-restart tracking
            }
        };

        // Add comprehensive event listeners
        window.addEventListener('beforeunload', handleBeforeUnload);
        window.addEventListener('pagehide', handleBeforeUnload);
        document.addEventListener('visibilitychange', handleVisibilityChange);
        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);
        window.addEventListener('focus', handleFocus);

        return () => {
            // Cleanup on unmount
            handleBeforeUnload();

            // Remove all event listeners
            window.removeEventListener('beforeunload', handleBeforeUnload);
            window.removeEventListener('pagehide', handleBeforeUnload);
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
            window.removeEventListener('focus', handleFocus);

            // Clear heartbeat
            if (heartbeatRef.current) {
                clearInterval(heartbeatRef.current);
                heartbeatRef.current = null;
            }
        };
    }, [isPublishing, user?.uid, database]);

    return {
        isPublishing,
        connectionState,
        startPublishing,
        updateLocation,
        stopPublishing,
        currentUserId: user?.uid,
        isOnline: connectionState === 'online',
        hasConnection: ['online', 'connected', 'active'].includes(connectionState)
    };
};

// Helper function to get device name
const getDeviceName = () => {
    const userAgent = navigator.userAgent;

    if (/Mobile|Android|iPhone|iPad/.test(userAgent)) {
        if (/iPhone/.test(userAgent)) return 'iPhone';
        if (/iPad/.test(userAgent)) return 'iPad';
        if (/Android/.test(userAgent)) return 'Android';
        return 'Mobile';
    }

    if (/Mac/.test(userAgent)) return 'Mac';
    if (/Windows/.test(userAgent)) return 'Windows';
    if (/Linux/.test(userAgent)) return 'Linux';

    return 'Computer';
};

// Helper function to get browser info
const getBrowserInfo = () => {
    const userAgent = navigator.userAgent;

    if (/Chrome/.test(userAgent)) return 'Chrome';
    if (/Firefox/.test(userAgent)) return 'Firefox';
    if (/Safari/.test(userAgent) && !/Chrome/.test(userAgent)) return 'Safari';
    if (/Edge/.test(userAgent)) return 'Edge';

    return 'Unknown';
};

export default useUserLocationTracking;