import { query, mutation, action } from "../_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";


// Query to get current environmental data
export const getCurrentData = query({
  args: {
    lat: v.optional(v.number()),
    lng: v.optional(v.number()),
    radius: v.optional(v.number()),
    sensorId: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { lat, lng, radius, sensorId, limit = 50 } = args;
    
    let dataQuery = ctx.db
      .query("environmentalData")
      .withIndex("by_timestamp", (q) => q.order("desc"));
    
    // Filter by sensor ID if provided
    if (sensorId) {
      dataQuery = dataQuery.filter((q) => q.eq(q.field("sensorId"), sensorId));
    }
    
    // Apply location filter if provided
    if (lat && lng && radius) {
      // This is a simplified approach - in production you'd use the geospatial index
      const filteredData = await dataQuery.collect();
      const filtered = filteredData.filter(data => {
        const distance = Math.sqrt(
          Math.pow(data.location.lat - lat, 2) +
          Math.pow(data.location.lng - lng, 2)
        );
        return distance <= radius;
      });
      return filtered.slice(0, limit);
    }
    
    const data = await dataQuery.take(limit);
    
    // Get sensor details for each data point
    const dataWithSensorDetails = await Promise.all(
      data.map(async (dataPoint) => {
        // Find sensor details
        const sensor = await ctx.db
          .query("sensors")
          .withIndex("by_sensor_id", (q) => q.eq("sensorId", dataPoint.sensorId))
          .first();
        
        return {
          ...dataPoint,
          sensorInfo: sensor || null,
        };
      })
    );
    
    return dataWithSensorDetails;
  },
});

// Query to get historical environmental data
export const getHistoricalData = query({
  args: {
    sensorId: v.optional(v.string()),
    lat: v.optional(v.number()),
    lng: v.optional(v.number()),
    radius: v.optional(v.number()),
    startTime: v.number(),
    endTime: v.number(),
    dataTypes: v.optional(v.array(v.string())),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const {
      sensorId,
      lat,
      lng,
      radius,
      startTime,
      endTime,
      dataTypes,
      limit = 1000,
    } = args;
    
    let dataQuery = ctx.db
      .query("environmentalData")
      .withIndex("by_timestamp", (q) =>
        q.and(
          q.gte(q.field("timestamp"), startTime),
          q.lte(q.field("timestamp"), endTime)
        )
      )
      .order("desc");
    
    // Filter by sensor ID if provided
    if (sensorId) {
      dataQuery = dataQuery.filter((q) => q.eq(q.field("sensorId"), sensorId));
    }
    
    // Apply location filter if provided
    if (lat && lng && radius) {
      // This is a simplified approach - in production you'd use the geospatial index
      const filteredData = await dataQuery.collect();
      const filtered = filteredData.filter(data => {
        const distance = Math.sqrt(
          Math.pow(data.location.lat - lat, 2) +
          Math.pow(data.location.lng - lng, 2)
        );
        return distance <= radius;
      });
      return filtered.slice(0, limit);
    }
    
    const data = await dataQuery.take(limit);
    
    // Filter by data types if specified
    if (dataTypes && dataTypes.length > 0) {
      const filteredData = data.filter(dataPoint => {
        return dataTypes.some(type => {
          switch (type) {
            case "temperature":
              return dataPoint.temperature !== undefined;
            case "humidity":
              return dataPoint.humidity !== undefined;
            case "airQuality":
              return dataPoint.airQuality !== undefined;
            case "waterQuality":
              return dataPoint.waterQuality !== undefined;
            case "noiseLevel":
              return dataPoint.noiseLevel !== undefined;
            case "soilMoisture":
              return dataPoint.soilMoisture !== undefined;
            case "uvIndex":
              return dataPoint.uvIndex !== undefined;
            case "windSpeed":
              return dataPoint.windSpeed !== undefined;
            case "windDirection":
              return dataPoint.windDirection !== undefined;
            case "pressure":
              return dataPoint.pressure !== undefined;
            case "precipitation":
              return dataPoint.precipitation !== undefined;
            default:
              return false;
          }
        });
      });
      
      return filteredData;
    }
    
    return data;
  },
});

