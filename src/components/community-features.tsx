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
  Users, 
  TrendingUp, 
  Award, 
  Calendar, 
  MessageSquare, 
  Heart,
  Share2,
  BookOpen,
  Target,
  Star,
  Trophy,
  Activity,
  MapPin,
  Clock,
  Plus,
  Filter,
  Search,
  Eye,
  ThumbsUp,
  ThumbsDown,
  Flag,
  Gift,
  Leaf,
  Globe,
  Building2,
  GraduationCap
} from "lucide-react";
import { 
  LineChart, 
  Line, 
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

interface CommunityMember {
  id: string;
  name: string;
  avatar: string;
  location: string;
  joinDate: Date;
  impactScore: number;
  badges: string[];
  activities: {
    type: 'report' | 'volunteer' | 'educate' | 'advocate';
    count: number;
  }[];
}

interface Challenge {
  id: string;
  title: string;
  description: string;
  type: 'individual' | 'team' | 'community';
  duration: number; // in days
  participants: number;
  goal: string;
  impact: {
    co2Reduced: number; // in kg
    wasteReduced: number; // in kg
    energySaved: number; // in kWh
    treesPlanted: number;
  };
  progress: number; // percentage
  startDate: Date;
  endDate: Date;
  rewards: string[];
  requirements: string[];
}

interface Discussion {
  id: string;
  title: string;
  author: {
    name: string;
    avatar: string;
    role: string;
  };
  content: string;
  tags: string[];
  likes: number;
  replies: number;
  views: number;
  timestamp: Date;
  isPinned: boolean;
  isFeatured: boolean;
}

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: 'environmental' | 'community' | 'education' | 'advocacy';
  requirement: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  color: string;
}

interface LocalGroup {
  id: string;
  name: string;
  description: string;
  location: {
    name: string;
    coordinates: [number, number];
  };
  members: number;
  activities: number;
  nextEvent?: {
    title: string;
    date: Date;
    location: string;
  };
  tags: string[];
}

const COLORS = ['#00e400', '#0066cc', '#9933cc', '#ff9900', '#ff0000', '#8f3f97'];

