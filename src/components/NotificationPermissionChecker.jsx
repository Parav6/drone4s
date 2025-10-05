"use client";

import { useState, useEffect } from 'react';

const NotificationPermissionChecker = () => {
    const [permission, setPermission] = useState(null);
    const [browserSupport, setBrowserSupport] = useState(false);

    useEffect(() => {
        checkPermissions();
    }, []);

    const checkPermissions = () => {
        // Check browser support
        const supported = 'Notification' in window && 'serviceWorker' in navigator;
        setBrowserSupport(supported);

        if (!supported) {
            setPermission('not-supported');
            return;
        }

        // Check current permission
        const currentPermission = Notification.permission;
        setPermission(currentPermission);

        console.log('🔍 Notification Permission Check:');
        console.log('Browser Support:', supported);
        console.log('Current Permission:', currentPermission);
        
        switch (currentPermission) {
            case 'granted':
                console.log('✅ Notifications are allowed');
                break;
            case 'denied':
                console.log('❌ Notifications are blocked');
                break;
            case 'default':
                console.log('⚠️ Notification permission not requested yet');
                break;
        }
    };

    const getPermissionIcon = () => {
        switch (permission) {
            case 'granted': return '✅';
            case 'denied': return '❌';
            case 'default': return '⚠️';
            default: return '❓';
        }
    };

    const getPermissionColor = () => {
        switch (permission) {
            case 'granted': return 'text-green-600';
            case 'denied': return 'text-red-600';
            case 'default': return 'text-yellow-600';
            default: return 'text-gray-600';
        }
    };

    const getTroubleshootingSteps = () => {
        switch (permission) {
            case 'denied':
                return (
                    <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                        <h3 className="font-semibold text-red-800 mb-2">🔧 How to Enable Notifications:</h3>
                        <div className="text-sm text-red-700 space-y-2">
                            <div><strong>Chrome/Edge:</strong></div>
                            <ul className="ml-4 space-y-1">
                                <li>• Click the lock icon in the address bar</li>
                                <li>• Set "Notifications" to "Allow"</li>
                                <li>• Refresh the page</li>
                            </ul>
                            
                            <div><strong>Firefox:</strong></div>
                            <ul className="ml-4 space-y-1">
                                <li>• Click the shield icon in the address bar</li>
                                <li>• Click "Turn off Enhanced Tracking Protection for this site"</li>
                                <li>• Allow notifications when prompted</li>
                            </ul>
                            
                            <div><strong>Alternative Method:</strong></div>
                            <ul className="ml-4 space-y-1">
                                <li>• Go to Browser Settings → Privacy and Security → Site Settings</li>
                                <li>• Find your site and set notifications to "Allow"</li>
                            </ul>
                        </div>
                    </div>
                );
            
            case 'default':
                return (
                    <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <h3 className="font-semibold text-yellow-800 mb-2">📝 Next Steps:</h3>
                        <div className="text-sm text-yellow-700">
                            <p>Permission hasn't been requested yet. Click any "Get FCM Token" button to request notification permission.</p>
                        </div>
                    </div>
                );
            
            case 'not-supported':
                return (
                    <div className="mt-4 p-4 bg-gray-50 border border-gray-200 rounded-lg">
                        <h3 className="font-semibold text-gray-800 mb-2">🚫 Browser Not Supported:</h3>
                        <div className="text-sm text-gray-700 space-y-2">
                            <p>Your browser doesn't support notifications or service workers.</p>
                            <div><strong>Try using:</strong></div>
                            <ul className="ml-4 space-y-1">
                                <li>• Google Chrome (latest version)</li>
                                <li>• Mozilla Firefox (latest version)</li>
                                <li>• Microsoft Edge (latest version)</li>
                                <li>• Safari (macOS/iOS)</li>
                            </ul>
                            <p className="mt-2"><strong>Note:</strong> HTTPS is required for notifications to work.</p>
                        </div>
                    </div>
                );
            
            case 'granted':
                return (
                    <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                        <h3 className="font-semibold text-green-800 mb-2">🎉 All Set!</h3>
                        <div className="text-sm text-green-700">
                            <p>Notifications are enabled and ready to use. You can now receive push notifications.</p>
                        </div>
                    </div>
                );
            
            default:
                return null;
        }
    };

    return (
        <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">Browser Notification Status</h2>
                <button
                    onClick={checkPermissions}
                    className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600 transition-colors"
                >
                    🔄 Refresh
                </button>
            </div>
            
            <div className="space-y-3">
                <div className="flex items-center space-x-3">
                    <span className="text-lg">{getPermissionIcon()}</span>
                    <div>
                        <div className={`font-medium ${getPermissionColor()}`}>
                            {permission === 'granted' ? 'Notifications Allowed' :
                             permission === 'denied' ? 'Notifications Blocked' :
                             permission === 'default' ? 'Permission Not Requested' :
                             'Not Supported'}
                        </div>
                        <div className="text-sm text-gray-500">
                            Status: {permission || 'Unknown'} | Browser Support: {browserSupport ? 'Yes' : 'No'}
                        </div>
                    </div>
                </div>
                
                {getTroubleshootingSteps()}
            </div>
        </div>
    );
};

export default NotificationPermissionChecker;
