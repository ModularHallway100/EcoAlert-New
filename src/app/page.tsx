'use client';

import { useEffect, useState } from "react";
import { useUser, SignedIn, SignedOut } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { MapPin, Thermometer, Droplets, Volume2, Activity, TrendingUp, AlertTriangle, Shield, Users } from "lucide-react";
import EnvironmentalDashboard from "@/components/environmental-dashboard";
import SensorNetwork from "@/components/sensor-network";
import EmergencyAlerts from "@/components/emergency-alerts";
import CommunityFeatures from "@/components/community-features";
import EducationalContent from "@/components/educational-content";
import { usePreloadedQuery } from "convex/react";

// Define types
interface EnvironmentalData {
  airQuality: {
    aqi: number;
    pm25: number;
    pm10: number;
    o3: number;
    no2: number;
    so2: number;
    co: number;
    level: 'good' | 'moderate' | 'unhealthy-sensitive' | 'unhealthy' | 'very-unhealthy' | 'hazardous';
  };
  waterQuality: {
    ph: number;
    turbidity: number;
    temperature: number;
    dissolvedOxygen: number;
    level: 'good' | 'moderate' | 'unhealthy' | 'very-unhealthy' | 'hazardous';
  };
  noiseLevel: {
    db: number;
    level: 'quiet' | 'moderate' | 'loud' | 'very-loud' | 'extremely-loud';
  };
}

interface UserPreferences {
  location: {
    lat: number;
    lng: number;
    name: string;
  };
  notifications: {
    airQuality: boolean;
    waterQuality: boolean;
    noiseLevel: boolean;
    emergencyAlerts: boolean;
  };
  units: {
    temperature: 'celsius' | 'fahrenheit';
    distance: 'km' | 'miles';
  };
}

