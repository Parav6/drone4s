"use client";
import React, { useEffect, useMemo, useRef, useState } from "react";
import Map from "@/components/Map";
import { useFirebase } from "@/context/Firebase";
import { ref, onValue } from "firebase/database";

 export default function ParkingPage() {
     const { database } = useFirebase();
     const [places, setPlaces] = useState(null);
     const mapRef = useRef(null);
     const customMarkersRef = useRef({});
     const [selectedPlace, setSelectedPlace] = useState(null);

     useEffect(() => {
         if (!database) return;

         const placesRef = ref(database, "parking_places");
         const unsubscribe = onValue(placesRef, (snapshot) => {
             const data = snapshot.val() || null;
                console.log("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!")
                console.log("data",data)
             setPlaces(data);
         }, (err) => {
             console.error("Failed to read parking_places:", err);
             setPlaces(null);
         });

         return () => unsubscribe();
     }, [database]);

     const markers = useMemo(() => {
        if (!places) return [];
        return Object.entries(places).map(([id, p]) => {
            const slots = p?.slots || {};
            let freeCount = 0;
            Object.values(slots).forEach((s) => {
                if (s && s.status === "free") freeCount += 1;
            });

            const lat = parseFloat(p?.latitude);
            const lng = parseFloat(p?.longitude);

            const name = p?.name || "Parking";
             const popupHtml = `
                 <div style="min-width:160px;font-family:system-ui,Arial,sans-serif">
                   <div style="font-weight:600;margin-bottom:4px">${name}</div>
                   <div style="font-size:12px;color:#374151">Free slots: <span style="font-weight:600">${freeCount}</span></div>
                 </div>
             `;

            return {
                id,
                lat,
                lng,
                label: name?.substring(0, 2)?.toUpperCase() || "P",
                color: "#2563eb",
                 popupHtml,
                 name,
                 freeCount
            };
        });
    }, [places]);

    // Manage custom Mappls markers with popups without changing Map.jsx
    useEffect(() => {
        const map = mapRef.current;
        if (!map || !window.mappls) return;

        const current = customMarkersRef.current;
        const nextIds = new Set(markers.map(m => m.id));

        // Remove markers that no longer exist
        Object.keys(current).forEach((id) => {
            if (!nextIds.has(id)) {
                try { current[id]?.remove && current[id].remove(); } catch {}
                delete current[id];
            }
        });

        // Add/update markers
        markers.forEach((m) => {
            if (m.lat == null || m.lng == null || Number.isNaN(m.lat) || Number.isNaN(m.lng)) return;
            const pos = { lat: m.lat, lng: m.lng };

            const bindPopupFallback = (marker) => {
                try {
                    if (typeof marker.bindPopup === 'function') {
                        marker.bindPopup(m.popupHtml);
                        return;
                    }
                    if (window.mappls && window.mappls.Popup) {
                        const openPopup = () => {
                            try {
                                const popup = new window.mappls.Popup({ position: pos, content: m.popupHtml });
                                if (typeof popup.addTo === 'function') popup.addTo(map);
                                else if (typeof map.addPopup === 'function') map.addPopup(popup);
                            } catch {}
                        };
                        const handleClick = () => {
                            setSelectedPlace({ id: m.id, name: m.name, freeCount: m.freeCount });
                            openPopup();
                        };
                        if (typeof marker.addListener === 'function') marker.addListener('click', handleClick);
                        else if (typeof marker.on === 'function') marker.on('click', handleClick);
                        else if (typeof marker.addEventListener === 'function') marker.addEventListener('click', handleClick);
                    } else {
                        const handleClick = () => {
                            setSelectedPlace({ id: m.id, name: m.name, freeCount: m.freeCount });
                        };
                        if (typeof marker.addListener === 'function') marker.addListener('click', handleClick);
                        else if (typeof marker.on === 'function') marker.on('click', handleClick);
                        else if (typeof marker.addEventListener === 'function') marker.addEventListener('click', handleClick);
                    }
                } catch {}
            };

            if (current[m.id]) {
                const mk = current[m.id];
                try {
                    if (typeof mk.setPosition === 'function') mk.setPosition(pos);
                    else if (typeof mk.setLatLng === 'function') mk.setLatLng(pos);
                } catch {}
                try {
                    if (typeof mk.setPopupContent === 'function') mk.setPopupContent(m.popupHtml);
                    else bindPopupFallback(mk);
                } catch {}
            } else {
                try {
                    const mk = new window.mappls.Marker({ position: pos, map });
                    current[m.id] = mk;
                    bindPopupFallback(mk);
                } catch (e) {
                    console.warn('Failed to create parking marker', e);
                }
            }
        });
    }, [markers]);

    const handleMapReady = (map) => {
        mapRef.current = map;
    };
     return (
         <div style={{ width: "100%", height: "100%" }}>
             <Map
                 zoom={17}
                 followUser={true}
                additionalMarkers={[]}
                 publishCurrentUser={true}
                onMapReady={handleMapReady}
             />
            {selectedPlace && (
                <div style={{ position: 'absolute', top: 16, right: 16, zIndex: 2000, background: 'rgba(31,41,55,0.95)', color: '#fff', padding: 12, borderRadius: 8, fontFamily: 'system-ui, Arial, sans-serif', boxShadow: '0 8px 24px rgba(0,0,0,0.35)' }}>
                     <div style={{ fontWeight: 700, marginBottom: 4 }}>{selectedPlace.name}</div>
                     <div style={{ fontSize: 13 }}>Free slots: <span style={{ fontWeight: 700 }}>{selectedPlace.freeCount || '-'}</span></div>
                     <button onClick={() => setSelectedPlace(null)} style={{ marginTop: 8, background: '#374151', color: '#fff', border: '1px solid #4b5563', padding: '4px 8px', fontSize: 12, borderRadius: 6, cursor: 'pointer' }}>
                         Close
                     </button>
                 </div>
             )}
         </div>
     );
}


