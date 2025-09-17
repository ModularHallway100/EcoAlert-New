import { query, mutation, action } from "../_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";


// Query to get all sensors
export const getSensors = query({
  args: {
    type: v.optional(v.string()),
    status: v.optional(v.string()),
    owner: v.optional(v.id("users")),
    communityId: v.optional(v.string()),
    isPublic: v.optional(v.boolean()),
    lat: v.optional(v.number()),
    lng: v.optional(v.number()),
    radius: v.optional(v.number()),
    limit: v.optional(v.number()),
    offset: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const {
      type,
      status,
      owner,
      communityId,
      isPublic,
      lat,
      lng,
      radius,
      limit = 10,
      offset = 0,
    } = args;
    
    let sensorQuery = ctx.db.query("sensors");
    
    // Apply filters
    if (type) {
      sensorQuery = sensorQuery.filter((q) => q.eq(q.field("type"), type));
    }
    
    if (status) {
      sensorQuery = sensorQuery.filter((q) => q.eq(q.field("status"), status));
    }
    
    if (owner) {
      sensorQuery = sensorQuery.filter((q) => q.eq(q.field("owner"), owner));
    }
    
    if (communityId) {
      sensorQuery = sensorQuery.filter((q) => q.eq(q.field("communityId"), communityId));
    }
    
    if (isPublic !== undefined) {
      sensorQuery = sensorQuery.filter((q) => q.eq(q.field("isPublic"), isPublic));
    }
    
    // Apply location filter if provided
    if (lat && lng && radius) {
      // This is a simplified approach - in production you'd use the geospatial index
      const allSensors = await sensorQuery.collect();
      const filtered = allSensors.filter(sensor => {
        const distance = Math.sqrt(
          Math.pow(sensor.location.lat - lat, 2) +
          Math.pow(sensor.location.lng - lng, 2)
        );
        return distance <= radius;
      });
      return filtered.slice(0, limit);
    }
    
    const sensors = await sensorQuery
      .order("desc")
      .skip(offset)
      .take(limit)
      .collect();
    
    return sensors;
  },
});

// Query to get a specific sensor by ID
export const getSensorById = query({
  args: { id: v.id("sensors") },
  handler: async (ctx, args) => {
    const sensor = await ctx.db.get(args.id);
    if (!sensor) {
      throw new Error("Sensor not found");
    }
    return sensor;
  },
});

// Query to get sensor by sensor ID
export const getSensorBySensorId = query({
  args: { sensorId: v.string() },
  handler: async (ctx, args) => {
    const sensor = await ctx.db
      .query("sensors")
      .filter((q) => q.eq(q.field("sensorId"), args.sensorId))
      .first();
    
    if (!sensor) {
      throw new Error("Sensor not found");
    }
    return sensor;
  },
});

// Query to get sensors by type
export const getSensorsByType = query({
  args: {
    type: v.string(),
    limit: v.optional(v.number()),
    offset: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { type, limit = 10, offset = 0 } = args;
    
    const sensors = await ctx.db
      .query("sensors")
      .filter((q) => q.eq(q.field("type"), type))
      .order("desc")
      .skip(offset)
      .take(limit)
      .collect();
    
    return sensors;
  },
});

// Query to get sensors in a specific area
export const getSensorsByLocation = query({
  args: {
    lat: v.number(),
    lng: v.number(),
    radius: v.number(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { lat, lng, radius, limit = 10 } = args;
    
    // Get all public sensors first
    const allSensors = await ctx.db
      .query("sensors")
      .filter((q) => q.eq(q.field("isPublic"), true))
      .collect();
    
    // Filter by location using distance calculation
    const filteredSensors = allSensors.filter(sensor => {
      const distance = Math.sqrt(
        Math.pow(sensor.location.lat - lat, 2) +
        Math.pow(sensor.location.lng - lng, 2)
      );
      return distance <= radius;
    });
    
    return filteredSensors.slice(0, limit);
  },
});

// Query to get sensors owned by the current user
export const getUserSensors = query({
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
    
    let userSensorQuery = ctx.db
      .query("sensors")
      .filter((q) => q.eq(q.field("owner"), userId));
    
    if (status) {
      userSensorQuery = userSensorQuery.filter((q) => q.eq(q.field("status"), status));
    }
    
    const sensors = await userSensorQuery
      .order("desc")
      .skip(offset)
      .take(limit)
      .collect();
    
    return sensors;
  },
});

// Query to get sensors in a community
export const getCommunitySensors = query({
  args: {
    communityId: v.string(),
    limit: v.optional(v.number()),
    offset: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { communityId, limit = 10, offset = 0 } = args;
    
    const sensors = await ctx.db
      .query("sensors")
      .filter((q) => q.eq(q.field("communityId"), communityId))
      .filter((q) => q.eq(q.field("isPublic"), true))
      .order("desc")
      .skip(offset)
      .take(limit)
      .collect();
    
    return sensors;
  },
});

