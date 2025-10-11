"use client";
import React, { useState, useEffect, useCallback } from 'react';
import Map from '@/components/Map';
import { useFirebase } from '@/context/Firebase';
import { ref, onValue } from 'firebase/database';
import polyline from "@mapbox/polyline";

const GarbageTrackingPage = () => {
    const { database } = useFirebase();
    const [garbagePlaces, setGarbagePlaces] = useState([]);
    const [highVolumePlaces, setHighVolumePlaces] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [optimalRoute, setOptimalRoute] = useState(null);
    const [routeLoading, setRouteLoading] = useState(false);
    const [selectedPlace, setSelectedPlace] = useState(null);
    const [showInfoBox, setShowInfoBox] = useState(false);

    // Main Gate of IIT Roorkee coordinates (starting and ending point)
    const mainGateCoords = {
        lat: 29.865483102591366,
        lng: 77.88954293066463
    };

    // Fetch garbage tracking data from Firebase
    useEffect(() => {
        if (!database) return;

        const garbageTrackRef = ref(database, 'garbageTrack');
        
        const unsubscribe = onValue(garbageTrackRef, (snapshot) => {
            try {
                const data = snapshot.val();
                if (data) {
                    const places = Object.entries(data).map(([key, place]) => ({
                        id: key,
                        ...place,
                        lat: parseFloat(place.latitude),
                        lng: parseFloat(place.longitude)
                    }));
                    
                    setGarbagePlaces(places);
                    
                    // Filter places with volume >= 90 for optimal path calculation
                    const highVolume = places.filter(place => place.volume >= 90);
                    setHighVolumePlaces(highVolume);
                    
                    console.log('Garbage places loaded:', places);
                    console.log('High volume places:', highVolume);
                } else {
                    setGarbagePlaces([]);
                    setHighVolumePlaces([]);
                }
                setLoading(false);
            } catch (err) {
                console.error('Error processing garbage tracking data:', err);
                setError('Failed to load garbage tracking data');
                setLoading(false);
            }
        }, (error) => {
            console.error('Firebase error:', error);
            setError('Failed to connect to database');
            setLoading(false);
        });

        return () => unsubscribe();
    }, [database]);

    // Calculate optimal route for garbage van
    const calculateOptimalRoute = useCallback(async () => {
        if (highVolumePlaces.length === 0) {
            setError('No high volume places found for route calculation');
            return;
        }

        setRouteLoading(true);
        setError(null);

        try {
            // Prepare coordinates for MapMyIndia API
            const coordinates = [
                mainGateCoords, // Start from main gate
                ...highVolumePlaces.map(place => ({ lat: place.lat, lon: place.lng })),
                mainGateCoords // End at main gate
            ];

            // Call our distance API route
            const response = await fetch('/api/garbageRoute', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    start: { lat: mainGateCoords.lat, lon: mainGateCoords.lng },
                    end: { lat: mainGateCoords.lat, lon: mainGateCoords.lng },
                    waypoints: highVolumePlaces.map(place => ({ lat: place.lat, lon: place.lng }))
                }),
            });

            if (!response.ok) {
                throw new Error('Failed to calculate optimal route');
            }

            const routeData = await response.json();
            
            console.log("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!")
            console.log('Optimal route calculated:', routeData?.routes?.[0]);
            setOptimalRoute(routeData?.routes?.[0]);
        } catch (err) {
            console.error('Route calculation error:', err);
            setError('Failed to calculate optimal route');
        } finally {
            setRouteLoading(false);
        }
    }, [highVolumePlaces]);

    // Handle marker click
    const handleMarkerClick = useCallback((place) => {
        console.log('Marker clicked:', place);
        setSelectedPlace(place);
        setShowInfoBox(true);
    }, []);

    // Close info box
    const closeInfoBox = useCallback(() => {
        setShowInfoBox(false);
        setSelectedPlace(null);
    }, []);

    // Global function to show marker info
    useEffect(() => {
        window.showMarkerInfo = (placeId) => {
            console.log('Opening info for place ID:', placeId);
            console.log('Available places:', garbagePlaces.map(p => ({ id: p.id, name: p.name })));
            const place = garbagePlaces.find(p => p.id === placeId);
            if (place) {
                console.log('Found place:', place);
                setSelectedPlace(place);
                setShowInfoBox(true);
            } else {
                console.log('Place not found for ID:', placeId);
                console.log('Available IDs:', garbagePlaces.map(p => p.id));
            }
        };
        
        return () => {
            delete window.showMarkerInfo;
        };
    }, [garbagePlaces]);

    // Create custom garbage marker icon
    const createGarbageMarkerIcon = (color, volume) => {
        const isHighVolume = volume >= 90;
        const iconColor = isHighVolume ? '#d32f2f' : '#1976d2';
        const shadowColor = isHighVolume ? '#a02828' : '#1565c0';
        
        const svgIcon = `
            <svg xmlns="http://www.w3.org/2000/svg" width="60" height="70" viewBox="0 0 60 70">
                <!-- Drop shadow -->
                <path d="M26 52 L16 37 L36 37 Z" fill="${shadowColor}" opacity="0.3"/>
                <!-- Marker pin -->
                <path d="M25 50 L15 35 L35 35 Z" fill="${iconColor}" stroke="white" stroke-width="3"/>
                <!-- Main container -->
                <rect x="10" y="15" width="30" height="20" rx="3" fill="${iconColor}" stroke="white" stroke-width="2"/>
                <!-- Volume bar background -->
                <rect x="12" y="17" width="26" height="16" rx="2" fill="white" opacity="0.9"/>
                <!-- Volume bar fill -->
                <rect x="12" y="17" width="${(volume / 100) * 26}" height="16" rx="2" fill="${iconColor}" opacity="0.7"/>
                <!-- Volume percentage text -->
                <text x="25" y="28" text-anchor="middle" fill="${iconColor}" font-family="Arial" font-size="9" font-weight="bold">${volume}%</text>
                <!-- Status indicator -->
                <circle cx="25" cy="8" r="4" fill="${iconColor}" stroke="white" stroke-width="2"/>
                <text x="25" y="11" text-anchor="middle" fill="white" font-family="Arial" font-size="6" font-weight="bold">${isHighVolume ? '!' : '✓'}</text>
            </svg>
        `;
        
        // Use encodeURIComponent instead of btoa to handle all characters
        return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svgIcon);
    };

    // Prepare markers for the map
    const mapMarkers = garbagePlaces.map(place => {
        const markerIcon = createGarbageMarkerIcon(place.volume >= 90 ? '#d32f2f' : '#1976d2', place.volume);
        console.log(`Creating marker for ${place.name}:`, {
            id: place.id,
            lat: place.lat,
            lng: place.lng,
            volume: place.volume,
            iconUrl: markerIcon
        });
        
        return {
            id: place.id,
            lat: place.lat,
            lng: place.lng,
            label: place.name.substring(0, 2).toUpperCase(),
            color: place.volume >= 90 ? '#d32f2f' : '#1976d2',
            // Use icon_url as expected by Map component
            icon_url: markerIcon,
            // Store place data for click handling
            placeData: place,
            // Popup content with click handler
            popupContent: `
                <div style="padding: 10px; text-align: center; font-family: Arial, sans-serif; cursor: pointer;" onclick="window.showMarkerInfo && window.showMarkerInfo('${place.id}')">
                    <h4 style="margin: 0 0 5px 0; color: #333;">${place.name}</h4>
                    <p style="margin: 0; color: ${place.volume >= 90 ? '#d32f2f' : '#1976d2'}; font-weight: bold;">${place.volume}% Full</p>
                    <p style="margin: 5px 0 0 0; font-size: 12px; color: #666;">Click for details</p>
                </div>
            `
        };
    });

    // Debug markers
    console.log('Garbage tracking markers:', mapMarkers);
    console.log('Garbage places:', garbagePlaces);

    if (loading) {
        return (
            <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                height: '100vh',
                fontSize: '18px',
                color: '#666'
            }}>
                Loading garbage tracking data...
            </div>
        );
    }

    return (
        <div style={{ width: '100vw', height: '100vh', position: 'relative' }}>
            {/* Map Component */}
            <Map
                center={mainGateCoords}
                zoom={16}
                followUser={false}
                additionalMarkers={mapMarkers}
            />

            {/* Control Panel */}
            <div style={{
                position: 'absolute',
                top: '20px',
                right: '20px',
                background: 'rgba(255, 255, 255, 0.98)',
                padding: '20px',
                borderRadius: '10px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.25)',
                minWidth: '300px',
                zIndex: 1000,
                border: '1px solid rgba(0,0,0,0.1)'
            }}>
                <h2 style={{ margin: '0 0 15px 0', color: '#1a1a1a', fontWeight: 'bold' }}>Garbage Tracking</h2>
                
                {/* Test Info Box Buttons */}
                {garbagePlaces.length > 0 && (
                    <div style={{ marginBottom: '15px' }}>
                        <div style={{ fontSize: '12px', color: '#666', marginBottom: '8px' }}>Test Info Box:</div>
                        {garbagePlaces.map((place, index) => (
                            <button
                                key={place.id}
                                onClick={() => handleMarkerClick(place)}
                                style={{
                                    width: '100%',
                                    padding: '6px',
                                    background: '#007bff',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '4px',
                                    cursor: 'pointer',
                                    fontSize: '11px',
                                    marginBottom: '4px'
                                }}
                            >
                                {place.name} ({place.volume}%)
                            </button>
                        ))}
                    </div>
                )}
                
                {/* Statistics */}
                <div style={{ marginBottom: '15px' }}>
                    <p style={{ margin: '5px 0', fontSize: '14px', color: '#2c2c2c' }}>
                        <strong>Total Places:</strong> {garbagePlaces.length}
                    </p>
                    <p style={{ margin: '5px 0', fontSize: '14px', color: '#d32f2f', fontWeight: '600' }}>
                        <strong>High Volume (≥90%):</strong> {highVolumePlaces.length}
                    </p>
                    <p style={{ margin: '5px 0', fontSize: '14px', color: '#1976d2', fontWeight: '600' }}>
                        <strong>Normal Volume:</strong> {garbagePlaces.length - highVolumePlaces.length}
                    </p>
                </div>

                {/* High Volume Places List */}
                {highVolumePlaces.length > 0 && (
                    <div style={{ marginBottom: '15px' }}>
                        <h4 style={{ margin: '0 0 10px 0', color: '#d32f2f', fontWeight: 'bold' }}>Places Needing Cleaning:</h4>
                        <div style={{ maxHeight: '150px', overflowY: 'auto' }}>
                            {highVolumePlaces.map(place => (
                                <div key={place.id} style={{
                                    padding: '8px',
                                    margin: '5px 0',
                                    background: '#fff2f0',
                                    border: '1px solid #ffccc7',
                                    borderRadius: '5px',
                                    fontSize: '12px',
                                    color: '#2c2c2c'
                                }}>
                                    <strong style={{ color: '#d32f2f' }}>{place.name}</strong><br />
                                    <span style={{ color: '#666' }}>Volume: {place.volume}%</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Route Calculation Button */}
                <button
                    onClick={calculateOptimalRoute}
                    disabled={routeLoading || highVolumePlaces.length === 0}
                    style={{
                        width: '100%',
                        padding: '10px',
                        background: highVolumePlaces.length === 0 ? '#ccc' : '#52c41a',
                        color: 'white',
                        border: 'none',
                        borderRadius: '5px',
                        cursor: highVolumePlaces.length === 0 ? 'not-allowed' : 'pointer',
                        fontSize: '14px',
                        fontWeight: 'bold'
                    }}
                >
                    {routeLoading ? 'Calculating Route...' : 'Calculate Optimal Route'}
                </button>

                {/* Error Display */}
                {error && (
                    <div style={{
                        marginTop: '10px',
                        padding: '10px',
                        background: '#fff2f0',
                        border: '1px solid #ffccc7',
                        borderRadius: '5px',
                        color: '#ff4d4f',
                        fontSize: '12px'
                    }}>
                        {error}
                    </div>
                )}

                {/* Route Information */}
                {optimalRoute && (
                    <div style={{
                        marginTop: '15px',
                        padding: '10px',
                        background: '#f6ffed',
                        border: '1px solid #b7eb8f',
                        borderRadius: '5px',
                        fontSize: '12px'
                    }}>
                        <h4 style={{ margin: '0 0 10px 0', color: '#2e7d32', fontWeight: 'bold' }}>Optimal Route Calculated</h4>
                        <p style={{ margin: '5px 0', color: '#2c2c2c' }}>
                            <strong>Distance:</strong> {optimalRoute.distance ? `${(optimalRoute.distance / 1000).toFixed(2)} km` : 'N/A'}
                        </p>
                        <p style={{ margin: '5px 0', color: '#2c2c2c' }}>
                            <strong>Duration:</strong> {optimalRoute.duration ? `${Math.round(optimalRoute.duration / 60)} minutes` : 'N/A'}
                        </p>
                    </div>
                )}

                {/* Legend */}
                <div style={{ marginTop: '15px', fontSize: '12px' }}>
                    <h4 style={{ margin: '0 0 10px 0', color: '#2c2c2c', fontWeight: 'bold' }}>Legend:</h4>
                    <div style={{ display: 'flex', alignItems: 'center', marginBottom: '5px' }}>
                        <div style={{
                            width: '12px',
                            height: '12px',
                            background: '#d32f2f',
                            borderRadius: '50%',
                            marginRight: '8px'
                        }}></div>
                        <span style={{ color: '#2c2c2c' }}>High Volume (≥90%)</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                        <div style={{
                            width: '12px',
                            height: '12px',
                            background: '#1976d2',
                            borderRadius: '50%',
                            marginRight: '8px'
                        }}></div>
                        <span style={{ color: '#2c2c2c' }}>Normal Volume</span>
                    </div>
                </div>
            </div>

            {/* Information Box - Inspired by Parking Page */}
            {showInfoBox && selectedPlace && (
                <div style={{
                    position: 'absolute',
                    top: '16px',
                    right: '16px',
                    zIndex: 2000,
                    background: 'rgba(31,41,55,0.95)',
                    color: '#fff',
                    padding: '16px',
                    borderRadius: '12px',
                    fontFamily: 'system-ui, Arial, sans-serif',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.35)',
                    minWidth: '280px',
                    maxWidth: '320px'
                }}>
                    {/* Header */}
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        marginBottom: '12px'
                    }}>
                        <div style={{
                            fontSize: '24px',
                            marginRight: '10px'
                        }}>
                            {selectedPlace.volume >= 90 ? '🗑️' : '♻️'}
                        </div>
                        <div style={{
                            fontWeight: 700,
                            fontSize: '16px',
                            marginBottom: 4
                        }}>
                            {selectedPlace.name}
                        </div>
                    </div>

                    {/* Volume Status */}
                    <div style={{
                        fontSize: 13,
                        marginBottom: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between'
                    }}>
                        <span>Volume:</span>
                        <span style={{
                            fontWeight: 700,
                            color: selectedPlace.volume >= 90 ? '#ff6b6b' : '#4ecdc4'
                        }}>
                            {selectedPlace.volume}%
                        </span>
                    </div>

                    {/* Progress Bar */}
                    <div style={{
                        background: 'rgba(255,255,255,0.2)',
                        borderRadius: '8px',
                        height: '8px',
                        overflow: 'hidden',
                        marginBottom: '12px'
                    }}>
                        <div style={{
                            background: selectedPlace.volume >= 90 ? '#ff6b6b' : '#4ecdc4',
                            height: '100%',
                            width: `${selectedPlace.volume}%`,
                            borderRadius: '8px',
                            transition: 'width 0.3s ease'
                        }}></div>
                    </div>

                    {/* Status */}
                    <div style={{
                        fontSize: 13,
                        marginBottom: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between'
                    }}>
                        <span>Status:</span>
                        <span style={{
                            fontWeight: 700,
                            color: selectedPlace.volume >= 90 ? '#ff6b6b' : '#4ecdc4'
                        }}>
                            {selectedPlace.volume >= 90 ? 'HIGH' : 'NORMAL'}
                        </span>
                    </div>

                    {/* Coordinates */}
                    <div style={{
                        fontSize: 12,
                        color: '#9ca3af',
                        marginBottom: '12px',
                        lineHeight: '1.4'
                    }}>
                        <div>Lat: {selectedPlace.lat.toFixed(4)}</div>
                        <div>Lng: {selectedPlace.lng.toFixed(4)}</div>
                    </div>

                    {/* Action Required */}
                    <div style={{
                        fontSize: 12,
                        marginBottom: '12px',
                        padding: '8px',
                        background: selectedPlace.volume >= 90 ? 'rgba(255,107,107,0.2)' : 'rgba(78,205,196,0.2)',
                        borderRadius: '6px',
                        border: `1px solid ${selectedPlace.volume >= 90 ? '#ff6b6b' : '#4ecdc4'}`
                    }}>
                        {selectedPlace.volume >= 90 ? '🚨 Needs immediate cleaning' : '✅ Status normal'}
                    </div>

                    {/* Close Button */}
                    <button
                        onClick={closeInfoBox}
                        style={{
                            background: '#374151',
                            color: '#fff',
                            border: '1px solid #4b5563',
                            padding: '6px 12px',
                            fontSize: 12,
                            borderRadius: 6,
                            cursor: 'pointer',
                            width: '100%'
                        }}
                    >
                        Close
                    </button>
                </div>
            )}

        </div>
    );
};

export default GarbageTrackingPage;
