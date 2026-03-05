export interface MapMarker {
  id: number;
  name: string;
  thumbnail: string | null;
  priceRange: {
    highestPrice: number;
    lowestPrice: number;
  };
  lat: number;
  lng: number;
}

// export const DEFAULT_COORDS: [number, number] = [124.6095, 11.0008519];
export const DEFAULT_COORDS: [number, number] = [
  124.60639339562566, 11.005526867075663,
];
