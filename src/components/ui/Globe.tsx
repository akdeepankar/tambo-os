import React, { useRef, useEffect, useState } from "react";


// Google Maps JS API loader (robust singleton)
const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY; // Replace with your API key
let googleMapsScriptLoading = false;
let googleMapsScriptLoaded = false;
let googleMapsScriptCallbacks: (() => void)[] = [];

function loadGoogleMapsScript(callback: () => void) {
  if (typeof window === "undefined") return;
  if ((window as any).google && googleMapsScriptLoaded) {
    callback();
    return;
  }
  googleMapsScriptCallbacks.push(callback);
  if (!googleMapsScriptLoading) {
    googleMapsScriptLoading = true;
    const script = document.createElement("script");
  script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places,geometry`;
    script.async = true;
    script.onload = () => {
      googleMapsScriptLoaded = true;
      googleMapsScriptLoading = false;
      googleMapsScriptCallbacks.forEach(cb => cb());
      googleMapsScriptCallbacks = [];
    };
    document.body.appendChild(script);
  }
}


interface GlobeProps {
  lat?: number;
  lng?: number;
  address?: string;
  routePolyline?: string;
}



const Globe: React.FC<GlobeProps> = ({ lat, lng, address, routePolyline }) => {
  console.log("[Globe] Rendered with props:", { lat, lng, address, routePolyline });
  const mapRef = useRef<HTMLDivElement>(null);
  // Always use props for location, just like music and Gemini
  const location = { lat, lng, address };

  useEffect(() => {
    console.log("[Globe] useEffect triggered with lat/lng:", lat, lng);
    loadGoogleMapsScript(() => {
      console.log("[Globe] useEffect: routePolyline:", routePolyline);
      if (mapRef.current) {
        // Clear previous map instance by resetting the container
        mapRef.current.innerHTML = "";
        const google = (window as any).google;
        let position = typeof lat === "number" && typeof lng === "number"
          ? { lat, lng }
          : { lat: 0, lng: 0 };
        let mapOptions = {
          center: position,
          zoom: typeof lat === "number" && typeof lng === "number" ? 8 : 2,
          mapTypeId: "roadmap",
        };
        // If routePolyline is present, decode and fit bounds
        let path = null;
        if (routePolyline && google.maps.geometry && google.maps.geometry.encoding) {
          path = google.maps.geometry.encoding.decodePath(routePolyline);
          console.log("[Globe] Decoded path:", path);
          if (path.length > 0) {
            const bounds = new google.maps.LatLngBounds();
            path.forEach((latLng: any) => bounds.extend(latLng));
            mapOptions.center = bounds.getCenter();
            mapOptions.zoom = 12; // Initial zoom, will fit bounds below
          }
        }
        const mapInstance = new google.maps.Map(mapRef.current, mapOptions);
        // If routePolyline, fit bounds
        if (path && path.length > 0) {
          const bounds = new google.maps.LatLngBounds();
          path.forEach((latLng: any) => bounds.extend(latLng));
          mapInstance.fitBounds(bounds);
        }
        // Remove previous outline if any
        if ((window as any)._globeOutline) {
          (window as any)._globeOutline.setMap(null);
        }
        // Remove previous route polyline if any
        if ((window as any)._globeRoute) {
          (window as any)._globeRoute.setMap(null);
        }
        // Draw a circle outline only if no routePolyline
        if (!routePolyline && typeof lat === "number" && typeof lng === "number") {
          console.log("[Globe] Drawing outline at:", position);
          const outline = new google.maps.Circle({
            strokeColor: "#4285F4",
            strokeOpacity: 0.8,
            strokeWeight: 2,
            fillColor: "#4285F4",
            fillOpacity: 0.1,
            map: mapInstance,
            center: position,
            radius: 20000, // 20km radius
          });
          (window as any)._globeOutline = outline;
        }
        // Draw route polyline if provided
        if (path && path.length > 0) {
          const polyline = new google.maps.Polyline({
            path,
            geodesic: true,
            strokeColor: "#4285F4",
            strokeOpacity: 1.0,
            strokeWeight: 5,
            map: mapInstance,
          });
          (window as any)._globeRoute = polyline;
        }
      }
    });
  }, [lat, lng, routePolyline]);

  // Use a key that changes with location to force React to remount the map div
  const mapKey = `${lat ?? ""}-${lng ?? ""}`;
  // Extract distance and duration if available (from routePolyline usage)
  let distance = "";
  let duration = "";
  if (routePolyline && address) {
    // Try to get from window._lastDirectionsLegs if set by directionsTool
    if (typeof window !== "undefined" && Array.isArray((window as any)._lastDirectionsLegs)) {
      const legs = (window as any)._lastDirectionsLegs;
      if (legs[0]) {
        distance = legs[0].distance?.text || "";
        duration = legs[0].duration?.text || "";
      }
    }
  }
  return (
    <div className="w-full h-[500px] flex flex-col items-center relative">
      {typeof lat === "number" && typeof lng === "number" && address && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-white/80 dark:bg-gray-900/80 px-4 py-2 rounded shadow text-lg font-semibold z-10 pointer-events-none">
          {address}
          {routePolyline && (distance || duration) && (
            <div className="mt-2 text-base font-normal text-blue-700 dark:text-blue-300">
              {distance && <span>Distance: {distance}</span>}
              {duration && <span className="ml-4">Estimated Time: {duration}</span>}
            </div>
          )}
        </div>
      )}
      <div key={mapKey} ref={mapRef} className="w-full h-full rounded shadow" />
    </div>
  );
};

export default Globe;
