import mongoose from 'mongoose';

const commentSchema = new mongoose.Schema({
  content: {
    type: String,
    required: true,
    maxlength: 1000
  },
  postId: {
    type: String,
    required: true
  },
  authorId: {
    type: String,
    required: true
  },
  authorName: {
    type: String,
    required: true
  },
  authorAvatar: String,
  parentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Comment',
    default: null
  },
  depth: {
    type: Number,
    default: 0
  },
  likes: [String], // Array of user IDs who liked the comment
  likeCount: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['active', 'deleted'],
    default: 'active'
  }
}, {
  timestamps: true
});

// Update like count
commentSchema.pre('save', function(next) {
  this.likeCount = this.likes.length;
  next();
});

// Index for better query performance
commentSchema.index({ postId: 1, createdAt: -1 });
commentSchema.index({ parentId: 1 });
commentSchema.index({ authorId: 1 });

export default mongoose.model('Comment', commentSchema);