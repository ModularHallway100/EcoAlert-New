'use client';

import { useEffect, useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import MapContainerComponent from "@/components/map-container";
import { 
  LineChart, 
  Line, 
  AreaChart, 
  Area, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from "recharts";
import { 
  Thermometer, 
  Droplets, 
  Volume2, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  MapPin,
  Clock,
  Calendar,
  Wind,
  Sun,
  Gauge
} from "lucide-react";

interface EnvironmentalData {
  timestamp: Date;
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
  location: {
    lat: number;
    lng: number;
    name: string;
  };
}

interface HistoricalData {
  airQuality: EnvironmentalData[];
  waterQuality: EnvironmentalData[];
  noiseLevel: EnvironmentalData[];
}

const COLORS = ['#00e400', '#ffff00', '#ff7e00', '#ff0000', '#8f3f97', '#7e0023'];

export default function EnvironmentalDashboard() {
  const currentData = useQuery(api.environmental.getCurrentData);
  const historicalData = useQuery(api.environmental.getHistoricalData);
  const [timeRange, setTimeRange] = useState<'24h' | '7d' | '30d'>('24h');
  const [selectedMetric, setSelectedMetric] = useState<'air' | 'water' | 'noise'>('air');

  // Transform data for charts
  const getChartData = () => {
    if (!historicalData) return [];
    
    const data = historicalData[selectedMetric];
    return data.map(item => ({
      time: new Date(item.timestamp).toLocaleTimeString(),
      value: selectedMetric === 'air' ? item.airQuality.aqi :
             selectedMetric === 'water' ? item.waterQuality.ph :
             item.noiseLevel.db,
      timestamp: new Date(item.timestamp).getTime()
    })).sort((a, b) => a.timestamp - b.timestamp);
  };

  const getPieChartData = () => {
    if (!currentData) return [];
    
    const data = [
      { name: 'PM2.5', value: currentData.airQuality.pm25, color: '#ff6b6b' },
      { name: 'PM10', value: currentData.airQuality.pm10, color: '#4ecdc4' },
      { name: 'O3', value: currentData.airQuality.o3, color: '#45b7d1' },
      { name: 'NO2', value: currentData.airQuality.no2, color: '#96ceb4' },
      { name: 'SO2', value: currentData.airQuality.so2, color: '#feca57' },
      { name: 'CO', value: currentData.airQuality.co, color: '#ff9ff3' }
    ];
    
    return data.filter(item => item.value > 0);
  };

  const getComparisonData = () => {
    if (!historicalData || historicalData.airQuality.length < 2) return null;
    
    const latest = historicalData.airQuality[0];
    const previous = historicalData.airQuality[1];
    
    return {
      aqi: {
        current: latest.airQuality.aqi,
        previous: previous.airQuality.aqi,
        change: latest.airQuality.aqi - previous.airQuality.aqi,
        trend: latest.airQuality.aqi > previous.airQuality.aqi ? 'up' : 'down'
      },
      pm25: {
        current: latest.airQuality.pm25,
        previous: previous.airQuality.pm25,
        change: latest.airQuality.pm25 - previous.airQuality.pm25,
        trend: latest.airQuality.pm25 > previous.airQuality.pm25 ? 'up' : 'down'
      }
    };
  };

  const comparisonData = getComparisonData();

  return (
    <div className="space-y-6">
      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Current AQI</CardTitle>
            <Thermometer className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{currentData?.airQuality.aqi || 'N/A'}</div>
            {comparisonData && (
              <div className="flex items-center space-x-1 text-xs">
                {comparisonData.aqi.trend === 'up' ? 
                  <TrendingUp className="h-3 w-3 text-red-500" /> : 
                  <TrendingDown className="h-3 w-3 text-green-500" />
                }
                <span className={comparisonData.aqi.trend === 'up' ? 'text-red-500' : 'text-green-500'}>
                  {Math.abs(comparisonData.aqi.change)}
                </span>
                <span>vs yesterday</span>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Water pH</CardTitle>
            <Droplets className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{currentData?.waterQuality.ph.toFixed(1) || 'N/A'}</div>
            <p className="text-xs text-muted-foreground">
              Optimal: 6.5-8.5
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Noise Level</CardTitle>
            <Volume2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{currentData?.noiseLevel.db || 'N/A'} dB</div>
            <p className="text-xs text-muted-foreground">
              {currentData?.noiseLevel.level || 'Unknown'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Last Update</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-semibold">
              {currentData ? new Date(currentData.timestamp).toLocaleTimeString() : 'N/A'}
            </div>
            <p className="text-xs text-muted-foreground">
              {currentData ? new Date(currentData.timestamp).toLocaleDateString() : 'Unknown'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Dashboard Tabs */}
      <Tabs defaultValue="charts" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="charts">Charts</TabsTrigger>
          <TabsTrigger value="map">Map</TabsTrigger>
          <TabsTrigger value="composition">Composition</TabsTrigger>
          <TabsTrigger value="alerts">Alerts</TabsTrigger>
        </TabsList>

        <TabsContent value="charts" className="space-y-6">
          {/* Time Range Selector */}
          <div className="flex items-center space-x-4 mb-4">
            <span className="text-sm font-medium">Time Range:</span>
            {(['24h', '7d', '30d'] as const).map((range) => (
              <Button
                key={range}
                variant={timeRange === range ? "default" : "outline"}
                size="sm"
                onClick={() => setTimeRange(range)}
              >
                {range}
              </Button>
            ))}
          </div>

          {/* Metric Selector */}
          <div className="flex items-center space-x-4 mb-4">
            <span className="text-sm font-medium">Metric:</span>
            {(['air', 'water', 'noise'] as const).map((metric) => (
              <Button
                key={metric}
                variant={selectedMetric === metric ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedMetric(metric)}
              >
                {metric === 'air' ? 'Air' : metric === 'water' ? 'Water' : 'Noise'}
              </Button>
            ))}
          </div>

          {/* Main Chart */}
          <Card>
            <CardHeader>
              <CardTitle>
                {selectedMetric === 'air' ? 'Air Quality Index' : 
                 selectedMetric === 'water' ? 'Water Quality pH Levels' : 
                 'Noise Levels'} - {timeRange}
              </CardTitle>
              <CardDescription>
                Real-time monitoring data and trends
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <AreaChart data={getChartData()}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="time" 
                    tick={{ fontSize: 12 }}
                    interval="preserveStartEnd"
                  />
                  <YAxis 
                    tick={{ fontSize: 12 }}
                    domain={selectedMetric === 'air' ? [0, 500] : 
                           selectedMetric === 'water' ? [0, 14] : 
                           [0, 120]}
                  />
                  <Tooltip 
                    labelFormatter={(value) => `Time: ${value}`}
                    formatter={(value) => [value, 
                      selectedMetric === 'air' ? 'AQI' : 
                      selectedMetric === 'water' ? 'pH' : 
                      'dB']}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="value" 
                    stroke="#8884d8" 
                    fill="#8884d8" 
                    fillOpacity={0.3}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Secondary Charts */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Daily Average Comparison</CardTitle>
                <CardDescription>
                  Today vs Yesterday
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={[
                    { name: 'AQI', today: currentData?.airQuality.aqi || 0, yesterday: comparisonData?.aqi.previous || 0 },
                    { name: 'PM2.5', today: currentData?.airQuality.pm25 || 0, yesterday: comparisonData?.pm25.previous || 0 },
                  ]}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="today" fill="#8884d8" />
                    <Bar dataKey="yesterday" fill="#82ca9d" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Quality Levels Distribution</CardTitle>
                <CardDescription>
                  Current environmental quality status
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'Good', value: currentData?.airQuality.level === 'good' ? 1 : 0 },
                        { name: 'Moderate', value: currentData?.airQuality.level === 'moderate' ? 1 : 0 },
                        { name: 'Unhealthy Sensitive', value: currentData?.airQuality.level === 'unhealthy-sensitive' ? 1 : 0 },
                        { name: 'Unhealthy', value: currentData?.airQuality.level === 'unhealthy' ? 1 : 0 },
                        { name: 'Very Unhealthy', value: currentData?.airQuality.level === 'very-unhealthy' ? 1 : 0 },
                        { name: 'Hazardous', value: currentData?.airQuality.level === 'hazardous' ? 1 : 0 },
                      ]}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {COLORS.map((color, index) => (
                        <Cell key={`cell-${index}`} fill={color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="map" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Environmental Monitoring Map</CardTitle>
              <CardDescription>
                Real-time sensor locations and environmental data
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-96 rounded-lg overflow-hidden">
                <MapContainerComponent
                  center={[currentData?.location.lat || 40.7128, currentData?.location.lng || -74.0060]}
                  zoom={13}
                >
                  {currentData && (
                    <div className="text-center p-4 bg-white rounded-lg shadow-lg">
                      <p><strong>Location:</strong> {currentData.location.name}</p>
                      <p><strong>AQI:</strong> {currentData.airQuality.aqi}</p>
                      <p><strong>pH:</strong> {currentData.waterQuality.ph}</p>
                      <p><strong>Noise:</strong> {currentData.noiseLevel.db} dB</p>
                      <p><strong>Updated:</strong> {new Date(currentData.timestamp).toLocaleString()}</p>
                    </div>
                  )}
                </MapContainerComponent>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="composition" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Air Quality Composition</CardTitle>
              <CardDescription>
                Detailed breakdown of air quality parameters
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <PieChart>
                  <Pie
                    data={getPieChartData()}
                    cx="50%"
                    cy="50%"
                    outerRadius={150}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}`}
                  >
                    {getPieChartData().map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="alerts" className="space-y-6">
          <div className="space-y-4">
            {currentData && (
              <>
                {currentData.airQuality.level === 'unhealthy' || currentData.airQuality.level === 'very-unhealthy' || currentData.airQuality.level === 'hazardous' ? (
                  <Card className="border-red-500">
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2 text-red-600">
                        <AlertTriangle className="h-5 w-5" />
                        <span>Air Quality Alert</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-red-700">
                        Air quality is currently {currentData.airQuality.level.replace('-', ' ')}. 
                        Limit outdoor activities and keep windows closed.
                      </p>
                    </CardContent>
                  </Card>
                ) : null}

                {currentData.waterQuality.level === 'unhealthy' || currentData.waterQuality.level === 'very-unhealthy' || currentData.waterQuality.level === 'hazardous' ? (
                  <Card className="border-red-500">
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2 text-red-600">
                        <AlertTriangle className="h-5 w-5" />
                        <span>Water Quality Alert</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-red-700">
                        Water quality is currently {currentData.waterQuality.level}. 
                        Avoid contact with water sources in this area.
                      </p>
                    </CardContent>
                  </Card>
                ) : null}

                {currentData.noiseLevel.level === 'very-loud' || currentData.noiseLevel.level === 'extremely-loud' ? (
                  <Card className="border-orange-500">
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2 text-orange-600">
                        <Volume2 className="h-5 w-5" />
                        <span>Noise Pollution Alert</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-orange-700">
                        Noise levels are currently {currentData.noiseLevel.level.replace('-', ' ')}. 
                        Consider using ear protection if outdoors.
                      </p>
                    </CardContent>
                  </Card>
                ) : null}

                {currentData.airQuality.level === 'good' && currentData.waterQuality.level === 'good' && currentData.noiseLevel.level === 'quiet' && (
                  <Card className="border-green-500">
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2 text-green-600">
                        <TrendingUp className="h-5 w-5" />
                        <span>Excellent Environmental Conditions</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-green-700">
                        All environmental indicators are within healthy ranges. 
                        Great conditions for outdoor activities!
                      </p>
                    </CardContent>
                  </Card>
                )}
              </>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}