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
  AlertTriangle, 
  Bell, 
  BellOff, 
  MapPin, 
  Clock, 
  Thermometer, 
  Droplets, 
  Volume2,
  Activity,
  Users,
  Shield,
  Settings,
  Filter,
  Search,
  CheckCircle,
  XCircle,
  Eye,
  EyeOff,
  Volume2 as Volume,
  Smartphone,
  Mail,
  MessageSquare
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

interface Alert {
  id: string;
  type: 'air' | 'water' | 'noise' | 'weather' | 'emergency';
  severity: 'low' | 'moderate' | 'high' | 'critical';
  title: string;
  description: string;
  location: {
    lat: number;
    lng: number;
    name: string;
    address: string;
    radius: number; // in km
  };
  timestamp: Date;
  expires?: Date;
  status: 'active' | 'acknowledged' | 'resolved' | 'expired';
  affectedUsers: number;
  source: 'sensor' | 'ai-prediction' | 'user-report' | 'official';
  data: {
    airQuality?: {
      aqi: number;
      pollutants: Record<string, number>;
    };
    waterQuality?: {
      ph: number;
      contaminants: string[];
    };
    noiseLevel?: {
      db: number;
      source: string;
    };
    weather?: {
      condition: string;
      temperature: number;
      windSpeed: number;
      precipitation: number;
    };
    emergency?: {
      type: string;
      affectedArea: string;
      recommendedActions: string[];
    };
  };
  actions: {
    viewDetails: boolean;
    acknowledge: boolean;
    share: boolean;
    report: boolean;
  };
}

interface UserPreferences {
  notifications: {
    airQuality: boolean;
    waterQuality: boolean;
    noiseLevel: boolean;
    emergencyAlerts: boolean;
    severeWeather: boolean;
  };
  methods: {
    push: boolean;
    email: boolean;
    sms: boolean;
    inApp: boolean;
  };
  severity: {
    low: boolean;
    moderate: boolean;
    high: boolean;
    critical: boolean;
  };
  locationRadius: number; // in km
}

