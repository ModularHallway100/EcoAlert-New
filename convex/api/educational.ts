import { query, mutation, action } from "../_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

// Query to get all educational content
export const getEducationalContent = query({
  args: {
    type: v.optional(v.string()),
    category: v.optional(v.string()),
    difficulty: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
    isPremium: v.optional(v.boolean()),
    limit: v.optional(v.number()),
    offset: v.optional(v.number()),
    searchQuery: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const {
      type,
      category,
      difficulty,
      tags,
      isPremium,
      limit = 10,
      offset = 0,
      searchQuery,
    } = args;
    
    let contentQuery = ctx.db
      .query("educationalContent")
      .withIndex("by_status", (q) => q.eq("status", "published"));
    
    // Apply filters
    if (type) {
      contentQuery = contentQuery.filter((q) => q.eq(q.field("type"), type));
    }
    
    if (category) {
      contentQuery = contentQuery.filter((q) => q.eq(q.field("category"), category));
    }
    
    if (difficulty) {
      contentQuery = contentQuery.filter((q) => q.eq(q.field("difficulty"), difficulty));
    }
    
    if (isPremium !== undefined) {
      contentQuery = contentQuery.filter((q) => q.eq(q.field("isPremium"), isPremium));
    }
    
    if (tags && tags.length > 0) {
      contentQuery = contentQuery.filter((q) =>
        q.and(...tags.map((tag) => q.eq(q.field("tags"), tag)))
      );
    }
    
    // Apply search if provided
    if (searchQuery) {
      contentQuery = contentQuery.filter((q) =>
        q.or(
          q.qsearch(q.field("title"), searchQuery),
          q.qsearch(q.field("description"), searchQuery),
          q.qsearch(q.field("content"), searchQuery)
        )
      );
    }
    
    const content = await contentQuery
      .order("desc")
      .skip(offset)
      .take(limit)
      .collect();
    
    return content;
  },
});

// Query to get popular educational content
export const getPopularContent = query({
  args: {
    limit: v.optional(v.number()),
    offset: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { limit = 10, offset = 0 } = args;
    
    const content = await ctx.db
      .query("educationalContent")
      .withIndex("by_status", (q) => q.eq("status", "published"))
      .withIndex("by_popularity", (q) => q.order("desc"))
      .skip(offset)
      .take(limit)
      .collect();
    
    return content;
  },
});

// Query to get content by author
export const getContentByAuthor = query({
  args: {
    authorId: v.id("users"),
    limit: v.optional(v.number()),
    offset: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { authorId, limit = 10, offset = 0 } = args;
    
    const content = await ctx.db
      .query("educationalContent")
      .withIndex("by_author_id", (q) => q.eq("authorId", authorId))
      .order("desc")
      .skip(offset)
      .take(limit)
      .collect();
    
    return content;
  },
});

// Query to get a specific content piece by ID
export const getContentById = query({
  args: { id: v.id("educationalContent") },
  handler: async (ctx, args) => {
    const content = await ctx.db.get(args.id);
    if (!content) {
      throw new Error("Content not found");
    }
    return content;
  },
});

