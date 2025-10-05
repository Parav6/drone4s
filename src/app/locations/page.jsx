import Map from "@/components/Map";
import React from "react";

export default function LocationsPage() {
    return (
        <Map
            publishCurrentUser={true}
            followUser={true}
            zoom={15}
        />
    );
}