export default function EmergencyAlerts() {
  const alerts = useQuery(api.alerts.getActiveAlerts);
  const userPreferences = useQuery(api.users.getPreferences);
  const [filteredAlerts, setFilteredAlerts] = useState<Alert[]>([]);
  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'air' | 'water' | 'noise' | 'weather' | 'emergency'>('all');
  const [filterSeverity, setFilterSeverity] = useState<'all' | 'low' | 'moderate' | 'high' | 'critical'>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'acknowledged' | 'resolved'>('all');
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  // Filter alerts based on search and filters
  useEffect(() => {
    let filtered = alerts || [];

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(alert => 
        alert.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        alert.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        alert.location.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply type filter
    if (filterType !== 'all') {
      filtered = filtered.filter(alert => alert.type === filterType);
    }

    // Apply severity filter
    if (filterSeverity !== 'all') {
      filtered = filtered.filter(alert => alert.severity === filterSeverity);
    }

    // Apply status filter
    if (filterStatus !== 'all') {
      filtered = filtered.filter(alert => alert.status === filterStatus);
    }

    // Sort by timestamp (newest first)
    filtered.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    setFilteredAlerts(filtered);
  }, [alerts, searchTerm, filterType, filterSeverity, filterStatus]);

  // Get alert severity color
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'low': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'moderate': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'critical': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  // Get alert type icon
  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'air': return <Thermometer className="h-5 w-5" />;
      case 'water': return <Droplets className="h-5 w-5" />;
      case 'noise': return <Volume2 className="h-5 w-5" />;
      case 'weather': return <Activity className="h-5 w-5" />;
      case 'emergency': return <AlertTriangle className="h-5 w-5" />;
      default: return <AlertTriangle className="h-5 w-5" />;
    }
  };

  // Get alert type color
  const getAlertTypeColor = (type: string) => {
    switch (type) {
      case 'air': return 'text-green-600';
      case 'water': return 'text-blue-600';
      case 'noise': return 'text-purple-600';
      case 'weather': return 'text-orange-600';
      case 'emergency': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  // Get alert status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-red-600';
      case 'acknowledged': return 'text-yellow-600';
      case 'resolved': return 'text-green-600';
      case 'expired': return 'text-gray-600';
      default: return 'text-gray-600';
    }
  };

  // Calculate alert statistics
  const alertStats = {
    total: alerts?.length || 0,
    active: alerts?.filter(a => a.status === 'active').length || 0,
    acknowledged: alerts?.filter(a => a.status === 'acknowledged').length || 0,
    resolved: alerts?.filter(a => a.status === 'resolved').length || 0,
    critical: alerts?.filter(a => a.severity === 'critical').length || 0,
    high: alerts?.filter(a => a.severity === 'high').length || 0,
    moderate: alerts?.filter(a => a.severity === 'moderate').length || 0,
    low: alerts?.filter(a => a.severity === 'low').length || 0,
  };

  // Get recommendations based on alert type
  const getRecommendations = (alert: Alert) => {
    switch (alert.type) {
      case 'air':
        return [
          "Limit outdoor activities",
          "Keep windows closed",
          "Use air purifiers indoors",
          "Wear N95 masks if going outside",
          "Avoid strenuous exercise"
        ];
      case 'water':
        return [
          "Do not drink tap water",
          "Use bottled water for drinking",
          "Avoid contact with water bodies",
          "Boil water if absolutely necessary",
          "Contact local authorities"
        ];
      case 'noise':
        return [
          "Close windows and doors",
          "Use ear protection if outdoors",
          "Limit time spent in noisy areas",
          "Consider soundproofing your home",
          "Report excessive noise to authorities"
        ];
      case 'weather':
        return [
          "Monitor weather updates",
          "Secure outdoor items",
          "Have emergency supplies ready",
          "Avoid travel if conditions are severe",
          "Stay informed about warnings"
        ];
      case 'emergency':
        return alert.data.emergency?.recommendedActions || [
          "Follow official instructions",
          "Evacuate if ordered",
          "Have emergency kit ready",
          "Stay informed through official channels",
          "Check on neighbors and family"
        ];
      default:
        return [
          "Stay informed about developments",
          "Follow official guidance",
          "Take necessary precautions",
          "Monitor the situation"
        ];
    }
  };

  return (
    <div className="space-y-6">
      {/* Alert Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Alerts</CardTitle>
            <Bell className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{alertStats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{alertStats.active}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Critical</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{alertStats.critical}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">High</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{alertStats.high}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Acknowledged</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{alertStats.acknowledged}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Resolved</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{alertStats.resolved}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Affected Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {filteredAlerts.reduce((sum, alert) => sum + alert.affectedUsers, 0).toLocaleString()}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Notifications</CardTitle>
            {notificationsEnabled ? (
              <Bell className="h-4 w-4 text-green-500" />
            ) : (
              <BellOff className="h-4 w-4 text-gray-500" />
            )}
          </CardHeader>
          <CardContent>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setNotificationsEnabled(!notificationsEnabled)}
              className="p-0 h-auto"
            >
              {notificationsEnabled ? 'Enabled' : 'Disabled'}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Main Dashboard */}
      <Tabs defaultValue="alerts" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="alerts">Alerts</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="alerts" className="space-y-6">
          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle>Filter Alerts</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search alerts..."
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
                  <option value="emergency">Emergency</option>
                </select>

                <select
                  value={filterSeverity}
                  onChange={(e) => setFilterSeverity(e.target.value as any)}
                  className="px-3 py-2 border rounded-md"
                >
                  <option value="all">All Severities</option>
                  <option value="critical">Critical</option>
                  <option value="high">High</option>
                  <option value="moderate">Moderate</option>
                  <option value="low">Low</option>
                </select>

                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value as any)}
                  className="px-3 py-2 border rounded-md"
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="acknowledged">Acknowledged</option>
                  <option value="resolved">Resolved</option>
                </select>
              </div>
            </CardContent>
          </Card>

          {/* Alert List */}
          <div className="space-y-4">
            {filteredAlerts.map((alert) => (
              <Card 
                key={alert.id} 
                className={`cursor-pointer hover:shadow-md transition-shadow ${
                  alert.severity === 'critical' ? 'border-red-200' : 
                  alert.severity === 'high' ? 'border-orange-200' : 
                  alert.severity === 'moderate' ? 'border-yellow-200' : 
                  'border-blue-200'
                }`}
                onClick={() => setSelectedAlert(alert)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4">
                      <div className={`p-2 rounded-full ${getAlertTypeColor(alert.type)} bg-opacity-10`}>
                        {getAlertIcon(alert.type)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <h3 className="font-semibold">{alert.title}</h3>
                          <Badge className={getSeverityColor(alert.severity)}>
                            {alert.severity.toUpperCase()}
                          </Badge>
                          <Badge variant="outline" className={getStatusColor(alert.status)}>
                            {alert.status.toUpperCase()}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">{alert.description}</p>
                        <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                          <div className="flex items-center space-x-1">
                            <MapPin className="h-3 w-3" />
                            <span>{alert.location.name}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Clock className="h-3 w-3" />
                            <span>{new Date(alert.timestamp).toLocaleString()}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Users className="h-3 w-3" />
                            <span>{alert.affectedUsers.toLocaleString()} affected</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Button variant="ghost" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <ShareIcon className="h-4 w-4" />
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
                <CardTitle>Alerts by Type</CardTitle>
                <CardDescription>
                  Distribution of alert types
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'Air Quality', value: alerts?.filter(a => a.type === 'air').length || 0, color: '#00e400' },
                        { name: 'Water Quality', value: alerts?.filter(a => a.type === 'water').length || 0, color: '#0066cc' },
                        { name: 'Noise Level', value: alerts?.filter(a => a.type === 'noise').length || 0, color: '#9933cc' },
                        { name: 'Weather', value: alerts?.filter(a => a.type === 'weather').length || 0, color: '#ff9900' },
                        { name: 'Emergency', value: alerts?.filter(a => a.type === 'emergency').length || 0, color: '#ff0000' },
                      ]}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {['#00e400', '#0066cc', '#9933cc', '#ff9900', '#ff0000'].map((color, index) => (
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
                <CardTitle>Alerts by Severity</CardTitle>
                <CardDescription>
                  Severity distribution over time
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={[
                    { severity: 'Critical', count: alertStats.critical },
                    { severity: 'High', count: alertStats.high },
                    { severity: 'Moderate', count: alertStats.moderate },
                    { severity: 'Low', count: alertStats.low },
                  ]}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="severity" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>
                Alert trends and response times
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={[
                  { time: '00:00', active: 5, acknowledged: 2, resolved: 1 },
                  { time: '04:00', active: 8, acknowledged: 3, resolved: 2 },
                  { time: '08:00', active: 12, acknowledged: 5, resolved: 3 },
                  { time: '12:00', active: 15, acknowledged: 8, resolved: 5 },
                  { time: '16:00', active: 18, acknowledged: 12, resolved: 8 },
                  { time: '20:00', active: 14, acknowledged: 15, resolved: 12 },
                  { time: '24:00', active: 10, acknowledged: 18, resolved: 15 },
                ]}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="time" />
                  <YAxis />
                  <Tooltip />
                  <Area type="monotone" dataKey="active" stackId="1" stroke="#ff0000" fill="#ff0000" fillOpacity={0.3} />
                  <Area type="monotone" dataKey="acknowledged" stackId="1" stroke="#ffaa00" fill="#ffaa00" fillOpacity={0.3} />
                  <Area type="monotone" dataKey="resolved" stackId="1" stroke="#00e400" fill="#00e400" fillOpacity={0.3} />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
              <CardDescription>
                Configure how you receive alerts
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="space-y-4">
                  <h3 className="font-medium">Alert Types</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <Thermometer className="h-4 w-4 text-green-600" />
                        <span>Air Quality Alerts</span>
                      </div>
                      <Button variant="ghost" size="sm">
                        {userPreferences?.notifications.airQuality ? <Bell className="h-4 w-4" /> : <BellOff className="h-4 w-4" />}
                      </Button>
                    </div>
                    
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <Droplets className="h-4 w-4 text-blue-600" />
                        <span>Water Quality Alerts</span>
                      </div>
                      <Button variant="ghost" size="sm">
                        {userPreferences?.notifications.waterQuality ? <Bell className="h-4 w-4" /> : <BellOff className="h-4 w-4" />}
                      </Button>
                    </div>
                    
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <Volume2 className="h-4 w-4 text-purple-600" />
                        <span>Noise Level Alerts</span>
                      </div>
                      <Button variant="ghost" size="sm">
                        {userPreferences?.notifications.noiseLevel ? <Bell className="h-4 w-4" /> : <BellOff className="h-4 w-4" />}
                      </Button>
                    </div>
                    
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <Activity className="h-4 w-4 text-orange-600" />
                        <span>Emergency Alerts</span>
                      </div>
                      <Button variant="ghost" size="sm">
                        {userPreferences?.notifications.emergencyAlerts ? <Bell className="h-4 w-4" /> : <BellOff className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-medium">Notification Methods</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <Smartphone className="h-4 w-4" />
                        <span>Push Notifications</span>
                      </div>
                      <Button variant="ghost" size="sm">
                        {userPreferences?.methods.push ? <Bell className="h-4 w-4" /> : <BellOff className="h-4 w-4" />}
                      </Button>
                    </div>
                    
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <Mail className="h-4 w-4" />
                        <span>Email</span>
                      </div>
                      <Button variant="ghost" size="sm">
                        {userPreferences?.methods.email ? <Bell className="h-4 w-4" /> : <BellOff className="h-4 w-4" />}
                      </Button>
                    </div>
                    
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <MessageSquare className="h-4 w-4" />
                        <span>SMS</span>
                      </div>
                      <Button variant="ghost" size="sm">
                        {userPreferences?.methods.sms ? <Bell className="h-4 w-4" /> : <BellOff className="h-4 w-4" />}
                      </Button>
                    </div>
                    
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <Activity className="h-4 w-4" />
                        <span>In-App</span>
                      </div>
                      <Button variant="ghost" size="sm">
                        {userPreferences?.methods.inApp ? <Bell className="h-4 w-4" /> : <BellOff className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-medium">Severity Levels</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <span className="font-medium">Critical</span>
                        <p className="text-sm text-muted-foreground">Life-threatening situations</p>
                      </div>
                      <Button variant="ghost" size="sm">
                        {userPreferences?.severity.critical ? <Bell className="h-4 w-4" /> : <BellOff className="h-4 w-4" />}
                      </Button>
                    </div>
                    
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <span className="font-medium">High</span>
                        <p className="text-sm text-muted-foreground">Potentially hazardous conditions</p>
                      </div>
                      <Button variant="ghost" size="sm">
                        {userPreferences?.severity.high ? <Bell className="h-4 w-4" /> : <BellOff className="h-4 w-4" />}
                      </Button>
                    </div>
                    
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <span className="font-medium">Moderate</span>
                        <p className="text-sm text-muted-foreground">Conditions requiring attention</p>
                      </div>
                      <Button variant="ghost" size="sm">
                        {userPreferences?.severity.moderate ? <Bell className="h-4 w-4" /> : <BellOff className="h-4 w-4" />}
                      </Button>
                    </div>
                    
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <span className="font-medium">Low</span>
                        <p className="text-sm text-muted-foreground">Informational alerts</p>
                      </div>
                      <Button variant="ghost" size="sm">
                        {userPreferences?.severity.low ? <Bell className="h-4 w-4" /> : <BellOff className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Alert Settings</CardTitle>
              <CardDescription>
                Configure how alerts are generated and managed
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="space-y-4">
                  <h3 className="font-medium">Location Settings</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium">Alert Radius</label>
                      <p className="text-xs text-muted-foreground mb-2">
                        Distance from your location to receive alerts
                      </p>
                      <select className="w-full px-3 py-2 border rounded-md">
                        <option value="1">1 km</option>
                        <option value="5">5 km</option>
                        <option value="10">10 km</option>
                        <option value="25">25 km</option>
                        <option value="50">50 km</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium">Home Location</label>
                      <p className="text-xs text-muted-foreground mb-2">
                        Set your primary location for personalized alerts
                      </p>
                      <Button variant="outline" className="w-full">
                        <MapPin className="h-4 w-4 mr-2" />
                        Set Location
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-medium">Advanced Settings</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-medium">Smart Prioritization</span>
                        <p className="text-sm text-muted-foreground">
                          AI-powered alert prioritization based on your preferences
                        </p>
                      </div>
                      <Button variant="ghost" size="sm">
                        {userPreferences?.notifications.emergencyAlerts ? <Bell className="h-4 w-4" /> : <BellOff className="h-4 w-4" />}
                      </Button>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-medium">Quiet Hours</span>
                        <p className="text-sm text-muted-foreground">
                          Disable non-critical alerts during specified hours
                        </p>
                      </div>
                      <Button variant="ghost" size="sm">
                        Configure
                      </Button>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-medium">Emergency Contacts</span>
                        <p className="text-sm text-muted-foreground">
                          Share alerts with emergency contacts during critical situations
                        </p>
                      </div>
                      <Button variant="ghost" size="sm">
                        Manage
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end space-x-2">
                  <Button variant="outline">Cancel</Button>
                  <Button>Save Changes</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Alert Detail Modal */}
      {selectedAlert && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center space-x-2">
                    {getAlertIcon(selectedAlert.type)}
                    <span>{selectedAlert.title}</span>
                  </CardTitle>
                  <CardDescription>
                    {selectedAlert.description}
                  </CardDescription>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setSelectedAlert(null)}
                >
                  <XCircle className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex items-center space-x-2">
                <Badge className={getSeverityColor(selectedAlert.severity)}>
                  {selectedAlert.severity.toUpperCase()}
                </Badge>
                <Badge variant="outline" className={getStatusColor(selectedAlert.status)}>
                  {selectedAlert.status.toUpperCase()}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium mb-2">Location</h4>
                  <p className="text-sm text-muted-foreground">
                    {selectedAlert.location.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {selectedAlert.location.address}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Radius: {selectedAlert.location.radius} km
                  </p>
                </div>
                
                <div>
                  <h4 className="font-medium mb-2">Impact</h4>
                  <p className="text-sm text-muted-foreground">
                    {selectedAlert.affectedUsers.toLocaleString()} people affected
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Source: {selectedAlert.source}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Created: {new Date(selectedAlert.timestamp).toLocaleString()}
                  </p>
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-2">Recommended Actions</h4>
                <ul className="space-y-2">
                  {getRecommendations(selectedAlert).map((action, index) => (
                    <li key={index} className="flex items-start space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <span className="text-sm">{action}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h4 className="font-medium mb-2">Alert Details</h4>
                <div className="bg-gray-50 p-4 rounded-lg space-y-2 text-sm">
                  {selectedAlert.data.airQuality && (
                    <div>
                      <strong>Air Quality:</strong> AQI {selectedAlert.data.airQuality.aqi}
                      <br />
                      <strong>Pollutants:</strong> {Object.entries(selectedAlert.data.airQuality.pollutants).map(([key, value]) => `${key}: ${value}`).join(', ')}
                    </div>
                  )}
                  {selectedAlert.data.waterQuality && (
                    <div>
                      <strong>Water Quality:</strong> pH {selectedAlert.data.waterQuality.ph}
                      <br />
                      <strong>Contaminants:</strong> {selectedAlert.data.waterQuality.contaminants.join(', ')}
                    </div>
                  )}
                  {selectedAlert.data.noiseLevel && (
                    <div>
                      <strong>Noise Level:</strong> {selectedAlert.data.noiseLevel.db} dB
                      <br />
                      <strong>Source:</strong> {selectedAlert.data.noiseLevel.source}
                    </div>
                  )}
                  {selectedAlert.data.weather && (
                    <div>
                      <strong>Weather:</strong> {selectedAlert.data.weather.condition}
                      <br />
                      <strong>Temperature:</strong> {selectedAlert.data.weather.temperature}°C
                      <br />
                      <strong>Wind:</strong> {selectedAlert.data.weather.windSpeed} km/h
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setSelectedAlert(null)}>
                  Close
                </Button>
                <Button>Acknowledge Alert</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

// Helper component for sharing icon
function ShareIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg {...props} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
    </svg>
  );
}