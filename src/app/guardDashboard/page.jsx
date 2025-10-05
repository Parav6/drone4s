"use client"

import { useAuth } from '../../hooks/useAuth';
import ProtectedRoute from '../../components/ProtectedRoute';
import { getMessaging, getToken, isSupported } from "firebase/messaging";
import {app} from "../../context/Firebase"
import { getDatabase, ref, set, push, onValue } from "firebase/database";
import { useState, useEffect } from 'react';
import nearestGuard from '../../helper/nearestGuard';
import { useSOSProtection } from '../../hooks/useSOSProtection';

const GaurdPage = ()=>{

    const { user, isGuard } = useAuth();
    const [messaging, setMessaging] = useState(null);
    const [messagingSupported, setMessagingSupported] = useState(false);
    const [nearestGuardData, setNearestGuardData] = useState(null);
    const [isFindingGuard, setIsFindingGuard] = useState(false);
    const { enableSOS, getAssignedGuard } = useSOSProtection();
    const db = getDatabase(app);

    // Check if messaging is supported and initialize it
    useEffect(() => {
        const initializeMessaging = async () => {
            try {
                const supported = await isSupported();
                if (supported) {
                    // Register service worker first
                    if ('serviceWorker' in navigator) {
                        try {
                            const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
                            console.log('Service Worker registered successfully:', registration);
                        } catch (swError) {
                            console.log('Service Worker registration failed:', swError);
                        }
                    }
                    
                    const messagingInstance = getMessaging(app);
                    setMessaging(messagingInstance);
                    setMessagingSupported(true);
                } else {
                    console.log('Firebase messaging is not supported in this browser');
                    setMessagingSupported(false);
                }
            } catch (error) {
                console.log('Error initializing Firebase messaging:', error);
                setMessagingSupported(false);
            }
        };

        initializeMessaging();
    }, []);

    //store live location

    
    const requestNotificationPermission = async () => {
        if (!('Notification' in window)) {
            console.log('This browser does not support notifications');
            return false;
        }

        if (Notification.permission === 'granted') {
            console.log('Notification permission already granted');
            return true;
        }

        if (Notification.permission === 'denied') {
            console.log('Notification permission denied');
            return false;
        }

        // Request permission
        const permission = await Notification.requestPermission();
        console.log('Notification permission result:', permission);
        return permission === 'granted';
    };

    const getToken = async()=>{
        if (!messagingSupported || !messaging) {
            console.log('Firebase messaging is not supported or not initialized');
            return;
        }

        try {
            // First request notification permission
            const hasPermission = await requestNotificationPermission();
            if (!hasPermission) {
                console.log('Notification permission not granted');
                return;
            }

            // Check if service worker is available and registered
            if (!('serviceWorker' in navigator)) {
                console.log('Service Worker not supported');
                return;
            }

            const registration = await navigator.serviceWorker.getRegistration();
            if (!registration) {
                console.log('No service worker registration found - this might cause token issues');
            } else {
                console.log('Service worker registration found:', registration);
            }

            console.log('Getting messaging token...');
            //getting token
            const token = await getToken(messaging, { 
                vapidKey: "BIi_tm_hpiidwqGKM_LsHwQYXhGw6HL-biQOJmq6sBgVpBRcwDOFBZ1kDN1yFxoB53KunNIlEpIvkJiFD3aA6C0" 
            });
            
            console.log('Token received:', token);
            if(!token){
                console.log('No token received - this might indicate a configuration issue');
            } else {
                console.log('Successfully received FCM token:', token);
            }
        } catch (error) {
            console.log('Error getting messaging token:', error);
            console.log('Error details:', error.message);
        }
    };

    // Function to find nearest guard
    const findNearestGuard = async () => {
        if (!user?.uid) {
            console.log('No user ID available');
            return;
        }

        setIsFindingGuard(true);
        try {
            const guard = await nearestGuard(user.uid);
            setNearestGuardData(guard);
            if (guard) {
                console.log('Nearest active and online guard found:', guard);
            } else {
                console.log('No active and online guards found nearby');
            }
        } catch (error) {
            console.error('Error finding nearest guard:', error);
        } finally {
            setIsFindingGuard(false);
        }
    };

    // Function to test SOS activation with guard assignment
    const testSOSActivation = async () => {
        if (!user?.uid) {
            console.log('No user ID available');
            return;
        }

        try {
            console.log('🚨 Testing SOS activation with guard assignment...');
            // Simulate user location (you can replace with actual location)
            const testLocation = { lat: 28.7041, lng: 77.1025 }; // Delhi coordinates
            
            await enableSOS(testLocation, "Test SOS activation with guard assignment");
            console.log('✅ SOS activated successfully! Check Firebase activeSOS collection.');
            
            // Show assigned guard info
            setTimeout(() => {
                const assignedGuard = getAssignedGuard();
                if (assignedGuard) {
                    console.log('🛡️ Assigned Guard:', assignedGuard);
                } else {
                    console.log('⚠️ No guard assigned');
                }
            }, 1000);
            
        } catch (error) {
            console.error('❌ Error testing SOS activation:', error);
        }
    };

    //   if (!isGuard) {
    //     return (
    //         <ProtectedRoute>
    //             <div className="min-h-screen bg-gray-50 flex items-center justify-center">
    //                 <div className="bg-white p-8 rounded-lg shadow-md text-center">
    //                     <div className="text-red-500 text-6xl mb-4">🚫</div>
    //                     <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
    //                     <p className="text-gray-600 mb-4">
    //                         You need administrator privileges to access this page.
    //                     </p>
    //                     <p className="text-sm text-gray-500">
    //                         Current role: <span className="font-medium">{user?.role || 'user'}</span>
    //                     </p>
    //                 </div>
    //             </div>
    //         </ProtectedRoute>
    //     );
    // }

    return(
        <>
        <div className="min-h-screen bg-gray-50 p-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-8">Guard Dashboard</h1>
            
            <div className="space-y-4">
                <button
                    onClick={getToken}
                    disabled={!messagingSupported}
                    className={`px-6 py-3 rounded-lg font-medium text-lg ${
                        messagingSupported 
                            ? 'bg-blue-500 hover:bg-blue-600 text-white' 
                            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    }`}
                >
                    Get FCM Token
                </button>

                <button
                    onClick={findNearestGuard}
                    disabled={isFindingGuard || !user?.uid}
                    className={`px-6 py-3 rounded-lg font-medium text-lg ${
                        !isFindingGuard && user?.uid
                            ? 'bg-green-500 hover:bg-green-600 text-white' 
                            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    }`}
                >
                    {isFindingGuard ? 'Finding Nearest Guard...' : 'Find Nearest Guard'}
                </button>

                <button
                    onClick={testSOSActivation}
                    disabled={!user?.uid}
                    className={`px-6 py-3 rounded-lg font-medium text-lg ${
                        user?.uid
                            ? 'bg-red-500 hover:bg-red-600 text-white' 
                            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    }`}
                >
                    🚨 Test SOS Activation
                </button>

                {nearestGuardData && (
                    <div className="bg-white rounded-lg shadow-md p-6 mt-6">
                        <h2 className="text-xl font-semibold mb-4">Nearest Guard Found</h2>
                        <div className="space-y-2">
                            <p><strong>Guard ID:</strong> {nearestGuardData.id}</p>
                            <p><strong>Name:</strong> {nearestGuardData.name || nearestGuardData.displayName}</p>
                            <p><strong>Distance:</strong> {Math.round(nearestGuardData.distance)} meters</p>
                            <p><strong>Status:</strong> {nearestGuardData.isOnline ? '🟢 Online' : '🔴 Offline'}</p>
                            <p><strong>Connection:</strong> {nearestGuardData.status}</p>
                            <p><strong>Location:</strong> {nearestGuardData.lat}, {nearestGuardData.lng}</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
        </>
    )
}

export default GaurdPage