export type Marker = {
  id: string;
  lat: number;
  lon: number;
  label?: string;
  imageUrl?: string;
};
export type CesiumGlobeProps = { markers?: Marker[]; className: string };