// Query to get sensor readings
export const getSensorReadings = query({
  args: {
    sensorId: v.string(),
    startTime: v.optional(v.number()),
    endTime: v.optional(v.number()),
    limit: v.optional(v.number()),
    offset: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { sensorId, startTime, endTime, limit = 100, offset = 0 } = args;
    
    let readingQuery = ctx.db
      .query("sensorReadings")
      .filter((q) => q.eq(q.field("sensorId"), sensorId))
      .order("desc");
    
    if (startTime && endTime) {
      readingQuery = readingQuery.filter((q) =>
        q.and(
          q.gte(q.field("timestamp"), startTime),
          q.lte(q.field("timestamp"), endTime)
        )
      );
    }
    
    const readings = await readingQuery
      .skip(offset)
      .take(limit)
      .collect();
    
    return readings;
  },
});

// Query to get latest sensor reading
export const getLatestSensorReading = query({
  args: { sensorId: v.string() },
  handler: async (ctx, args) => {
    const reading = await ctx.db
      .query("sensorReadings")
      .filter((q) => q.eq(q.field("sensorId"), args.sensorId))
      .order("desc")
      .first();
    
    return reading;
  },
});

// Query to get sensor maintenance history
export const getSensorMaintenanceHistory = query({
  args: {
    sensorId: v.string(),
    limit: v.optional(v.number()),
    offset: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { sensorId, limit = 10, offset = 0 } = args;
    
    const maintenanceRecords = await ctx.db
      .query("sensorMaintenance")
      .filter((q) => q.eq(q.field("sensorId"), sensorId))
      .order("desc")
      .skip(offset)
      .take(limit)
      .collect();
    
    return maintenanceRecords;
  },
});

// Mutation to create a new sensor
export const createSensor = mutation({
  args: {
    sensorId: v.string(),
    name: v.string(),
    type: v.string(),
    location: v.object({ lat: v.number(), lng: v.number() }),
    status: v.string(),
    batteryLevel: v.optional(v.number()),
    installationDate: v.number(),
    specifications: v.object({
      manufacturer: v.string(),
      model: v.string(),
      accuracy: v.optional(v.number()),
      range: v.optional(v.string()),
      frequency: v.optional(v.string()),
    }),
    dataTypes: v.array(v.string()),
    isPublic: v.boolean(),
    communityId: v.optional(v.string()),
    tags: v.array(v.string()),
    imageUrls: v.array(v.string()),
    documentationUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Authentication required");
    }
    
    // Check if sensor ID already exists
    const existingSensor = await ctx.db
      .query("sensors")
      .filter((q) => q.eq(q.field("sensorId"), args.sensorId))
      .first();
    
    if (existingSensor) {
      throw new Error("Sensor ID already exists");
    }
    
    const sensorId = await ctx.db.insert("sensors", {
      ...args,
      batteryLevel: args.batteryLevel || 100,
      lastActivity: Date.now(),
      maintenanceSchedule: args.installationDate + 86400000 * 90, // 90 days after installation
      maintenanceHistory: [],
      dataQuality: 100,
      owner: userId, // Add the owner field from authenticated user
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
    
    return sensorId;
  },
});

// Mutation to update sensor
export const updateSensor = mutation({
  args: {
    id: v.id("sensors"),
    name: v.optional(v.string()),
    status: v.optional(v.string()),
    batteryLevel: v.optional(v.number()),
    location: v.optional(v.object({ lat: v.number(), lng: v.number() })),
    specifications: v.optional(v.object({
      manufacturer: v.string(),
      model: v.string(),
      accuracy: v.optional(v.number()),
      range: v.optional(v.string()),
      frequency: v.optional(v.string()),
    })),
    dataTypes: v.optional(v.array(v.string())),
    isPublic: v.optional(v.boolean()),
    communityId: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
    imageUrls: v.optional(v.array(v.string())),
    documentationUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Authentication required");
    }
    
    const sensor = await ctx.db.get(args.id);
    if (!sensor) {
      throw new Error("Sensor not found");
    }
    
    // Check if user owns the sensor
    if (sensor.owner !== userId) {
      throw new Error("Permission denied");
    }
    
    await ctx.db.patch(args.id, {
      ...args,
      updatedAt: Date.now(),
    });
    
    return { success: true };
  },
});

