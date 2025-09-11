// Tool to show directions between two places using Google Maps Directions API (client-side)
export async function getDirectionsClient({ origin, destination }: { origin: string; destination: string }): Promise<{ route: any; origin: string; destination: string }> {
  return new Promise((resolve, reject) => {
    if (!(window as any).google) {
      reject(new Error("Google Maps JS API not loaded"));
      return;
    }
    const map = document.createElement("div");
    const directionsService = new (window as any).google.maps.DirectionsService();
    directionsService.route({
      origin,
      destination,
      travelMode: (window as any).google.maps.TravelMode.DRIVING,
    }, (result: any, status: string) => {
      if (status === (window as any).google.maps.DirectionsStatus.OK) {
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
  route: any;
  origin: string;
  destination: string;
};
