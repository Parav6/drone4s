import { getDatabase, ref, get, query, orderByChild, equalTo } from 'firebase/database';
import { app } from '../context/Firebase';

/**
 * Find the nearest guard to a given user using Firebase Realtime Database and MapMyIndia API
 * @param {string} userId - The ID of the current user
 * @returns {Promise<Object|null>} - Returns the nearest guard object with distance, or null if no guards found
 */
const nearestGuard = async (userId) => {
    try {
        const db = getDatabase(app);
        
        // Step 1: Get current user's location
        const currentUserLocationRef = ref(db, `user_locations/${userId}`);
        const currentUserSnapshot = await get(currentUserLocationRef);
        
        if (!currentUserSnapshot.exists()) {
            console.error('Current user location not found');
            return null;
        }
        
        const currentUserLocation = currentUserSnapshot.val();
        console.log('Current user location:', currentUserLocation);
        
        // Check if current user has both lat and lng
        const currentLat = currentUserLocation.lat || currentUserLocation.latitude;
        const currentLng = currentUserLocation.lng || currentUserLocation.longitude;
        
        if (!currentLat || !currentLng) {
            console.error('Current user missing location data (lat:', currentLat, 'lng:', currentLng, ')');
            return null;
        }
        
        // Step 2: Get all users with role 'guard'
        let guards = {};
        try {
            const usersRef = ref(db, 'users');
            const guardsQuery = query(usersRef, orderByChild('role'), equalTo('guard'));
            const guardsSnapshot = await get(guardsQuery);
            
            if (guardsSnapshot.exists()) {
                guards = guardsSnapshot.val();
                console.log('Found guards in users collection:', Object.keys(guards));
            } else {
                console.log('No guards found in users collection, will check all user_locations');
            }
        } catch (error) {
            console.warn('Error querying users collection:', error);
            console.log('Will check all user_locations as fallback');
        }
        
        // Step 3: Get locations for guards
        const guardLocations = [];
        
        if (Object.keys(guards).length > 0) {
            // Use guards from users collection
            const guardPromises = Object.keys(guards).map(async (guardId) => {
                const guardLocationRef = ref(db, `user_locations/${guardId}`);
                const guardLocationSnapshot = await get(guardLocationRef);
                
                if (guardLocationSnapshot.exists()) {
                    const guardLocation = guardLocationSnapshot.val();
                    // Handle missing longitude field - check if it exists
                    const lat = guardLocation.lat || guardLocation.latitude;
                    const lng = guardLocation.lng || guardLocation.longitude;
                    
                    // Only add guard if lat, lng, connectionState is active, AND isOnline is true
                    if (lat && lng && guardLocation.connectionState === 'active' && guardLocation.isOnline === true) {
                        guardLocations.push({
                            id: guardId,
                            name: guards[guardId].name || guards[guardId].displayName || guardLocation.displayName || 'Unknown Guard',
                            role: guards[guardId].role,
                            lat: lat,
                            lng: lng,
                            status: guardLocation.connectionState || guardLocation.status || 'unknown',
                            isOnline: guardLocation.isOnline || false,
                            displayName: guardLocation.displayName || 'Unknown Guard',
                            lastUpdate: guardLocation.lastUpdate || guardLocation.heartbeat
                        });
                    } else {
                        if (!lat || !lng) {
                            console.warn(`Guard ${guardId} missing location data (lat: ${lat}, lng: ${lng})`);
                        }
                        if (guardLocation.connectionState !== 'active') {
                            console.warn(`Guard ${guardId} not active (connectionState: ${guardLocation.connectionState})`);
                        }
                        if (guardLocation.isOnline !== true) {
                            console.warn(`Guard ${guardId} not online (isOnline: ${guardLocation.isOnline})`);
                        }
                    }
                }
            });
            
            await Promise.all(guardPromises);
        } else {
            // Fallback: Check all user_locations for potential guards
            console.log('No guards found in users collection, checking all user_locations...');
            try {
                const allUserLocationsRef = ref(db, 'user_locations');
                const allUserLocationsSnapshot = await get(allUserLocationsRef);
                
                if (allUserLocationsSnapshot.exists()) {
                    const allUserLocations = allUserLocationsSnapshot.val();
                    const allUserIds = Object.keys(allUserLocations);
                    
                    // Filter out current user and check each user's location
                    const otherUsers = allUserIds.filter(uid => uid !== userId);
                    
                    for (const uid of otherUsers) {
                        const userLocation = allUserLocations[uid];
                        const lat = userLocation.lat || userLocation.latitude;
                        const lng = userLocation.lng || userLocation.longitude;
                        
                        // Only add if lat, lng, connectionState is active, AND isOnline is true
                        if (lat && lng && userLocation.connectionState === 'active' && userLocation.isOnline === true) {
                            guardLocations.push({
                                id: uid,
                                name: userLocation.displayName || 'Unknown User',
                                role: 'unknown', // We don't know the role from user_locations
                                lat: lat,
                                lng: lng,
                                status: userLocation.connectionState || userLocation.status || 'unknown',
                                isOnline: userLocation.isOnline || false,
                                displayName: userLocation.displayName || 'Unknown User',
                                lastUpdate: userLocation.lastUpdate || userLocation.heartbeat
                            });
                        } else {
                            if (!lat || !lng) {
                                console.warn(`User ${uid} missing location data (lat: ${lat}, lng: ${lng})`);
                            }
                            if (userLocation.connectionState !== 'active') {
                                console.warn(`User ${uid} not active (connectionState: ${userLocation.connectionState})`);
                            }
                            if (userLocation.isOnline !== true) {
                                console.warn(`User ${uid} not online (isOnline: ${userLocation.isOnline})`);
                            }
                        }
                    }
                    
                    console.log(`Found ${guardLocations.length} active and online users with location data as potential guards`);
                }
            } catch (error) {
                console.error('Error fetching all user locations:', error);
            }
        }
        
        if (guardLocations.length === 0) {
            console.log('No active and online guard locations found');
            return null;
        }
        
        console.log('Active and online guard locations:', guardLocations);
        
        // Step 4: Calculate distances using MapMyIndia API
        const distances = await Promise.all(
            guardLocations.map(async (guard) => {
                try {
                    const distance = await calculateDistance(
                        currentLat,
                        currentLng,
                        guard.lat,
                        guard.lng
                    );
                    return {
                        ...guard,
                        distance: distance
                    };
                } catch (error) {
                    console.error(`Error calculating distance for guard ${guard.id}:`, error);
                    return {
                        ...guard,
                        distance: Infinity // Mark as unreachable
                    };
                }
            })
        );
        
        // Step 5: Find the nearest guard
        const nearestGuard = distances.reduce((nearest, current) => {
            return current.distance < nearest.distance ? current : nearest;
        });
        
        console.log('Nearest active and online guard found:', nearestGuard);
        return nearestGuard;
        
    } catch (error) {
        console.error('Error in nearestGuard function:', error);
        return null;
    }
};

