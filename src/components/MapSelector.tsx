import React, { useState, useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

interface MapSelectorProps {
  onLocationSelected: (
    location: { lat: number; lng: number },
    radius: number
  ) => void;
  onClose: () => void;
}

export const MapSelector: React.FC<MapSelectorProps> = ({
  onLocationSelected,
  onClose,
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<L.Map | null>(null);
  const [marker, setMarker] = useState<L.Marker | null>(null);
  const [circle, setCircle] = useState<L.Circle | null>(null);
  const [radius, setRadius] = useState<number>(1000);
  const [isLoading, setIsLoading] = useState(true);

  console.log("MapSelector rendering");

  // Initialize map
  useEffect(() => {
    console.log("MapSelector useEffect triggered");
    console.log("mapRef.current:", mapRef.current);
    console.log("map state:", map);

    // Only initialize if we don't have a map yet
    if (!mapRef.current || map) {
      console.log("Skipping map initialization - already exists or no ref");
      return;
    }

    try {
      console.log("Getting user location");
      navigator.geolocation.getCurrentPosition(
        (position) => {
          console.log("User location:", position.coords);
          const { latitude, longitude } = position.coords;

          console.log("Initializing new Leaflet map at user location");
          const newMap = L.map(mapRef.current!).setView(
            [latitude, longitude],
            13
          );
          console.log("Map instance created:", newMap);

          console.log("Adding tile layer");
          const tileLayer = L.tileLayer(
            "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
            {
              attribution: "© OpenStreetMap contributors",
            }
          );

          console.log("Adding tile layer to map");
          tileLayer.addTo(newMap);

          console.log("Setting map in state");
          setMap(newMap);
          setIsLoading(false);
        },
        (error) => {
          console.error("Error getting location:", error);
          // Fallback to default location if geolocation fails
          console.log("Falling back to default location");
          const newMap = L.map(mapRef.current!).setView(
            [-23.5505, -46.6333],
            13
          );

          const tileLayer = L.tileLayer(
            "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
            {
              attribution: "© OpenStreetMap contributors",
            }
          );
          tileLayer.addTo(newMap);

          setMap(newMap);
          setIsLoading(false);
        }
      );
    } catch (error) {
      console.error("Error initializing map:", error);
      setIsLoading(false);
    }
  }, []); // Empty dependency array

  // Handle click events
  useEffect(() => {
    if (!map) return;

    console.log("Setting up click handler");
    const clickHandler = (e: L.LeafletMouseEvent) => {
      console.log("Map clicked at:", e.latlng);
      if (marker) {
        console.log("Removing existing marker");
        marker.remove();
      }
      if (circle) {
        console.log("Removing existing circle");
        circle.remove();
      }

      console.log("Creating new marker");
      const newMarker = L.marker(e.latlng, { draggable: true }).addTo(map);
      console.log("Creating new circle");
      const newCircle = L.circle(e.latlng, {
        radius,
        color: "red",
        fillColor: "#f03",
        fillOpacity: 0.2,
      }).addTo(map);

      setMarker(newMarker);
      setCircle(newCircle);
    };

    map.on("click", clickHandler);

    return () => {
      map.off("click", clickHandler);
    };
  }, [map, radius]); // Dependencies: map and radius

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (map) {
        console.log("Cleanup: removing map");
        map.remove();
      }
    };
  }, [map]);

  const handleRadiusChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    console.log("Radius changed:", event.target.value);
    const newRadius = Number(event.target.value);
    setRadius(newRadius);
    if (circle) {
      console.log("Updating circle radius");
      circle.setRadius(newRadius);
    }
  };

  const handleConfirm = () => {
    console.log("Confirm clicked");
    if (marker) {
      const location = marker.getLatLng();
      console.log("Selected location:", location);
      onLocationSelected({ lat: location.lat, lng: location.lng }, radius);
      onClose();
    } else {
      console.log("No location selected");
      alert("Please select a location on the map.");
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
      <div
        className="bg-white rounded-lg shadow-lg p-4 w-[800px]"
        role="dialog"
        aria-labelledby="map-dialog-title"
      >
        <h2 id="map-dialog-title" className="sr-only">
          Select Location
        </h2>
        <div
          ref={mapRef}
          id="map-container"
          aria-label="Map for selecting location"
          role="application"
          className="w-full h-[600px] mb-4"
          style={{
            position: "relative",
            backgroundColor: "#f0f0f0",
            minHeight: "600px",
          }}
        />
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div
              className="animate-spin rounded-full h-10 w-10 border-b-2 border-gray-900"
              role="progressbar"
              aria-label="Loading map"
            />
          </div>
        ) : (
          <div className="flex flex-col h-full">
            <div className="flex items-center gap-4 p-2 bg-gray-100 rounded">
              <label htmlFor="radius-slider" className="flex-shrink-0">
                Radius (meters):
              </label>
              <input
                type="range"
                id="radius-slider"
                name="radius"
                min="100"
                max="5000"
                step="100"
                value={radius}
                onChange={handleRadiusChange}
                className="flex-grow"
                aria-valuemin={100}
                aria-valuemax={5000}
                aria-valuenow={radius}
              />
              <span className="w-20 text-right" aria-live="polite">
                {radius}m
              </span>
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm rounded-md bg-gray-300 hover:bg-gray-400 transition-colors"
                aria-label="Cancel location selection"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                className="px-4 py-2 text-sm rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                aria-label="Confirm selected location"
              >
                Confirm Location
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
