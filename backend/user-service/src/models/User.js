import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  avatar: String,
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },
  providers: {
    google: {
      id: String,
      accessToken: String,
      refreshToken: String,
      email: String,
      picture: String
    },
    facebook: {
      id: String,
      accessToken: String,
      refreshToken: String,
      email: String,
      picture: String
    }
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  lastLogin: Date,
  active: {
    type: Boolean,
    default: true
  }
});

userSchema.pre('save', function(next) {
  if (this.isModified('providers')) {
    this.lastLogin = new Date();
  }
  next();
});

export default mongoose.model('User', userSchema);