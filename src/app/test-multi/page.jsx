"use client";
import { useState, useEffect } from 'react';
import Map from '@/components/Map';
import { useFirebase } from '@/context/Firebase';
import { useUserLocationTracking } from '@/hooks/useUserLocationTracking';

// Helper functions for connection status display
const getConnectionColor = (state) => {
    switch (state) {
        case 'online': case 'connected': case 'active': return '#00ff00';
        case 'connecting': case 'disconnecting': return '#ffaa00';
        case 'offline': case 'disconnected': return '#ff6666';
        case 'error': return '#ff0000';
        default: return '#ffffff';
    }
};

const getConnectionIcon = (state) => {
    switch (state) {
        case 'online': case 'connected': case 'active': return '🟢';
        case 'connecting': return '🟡';
        case 'disconnecting': return '🟠';
        case 'offline': case 'disconnected': return '🔴';
        case 'error': return '❌';
        default: return '⚪';
    }
};

const TestMultiDevicePage = () => {
    // No static devices - only real-time Firebase markers
    const [mockDevices, setMockDevices] = useState([]);
    const { user, database } = useFirebase();
    const { isPublishing, connectionState, isOnline, hasConnection } = useUserLocationTracking();

    const simulateMovement = () => {
        setMockDevices(prev => prev.map(device => ({
            ...device,
            lat: device.lat + (Math.random() - 0.5) * 0.01,
            lng: device.lng + (Math.random() - 0.5) * 0.01
        })));
    };

    const [deviceId, setDeviceId] = useState('device_loading');
    const [isMounted, setIsMounted] = useState(false);

    // Update deviceId on client side
    useEffect(() => {
        setIsMounted(true);
        let storedDeviceId = localStorage.getItem('deviceId');
        if (!storedDeviceId) {
            storedDeviceId = `device_${Date.now()}`;
            localStorage.setItem('deviceId', storedDeviceId);
        }
        setDeviceId(storedDeviceId);
    }, []);

    // Firebase status for debugging
    const firebaseStatus = {
        user: !!user,
        userId: user?.uid || 'Not logged in',
        database: !!database,
        email: user?.email || 'No email',
        publishing: isPublishing,
        connectionState: connectionState,
        isOnline: isOnline,
        hasConnection: hasConnection
    };

    return (
        <div style={{ position: 'relative', width: '100vw', height: '100vh' }}>
            <Map
                additionalMarkers={mockDevices}
                trackUserIds={['0NVs3tSbgHdOeYbltGpZYAgPRDN2']}
                publishCurrentUser={true}
                enableRealTimeTracking={true}
                deviceId={deviceId}
                followUser={true}
                onMapReady={(map) => { /* Map ready */ }}
                ref={(mapComponent) => {
                    // Store map component reference for debugging
                    if (mapComponent) {
                        window.debugMapComponent = mapComponent;
                    }
                }}
            />

            {/* Firebase Status Debug Panel */}
            <div style={{
                position: 'absolute',
                top: 20,
                left: 20,
                zIndex: 1300,
                background: 'rgba(0,0,0,0.9)',
                color: 'white',
                padding: '15px',
                borderRadius: '10px',
                fontSize: '12px',
                maxWidth: '300px'
            }}>
                <h4 style={{ margin: '0 0 10px 0', color: '#ffaa00', fontSize: '14px' }}>
                    🔧 Firebase Debug Status
                </h4>
                <div style={{ marginBottom: '5px' }}>
                    User Logged In: {firebaseStatus.user ? '✅' : '❌'}
                </div>
                <div style={{ marginBottom: '5px' }}>
                    User ID: {firebaseStatus.userId}
                </div>
                <div style={{ marginBottom: '5px' }}>
                    Email: {firebaseStatus.email}
                </div>
                <div style={{ marginBottom: '5px' }}>
                    Database: {firebaseStatus.database ? '✅' : '❌'}
                </div>
                <div style={{ marginBottom: '5px' }}>
                    Publishing: {firebaseStatus.publishing ? '🟢 Active' : '🔴 Inactive'}
                </div>
                <div style={{ marginBottom: '5px' }}>
                    Connection: <span style={{ color: getConnectionColor(firebaseStatus.connectionState) }}>
                        {getConnectionIcon(firebaseStatus.connectionState)} {firebaseStatus.connectionState}
                    </span>
                </div>
                <div style={{ marginBottom: '5px' }}>
                    Multi-Track Ready: {firebaseStatus.hasConnection ? '✅' : '❌'}
                </div>
                {!firebaseStatus.user && (
                    <div style={{ color: '#ff6666', marginTop: '10px' }}>
                        ⚠️ Login required for user tracking!<br />
                        Without login, only device tracking works.
                    </div>
                )}
            </div>

            {/* Test Controls */}
            <div style={{
                position: 'absolute',
                top: 20,
                right: 20,
                zIndex: 1300,
                background: 'rgba(0,0,0,0.8)',
                color: 'white',
                padding: '15px',
                borderRadius: '10px'
            }}>
                <h3 style={{ margin: '0 0 10px 0', fontSize: '16px' }}>
                    Real-Time Live Tracking
                </h3>

                <div style={{ marginTop: '10px', fontSize: '12px' }}>
                    <strong>Current Device:</strong> {isMounted ? deviceId.substr(-6) : 'Loading...'}
                    <br />
                    <strong>Real-time Tracking:</strong> ✅ Enabled
                    <br />
                    <strong>Publishing Location:</strong> ✅ Enabled
                    <br />
                    <strong>Tracking User:</strong> 0NVs3tSbgHdOeYbltGpZYAgPRDN2
                    <br />
                    <strong>Firebase Path:</strong> {isMounted ? `live_tracking/${deviceId.substr(-6)}` : 'live_tracking/...'}
                    <br />
                    <strong>User Path:</strong> user_locations/0NVs3tSbgHdOeYbltGpZYAgPRDN2
                    <br />
                    <strong>Presence Path:</strong> user_presence/0NVs3tSbgHdOeYbltGpZYAgPRDN2
                    <br />
                    <br />
                    <em>Open multiple tabs to see live markers!</em>
                    <br />
                    <em style={{ color: '#ffaa00' }}>Device ID persists across browser sessions</em>
                    <br />
                    <em style={{ color: '#00ff00' }}>Enhanced presence detection enabled!</em>
                    <br />
                    <em style={{ color: '#00aaff' }}>Real-time connection monitoring active</em>
                </div>
            </div>
        </div>
    );
};

export default TestMultiDevicePage;