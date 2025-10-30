// Tool to show directions between two places using Google Maps Directions API (client-side)
export async function getDirectionsClient({ origin, destination }: { origin: string; destination: string }): Promise<{ route: google.maps.DirectionsResult; origin: string; destination: string }> {
  return new Promise((resolve, reject) => {
    type GoogleWindow = Window & typeof globalThis & {
      google?: typeof google;
    };
    const win = window as GoogleWindow;
    if (!win.google) {
      reject(new Error("Google Maps JS API not loaded"));
      return;
    }
    const directionsService = new win.google.maps.DirectionsService();
    directionsService.route({
      origin,
      destination,
      travelMode: win.google.maps.TravelMode.DRIVING,
    }, (result: google.maps.DirectionsResult | null, status: google.maps.DirectionsStatus) => {
      if (status === win.google.maps.DirectionsStatus.OK && result) {
        resolve({ route: result, origin, destination });
      } else {
        reject(new Error("No route found"));
      }
    });
  });
}

export type DirectionsInput = {
  origin: string;
  destination: string;
};

export type DirectionsResult = {
  route: google.maps.DirectionsResult;
  origin: string;
  destination: string;
};
