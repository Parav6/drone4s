"use client";
import { useState, useEffect, useRef } from 'react';

/**
 * useLocation (renamed from useLocationPermission)
 * Consolidated location + permission + tracking hook.
 * Options:
 *  - autoTrack (default: true)
 *  - highAccuracy (default: true)
 *  - trackOnPermissionChange (default: true)
 *  - minimumDistanceMeters (default: 0)
 */
const useLocation = (options = {}) => {
    const {
        autoTrack = true,
        highAccuracy = true,
        trackOnPermissionChange = true,
        minimumDistanceMeters = 0
    } = options;

    const [locationStatus, setLocationStatus] = useState('checking');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [currentPosition, setCurrentPosition] = useState(null);
    const [isTracking, setIsTracking] = useState(false);
    const watchIdRef = useRef(null);
    const lastAcceptedCoordsRef = useRef(null);

    const checkLocationPermission = async () => {
        try {
            if (!navigator.geolocation) {
                setLocationStatus('not-supported');
                setError('Geolocation is not supported by this browser');
                return;
            }
            if (navigator.permissions) {
                const permission = await navigator.permissions.query({ name: 'geolocation' });
                setLocationStatus(permission.state);
                permission.onchange = () => {
                    setLocationStatus(permission.state);
                    if (permission.state === 'granted') setError(null);
                };
            } else {
                navigator.geolocation.getCurrentPosition(
                    () => { setLocationStatus('granted'); setError(null); },
                    (err) => {
                        if (err.code === err.PERMISSION_DENIED) setLocationStatus('denied');
                        else setLocationStatus('prompt');
                    },
                    { timeout: 0 }
                );
            }
        } catch (e) {
            setError('Error checking location permission');
            setLocationStatus('error');
        }
    };

    const requestLocationPermission = async () => {
        setIsLoading(true);
        setError(null);
        try {
            if (!navigator.geolocation) throw new Error('Geolocation is not supported by this browser');
            if (locationStatus === 'denied') setLocationStatus('prompt');
            return await new Promise((resolve, reject) => {
                navigator.geolocation.getCurrentPosition(
                    (pos) => {
                        setLocationStatus('granted');
                        setIsLoading(false);
                        resolve(pos);
                    },
                    (err) => {
                        setIsLoading(false);
                        let errorMessage = '';
                        switch (err.code) {
                            case err.PERMISSION_DENIED:
                                setLocationStatus('denied');
                                errorMessage = 'Location access denied by user.';
                                break;
                            case err.POSITION_UNAVAILABLE:
                                errorMessage = 'Location information is unavailable.';
                                break;
                            case err.TIMEOUT:
                                errorMessage = 'Location request timed out.';
                                break;
                            default:
                                errorMessage = 'Unknown location error.';
                        }
                        setError(errorMessage);
                        reject(err);
                    },
                    { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
                );
            });
        } catch (e) {
            setIsLoading(false);
            setError(e.message);
            throw e;
        }
    };

    const getCurrentPosition = async () => {
        if (locationStatus !== 'granted') throw new Error('Location permission not granted');
        return await new Promise((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 300000
            });
        });
    };

    const isBeyondMinDistance = (lat, lng) => {
        if (!minimumDistanceMeters || !lastAcceptedCoordsRef.current) return true;
        const { latitude: lastLat, longitude: lastLng } = lastAcceptedCoordsRef.current;
        const R = 6371000;
        const toRad = d => d * Math.PI / 180;
        const dLat = toRad(lat - lastLat);
        const dLng = toRad(lng - lastLng);
        const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lastLat)) * Math.cos(toRad(lat)) * Math.sin(dLng / 2) ** 2;
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return (R * c) >= minimumDistanceMeters;
    };

    const startTracking = () => {
        if (locationStatus !== 'granted') { setError('Location permission not granted'); return; }
        if (watchIdRef.current) return;
        try {
            const id = navigator.geolocation.watchPosition(
                (pos) => {
                    const { latitude, longitude } = pos.coords;
                    if (isBeyondMinDistance(latitude, longitude)) {
                        lastAcceptedCoordsRef.current = { latitude, longitude };
                        setCurrentPosition(pos);
                    }
                },
                (err) => { setError(err.message || 'Error watching position'); },
                { enableHighAccuracy: highAccuracy, timeout: 15000, maximumAge: 5000 }
            );
            watchIdRef.current = id;
            setIsTracking(true);
        } catch (e) { setError(e.message); }
    };

    const stopTracking = () => {
        if (watchIdRef.current) {
            navigator.geolocation.clearWatch(watchIdRef.current);
            watchIdRef.current = null;
        }
        setIsTracking(false);
    };

    const watchPosition = (cb, errCb) => {
        if (locationStatus !== 'granted') throw new Error('Location permission not granted');
        return navigator.geolocation.watchPosition(cb, errCb, { enableHighAccuracy: highAccuracy, timeout: 10000, maximumAge: 60000 });
    };

    const refreshCurrentPosition = async () => {
        try {
            const pos = await getCurrentPosition();
            lastAcceptedCoordsRef.current = { latitude: pos.coords.latitude, longitude: pos.coords.longitude };
            setCurrentPosition(pos);
            return pos;
        } catch (e) { setError(e.message); throw e; }
    };

    useEffect(() => { checkLocationPermission(); }, []);

    useEffect(() => {
        const interval = setInterval(async () => {
            if (navigator.permissions) {
                try {
                    const permission = await navigator.permissions.query({ name: 'geolocation' });
                    if (permission.state !== locationStatus) {
                        setLocationStatus(permission.state);
                        if (permission.state === 'granted') {
                            setError(null);
                            if (trackOnPermissionChange && autoTrack) startTracking();
                        } else if (permission.state !== 'granted') {
                            stopTracking();
                        }
                    }
                } catch (_) { }
            }
        }, 2000);
        return () => clearInterval(interval);
    }, [locationStatus, autoTrack, trackOnPermissionChange]);

    useEffect(() => {
        if (locationStatus === 'granted' && autoTrack) {
            refreshCurrentPosition();
            startTracking();
        } else if (locationStatus !== 'granted') {
            stopTracking();
        }
        return () => { stopTracking(); };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [locationStatus, autoTrack]);

    return {
        locationStatus,
        isLoading,
        error,
        requestLocationPermission,
        getCurrentPosition,
        watchPosition,
        checkLocationPermission,
        currentPosition,
        latitude: currentPosition?.coords?.latitude ?? null,
        longitude: currentPosition?.coords?.longitude ?? null,
        startTracking,
        stopTracking,
        isTracking,
        refreshCurrentPosition,
        isLocationEnabled: locationStatus === 'granted',
        isLocationDenied: locationStatus === 'denied',
        needsPermission: locationStatus === 'prompt' || locationStatus === 'checking'
    };
};

export default useLocation;
