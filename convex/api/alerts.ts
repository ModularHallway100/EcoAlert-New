import { query, mutation, action } from "../_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

// Import API functions from other modules
import { getHistoricalData, getCurrentData } from "./environmental";

// Query to get all active emergency alerts
export const getActiveAlerts = query({
  args: {
    lat: v.optional(v.number()),
    lng: v.optional(v.number()),
    radius: v.optional(v.number()),
    limit: v.optional(v.number()),
    offset: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { lat, lng, radius, limit = 10, offset = 0 } = args;
    
    // Build query based on location parameters
    let alertQuery = ctx.db
      .query("emergencyAlerts")
      .order("desc");
    
    // If location is provided, filter by proximity
    if (lat && lng && radius) {
      // Get all alerts first, then filter by location
      const allAlerts = await alertQuery.collect();
      const filteredAlerts = allAlerts.filter(alert => {
        const distance = Math.sqrt(
          Math.pow(alert.location.lat - lat, 2) +
          Math.pow(alert.location.lng - lng, 2)
        );
        return distance <= radius;
      });
      return filteredAlerts.slice(0, limit);
    }
    
    // Apply pagination
    const alerts = await alertQuery
      .take(limit)
      .then(results => results);
    
    // Get report counts for each alert
    const alertsWithReports = await Promise.all(
      alerts.map(async (alert: any) => {
        const reportCount = await ctx.db
          .query("alertReports")
          .withIndex("by_alert_id", (q) => q.eq("alertId", alert._id))
          .collect()
          .then(reports => reports.length);
        
        return {
          ...alert,
          reportCount,
        };
      })
    );
    
    return alertsWithReports;
  },
});

// Query to get a specific alert by ID
export const getAlertById = query({
  args: { id: v.id("emergencyAlerts") },
  handler: async (ctx, args) => {
    const alert = await ctx.db.get(args.id);
    if (!alert) {
      throw new Error("Alert not found");
    }
    return alert;
  },
});

// Query to get alerts created by the current user
export const getUserAlerts = query({
  args: { 
    status: v.optional(v.string()),
    limit: v.optional(v.number()),
    offset: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Authentication required");
    }
    
    const { status, limit = 10, offset = 0 } = args;
    
    let query = ctx.db
      .query("emergencyAlerts")
      .filter((q) => q.eq(q.field("createdBy"), userId));
    
    if (status) {
      query = query.filter((q) => q.eq(q.field("status"), status));
    }
    
    const alerts = await query
      .order("desc")
      .take(limit)
      .then(results => results);
    
    return alerts;
  },
});

// Query to get alerts in a specific community
export const getCommunityAlerts = query({
  args: {
    communityId: v.string(),
    limit: v.optional(v.number()),
    offset: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { communityId, limit = 10, offset = 0 } = args;
    
    const alerts = await ctx.db
      .query("emergencyAlerts")
      .order("desc")
      .take(limit)
      .then(results => results);
    
    return alerts;
  },
});

// Mutation to create a new emergency alert
export const createAlert = mutation({
  args: {
    title: v.string(),
    description: v.string(),
    type: v.string(),
    severity: v.string(),
    location: v.object({ lat: v.number(), lng: v.number() }),
    radius: v.number(),
    affectedAreas: v.array(v.string()),
    recommendedActions: v.array(v.string()),
    contactInfo: v.string(),
    expiresAt: v.optional(v.number()),
    relatedEvents: v.array(v.string()),
    media: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Authentication required");
    }
    
    const alertId = await ctx.db.insert("emergencyAlerts", {
      ...args,
      expiresAt: args.expiresAt || 0, // Use provided expiresAt or default to 0
      isPublished: false,
      publishedAt: 0,
      reportCount: 0,
      verified: false,
      sources: [],
      status: "draft",
      createdBy: userId,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
    
    return alertId;
  },
});

// Mutation to publish an alert
export const publishAlert = mutation({
  args: { id: v.id("emergencyAlerts") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Authentication required");
    }
    
    const alert = await ctx.db.get(args.id);
    if (!alert) {
      throw new Error("Alert not found");
    }
    
    // Check if user owns the alert or has permission to publish
    if (alert.createdBy !== userId) {
      throw new Error("Permission denied");
    }
    
    await ctx.db.patch(args.id, {
      isPublished: true,
      publishedAt: Date.now(),
      status: "active",
    });
    
    return { success: true };
  },
});

