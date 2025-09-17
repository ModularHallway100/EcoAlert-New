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
  BookOpen, 
  GraduationCap, 
  Video, 
  FileText, 
  Podcast, 
  Users, 
  Clock, 
  Star,
  Search,
  Filter,
  PlayCircle,
  Download,
  Share2,
  Heart,
  Bookmark,
  Award,
  TrendingUp,
  Globe,
  Leaf,
  Droplets,
  Thermometer,
  Volume2,
  ChevronRight,
  Calendar,
  MapPin,
  Eye,
  MessageSquare
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
  ResponsiveContainer
} from "recharts";

interface EducationalContent {
  id: string;
  title: string;
  description: string;
  type: 'article' | 'video' | 'infographic' | 'course' | 'podcast' | 'interactive';
  category: 'air' | 'water' | 'noise' | 'general' | 'climate' | 'health' | 'technology';
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  duration?: number; // in minutes
  author: {
    name: string;
    avatar: string;
    credentials: string[];
  };
  tags: string[];
  rating: number;
  views: number;
  likes: number;
  bookmarks: number;
  publishDate: Date;
  lastUpdated: Date;
  content: {
    url: string;
    thumbnail?: string;
    transcript?: string;
    downloadable?: boolean;
    size?: string;
  };
  progress?: number; // for courses
  modules?: Array<{
    title: string;
    duration: number;
    completed: boolean;
  }>;
}

interface Course {
  id: string;
  title: string;
  description: string;
  instructor: string;
  duration: number; // in hours
  modules: number;
  level: 'beginner' | 'intermediate' | 'advanced';
  enrolled: number;
  rating: number;
  progress?: number;
  thumbnail: string;
  syllabus: Array<{
    title: string;
    description: string;
    duration: number;
    lessons: number;
  }>;
}

interface Certification {
  id: string;
  name: string;
  organization: string;
  description: string;
  requirements: string[];
  duration: string; // e.g., "8 weeks"
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  industryRecognition: number; // 1-5 stars
  cost?: number;
  format: 'online' | 'in-person' | 'hybrid';
  startDate?: Date;
  endDate?: Date;
}

interface Quiz {
  id: string;
  title: string;
  description: string;
  category: string;
  questions: number;
  timeLimit?: number; // in minutes
  difficulty: 'easy' | 'medium' | 'hard';
  passingScore: number;
  retakesAllowed: number;
  completed: boolean;
  score?: number;
}

const COLORS = ['#00e400', '#0066cc', '#9933cc', '#ff9900', '#ff0000'];

