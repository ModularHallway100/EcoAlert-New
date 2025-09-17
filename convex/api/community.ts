import { query, mutation, action } from "../_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

// Query to get all communities
export const getCommunities = query({
  args: {
    limit: v.optional(v.number()),
    offset: v.optional(v.number()),
    searchQuery: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { limit = 10, offset = 0, searchQuery } = args;
    
    let memberQuery = ctx.db.query("communityMembers");
    
    if (searchQuery) {
      // Note: This would require a text search index in a real implementation
      // For now, we'll just filter by community IDs and join with community data
      const allMembers = await memberQuery.collect();
      const memberIds = allMembers.map(m => m.communityId);
      
      // This is a simplified approach - in production you'd have a separate communities table
      return []; // Return empty for now until we have a communities table
    }
    
    const members = await memberQuery
      .filter((q) => q.eq(q.field("isActive"), true))
      .order("desc")
      .take(limit)
      .collect();
    
    // This would be enhanced to get actual community data
    return members;
  },
});

// Query to get user's communities
export const getUserCommunities = query({
  args: {
    userId: v.id("users"),
    limit: v.optional(v.number()),
    offset: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { userId, limit = 10, offset = 0 } = args;
    
    const memberships = await ctx.db
      .query("communityMembers")
      .filter((q) => q.eq(q.field("userId"), userId))
      .filter((q) => q.eq(q.field("isActive"), true))
      .order("desc")
      .take(limit)
      .collect();
    
    // This would be enhanced to get actual community data
    return memberships;
  },
});

// Query to get community members
export const getCommunityMembers = query({
  args: {
    communityId: v.string(),
    limit: v.optional(v.number()),
    offset: v.optional(v.number()),
    role: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { communityId, limit = 10, offset = 0, role } = args;
    
    let memberQuery = ctx.db
      .query("communityMembers")
      .filter((q) => q.eq(q.field("communityId"), communityId))
      .filter((q) => q.eq(q.field("isActive"), true));
    
    if (role) {
      memberQuery = memberQuery.filter((q) => q.eq(q.field("role"), role));
    }
    
    const members = await memberQuery
      .order("desc")
      .take(limit)
      .collect();
    
    // Get user details for each member
    const membersWithDetails = await Promise.all(
      members.map(async (member: any) => {
        const user = await ctx.db.get(member.userId);
        return {
          ...member,
          user,
        };
      })
    );
    
    return membersWithDetails;
  },
});

// Query to get community challenges
export const getCommunityChallenges = query({
  args: {
    communityId: v.string(),
    limit: v.optional(v.number()),
    offset: v.optional(v.number()),
    status: v.optional(v.string()),
    difficulty: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { communityId, limit = 10, offset = 0, status, difficulty } = args;
    
    let challengeQuery = ctx.db
      .query("challenges")
    
    if (status) {
      challengeQuery = challengeQuery.filter((q) => q.eq(q.field("status"), status));
    }
    
    if (difficulty) {
      challengeQuery = challengeQuery.filter((q) => q.eq(q.field("difficulty"), difficulty));
    }
    
    const challenges = await challengeQuery
      .order("desc")
      .take(limit)
      .collect();
    
    return challenges;
  },
});

// Query to get community discussions
export const getCommunityDiscussions = query({
  args: {
    communityId: v.string(),
    limit: v.optional(v.number()),
    offset: v.optional(v.number()),
    category: v.optional(v.string()),
    isPinned: v.optional(v.boolean()),
    isLocked: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const {
      communityId,
      limit = 10,
      offset = 0,
      category,
      isPinned,
      isLocked,
    } = args;
    
    let discussionQuery = ctx.db
      .query("discussions")
      .filter((q) => q.eq(q.field("communityId"), communityId))
      .order("desc");
    
    if (category) {
      discussionQuery = discussionQuery.filter((q) => q.eq(q.field("category"), category));
    }
    
    if (isPinned !== undefined) {
      discussionQuery = discussionQuery.filter((q) => q.eq(q.field("isPinned"), isPinned));
    }
    
    if (isLocked !== undefined) {
      discussionQuery = discussionQuery.filter((q) => q.eq(q.field("isLocked"), isLocked));
    }
    
    const discussions = await discussionQuery
      .take(limit)
      .collect();
    
    return discussions;
  },
});

