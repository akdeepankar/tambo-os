
// Client-side place search using Google Maps JS API
// Server-side: Uses Places API (Text Search) to return lat/lng for the first result
// Client-side place search using Google Maps JS API
export function searchPlaceClient(query: string): Promise<{ lat: number; lng: number; address: string }> {
  return new Promise((resolve, reject) => {
    type GoogleWindow = Window & typeof globalThis & {
      google?: {
        maps: {
          places: {
            PlacesService: new (map: Element) => {
              textSearch: (
                request: { query: string },
                callback: (
                  results: Array<{ geometry: { location: { lat: () => number; lng: () => number }; }; formatted_address: string }>,
                  status: string
                ) => void
              ) => void;
            };
            PlacesServiceStatus: { OK: string };
          };
        };
      };
      handlePlaceSearchResult?: (result: { lat: number; lng: number; address: string }) => void;
    };
    const win = window as GoogleWindow;
    if (!win.google) {
      reject(new Error("Google Maps JS API not loaded"));
      return;
    }
    const map = document.createElement("div");
    const service = new win.google.maps.places.PlacesService(map);
    service.textSearch(
      { query },
      (
        results: google.maps.places.PlaceResult[] | null,
        status: google.maps.places.PlacesServiceStatus,
        pagination: google.maps.places.PlaceSearchPagination | null
      ) => {
        if (
          status === win.google.maps.places.PlacesServiceStatus.OK &&
          results &&
          results[0] &&
          results[0].geometry &&
          results[0].geometry.location &&
          typeof results[0].geometry.location.lat === "function" &&
          typeof results[0].geometry.location.lng === "function"
        ) {
          const location = results[0].geometry.location;
          const result = {
            lat: location.lat(),
            lng: location.lng(),
            address: results[0].formatted_address || ""
          };
          console.log('[searchPlaceClient] Result:', result);
          if (typeof window !== "undefined" && typeof win.handlePlaceSearchResult === "function") {
            win.handlePlaceSearchResult(result);
          }
          resolve(result);
        } else {
          reject(new Error("No results found"));
        }
      }
    );
  });
}
