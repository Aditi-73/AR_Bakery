import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import helmet from 'helmet';
import morgan from 'morgan';
import { createProxyMiddleware } from 'http-proxy-middleware';

dotenv.config();
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(morgan('combined'));

// Service URLs
const SERVICES = {
  user: process.env.USER_SERVICE_URL || 'http://localhost:3001',
  post: process.env.POST_SERVICE_URL || 'http://localhost:3002',
  comment: process.env.COMMENT_SERVICE_URL || 'http://localhost:3003'
};

// Auth middleware for protected routes
const authMiddleware = (req, res, next) => {
  const publicRoutes = [
    '/api/v1/auth/google',
    '/api/v1/auth/google/callback',
    '/api/v1/auth/refresh-token',
    '/api/v1/posts',
    '/api/v1/posts/',
    '/api/v1/users/all',
    '/health'
  ];

  // Skip auth for public routes
  if (publicRoutes.some(route => req.url.startsWith(route))) {
    return next();
  }

  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Access token required' });
  }

  // Add user info to headers for downstream services
  req.headers['x-user-id'] = 'extracted-from-token'; // You'd extract this from JWT
  next();
};

app.use(authMiddleware);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    service: 'api-gateway',
    version: '1.0.0'
  });
});

// Proxy routes
app.use('/api/v1/auth', createProxyMiddleware({
  target: SERVICES.user,
  changeOrigin: true,
  pathRewrite: {
    '^/api/v1/auth': '/api/v1/auth'
  },
  onError: (err, req, res) => {
    console.error('User Service Error:', err);
    res.status(503).json({ error: 'User service unavailable' });
  }
}));

app.use('/api/v1/users', createProxyMiddleware({
  target: SERVICES.user,
  changeOrigin: true,
  pathRewrite: {
    '^/api/v1/users': '/api/v1/users'
  },
  onError: (err, req, res) => {
    console.error('User Service Error:', err);
    res.status(503).json({ error: 'User service unavailable' });
  }
}));

app.use('/api/v1/posts', createProxyMiddleware({
  target: SERVICES.post,
  changeOrigin: true,
  pathRewrite: {
    '^/api/v1/posts': '/api/v1/posts'
  },
  onError: (err, req, res) => {
    console.error('Post Service Error:', err);
    res.status(503).json({ error: 'Post service unavailable' });
  }
}));

app.use('/api/v1/comments', createProxyMiddleware({
  target: SERVICES.comment,
  changeOrigin: true,
  pathRewrite: {
    '^/api/v1/comments': '/api/v1/comments'
  },
  onError: (err, req, res) => {
    console.error('Comment Service Error:', err);
    res.status(503).json({ error: 'Comment service unavailable' });
  }
}));

// Service health checks
app.get('/api/v1/health/services', async (req, res) => {
  const healthChecks = {};
  
  for (const [service, url] of Object.entries(SERVICES)) {
    try {
      const response = await fetch(`${url}/health`);
      healthChecks[service] = await response.json();
    } catch (error) {
      healthChecks[service] = {
        status: 'DOWN',
        error: error.message
      };
    }
  }
  
  res.json(healthChecks);
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
  console.error('Gateway Error:', error);
  res.status(500).json({
    error: 'Internal server error',
    message: 'Gateway service error'
  });
});

app.listen(PORT, () => {
  console.log(`API Gateway running on port ${PORT}`);
  console.log('Proxying to services:');
  Object.entries(SERVICES).forEach(([name, url]) => {
    console.log(`  ${name}: ${url}`);
  });
});