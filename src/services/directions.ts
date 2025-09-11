        // Store legs globally for Globe UI to read distance/duration
        // (Moved inside directionsTool function where 'legs' is defined)
// Directions tool: Get directions between two places using Google Maps APIs
// Usage: directionsTool({ origin, destination, travelMode })

export type DirectionsInput = {
  origin: string; // Place name or address
  destination: string; // Place name or address
  travelMode?: "DRIVING" | "WALKING" | "BICYCLING" | "TRANSIT";
};

export type DirectionsResult = {
  route: any; // Raw DirectionsResult from API
  overviewPolyline: string;
  legs: Array<{ start_address: string; end_address: string; distance: any; duration: any; steps: any[] }>;
};

export async function directionsTool({ origin, destination, travelMode = "DRIVING" }: DirectionsInput): Promise<DirectionsResult> {
  // Ensure Google Maps JS API is loaded
  if (!(window as any).google) throw new Error("Google Maps JS API not loaded");

  // Get place IDs for origin and destination
  function getPlaceId(query: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const service = new (window as any).google.maps.places.PlacesService(document.createElement("div"));
      service.textSearch({ query }, (results: any[], status: string) => {
        if (status === (window as any).google.maps.places.PlacesServiceStatus.OK && results[0]) {
          resolve(results[0].place_id);
        } else {
          reject(new Error("No results found for " + query));
        }
      });
    });
  }

  const originId = await getPlaceId(origin);
  const destinationId = await getPlaceId(destination);

  // Request directions
  return new Promise((resolve, reject) => {
    const directionsService = new (window as any).google.maps.DirectionsService();
    directionsService.route({
      origin: { placeId: originId },
      destination: { placeId: destinationId },
      travelMode,
    }, (result: any, status: string) => {
      if (status === "OK" && result.routes && result.routes[0]) {
        const route = result.routes[0];
        console.log('[directionsTool] route object:', route);
  const overviewPolyline = route.overview_polyline || undefined;
        const legs = route.legs;
        // Store legs globally for Globe UI to read distance/duration
        if (typeof window !== "undefined") {
          (window as any)._lastDirectionsLegs = legs;
        }
        // Use start location of first leg for lat/lng/address
        const startLoc = legs[0]?.start_location;
        const endLoc = legs[legs.length-1]?.end_location;
        const lat = startLoc?.lat();
        const lng = startLoc?.lng();
        const address = legs[0]?.start_address + " → " + legs[legs.length-1]?.end_address;
        const globeResult = { lat, lng, address, routePolyline: overviewPolyline };
        console.log('[directionsTool] Passing to handlePlaceSearchResult:', globeResult);
        if (typeof window !== "undefined" && typeof (window as any).handlePlaceSearchResult === "function") {
          (window as any).handlePlaceSearchResult(globeResult);
        }
        resolve({ route, overviewPolyline, legs });
      } else {
        reject(new Error("Directions request failed: " + status));
      }
    });
  });
}