// Query to get environmental data statistics
export const getEnvironmentalStats = query({
  args: {
    lat: v.optional(v.number()),
    lng: v.optional(v.number()),
    radius: v.optional(v.number()),
    startTime: v.optional(v.number()),
    endTime: v.optional(v.number()),
    sensorId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { lat, lng, radius, startTime, endTime, sensorId } = args;
    
    // Build query based on filters
    let dataQuery = ctx.db.query("environmentalData");
    
    if (sensorId) {
      dataQuery = dataQuery.withIndex("by_sensor_time", (q) =>
        q.eq("sensorId", sensorId)
      );
    } else if (lat && lng && radius) {
      // This is a simplified approach - in production you'd use the geospatial index
      const filteredData = await dataQuery.collect();
      const filtered = filteredData.filter(data => {
        const distance = Math.sqrt(
          Math.pow(data.location.lat - lat, 2) +
          Math.pow(data.location.lng - lng, 2)
        );
        return distance <= radius;
      });
      
      const data = filtered;
      
      // Apply time filters if provided
      if (startTime && endTime) {
        const timeFiltered = data.filter(dataPoint =>
          dataPoint.timestamp >= startTime && dataPoint.timestamp <= endTime
        );
        return timeFiltered;
      }
      
      return data;
    }
    
    // Apply time filters
    if (startTime && endTime) {
      dataQuery = dataQuery.filter((q) =>
        q.and(
          q.gte(q.field("timestamp"), startTime),
          q.lte(q.field("timestamp"), endTime)
        )
      );
    }
    
    const data = await dataQuery.collect();
    
    // Calculate statistics for each data type
    const stats = {
      count: data.length,
      averageDataQuality: 0,
      dataTypes: {
        temperature: { count: 0, min: Infinity, max: -Infinity, sum: 0, avg: 0 },
        humidity: { count: 0, min: Infinity, max: -Infinity, sum: 0, avg: 0 },
        airQuality: { count: 0, min: Infinity, max: -Infinity, sum: 0, avg: 0 },
        waterQuality: { count: 0, min: Infinity, max: -Infinity, sum: 0, avg: 0 },
        noiseLevel: { count: 0, min: Infinity, max: -Infinity, sum: 0, avg: 0 },
        soilMoisture: { count: 0, min: Infinity, max: -Infinity, sum: 0, avg: 0 },
        uvIndex: { count: 0, min: Infinity, max: -Infinity, sum: 0, avg: 0 },
        windSpeed: { count: 0, min: Infinity, max: -Infinity, sum: 0, avg: 0 },
        windDirection: { count: 0, min: Infinity, max: -Infinity, sum: 0, avg: 0 },
        pressure: { count: 0, min: Infinity, max: -Infinity, sum: 0, avg: 0 },
        precipitation: { count: 0, min: Infinity, max: -Infinity, sum: 0, avg: 0 },
      },
    };
    
    // Calculate total data quality
    let totalDataQuality = 0;
    let qualityCount = 0;
    
    // Process each data point
    data.forEach((dataPoint) => {
      // Update data quality stats
      totalDataQuality += dataPoint.dataQuality;
      qualityCount++;
      
      // Update each data type
      Object.keys(stats.dataTypes).forEach((type: string) => {
        const value = (dataPoint as any)[type];
        if (value !== undefined) {
          const typeStats = stats.dataTypes[type as keyof typeof stats.dataTypes];
          typeStats.count++;
          typeStats.min = Math.min(typeStats.min, value);
          typeStats.max = Math.max(typeStats.max, value);
          typeStats.sum += value;
        }
      });
    });
    
    // Calculate averages
    stats.averageDataQuality = qualityCount > 0 ? totalDataQuality / qualityCount : 0;
    
    Object.keys(stats.dataTypes).forEach((type: string) => {
      const typeStats = stats.dataTypes[type as keyof typeof stats.dataTypes];
      typeStats.avg = typeStats.count > 0 ? typeStats.sum / typeStats.count : 0;
    });
    
    return stats;
  },
});

