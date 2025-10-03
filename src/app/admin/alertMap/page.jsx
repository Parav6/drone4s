"use client";
import { useEffect, useState } from "react";
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
      const data = snapshot.val();
      if (data) {
        const alertsList = Object.entries(data).map(([key, value]) => ({
          id: key,
          ...value
        }));
        setAlerts(alertsList);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [db]);

  // Initialize map
  useEffect(() => {
    const script = document.createElement("script");
    script.src = `https://apis.mappls.com/advancedmaps/api/f6cc67d011fd246c37345dbaac88f334/map_sdk?layer=vector&v=3.0`;
    script.async = true;
    script.onload = () => {
      if (window.mappls) {
        // Wait for the DOM to be ready and the map div to exist
        const initMap = () => {
          const mapElement = document.getElementById("map");
          if (mapElement) {
            const mapInstance = new window.mappls.Map("map", {});
            setMap(mapInstance);
            setMapLoading(false);
          } else {
            // If map div doesn't exist yet, try again after a short delay
            setTimeout(initMap, 100);
          }
        };
        initMap();
      }
    };
    document.body.appendChild(script);
    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, []);

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

  // Add markers to map when alerts or map changes
  useEffect(() => {
    if (map && !mapLoading && alerts.length > 0) {
      // Clear existing markers
      map.removeAllMarkers?.();
      
      alerts.forEach((alert) => {
        if (alert.latitude && alert.longitude) {
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

          const marker = new window.mappls.Marker({
            map: map,
            position: { lat: alert.latitude, lng: alert.longitude },
            popupHtml: `
              <div style="padding: 12px; min-width: 250px; background: #ffffff; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.15); border: ${isSelected ? '3px solid #3b82f6' : 'none'};">
                <div style="display: flex; align-items: center; margin-bottom: 8px;">
                  <div style="width: 12px; height: 12px; border-radius: 50%; background-color: ${highlightColor}; margin-right: 8px; ${isSelected ? 'box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.3);' : ''}"></div>
                  <h4 style="margin: 0; color: #1f2937; font-size: 1rem; font-weight: bold;">${alert.problem}</h4>
                </div>
                <p style="margin: 0 0 12px 0; font-size: 0.875rem; color: #374151; line-height: 1.4;">${alert.description}</p>
                <div style="font-size: 0.75rem; color: #6b7280; background: #f9fafb; padding: 8px; border-radius: 4px;">
                  <div style="margin-bottom: 4px;"><strong style="color: #374151;">User:</strong> ${alert.userName || 'Unknown'}</div>
                  <div style="margin-bottom: 4px;"><strong style="color: #374151;">Time:</strong> ${new Date(alert.timestamp).toLocaleString()}</div>
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
        }
      });

      // Set map center to first alert if available
      if (alerts.length > 0 && alerts[0].latitude && alerts[0].longitude) {
        map.setCenter({ lat: alerts[0].latitude, lng: alerts[0].longitude });
        map.setZoom(12);
      }
    }
  }, [map, mapLoading, alerts, selectedAlertId]);

  const updateAlertStatus = async (alertId, updates) => {
    try {
      const alertRef = ref(db, `responses/${alertId}`);
      await set(alertRef, { ...alerts.find(a => a.id === alertId), ...updates });
    } catch (error) {
      console.error('Error updating alert:', error);
    }
  };

  const removeAlert = async (alertId) => {
    try {
      const alertRef = ref(db, `responses/${alertId}`);
      await set(alertRef, null); // Remove from database
    } catch (error) {
      console.error('Error removing alert:', error);
    }
  };

  const handleVerify = (alertId) => {
    updateAlertStatus(alertId, { isVerified: true });
  };

  const handlePriorityChange = (alertId, priority) => {
    updateAlertStatus(alertId, { priority });
  };

  const handleAlertClick = (alert) => {
    if (alert.latitude && alert.longitude && map) {
      // Set selected alert
      setSelectedAlertId(alert.id);
      
      // Zoom to alert location
      map.setCenter({ lat: alert.latitude, lng: alert.longitude });
      map.setZoom(16); // Higher zoom level for better visibility
      
      // Optional: Open popup for the marker (if the map API supports it)
      // You might need to store marker references to trigger popups
    }
  };

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md text-center">
          <div className="text-red-500 text-6xl mb-4">🚫</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
          <p className="text-gray-600">You need administrator privileges to access this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Alert Verification Map</h1>
              <p className="text-gray-600">Verify and manage emergency alerts</p>
            </div>
            <button
              onClick={() => router.push('/admin')}
              className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 transition-colors"
            >
              ← Back to Admin Panel
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Alerts List */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900">
                  Alerts ({alerts.length})
                </h2>
              </div>
              <div className="max-h-96 overflow-y-auto">
                {loading ? (
                  <div className="p-6 text-center text-gray-500">Loading alerts...</div>
                ) : alerts.length === 0 ? (
                  <div className="p-6 text-center text-gray-500">No alerts found</div>
                ) : (
                  alerts.map((alert) => (
                    <div 
                      key={alert.id} 
                      className={`p-4 border-b border-gray-200 last:border-b-0 cursor-pointer transition-all duration-200 ${
                        selectedAlertId === alert.id 
                          ? 'bg-blue-50 border-l-4 border-l-blue-500' 
                          : 'hover:bg-gray-50'
                      }`}
                      onClick={() => handleAlertClick(alert)}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center">
                          <div 
                            className="w-3 h-3 rounded-full mr-2 flex-shrink-0"
                            style={{
                              backgroundColor: !alert.isVerified ? '#6b7280' : 
                                alert.priority === 'high' ? '#dc2626' :
                                alert.priority === 'medium' ? '#f59e0b' : '#eab308'
                            }}
                          ></div>
                          <h3 className="font-medium text-gray-900 text-sm">{alert.problem}</h3>
                        </div>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          alert.isVerified ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
                        }`}>
                          {alert.isVerified ? '✅ Verified' : '⏳ Pending'}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-3">{alert.description}</p>
                      
                      <div className="space-y-2">
                        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                          <label className="text-xs text-gray-500">Priority:</label>
                          <select
                            value={alert.priority || 'low'}
                            onChange={(e) => handlePriorityChange(alert.id, e.target.value)}
                            className="text-xs border border-gray-300 rounded px-2 py-1"
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
                              className="flex-1 bg-green-600 text-white text-xs py-1 px-3 rounded hover:bg-green-700 transition-colors"
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
                            className="flex-1 bg-red-600 text-white text-xs py-1 px-3 rounded hover:bg-red-700 transition-colors"
                          >
                            🗑️ Remove
                          </button>
                        </div>
                        
                        <div className="text-xs text-gray-500">
                          <div><strong style={{ color: '#374151' }}>User:</strong> {alert.userName || 'Unknown'}</div>
                          <div><strong style={{ color: '#374151' }}>Time:</strong> {new Date(alert.timestamp).toLocaleString()}</div>
                          {alert.latitude && alert.longitude && (
                            <div><strong style={{ color: '#374151' }}>Location:</strong> {alert.latitude.toFixed(4)}, {alert.longitude.toFixed(4)}</div>
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
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900 mb-3">Alert Locations</h2>
                <div className="flex flex-wrap gap-4 text-xs">
                  <div className="flex items-center">
                    <div className="w-3 h-3 rounded-full bg-gray-500 mr-2"></div>
                    <span style={{ color: '#6b7280', fontWeight: 'bold' }}>Unverified</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-3 h-3 rounded-full bg-red-600 mr-2"></div>
                    <span style={{ color: '#dc2626', fontWeight: 'bold' }}>High Priority</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-3 h-3 rounded-full bg-orange-500 mr-2"></div>
                    <span style={{ color: '#f59e0b', fontWeight: 'bold' }}>Medium Priority</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-3 h-3 rounded-full bg-yellow-500 mr-2"></div>
                    <span style={{ color: '#eab308', fontWeight: 'bold' }}>Low Priority</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-3 h-3 rounded-full bg-blue-500 mr-2" style={{ boxShadow: '0 0 0 2px rgba(59, 130, 246, 0.3)' }}></div>
                    <span style={{ color: '#3b82f6', fontWeight: 'bold' }}>Selected</span>
                  </div>
                </div>
              </div>
              <div style={{ height: "500px", width: "100%", position: "relative" }}>
                {mapLoading ? (
                  <div className="flex items-center justify-center h-full bg-gray-100">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                      <p className="text-gray-600">Loading map...</p>
                    </div>
                  </div>
                ) : null}
                <div id="map" style={{ height: "100%", width: "100%" }}></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
