"use client";
import { useEffect, useState } from "react";
import { app } from "../../../context/Firebase";
import { getDatabase, ref, onValue, set } from "firebase/database";
import { useAuth } from "../../../hooks/useAuth";
import { useRouter } from "next/navigation";
import MapComponent from "@/components/MapComponent";

export default function AdminAlertMap() {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mapLoading, setMapLoading] = useState(true);
  const [selectedAlertId, setSelectedAlertId] = useState(null);
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
    setSelectedAlertId(alert.id);
  };

  const handleVerifyAlert = (alertId) => {
    updateAlertStatus(alertId, { isVerified: true });
  };

  const handleRemoveAlert = (alertId) => {
    removeAlert(alertId);
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
                      className={`p-4 border-b border-gray-200 last:border-b-0 cursor-pointer transition-all duration-200 ${selectedAlertId === alert.id
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
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${alert.isVerified ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
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
                <MapComponent
                  mapId="adminAlertMap"
                  alerts={alerts}
                  selectedAlertId={selectedAlertId}
                  onAlertClick={handleAlertClick}
                  isAdminMode={true}
                  onVerifyAlert={handleVerifyAlert}
                  onRemoveAlert={handleRemoveAlert}
                  onLoadingChange={setMapLoading}
                  height="500px"
                  width="100%"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
