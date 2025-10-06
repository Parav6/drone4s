"use client";
import { useEffect, useState, useCallback, useMemo } from "react";
import { app } from "../../../context/Firebase";
import { getDatabase, ref, onValue, set } from "firebase/database";
import { useAuth } from "../../../hooks/useAuth";
import { useRouter } from "next/navigation";

export default function AdminAlertMap() {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [map, setMap] = useState(null);
  const [mapLoading, setMapLoading] = useState(true);
  const [selectedAlertId, setSelectedAlertId] = useState(null);
  const [markers, setMarkers] = useState({});
  const { user, isAdmin } = useAuth();
  const router = useRouter();
  const db = getDatabase(app);

  // Redirect if not admin
  useEffect(() => {
    if (!isAdmin) {
      router.push('/admin');
    }
  }, [isAdmin, router]);

  // Load alerts from Firebase
  useEffect(() => {
    const alertsRef = ref(db, 'responses');
    const unsubscribe = onValue(alertsRef, (snapshot) => {
      try {
        const data = snapshot.val();
        if (data) {
          const alertsList = Object.entries(data)
            .map(([key, value]) => {
              // Validate and clean the data
              if (!value || typeof value !== 'object') {
                console.warn('Invalid alert data for key:', key, value);
                return null;
              }

              return {
                id: key,
                problem: value.problem || 'Unknown Problem',
                description: value.description || 'No description available',
                userName: value.userName || 'Unknown User',
                timestamp: value.timestamp || Date.now(),
                latitude: value.latitude ? parseFloat(value.latitude) : null,
                longitude: value.longitude ? parseFloat(value.longitude) : null,
                priority: value.priority || 'low',
                isVerified: value.isVerified || false
              };
            })
            .filter(alert => alert && alert.latitude && alert.longitude); // Only include alerts with valid coordinates

          setAlerts(alertsList);
        } else {
          setAlerts([]);
        }
      } catch (error) {
        console.error('Error processing Firebase data:', error);
        setAlerts([]);
      }
      setLoading(false);
    }, (error) => {
      console.error('Firebase error:', error);
      setLoading(false);
      setAlerts([]);
    });

    return () => unsubscribe();
  }, [db]);

  // Initialize map
  useEffect(() => {
    // Don't reinitialize if map already exists
    if (map) {
      return;
    }

    // Check if script is already loaded
    if (window.mappls) {
      initializeMap();
      return;
    }

    // Check if script is already being loaded
    const existingScript = document.querySelector('script[src*="mappls.com"]');
    if (existingScript) {
      existingScript.addEventListener('load', initializeMap);
      return () => existingScript.removeEventListener('load', initializeMap);
    }

    const script = document.createElement("script");
    script.src = `https://apis.mappls.com/advancedmaps/api/f6cc67d011fd246c37345dbaac88f334/map_sdk?layer=vector&v=3.0`;
    script.async = true;
    script.onload = initializeMap;
    script.onerror = () => {
      console.error('Failed to load MapPLS script');
      setMapLoading(false);
    };

    document.head.appendChild(script);

    return () => {
      if (document.head.contains(script)) {
        document.head.removeChild(script);
      }
    };
  }, [map]); // Add map as dependency to prevent reinitialization

  const initializeMap = () => {
    if (!window.mappls) {
      console.error('MapPLS not available');
      setMapLoading(false);
      return;
    }

    // Wait for the DOM to be ready and the map div to exist
    const initMap = () => {
      const mapElement = document.getElementById("map");
      if (mapElement && !map) { // Only initialize if map doesn't exist
        try {
          // IIT Roorkee campus coordinates
          const iitRoorkeeCenter = { lat: 29.8647, lng: 77.8963 };

          const mapInstance = new window.mappls.Map("map", {
            center: iitRoorkeeCenter,
            zoom: 14
          });

          setMap(mapInstance);
          setMapLoading(false);
        } catch (error) {
          console.error('Error initializing map:', error);
          setMapLoading(false);
        }
      } else if (!mapElement) {
        // If map div doesn't exist yet, try again after a short delay
        setTimeout(initMap, 100);
      }
    };

    // Use requestAnimationFrame to ensure DOM is ready
    requestAnimationFrame(initMap);
  };

  // Add global functions for popup buttons
  useEffect(() => {
    window.verifyAlert = (alertId) => {
      handleVerify(alertId);
    };
    window.removeAlert = (alertId) => {
      if (confirm('Are you sure you want to remove this alert?')) {
        removeAlert(alertId);
      }
    };

    return () => {
      delete window.verifyAlert;
      delete window.removeAlert;
    };
  }, []);

  // Debounced marker updates to prevent excessive re-renders
  const debouncedMarkerUpdate = useCallback(() => {
    if (map && !mapLoading) {
      // Clear existing markers safely
      try {
        // Try different methods to clear markers based on API availability
        if (typeof map.removeAllMarkers === 'function') {
          map.removeAllMarkers();
        } else if (typeof map.clearMarkers === 'function') {
          map.clearMarkers();
        } else {
          // Fallback: manually remove markers from state
          Object.values(markers).forEach(marker => {
            if (marker && typeof marker.remove === 'function') {
              marker.remove();
            }
          });
        }
      } catch (error) {
        console.warn('Error clearing markers:', error);
      }

      // Clear markers state
      setMarkers({});

      if (alerts.length > 0) {
        alerts.forEach((alert) => {
          if (alert.latitude && alert.longitude && !isNaN(alert.latitude) && !isNaN(alert.longitude)) {
            // Determine marker color based on priority and verification status
            let markerColor;
            let markerIcon;

            if (!alert.isVerified) {
              markerColor = '#6b7280'; // Grey for unverified
              markerIcon = 'https://maps.google.com/mapfiles/ms/icons/gray-dot.png';
            } else {
              switch (alert.priority) {
                case 'high':
                  markerColor = '#dc2626'; // Red for high priority
                  markerIcon = 'https://maps.google.com/mapfiles/ms/icons/red-dot.png';
                  break;
                case 'medium':
                  markerColor = '#f59e0b'; // Orange for medium priority
                  markerIcon = 'https://maps.google.com/mapfiles/ms/icons/orange-dot.png';
                  break;
                case 'low':
                  markerColor = '#eab308'; // Yellow for low priority
                  markerIcon = 'https://maps.google.com/mapfiles/ms/icons/yellow-dot.png';
                  break;
                default:
                  markerColor = '#eab308'; // Default to yellow
                  markerIcon = 'https://maps.google.com/mapfiles/ms/icons/yellow-dot.png';
              }
            }

            // Determine if this marker should be highlighted
            const isSelected = selectedAlertId === alert.id;
            const highlightColor = isSelected ? '#3b82f6' : markerColor; // Blue for selected
            const highlightIcon = isSelected ? 'https://maps.google.com/mapfiles/ms/icons/blue-dot.png' : markerIcon;

            try {
              const marker = new window.mappls.Marker({
                map: map,
                position: { lat: alert.latitude, lng: alert.longitude },
                draggable: false, // Make markers non-draggable
                popupHtml: `
                  <div style="padding: 12px; min-width: 250px; background: #ffffff; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.15); border: ${isSelected ? '3px solid #3b82f6' : 'none'};">
                    <div style="display: flex; align-items: center; margin-bottom: 8px;">
                      <div style="width: 12px; height: 12px; border-radius: 50%; background-color: ${highlightColor}; margin-right: 8px; ${isSelected ? 'box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.3);' : ''}"></div>
                      <h4 style="margin: 0; color: #1f2937; font-size: 1rem; font-weight: bold;">${alert.problem || 'Unknown Problem'}</h4>
                    </div>
                    <p style="margin: 0 0 12px 0; font-size: 0.875rem; color: #374151; line-height: 1.4;">${alert.description || 'No description available'}</p>
                    <div style="font-size: 0.75rem; color: #6b7280; background: #f9fafb; padding: 8px; border-radius: 4px;">
                      <div style="margin-bottom: 4px;"><strong style="color: #374151;">User:</strong> ${alert.userName || 'Unknown'}</div>
                      <div style="margin-bottom: 4px;"><strong style="color: #374151;">Time:</strong> ${alert.timestamp ? new Date(alert.timestamp).toLocaleString() : 'Unknown'}</div>
                      <div style="margin-bottom: 4px;">
                        <strong style="color: #374151;">Priority:</strong> 
                        <span style="color: ${markerColor}; font-weight: bold; text-transform: uppercase;">${alert.priority || 'low'}</span>
                      </div>
                      <div style="margin-bottom: 8px;">
                        <strong style="color: #374151;">Status:</strong> 
                        <span style="color: ${alert.isVerified ? '#16a34a' : '#dc2626'}; font-weight: bold;">
                          ${alert.isVerified ? '✅ Verified' : '❌ Pending'}
                        </span>
                      </div>
                      <div style="display: flex; gap: 8px;">
                        ${!alert.isVerified ? `
                          <button onclick="window.verifyAlert('${alert.id}')" style="background: #16a34a; color: white; border: none; padding: 4px 8px; border-radius: 4px; font-size: 0.7rem; cursor: pointer;">
                            ✓ Verify
                          </button>
                        ` : ''}
                        <button onclick="window.removeAlert('${alert.id}')" style="background: #dc2626; color: white; border: none; padding: 4px 8px; border-radius: 4px; font-size: 0.7rem; cursor: pointer;">
                          🗑️ Remove
                        </button>
                      </div>
                    </div>
                  </div>
                `,
                icon: highlightIcon
              });

              // Store marker reference
              setMarkers(prev => ({
                ...prev,
                [alert.id]: marker
              }));
            } catch (error) {
              console.error('Error creating marker for alert:', alert.id, error);
            }
          }
        });
      }
    }
  }, [map, mapLoading, alerts, selectedAlertId, markers]);

  // Add markers to map when alerts or map changes (with debouncing)
  useEffect(() => {
    const timeoutId = setTimeout(debouncedMarkerUpdate, 100);
    return () => clearTimeout(timeoutId);
  }, [debouncedMarkerUpdate]);

  const updateAlertStatus = useCallback(async (alertId, updates) => {
    try {
      const alertRef = ref(db, `responses/${alertId}`);
      await set(alertRef, { ...alerts.find(a => a.id === alertId), ...updates });
    } catch (error) {
      console.error('Error updating alert:', error);
    }
  }, [db, alerts]);

  const removeAlert = useCallback(async (alertId) => {
    try {
      const alertRef = ref(db, `responses/${alertId}`);
      await set(alertRef, null); // Remove from database
    } catch (error) {
      console.error('Error removing alert:', error);
    }
  }, [db]);

  const handleVerify = useCallback((alertId) => {
    updateAlertStatus(alertId, { isVerified: true });
  }, [updateAlertStatus]);

  const handlePriorityChange = useCallback((alertId, priority) => {
    updateAlertStatus(alertId, { priority });
  }, [updateAlertStatus]);

  const handleAlertClick = useCallback((alert) => {
    if (alert.latitude && alert.longitude && map) {
      // Set selected alert
      setSelectedAlertId(alert.id);

      // Zoom to alert location
      map.setCenter({ lat: alert.latitude, lng: alert.longitude });
      map.setZoom(16); // Higher zoom level for better visibility

      // Optional: Open popup for the marker (if the map API supports it)
      // You might need to store marker references to trigger popups
    }
  }, [map]);

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gray-900 text-gray-100 flex items-center justify-center">
        <div className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 to-red-600/20"></div>
          <div className="relative bg-gray-800/50 backdrop-blur-sm p-8 rounded-2xl border border-gray-700/50 text-center shadow-2xl">
            <div className="text-red-400 text-6xl mb-4">🚫</div>
            <h1 className="text-2xl font-bold text-white mb-2">Access Denied</h1>
            <p className="text-gray-300">You need administrator privileges to access this page.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100">
      {/* Background Effects - Behind everything */}
      <div className="fixed inset-0 bg-gradient-to-br from-blue-600/10 to-gray-800/10 -z-10"></div>

      {/* Header */}
      <div className="relative bg-gray-800/30 backdrop-blur-sm border-b border-gray-700/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-400 to-green-400 bg-clip-text text-transparent">
                Alert Verification Map
              </h1>
              <p className="text-gray-300 mt-2">Verify and manage emergency alerts across campus</p>
            </div>
            <button
              onClick={() => router.push('/admin')}
              className="bg-gradient-to-r from-gray-600 to-gray-700 text-white px-6 py-3 rounded-xl hover:from-gray-700 hover:to-gray-800 transition-all duration-300 font-semibold shadow-lg hover:shadow-xl hover:scale-105"
            >
              ← Back to Admin Panel
            </button>
          </div>
        </div>
      </div>

      <div className="relative max-w-7xl mx-auto py-8 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Alerts List */}
          <div className="lg:col-span-1">
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-gray-700/50 shadow-2xl">
              <div className="px-6 py-5 border-b border-gray-700/50">
                <h2 className="text-xl font-bold text-white flex items-center">
                  <div className="w-3 h-3 bg-gradient-to-r from-blue-400 to-cyan-400 rounded-full mr-3"></div>
                  Alerts ({alerts.length})
                </h2>
              </div>
              <div className="max-h-96 overflow-y-auto">
                {loading ? (
                  <div className="p-8 text-center text-gray-400">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400 mx-auto mb-4"></div>
                    Loading alerts...
                  </div>
                ) : alerts.length === 0 ? (
                  <div className="p-8 text-center text-gray-400">
                    <div className="text-4xl mb-4">📭</div>
                    No alerts found
                  </div>
                ) : (
                  alerts.map((alert) => (
                    <div
                      key={alert.id}
                      className={`p-5 border-b border-gray-700/50 last:border-b-0 cursor-pointer transition-all duration-300 hover:bg-gray-700/30 ${selectedAlertId === alert.id
                        ? 'bg-blue-900/30 border-l-4 border-l-blue-400'
                        : ''
                        }`}
                      onClick={() => handleAlertClick(alert)}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center">
                          <div
                            className="w-3 h-3 rounded-full mr-3 flex-shrink-0"
                            style={{
                              backgroundColor: !alert.isVerified ? '#6b7280' :
                                alert.priority === 'high' ? '#dc2626' :
                                  alert.priority === 'medium' ? '#f59e0b' : '#eab308',
                              boxShadow: selectedAlertId === alert.id ? '0 0 0 2px rgba(59, 130, 246, 0.4)' : 'none'
                            }}
                          ></div>
                          <h3 className="font-semibold text-white text-sm">{alert.problem}</h3>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${alert.isVerified ? 'bg-green-900/50 text-green-300 border border-green-500/30' : 'bg-gray-700/50 text-gray-300 border border-gray-600/30'
                          }`}>
                          {alert.isVerified ? '✅ Verified' : '⏳ Pending'}
                        </span>
                      </div>
                      <p className="text-sm text-gray-300 mb-4 leading-relaxed">{alert.description}</p>

                      <div className="space-y-3">
                        <div className="flex items-center gap-3" onClick={(e) => e.stopPropagation()}>
                          <label className="text-xs text-gray-400 font-medium">Priority:</label>
                          <select
                            value={alert.priority || 'low'}
                            onChange={(e) => handlePriorityChange(alert.id, e.target.value)}
                            className="text-xs bg-gray-700/50 border border-gray-600/50 rounded-lg px-3 py-1 text-white focus:border-blue-400 focus:ring-1 focus:ring-blue-400 transition-colors"
                            style={{
                              color: alert.priority === 'high' ? '#dc2626' :
                                alert.priority === 'medium' ? '#f59e0b' : '#eab308',
                              fontWeight: 'bold'
                            }}
                          >
                            <option value="low">🟡 Low</option>
                            <option value="medium">🟠 Medium</option>
                            <option value="high">🔴 High</option>
                          </select>
                        </div>

                        <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                          {!alert.isVerified && (
                            <button
                              onClick={() => handleVerify(alert.id)}
                              className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 text-white text-xs py-2 px-3 rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all duration-300 font-semibold shadow-md hover:shadow-lg hover:scale-105"
                            >
                              ✓ Verify
                            </button>
                          )}
                          <button
                            onClick={() => {
                              if (confirm('Are you sure you want to remove this alert?')) {
                                removeAlert(alert.id);
                              }
                            }}
                            className="flex-1 bg-gradient-to-r from-red-600 to-pink-600 text-white text-xs py-2 px-3 rounded-lg hover:from-red-700 hover:to-pink-700 transition-all duration-300 font-semibold shadow-md hover:shadow-lg hover:scale-105"
                          >
                            🗑️ Remove
                          </button>
                        </div>

                        <div className="text-xs text-gray-400 bg-gray-800/30 p-3 rounded-lg border border-gray-700/30">
                          <div className="mb-1"><strong className="text-gray-300">User:</strong> {alert.userName || 'Unknown'}</div>
                          <div className="mb-1"><strong className="text-gray-300">Time:</strong> {new Date(alert.timestamp).toLocaleString()}</div>
                          {alert.latitude && alert.longitude && (
                            <div><strong className="text-gray-300">Location:</strong> {alert.latitude.toFixed(4)}, {alert.longitude.toFixed(4)}</div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Map */}
          <div className="lg:col-span-2">
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-gray-700/50 shadow-2xl">
              <div className="px-6 py-5 border-b border-gray-700/50">
                <h2 className="text-xl font-bold text-white mb-4 flex items-center">
                  <div className="w-3 h-3 bg-gradient-to-r from-green-400 to-cyan-400 rounded-full mr-3"></div>
                  Alert Locations
                </h2>
                <div className="flex flex-wrap gap-4 text-xs">
                  <div className="flex items-center bg-gray-700/30 px-3 py-2 rounded-lg border border-gray-600/30">
                    <div className="w-3 h-3 rounded-full bg-gray-500 mr-2"></div>
                    <span className="text-gray-300 font-semibold">Unverified</span>
                  </div>
                  <div className="flex items-center bg-gray-700/30 px-3 py-2 rounded-lg border border-gray-600/30">
                    <div className="w-3 h-3 rounded-full bg-red-600 mr-2"></div>
                    <span className="text-red-400 font-semibold">High Priority</span>
                  </div>
                  <div className="flex items-center bg-gray-700/30 px-3 py-2 rounded-lg border border-gray-600/30">
                    <div className="w-3 h-3 rounded-full bg-orange-500 mr-2"></div>
                    <span className="text-orange-400 font-semibold">Medium Priority</span>
                  </div>
                  <div className="flex items-center bg-gray-700/30 px-3 py-2 rounded-lg border border-gray-600/30">
                    <div className="w-3 h-3 rounded-full bg-yellow-500 mr-2"></div>
                    <span className="text-yellow-400 font-semibold">Low Priority</span>
                  </div>
                  <div className="flex items-center bg-gray-700/30 px-3 py-2 rounded-lg border border-gray-600/30">
                    <div className="w-3 h-3 rounded-full bg-blue-500 mr-2" style={{ boxShadow: '0 0 0 2px rgba(59, 130, 246, 0.3)' }}></div>
                    <span className="text-blue-400 font-semibold">Selected</span>
                  </div>
                </div>
              </div>
              <div style={{ height: "500px", width: "100%", position: "relative" }}>
                {mapLoading ? (
                  <div className="flex items-center justify-center h-full bg-gray-800/30 rounded-b-2xl">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mx-auto mb-4"></div>
                      <p className="text-gray-300">Loading map...</p>
                    </div>
                  </div>
                ) : null}
                <div id="map" style={{ height: "100%", width: "100%", borderRadius: "0 0 1rem 1rem" }}></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}