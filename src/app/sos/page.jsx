"use client";
import { useState, useEffect } from "react";
import InternetConnection from "@/components/InternetConnection";
import LocationPermissionOverlay from "@/components/LocationPermissionOverlay";
import ProtectedRoute from "@/components/ProtectedRoute";
import Map from "@/components/Map";
import { useSOSProtection } from "@/hooks/useSOSProtection";
import { useFirebase } from "@/context/Firebase";
import { useRouter } from "next/navigation";

const SOS = () => {
    const [showCancelConfirmation, setShowCancelConfirmation] = useState(false);
    const [showCallOptions, setShowCallOptions] = useState(false);
    const [showInstructions, setShowInstructions] = useState(false);
    const [showGuardStatus, setShowGuardStatus] = useState(false);
    const [uniqueDeviceId, setUniqueDeviceId] = useState(null);
    const [assignedGuardId, setAssignedGuardId] = useState(null);
    const [currentTime, setCurrentTime] = useState(Date.now());
    const { sosActive, sosData, disableSOS, getSOSStatusMessage, getAssignedGuard, loading } = useSOSProtection();
    const { user } = useFirebase();
    const router = useRouter();

    // Generate unique device ID on component mount
    useEffect(() => {
        // Create unique device ID using user ID + timestamp + random string
        const generateUniqueDeviceId = () => {
            const userPart = user?.uid || 'anonymous';
            const timestamp = Date.now();
            const randomPart = Math.random().toString(36).substr(2, 6);
            const browserInfo = navigator.userAgent.slice(-10); // Last 10 chars for uniqueness
            const deviceId = `device_${userPart}_${timestamp}_${randomPart}_${browserInfo.replace(/[^a-zA-Z0-9]/g, '')}`;
            console.log('[SOS] Generated unique device ID:', deviceId);
            return deviceId;
        };

        if (!uniqueDeviceId) {
            setUniqueDeviceId(generateUniqueDeviceId());
        }
    }, [user?.uid, uniqueDeviceId]);

    // Redirect to dashboard if SOS is not active
    useEffect(() => {
        if (!loading && !sosActive) {
            router.push('/dashboard');
        }
    }, [sosActive, loading, router]);

    // Update assigned guard ID when guard assignment changes
    useEffect(() => {
        if (sosActive && !loading) {
            const assignedGuard = getAssignedGuard();
            if (assignedGuard && assignedGuard.guardId) {
                setAssignedGuardId(assignedGuard.guardId);
                console.log('Assigned guard ID updated:', assignedGuard.guardId);
            } else {
                setAssignedGuardId(null);
                console.log('No guard assigned, guard ID cleared');
            }
        }
    }, [sosActive, loading, sosData, getAssignedGuard]);

    // Timer effect for real-time updates
    useEffect(() => {
        if (sosActive) {
            const interval = setInterval(() => {
                setCurrentTime(Date.now());
            }, 1000);
            return () => clearInterval(interval);
        }
    }, [sosActive]);

    const handleCancelSOS = () => {
        setShowCancelConfirmation(true);
    };

    const handleConfirmCancel = async () => {
        setShowCancelConfirmation(false);
        try {
            await disableSOS();
            // Redirect to dashboard after canceling SOS
            router.push('/dashboard');
        } catch (error) {
            console.error('Failed to cancel SOS:', error);
            alert('Failed to cancel SOS. Please try again.');
        }
    };

    const handleKeepSOS = () => {
        setShowCancelConfirmation(false);
    };

    // Show loading while checking SOS status
    if (loading) {
        return (
            <>
                <ProtectedRoute>
                    <div style={{
                        minHeight: '100vh',
                        backgroundColor: '#dc2626',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white'
                    }}>
                        <div style={{ textAlign: 'center' }}>
                            <div style={{
                                width: '60px',
                                height: '60px',
                                border: '4px solid #333',
                                borderTop: '4px solid #fff',
                                borderRadius: '50%',
                                animation: 'spin 1s linear infinite',
                                margin: '0 auto 30px'
                            }}></div>
                            <div style={{ fontSize: '18px', fontWeight: '500' }}>
                                Checking SOS Status...
                            </div>
                        </div>
                        <style jsx>{`
                            @keyframes spin {
                                0% { transform: rotate(0deg); }
                                100% { transform: rotate(360deg); }
                            }
                        `}</style>
                    </div>
                </ProtectedRoute>
            </>
        );
    }

    // Redirect if SOS is not active (this will be handled by useEffect, but as fallback)
    if (!sosActive) {
        return (
            <>
                <ProtectedRoute>
                    <div style={{
                        minHeight: '100vh',
                        backgroundColor: '#333',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        textAlign: 'center'
                    }}>
                        <div>
                            <div style={{ fontSize: '50px', marginBottom: '20px' }}>⚠️</div>
                            <h2>No Active SOS</h2>
                            <p>Redirecting to dashboard...</p>
                        </div>
                    </div>
                </ProtectedRoute>
            </>
        );
    }

    return (
        <>
            <ProtectedRoute>
                <div style={{
                    minHeight: '100vh',
                    backgroundColor: '#f8f9fa',
                    padding: '0',
                    display: 'flex',
                    flexDirection: 'column',
                    overflowX: 'hidden',
                    width: '100%',
                    maxWidth: '100vw'
                }}>
                    {/* Top Status Bar */}
                    <div style={{
                        backgroundColor: '#dc2626',
                        color: 'white',
                        padding: window.innerWidth < 768 ? '8px 10px' : '15px 20px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
                        gap: window.innerWidth < 768 ? '2px' : '12px',
                        overflowX: 'hidden',
                        width: '100%',
                        boxSizing: 'border-box'
                    }}>
                        {/* Left Side - SOS Status */}
                        <div style={{ display: 'flex', alignItems: 'center', flex: 1, minWidth: 0 }}>
                            <div style={{
                                fontSize: window.innerWidth < 768 ? '14px' : '24px',
                                marginRight: window.innerWidth < 768 ? '4px' : '10px',
                                animation: 'emergencyBlink 1s infinite',
                                flexShrink: 0
                            }}>
                                🚨
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{
                                    fontSize: window.innerWidth < 768 ? '12px' : '18px',
                                    fontWeight: 'bold',
                                    lineHeight: window.innerWidth < 768 ? '1' : '1.2'
                                }}>
                                    SOS ACTIVE
                                </div>
                                {sosData?.startTime && (
                                    <div style={{
                                        fontSize: window.innerWidth < 768 ? '8px' : '12px',
                                        opacity: 0.9,
                                        lineHeight: window.innerWidth < 768 ? '1' : '1.2'
                                    }}>
                                        {(() => {
                                            const duration = Math.floor((currentTime - sosData.startTime) / 1000);
                                            const minutes = Math.floor(duration / 60);
                                            const seconds = duration % 60;
                                            return `SOS Active for ${minutes}:${seconds.toString().padStart(2, '0')}`;
                                        })()}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Right Side - Stop SOS Button (fixed alignment) */}
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'flex-end',
                            flex: 'none',
                            minWidth: 0,
                            width: '100%',
                            maxWidth: '180px',
                            overflow: 'hidden',
                        }}>
                            <button
                                onClick={handleCancelSOS}
                                style={{
                                    backgroundColor: '#16a34a',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '3px',
                                    padding: window.innerWidth < 768 ? '2px 6px' : '8px 16px',
                                    fontSize: window.innerWidth < 768 ? '10px' : '14px',
                                    fontWeight: 'bold',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    transition: 'all 0.3s ease',
                                    boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
                                    flexShrink: 0,
                                    whiteSpace: 'nowrap',
                                    lineHeight: window.innerWidth < 768 ? '1' : 'normal',
                                    width: '100%',
                                    maxWidth: '180px',
                                    overflow: 'hidden',
                                }}
                                onMouseEnter={(e) => {
                                    e.target.style.backgroundColor = '#15803d';
                                    e.target.style.transform = 'scale(1.05)';
                                }}
                                onMouseLeave={(e) => {
                                    e.target.style.backgroundColor = '#16a34a';
                                    e.target.style.transform = 'scale(1)';
                                }}
                                title="Stop SOS - I am Safe"
                            >
                                <>
                                    <span style={{ fontSize: '14px' }}>✅</span>
                                    <span style={{ marginLeft: '6px' }}>I'M SAFE</span>
                                </>
                            </button>
                        </div>
                    </div>

                    {/* Main Content Area - Full Map */}
                    <div style={{
                        flex: 1,
                        display: 'flex',
                        flexDirection: 'column'
                    }}>
                        {/* Full-Screen Map Area with Floating Action Buttons */}
                        <div style={{
                            backgroundColor: 'white',
                            flex: 1,
                            position: 'relative',
                            overflow: 'hidden',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            border: '2px dashed #e5e7eb',
                            minHeight: 'calc(100vh - 80px)' // Full height minus status bar
                        }}>
                            {/* Live Map Component - Real-time tracking for user and guards */}
                            {uniqueDeviceId ? (
                                <Map
                                    zoom={16}
                                    followUser={true}
                                    trackUserIds={assignedGuardId ? [assignedGuardId] : []}
                                    enableRealTimeTracking={true}
                                    publishCurrentUser={true}
                                    deviceId={uniqueDeviceId} // Use unique device ID
                                    additionalMarkers={[]} // Real-time data will come from Firebase
                                    onMapReady={(map) => {
                                        console.log('SOS Map Ready - Real-time tracking active with device ID:', uniqueDeviceId);
                                    }}
                                />
                            ) : (
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: '#666',
                                    fontSize: '16px'
                                }}>
                                    <div style={{
                                        width: '40px',
                                        height: '40px',
                                        border: '4px solid #ddd',
                                        borderTop: '4px solid #dc2626',
                                        borderRadius: '50%',
                                        animation: 'spin 1s linear infinite',
                                        marginRight: '15px'
                                    }}></div>
                                    Initializing Real-time Tracking...
                                </div>
                            )}

                            {/* Left Side Guard Status Button */}
                            <div style={{
                                position: 'absolute',
                                top: '15px',
                                left: '15px',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '10px'
                            }}>
                                {/* Guard Status Button */}
                                <button
                                    onClick={() => setShowGuardStatus(!showGuardStatus)}
                                    style={{
                                        width: '50px',
                                        height: '50px',
                                        borderRadius: '50%',
                                        backgroundColor: '#7c3aed',
                                        color: 'white',
                                        border: 'none',
                                        fontSize: '20px',
                                        cursor: 'pointer',
                                        boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
                                        transition: 'all 0.3s ease',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center'
                                    }}
                                    onMouseEnter={(e) => {
                                        e.target.style.transform = 'scale(1.1)';
                                        e.target.style.boxShadow = '0 6px 16px rgba(0,0,0,0.3)';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.target.style.transform = 'scale(1)';
                                        e.target.style.boxShadow = '0 4px 12px rgba(0,0,0,0.2)';
                                    }}
                                    title="Guard Status"
                                >
                                    🛡️
                                </button>
                            </div>

                            {/* Floating Action Buttons */}
                            <div style={{
                                position: 'absolute',
                                top: '15px',
                                right: '15px',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '10px'
                            }}>
                                {/* Call Emergency Button */}
                                <button
                                    onClick={() => setShowCallOptions(!showCallOptions)}
                                    style={{
                                        width: '50px',
                                        height: '50px',
                                        borderRadius: '50%',
                                        backgroundColor: '#dc2626',
                                        color: 'white',
                                        border: 'none',
                                        fontSize: '20px',
                                        cursor: 'pointer',
                                        boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
                                        transition: 'all 0.3s ease',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        animation: 'emergencyPulse 2s infinite'
                                    }}
                                    onMouseEnter={(e) => {
                                        e.target.style.transform = 'scale(1.1)';
                                        e.target.style.boxShadow = '0 6px 16px rgba(0,0,0,0.3)';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.target.style.transform = 'scale(1)';
                                        e.target.style.boxShadow = '0 4px 12px rgba(0,0,0,0.2)';
                                    }}
                                    title="Call Emergency"
                                >
                                    📞
                                </button>

                                {/* Instructions Button */}
                                <button
                                    onClick={() => setShowInstructions(!showInstructions)}
                                    style={{
                                        width: '50px',
                                        height: '50px',
                                        borderRadius: '50%',
                                        backgroundColor: '#f59e0b',
                                        color: 'white',
                                        border: 'none',
                                        fontSize: '20px',
                                        cursor: 'pointer',
                                        boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
                                        transition: 'all 0.3s ease',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center'
                                    }}
                                    onMouseEnter={(e) => {
                                        e.target.style.transform = 'scale(1.1)';
                                        e.target.style.boxShadow = '0 6px 16px rgba(0,0,0,0.3)';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.target.style.transform = 'scale(1)';
                                        e.target.style.boxShadow = '0 4px 12px rgba(0,0,0,0.2)';
                                    }}
                                    title="Emergency Instructions"
                                >
                                    ℹ️
                                </button>
                            </div>

                            {/* Call Options Popup */}
                            {showCallOptions && (
                                <div style={{
                                    position: 'absolute',
                                    top: '15px',
                                    right: '75px',
                                    backgroundColor: 'white',
                                    borderRadius: '12px',
                                    boxShadow: '0 8px 25px rgba(0,0,0,0.3)',
                                    padding: '10px',
                                    zIndex: 1000,
                                    minWidth: '180px'
                                }}>
                                    <div style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '10px', color: '#dc2626' }}>
                                        🚨 Emergency Numbers
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                        <button
                                            onClick={() => {
                                                window.location.href = 'tel:112';
                                                setShowCallOptions(false);
                                            }}
                                            style={{
                                                backgroundColor: '#dc2626',
                                                color: 'white',
                                                border: 'none',
                                                borderRadius: '8px',
                                                padding: '8px 12px',
                                                fontSize: '12px',
                                                cursor: 'pointer'
                                            }}
                                        >
                                            🆘 112 - Emergency
                                        </button>
                                        <button
                                            onClick={() => {
                                                window.location.href = 'tel:100';
                                                setShowCallOptions(false);
                                            }}
                                            style={{
                                                backgroundColor: '#1e40af',
                                                color: 'white',
                                                border: 'none',
                                                borderRadius: '8px',
                                                padding: '8px 12px',
                                                fontSize: '12px',
                                                cursor: 'pointer'
                                            }}
                                        >
                                            👮 100 - Police
                                        </button>
                                        <button
                                            onClick={() => {
                                                window.location.href = 'tel:101';
                                                setShowCallOptions(false);
                                            }}
                                            style={{
                                                backgroundColor: '#dc2626',
                                                color: 'white',
                                                border: 'none',
                                                borderRadius: '8px',
                                                padding: '8px 12px',
                                                fontSize: '12px',
                                                cursor: 'pointer'
                                            }}
                                        >
                                            🔥 101 - Fire
                                        </button>
                                        <button
                                            onClick={() => {
                                                window.location.href = 'tel:108';
                                                setShowCallOptions(false);
                                            }}
                                            style={{
                                                backgroundColor: '#16a34a',
                                                color: 'white',
                                                border: 'none',
                                                borderRadius: '8px',
                                                padding: '8px 12px',
                                                fontSize: '12px',
                                                cursor: 'pointer'
                                            }}
                                        >
                                            🚑 108 - Ambulance
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Instructions Popup */}
                            {showInstructions && (
                                <div style={{
                                    position: 'absolute',
                                    top: '75px',
                                    right: '75px',
                                    backgroundColor: 'white',
                                    borderRadius: '12px',
                                    boxShadow: '0 8px 25px rgba(0,0,0,0.3)',
                                    padding: '15px',
                                    zIndex: 1000,
                                    minWidth: '220px',
                                    maxWidth: '280px'
                                }}>
                                    <div style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '12px', color: '#f59e0b' }}>
                                        ⚠️ Emergency Instructions
                                    </div>
                                    <div style={{ fontSize: '12px', color: '#333', lineHeight: '1.5' }}>
                                        <div style={{ marginBottom: '8px' }}>
                                            <strong>1. Stay Calm:</strong> Take deep breaths and assess your situation
                                        </div>
                                        <div style={{ marginBottom: '8px' }}>
                                            <strong>2. Find Safety:</strong> Move to a safe location if possible
                                        </div>
                                        <div style={{ marginBottom: '8px' }}>
                                            <strong>3. Call Help:</strong> Use the call button to contact emergency services
                                        </div>
                                        <div style={{ marginBottom: '8px' }}>
                                            <strong>4. Stay Connected:</strong> Keep your phone charged and accessible
                                        </div>
                                        <div style={{ marginBottom: '8px' }}>
                                            <strong>5. Wait for Help:</strong> Emergency contacts have been notified
                                        </div>
                                        <button
                                            onClick={() => setShowInstructions(false)}
                                            style={{
                                                backgroundColor: '#f59e0b',
                                                color: 'white',
                                                border: 'none',
                                                borderRadius: '6px',
                                                padding: '6px 12px',
                                                fontSize: '11px',
                                                cursor: 'pointer',
                                                marginTop: '10px',
                                                width: '100%'
                                            }}
                                        >
                                            Close
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Guard Status Popup */}
                            {showGuardStatus && (
                                <div style={{
                                    position: 'absolute',
                                    top: '15px',
                                    left: '75px',
                                    backgroundColor: 'white',
                                    borderRadius: '12px',
                                    boxShadow: '0 8px 25px rgba(0,0,0,0.3)',
                                    padding: '15px',
                                    zIndex: 1000,
                                    minWidth: '250px',
                                    maxWidth: '300px'
                                }}>
                                    <div style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '12px', color: '#7c3aed' }}>
                                        🛡️ Guard Status
                                    </div>

                                    {/* Debug Info */}
                                    <div style={{
                                        fontSize: '10px',
                                        color: '#666',
                                        marginBottom: '8px',
                                        padding: '4px',
                                        backgroundColor: '#f9f9f9',
                                        borderRadius: '4px'
                                    }}>
                                        Guard ID State: {assignedGuardId || 'None'}
                                    </div>

                                    <div style={{ fontSize: '12px', color: '#333', lineHeight: '1.5' }}>
                                        {/* Guard Assignment Status */}
                                        {(() => {
                                            const assignedGuard = getAssignedGuard();
                                            return (
                                                <div style={{
                                                    backgroundColor: assignedGuard ? '#f0fdf4' : '#fef2f2',
                                                    borderRadius: '8px',
                                                    padding: '10px',
                                                    marginBottom: '10px',
                                                    border: `1px solid ${assignedGuard ? '#10b981' : '#ef4444'}`
                                                }}>
                                                    <div style={{ fontWeight: 'bold', marginBottom: '5px', color: '#374151' }}>
                                                        Assignment Status:
                                                    </div>
                                                    {assignedGuard ? (
                                                        <div>
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                                                                <div style={{
                                                                    width: '8px',
                                                                    height: '8px',
                                                                    borderRadius: '50%',
                                                                    backgroundColor: '#10b981',
                                                                    animation: 'pulse 2s infinite'
                                                                }}></div>
                                                                <span style={{ color: '#10b981', fontWeight: 'bold' }}>
                                                                    Guard Assigned ✓
                                                                </span>
                                                            </div>
                                                            <div style={{ fontSize: '11px', color: '#374151' }}>
                                                                <div><strong>Guard ID:</strong> {assignedGuard.guardId}</div>
                                                                <div><strong>Guard:</strong> {assignedGuard.guardName}</div>
                                                                <div><strong>Distance:</strong> {Math.round(assignedGuard.distance)}m away</div>
                                                                <div><strong>Status:</strong> {assignedGuard.isOnline ? '🟢 Online' : '🔴 Offline'}</div>
                                                                <div><strong>Connection:</strong> {assignedGuard.status || 'Unknown'}</div>
                                                                <div><strong>Assigned:</strong> {new Date(assignedGuard.assignedAt).toLocaleTimeString()}</div>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                            <div style={{
                                                                width: '8px',
                                                                height: '8px',
                                                                borderRadius: '50%',
                                                                backgroundColor: '#ef4444',
                                                                animation: 'pulse 2s infinite'
                                                            }}></div>
                                                            <span style={{ color: '#ef4444', fontWeight: 'bold' }}>
                                                                No Guards Available
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })()}

                                        {/* Guards Coming */}
                                        <div style={{
                                            backgroundColor: '#fef3c7',
                                            borderRadius: '8px',
                                            padding: '10px',
                                            marginBottom: '10px',
                                            border: '1px solid #f59e0b'
                                        }}>
                                            <div style={{ fontWeight: 'bold', marginBottom: '5px', color: '#92400e' }}>
                                                Response Team:
                                            </div>
                                            <div style={{ color: '#92400e' }}>
                                                <div style={{ marginBottom: '3px' }}>
                                                    👮‍♂️ <strong>2 Security Guards</strong> - 5 min away
                                                </div>
                                                <div style={{ marginBottom: '3px' }}>
                                                    🚗 <strong>1 Response Vehicle</strong> - 7 min away
                                                </div>
                                                <div>
                                                    🏥 <strong>Medic Team</strong> - 12 min away
                                                </div>
                                            </div>
                                        </div>

                                        {/* Live Updates */}
                                        <div style={{
                                            backgroundColor: '#dbeafe',
                                            borderRadius: '8px',
                                            padding: '10px',
                                            border: '1px solid #3b82f6'
                                        }}>
                                            <div style={{ fontWeight: 'bold', marginBottom: '5px', color: '#1e40af' }}>
                                                Live Updates:
                                            </div>
                                            <div style={{ fontSize: '11px', color: '#1e40af' }}>
                                                <div style={{ marginBottom: '2px' }}>
                                                    📍 Guards dispatched from Sector 5
                                                </div>
                                                <div style={{ marginBottom: '2px' }}>
                                                    🚨 Priority response activated
                                                </div>
                                                <div>
                                                    📡 Real-time tracking enabled
                                                </div>
                                            </div>
                                        </div>

                                        <button
                                            onClick={() => setShowGuardStatus(false)}
                                            style={{
                                                backgroundColor: '#7c3aed',
                                                color: 'white',
                                                border: 'none',
                                                borderRadius: '6px',
                                                padding: '8px 12px',
                                                fontSize: '11px',
                                                cursor: 'pointer',
                                                marginTop: '12px',
                                                width: '100%'
                                            }}
                                        >
                                            Close Status
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Guards Status Toolbar - Blinking notification when guards are assigned */}
                    <div style={{
                        position: 'fixed',
                        bottom: '20px',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        backgroundColor: '#16a34a',
                        color: 'white',
                        padding: '8px 16px',
                        borderRadius: '20px',
                        fontSize: '12px',
                        fontWeight: 'bold',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        boxShadow: '0 4px 15px rgba(0,0,0,0.3)',
                        animation: 'guardBlink 1.5s infinite',
                        zIndex: 1000
                    }}>
                        <div style={{
                            width: '8px',
                            height: '8px',
                            borderRadius: '50%',
                            backgroundColor: '#fff',
                            animation: 'pulse 1s infinite'
                        }}></div>
                    </div>
                </div>                {/* Cancel SOS Confirmation Popup */}
                {showCancelConfirmation && (
                    <div style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundColor: 'rgba(0, 0, 0, 0.9)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 10000,
                        backdropFilter: 'blur(5px)',
                        padding: '20px'
                    }}>
                        <div style={{
                            backgroundColor: 'white',
                            padding: '40px',
                            borderRadius: '20px',
                            textAlign: 'center',
                            maxWidth: '450px',
                            width: '100%',
                            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)',
                            animation: 'popupSlideIn 0.3s ease-out'
                        }}>
                            {/* Safety Check Icon */}
                            <div style={{
                                fontSize: '60px',
                                marginBottom: '25px'
                            }}>
                                🛡️
                            </div>

                            {/* Heading */}
                            <h2 style={{
                                color: '#dc2626',
                                marginBottom: '20px',
                                fontSize: '1.8rem',
                                fontWeight: 'bold'
                            }}>
                                SAFETY CONFIRMATION
                            </h2>

                            {/* Safety Questions */}
                            <div style={{
                                color: '#333',
                                marginBottom: '30px',
                                fontSize: '16px',
                                lineHeight: '1.6',
                                textAlign: 'left'
                            }}>
                                <p style={{ fontWeight: 'bold', marginBottom: '15px', textAlign: 'center' }}>
                                    Please confirm you are safe:
                                </p>
                                <ul style={{ listStyle: 'none', padding: 0 }}>
                                    <li style={{ marginBottom: '8px' }}>✓ Are you out of immediate danger?</li>
                                    <li style={{ marginBottom: '8px' }}>✓ Are you in a safe location?</li>
                                    <li style={{ marginBottom: '8px' }}>✓ Do you no longer need emergency assistance?</li>
                                </ul>
                                <p style={{
                                    fontSize: '14px',
                                    color: '#666',
                                    fontStyle: 'italic',
                                    textAlign: 'center',
                                    marginTop: '15px'
                                }}>
                                    Only cancel if you can answer YES to all questions
                                </p>
                            </div>

                            {/* Action Buttons */}
                            <div
                                style={{
                                    display: 'flex',
                                    gap: '15px',
                                    justifyContent: 'center',
                                    flexDirection: window.innerWidth < 400 ? 'column' : 'row',
                                    flexWrap: 'wrap',
                                    width: '100%',
                                    marginTop: '10px',
                                }}
                            >
                                <button
                                    onClick={handleKeepSOS}
                                    style={{
                                        padding: '15px 25px',
                                        backgroundColor: '#dc2626',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '10px',
                                        fontSize: '16px',
                                        fontWeight: 'bold',
                                        cursor: 'pointer',
                                        transition: 'all 0.3s ease',
                                        minWidth: '120px',
                                        maxWidth: '100%',
                                        flex: 1,
                                    }}
                                    onMouseEnter={(e) => {
                                        e.target.style.backgroundColor = '#b91c1c';
                                        e.target.style.transform = 'scale(1.05)';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.target.style.backgroundColor = '#dc2626';
                                        e.target.style.transform = 'scale(1)';
                                    }}
                                >
                                    🚨 KEEP SOS ACTIVE
                                </button>

                                <button
                                    onClick={handleConfirmCancel}
                                    style={{
                                        padding: '15px 25px',
                                        backgroundColor: '#16a34a',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '10px',
                                        fontSize: '16px',
                                        fontWeight: 'bold',
                                        cursor: 'pointer',
                                        transition: 'all 0.3s ease',
                                        minWidth: '120px',
                                        maxWidth: '100%',
                                        flex: 1,
                                    }}
                                    onMouseEnter={(e) => {
                                        e.target.style.backgroundColor = '#15803d';
                                        e.target.style.transform = 'scale(1.05)';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.target.style.backgroundColor = '#16a34a';
                                        e.target.style.transform = 'scale(1)';
                                    }}
                                >
                                    ✅ YES, I'M SAFE
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* CSS Animations */}
                <style jsx>{`
                    @keyframes emergencyPulse {
                        0%, 100% {
                            transform: scale(1);
                            opacity: 1;
                        }
                        50% {
                            transform: scale(1.1);
                            opacity: 0.8;
                        }
                    }

                    @keyframes popupSlideIn {
                        0% {
                            transform: scale(0.8) translateY(30px);
                            opacity: 0;
                        }
                        100% {
                            transform: scale(1) translateY(0);
                            opacity: 1;
                        }
                    }

                    @keyframes guardBlink {
                        0%, 100% {
                            opacity: 1;
                            box-shadow: 0 4px 15px rgba(0,0,0,0.3);
                        }
                        50% {
                            opacity: 0.7;
                            box-shadow: 0 4px 20px rgba(22, 163, 74, 0.6);
                        }
                    }

                    @keyframes pulse {
                        0%, 100% {
                            transform: scale(1);
                            opacity: 1;
                        }
                        50% {
                            transform: scale(1.2);
                            opacity: 0.7;
                        }
                    }

                    @media (max-width: 768px) {
                        h1 {
                            font-size: 2rem !important;
                        }
                        
                        .emergency-icon {
                            font-size: 60px !important;
                        }
                        
                        button {
                            min-width: 100% !important;
                            padding: 18px 20px !important;
                        }
                    }
                `}</style>
            </ProtectedRoute>
        </>
    );
};

export default SOS;