// Query to get popular discussions in a community
export const getPopularCommunityDiscussions = query({
  args: {
    communityId: v.string(),
    limit: v.optional(v.number()),
    offset: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { communityId, limit = 10, offset = 0 } = args;
    
    const discussions = await ctx.db
      .query("discussions")
      .filter((q) => q.eq(q.field("communityId"), communityId))
      .order("desc")
      .take(limit)
      .collect();
    
    // Sort by popularity (likes + views)
    const discussionsWithPopularity = discussions.map((discussion: any) => ({
      ...discussion,
      popularity: discussion.likeCount + discussion.viewCount,
    }));
    
    return discussionsWithPopularity
      .sort((a: any, b: any) => b.popularity - a.popularity)
      .slice(0, limit);
  },
});

// Mutation to join a community
export const joinCommunity = mutation({
  args: {
    communityId: v.string(),
    role: v.string(),
    profile: v.optional(v.object({
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
    })),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Authentication required");
    }
    
    // Check if already a member
    const existingMembership = await ctx.db
      .query("communityMembers")
      .filter((q) =>
        q.and(
          q.eq(q.field("userId"), userId),
          q.eq(q.field("communityId"), args.communityId)
        )
      )
      .first();
    
    if (existingMembership) {
      throw new Error("Already a member of this community");
    }
    
    const membershipId = await ctx.db.insert("communityMembers", {
      userId,
      communityId: args.communityId,
      role: args.role,
      joinedAt: Date.now(),
      isActive: true,
      contributionLevel: "new",
      permissions: ["read"],
      profile: args.profile || {
        skills: [],
        interests: [],
        location: undefined,
        bio: undefined,
        website: undefined,
        socialLinks: undefined,
      },
    });
    
    return membershipId;
  },
});

// Mutation to leave a community
export const leaveCommunity = mutation({
  args: { communityId: v.string() },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Authentication required");
    }
    
    const membership = await ctx.db
      .query("communityMembers")
      .filter((q) =>
        q.and(
          q.eq(q.field("userId"), userId),
          q.eq(q.field("communityId"), args.communityId)
        )
      )
      .first();
    
    if (!membership) {
      throw new Error("Not a member of this community");
    }
    
    await ctx.db.patch(membership._id, {
      isActive: false,
    });
    
    return { success: true };
  },
});

// Mutation to update community membership
export const updateCommunityMembership = mutation({
  args: {
    communityId: v.string(),
    role: v.optional(v.string()),
    contributionLevel: v.optional(v.string()),
    permissions: v.optional(v.array(v.string())),
    profile: v.optional(v.object({
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
    })),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Authentication required");
    }
    
    const membership = await ctx.db
      .query("communityMembers")
      .filter((q) =>
        q.and(
          q.eq(q.field("userId"), userId),
          q.eq(q.field("communityId"), args.communityId)
        )
      )
      .first();
    
    if (!membership) {
      throw new Error("Not a member of this community");
    }
    
    await ctx.db.patch(membership._id, {
      role: args.role || membership.role,
      contributionLevel: args.contributionLevel || membership.contributionLevel,
      permissions: args.permissions || membership.permissions,
      profile: args.profile ? { ...membership.profile, ...args.profile } : membership.profile,
    });
    
    return { success: true };
  },
});

// Mutation to promote community member
export const promoteMember = mutation({
  args: {
    communityId: v.string(),
    userId: v.id("users"),
    newRole: v.string(),
    newPermissions: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const currentUserId = await getAuthUserId(ctx);
    if (!currentUserId) {
      throw new Error("Authentication required");
    }
    
    // Check if current user has permission to promote
    const currentMembership = await ctx.db
      .query("communityMembers")
      .filter((q) =>
        q.and(
          q.eq(q.field("userId"), currentUserId),
          q.eq(q.field("communityId"), args.communityId)
        )
      )
      .first();
    
    if (!currentMembership) {
      throw new Error("Not a member of this community");
    }
    
    // Check permissions (in a real implementation, would have proper roles and permissions)
    if (!currentMembership.permissions.includes("manage_members")) {
      throw new Error("Permission denied");
    }
    
    const targetMembership = await ctx.db
      .query("communityMembers")
      .filter((q) =>
        q.and(
          q.eq(q.field("userId"), args.userId),
          q.eq(q.field("communityId"), args.communityId)
        )
      )
      .first();
    
    if (!targetMembership) {
      throw new Error("User not found in this community");
    }
    
    await ctx.db.patch(targetMembership._id, {
      role: args.newRole,
      permissions: args.newPermissions,
    });
    
    return { success: true };
  },
});

