'use client';

import { useEffect, useState } from "react";
import dynamic from 'next/dynamic';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

// Dynamically import map components with no SSR
const MapContainer = dynamic(() => import("react-leaflet").then(mod => mod.MapContainer), { 
  ssr: false,
  loading: () => (
    <div className="h-96 bg-gray-100 rounded-lg flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
        <p className="mt-2 text-sm text-gray-600">Loading map...</p>
      </div>
    </div>
  )
});

const TileLayer = dynamic(() => import("react-leaflet").then(mod => mod.TileLayer), { ssr: false });
const Marker = dynamic(() => import("react-leaflet").then(mod => mod.Marker), { ssr: false });
const Popup = dynamic(() => import("react-leaflet").then(mod => mod.Popup), { ssr: false });

interface EnvironmentalData {
  timestamp: Date;
  airQuality: {
    aqi: number;
    level: string;
  };
  waterQuality: {
    ph: number;
    level: string;
  };
  noiseLevel: {
    db: number;
    level: string;
  };
  location: {
    lat: number;
    lng: number;
    name: string;
  };
}

interface MapContainerProps {
  currentData: EnvironmentalData | null;
}

export default function MapContainerComponent({ currentData }: MapContainerProps) {
  const [isMapReady, setIsMapReady] = useState(false);
  
  useEffect(() => {
    // Import Leaflet CSS on client side only
    import("leaflet/dist/leaflet.css");
    setIsMapReady(true);
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Environmental Monitoring Map</CardTitle>
        <CardDescription>
          Real-time sensor locations and environmental data
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-96 rounded-lg overflow-hidden">
          <MapContainer
            center={[currentData?.location.lat || 40.7128, currentData?.location.lng || -74.0060]}
            zoom={13}
            style={{ height: "100%", width: "100%" }}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {currentData && (
              <Marker position={[currentData.location.lat, currentData.location.lng]}>
                <Popup>
                  <div className="text-sm">
                    <p><strong>Location:</strong> {currentData.location.name}</p>
                    <p><strong>AQI:</strong> {currentData.airQuality.aqi}</p>
                    <p><strong>pH:</strong> {currentData.waterQuality.ph}</p>
                    <p><strong>Noise:</strong> {currentData.noiseLevel.db} dB</p>
                    <p><strong>Updated:</strong> {new Date(currentData.timestamp).toLocaleString()}</p>
                  </div>
                </Popup>
              </Marker>
            )}
          </MapContainer>
        </div>
      </CardContent>
    </Card>
  );
}