'use client';

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// Dynamic imports for Leaflet components with SSR disabled
const MapContainer = dynamic(
  () => import("react-leaflet").then(mod => mod.MapContainer),
  { ssr: false }
);
const TileLayer = dynamic(
  () => import("react-leaflet").then(mod => mod.TileLayer),
  { ssr: false }
);
const CircleMarker = dynamic(
  () => import("react-leaflet").then(mod => mod.CircleMarker),
  { ssr: false }
);
const Popup = dynamic(
  () => import("react-leaflet").then(mod => mod.Popup),
  { ssr: false }
);

interface Sensor {
  id: string;
  name: string;
  type: 'air' | 'water' | 'noise' | 'weather';
  location: {
    lat: number;
    lng: number;
    name: string;
    address: string;
  };
  status: 'online' | 'offline' | 'maintenance' | 'error';
  lastUpdate: Date;
  battery: number;
  signal: number;
}

interface SensorNetworkMapProps {
  sensors: Sensor[];
  selectedSensor: Sensor | null;
  onSensorSelect: (sensor: Sensor) => void;
  mapCenter: [number, number];
}

export default function SensorNetworkMap({ 
  sensors, 
  selectedSensor, 
  onSensorSelect, 
  mapCenter 
}: SensorNetworkMapProps) {
  const [isMapReady, setIsMapReady] = useState(false);

  useEffect(() => {
    setIsMapReady(true);
  }, []);

  // Get sensor status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return '#00e400';
      case 'offline': return '#808080';
      case 'maintenance': return '#ffaa00';
      case 'error': return '#ff0000';
      default: return '#808080';
    }
  };

  return (
    <Card className="lg:col-span-2">
      <CardHeader>
        <CardTitle>Sensor Network Map</CardTitle>
        <CardDescription>
          Real-time sensor locations and status
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-96 rounded-lg overflow-hidden">
          {isMapReady ? (
            <MapContainer
              center={mapCenter}
              zoom={11}
              style={{ height: "100%", width: "100%" }}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              {sensors.map((sensor) => (
                <CircleMarker
                  key={sensor.id}
                  center={[sensor.location.lat, sensor.location.lng]}
                  radius={8}
                  color={getStatusColor(sensor.status)}
                  fillColor={getStatusColor(sensor.status)}
                  fillOpacity={0.6}
                  weight={2}
                  onClick={() => onSensorSelect(sensor)}
                >
                  <Popup>
                    <div className="text-sm">
                      <p><strong>{sensor.name}</strong></p>
                      <p><strong>Type:</strong> {sensor.type}</p>
                      <p><strong>Status:</strong> {sensor.status}</p>
                      <p><strong>Location:</strong> {sensor.location.name}</p>
                      <p><strong>Battery:</strong> {sensor.battery}%</p>
                      <p><strong>Signal:</strong> {sensor.signal}%</p>
                      <p><strong>Last Update:</strong> {new Date(sensor.lastUpdate).toLocaleString()}</p>
                    </div>
                  </Popup>
                </CircleMarker>
              ))}
            </MapContainer>
          ) : (
            <div className="flex items-center justify-center h-full bg-gray-100 rounded-lg">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                <p className="text-sm text-gray-600">Loading map...</p>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}