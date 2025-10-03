"use client";
import { useEffect, useState, useRef } from "react";
import {app} from "../../../context/Firebase";
import { getDatabase, ref, set, push } from "firebase/database";
import { useAuth } from "../../../hooks/useAuth";

export default function HomePage() {
  const [showForm, setShowForm] = useState(false);
  const [problem, setProblem] = useState("");
  const [description, setDescription] = useState("");
  const [currentLocation, setCurrentLocation] = useState(null);
  const [locationError, setLocationError] = useState(null);
  
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const watchIdRef = useRef(null);
  const { user } = useAuth();
  const db = getDatabase(app);

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
                  popupHtml: `<b style="color:red">Your live location</b><br/>${user?.displayName || 'User'}`,
                });
                markerRef.current = marker;
                map.setCenter(location);
                map.setZoom(15);
              } else {
                // Update existing marker position
                markerRef.current.setPosition(location);
                markerRef.current.setPopupHtml(
                  `<b style="color:red">Your live location</b><br/>${user?.displayName || 'User'}<br/>Updated: ${new Date().toLocaleTimeString()}`
                );
              }
            },
            (error) => {
              console.error('Location tracking error:', error);
              let errorMessage = 'Error tracking location: ';
              switch(error.code) {
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


  const handleSubmit = async(e) => {
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
      responseData.latitude=  currentLocation.lat
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
          right: "16px",
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
        <div
          style={{
            position: "absolute",
            top: "60px",
            right: "16px",
            background: "rgba(0, 0, 0, 0.95)",
            color: "#ffffff",
            padding: "24px",
            borderRadius: "12px",
            boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
            zIndex: 20,
            width: "300px",
            border: "2px solid #2563eb",
          }}
        >
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
      )}
      <div id="map" style={{ height: "100%", width: "100%" }}></div>
    </div>
  );
}