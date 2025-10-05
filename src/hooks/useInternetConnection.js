"use client";
import { useState, useEffect } from 'react';

const useInternetConnection = () => {
    const [isOnline, setIsOnline] = useState(true);
    const [connectionType, setConnectionType] = useState('unknown');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    // Check initial connection status
    const checkConnection = () => {
        setIsOnline(navigator.onLine);

        // Get connection type if available
        if ('connection' in navigator) {
            const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
            if (connection) {
                setConnectionType(connection.effectiveType || connection.type || 'unknown');
            }
        }
    };

    // Test actual internet connectivity (not just network connection)
    const testInternetConnectivity = async () => {
        setIsLoading(true);
        setError(null);

        try {
            // Try to fetch a small resource to test actual internet connectivity
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

            const response = await fetch('https://www.google.com/favicon.ico', {
                method: 'HEAD',
                mode: 'no-cors',
                cache: 'no-store',
                signal: controller.signal
            });

            clearTimeout(timeoutId);
            setIsOnline(true);
            setError(null);
            return true;
        } catch (err) {
            if (err.name === 'AbortError') {
                setError('Connection test timed out. Please check your internet connection.');
            } else {
                setError('No internet connection detected. Please check your network settings.');
            }
            setIsOnline(false);
            return false;
        } finally {
            setIsLoading(false);
        }
    };

    // Handle online/offline events
    useEffect(() => {
        const handleOnline = () => {
            setIsOnline(true);
            setError(null);
            console.log('Connection restored');
        };

        const handleOffline = () => {
            setIsOnline(false);
            setError('Internet connection lost');
            console.log('Connection lost');
        };

        // Initial check
        checkConnection();

        // Listen for connection changes
        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        // Periodic connectivity test (every 30 seconds when offline)
        const interval = setInterval(() => {
            if (!navigator.onLine) {
                testInternetConnectivity();
            } else {
                checkConnection();
            }
        }, 30000);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
            clearInterval(interval);
        };
    }, []);

    return {
        isOnline,
        connectionType,
        isLoading,
        error,
        testInternetConnectivity,
        checkConnection,
        isOffline: !isOnline
    };
};

export default useInternetConnection;