export default function EducationalContent() {
  const content = useQuery(api.educational.getContent);
  const courses = useQuery(api.educational.getCourses);
  const certifications = useQuery(api.educational.getCertifications);
  const quizzes = useQuery(api.educational.getQuizzes);
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'air' | 'water' | 'noise' | 'general' | 'climate' | 'health' | 'technology'>('all');
  const [selectedType, setSelectedType] = useState<'all' | 'article' | 'video' | 'infographic' | 'course' | 'podcast' | 'interactive'>('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState<'all' | 'beginner' | 'intermediate' | 'advanced'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('browse');

  // Filter content based on filters
  const filteredContent = content?.filter(item => {
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    const matchesType = selectedType === 'all' || item.type === selectedType;
    const matchesDifficulty = selectedDifficulty === 'all' || item.difficulty === selectedDifficulty;
    const matchesSearch = item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    
    return matchesCategory && matchesType && matchesDifficulty && matchesSearch;
  }) || [];

  // Get popular content
  const popularContent = content
    ?.sort((a, b) => b.views - a.views)
    .slice(0, 4) || [];

  // Get recent content
  const recentContent = content
    ?.sort((a, b) => new Date(b.publishDate).getTime() - new Date(a.publishDate).getTime())
    .slice(0, 4) || [];

  // Get content by category stats
  const contentByCategory = {
    air: content?.filter(c => c.category === 'air').length || 0,
    water: content?.filter(c => c.category === 'water').length || 0,
    noise: content?.filter(c => c.category === 'noise').length || 0,
    general: content?.filter(c => c.category === 'general').length || 0,
    climate: content?.filter(c => c.category === 'climate').length || 0,
    health: content?.filter(c => c.category === 'health').length || 0,
    technology: content?.filter(c => c.category === 'technology').length || 0,
  };

  // Get learning progress data
  const learningProgressData = [
    { month: 'Jan', completed: 12 },
    { month: 'Feb', completed: 19 },
    { month: 'Mar', completed: 25 },
    { month: 'Apr', completed: 32 },
    { month: 'May', completed: 28 },
    { month: 'Jun', completed: 35 },
  ];

  // Get category icon
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'air': return <Thermometer className="h-5 w-5" />;
      case 'water': return <Droplets className="h-5 w-5" />;
      case 'noise': return <Volume2 className="h-5 w-5" />;
      case 'climate': return <Globe className="h-5 w-5" />;
      case 'health': return <Heart className="h-5 w-5" />;
      case 'technology': return <Leaf className="h-5 w-5" />;
      default: return <BookOpen className="h-5 w-5" />;
    }
  };

  // Get type icon
  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'article': return <FileText className="h-4 w-4" />;
      case 'video': return <Video className="h-4 w-4" />;
      case 'infographic': return <FileText className="h-4 w-4" />;
      case 'course': return <GraduationCap className="h-4 w-4" />;
      case 'podcast': return <Podcast className="h-4 w-4" />;
      case 'interactive': return <PlayCircle className="h-4 w-4" />;
      default: return <BookOpen className="h-4 w-4" />;
    }
  };

  // Get difficulty color
  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'bg-green-100 text-green-800';
      case 'intermediate': return 'bg-yellow-100 text-yellow-800';
      case 'advanced': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Learning Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Content Available</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{content?.length || 0}</div>
            <p className="text-xs text-muted-foreground">
              Educational resources
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Courses</CardTitle>
            <GraduationCap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{courses?.length || 0}</div>
            <p className="text-xs text-muted-foreground">
              Online courses
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Certifications</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{certifications?.length || 0}</div>
            <p className="text-xs text-muted-foreground">
              Professional certs
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Quizzes</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{quizzes?.length || 0}</div>
            <p className="text-xs text-muted-foreground">
              Knowledge tests
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Dashboard */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="browse">Browse</TabsTrigger>
          <TabsTrigger value="courses">Courses</TabsTrigger>
          <TabsTrigger value="certifications">Certifications</TabsTrigger>
          <TabsTrigger value="quizzes">Quizzes</TabsTrigger>
          <TabsTrigger value="my-learning">My Learning</TabsTrigger>
        </TabsList>

        <TabsContent value="browse" className="space-y-6">
          {/* Content Categories Overview */}
          <Card>
            <CardHeader>
              <CardTitle>Content Categories</CardTitle>
              <CardDescription>
                Educational resources by environmental topic
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={[
                  { category: 'Air Quality', count: contentByCategory.air, color: COLORS[0] },
                  { category: 'Water Quality', count: contentByCategory.water, color: COLORS[1] },
                  { category: 'Noise Pollution', count: contentByCategory.noise, color: COLORS[2] },
                  { category: 'General', count: contentByCategory.general, color: COLORS[3] },
                  { category: 'Climate', count: contentByCategory.climate, color: COLORS[4] },
                  { category: 'Health', count: contentByCategory.health, color: COLORS[5] },
                  { category: 'Technology', count: contentByCategory.technology, color: COLORS[6] },
                ]}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="category" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Filters */}
            <Card>
              <CardHeader>
                <CardTitle>Filters</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Search</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search content..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Category</label>
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value as any)}
                    className="w-full px-3 py-2 border rounded-md"
                  >
                    <option value="all">All Categories</option>
                    <option value="air">Air Quality</option>
                    <option value="water">Water Quality</option>
                    <option value="noise">Noise Pollution</option>
                    <option value="general">General</option>
                    <option value="climate">Climate</option>
                    <option value="health">Health</option>
                    <option value="technology">Technology</option>
                  </select>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Content Type</label>
                  <select
                    value={selectedType}
                    onChange={(e) => setSelectedType(e.target.value as any)}
                    className="w-full px-3 py-2 border rounded-md"
                  >
                    <option value="all">All Types</option>
                    <option value="article">Articles</option>
                    <option value="video">Videos</option>
                    <option value="infographic">Infographics</option>
                    <option value="course">Courses</option>
                    <option value="podcast">Podcasts</option>
                    <option value="interactive">Interactive</option>
                  </select>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Difficulty</label>
                  <select
                    value={selectedDifficulty}
                    onChange={(e) => setSelectedDifficulty(e.target.value as any)}
                    className="w-full px-3 py-2 border rounded-md"
                  >
                    <option value="all">All Levels</option>
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                  </select>
                </div>

                <Button className="w-full">Reset Filters</Button>
              </CardContent>
            </Card>

            {/* Content List */}
            <div className="lg:col-span-2 space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">
                  Educational Content ({filteredContent.length})
                </h3>
                <div className="flex items-center space-x-2">
                  <Button variant="outline" size="sm">
                    <Filter className="h-4 w-4 mr-2" />
                    Filter
                  </Button>
                </div>
              </div>

              <div className="space-y-4">
                {filteredContent.map((item) => (
                  <Card key={item.id} className="hover:shadow-md transition-shadow cursor-pointer">
                    <CardContent className="p-6">
                      <div className="flex items-start space-x-4">
                        <div className="flex-shrink-0">
                          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-green-500 rounded-lg flex items-center justify-center">
                            {getTypeIcon(item.type)}
                          </div>
                        </div>
                        
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-2">
                            <h3 className="font-semibold text-lg">{item.title}</h3>
                            <div className="flex items-center space-x-1">
                              <Star className="h-4 w-4 text-yellow-500" />
                              <span className="text-sm">{item.rating.toFixed(1)}</span>
                            </div>
                          </div>
                          
                          <p className="text-muted-foreground mb-3">{item.description}</p>
                          
                          <div className="flex items-center space-x-4 text-sm text-muted-foreground mb-3">
                            <div className="flex items-center space-x-1">
                              <Clock className="h-4 w-4" />
                              <span>{item.duration} min</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <Eye className="h-4 w-4" />
                              <span>{item.views.toLocaleString()} views</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <Heart className="h-4 w-4" />
                              <span>{item.likes.toLocaleString()}</span>
                            </div>
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <Badge className={getDifficultyColor(item.difficulty)}>
                                {item.difficulty}
                              </Badge>
                              <div className="flex items-center space-x-1 text-sm">
                                {getCategoryIcon(item.category)}
                                <span className="capitalize">{item.category}</span>
                              </div>
                            </div>
                            
                            <div className="flex items-center space-x-2">
                              <Button variant="outline" size="sm">
                                <Bookmark className="h-4 w-4" />
                              </Button>
                              <Button size="sm">
                                {item.type === 'video' ? 'Watch' : 'Read'}
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="courses" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Courses Grid */}
            <div className="lg:col-span-2 space-y-6">
              {courses?.map((course) => (
                <Card key={course.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start space-x-4">
                      <div className="flex-shrink-0">
                        <div className="w-24 h-16 bg-gradient-to-br from-purple-500 to-blue-500 rounded-lg flex items-center justify-center">
                          <GraduationCap className="h-8 w-8 text-white" />
                        </div>
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h3 className="font-semibold text-lg">{course.title}</h3>
                            <p className="text-sm text-muted-foreground">by {course.instructor}</p>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Star className="h-4 w-4 text-yellow-500" />
                            <span className="text-sm">{course.rating.toFixed(1)}</span>
                          </div>
                        </div>
                        
                        <p className="text-muted-foreground mb-4">{course.description}</p>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                          <div className="text-center">
                            <div className="text-2xl font-bold text-blue-600">{course.duration}h</div>
                            <div className="text-xs text-muted-foreground">Duration</div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold text-green-600">{course.modules}</div>
                            <div className="text-xs text-muted-foreground">Modules</div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold text-purple-600">{course.enrolled.toLocaleString()}</div>
                            <div className="text-xs text-muted-foreground">Enrolled</div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold text-orange-600">{course.level}</div>
                            <div className="text-xs text-muted-foreground">Level</div>
                          </div>
                        </div>
                        
                        {course.progress !== undefined && (
                          <div className="mb-4">
                            <div className="flex justify-between text-sm mb-1">
                              <span>Your Progress</span>
                              <span>{course.progress}%</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                                style={{ width: `${course.progress}%` }}
                              ></div>
                            </div>
                          </div>
                        )}
                        
                        <div className="flex justify-between items-center">
                          <Button>
                            {course.progress ? 'Continue' : 'Enroll Now'}
                          </Button>
                          <Button variant="outline" size="sm">
                            <Share2 className="h-4 w-4 mr-2" />
                            Share
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Course Stats */}
            <Card>
              <CardHeader>
                <CardTitle>Course Statistics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h4 className="font-medium mb-3">Enrollment Trends</h4>
                  <ResponsiveContainer width="100%" height={200}>
                    <LineChart data={learningProgressData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip />
                      <Line type="monotone" dataKey="completed" stroke="#8884d8" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm">Total Courses</span>
                    <span className="font-medium">{courses?.length || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Enrolled</span>
                    <span className="font-medium text-blue-600">
                      {courses?.reduce((sum, c) => sum + (c.progress ? 1 : 0), 0) || 0}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Completed</span>
                    <span className="font-medium text-green-600">
                      {courses?.reduce((sum, c) => sum + (c.progress === 100 ? 1 : 0), 0) || 0}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Avg Rating</span>
                    <span className="font-medium">
                      {(courses?.reduce((sum, c) => sum + c.rating, 0) / (courses?.length || 1)).toFixed(1)}
                    </span>
                  </div>
                </div>

                <Button className="w-full" variant="outline">
                  <GraduationCap className="h-4 w-4 mr-2" />
                  View All Courses
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="certifications" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Certifications List */}
            <div className="lg:col-span-2 space-y-4">
              {certifications?.map((cert) => (
                <Card key={cert.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-xl font-semibold mb-1">{cert.name}</h3>
                        <p className="text-muted-foreground mb-2">{cert.organization}</p>
                        <p className="text-sm">{cert.description}</p>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center space-x-1 mb-1">
                          <Star className="h-4 w-4 text-yellow-500" />
                          <span className="font-medium">{cert.industryRecognition}/5</span>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Industry Recognition
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <h4 className="font-medium mb-2">Requirements</h4>
                        <ul className="text-sm text-muted-foreground space-y-1">
                          {cert.requirements.slice(0, 3).map((req, index) => (
                            <li key={index}>• {req}</li>
                          ))}
                        </ul>
                      </div>
                      
                      <div>
                        <h4 className="font-medium mb-2">Details</h4>
                        <div className="text-sm text-muted-foreground space-y-1">
                          <div>Duration: {cert.duration}</div>
                          <div>Difficulty: {cert.difficulty}</div>
                          <div>Format: {cert.format}</div>
                          {cert.cost && <div>Cost: ${cert.cost}</div>}
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-between items-center">
                      <div className="flex items-center space-x-2">
                        <Badge className={getDifficultyColor(cert.difficulty)}>
                          {cert.difficulty}
                        </Badge>
                        <Badge variant="outline">{cert.format}</Badge>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        {cert.cost && (
                          <span className="text-lg font-bold text-green-600">${cert.cost}</span>
                        )}
                        <Button size="sm">
                          Learn More
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Certification Stats */}
            <Card>
              <CardHeader>
                <CardTitle>Certification Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm">Available Certs</span>
                    <span className="font-medium">{certifications?.length || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Free Options</span>
                    <span className="font-medium text-green-600">
                      {certifications?.filter(c => !c.cost).length || 0}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Avg. Cost</span>
                    <span className="font-medium">
                      ${Math.round(certifications?.filter(c => c.cost).reduce((sum, c) => sum + (c.cost || 0), 0) / (certifications?.filter(c => c.cost).length || 1) || 0)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Avg. Rating</span>
                    <span className="font-medium">
                      {(certifications?.reduce((sum, c) => sum + c.industryRecognition, 0) / (certifications?.length || 1)).toFixed(1)}/5
                    </span>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-3">By Category</h4>
                  <div className="space-y-2">
                    {Object.entries({
                      environmental: Math.floor(Math.random() * 10) + 5,
                      technical: Math.floor(Math.random() * 8) + 3,
                      management: Math.floor(Math.random() * 6) + 2,
                      health: Math.floor(Math.random() * 4) + 1,
                    }).map(([category, count]) => (
                      <div key={category} className="flex justify-between text-sm">
                        <span className="capitalize">{category}</span>
                        <span>{count}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <Button className="w-full">
                  <Award className="h-4 w-4 mr-2" />
                  Explore Certifications
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="quizzes" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Quizzes Grid */}
            <div className="lg:col-span-2 space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Knowledge Assessments</h3>
                <Button>
                  <PlayCircle className="h-4 w-4 mr-2" />
                  Take Quiz
                </Button>
              </div>

              {quizzes?.map((quiz) => (
                <Card key={quiz.id} className={`hover:shadow-md transition-shadow ${quiz.completed ? 'border-green-200' : ''}`}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <div className="flex items-center space-x-2 mb-1">
                          <h3 className="font-semibold text-lg">{quiz.title}</h3>
                          {quiz.completed && (
                            <Badge className="bg-green-100 text-green-800">Completed</Badge>
                          )}
                        </div>
                        <p className="text-muted-foreground">{quiz.description}</p>
                      </div>
                      {quiz.score && (
                        <div className="text-right">
                          <div className="text-2xl font-bold text-green-600">{quiz.score}%</div>
                          <div className="text-xs text-muted-foreground">Score</div>
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      <div className="text-center">
                        <div className="text-lg font-bold">{quiz.questions}</div>
                        <div className="text-xs text-muted-foreground">Questions</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold capitalize">{quiz.difficulty}</div>
                        <div className="text-xs text-muted-foreground">Difficulty</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold">{quiz.passingScore}%</div>
                        <div className="text-xs text-muted-foreground">Passing</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold">{quiz.retakesAllowed}</div>
                        <div className="text-xs text-muted-foreground">Retakes</div>
                      </div>
                    </div>

                    <div className="flex justify-between items-center">
                      <div className="text-sm text-muted-foreground">
                        {quiz.completed ? 'Completed on ' + new Date().toLocaleDateString() : 'Not started'}
                      </div>
                      
                      <Button 
                        variant={quiz.completed ? "outline" : "default"}
                        size="sm"
                      >
                        {quiz.completed ? 'Review Results' : 'Start Quiz'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Quiz Stats */}
            <Card>
              <CardHeader>
                <CardTitle>Quiz Statistics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm">Total Quizzes</span>
                    <span className="font-medium">{quizzes?.length || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Completed</span>
                    <span className="font-medium text-green-600">
                      {quizzes?.filter(q => q.completed).length || 0}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Avg. Score</span>
                    <span className="font-medium">
                      {Math.round(quizzes?.filter(q => q.completed).reduce((sum, q) => sum + (q.score || 0), 0) / (quizzes?.filter(q => q.completed).length || 1) || 0)}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Passed</span>
                    <span className="font-medium text-blue-600">
                      {quizzes?.filter(q => q.completed && (q.score || 0) >= q.passingScore).length || 0}
                    </span>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-3">By Difficulty</h4>
                  <div className="space-y-2">
                    {['easy', 'medium', 'hard'].map((difficulty) => (
                      <div key={difficulty} className="flex justify-between text-sm">
                        <span className="capitalize">{difficulty}</span>
                        <span>{quizzes?.filter(q => q.difficulty === difficulty).length || 0}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-medium mb-2 mb-0 text-blue-900">Next Quiz Available</h4>
                  <p className="text-sm text-blue-700 mb-2">Air Quality Fundamentals</p>
                  <p className="text-xs text-blue-600">15 questions • 10 minutes • Easy</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="my-learning" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Learning Progress */}
            <Card>
              <CardHeader>
                <CardTitle>Learning Progress</CardTitle>
                <CardDescription>
                  Your educational journey overview
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h4 className="font-medium mb-3">Completed Content</h4>
                  <ResponsiveContainer width="100%" height={200}>
                    <LineChart data={learningProgressData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip />
                      <Line type="monotone" dataKey="completed" stroke="#8884d8" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm">Courses Completed</span>
                    <span className="font-medium text-green-600">
                      {courses?.filter(c => c.progress === 100).length || 0}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Quizzes Passed</span>
                    <span className="font-medium text-blue-600">
                      {quizzes?.filter(q => q.completed && (q.score || 0) >= q.passingScore).length || 0}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Certificates Earned</span>
                    <span className="font-medium text-purple-600">3</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Learning Streak</span>
                    <span className="font-medium text-orange-600">7 days</span>
                  </div>
                </div>

                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <Award className="h-5 w-5 text-green-600" />
                    <span className="font-medium text-green-900">Next Achievement</span>
                  </div>
                  <p className="text-sm text-green-700">Complete 2 more courses to earn "Scholar" badge</p>
                </div>
              </CardContent>
            </Card>

            {/* Currently Learning */}
            <div className="lg:col-span-2 space-y-4">
              <h3 className="text-lg font-semibold">Currently Learning</h3>

              {courses?.filter(c => c.progress && c.progress > 0 && c.progress < 100).map((course) => (
                <Card key={course.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start space-x-4">
                      <div className="flex-shrink-0">
                        <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-blue-500 rounded-lg flex items-center justify-center">
                          <GraduationCap className="h-8 w-8 text-white" />
                        </div>
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h3 className="font-semibold text-lg">{course.title}</h3>
                            <p className="text-sm text-muted-foreground">by {course.instructor}</p>
                          </div>
                          <div className="text-right">
                            <div className="text-2xl font-bold text-blue-600">{course.progress}%</div>
                            <div className="text-xs text-muted-foreground">Complete</div>
                          </div>
                        </div>
                        
                        <div className="mb-4">
                          <div className="flex justify-between text-sm mb-1">
                            <span>Progress</span>
                            <span>{course.progress}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                              style={{ width: `${course.progress}%` }}
                            ></div>
                          </div>
                        </div>
                        
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">
                            {Math.round((course.duration * (course.progress / 100)))}h of {course.duration}h completed
                          </span>
                          <Button size="sm">
                            Continue Learning
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {(!courses || !courses.filter(c => c.progress && c.progress > 0 && c.progress < 100).length) && (
                <Card>
                  <CardContent className="p-12 text-center">
                    <BookOpen className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-lg font-semibold mb-2">No Active Courses</h3>
                    <p className="text-muted-foreground mb-4">
                      You're not currently enrolled in any courses. Start learning by browsing our educational content!
                    </p>
                    <Button>
                      Browse Courses
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}