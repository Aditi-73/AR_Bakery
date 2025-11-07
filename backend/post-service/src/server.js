import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import helmet from 'helmet';

import postRoutes from './routes/posts.js';
import healthRoutes from './routes/health.js';

dotenv.config();
const app = express();
const PORT = process.env.PORT || 3002;

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json({ limit: '10mb' }));

// MongoDB connection - uses mern_auth database with posts_db as the dbName
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/mern_auth', {
  dbName: process.env.DB_NAME || 'posts_db',
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

mongoose.connection.on('connected', () => {
  console.log(`Connected to MongoDB: mern_auth -> ${process.env.DB_NAME || 'posts_db'}`);
});

// Routes
app.use('/api/v1/posts', postRoutes);
app.use('/health', healthRoutes);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Route not found',
    message: `Cannot ${req.method} ${req.originalUrl}`
  });
});

// Error handling
app.use((error, req, res, next) => {
  console.error('Post Service Error:', error);
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
  });
});

app.listen(PORT, () => {
  console.log(`Post service running on port ${PORT}`);
  console.log(`Database: mern_auth -> ${process.env.DB_NAME || 'posts_db'}`);
});