// Query to get related content
export const getRelatedContent = query({
  args: {
    id: v.id("educationalContent"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { id, limit = 5 } = args;
    
    const content = await ctx.db.get(id);
    if (!content) {
      throw new Error("Content not found");
    }
    
    // Get content with same category
    const relatedContent = await ctx.db
      .query("educationalContent")
      .withIndex("by_status", (q) => q.eq("status", "published"))
      .withIndex("by_category", (q) => q.eq("category", content.category))
      .filter((q) => q.neq(q.field("_id"), id))
      .order("desc")
      .take(limit)
      .collect();
    
    return relatedContent;
  },
});

// Query to get user's bookmarked content
export const getBookmarkedContent = query({
  args: {
    userId: v.id("users"),
    limit: v.optional(v.number()),
    offset: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { userId, limit = 10, offset = 0 } = args;
    
    const enrollments = await ctx.db
      .query("courseEnrollments")
      .withIndex("by_user_id", (q) => q.eq("userId", userId))
      .filter((q) => q.neq(q.field("bookmarks"), null))
      .collect();
    
    const bookmarkIds = enrollments.flatMap(e => e.bookmarks);
    
    if (bookmarkIds.length === 0) {
      return [];
    }
    
    const content = await ctx.db
      .query("educationalContent")
      .withIndex("by_status", (q) => q.eq("status", "published"))
      .filter((q) => q.in(q.field("_id"), bookmarkIds))
      .order("desc")
      .skip(offset)
      .take(limit)
      .collect();
    
    return content;
  },
});

// Mutation to create educational content
export const createContent = mutation({
  args: {
    title: v.string(),
    description: v.string(),
    content: v.string(),
    type: v.string(),
    category: v.string(),
    difficulty: v.string(),
    duration: v.number(),
    tags: v.array(v.string()),
    imageUrl: v.optional(v.string()),
    videoUrl: v.optional(v.string()),
    pdfUrl: v.optional(v.string()),
    audioUrl: v.optional(v.string()),
    relatedContent: v.array(v.string()),
    prerequisites: v.array(v.string()),
    learningObjectives: v.array(v.string()),
    resources: v.array(v.string()),
    isPremium: v.boolean(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Authentication required");
    }
    
    const contentId = await ctx.db.insert("educationalContent", {
      ...args,
      viewCount: 0,
      likeCount: 0,
      completionRate: 0,
      rating: 0,
      publishedAt: null,
      status: "draft",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
    
    return contentId;
  },
});

// Mutation to publish content
export const publishContent = mutation({
  args: { id: v.id("educationalContent") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Authentication required");
    }
    
    const content = await ctx.db.get(args.id);
    if (!content) {
      throw new Error("Content not found");
    }
    
    // Check if user owns the content
    if (content.authorId !== userId) {
      throw new Error("Permission denied");
    }
    
    await ctx.db.patch(args.id, {
      status: "published",
      publishedAt: Date.now(),
    });
    
    return { success: true };
  },
});

// Mutation to update content
export const updateContent = mutation({
  args: {
    id: v.id("educationalContent"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    content: v.optional(v.string()),
    type: v.optional(v.string()),
    category: v.optional(v.string()),
    difficulty: v.optional(v.string()),
    duration: v.optional(v.number()),
    tags: v.optional(v.array(v.string())),
    imageUrl: v.optional(v.string()),
    videoUrl: v.optional(v.string()),
    pdfUrl: v.optional(v.string()),
    audioUrl: v.optional(v.string()),
    relatedContent: v.optional(v.array(v.string())),
    prerequisites: v.optional(v.array(v.string())),
    learningObjectives: v.optional(v.array(v.string())),
    resources: v.optional(v.array(v.string())),
    isPremium: v.optional(v.boolean()),
    status: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Authentication required");
    }
    
    const content = await ctx.db.get(args.id);
    if (!content) {
      throw new Error("Content not found");
    }
    
    // Check if user owns the content
    if (content.authorId !== userId) {
      throw new Error("Permission denied");
    }
    
    await ctx.db.patch(args.id, {
      ...args,
      updatedAt: Date.now(),
    });
    
    return { success: true };
  },
});

// Mutation to delete content
export const deleteContent = mutation({
  args: { id: v.id("educationalContent") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Authentication required");
    }
    
    const content = await ctx.db.get(args.id);
    if (!content) {
      throw new Error("Content not found");
    }
    
    // Check if user owns the content
    if (content.authorId !== userId) {
      throw new Error("Permission denied");
    }
    
    await ctx.db.delete(args.id);
    
    return { success: true };
  },
});

// Mutation to increment view count
export const incrementViewCount = mutation({
  args: { id: v.id("educationalContent") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, {
      viewCount: v => v.add(v.field("viewCount"), 1),
    });
    
    return { success: true };
  },
});

// Mutation to like/unlike content
export const toggleLike = mutation({
  args: { id: v.id("educationalContent") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Authentication required");
    }
    
    const content = await ctx.db.get(args.id);
    if (!content) {
      throw new Error("Content not found");
    }
    
    // In a real implementation, you would track user likes in a separate table
    // For now, we'll just increment/decrement the like count
    
    // Check if user has already liked (this would be stored in user preferences)
    // For demo purposes, we'll just toggle the like count
    const newLikeCount = Math.max(0, content.likeCount + (Math.random() > 0.5 ? 1 : -1));
    
    await ctx.db.patch(args.id, {
      likeCount: newLikeCount,
    });
    
    return { success: true, liked: newLikeCount > content.likeCount };
  },
});

// Courses API

// Query to get all courses
export const getCourses = query({
  args: {
    category: v.optional(v.string()),
    difficulty: v.optional(v.string()),
    instructorId: v.optional(v.id("users")),
    isPremium: v.optional(v.boolean()),
    limit: v.optional(v.number()),
    offset: v.optional(v.number()),
    searchQuery: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const {
      category,
      difficulty,
      instructorId,
      isPremium,
      limit = 10,
      offset = 0,
      searchQuery,
    } = args;
    
    let courseQuery = ctx.db
      .query("courses")
      .withIndex("by_status", (q) => q.eq("status", "published"));
    
    // Apply filters
    if (category) {
      courseQuery = courseQuery.filter((q) => q.eq(q.field("category"), category));
    }
    
    if (difficulty) {
      courseQuery = courseQuery.filter((q) => q.eq(q.field("difficulty"), difficulty));
    }
    
    if (instructorId) {
      courseQuery = courseQuery.filter((q) => q.eq(q.field("instructorId"), instructorId));
    }
    
    if (isPremium !== undefined) {
      courseQuery = courseQuery.filter((q) => q.eq(q.field("isPremium"), isPremium));
    }
    
    // Apply search if provided
    if (searchQuery) {
      courseQuery = courseQuery.filter((q) =>
        q.or(
          q.qsearch(q.field("title"), searchQuery),
          q.qsearch(q.field("description"), searchQuery)
        )
      );
    }
    
    const courses = await courseQuery
      .order("desc")
      .skip(offset)
      .take(limit)
      .collect();
    
    return courses;
  },
});

