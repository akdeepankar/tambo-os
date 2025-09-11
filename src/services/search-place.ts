
// Client-side place search using Google Maps JS API
// Server-side: Uses Places API (Text Search) to return lat/lng for the first result
// Client-side place search using Google Maps JS API
export async function searchPlaceClient({ query }: { query: string }): Promise<{ lat: number; lng: number; address: string }> {
  return new Promise((resolve, reject) => {
    if (!(window as any).google) {
      reject(new Error("Google Maps JS API not loaded"));
      return;
    }
    const map = document.createElement("div");
    const service = new (window as any).google.maps.places.PlacesService(map);
    service.textSearch({ query }, (results: any[], status: string) => {
      if (status === (window as any).google.maps.places.PlacesServiceStatus.OK && results[0]) {
        const location = results[0].geometry.location;
        const result = {
          lat: location.lat(),
          lng: location.lng(),
          address: results[0].formatted_address
        };
        console.log('[searchPlaceClient] Result:', result);
        if (typeof window !== "undefined" && typeof (window as any).handlePlaceSearchResult === "function") {
          (window as any).handlePlaceSearchResult(result);
        }
        resolve(result);
      } else {
        reject(new Error("No results found"));
      }
    });
  });
}
