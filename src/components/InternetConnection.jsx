"use client";
import React from "react";
import useInternetConnection from "../hooks/useInternetConnection";

const InternetConnection = () => {
    const {
        isOnline,
        connectionType,
        isLoading,
        error,
        testInternetConnectivity,
        isOffline
    } = useInternetConnection();

    // Don't render anything if internet is connected
    if (isOnline) {
        return null;
    }

    const handleTestConnection = async () => {
        try {
            const result = await testInternetConnectivity();
            if (result) {
                console.log("Internet connection restored!");
            }
        } catch (err) {
            console.error("Failed to test internet connection:", err);
        }
    };

    const getUrgentMessage = () => {
        if (isOffline) {
            return "🚨 No Internet Connection!";
        }
        return "🌐 Checking Connection...";
    };

    const getDescription = () => {
        if (isOffline) {
            return "Please check your internet connection to continue using the app.";
        }
        return "Testing your internet connectivity...";
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl p-6 max-w-sm mx-4 animate-pulse">
                <div className="text-center">
                    <div className="text-2xl mb-3 font-bold text-gray-900">
                        {getUrgentMessage()}
                    </div>

                    <p className="text-gray-800 mb-4 text-sm font-medium">
                        {getDescription()}
                    </p>

                    {error && (
                        <div className="mb-4 p-2 bg-red-100 border border-red-400 text-red-700 rounded text-xs">
                            {error}
                        </div>
                    )}

                    <button
                        onClick={handleTestConnection}
                        disabled={isLoading}
                        className={`w-full py-3 px-4 rounded-lg font-semibold text-white transition-all ${isLoading
                                ? "bg-gray-400 cursor-not-allowed"
                                : "bg-red-500 hover:bg-red-600 shadow-lg hover:shadow-xl transform hover:scale-105"
                            }`}
                    >
                        {isLoading ? (
                            <div className="flex items-center justify-center">
                                <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                                Testing Connection...
                            </div>
                        ) : (
                            "🔄 Test Connection"
                        )}
                    </button>

                    <div className="mt-3 text-xs text-gray-600">
                        💡 Tip: Check your WiFi or mobile data connection
                    </div>

                    {connectionType !== 'unknown' && (
                        <div className="mt-2 text-xs text-gray-500">
                            Connection Type: {connectionType}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default InternetConnection;