export default function CommunityFeatures() {
  const communityStats = useQuery(api.community.getStats);
  const members = useQuery(api.community.getMembers);
  const challenges = useQuery(api.community.getChallenges);
  const discussions = useQuery(api.community.getDiscussions);
  const achievements = useQuery(api.community.getAchievements);
  const [activeTab, setActiveTab] = useState('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'environmental' | 'community' | 'education' | 'advocacy'>('all');

  // Filter discussions based on search and category
  const filteredDiscussions = discussions?.filter(discussion => {
    const matchesSearch = discussion.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         discussion.content.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || 
                            discussion.tags.some(tag => tag.toLowerCase() === selectedCategory);
    
    return matchesSearch && matchesCategory;
  }) || [];

  // Calculate community impact
  const communityImpact = {
    totalMembers: members?.length || 0,
    activeChallenges: challenges?.filter(c => c.progress < 100).length || 0,
    completedChallenges: challenges?.filter(c => c.progress === 100).length || 0,
    totalCO2Reduced: challenges?.reduce((sum, c) => sum + c.impact.co2Reduced, 0) || 0,
    totalWasteReduced: challenges?.reduce((sum, c) => sum + c.impact.wasteReduced, 0) || 0,
    totalEnergySaved: challenges?.reduce((sum, c) => sum + c.impact.energySaved, 0) || 0,
    totalTreesPlanted: challenges?.reduce((sum, c) => sum + c.impact.treesPlanted, 0) || 0,
  };

  // Get top contributors
  const topContributors = members
    ?.sort((a, b) => b.impactScore - a.impactScore)
    .slice(0, 5) || [];

  // Get active challenges
  const activeChallengesList = challenges
    ?.filter(c => c.progress < 100)
    .sort((a, b) => b.progress - a.progress)
    .slice(0, 3) || [];

  // Get achievements by rarity
  const achievementsByRarity = {
    common: achievements?.filter(a => a.rarity === 'common').length || 0,
    rare: achievements?.filter(a => a.rarity === 'rare').length || 0,
    epic: achievements?.filter(a => a.rarity === 'epic').length || 0,
    legendary: achievements?.filter(a => a.rarity === 'legendary').length || 0,
  };

  // Get challenge progress data for chart
  const challengeProgressData = challenges?.map(challenge => ({
    name: challenge.title.substring(0, 15) + '...',
    progress: challenge.progress,
    participants: challenge.participants,
  })) || [];

  return (
    <div className="space-y-6">
      {/* Community Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Community Members</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{communityImpact.totalMembers.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Active contributors
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Challenges</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{communityImpact.activeChallenges}</div>
            <p className="text-xs text-muted-foreground">
              In progress
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">CO2 Reduced</CardTitle>
            <Leaf className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{communityImpact.totalCO2Reduced.toLocaleString()} kg</div>
            <p className="text-xs text-muted-foreground">
              Total impact
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Energy Saved</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{communityImpact.totalEnergySaved.toLocaleString()} kWh</div>
            <p className="text-xs text-muted-foreground">
              Total impact
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Trees Planted</CardTitle>
            <TreeIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-700">{communityImpact.totalTreesPlanted.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Total planted
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Discussions</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{filteredDiscussions.length}</div>
            <p className="text-xs text-muted-foreground">
              Active topics
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Dashboard */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="challenges">Challenges</TabsTrigger>
          <TabsTrigger value="discussions">Discussions</TabsTrigger>
          <TabsTrigger value="achievements">Achievements</TabsTrigger>
          <TabsTrigger value="groups">Local Groups</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top Contributors */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Trophy className="h-5 w-5" />
                  <span>Top Contributors</span>
                </CardTitle>
                <CardDescription>
                  Community members making the biggest impact
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {topContributors.map((member, index) => (
                    <div key={member.id} className="flex items-center space-x-4">
                      <div className="flex items-center space-x-2">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-green-500 flex items-center justify-center text-white font-bold text-sm">
                          {member.name.charAt(0)}
                        </div>
                        <div className="flex flex-col">
                          <span className="font-medium">{member.name}</span>
                          <span className="text-xs text-muted-foreground">{member.location}</span>
                        </div>
                      </div>
                      <div className="ml-auto text-right">
                        <div className="flex items-center space-x-1">
                          <Star className="h-4 w-4 text-yellow-500" />
                          <span className="font-medium">{member.impactScore}</span>
                        </div>
                        <div className="text-xs text-muted-foreground">Impact Score</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Active Challenges */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Target className="h-5 w-5" />
                  <span>Active Challenges</span>
                </CardTitle>
                <CardDescription>
                  Current community initiatives
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {activeChallengesList.map((challenge) => (
                    <div key={challenge.id} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-medium">{challenge.title}</h4>
                        <Badge variant={challenge.type === 'individual' ? 'default' : challenge.type === 'team' ? 'secondary' : 'outline'}>
                          {challenge.type}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-3">{challenge.description}</p>
                      
                      <div className="space-y-2">
                        <div className="flex justify-between text-xs">
                          <span>Progress</span>
                          <span>{challenge.progress}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-green-500 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${challenge.progress}%` }}
                          ></div>
                        </div>
                        
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>{challenge.participants} participants</span>
                          <span>{Math.ceil((challenge.endDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} days left</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Community Impact Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Community Impact</CardTitle>
              <CardDescription>
                Environmental impact from community initiatives
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={[
                  { metric: 'CO2 Reduced', value: communityImpact.totalCO2Reduced, unit: 'kg', color: '#00e400' },
                  { metric: 'Waste Reduced', value: communityImpact.totalWasteReduced, unit: 'kg', color: '#0066cc' },
                  { metric: 'Energy Saved', value: communityImpact.totalEnergySaved, unit: 'kWh', color: '#ff9900' },
                  { metric: 'Trees Planted', value: communityImpact.totalTreesPlanted, unit: '', color: '#00aa00' },
                ]}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="metric" />
                  <YAxis />
                  <Tooltip formatter={(value, name) => [value.toLocaleString(), name]} />
                  <Bar dataKey="value" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="challenges" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Challenge List */}
            <div className="lg:col-span-2 space-y-4">
              {challenges?.map((challenge) => (
                <Card key={challenge.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <div className="flex items-center space-x-2 mb-1">
                          <h3 className="text-lg font-semibold">{challenge.title}</h3>
                          <Badge variant={challenge.type === 'individual' ? 'default' : challenge.type === 'team' ? 'secondary' : 'outline'}>
                            {challenge.type}
                          </Badge>
                        </div>
                        <p className="text-muted-foreground">{challenge.description}</p>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-green-600">{challenge.progress}%</div>
                        <div className="text-xs text-muted-foreground">Complete</div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div className="space-y-2">
                        <div className="text-sm font-medium">Impact Goals</div>
                        <ul className="text-sm text-muted-foreground space-y-1">
                          <li>• {challenge.impact.co2Reduced} kg CO2 reduced</li>
                          <li>• {challenge.impact.wasteReduced} kg waste reduced</li>
                          <li>• {challenge.impact.energySaved} kWh energy saved</li>
                          <li>• {challenge.impact.treesPlanted} trees planted</li>
                        </ul>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="text-sm font-medium">Timeline</div>
                        <div className="text-sm text-muted-foreground">
                          <div>Start: {new Date(challenge.startDate).toLocaleDateString()}</div>
                          <div>End: {new Date(challenge.endDate).toLocaleDateString()}</div>
                          <div>Days left: {Math.ceil((challenge.endDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))}</div>
                        </div>
                      </div>
                    </div>

                    <div className="mb-4">
                      <div className="flex justify-between text-sm mb-1">
                        <span>Progress</span>
                        <span>{challenge.participants} participants</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-3">
                        <div 
                          className="bg-gradient-to-r from-green-400 to-green-600 h-3 rounded-full transition-all duration-300"
                          style={{ width: `${challenge.progress}%` }}
                        ></div>
                      </div>
                    </div>

                    <div className="flex justify-between items-center">
                      <div className="flex space-x-2">
                        {challenge.rewards.slice(0, 3).map((reward, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {reward}
                          </Badge>
                        ))}
                      </div>
                      <Button size="sm">
                        {challenge.progress === 100 ? 'View Results' : 'Join Challenge'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Challenge Stats */}
            <Card>
              <CardHeader>
                <CardTitle>Challenge Statistics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h4 className="font-medium mb-3">Challenge Types</h4>
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie
                        data={[
                          { name: 'Individual', value: challenges?.filter(c => c.type === 'individual').length || 0, color: '#00e400' },
                          { name: 'Team', value: challenges?.filter(c => c.type === 'team').length || 0, color: '#0066cc' },
                          { name: 'Community', value: challenges?.filter(c => c.type === 'community').length || 0, color: '#ff9900' },
                        ]}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {['#00e400', '#0066cc', '#ff9900'].map((color, index) => (
                          <Cell key={`cell-${index}`} fill={color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm">Total Challenges</span>
                    <span className="font-medium">{challenges?.length || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Completed</span>
                    <span className="font-medium text-green-600">{communityImpact.completedChallenges}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Active</span>
                    <span className="font-medium text-orange-600">{communityImpact.activeChallenges}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Total Participants</span>
                    <span className="font-medium">
                      {challenges?.reduce((sum, c) => sum + c.participants, 0) || 0}
                    </span>
                  </div>
                </div>

                <Button className="w-full" variant="outline">
                  <Plus className="h-4 w-4 mr-2" />
                  Create New Challenge
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="discussions" className="space-y-6">
          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle>Discussion Filters</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search discussions..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value as any)}
                  className="px-3 py-2 border rounded-md"
                >
                  <option value="all">All Categories</option>
                  <option value="environmental">Environmental</option>
                  <option value="community">Community</option>
                  <option value="education">Education</option>
                  <option value="advocacy">Advocacy</option>
                </select>

                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  New Discussion
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Discussion List */}
          <div className="space-y-4">
            {filteredDiscussions.map((discussion) => (
              <Card key={discussion.id} className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-start space-x-4">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-green-500 flex items-center justify-center text-white font-bold">
                        {discussion.author.name.charAt(0)}
                      </div>
                      <div>
                        <div className="flex items-center space-x-2 mb-1">
                          <h3 className="font-semibold">{discussion.title}</h3>
                          {discussion.isPinned && <Badge variant="secondary">Pinned</Badge>}
                          {discussion.isFeatured && <Badge className="bg-yellow-100 text-yellow-800">Featured</Badge>}
                        </div>
                        <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                          <span>By {discussion.author.name}</span>
                          <span>{discussion.author.role}</span>
                          <span>{new Date(discussion.timestamp).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4 text-right text-sm text-muted-foreground">
                      <div className="flex items-center space-x-1">
                        <Eye className="h-4 w-4" />
                        <span>{discussion.views}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <MessageSquare className="h-4 w-4" />
                        <span>{discussion.replies}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <ThumbsUp className="h-4 w-4" />
                        <span>{discussion.likes}</span>
                      </div>
                    </div>
                  </div>

                  <p className="text-muted-foreground mb-4 line-clamp-2">
                    {discussion.content}
                  </p>

                  <div className="flex items-center justify-between">
                    <div className="flex flex-wrap gap-2">
                      {discussion.tags.slice(0, 3).map((tag, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          #{tag}
                        </Badge>
                      ))}
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button variant="ghost" size="sm">
                        <ThumbsUp className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <MessageSquare className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Share2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="achievements" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Achievements Grid */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Available Achievements</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {achievements?.map((achievement) => (
                  <Card key={achievement.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-center space-x-3">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center ${achievement.color}`}>
                          {getAchievementIcon(achievement.category)}
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium">{achievement.title}</h4>
                          <div className="flex items-center space-x-2">
                            <Badge variant="outline" className="text-xs">
                              {achievement.rarity}
                            </Badge>
                            <Badge variant="secondary" className="text-xs">
                              {achievement.category}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground mt-3">
                        {achievement.description}
                      </p>
                      <div className="mt-3">
                        <div className="text-xs text-muted-foreground">Requirement:</div>
                        <div className="text-sm font-medium">{achievement.requirement}</div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Achievements Stats */}
            <Card>
              <CardHeader>
                <CardTitle>Achievement Statistics</CardTitle>
                <CardDescription>
                  Community achievement distribution
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie
                        data={[
                          { name: 'Common', value: achievementsByRarity.common, color: '#808080' },
                          { name: 'Rare', value: achievementsByRarity.rare, color: '#0066cc' },
                          { name: 'Epic', value: achievementsByRarity.epic, color: '#9933cc' },
                          { name: 'Legendary', value: achievementsByRarity.legendary, color: '#ff9900' },
                        ]}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {['#808080', '#0066cc', '#9933cc', '#ff9900'].map((color, index) => (
                          <Cell key={`cell-${index}`} fill={color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm">Total Achievements</span>
                    <span className="font-medium">{achievements?.length || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Earned by Community</span>
                    <span className="font-medium text-green-600">
                      {Math.floor((achievements?.length || 0) * 0.7)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Rare & Above</span>
                    <span className="font-medium text-blue-600">
                      {achievementsByRarity.rare + achievementsByRarity.epic + achievementsByRarity.legendary}
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="font-medium">Most Earned</h4>
                  <div className="space-y-2">
                    {achievements
                      ?.sort((a, b) => Math.random() - 0.5) // Random for demo
                      .slice(0, 3)
                      .map((achievement) => (
                        <div key={achievement.id} className="flex items-center justify-between text-sm">
                          <span>{achievement.title}</span>
                          <div className="flex items-center space-x-1">
                            <Star className="h-3 w-3 text-yellow-500" />
                            <span>{Math.floor(Math.random() * 1000) + 100}</span>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="groups" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Groups List */}
            <div className="lg:col-span-2 space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Local Environmental Groups</h3>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Group
                </Button>
              </div>

              {Array.from({ length: 6 }, (_, i) => ({
                id: `group-${i}`,
                name: `Green ${['City', 'Valley', 'Hills', 'Lakes', 'Forest', 'Meadows'][i]} Initiative`,
                description: `Community group focused on local environmental sustainability and conservation efforts in the ${['City', 'Valley', 'Hills', 'Lakes', 'Forest', 'Meadows'][i]} area.`,
                location: { name: `${['City', 'Valley', 'Hills', 'Lakes', 'Forest', 'Meadows'][i]} Area`, coordinates: [40.7128 + i * 0.1, -74.0060 + i * 0.1] },
                members: Math.floor(Math.random() * 500) + 50,
                activities: Math.floor(Math.random() * 20) + 5,
                nextEvent: {
                  title: `Monthly ${['Cleanup', 'Planting', 'Education', 'Advocacy', 'Conservation', 'Restoration'][i]} Drive`,
                  date: new Date(Date.now() + Math.random() * 30 * 24 * 60 * 60 * 1000),
                  location: `${['Central Park', 'Riverside', 'Hillside', 'Lakeside', 'Forest Reserve', 'Community Center'][i]}`
                },
                tags: ['environmental', 'community', 'sustainability', 'conservation']
              })).map((group) => (
                <Card key={group.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-semibold mb-1">{group.name}</h3>
                        <p className="text-muted-foreground mb-2">{group.description}</p>
                        <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                          <div className="flex items-center space-x-1">
                            <MapPin className="h-4 w-4" />
                            <span>{group.location.name}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Users className="h-4 w-4" />
                            <span>{group.members} members</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Calendar className="h-4 w-4" />
                            <span>{group.activities} activities</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {group.nextEvent && (
                      <div className="bg-blue-50 p-4 rounded-lg mb-4">
                        <div className="flex items-center space-x-2 mb-2">
                          <Calendar className="h-4 w-4 text-blue-600" />
                          <span className="font-medium text-blue-900">Next Event</span>
                        </div>
                        <h4 className="font-medium">{group.nextEvent.title}</h4>
                        <div className="text-sm text-blue-700">
                          <div>{new Date(group.nextEvent.date).toLocaleDateString()} at {new Date(group.nextEvent.date).toLocaleTimeString()}</div>
                          <div>Location: {group.nextEvent.location}</div>
                        </div>
                      </div>
                    )}

                    <div className="flex items-center justify-between">
                      <div className="flex flex-wrap gap-2">
                        {group.tags.slice(0, 3).map((tag, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            #{tag}
                          </Badge>
                        ))}
                      </div>
                      <Button size="sm">
                        Join Group
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Groups Map */}
            <Card>
              <CardHeader>
                <CardTitle>Groups Map</CardTitle>
                <CardDescription>
                  Local environmental groups in your area
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-96 bg-gray-100 rounded-lg flex items-center justify-center">
                  <div className="text-center text-muted-foreground">
                    <Globe className="h-12 w-12 mx-auto mb-2" />
                    <p>Interactive Map View</p>
                    <p className="text-sm">Showing all local groups</p>
                  </div>
                </div>
                <div className="mt-4 space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>Total Groups</span>
                    <span className="font-medium">24</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span>Active Groups</span>
                    <span className="font-medium text-green-600">18</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span>Total Members</span>
                    <span className="font-medium">3,847</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Helper icons
function TreeIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg {...props} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
    </svg>
  );
}

function getAchievementIcon(category: string) {
  switch (category) {
    case 'environmental':
      return <Leaf className="h-6 w-6" />;
    case 'community':
      return <Users className="h-6 w-6" />;
    case 'education':
      return <BookOpen className="h-6 w-6" />;
    case 'advocacy':
      return <Building2 className="h-6 w-6" />;
    default:
      return <Award className="h-6 w-6" />;
  }
}