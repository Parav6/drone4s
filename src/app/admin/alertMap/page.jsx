"use client";
import { useEffect, useState, useRef } from "react";
import { app } from "../../../context/Firebase";
import { getDatabase, ref, set, push, onValue } from "firebase/database";
import { useAuth } from "../../../hooks/useAuth";

export default function HomePage() {
  const [showForm, setShowForm] = useState(false);
  const [problem, setProblem] = useState("");
  const [description, setDescription] = useState("");
  const [currentLocation, setCurrentLocation] = useState(null);
  const [locationError, setLocationError] = useState(null);
  const [verifiedAlerts, setVerifiedAlerts] = useState([]);

  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const watchIdRef = useRef(null);
  const alertMarkersRef = useRef({});
  const { user } = useAuth();
  const db = getDatabase(app);

  // Load verified alerts from Firebase
  useEffect(() => {
    const alertsRef = ref(db, 'responses');
    const unsubscribe = onValue(alertsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const alertsList = Object.entries(data)
          .map(([key, value]) => ({
            id: key,
            ...value
          }))
          .filter(alert => alert.isVerified === true); // Only verified alerts
        setVerifiedAlerts(alertsList);
      }
    });

    return () => unsubscribe();
  }, [db]);

  // Initialize map and get initial location
  useEffect(() => {
    const script = document.createElement("script");
    script.src = `https://apis.mappls.com/advancedmaps/api/f6cc67d011fd246c37345dbaac88f334/map_sdk?layer=vector&v=3.0`;
    script.async = true;
    script.onload = () => {
      if (window.mappls) {
        const map = new window.mappls.Map("map", {});
        mapRef.current = map;

        if (navigator.geolocation) {
          // Start automatic location tracking
          const options = {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0
          };

          watchIdRef.current = navigator.geolocation.watchPosition(
            (position) => {
              const { latitude, longitude } = position.coords;
              const location = { lat: latitude, lng: longitude };

              setCurrentLocation(location);
              setLocationError(null);

              // Create or update marker
              if (!markerRef.current) {
                const marker = new window.mappls.Marker({
                  map: map,
                  position: location,
                  popupHtml: `<div style="padding: 8px; background: #ffffff; border-radius: 6px; box-shadow: 0 2px 8px rgba(0,0,0,0.15);"><b style="color: #2563eb; font-size: 14px;">📍 Your Live Location</b><br/><span style="color: #374151; font-size: 12px;">${user?.displayName || 'User'}</span></div>`,
                });
                markerRef.current = marker;
                map.setCenter(location);
                map.setZoom(15);
              } else {
                // Update existing marker position
                markerRef.current.setPosition(location);
                markerRef.current.setPopupHtml(
                  `<div style="padding: 8px; background: #ffffff; border-radius: 6px; box-shadow: 0 2px 8px rgba(0,0,0,0.15);"><b style="color: #2563eb; font-size: 14px;">📍 Your Live Location</b><br/><span style="color: #374151; font-size: 12px;">${user?.displayName || 'User'}</span><br/><span style="color: #6b7280; font-size: 11px;">Updated: ${new Date().toLocaleTimeString()}</span></div>`
                );
              }
            },
            (error) => {
              console.error('Location tracking error:', error);
              let errorMessage = 'Error tracking location: ';
              switch (error.code) {
                case error.PERMISSION_DENIED:
                  errorMessage += 'Permission denied. Please allow location access.';
                  break;
                case error.POSITION_UNAVAILABLE:
                  errorMessage += 'Location information unavailable.';
                  break;
                case error.TIMEOUT:
                  errorMessage += 'Location request timed out.';
                  break;
                default:
                  errorMessage += 'Unknown error occurred.';
                  break;
              }
              setLocationError(errorMessage);
            },
            options
          );
        }

        map.on("dragend", () => {
          const bounds = map.getBounds();
          const maxBounds = map.getMaxBounds();
          if (!maxBounds.contains(bounds.getCenter())) {
            map.panInsideBounds(maxBounds, { animate: true });
          }
        });
      }
    };
    document.body.appendChild(script);
    return () => {
      document.body.removeChild(script);
      // Clean up location watching
      if (watchIdRef.current) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, [user]);

  // Function to create alert markers
  const createAlertMarkers = (map, alerts) => {
    // Clear existing alert markers
    Object.values(alertMarkersRef.current).forEach(marker => {
      if (marker && marker.remove) {
        marker.remove();
      }
    });
    alertMarkersRef.current = {};

    // Create new markers for verified alerts
    alerts.forEach((alert) => {
      if (alert.latitude && alert.longitude) {
        // Determine marker color based on priority
        let markerColor;
        let markerIcon;

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

        const alertMarker = new window.mappls.Marker({
          map: map,
          position: { lat: alert.latitude, lng: alert.longitude },
          popupHtml: `
            <div style="padding: 12px; min-width: 250px; background: #ffffff; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.15);">
              <div style="margin-bottom: 8px;">
                <div style="font-size: 0.75rem; color: #6b7280; margin-bottom: 4px;">
                  ${new Date(alert.timestamp).toLocaleString()}
                </div>
                <h4 style="margin: 0; color: #1f2937; font-size: 1rem; font-weight: bold;">${alert.problem}</h4>
              </div>
              <p style="margin: 0; font-size: 0.875rem; color: #374151; line-height: 1.4;">${alert.description}</p>
            </div>
          `,
          icon: markerIcon
        });

        // Store marker reference
        alertMarkersRef.current[alert.id] = alertMarker;
      }
    });
  };

  // Update alert markers when verified alerts change
  useEffect(() => {
    if (mapRef.current && verifiedAlerts.length >= 0) {
      createAlertMarkers(mapRef.current, verifiedAlerts);
    }
  }, [verifiedAlerts]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const responseData = {
        problem,
        description,
        timestamp: Date.now(),
      };

      // Add location data if available
      if (currentLocation) {
        // responseData.location = {
        //   latitude: currentLocation.lat,
        //   longitude: currentLocation.lng
        // };
        responseData.latitude = currentLocation.lat
        responseData.longitude = currentLocation.lng
      }

      // Add user information if available
      if (user) {
        responseData.userId = user.uid;
        responseData.userName = user.displayName || user.email;
      }

      responseData.isVerified = false;
      responseData.priority = "low";

      console.log((responseData))

      await push(ref(db, "responses"), responseData);

      setShowForm(false);
      setProblem("");
      setDescription("");
      alert("Response submitted!");
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <div style={{ height: "100vh", width: "100%", position: "relative" }}>
      {/* Location Display */}
      {currentLocation && (
        <div
          style={{
            position: "absolute",
            top: "16px",
            left: "16px",
            background: "rgba(0, 0, 0, 0.85)",
            color: "#ffffff",
            padding: "12px 16px",
            borderRadius: "8px",
            fontSize: "0.875rem",
            boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
            maxWidth: "220px",
            zIndex: 10,
            border: "2px solid #2563eb",
          }}
        >
          <div style={{ color: "#60a5fa", fontWeight: "bold", marginBottom: "4px" }}>📍 Your Location:</div>
          <div style={{ color: "#ffffff", marginBottom: "2px" }}>Lat: {currentLocation.lat.toFixed(6)}</div>
          <div style={{ color: "#ffffff", marginBottom: "4px" }}>Lng: {currentLocation.lng.toFixed(6)}</div>
          <div style={{ color: "#22c55e", fontWeight: "bold" }}>🟢 Live Tracking Active</div>
        </div>
      )}

      {/* Alert Legend */}
      <div
        style={{
          position: "absolute",
          top: "16px",
          right: "16px",
          background: "rgba(0, 0, 0, 0.85)",
          color: "#ffffff",
          padding: "12px 16px",
          borderRadius: "8px",
          fontSize: "0.75rem",
          boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
          maxWidth: "180px",
          zIndex: 10,
          border: "2px solid #2563eb",
        }}
      >
        <div style={{ color: "#60a5fa", fontWeight: "bold", marginBottom: "8px" }}>🚨 Alert Priorities:</div>
        <div style={{ display: "flex", alignItems: "center", marginBottom: "4px" }}>
          <div style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: "#dc2626", marginRight: "6px" }}></div>
          <span style={{ color: "#ffffff" }}>High Priority</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", marginBottom: "4px" }}>
          <div style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: "#f59e0b", marginRight: "6px" }}></div>
          <span style={{ color: "#ffffff" }}>Medium Priority</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", marginBottom: "4px" }}>
          <div style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: "#eab308", marginRight: "6px" }}></div>
          <span style={{ color: "#ffffff" }}>Low Priority</span>
        </div>
        <div style={{ color: "#22c55e", fontWeight: "bold", marginTop: "8px", fontSize: "0.7rem" }}>
          ✅ Verified Alerts Only
        </div>
      </div>

      {locationError && (
        <div
          style={{
            position: "absolute",
            top: "16px",
            left: "16px",
            background: "rgba(220, 38, 38, 0.95)",
            border: "2px solid #dc2626",
            color: "#ffffff",
            padding: "12px 16px",
            borderRadius: "8px",
            fontSize: "0.875rem",
            fontWeight: "bold",
            maxWidth: "280px",
            zIndex: 10,
            boxShadow: "0 4px 12px rgba(220,38,38,0.3)",
          }}
        >
          ⚠️ {locationError}
        </div>
      )}

      <button
        style={{
          position: "absolute",
          top: "16px",
          right: "220px",
          padding: "6px 12px",
          fontSize: "0.875rem",
          background: "#2563eb",
          color: "#fff",
          border: "none",
          borderRadius: "6px",
          cursor: "pointer",
          zIndex: 10,
        }}
        onClick={() => setShowForm(true)}
      >
        Submit Response
      </button>
      {showForm && (
        <>
          <style jsx>{`
            .form-container {
              position: absolute;
              top: 60px;
              right: 220px;
              background: rgba(0, 0, 0, 0.95);
              color: #ffffff;
              padding: 24px;
              border-radius: 12px;
              box-shadow: 0 8px 24px rgba(0,0,0,0.4);
              z-index: 20;
              width: 300px;
              max-width: 400px;
              border: 2px solid #2563eb;
            }
            
            @media (max-width: 768px) {
              .form-container {
                right: 16px !important;
                left: 16px !important;
                width: calc(100vw - 32px) !important;
                max-width: calc(100vw - 32px) !important;
              }
            }
          `}</style>
          <div className="form-container">
            <h3 style={{ color: "#60a5fa", margin: "0 0 16px 0", fontSize: "1.1rem" }}>Submit Response</h3>
            <form onSubmit={handleSubmit}>
              <label style={{ color: "#ffffff", fontWeight: "bold", display: "block", marginBottom: "8px" }}>
                Problem:
                <input
                  type="text"
                  value={problem}
                  onChange={(e) => setProblem(e.target.value)}
                  required
                  placeholder="Describe the problem..."
                  style={{
                    width: "100%",
                    margin: "8px 0 16px 0",
                    padding: "10px",
                    borderRadius: "6px",
                    border: "2px solid #374151",
                    backgroundColor: "#1f2937",
                    color: "#ffffff",
                    fontSize: "0.875rem",
                  }}
                />
              </label>
              <label style={{ color: "#ffffff", fontWeight: "bold", display: "block", marginBottom: "8px" }}>
                Description:
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                  placeholder="Provide more details..."
                  rows={3}
                  style={{
                    width: "100%",
                    margin: "8px 0 16px 0",
                    padding: "10px",
                    borderRadius: "6px",
                    border: "2px solid #374151",
                    backgroundColor: "#1f2937",
                    color: "#ffffff",
                    fontSize: "0.875rem",
                    resize: "vertical",
                  }}
                />
              </label>
              <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "16px" }}>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  style={{
                    background: "#6b7280",
                    color: "#ffffff",
                    border: "2px solid #6b7280",
                    borderRadius: "6px",
                    padding: "10px 16px",
                    cursor: "pointer",
                    fontWeight: "bold",
                    fontSize: "0.875rem",
                    transition: "all 0.2s ease",
                  }}
                  onMouseOver={(e) => {
                    e.target.style.background = "#9ca3af";
                    e.target.style.borderColor = "#9ca3af";
                  }}
                  onMouseOut={(e) => {
                    e.target.style.background = "#6b7280";
                    e.target.style.borderColor = "#6b7280";
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    background: "#2563eb",
                    color: "#ffffff",
                    border: "2px solid #2563eb",
                    borderRadius: "6px",
                    padding: "10px 16px",
                    cursor: "pointer",
                    fontWeight: "bold",
                    fontSize: "0.875rem",
                    transition: "all 0.2s ease",
                  }}
                  onMouseOver={(e) => {
                    e.target.style.background = "#1d4ed8";
                    e.target.style.borderColor = "#1d4ed8";
                  }}
                  onMouseOut={(e) => {
                    e.target.style.background = "#2563eb";
                    e.target.style.borderColor = "#2563eb";
                  }}
                >
                  Submit
                </button>
              </div>
            </form>
          </div>
        </>
      )}
      <div id="map" style={{ height: "100%", width: "100%" }}></div>
    </div>
  );
}