// Query to get popular courses
export const getPopularCourses = query({
  args: {
    limit: v.optional(v.number()),
    offset: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { limit = 10, offset = 0 } = args;
    
    const courses = await ctx.db
      .query("courses")
      .withIndex("by_status", (q) => q.eq("status", "published"))
      .withIndex("by_popularity", (q) => q.order("desc"))
      .skip(offset)
      .take(limit)
      .collect();
    
    return courses;
  },
});

// Query to get courses by instructor
export const getCoursesByInstructor = query({
  args: {
    instructorId: v.id("users"),
    limit: v.optional(v.number()),
    offset: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { instructorId, limit = 10, offset = 0 } = args;
    
    const courses = await ctx.db
      .query("courses")
      .withIndex("by_instructor_id", (q) => q.eq("instructorId", instructorId))
      .order("desc")
      .skip(offset)
      .take(limit)
      .collect();
    
    return courses;
  },
});

// Query to get a specific course by ID
export const getCourseById = query({
  args: { id: v.id("courses") },
  handler: async (ctx, args) => {
    const course = await ctx.db.get(args.id);
    if (!course) {
      throw new Error("Course not found");
    }
    return course;
  },
});

// Mutation to enroll in a course
export const enrollInCourse = mutation({
  args: { courseId: v.id("courses") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Authentication required");
    }
    
    const course = await ctx.db.get(args.courseId);
    if (!course) {
      throw new Error("Course not found");
    }
    
    // Check if already enrolled
    const existingEnrollment = await ctx.db
      .query("courseEnrollments")
      .withIndex("by_user_course", (q) => 
        q.and(
          q.eq(q.field("userId"), userId),
          q.eq(q.field("courseId"), args.courseId)
        )
      )
      .first();
    
    if (existingEnrollment) {
      throw new Error("Already enrolled in this course");
    }
    
    const enrollmentId = await ctx.db.insert("courseEnrollments", {
      userId,
      courseId: args.courseId,
      progress: 0,
      enrollmentDate: Date.now(),
      lastAccessed: Date.now(),
      status: "active",
      bookmarks: [],
    });
    
    // Increment enrollment count
    await ctx.db.patch(args.courseId, {
      enrollmentCount: course.enrollmentCount + 1,
    });
    
    return enrollmentId;
  },
});

// Mutation to update course enrollment progress
export const updateEnrollmentProgress = mutation({
  args: {
    enrollmentId: v.id("courseEnrollments"),
    progress: v.number(),
    completedAt: v.optional(v.number()),
    certificateId: v.optional(v.string()),
    bookmarks: v.optional(v.array(v.id("educationalContent"))),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Authentication required");
    }
    
    const enrollment = await ctx.db.get(args.enrollmentId);
    if (!enrollment) {
      throw new Error("Enrollment not found");
    }
    
    // Check if user owns the enrollment
    if (enrollment.userId !== userId) {
      throw new Error("Permission denied");
    }
    
    await ctx.db.patch(args.enrollmentId, {
      ...args,
      lastAccessed: Date.now(),
    });
    
    return { success: true };
  },
});

// Query to get user's enrollments
export const getUserEnrollments = query({
  args: {
    userId: v.id("users"),
    status: v.optional(v.string()),
    limit: v.optional(v.number()),
    offset: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { userId, status, limit = 10, offset = 0 } = args;
    
    let enrollmentQuery = ctx.db
      .query("courseEnrollments")
      .withIndex("by_user_id", (q) => q.eq("userId", userId));
    
    if (status) {
      enrollmentQuery = enrollmentQuery.filter((q) => q.eq(q.field("status"), status));
    }
    
    const enrollments = await enrollmentQuery
      .order("desc")
      .skip(offset)
      .take(limit)
      .collect();
    
    // Get course details for each enrollment
    const enrollmentWithCourses = await Promise.all(
      enrollments.map(async (enrollment) => {
        const course = await ctx.db.get(enrollment.courseId);
        return {
          ...enrollment,
          course,
        };
      })
    );
    
    return enrollmentWithCourses;
  },
});