export default function HomePage() {
  const { user, isLoaded } = useUser();
  const environmentalData = useQuery(api.environmental.getCurrentData);
  const userPreferences = useQuery(api.users.getPreferences);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (isLoaded && environmentalData && userPreferences) {
      setIsLoading(false);
    }
  }, [isLoaded, environmentalData, userPreferences]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
      <SignedOut>
        <div className="container mx-auto px-4 py-16">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
              EcoAlert
            </h1>
            <p className="text-xl md:text-2xl text-gray-600 mb-8">
              Pollution Intelligence & Emergency Response Suite
            </p>
            <div className="flex justify-center space-x-4">
              <Button size="lg" className="px-8">
                Get Started
              </Button>
              <Button variant="outline" size="lg" className="px-8">
                Learn More
              </Button>
            </div>
            <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8">
              <Card>
                <CardHeader>
                  <Thermometer className="h-8 w-8 text-green-600" />
                  <CardTitle>Air Quality</CardTitle>
                  <CardDescription>
                    Real-time monitoring of air quality indicators
                  </CardDescription>
                </CardHeader>
              </Card>
              <Card>
                <CardHeader>
                  <Droplets className="h-8 w-8 text-blue-600" />
                  <CardTitle>Water Quality</CardTitle>
                  <CardDescription>
                    Continuous water quality assessment
                  </CardDescription>
                </CardHeader>
              </Card>
              <Card>
                <CardHeader>
                  <Volume2 className="h-8 w-8 text-purple-600" />
                  <CardTitle>Noise Pollution</CardTitle>
                  <CardDescription>
                    Ambient noise level tracking
                  </CardDescription>
                </CardHeader>
              </Card>
            </div>
          </div>
        </div>
      </SignedOut>

      <SignedIn>
        <div className="container mx-auto px-4 py-8">
          {/* Welcome Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Welcome back, {user?.firstName}!
            </h1>
            <p className="text-gray-600">
              Here's your environmental overview for today
            </p>
          </div>

          {/* Quick Stats */}
          {environmentalData && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <Card className={`border-l-4 ${
                environmentalData.airQuality.level === 'good' ? 'border-green-500' :
                environmentalData.airQuality.level === 'moderate' ? 'border-yellow-500' :
                environmentalData.airQuality.level === 'unhealthy-sensitive' ? 'border-orange-500' :
                environmentalData.airQuality.level === 'unhealthy' ? 'border-red-500' :
                environmentalData.airQuality.level === 'very-unhealthy' ? 'border-purple-500' :
                'border-red-900'
              }`}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Air Quality Index</CardTitle>
                  <Thermometer className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{environmentalData.airQuality.aqi}</div>
                  <p className="text-xs text-muted-foreground">
                    PM2.5: {environmentalData.airQuality.pm25} μg/m³
                  </p>
                  <Badge 
                    variant="secondary" 
                    className={`mt-2 ${
                      environmentalData.airQuality.level === 'good' ? 'bg-green-100 text-green-800' :
                      environmentalData.airQuality.level === 'moderate' ? 'bg-yellow-100 text-yellow-800' :
                      environmentalData.airQuality.level === 'unhealthy-sensitive' ? 'bg-orange-100 text-orange-800' :
                      environmentalData.airQuality.level === 'unhealthy' ? 'bg-red-100 text-red-800' :
                      environmentalData.airQuality.level === 'very-unhealthy' ? 'bg-purple-100 text-purple-800' :
                      'bg-red-900 text-white'
                    }`}
                  >
                    {environmentalData.airQuality.level.replace('-', ' ').toUpperCase()}
                  </Badge>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-blue-500">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Water Quality</CardTitle>
                  <Droplets className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">pH {environmentalData.waterQuality.ph}</div>
                  <p className="text-xs text-muted-foreground">
                    Turbidity: {environmentalData.waterQuality.turbidity} NTU
                  </p>
                  <Badge 
                    variant="secondary"
                    className={`mt-2 ${
                      environmentalData.waterQuality.level === 'good' ? 'bg-blue-100 text-blue-800' :
                      environmentalData.waterQuality.level === 'moderate' ? 'bg-cyan-100 text-cyan-800' :
                      environmentalData.waterQuality.level === 'unhealthy' ? 'bg-orange-100 text-orange-800' :
                      environmentalData.waterQuality.level === 'very-unhealthy' ? 'bg-red-100 text-red-800' :
                      'bg-red-900 text-white'
                    }`}
                  >
                    {environmentalData.waterQuality.level.toUpperCase()}
                  </Badge>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-purple-500">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Noise Level</CardTitle>
                  <Volume2 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{environmentalData.noiseLevel.db} dB</div>
                  <p className="text-xs text-muted-foreground">
                    Current ambient noise level
                  </p>
                  <Badge 
                    variant="secondary"
                    className={`mt-2 ${
                      environmentalData.noiseLevel.level === 'quiet' ? 'bg-green-100 text-green-800' :
                      environmentalData.noiseLevel.level === 'moderate' ? 'bg-yellow-100 text-yellow-800' :
                      environmentalData.noiseLevel.level === 'loud' ? 'bg-orange-100 text-orange-800' :
                      environmentalData.noiseLevel.level === 'very-loud' ? 'bg-red-100 text-red-800' :
                      'bg-red-900 text-white'
                    }`}
                  >
                    {environmentalData.noiseLevel.level.toUpperCase()}
                  </Badge>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Main Dashboard Tabs */}
          <Tabs defaultValue="dashboard" className="w-full">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="dashboard" className="flex items-center space-x-2">
                <Activity className="h-4 w-4" />
                <span>Dashboard</span>
              </TabsTrigger>
              <TabsTrigger value="sensors" className="flex items-center space-x-2">
                <MapPin className="h-4 w-4" />
                <span>Sensors</span>
              </TabsTrigger>
              <TabsTrigger value="alerts" className="flex items-center space-x-2">
                <AlertTriangle className="h-4 w-4" />
                <span>Alerts</span>
              </TabsTrigger>
              <TabsTrigger value="community" className="flex items-center space-x-2">
                <Users className="h-4 w-4" />
                <span>Community</span>
              </TabsTrigger>
              <TabsTrigger value="learn" className="flex items-center space-x-2">
                <Shield className="h-4 w-4" />
                <span>Learn</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="dashboard" className="mt-6">
              <EnvironmentalDashboard />
            </TabsContent>

            <TabsContent value="sensors" className="mt-6">
              <SensorNetwork />
            </TabsContent>

            <TabsContent value="alerts" className="mt-6">
              <EmergencyAlerts />
            </TabsContent>

            <TabsContent value="community" className="mt-6">
              <CommunityFeatures />
            </TabsContent>

            <TabsContent value="learn" className="mt-6">
              <EducationalContent />
            </TabsContent>
          </Tabs>

          {/* AI Insights */}
          <Card className="mt-8">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <TrendingUp className="h-5 w-5" />
                <span>AI-Powered Insights</span>
              </CardTitle>
              <CardDescription>
                Personalized recommendations based on your local environmental conditions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    Air quality is expected to decrease tomorrow due to industrial activity. Consider reducing outdoor activities between 2-4 PM.
                  </AlertDescription>
                </Alert>
                <Alert>
                  <Activity className="h-4 w-4" />
                  <AlertDescription>
                    Water quality in your area shows excellent pH levels. Continue monitoring for any changes.
                  </AlertDescription>
                </Alert>
                <Alert>
                  <Volume2 className="h-4 w-4" />
                  <AlertDescription>
                    Noise levels are within normal range. No immediate action required.
                  </AlertDescription>
                </Alert>
              </div>
            </CardContent>
          </Card>
        </div>
      </SignedIn>
    </div>
  );
}