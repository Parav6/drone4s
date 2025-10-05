"use client"

import { useEffect, useMemo, useRef, useState } from "react";
import Map from "@/components/Map";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useFirebase } from "@/context/Firebase";
import { onValue, ref } from "firebase/database";
import polyline from "@mapbox/polyline";

const GuardDashboard = () => {
    const { user, database } = useFirebase();
    // const REST_API_KEY = process.env.NEXT_PUBLIC_MAP_MY_INDIA_REST_KEY || process.env.NEXT_PUBLIC_MAPPLS_REST_API_KEY || process.env.NEXT_PUBLIC_MAPMYINDIA_REST_KEY;
    // const REST_API_KEY = process.env.NEXT_PUBLIC_MAP_MY_INDIA_REST_KEY || process.env.NEXT_PUBLIC_MAPPLS_REST_API_KEY || process.env.NEXT_PUBLIC_MAPMYINDIA_REST_KEY;

    const [activeSOS, setActiveSOS] = useState(null); // {userId, guardAssigned, location, message}
    const [victimUserId, setVictimUserId] = useState(null);
    const [sosUserProfile, setSosUserProfile] = useState(null);
    const [victimLocation, setVictimLocation] = useState(null); // {lat,lng}
    const [guardLocation, setGuardLocation] = useState(null); // {lat,lng}
    const [mapReady, setMapReady] = useState(null);
    const [routePath, setRoutePath] = useState(null); // [{lat,lng}, ...]

    const polylineRef = useRef(null);

    // Listen to activeSOS entries and pick the one assigned to this guard
    useEffect(() => {
        if (!database || !user?.uid) return;
        const sosRootRef = ref(database, "activeSOS");
        const unsubscribe = onValue(sosRootRef, (snap) => {
            const data = snap.val() || {};
            let found = null;
            Object.keys(data).forEach((uid) => {
                const item = data[uid];
                if (item?.isActive && item?.guardAssigned?.guardId === user.uid) {
                    found = { ...item, userId: uid };
                }
            });
            setActiveSOS(found);
            setVictimUserId(found?.userId || null);
        });
        return () => unsubscribe();
    }, [database, user?.uid]);

    // When we have an active SOS, subscribe to user profile and locations (user + guard)
    useEffect(() => {
        if (!database) return;

        let unsubProfile = () => {};
        let unsubVictimLoc = () => {};
        let unsubGuardLoc = () => {};

        if (activeSOS?.userId) {
            unsubProfile = onValue(ref(database, `users/${activeSOS.userId}`), (s) => {
                setSosUserProfile(s.val() || null);
            });

            unsubVictimLoc = onValue(ref(database, `user_locations/${activeSOS.userId}`), (s) => {
                const v = s.val();
                if (v?.lat != null && v?.lng != null) setVictimLocation({ lat: parseFloat(v.lat), lng: parseFloat(v.lng) });
            });
        } else {
            setSosUserProfile(null);
            setVictimLocation(null);
        }

        if (user?.uid) {
            unsubGuardLoc = onValue(ref(database, `user_locations/${user.uid}`), (s) => {
                const v = s.val();
                if (v?.lat != null && v?.lng != null) setGuardLocation({ lat: parseFloat(v.lat), lng: parseFloat(v.lng) });
            });
        } else {
            setGuardLocation(null);
        }

        return () => {
            unsubProfile();
            unsubVictimLoc();
            unsubGuardLoc();
        };
    }, [database, activeSOS?.userId, user?.uid]);

    // Compose markers for Map component
    // const additionalMarkers = useMemo(() => {
    //     const markers = [];
    //     if (victimLocation && activeSOS?.userId) {
    //         markers.push({
    //             id: `victim_${activeSOS.userId}`,
    //             lat: victimLocation.lat,
    //             lng: victimLocation.lng,
    //             label: sosUserProfile?.displayName?.substring(0, 2)?.toUpperCase() || "VI",
    //             color: "#e11d48" // rose-600
    //         });
    //     }
    //     if (guardLocation && user?.uid) {
    //         markers.push({
    //             id: `guard_${user.uid}`,
    //             lat: guardLocation.lat,
    //             lng: guardLocation.lng,
    //             label: "GD",
    //             color: "#2563eb" // blue-600
    //         });
    //     }
    //     return markers;
    // }, [victimLocation, guardLocation, activeSOS?.userId, sosUserProfile?.displayName, user?.uid]);

    // Draw or update polyline: prefer decoded routePath; fallback to straight line
    useEffect(() => {
        if (!mapReady) return;
        if (!victimLocation || !guardLocation) {
            // remove any existing line
            try {
                if (polylineRef.current?.remove) polylineRef.current.remove();
                polylineRef.current = null;
            } catch {}
            return;
        }

        try {
            // Clear old line
            if (polylineRef.current?.remove) {
                polylineRef.current.remove();
            }
            const pathPoints = routePath && Array.isArray(routePath) && routePath.length > 1
                ? routePath
                : [guardLocation, victimLocation];

            // Try to create a polyline with Mappls SDK. Fallback safe try/catch.
            if (window?.mappls && window.mappls.Polyline) {
                polylineRef.current = new window.mappls.Polyline({
                    map: mapReady,
                    path: pathPoints,
                    strokeColor: "#10b981",
                    strokeOpacity: 0.9,
                    strokeWeight: 4
                });
            } else if (window?.mappls && mapReady?.drawPolyline) {
                // Some builds expose drawPolyline helper
                polylineRef.current = mapReady.drawPolyline({
                    path: pathPoints,
                    strokeColor: "#10b981",
                    strokeOpacity: 0.9,
                    strokeWeight: 4
                });
            }
        } catch (e) {
            console.warn("Polyline draw failed:", e);
        }
    }, [mapReady, victimLocation?.lat, victimLocation?.lng, guardLocation?.lat, guardLocation?.lng, routePath]);

    // When both coordinates are available, call Mappls Route Advanced API, log it, and decode to routePath
    useEffect(() => {
        const fetchRoute = async () => {
            // if ( !guardLocation || !victimLocation) return;
            try {
                // const start = { lat: guardLocation.lat, lon: guardLocation.lng };
                // const end = { lat: victimLocation.lat, lon: victimLocation.lng };
                const start ={lat:"29.86176", lon:" 77.89815"}
                const end = {lat:"29.86282", lon:"77.89826"}
                console.log(start,end)
                const url = `https://apis.mappls.com/advancedmaps/v1/f6cc67d011fd246c37345dbaac88f334/route_adv/driving/${start.lon},${start.lat};${end.lon},${end.lat}`;
                const res = await fetch(url);
                let data = null;
                try { data = await res.json();console.log(data) } catch {}
                console.log("[ROUTE_API] URL:", url);
                console.log("[ROUTE_API] status:", res.status, res.statusText);
                console.log("[ROUTE_API] data:", data || '<non-json>');
                try {
                    const route = data?.routes?.[0];
                    const encoded = route?.geometry;
                    if (encoded) {
                        const pairs = polyline.decode(encoded); // [[lat, lng], ...]
                        const path = pairs.map(([lat, lng]) => ({ lat, lng }));
                        setRoutePath(path);
                        console.log("[ROUTE_API] decoded path points:", path.length);
                    } else {
                        setRoutePath(null);
                    }
                } catch (ge) {
                    console.warn("[ROUTE_API] decode failed:", ge);
                    setRoutePath(null);
                }
            } catch (e) {
                console.error("[ROUTE_API] error:", e);
            }
        };
        setRoutePath(null);
        fetchRoute();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [victimLocation?.lat, victimLocation?.lng, guardLocation?.lat, guardLocation?.lng]);

    // Determine sensible center
    const center = useMemo(() => {
        if (victimLocation) return victimLocation;
        if (guardLocation) return guardLocation;
        return { lat: 28.6139, lng: 77.2090 }; // Delhi fallback
    }, [victimLocation, guardLocation]);

    return (
        <ProtectedRoute>
            <div style={{ width: "100%", height: "100vh", position: "relative", background: "#f9fafb" }}>
                <div style={{ position: "absolute", inset: 0 }}>
                    <Map
                        center={center}
                        zoom={16}
                        followUser={false}
                        publishCurrentUser={false}
                        trackUserIds={victimUserId ? [victimUserId] : []}
                        // additionalMarkers={additionalMarkers}
                        onMapReady={(map) => setMapReady(map)}
                    />
                </div>

                {/* SOS info card */}
                <div style={{ position: "absolute", top: 16, left: 16, zIndex: 1200 }}>
                    <div style={{ background: "white", padding: 12, borderRadius: 12, boxShadow: "0 8px 24px rgba(0,0,0,0.15)", minWidth: 260 }}>
                        <div style={{ fontWeight: 700, marginBottom: 6 }}>Active SOS</div>
                        {activeSOS ? (
                            <div style={{ fontSize: 13, color: "#111827" }}>
                                <div><strong>User:</strong> {sosUserProfile?.displayName || activeSOS.userEmail || activeSOS.userId}</div>
                                <div><strong>Message:</strong> {activeSOS.message || "Emergency SOS activated by user"}</div>
                                <div><strong>Assigned:</strong> {new Date(activeSOS?.guardAssigned?.assignedAt || activeSOS.startTime).toLocaleTimeString()}</div>
                                <div style={{ marginTop: 6, fontSize: 12, color: "#6b7280" }}>
                                    {victimLocation ? `Victim: ${victimLocation.lat.toFixed(5)}, ${victimLocation.lng.toFixed(5)}` : "Victim location: waiting..."}
                                    <br />
                                    {guardLocation ? `Guard: ${guardLocation.lat.toFixed(5)}, ${guardLocation.lng.toFixed(5)}` : "Guard location: waiting..."}
                                </div>
                            </div>
                        ) : (
                            <div style={{ fontSize: 13, color: "#6b7280" }}>No SOS assigned to you yet.</div>
                        )}
                    </div>
                </div>
            </div>
        </ProtectedRoute>
    );
};

export default GuardDashboard;