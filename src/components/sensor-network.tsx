'use client';

import { useEffect, useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  MapPin, 
  Wifi, 
  Battery, 
  Thermometer, 
  Droplets, 
  Volume2, 
  Activity, 
  AlertTriangle,
  Settings,
  MoreHorizontal,
  Filter,
  Search,
  Plus,
  RefreshCw,
  CheckCircle,
  XCircle,
  Clock
} from "lucide-react";
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
import SensorNetworkMap from "./sensor-network-map";

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
  data: {
    airQuality?: {
      aqi: number;
      pm25: number;
      pm10: number;
      o3: number;
      no2: number;
      so2: number;
      co: number;
    };
    waterQuality?: {
      ph: number;
      turbidity: number;
      temperature: number;
      dissolvedOxygen: number;
      conductivity: number;
    };
    noiseLevel?: {
      db: number;
      frequency: number;
    };
    weather?: {
      temperature: number;
      humidity: number;
      pressure: number;
      windSpeed: number;
      windDirection: number;
      precipitation: number;
    };
  };
  alerts: string[];
  maintenance: {
    nextMaintenance: Date;
    lastMaintenance: Date;
    status: 'scheduled' | 'completed' | 'overdue';
  };
}

interface SensorNetworkStats {
  totalSensors: number;
  onlineSensors: number;
  offlineSensors: number;
  errorSensors: number;
  maintenanceSensors: number;
  avgBattery: number;
  avgSignal: number;
  dataPointsToday: number;
  alertsCount: number;
}

const COLORS = ['#00e400', '#ffff00', '#ff7e00', '#ff0000', '#8f3f97', '#7e0023'];

