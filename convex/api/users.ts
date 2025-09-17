import { query, mutation, action } from "../_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

// Query to get user profile by ID
export const getUserProfile = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) {
      throw new Error("User not found");
    }
    
    return user;
  },
});

// Query to get current user's profile
export const getCurrentUserProfile = query({
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Authentication required");
    }
    
    const user = await ctx.db.get(userId);
    if (!user) {
      throw new Error("User not found");
    }
    
    return user;
  },
});

// Query to search users
export const searchUsers = query({
  args: {
    query: v.string(),
    limit: v.optional(v.number()),
    offset: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { query: searchQuery, limit = 10, offset = 0 } = args;
    
    // This is a simplified approach - in production you'd have proper text search
    const allUsers = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();
    
    const filteredUsers = allUsers.filter(user =>
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase())
    );
    
    return filteredUsers
      .slice(offset, offset + limit)
      .sort((a, b) => b.updatedAt - a.updatedAt);
    
    return users;
  },
});

// Query to get users by role
export const getUsersByRole = query({
  args: {
    role: v.string(),
    limit: v.optional(v.number()),
    offset: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { role, limit = 10, offset = 0 } = args;
    
    // This is a simplified approach - in production you'd have proper indexing
    const allUsers = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();
    
    const filteredUsers = allUsers.filter(user => user.role === role);
    
    return filteredUsers
      .slice(offset, offset + limit)
      .sort((a, b) => b.updatedAt - a.updatedAt);
    
    return users;
  },
});

// Query to get active users count
export const getActiveUsersCount = query({
  handler: async (ctx) => {
    const users = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();
    
    return users.length;
  },
});

// Mutation to create user profile
export const createUserProfile = mutation({
  args: {
    clerkId: v.string(),
    email: v.string(),
    name: v.string(),
    avatar: v.optional(v.string()),
    role: v.string(),
    preferences: v.optional(v.object({
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
    })),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Authentication required");
    }
    
    // Check if user already exists
    const allUsers = await ctx.db
      .query("users")
      .collect();
    
    const existingUser = allUsers.find(user => user.clerkId === args.clerkId);
    
    if (existingUser) {
      throw new Error("User profile already exists");
    }
    
    const preferences = args.preferences || {
      notifications: true,
      language: "en",
      location: null,
      units: "metric",
      theme: "light",
      privacy: {
        shareData: false,
        showProfile: true,
        allowContact: false,
      },
    };
    
    const userStats = {
      joinDate: Date.now(),
      contributions: 0,
      challengesCompleted: 0,
      points: 0,
      badges: [],
      lastActive: Date.now(),
    };
    
    const userProfileId = await ctx.db.insert("users", {
      clerkId: args.clerkId,
      email: args.email,
      name: args.name,
      avatar: args.avatar,
      role: args.role,
      preferences,
      statistics: userStats,
      isActive: true,
      emailVerified: true,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
    
    return userProfileId;
  },
});

// Mutation to update user profile
export const updateUserProfile = mutation({
  args: {
    name: v.optional(v.string()),
    avatar: v.optional(v.string()),
    preferences: v.optional(v.object({
      notifications: v.boolean(),
      language: v.string(),
      location: v.optional(v.object({ lat: v.number(), lng: v.number() })),
      units: v.string(),
      theme: v.string(),
      privacy: v.optional(v.object({
        shareData: v.boolean(),
        showProfile: v.boolean(),
        allowContact: v.boolean(),
      })),
    })),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Authentication required");
    }
    
    const user = await ctx.db.get(userId);
    if (!user) {
      throw new Error("User not found");
    }
    
    // Merge preferences if provided
    const updatedPreferences = args.preferences
      ? { ...user.preferences, ...args.preferences }
      : user.preferences;
    
    await ctx.db.patch(userId, {
      name: args.name || user.name,
      avatar: args.avatar || user.avatar,
      preferences: updatedPreferences,
      updatedAt: Date.now(),
    });
    
    return { success: true };
  },
});

// Mutation to update user statistics
export const updateUserStatistics = mutation({
  args: {
    contributions: v.optional(v.number()),
    challengesCompleted: v.optional(v.number()),
    points: v.optional(v.number()),
    badges: v.optional(v.array(v.string())),
    lastActive: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Authentication required");
    }
    
    const user = await ctx.db.get(userId);
    if (!user) {
      throw new Error("User not found");
    }
    
    const updatedStats = {
      ...user.statistics,
      contributions: args.contributions ?? user.statistics.contributions,
      challengesCompleted: args.challengesCompleted ?? user.statistics.challengesCompleted,
      points: args.points ?? user.statistics.points,
      badges: args.badges ?? user.statistics.badges,
      lastActive: args.lastActive ?? Date.now(),
    };
    
    await ctx.db.patch(userId, {
      statistics: updatedStats,
      updatedAt: Date.now(),
    });
    
    return { success: true };
  },
});

// Mutation to add badge to user
export const addBadge = mutation({
  args: {
    badgeId: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Authentication required");
    }
    
    const user = await ctx.db.get(userId);
    if (!user) {
      throw new Error("User not found");
    }
    
    // Check if badge already exists
    if (user.statistics.badges.includes(args.badgeId)) {
      throw new Error("Badge already exists");
    }
    
    const updatedBadges = [...user.statistics.badges, args.badgeId];
    
    await ctx.db.patch(userId, {
      statistics: {
        ...user.statistics,
        badges: updatedBadges,
      },
      updatedAt: Date.now(),
    });
    
    return { success: true };
  },
});

