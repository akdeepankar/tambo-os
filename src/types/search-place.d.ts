export interface SearchPlaceResult {
  lat: number;
  lng: number;
  address: string;
}

export interface SearchPlaceInput {
  query: string;
}