// Mutation to create a community challenge
export const createChallenge = mutation({
  args: {
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
    communityId: v.string(),
    tags: v.array(v.string()),
    location: v.optional(v.object({ lat: v.number(), lng: v.number() })),
    isPublic: v.boolean(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Authentication required");
    }
    
    // Check if user is a member of the community
    const membership = await ctx.db
      .query("communityMembers")
      .filter((q) =>
        q.and(
          q.eq(q.field("userId"), userId),
          q.eq(q.field("communityId"), args.communityId)
        )
      )
      .first();
    
    if (!membership) {
      throw new Error("Not a member of this community");
    }
    
    const challengeId = await ctx.db.insert("challenges", {
      title: args.title,
      description: args.description,
      imageUrl: args.imageUrl,
      category: args.category,
      difficulty: args.difficulty,
      duration: args.duration,
      maxParticipants: args.maxParticipants,
      startDate: args.startDate,
      endDate: args.endDate,
      requirements: args.requirements,
      rewards: args.rewards,
      status: "draft",
      createdBy: userId,
      participants: [],
      participantCount: 0,
      tags: args.tags,
      location: args.location,
      isPublic: args.isPublic,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
    
    return challengeId;
  },
});

// Mutation to publish a challenge
export const publishChallenge = mutation({
  args: { id: v.id("challenges") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Authentication required");
    }
    
    const challenge = await ctx.db.get(args.id);
    if (!challenge) {
      throw new Error("Challenge not found");
    }
    
    // Check if user created the challenge
    if (challenge.createdBy !== userId) {
      throw new Error("Permission denied");
    }
    
    await ctx.db.patch(args.id, {
      status: "active",
    });
    
    return { success: true };
  },
});

// Mutation to join a challenge
export const joinChallenge = mutation({
  args: { id: v.id("challenges") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Authentication required");
    }
    
    const challenge = await ctx.db.get(args.id);
    if (!challenge) {
      throw new Error("Challenge not found");
    }
    
    // Check if challenge is active
    if (challenge.status !== "active") {
      throw new Error("Challenge is not active");
    }
    
    // Check if already joined
    if (challenge.participants.includes(userId)) {
      throw new Error("Already joined this challenge");
    }
    
    // Check max participants
    if (challenge.maxParticipants && challenge.participantCount >= challenge.maxParticipants) {
      throw new Error("Challenge is full");
    }
    
    await ctx.db.patch(args.id, {
      participants: [...challenge.participants, userId],
      participantCount: challenge.participantCount + 1,
    });
    
    return { success: true };
  },
});

// Mutation to leave a challenge
export const leaveChallenge = mutation({
  args: { id: v.id("challenges") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Authentication required");
    }
    
    const challenge = await ctx.db.get(args.id);
    if (!challenge) {
      throw new Error("Challenge not found");
    }
    
    // Check if joined
    if (!challenge.participants.includes(userId)) {
      throw new Error("Not joined in this challenge");
    }
    
    await ctx.db.patch(args.id, {
      participants: challenge.participants.filter(id => id !== userId),
      participantCount: challenge.participantCount - 1,
    });
    
    return { success: true };
  },
});

// Mutation to create a discussion
export const createDiscussion = mutation({
  args: {
    title: v.string(),
    content: v.string(),
    communityId: v.string(),
    challengeId: v.optional(v.id("challenges")),
    category: v.string(),
    tags: v.array(v.string()),
    images: v.array(v.string()),
    isPinned: v.boolean(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Authentication required");
    }
    
    // Check if user is a member of the community
    const membership = await ctx.db
      .query("communityMembers")
      .filter((q) =>
        q.and(
          q.eq(q.field("userId"), userId),
          q.eq(q.field("communityId"), args.communityId)
        )
      )
      .first();
    
    if (!membership) {
      throw new Error("Not a member of this community");
    }
    
    const discussionId = await ctx.db.insert("discussions", {
      title: args.title,
      content: args.content,
      authorId: userId,
      communityId: args.communityId,
      challengeId: args.challengeId,
      category: args.category,
      tags: args.tags,
      images: args.images,
      isPinned: args.isPinned,
      isLocked: false,
      viewCount: 0,
      likeCount: 0,
      commentCount: 0,
      status: "active",
      lastActivity: Date.now(),
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
    
    return discussionId;
  },
});

// Mutation to update discussion
export const updateDiscussion = mutation({
  args: {
    id: v.id("discussions"),
    title: v.optional(v.string()),
    content: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
    images: v.optional(v.array(v.string())),
    isPinned: v.optional(v.boolean()),
    isLocked: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Authentication required");
    }
    
    const discussion = await ctx.db.get(args.id);
    if (!discussion) {
      throw new Error("Discussion not found");
    }
    
    // Check if user authored the discussion
    if (discussion.authorId !== userId) {
      throw new Error("Permission denied");
    }
    
    await ctx.db.patch(args.id, {
      ...args,
      updatedAt: Date.now(),
    });
    
    return { success: true };
  },
});

// Mutation to delete discussion
export const deleteDiscussion = mutation({
  args: { id: v.id("discussions") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Authentication required");
    }
    
    const discussion = await ctx.db.get(args.id);
    if (!discussion) {
      throw new Error("Discussion not found");
    }
    
    // Check if user authored the discussion or has permission
    if (discussion.authorId !== userId) {
      throw new Error("Permission denied");
    }
    
    await ctx.db.delete(args.id);
    
    return { success: true };
  },
});

