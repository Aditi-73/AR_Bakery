import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import session from 'express-session';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import helmet from 'helmet';
import MongoStore from 'connect-mongo';

import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/users.js';
import healthRoutes from './routes/health.js';
import { authMiddleware } from './middleware/auth.js';

dotenv.config();
const app = express();
const PORT = process.env.PORT || 3001;

// Session configuration
app.use(session({
  secret: process.env.SESSION_SECRET || 'your-session-secret',
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: process.env.MONGO_URI || 'mongodb://localhost:27017/mern_auth',
    dbName: process.env.DB_NAME || 'users_db',
    collectionName: 'sessions'
  }),
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 1000 * 60 * 60 * 24 // 24 hours
  }
}));

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(cookieParser());
app.use(session({
  secret: process.env.SESSION_SECRET || 'your-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000
  }
}));

// MongoDB connection - uses mern_auth database with users_db as the dbName
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/mern_auth', {
  dbName: process.env.DB_NAME || 'users_db',
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

mongoose.connection.on('connected', () => {
  console.log(`Connected to MongoDB: mern_auth -> ${process.env.DB_NAME || 'users_db'}`);
});

mongoose.connection.on('error', (err) => {
  console.error('MongoDB connection error:', err);
});

// Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/health', healthRoutes);

// Get current user
app.get('/api/v1/me', authMiddleware, (req, res) => {
  res.redirect('/Home');
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Route not found',
    message: `Cannot ${req.method} ${req.originalUrl}`
  });
});

// Error handling
app.use((error, req, res, next) => {
  console.error('Error:', error);
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
  });
});

app.listen(PORT, () => {
  console.log(`User service running on port ${PORT}`);
  console.log(`Database: mern_auth -> ${process.env.DB_NAME || 'users_db'}`);
});