export default function SensorNetwork() {
  const sensors = useQuery(api.sensors.getAllSensors);
  const stats = useQuery(api.sensors.getNetworkStats);
  const [selectedSensor, setSelectedSensor] = useState<Sensor | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'air' | 'water' | 'noise' | 'weather'>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'online' | 'offline' | 'maintenance' | 'error'>('all');
  const [mapCenter, setMapCenter] = useState<[number, number]>([40.7128, -74.0060]);

  // Filter sensors based on search and filters
  const filteredSensors = sensors?.filter(sensor => {
    const matchesSearch = sensor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         sensor.location.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         sensor.location.address.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || sensor.type === filterType;
    const matchesStatus = filterStatus === 'all' || sensor.status === filterStatus;
    
    return matchesSearch && matchesType && matchesStatus;
  }) || [];

  // Calculate stats if not available
  const calculateStats = (): SensorNetworkStats => {
    if (!sensors) {
      return {
        totalSensors: 0,
        onlineSensors: 0,
        offlineSensors: 0,
        errorSensors: 0,
        maintenanceSensors: 0,
        avgBattery: 0,
        avgSignal: 0,
        dataPointsToday: 0,
        alertsCount: 0
      };
    }

    const online = sensors.filter(s => s.status === 'online').length;
    const offline = sensors.filter(s => s.status === 'offline').length;
    const error = sensors.filter(s => s.status === 'error').length;
    const maintenance = sensors.filter(s => s.status === 'maintenance').length;
    
    const totalBattery = sensors.reduce((sum, s) => sum + s.battery, 0);
    const totalSignal = sensors.reduce((sum, s) => sum + s.signal, 0);
    
    const totalAlerts = sensors.reduce((sum, s) => sum + s.alerts.length, 0);

    return {
      totalSensors: sensors.length,
      onlineSensors: online,
      offlineSensors: offline,
      errorSensors: error,
      maintenanceSensors: maintenance,
      avgBattery: sensors.length > 0 ? Math.round(totalBattery / sensors.length) : 0,
      avgSignal: sensors.length > 0 ? Math.round(totalSignal / sensors.length) : 0,
      dataPointsToday: Math.floor(Math.random() * 10000) + 5000, // Mock data
      alertsCount: totalAlerts
    };
  };

  const networkStats = stats || calculateStats();

  // Get sensor status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'bg-green-500';
      case 'offline': return 'bg-gray-500';
      case 'maintenance': return 'bg-yellow-500';
      case 'error': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  // Get sensor type icon
  const getSensorIcon = (type: string) => {
    switch (type) {
      case 'air': return <Thermometer className="h-4 w-4" />;
      case 'water': return <Droplets className="h-4 w-4" />;
      case 'noise': return <Volume2 className="h-4 w-4" />;
      case 'weather': return <Activity className="h-4 w-4" />;
      default: return <Activity className="h-4 w-4" />;
    }
  };

  // Get sensor type color
  const getSensorTypeColor = (type: string) => {
    switch (type) {
      case 'air': return 'text-green-600';
      case 'water': return 'text-blue-600';
      case 'noise': return 'text-purple-600';
      case 'weather': return 'text-orange-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <div className="space-y-6">
      {/* Network Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sensors</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{networkStats.totalSensors}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Online</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{networkStats.onlineSensors}</div>
            <p className="text-xs text-muted-foreground">
              {Math.round((networkStats.onlineSensors / networkStats.totalSensors) * 100)}% uptime
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Battery</CardTitle>
            <Battery className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{networkStats.avgBattery}%</div>
            <p className="text-xs text-muted-foreground">
              Network average
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Signal</CardTitle>
            <Wifi className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{networkStats.avgSignal}%</div>
            <p className="text-xs text-muted-foreground">
              Network average
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Data Points</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{networkStats.dataPointsToday.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Today
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Alerts</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{networkStats.alertsCount}</div>
            <p className="text-xs text-muted-foreground">
              Requiring attention
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Dashboard */}
      <Tabs defaultValue="map" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="map">Map View</TabsTrigger>
          <TabsTrigger value="list">Sensor List</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
        </TabsList>

        <TabsContent value="map" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Map */}
            <SensorNetworkMap
              sensors={filteredSensors}
              selectedSensor={selectedSensor}
              onSensorSelect={setSelectedSensor}
              mapCenter={mapCenter}
            />

            {/* Selected Sensor Details */}
            <Card>
              <CardHeader>
                <CardTitle>Selected Sensor</CardTitle>
                <CardDescription>
                  Click on a sensor to view details
                </CardDescription>
              </CardHeader>
              <CardContent>
                {selectedSensor ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold">{selectedSensor.name}</h3>
                        <p className="text-sm text-muted-foreground">{selectedSensor.type} sensor</p>
                      </div>
                      <div className={`w-3 h-3 rounded-full ${getStatusColor(selectedSensor.status)}`}></div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Battery:</span>
                        <span>{selectedSensor.battery}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full ${
                            selectedSensor.battery > 70 ? 'bg-green-500' :
                            selectedSensor.battery > 30 ? 'bg-yellow-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${selectedSensor.battery}%` }}
                        ></div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Signal:</span>
                        <span>{selectedSensor.signal}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full ${
                            selectedSensor.signal > 70 ? 'bg-green-500' :
                            selectedSensor.signal > 30 ? 'bg-yellow-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${selectedSensor.signal}%` }}
                        ></div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Last Update:</span>
                        <span>{new Date(selectedSensor.lastUpdate).toLocaleString()}</span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="text-sm font-medium">Location</div>
                      <p className="text-sm">{selectedSensor.location.name}</p>
                      <p className="text-xs text-muted-foreground">{selectedSensor.location.address}</p>
                    </div>

                    {selectedSensor.alerts.length > 0 && (
                      <div className="space-y-2">
                        <div className="text-sm font-medium text-red-600">Alerts</div>
                        {selectedSensor.alerts.map((alert, index) => (
                          <div key={index} className="text-xs text-red-600 bg-red-50 p-2 rounded">
                            {alert}
                          </div>
                        ))}
                      </div>
                    )}

                    <Button className="w-full" size="sm">
                      View Details
                    </Button>
                  </div>
                ) : (
                  <div className="text-center text-muted-foreground py-8">
                    <MapPin className="h-8 w-8 mx-auto mb-2" />
                    <p>Select a sensor on the map to view details</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="list" className="space-y-6">
          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle>Filter Sensors</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search sensors..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value as any)}
                  className="px-3 py-2 border rounded-md"
                >
                  <option value="all">All Types</option>
                  <option value="air">Air Quality</option>
                  <option value="water">Water Quality</option>
                  <option value="noise">Noise Level</option>
                  <option value="weather">Weather</option>
                </select>

                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value as any)}
                  className="px-3 py-2 border rounded-md"
                >
                  <option value="all">All Status</option>
                  <option value="online">Online</option>
                  <option value="offline">Offline</option>
                  <option value="maintenance">Maintenance</option>
                  <option value="error">Error</option>
                </select>
              </div>
            </CardContent>
          </Card>

          {/* Sensor List */}
          <div className="grid gap-4">
            {filteredSensors.map((sensor) => (
              <Card key={sensor.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className={`p-2 rounded-full ${getSensorTypeColor(sensor.type)} bg-opacity-10`}>
                        {getSensorIcon(sensor.type)}
                      </div>
                      <div>
                        <h3 className="font-semibold">{sensor.name}</h3>
                        <p className="text-sm text-muted-foreground">{sensor.location.name}</p>
                        <div className="flex items-center space-x-2 mt-1">
                          <Badge variant="outline">{sensor.type}</Badge>
                          <Badge className={`${getStatusColor(sensor.status)} text-white`}>
                            {sensor.status}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-6">
                      <div className="text-center">
                        <div className="text-sm font-medium">Battery</div>
                        <div className="text-lg">{sensor.battery}%</div>
                      </div>
                      <div className="text-center">
                        <div className="text-sm font-medium">Signal</div>
                        <div className="text-lg">{sensor.signal}%</div>
                      </div>
                      <div className="text-center">
                        <div className="text-sm font-medium">Last Update</div>
                        <div className="text-xs">{new Date(sensor.lastUpdate).toLocaleTimeString()}</div>
                      </div>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Sensor Status Distribution</CardTitle>
                <CardDescription>
                  Current network status breakdown
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'Online', value: networkStats.onlineSensors, color: '#00e400' },
                        { name: 'Offline', value: networkStats.offlineSensors, color: '#808080' },
                        { name: 'Maintenance', value: networkStats.maintenanceSensors, color: '#ffaa00' },
                        { name: 'Error', value: networkStats.errorSensors, color: '#ff0000' },
                      ]}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {[
                        '#00e400', '#808080', '#ffaa00', '#ff0000'
                      ].map((color, index) => (
                        <Cell key={`cell-${index}`} fill={color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Data Collection Activity</CardTitle>
                <CardDescription>
                  Recent data collection trends
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={[
                    { time: '00:00', data: 120 },
                    { time: '04:00', data: 80 },
                    { time: '08:00', data: 200 },
                    { time: '12:00', data: 350 },
                    { time: '16:00', data: 280 },
                    { time: '20:00', data: 180 },
                    { time: '24:00', data: 100 },
                  ]}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="time" />
                    <YAxis />
                    <Tooltip />
                    <Area type="monotone" dataKey="data" stroke="#8884d8" fill="#8884d8" fillOpacity={0.3} />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Performance Metrics</CardTitle>
              <CardDescription>
                Network health and performance indicators
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600">
                    {Math.round((networkStats.onlineSensors / networkStats.totalSensors) * 100)}%
                  </div>
                  <p className="text-sm text-muted-foreground">Network Uptime</p>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600">
                    {networkStats.avgBattery}%
                  </div>
                  <p className="text-sm text-muted-foreground">Avg Battery Life</p>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-purple-600">
                    {networkStats.avgSignal}%
                  </div>
                  <p className="text-sm text-muted-foreground">Avg Signal Strength</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="maintenance" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Maintenance Schedule</CardTitle>
              <CardDescription>
                Upcoming and overdue maintenance tasks
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {sensors?.filter(s => s.maintenance.status === 'scheduled' || s.maintenance.status === 'overdue').map((sensor) => (
                  <div key={sensor.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className={`p-2 rounded-full ${getSensorTypeColor(sensor.type)} bg-opacity-10`}>
                        {getSensorIcon(sensor.type)}
                      </div>
                      <div>
                        <h3 className="font-semibold">{sensor.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {sensor.location.name} • Next: {new Date(sensor.maintenance.nextMaintenance).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge 
                        variant={sensor.maintenance.status === 'overdue' ? 'destructive' : 'secondary'}
                      >
                        {sensor.maintenance.status === 'overdue' ? 'Overdue' : 'Scheduled'}
                      </Badge>
                      <Button variant="outline" size="sm">
                        Schedule
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Battery Levels</CardTitle>
              <CardDescription>
                Sensors requiring battery replacement
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {sensors?.filter(s => s.battery < 20).map((sensor) => (
                  <div key={sensor.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className="p-2 rounded-full bg-red-100 text-red-600">
                        <Battery className="h-4 w-4" />
                      </div>
                      <div>
                        <h3 className="font-semibold">{sensor.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {sensor.location.name} • Battery: {sensor.battery}%
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant="destructive">
                        Low Battery
                      </Badge>
                      <Button variant="outline" size="sm">
                        Replace
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}