// Mutation to create a comment
export const createComment = mutation({
  args: {
    discussionId: v.id("discussions"),
    content: v.string(),
    parentId: v.optional(v.id("comments")),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Authentication required");
    }
    
    const discussion = await ctx.db.get(args.discussionId);
    if (!discussion) {
      throw new Error("Discussion not found");
    }
    
    // Check if discussion is locked
    if (discussion.isLocked) {
      throw new Error("Discussion is locked");
    }
    
    const commentId = await ctx.db.insert("comments", {
      content: args.content,
      authorId: userId,
      discussionId: args.discussionId,
      parentId: args.parentId,
      likes: 0,
      isAnswer: false,
      isReported: false,
      status: "active",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
    
    // Increment comment count
    await ctx.db.patch(args.discussionId, {
      commentCount: discussion.commentCount + 1,
      lastActivity: Date.now(),
    });
    
    return commentId;
  },
});

// Mutation to update comment
export const updateComment = mutation({
  args: {
    id: v.id("comments"),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Authentication required");
    }
    
    const comment = await ctx.db.get(args.id);
    if (!comment) {
      throw new Error("Comment not found");
    }
    
    // Check if user authored the comment
    if (comment.authorId !== userId) {
      throw new Error("Permission denied");
    }
    
    await ctx.db.patch(args.id, {
      content: args.content,
      updatedAt: Date.now(),
    });
    
    return { success: true };
  },
});

// Mutation to delete comment
export const deleteComment = mutation({
  args: { id: v.id("comments") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Authentication required");
    }
    
    const comment = await ctx.db.get(args.id);
    if (!comment) {
      throw new Error("Comment not found");
    }
    
    // Check if user authored the comment or has permission
    if (comment.authorId !== userId) {
      throw new Error("Permission denied");
    }
    
    await ctx.db.delete(args.id);
    
    // Decrement comment count
    const discussion = await ctx.db.get(comment.discussionId);
    if (discussion) {
      await ctx.db.patch(comment.discussionId, {
        commentCount: Math.max(0, discussion.commentCount - 1),
        lastActivity: Date.now(),
      });
    }
    
    return { success: true };
  },
});

// Action to get community statistics
export const getCommunityStats = action({
  args: { communityId: v.string() },
  handler: async (ctx, args) => {
    // Get member count
    const members = await ctx.db
      .query("communityMembers")
      .filter((q: any) => q.eq(q.field("communityId"), args.communityId))
      .filter((q: any) => q.eq(q.field("isActive"), true))
      .collect();
    
    // Get active challenges
    const challenges = await ctx.db
      .query("challenges")
      .filter((q: any) => q.eq(q.field("communityId"), args.communityId))
      .filter((q: any) => q.eq(q.field("status"), "active"))
      .collect();
    
    // Get total discussions
    const discussions = await ctx.db
      .query("discussions")
      .filter((q: any) => q.eq(q.field("communityId"), args.communityId))
      .collect();
    
    // Get total comments
    let totalComments = 0;
    for (const discussion of discussions) {
      const comments = await ctx.db
        .query("comments")
        .filter((q: any) => q.eq(q.field("discussionId"), discussion._id))
        .collect();
      totalComments += comments.length;
    }
    
    return {
      memberCount: members.length,
      activeChallenges: challenges.length,
      totalDiscussions: discussions.length,
      totalComments,
      recentActivity: discussions.slice(0, 5), // Most recent discussions
    };
  },
});