import Post from '../models/Post.js';

export const createPost = async (req, res) => {
  try {
    const { title, content, tags, excerpt, featuredImage, status = 'published' } = req.body;
    
    const post = new Post({
      title,
      content,
      tags: tags || [],
      excerpt,
      featuredImage,
      status,
      authorId: req.user.id,
      authorName: req.user.name || 'Unknown User',
      authorAvatar: req.user.avatar
    });

    await post.save();
    
    res.status(201).json({
      success: true,
      post: {
        id: post._id,
        title: post.title,
        content: post.content,
        authorId: post.authorId,
        authorName: post.authorName,
        tags: post.tags,
        status: post.status,
        slug: post.slug,
        createdAt: post.createdAt,
        updatedAt: post.updatedAt
      }
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ error: 'Post with this title already exists' });
    }
    res.status(500).json({ error: 'Failed to create post' });
  }
};

export const getPosts = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      status = 'published',
      authorId,
      tag 
    } = req.query;
    
    const query = { status };
    
    if (authorId) query.authorId = authorId;
    if (tag) query.tags = tag;
    
    const posts = await Post.find(query)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .select('-content'); // Don't send full content in list
    
    const total = await Post.countDocuments(query);
    
    res.json({
      success: true,
      posts,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch posts' });
  }
};

export const getPost = async (req, res) => {
  try {
    const { id } = req.params;
    
    const post = await Post.findOne({
      $or: [
        { _id: id },
        { slug: id }
      ]
    });
    
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }
    
    // Increment view count
    post.viewCount += 1;
    await post.save();
    
    res.json({
      success: true,
      post
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch post' });
  }
};

export const updatePost = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content, tags, excerpt, featuredImage, status } = req.body;
    
    const post = await Post.findById(id);
    
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }
    
    // Check if user owns the post or is admin
    if (post.authorId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Not authorized to update this post' });
    }
    
    // Update fields
    if (title) post.title = title;
    if (content) post.content = content;
    if (tags) post.tags = tags;
    if (excerpt) post.excerpt = excerpt;
    if (featuredImage) post.featuredImage = featuredImage;
    if (status) post.status = status;
    
    await post.save();
    
    res.json({
      success: true,
      post
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update post' });
  }
};

export const deletePost = async (req, res) => {
  try {
    const { id } = req.params;
    
    const post = await Post.findById(id);
    
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }
    
    // Check if user owns the post or is admin
    if (post.authorId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Not authorized to delete this post' });
    }
    
    await Post.findByIdAndDelete(id);
    
    res.json({
      success: true,
      message: 'Post deleted successfully'
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete post' });
  }
};

export const likePost = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    const post = await Post.findById(id);
    
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }
    
    const alreadyLiked = post.likes.includes(userId);
    
    if (alreadyLiked) {
      // Unlike
      post.likes = post.likes.filter(like => like !== userId);
    } else {
      // Like
      post.likes.push(userId);
    }
    
    await post.save();
    
    res.json({
      success: true,
      liked: !alreadyLiked,
      likeCount: post.likeCount
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update like' });
  }
};