// Query to get environmental data trends
export const getEnvironmentalTrends = query({
  args: {
    sensorId: v.optional(v.string()),
    lat: v.optional(v.number()),
    lng: v.optional(v.number()),
    radius: v.optional(v.number()),
    startTime: v.number(),
    endTime: v.number(),
    dataType: v.string(),
    interval: v.optional(v.string()), // "hour", "day", "week"
  },
  handler: async (ctx, args) => {
    const { sensorId, lat, lng, radius, startTime, endTime, dataType, interval = "hour" } = args;
    
    // Get historical data using direct query
    const data = await ctx.db
      .query("environmentalData")
      .withIndex("by_timestamp", (q: any) =>
        q.and(
          q.gte(q.field("timestamp"), startTime),
          q.lte(q.field("timestamp"), endTime)
        )
      )
      .order("desc")
      .take(10000);
    
    // Group data by time intervals
    const intervalMs = interval === "hour" ? 3600000 : interval === "day" ? 86400000 : 604800000;
    
    const groupedData: any = {};
    
    data.forEach((dataPoint) => {
      const timeKey = Math.floor(dataPoint.timestamp / intervalMs) * intervalMs;
      
      if (!groupedData[timeKey]) {
        groupedData[timeKey] = {
          timestamp: timeKey,
          count: 0,
          sum: 0,
          min: Infinity,
          max: -Infinity,
          avg: 0,
        };
      }
      
      const value = (dataPoint as any)[dataType];
      if (value !== undefined) {
        const group = groupedData[timeKey];
        group.count++;
        group.sum += value;
        group.min = Math.min(group.min, value);
        group.max = Math.max(group.max, value);
      }
    });
    
    // Calculate averages
    Object.keys(groupedData).forEach((timeKey) => {
      const group = groupedData[timeKey];
      group.avg = group.count > 0 ? group.sum / group.count : 0;
    });
    
    // Convert to array and sort by timestamp
    const trendData = Object.values(groupedData).sort((a: any, b: any) => a.timestamp - b.timestamp);
    
    return trendData;
  },
});

// Action to submit environmental data
export const submitEnvironmentalData = action({
  args: {
    sensorId: v.string(),
    location: v.object({ lat: v.number(), lng: v.number() }),
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
    dataQuality: v.number(),
  },
  handler: async (ctx, args) => {
    const { sensorId, location, data, dataQuality } = args;
    
    const timestamp = Date.now();
    
    // Insert the data directly
    const dataId = await ctx.db.insert("environmentalData", {
      sensorId,
      location,
      timestamp: timestamp || Date.now(), // Use provided timestamp or current time
      data,
      dataQuality,
      verified: false,
      processedAt: Date.now(),
    });
    
    // Process the data for alerts and patterns directly
    await processEnvironmentalData(ctx, { dataId, sensorId, location, data });
    
    return dataId;
  },
});

// Mutation to add environmental data
export const addData = mutation({
  args: {
    sensorId: v.string(),
    location: v.object({ lat: v.number(), lng: v.number() }),
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
    dataQuality: v.number(),
    verified: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { sensorId, location, timestamp, data, dataQuality, verified = false } = args;
    
    const dataId = await ctx.db.insert("environmentalData", {
      sensorId,
      location,
      timestamp,
      data,
      dataQuality,
      verified,
      processedAt: Date.now(),
    });
    
    return dataId;
  },
});

