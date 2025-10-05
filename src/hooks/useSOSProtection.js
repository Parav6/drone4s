'use client';

import { useState, useEffect } from 'react';
import { useFirebase } from '../context/Firebase';
import { ref, onValue, set, remove } from 'firebase/database';
import nearestGuard from '../helper/nearestGuard';

/**
 * Custom hook for SOS state management
 * @returns {Object} SOS state and navigation control
 */
export const useSOSProtection = () => {
    const { user, database } = useFirebase();
    const [sosActive, setSOSActive] = useState(false);
    const [sosData, setSOSData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user || !database) {
            setLoading(false);
            return;
        }

        const sosRef = ref(database, `activeSOS/${user.uid}`);
        const unsubscribe = onValue(sosRef, (snapshot) => {
            const data = snapshot.val();

            if (data && data.isActive) {
                setSOSActive(true);
                setSOSData(data);
            } else {
                setSOSActive(false);
                setSOSData(null);
            }

            setLoading(false);
        });

        return () => unsubscribe();
    }, [user, database]);

    /**
     * Check if navigation should be blocked
     * @param {string} targetPath - Path user wants to navigate to
     * @returns {boolean} Whether navigation should be blocked
     */
    const shouldBlockNavigation = (targetPath) => {
        if (!sosActive) return false;

        // Allow navigation to SOS page
        if (targetPath === '/sos') return false;

        // Block all other navigation when SOS is active
        return true;
    };

    /**
     * Get SOS status message for UI
     * @returns {string} Status message
     */
    const getSOSStatusMessage = () => {
        if (!sosActive) return null;

        const duration = sosData?.startTime
            ? Math.floor((Date.now() - sosData.startTime) / 1000)
            : 0;

        const minutes = Math.floor(duration / 60);
        const seconds = duration % 60;

        return `SOS Active for ${minutes}:${seconds.toString().padStart(2, '0')}`;
    };

    /**
     * Get assigned guard information
     * @returns {Object|null} Guard information or null if no guard assigned
     */
    const getAssignedGuard = () => {
        if (!sosActive || !sosData?.guardAssigned) return null;
        return sosData.guardAssigned;
    };

    /**
     * Force redirect to SOS page if SOS is active
     * @returns {boolean} Whether redirect is needed
     */
    const needsSOSRedirect = () => {
        // Don't redirect if we're already on SOS page or in the process of stopping
        const currentPath = typeof window !== 'undefined' ? window.location.pathname : '';
        if (currentPath === '/sos') return false;

        // Add a small delay check to prevent redirect during SOS stop
        if (!sosActive && sosData === null) {
            // SOS was just stopped, don't redirect for a moment to allow proper navigation
            return false;
        }

        return sosActive;
    };

    /**
     * Enable SOS - Save to database with automatic guard assignment
     * @param {Object} location - User's current location {lat, lng}
     * @param {string} message - Optional SOS message
     */
    const enableSOS = async (location = null, message = "Emergency SOS activated") => {
        if (!user || !database) {
            throw new Error('User not authenticated or database not available');
        }

        try {
            console.log('🚨 Activating SOS for user:', user.uid);
            
            // Step 1: Find the nearest guard
            let guardAssigned = null;
            try {
                console.log('🔍 Finding nearest guard...');
                const nearestGuardData = await nearestGuard(user.uid);
                
                if (nearestGuardData) {
                    guardAssigned = {
                        guardId: nearestGuardData.id,
                        guardName: nearestGuardData.name || nearestGuardData.displayName,
                        distance: nearestGuardData.distance,
                        guardLocation: {
                            lat: nearestGuardData.lat,
                            lng: nearestGuardData.lng
                        },
                        isOnline: nearestGuardData.isOnline,
                        status: nearestGuardData.status,
                        assignedAt: Date.now()
                    };
                    console.log('✅ Nearest guard found and assigned:', guardAssigned);
                } else {
                    console.log('⚠️ No active and online guards found nearby');
                }
            } catch (guardError) {
                console.error('❌ Error finding nearest guard:', guardError);
                // Continue with SOS activation even if guard assignment fails
            }

            // Step 2: Create SOS data with guard assignment
            const sosData = {
                isActive: true,
                startTime: Date.now(),
                message: message,
                location: location,
                userId: user.uid,
                userEmail: user.email || 'unknown',
                guardAssigned: guardAssigned // Add the guard assignment field
            };

            // Step 3: Save to database
            const sosRef = ref(database, `activeSOS/${user.uid}`);
            await set(sosRef, sosData);
            
            console.log('✅ SOS activated successfully with guard assignment:', sosData);
            return true;
        } catch (error) {
            console.error('❌ Failed to enable SOS:', error);
            throw error;
        }
    };

    /**
     * Disable SOS - Remove from database
     */
    const disableSOS = async () => {
        if (!user || !database) {
            throw new Error('User not authenticated or database not available');
        }

        try {
            const sosRef = ref(database, `activeSOS/${user.uid}`);
            await remove(sosRef);
            return true;
        } catch (error) {
            console.error('Failed to disable SOS:', error);
            throw error;
        }
    };

    return {
        sosActive,
        sosData,
        loading,
        enableSOS,
        disableSOS,
        shouldBlockNavigation,
        getSOSStatusMessage,
        getAssignedGuard,
        needsSOSRedirect
    };
};

export default useSOSProtection;