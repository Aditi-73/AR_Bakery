import Comment from '../models/Comment.js';
import axios from 'axios';

export const createComment = async (req, res) => {
  try {
    const { content, postId, parentId } = req.body;
    
    // Verify post exists by calling post service
    try {
      await axios.get(`${process.env.POST_SERVICE_URL}/api/v1/posts/${postId}`);
    } catch (error) {
      return res.status(404).json({ error: 'Post not found' });
    }
    
    let depth = 0;
    if (parentId) {
      const parentComment = await Comment.findById(parentId);
      if (!parentComment) {
        return res.status(404).json({ error: 'Parent comment not found' });
      }
      depth = parentComment.depth + 1;
      
      // Limit comment depth to prevent infinite nesting
      if (depth > 5) {
        return res.status(400).json({ error: 'Maximum comment depth exceeded' });
      }
    }
    
    const comment = new Comment({
      content,
      postId,
      parentId: parentId || null,
      depth,
      authorId: req.user.id,
      authorName: req.user.name || 'Unknown User',
      authorAvatar: req.user.avatar
    });

    await comment.save();
    
    // Update post comment count (async - fire and forget)
    try {
      await axios.post(`${process.env.POST_SERVICE_URL}/api/v1/posts/${postId}/update-comment-count`, {
        increment: 1
      });
    } catch (error) {
      console.error('Failed to update post comment count:', error.message);
    }
    
    res.status(201).json({
      success: true,
      comment: {
        id: comment._id,
        content: comment.content,
        postId: comment.postId,
        authorId: comment.authorId,
        authorName: comment.authorName,
        parentId: comment.parentId,
        depth: comment.depth,
        likeCount: comment.likeCount,
        createdAt: comment.createdAt
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create comment' });
  }
};

export const getComments = async (req, res) => {
  try {
    const { postId, page = 1, limit = 50 } = req.query;
    
    if (!postId) {
      return res.status(400).json({ error: 'Post ID is required' });
    }
    
    const comments = await Comment.find({ 
      postId, 
      status: 'active' 
    })
      .sort({ createdAt: 1 }) // Oldest first for nested comments
      .limit(limit * 1)
      .skip((page - 1) * limit);
    
    // Build nested comment structure
    const nestedComments = buildNestedComments(comments);
    
    const total = await Comment.countDocuments({ postId, status: 'active' });
    
    res.json({
      success: true,
      comments: nestedComments,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch comments' });
  }
};

// Helper function to build nested comment structure
const buildNestedComments = (comments) => {
  const commentMap = new Map();
  const rootComments = [];
  
  // Create a map of all comments
  comments.forEach(comment => {
    commentMap.set(comment._id.toString(), {
      ...comment.toObject(),
      replies: []
    });
  });
  
  // Build nested structure
  comments.forEach(comment => {
    const commentObj = commentMap.get(comment._id.toString());
    
    if (comment.parentId) {
      const parent = commentMap.get(comment.parentId.toString());
      if (parent) {
        parent.replies.push(commentObj);
      }
    } else {
      rootComments.push(commentObj);
    }
  });
  
  return rootComments;
};

export const updateComment = async (req, res) => {
  try {
    const { id } = req.params;
    const { content } = req.body;
    
    const comment = await Comment.findById(id);
    
    if (!comment) {
      return res.status(404).json({ error: 'Comment not found' });
    }
    
    // Check if user owns the comment or is admin
    if (comment.authorId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Not authorized to update this comment' });
    }
    
    comment.content = content;
    await comment.save();
    
    res.json({
      success: true,
      comment
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update comment' });
  }
};

export const deleteComment = async (req, res) => {
  try {
    const { id } = req.params;
    
    const comment = await Comment.findById(id);
    
    if (!comment) {
      return res.status(404).json({ error: 'Comment not found' });
    }
    
    // Check if user owns the comment or is admin
    if (comment.authorId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Not authorized to delete this comment' });
    }
    
    // Soft delete by changing status
    comment.status = 'deleted';
    comment.content = '[deleted]';
    await comment.save();
    
    // Update post comment count (async)
    try {
      await axios.post(`${process.env.POST_SERVICE_URL}/api/v1/posts/${comment.postId}/update-comment-count`, {
        increment: -1
      });
    } catch (error) {
      console.error('Failed to update post comment count:', error.message);
    }
    
    res.json({
      success: true,
      message: 'Comment deleted successfully'
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete comment' });
  }
};

export const likeComment = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    const comment = await Comment.findById(id);
    
    if (!comment) {
      return res.status(404).json({ error: 'Comment not found' });
    }
    
    const alreadyLiked = comment.likes.includes(userId);
    
    if (alreadyLiked) {
      // Unlike
      comment.likes = comment.likes.filter(like => like !== userId);
    } else {
      // Like
      comment.likes.push(userId);
    }
    
    await comment.save();
    
    res.json({
      success: true,
      liked: !alreadyLiked,
      likeCount: comment.likeCount
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update like' });
  }
};