// Action to process environmental data for alerts and patterns
export const processEnvironmentalData = action({
  args: {
    dataId: v.id("environmentalData"),
    sensorId: v.string(),
    location: v.object({ lat: v.number(), lng: v.number() }),
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
    const { dataId, sensorId, location, data } = args;
    
    // Get recent data from the same sensor
    const recentData = await ctx.db
      .query("environmentalData")
      .withIndex("by_timestamp", (q: any) =>
        q.and(
          q.gte(q.field("timestamp"), Date.now() - 86400000), // Last 24 hours
          q.lte(q.field("timestamp"), Date.now())
        )
      )
      .filter((q: any) => q.eq(q.field("sensorId"), sensorId))
      .order("desc")
      .take(100);
    
    // Check for anomalies or patterns
    const anomalies = [];
    
    // Check for sudden changes
    if (recentData.length > 5) {
      const recent = recentData.slice(0, 5);
      
      // Check temperature anomalies
      if (data.temperature !== undefined) {
        const avgTemp = recent.reduce((sum: number, d: any) => sum + (d.temperature || 0), 0) / 5;
        const tempDiff = Math.abs(data.temperature - avgTemp);
        
        if (tempDiff > 10) { // Significant temperature change
          anomalies.push({
            type: "temperature_anomaly",
            severity: tempDiff > 20 ? "high" : "medium",
            message: `Significant temperature change detected: ${tempDiff.toFixed(1)}°C`,
          });
        }
      }
      
      // Check air quality anomalies
      if (data.airQuality !== undefined) {
        const avgAirQuality = recent.reduce((sum: number, d: any) => sum + (d.airQuality || 0), 0) / 5;
        const airQualityDiff = Math.abs(data.airQuality - avgAirQuality);
        
        if (airQualityDiff > 50) { // Significant air quality change
          anomalies.push({
            type: "air_quality_anomaly",
            severity: airQualityDiff > 100 ? "high" : "medium",
            message: `Significant air quality change detected: ${airQualityDiff}`,
          });
        }
        
        // Check for unhealthy air quality
        if (data.airQuality > 150) {
          anomalies.push({
            type: "unhealthy_air_quality",
            severity: data.airQuality > 200 ? "high" : "medium",
            message: `Unhealthy air quality detected: ${data.airQuality}`,
          });
        }
      }
      
      // Check noise level anomalies
      if (data.noiseLevel !== undefined) {
        if (data.noiseLevel > 85) { // High noise level threshold
          anomalies.push({
            type: "high_noise_level",
            severity: data.noiseLevel > 100 ? "high" : "medium",
            message: `High noise level detected: ${data.noiseLevel} dB`,
          });
        }
      }
    }
    
    // Process each anomaly
    for (const anomaly of anomalies) {
      // Create alert if anomaly is severe enough
      if (anomaly.severity === "high") {
        await ctx.db.insert("emergencyAlerts", {
          title: "Environmental Anomaly Detected",
          description: anomaly.message,
          type: "environmental",
          severity: "high",
          location,
          radius: 1000, // 1km radius
          affectedAreas: ["immediate area"],
          recommendedActions: ["Monitor the situation", "Report to authorities if necessary"],
          contactInfo: "emergency services",
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
    }
    
    return { anomalies };
  },
});

// Query to get available data types
export const getAvailableDataTypes = query({
  handler: async (ctx) => {
    return [
      { key: "temperature", name: "Temperature", unit: "°C" },
      { key: "humidity", name: "Humidity", unit: "%" },
      { key: "airQuality", name: "Air Quality", unit: "AQI" },
      { key: "waterQuality", name: "Water Quality", unit: "pH" },
      { key: "noiseLevel", name: "Noise Level", unit: "dB" },
      { key: "soilMoisture", name: "Soil Moisture", unit: "%" },
      { key: "uvIndex", name: "UV Index", unit: "index" },
      { key: "windSpeed", name: "Wind Speed", unit: "m/s" },
      { key: "windDirection", name: "Wind Direction", unit: "degrees" },
      { key: "pressure", name: "Pressure", unit: "hPa" },
      { key: "precipitation", name: "Precipitation", unit: "mm" },
    ];
  },
});

// Query to get environmental quality ratings
export const getEnvironmentalQualityRatings = query({
  args: {
    lat: v.optional(v.number()),
    lng: v.optional(v.number()),
    radius: v.optional(v.number()),
    sensorId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { lat, lng, radius, sensorId } = args;
    
    // Get recent data
    const recentData = await ctx.db
      .query("environmentalData")
      .order("desc");
      
    // Apply filters if provided
    if (lat && lng && radius) {
      // This is a simplified approach - in production you'd have proper geospatial indexing
      const filteredData = await recentData.collect();
      const filtered = filteredData.filter(data => {
        const distance = Math.sqrt(
          Math.pow(data.location.lat - lat, 2) +
          Math.pow(data.location.lng - lng, 2)
        );
        return distance <= radius;
      });
      return filtered.slice(0, 100);
    }
    
    const data = await recentData.take(100);
    
    if (data.length === 0) {
      return {
        overall: "no_data",
        temperature: "no_data",
        airQuality: "no_data",
        waterQuality: "no_data",
        noiseLevel: "no_data",
        soilMoisture: "no_data",
        uvIndex: "no_data",
        windSpeed: "no_data",
        pressure: "no_data",
        precipitation: "no_data",
      };
    }
    
    if ((recentData as any[]).length === 0) {
      return {
        overall: "no_data",
        temperature: "no_data",
        airQuality: "no_data",
        waterQuality: "no_data",
        noiseLevel: "no_data",
        soilMoisture: "no_data",
        uvIndex: "no_data",
        windSpeed: "no_data",
        pressure: "no_data",
        precipitation: "no_data",
      };
    }
    
    // Calculate average values
    const averages = {
      temperature: 0,
      humidity: 0,
      airQuality: 0,
      waterQuality: 0,
      noiseLevel: 0,
      soilMoisture: 0,
      uvIndex: 0,
      windSpeed: 0,
      pressure: 0,
      precipitation: 0,
    };
    
    let count = 0;
    
    (recentData as any[]).forEach((dataPoint) => {
      Object.keys(averages).forEach((type: string) => {
        if ((dataPoint as any)[type] !== undefined) {
          (averages as any)[type] += (dataPoint as any)[type];
          count++;
        }
      });
    });
    
    // Calculate averages
    Object.keys(averages).forEach((type: string) => {
      if (count > 0) {
        (averages as any)[type] = (averages as any)[type] / count;
      }
    });
    
    // Determine quality ratings
    const getRating = (value: number, type: string) => {
      switch (type) {
        case "temperature":
          if (value < 0) return "poor";
          if (value < 10) return "fair";
          if (value < 25) return "good";
          if (value < 35) return "fair";
          return "poor";
        
        case "airQuality":
          if (value < 50) return "good";
          if (value < 100) return "fair";
          if (value < 150) return "poor";
          return "very_poor";
        
        case "waterQuality":
          if (value > 6.5 && value < 8.5) return "good";
          if (value > 6 && value < 9) return "fair";
          return "poor";
        
        case "noiseLevel":
          if (value < 50) return "good";
          if (value < 70) return "fair";
          if (value < 85) return "poor";
          return "very_poor";
        
        case "soilMoisture":
          if (value > 40 && value < 60) return "good";
          if (value > 20 && value < 80) return "fair";
          return "poor";
        
        case "uvIndex":
          if (value < 3) return "good";
          if (value < 6) return "fair";
          if (value < 8) return "poor";
          return "very_poor";
        
        case "windSpeed":
          if (value < 5) return "good";
          if (value < 10) return "fair";
          if (value < 20) return "poor";
          return "very_poor";
        
        case "pressure":
          if (value > 1000 && value < 1030) return "good";
          if (value > 990 && value < 1040) return "fair";
          return "poor";
        
        case "precipitation":
          if (value === 0) return "good";
          if (value < 10) return "fair";
          if (value < 50) return "poor";
          return "very_poor";
        
        default:
          return "unknown";
      }
    };
    
    // Get ratings for each type
    const ratings: any = {};
    Object.keys(averages).forEach((type: string) => {
      ratings[type] = getRating((averages as any)[type], type);
    });
    
    // Calculate overall rating
    const ratingValues = Object.values(ratings);
    const goodCount = (ratingValues as string[]).filter((r: string) => r === "good").length;
    const fairCount = (ratingValues as string[]).filter((r: string) => r === "fair").length;
    const poorCount = (ratingValues as string[]).filter((r: string) => r === "poor").length;
    const veryPoorCount = (ratingValues as string[]).filter((r: string) => r === "very_poor").length;
    
    if (goodCount > ratingValues.length / 2) {
      ratings.overall = "good";
    } else if (fairCount > ratingValues.length / 2) {
      ratings.overall = "fair";
    } else if (poorCount > veryPoorCount) {
      ratings.overall = "poor";
    } else {
      ratings.overall = "very_poor";
    }
    
    return ratings;
  },
});