// Mutation to delete sensor
export const deleteSensor = mutation({
  args: { id: v.id("sensors") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Authentication required");
    }
    
    const sensor = await ctx.db.get(args.id);
    if (!sensor) {
      throw new Error("Sensor not found");
    }
    
    // Check if user owns the sensor
    if (sensor.owner !== userId) {
      throw new Error("Permission denied");
    }
    
    await ctx.db.delete(args.id);
    
    return { success: true };
  },
});

// Mutation to update sensor status
export const updateSensorStatus = mutation({
  args: {
    id: v.id("sensors"),
    status: v.string(),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Authentication required");
    }
    
    const sensor = await ctx.db.get(args.id);
    if (!sensor) {
      throw new Error("Sensor not found");
    }
    
    // Check if user owns the sensor
    if (sensor.owner !== userId) {
      throw new Error("Permission denied");
    }
    
    await ctx.db.patch(args.id, {
      status: args.status,
      updatedAt: Date.now(),
    });
    
    return { success: true };
  },
});

// Mutation to record sensor reading
export const recordSensorReading = mutation({
  args: {
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
  },
  handler: async (ctx, args) => {
    const { sensorId, timestamp, data, quality } = args;
    
    // Get sensor info
    const sensor = await ctx.db
      .query("sensors")
      .filter((q) => q.eq(q.field("sensorId"), sensorId))
      .first();
    
    if (!sensor) {
      throw new Error("Sensor not found");
    }
    
    // Update sensor last activity
    await ctx.db.patch(sensor._id, {
      lastActivity: timestamp,
    });
    
    // Check battery level and status
    if (sensor.batteryLevel && sensor.batteryLevel < 20) {
      // Create alert for low battery
      await ctx.db.insert("emergencyAlerts", {
        title: "Low Battery Alert",
        description: `Sensor ${sensor.name} has low battery level: ${sensor.batteryLevel}%`,
        type: "maintenance",
        severity: "medium",
        location: sensor.location,
        radius: 500,
        affectedAreas: [sensor.name],
        recommendedActions: ["Replace battery or recharge sensor"],
        contactInfo: "sensor maintenance team",
        isPublished: false,
        publishedAt: 0,
        reportCount: 0,
        verified: false,
        sources: [],
        status: "draft",
        createdBy: null, // Will be set when published
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
    }
    
    // Insert reading
    const readingId = await ctx.db.insert("sensorReadings", {
      sensorId,
      timestamp: timestamp || Date.now(), // Use provided timestamp or current time
      data,
      quality,
      processed: false,
      processedAt: null, // Will be set when processed
      anomalies: [],
      alertsTriggered: [],
      createdAt: Date.now(),
    });
    
    // Process the reading for alerts and patterns directly
    await processSensorReading(ctx, { readingId, sensorId, data });
    
    return readingId;
  },
});

// Action to process sensor reading for alerts and patterns
export const processSensorReading = action({
  args: {
    readingId: v.id("sensorReadings"),
    sensorId: v.string(),
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
  },
  handler: async (ctx, args) => {
    const { readingId, sensorId, data } = args;
    
    // Get recent readings for comparison
    const recentReadings = await ctx.db
      .query("sensorReadings")
      .filter((q) => q.eq(q.field("sensorId"), sensorId))
      .filter((q) => q.gte(q.field("timestamp"), Date.now() - 86400000)) // Last 24 hours
      .order("desc")
      .take(50);
    
    // Get sensor configuration directly
    const sensor = await ctx.db
      .query("sensors")
      .filter((q) => q.eq(q.field("sensorId"), sensorId))
      .first();
    
    const anomalies = [];
    
    // Check for sensor anomalies based on sensor type
    switch (sensor.type) {
      case "air_quality":
        if (data.airQuality !== undefined) {
          // Check for unhealthy air quality
          if (data.airQuality > 150) {
            anomalies.push({
              type: "unhealthy_air",
              severity: data.airQuality > 200 ? "high" : "medium",
              message: `Unhealthy air quality detected: ${data.airQuality} AQI`,
            });
          }
          
          // Check for sudden changes
          if (recentReadings.length > 5) {
            const recent = recentReadings.slice(0, 5);
            const avgAirQuality = recent.reduce((sum, r) => sum + (r.data.airQuality || 0), 0) / 5;
            const change = Math.abs(data.airQuality - avgAirQuality);
            
            if (change > 50) {
              anomalies.push({
                type: "air_quality_spike",
                severity: change > 100 ? "high" : "medium",
                message: `Significant air quality change: ${change} AQI`,
              });
            }
          }
        }
        break;
        
      case "temperature":
        if (data.temperature !== undefined) {
          // Check for extreme temperatures
          if (data.temperature < -10 || data.temperature > 45) {
            anomalies.push({
              type: "extreme_temperature",
              severity: "high",
              message: `Extreme temperature detected: ${data.temperature}°C`,
            });
          }
        }
        break;
        
      case "noise":
        if (data.noiseLevel !== undefined) {
          // Check for high noise levels
          if (data.noiseLevel > 85) {
            anomalies.push({
              type: "high_noise",
              severity: data.noiseLevel > 100 ? "high" : "medium",
              message: `High noise level detected: ${data.noiseLevel} dB`,
            });
          }
        }
        break;
    }
    
    // Process each anomaly
    for (const anomaly of anomalies) {
      if (anomaly.severity === "high") {
        await ctx.db.insert("emergencyAlerts", {
          title: `Sensor Anomaly - ${sensor.name}`,
          description: anomaly.message,
          type: "sensor",
          severity: anomaly.severity,
          location: sensor.location,
          radius: 1000,
          affectedAreas: [sensor.name],
          recommendedActions: ["Check sensor operation", "Verify environmental conditions"],
          contactInfo: "sensor maintenance team",
          isPublished: false,
          publishedAt: 0,
          reportCount: 0,
          verified: false,
          sources: [],
          status: "draft",
          createdBy: null, // Will be set when published
          createdAt: Date.now(),
          updatedAt: Date.now(),
        });
      }
      
      // Add anomaly to reading directly
      const reading = await ctx.db.get(args.readingId);
      if (reading) {
        const anomalies = reading.anomalies || [];
        if (!anomalies.includes(anomaly.type)) {
          anomalies.push(anomaly.type);
          await ctx.db.patch(args.readingId, { anomalies });
        }
      }
    }
    
    // Mark reading as processed directly
    await ctx.db.patch(args.readingId, {
      processed: true,
      processedAt: Date.now(),
    });
    
    return { anomalies };
  },
});

// Mutation to add anomaly to reading
export const addAnomalyToReading = mutation({
  args: {
    readingId: v.id("sensorReadings"),
    anomaly: v.string(),
  },
  handler: async (ctx, args) => {
    const reading = await ctx.db.get(args.readingId);
    if (!reading) {
      throw new Error("Reading not found");
    }
    
    const anomalies = reading.anomalies || [];
    if (!anomalies.includes(args.anomaly)) {
      anomalies.push(args.anomaly);
      
      await ctx.db.patch(args.readingId, {
        anomalies,
      });
    }
    
    return { success: true };
  },
});

// Mutation to mark reading as processed
export const markReadingAsProcessed = mutation({
  args: {
    readingId: v.id("sensorReadings"),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.readingId, {
      processed: true,
      processedAt: Date.now(),
    });
    
    return { success: true };
  },
});

// Mutation to schedule sensor maintenance
export const scheduleMaintenance = mutation({
  args: {
    sensorId: v.string(),
    scheduledDate: v.number(),
    type: v.string(),
    description: v.string(),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Authentication required");
    }
    
    const sensor = await ctx.db
      .query("sensors")
      .filter((q) => q.eq(q.field("sensorId"), args.sensorId))
      .first();
    
    if (!sensor) {
      throw new Error("Sensor not found");
    }
    
    // Check if user owns the sensor
    if (sensor.owner !== userId) {
      throw new Error("Permission denied");
    }
    
    const maintenanceId = await ctx.db.insert("sensorMaintenance", {
      sensorId: args.sensorId,
      userId,
      type: args.type,
      description: args.description,
      scheduledDate: args.scheduledDate,
      status: "scheduled",
      notes: args.notes,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
    
    return maintenanceId;
  },
});

// Mutation to complete maintenance
export const completeMaintenance = mutation({
  args: {
    maintenanceId: v.id("sensorMaintenance"),
    completedDate: v.number(),
    issuesIdentified: v.array(v.string()),
    partsReplaced: v.array(v.string()),
    notes: v.optional(v.string()),
    images: v.array(v.string()),
    cost: v.optional(v.number()),
    technicianName: v.optional(v.string()),
    nextMaintenanceDate: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Authentication required");
    }
    
    const maintenance = await ctx.db.get(args.maintenanceId);
    if (!maintenance) {
      throw new Error("Maintenance record not found");
    }
    
    // Check if user owns the maintenance record
    if (maintenance.userId !== userId) {
      throw new Error("Permission denied");
    }
    
    await ctx.db.patch(args.maintenanceId, {
      ...args,
      status: "completed",
      updatedAt: Date.now(),
    });
    
    // Update sensor maintenance schedule if next maintenance date is provided
    if (args.nextMaintenanceDate) {
      const sensor = await ctx.db
        .query("sensors")
        .filter((q) => q.eq(q.field("sensorId"), maintenance.sensorId))
        .first();
      
      if (sensor) {
        await ctx.db.patch(sensor._id, {
          maintenanceSchedule: args.nextMaintenanceDate,
        });
      }
    }
    
    return { success: true };
  },
});