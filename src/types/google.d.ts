declare namespace google {
  export namespace maps {
    export class Map {
      constructor(mapDiv: HTMLElement, opts?: MapOptions);
      setCenter(latlng: LatLng | LatLngLiteral): void;
      setZoom(zoom: number): void;
      addListener(eventName: string, handler: Function): void;
    }

    export interface MapOptions {
      center?: LatLng | LatLngLiteral;
      zoom?: number;
    }

    export class LatLng {
      constructor(lat: number, lng: number);
      lat(): number;
      lng(): number;
    }

    export interface LatLngLiteral {
      lat: number;
      lng: number;
    }

    export class Marker {
      constructor(opts?: MarkerOptions);
      setMap(map: Map | null): void;
      getPosition(): LatLng | null;
    }

    export interface MarkerOptions {
      position?: LatLng | LatLngLiteral;
      map?: Map;
    }

    export class Circle {
      constructor(opts?: CircleOptions);
      setRadius(radius: number): void;
      setMap(map: Map | null): void;
    }

    export interface CircleOptions {
      center?: LatLng | LatLngLiteral;
      radius?: number;
      map?: Map;
      strokeColor?: string;
      strokeOpacity?: number;
      strokeWeight?: number;
      fillColor?: string;
      fillOpacity?: number;
    }

    export interface MapMouseEvent {
      latLng: LatLng;
    }
  }
}