/**
 * Calculate distance between two points using MapMyIndia API
 * @param {number} fromLat - Starting latitude
 * @param {number} fromLng - Starting longitude
 * @param {number} toLat - Destination latitude
 * @param {number} toLng - Destination longitude
 * @returns {Promise<number>} - Distance in meters
 */
const calculateDistance = async (fromLat, fromLng, toLat, toLng) => {
    try {
        // MapMyIndia API key - replace with your actual API key
        const API_KEY = 'f6cc67d011fd246c37345dbaac88f334'; // Using the same key from your admin page
        
        // MapMyIndia Distance Matrix API endpoint
        const url = `https://apis.mappls.com/advancedmaps/v1/${API_KEY}/distance_matrix/driving/${fromLng},${fromLat};${toLng},${toLat}`;
        
        console.log('Calculating distance from', fromLat, fromLng, 'to', toLat, toLng);
        
        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('MapMyIndia API response:', data);
        
        if (data.results && data.results.distances && data.results.distances[0] && data.results.distances[0][1]) {
            const distanceInMeters = data.results.distances[0][1];
            console.log('Distance calculated:', distanceInMeters, 'meters');
            return distanceInMeters;
        } else {
            throw new Error('Invalid response format from MapMyIndia API');
        }
        
    } catch (error) {
        console.error('Error calculating distance with MapMyIndia API:', error);
        
        // Fallback to Haversine formula for straight-line distance
        console.log('Falling back to Haversine formula');
        return calculateHaversineDistance(fromLat, fromLng, toLat, toLng);
    }
};

/**
 * Calculate straight-line distance using Haversine formula (fallback)
 * @param {number} lat1 - Starting latitude
 * @param {number} lon1 - Starting longitude
 * @param {number} lat2 - Destination latitude
 * @param {number} lon2 - Destination longitude
 * @returns {number} - Distance in meters
 */
const calculateHaversineDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = lat1 * Math.PI / 180; // φ, λ in radians
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    const distance = R * c; // Distance in meters
    console.log('Haversine distance calculated:', distance, 'meters');
    return distance;
};

export default nearestGuard;      