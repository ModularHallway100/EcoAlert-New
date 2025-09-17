import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // Environmental data tables
  environmentalData: defineTable({
    sensorId: v.string(),
    location: v.object({ lat: v.number(), lng: v.number() }),
    timestamp: v.number(),
    temperature: v.optional(v.number()),
    humidity: v.optional(v.number()),
    airQuality: v.optional(v.number()),
    waterQuality: v.optional(v.number()),
    noiseLevel: v.optional(v.number()),
    soilMoisture: v.optional(v.number()),
    uvIndex: v.optional(v.number()),
    windSpeed: v.optional(v.number()),
    windDirection: v.optional(v.number()),
    pressure: v.optional(v.number()),
    precipitation: v.optional(v.number()),
    dataQuality: v.number(),
    verified: v.boolean(),
    processedAt: v.number(),
  })
    .index("by_sensor_time", ["sensorId", "timestamp"])
    .index("by_location", ["location.lat", "location.lng"])
    .index("by_timestamp", ["timestamp"]),

  // User management tables
  users: defineTable({
    clerkId: v.string(),
    email: v.string(),
    name: v.string(),
    avatar: v.optional(v.string()),
    role: v.string(),
    preferences: v.object({
      notifications: v.boolean(),
      language: v.string(),
      location: v.optional(v.object({ lat: v.number(), lng: v.number() })),
      units: v.string(),
      theme: v.string(),
      privacy: v.object({
        shareData: v.boolean(),
        showProfile: v.boolean(),
        allowContact: v.boolean(),
      }),
    }),
    statistics: v.object({
      joinDate: v.number(),
      contributions: v.number(),
      challengesCompleted: v.number(),
      points: v.number(),
      badges: v.array(v.string()),
      lastActive: v.number(),
    }),
    isActive: v.boolean(),
    emailVerified: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_clerk_id", ["clerkId"])
    .index("by_email", ["email"])
    .index("by_role", ["role"]),

  // Community tables
  communityMembers: defineTable({
    userId: v.id("users"),
    communityId: v.string(),
    role: v.string(),
    joinedAt: v.number(),
    isActive: v.boolean(),
    contributionLevel: v.string(),
    permissions: v.array(v.string()),
    profile: v.object({
      bio: v.optional(v.string()),
      skills: v.array(v.string()),
      interests: v.array(v.string()),
      location: v.optional(v.string()),
      website: v.optional(v.string()),
      socialLinks: v.optional(v.object({
        twitter: v.optional(v.string()),
        linkedin: v.optional(v.string()),
        github: v.optional(v.string()),
        instagram: v.optional(v.string()),
      })),
    }),
  })
    .index("by_user_id", ["userId"])
    .index("by_community_id", ["communityId"])
    .index("by_user_community", ["userId", "communityId"]),

  challenges: defineTable({
    title: v.string(),
    description: v.string(),
    imageUrl: v.optional(v.string()),
    category: v.string(),
    difficulty: v.string(),
    duration: v.number(),
    maxParticipants: v.optional(v.number()),
    startDate: v.number(),
    endDate: v.number(),
    requirements: v.array(v.string()),
    rewards: v.array(v.string()),
    status: v.string(),
    createdBy: v.id("users"),
    participants: v.array(v.id("users")),
    participantCount: v.number(),
    tags: v.array(v.string()),
    location: v.optional(v.object({ lat: v.number(), lng: v.number() })),
    isPublic: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_category", ["category"])
    .index("by_status", ["status"])
    .index("by_created_by", ["createdBy"])
    .index("by_dates", ["startDate", "endDate"]),

  discussions: defineTable({
    title: v.string(),
    content: v.string(),
    authorId: v.id("users"),
    communityId: v.string(),
    challengeId: v.optional(v.id("challenges")),
    category: v.string(),
    tags: v.array(v.string()),
    images: v.array(v.string()),
    isPinned: v.boolean(),
    isLocked: v.boolean(),
    viewCount: v.number(),
    likeCount: v.number(),
    commentCount: v.number(),
    status: v.string(),
    lastActivity: v.number(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_author_id", ["authorId"])
    .index("by_community_id", ["communityId"])
    .index("by_challenge_id", ["challengeId"])
    .index("by_category", ["category"])
    .index("by_status", ["status"])
    .index("by_dates", ["createdAt", "updatedAt"]),

  comments: defineTable({
    content: v.string(),
    authorId: v.id("users"),
    discussionId: v.id("discussions"),
    parentId: v.optional(v.id("comments")),
    likes: v.number(),
    isAnswer: v.boolean(),
    isReported: v.boolean(),
    status: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_author_id", ["authorId"])
    .index("by_discussion_id", ["discussionId"])
    .index("by_parent_id", ["parentId"])
    .index("by_status", ["status"]),
  
  // Educational content tables
  educationalContent: defineTable({
    title: v.string(),
    description: v.string(),
    content: v.string(),
    type: v.string(),
    category: v.string(),
    difficulty: v.string(),
    duration: v.number(),
    authorId: v.id("users"),
    tags: v.array(v.string()),
    imageUrl: v.optional(v.string()),
    videoUrl: v.optional(v.string()),
    pdfUrl: v.optional(v.string()),
    audioUrl: v.optional(v.string()),
    relatedContent: v.array(v.string()),
    prerequisites: v.array(v.string()),
    learningObjectives: v.array(v.string()),
    resources: v.array(v.string()),
    status: v.string(),
    publishedAt: v.optional(v.number()),
    viewCount: v.number(),
    likeCount: v.number(),
    completionRate: v.number(),
    rating: v.number(),
    isPremium: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_author_id", ["authorId"])
    .index("by_type", ["type"])
    .index("by_category", ["category"])
    .index("by_status", ["status"])
    .index("by_published", ["publishedAt"])
    .index("by_popularity", ["viewCount", "likeCount"]),

  courses: defineTable({
    title: v.string(),
    description: v.string(),
    outline: v.array(v.string()),
    modules: v.array(v.id("educationalContent")),
    instructorId: v.id("users"),
    category: v.string(),
    difficulty: v.string(),
    duration: v.number(),
    prerequisites: v.array(v.string()),
    learningOutcomes: v.array(v.string()),
    tags: v.array(v.string()),
    imageUrl: v.optional(v.string()),
    status: v.string(),
    publishedAt: v.optional(v.number()),
    enrollmentCount: v.number(),
    completionRate: v.number(),
    rating: v.number(),
    price: v.optional(v.number()),
    currency: v.string(),
    isPremium: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_instructor_id", ["instructorId"])
    .index("by_category", ["category"])
    .index("by_status", ["status"])
    .index("by_published", ["publishedAt"])
    .index("by_popularity", ["enrollmentCount", "rating"]),

  courseEnrollments: defineTable({
    userId: v.id("users"),
    courseId: v.id("courses"),
    progress: v.number(),
    completedAt: v.optional(v.number()),
    certificateId: v.optional(v.string()),
    enrollmentDate: v.number(),
    lastAccessed: v.number(),
    status: v.string(),
    notes: v.optional(v.string()),
    bookmarks: v.array(v.id("educationalContent")),
  })
    .index("by_user_id", ["userId"])
    .index("by_course_id", ["courseId"])
    .index("by_user_course", ["userId", "courseId"])
    .index("by_status", ["status"]),
  
  // Emergency alerts tables
  emergencyAlerts: defineTable({
    title: v.string(),
    description: v.string(),
    type: v.string(),
    severity: v.string(),
    location: v.object({ lat: v.number(), lng: v.number() }),
    radius: v.number(),
    affectedAreas: v.array(v.string()),
    recommendedActions: v.array(v.string()),
    contactInfo: v.string(),
    isPublished: v.boolean(),
    publishedAt: v.number(),
    expiresAt: v.optional(v.number()),
    createdBy: v.id("users"),
    status: v.string(),
    reportCount: v.number(),
    verified: v.boolean(),
    sources: v.array(v.string()),
    media: v.array(v.string()),
    relatedEvents: v.array(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_type", ["type"])
    .index("by_severity", ["severity"])
    .index("by_location", ["location.lat", "location.lng"])
    .index("by_published", ["publishedAt"])
    .index("by_status", ["status"])
    .index("by_expires", ["expiresAt"]),

  alertReports: defineTable({
    alertId: v.id("emergencyAlerts"),
    userId: v.id("users"),
    type: v.string(),
    status: v.string(),
    description: v.optional(v.string()),
    images: v.array(v.string()),
    location: v.optional(v.object({ lat: v.number(), lng: v.number() })),
    severity: v.string(),
    isVerified: v.boolean(),
    verifiedBy: v.optional(v.id("users")),
    verifiedAt: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_alert_id", ["alertId"])
    .index("by_user_id", ["userId"])
    .index("by_type", ["type"])
    .index("by_status", ["status"])
    .index("by_verified", ["isVerified"]),
  
  // Sensor network tables
  sensors: defineTable({
    sensorId: v.string(),
    name: v.string(),
    type: v.string(),
    location: v.object({ lat: v.number(), lng: v.number() }),
    status: v.string(),
    batteryLevel: v.optional(v.number()),
    lastActivity: v.optional(v.number()),
    installationDate: v.number(),
    maintenanceSchedule: v.optional(v.number()),
    specifications: v.object({
      manufacturer: v.string(),
      model: v.string(),
      accuracy: v.optional(v.number()),
      range: v.optional(v.string()),
      frequency: v.optional(v.string()),
    }),
    dataTypes: v.array(v.string()),
    owner: v.id("users"),
    isPublic: v.boolean(),
    communityId: v.optional(v.string()),
    tags: v.array(v.string()),
    imageUrls: v.array(v.string()),
    documentationUrl: v.optional(v.string()),
    maintenanceHistory: v.array(v.object({
      date: v.number(),
      type: v.string(),
      description: v.string(),
      technician: v.optional(v.string()),
      cost: v.optional(v.number()),
    })),
    dataQuality: v.number(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_sensor_id", ["sensorId"])
    .index("by_type", ["type"])
    .index("by_location", ["location.lat", "location.lng"])
    .index("by_status", ["status"])
    .index("by_owner", ["owner"])
    .index("by_community", ["communityId"]),

  sensorReadings: defineTable({
    sensorId: v.string(),
    timestamp: v.number(),
    data: v.object({
      temperature: v.optional(v.number()),
      humidity: v.optional(v.number()),
      airQuality: v.optional(v.number()),
      waterQuality: v.optional(v.number()),
      noiseLevel: v.optional(v.number()),
      soilMoisture: v.optional(v.number()),
      uvIndex: v.optional(v.number()),
      windSpeed: v.optional(v.number()),
      windDirection: v.optional(v.number()),
      pressure: v.optional(v.number()),
      precipitation: v.optional(v.number()),
    }),
    quality: v.number(),
    processed: v.boolean(),
    processedAt: v.optional(v.number()),
    anomalies: v.array(v.string()),
    alertsTriggered: v.array(v.string()),
    createdAt: v.number(),
  })
    .index("by_sensor_id", ["sensorId"])
    .index("by_timestamp", ["timestamp"])
    .index("by_sensor_time", ["sensorId", "timestamp"]),

  sensorMaintenance: defineTable({
    sensorId: v.string(),
    userId: v.id("users"),
    type: v.string(),
    description: v.string(),
    scheduledDate: v.number(),
    completedDate: v.optional(v.number()),
    status: v.string(),
    issuesIdentified: v.array(v.string()),
    partsReplaced: v.array(v.string()),
    notes: v.optional(v.string()),
    images: v.array(v.string()),
    cost: v.optional(v.number()),
    technicianName: v.optional(v.string()),
    isRecurring: v.boolean(),
    nextMaintenanceDate: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_sensor_id", ["sensorId"])
    .index("by_user_id", ["userId"])
    .index("by_type", ["type"])
    .index("by_status", ["status"])
    .index("by_dates", ["scheduledDate", "completedDate"]),
});