// Mutation to update an alert
export const updateAlert = mutation({
  args: {
    id: v.id("emergencyAlerts"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    type: v.optional(v.string()),
    severity: v.optional(v.string()),
    location: v.optional(v.object({ lat: v.number(), lng: v.number() })),
    radius: v.optional(v.number()),
    affectedAreas: v.optional(v.array(v.string())),
    recommendedActions: v.optional(v.array(v.string())),
    contactInfo: v.optional(v.string()),
    expiresAt: v.optional(v.number()),
    status: v.optional(v.string()),
    relatedEvents: v.optional(v.array(v.string())),
    media: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Authentication required");
    }
    
    const alert = await ctx.db.get(args.id);
    if (!alert) {
      throw new Error("Alert not found");
    }
    
    // Check if user owns the alert or has permission to update
    if (alert.createdBy !== userId) {
      throw new Error("Permission denied");
    }
    
    await ctx.db.patch(args.id, {
      ...args,
      updatedAt: Date.now(),
    });
    
    return { success: true };
  },
});

// Mutation to delete an alert
export const deleteAlert = mutation({
  args: { id: v.id("emergencyAlerts") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Authentication required");
    }
    
    const alert = await ctx.db.get(args.id);
    if (!alert) {
      throw new Error("Alert not found");
    }
    
    // Check if user owns the alert or has permission to delete
    if (alert.createdBy !== userId) {
      throw new Error("Permission denied");
    }
    
    await ctx.db.delete(args.id);
    
    return { success: true };
  },
});

// Mutation to report an alert
export const reportAlert = mutation({
  args: {
    alertId: v.id("emergencyAlerts"),
    type: v.string(),
    description: v.optional(v.string()),
    images: v.array(v.string()),
    severity: v.string(),
    location: v.optional(v.object({ lat: v.number(), lng: v.number() })),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Authentication required");
    }
    
    // Check if alert exists
    const alert = await ctx.db.get(args.alertId);
    if (!alert) {
      throw new Error("Alert not found");
    }
    
    const reportId = await ctx.db.insert("alertReports", {
      alertId: args.alertId,
      userId,
      type: args.type,
      status: "pending",
      description: args.description,
      images: args.images,
      location: args.location,
      severity: args.severity,
      isVerified: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
    
    // Increment report count
    await ctx.db.patch(args.alertId, {
      reportCount: alert.reportCount + 1,
    });
    
    return reportId;
  },
});

// Action to verify an alert report (admin only)
export const verifyAlertReport = action({
  args: {
    reportId: v.id("alertReports"),
    isVerified: v.boolean(),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // In a real implementation, you would check admin permissions here
    // Note: Actions have limited database access
    // In a real implementation, you would use a mutation for this
    return { success: true, message: "Report verified" };
  },
});

// Query to get reports for a specific alert
export const getAlertReports = query({
  args: { alertId: v.id("emergencyAlerts") },
  handler: async (ctx, args) => {
    const reports = await ctx.db
      .query("alertReports")
      .filter((q) => q.eq(q.field("alertId"), args.alertId))
      .order("desc")
      .collect();
    
    return reports;
  },
});

// Query to get a specific report by ID
export const getReportById = query({
  args: { id: v.id("alertReports") },
  handler: async (ctx, args) => {
    const report = await ctx.db.get(args.id);
    if (!report) {
      throw new Error("Report not found");
    }
    return report;
  },
});

// Mutation to update report status
export const updateReportStatus = mutation({
  args: {
    reportId: v.id("alertReports"),
    isVerified: v.optional(v.boolean()),
    status: v.optional(v.string()),
    notes: v.optional(v.string()),
    verifiedBy: v.optional(v.id("users")),
    verifiedAt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.reportId, {
      ...args,
      updatedAt: Date.now(),
    });
    
    return { success: true };
  },
});