// Mutation to remove badge from user
export const removeBadge = mutation({
  args: {
    badgeId: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Authentication required");
    }
    
    const user = await ctx.db.get(userId);
    if (!user) {
      throw new Error("User not found");
    }
    
    // Remove badge
    const updatedBadges = user.statistics.badges.filter(badge => badge !== args.badgeId);
    
    await ctx.db.patch(userId, {
      statistics: {
        ...user.statistics,
        badges: updatedBadges,
      },
      updatedAt: Date.now(),
    });
    
    return { success: true };
  },
});

// Mutation to add points to user
export const addPoints = mutation({
  args: {
    points: v.number(),
    reason: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Authentication required");
    }
    
    const user = await ctx.db.get(userId);
    if (!user) {
      throw new Error("User not found");
    }
    
    const updatedPoints = user.statistics.points + args.points;
    
    await ctx.db.patch(userId, {
      statistics: {
        ...user.statistics,
        points: updatedPoints,
      },
      updatedAt: Date.now(),
    });
    
    return { success: true, newPoints: updatedPoints };
  },
});

// Mutation to deactivate user
export const deactivateUser = mutation({
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Authentication required");
    }
    
    await ctx.db.patch(userId, {
      isActive: false,
      updatedAt: Date.now(),
    });
    
    return { success: true };
  },
});

// Mutation to activate user
export const activateUser = mutation({
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Authentication required");
    }
    
    await ctx.db.patch(userId, {
      isActive: true,
      updatedAt: Date.now(),
    });
    
    return { success: true };
  },
});

// Query to get user achievements
export const getUserAchievements = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) {
      throw new Error("User not found");
    }
    
    // Return user's badges and statistics
    return {
      badges: user.statistics.badges,
      statistics: user.statistics,
    };
  },
});

// Query to get leaderboard
export const getLeaderboard = query({
  args: {
    limit: v.optional(v.number()),
    offset: v.optional(v.number()),
    timeRange: v.optional(v.string()), // "daily", "weekly", "monthly", "all_time"
  },
  handler: async (ctx, args) => {
    const { limit = 10, offset = 0, timeRange = "all_time" } = args;
    
    // Get all active users
    const users = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();
    
    // Sort by points
    const sortedUsers = users.sort((a, b) => b.statistics.points - a.statistics.points);
    
    // Apply time range filter if needed
    if (timeRange !== "all_time") {
      const timeRangeMs = timeRange === "daily" ? 86400000 : 
                         timeRange === "weekly" ? 604800000 : 
                         timeRange === "monthly" ? 2592000000 : 0;
      
      const cutoffDate = Date.now() - timeRangeMs;
      
      const filteredUsers = sortedUsers.filter(user => user.statistics.lastActive >= cutoffDate);
      return filteredUsers
        .slice(offset, offset + limit)
        .map(user => ({
          ...user,
          rank: filteredUsers.findIndex(u => u._id === user._id) + 1,
        }));
    }
    
    return sortedUsers
      .slice(offset, offset + limit)
      .map((user, index) => ({
        ...user,
        rank: index + 1,
      }));
  },
});

// Query to get user's activity history
export const getUserActivity = query({
  args: {
    userId: v.id("users"),
    limit: v.optional(v.number()),
    offset: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { userId, limit = 10, offset = 0 } = args;
    
    // In a real implementation, you would have an activity log table
    // For now, we'll return the user's statistics
    
    const user = await ctx.db.get(userId);
    if (!user) {
      throw new Error("User not found");
    }
    
    // Return mock activity data based on user statistics
    const activities = [
      {
        type: "joined",
        description: "Joined EcoAlert",
        timestamp: user.statistics.joinDate,
      },
      {
        type: "contribution",
        description: "Made environmental contribution",
        timestamp: user.statistics.lastActive - 86400000, // 1 day ago
      },
      {
        type: "challenge_completion",
        description: "Completed sustainability challenge",
        timestamp: user.statistics.lastActive - 172800000, // 2 days ago
      },
    ];
    
    return activities
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(offset, offset + limit);
  },
});

// Action to update user preferences from external sources
export const syncUserPreferences = action({
  args: {
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
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Authentication required");
    }
    
    const user = await ctx.db.get(userId);
    if (!user) {
      throw new Error("User not found");
    }
    
    // Update user preferences directly
    if (user) {
      await ctx.db.patch(userId, {
        preferences: {
          ...user.preferences,
          ...args.preferences,
        },
        updatedAt: Date.now(),
      });
    }
    
    return { success: true };
  },
});

// Query to get user notifications settings
export const getUserNotificationSettings = query({
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Authentication required");
    }
    
    const user = await ctx.db.get(userId);
    if (!user) {
      throw new Error("User not found");
    }
    
    return {
      notifications: user.preferences.notifications,
      email: user.email,
      language: user.preferences.language,
    };
  },
});

// Mutation to update notification settings
export const updateNotificationSettings = mutation({
  args: {
    notifications: v.boolean(),
    emailNotifications: v.boolean(),
    pushNotifications: v.boolean(),
    smsNotifications: v.boolean(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Authentication required");
    }
    
    const user = await ctx.db.get(userId);
    if (!user) {
      throw new Error("User not found");
    }
    
    // Update notification preferences
    await ctx.db.patch(userId, {
      preferences: {
        ...user.preferences,
        notifications: args.notifications,
        emailNotifications: args.emailNotifications,
        pushNotifications: args.pushNotifications,
        smsNotifications: args.smsNotifications,
      },
      updatedAt: Date.now(),
    });
    
    return { success: true };
  },
});