import jwt from 'jsonwebtoken';
import axios from 'axios';

// Validate JWT token and get user info from user service
export const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Access token required' });
    }

    const token = authHeader.split(' ')[1];
    
    // Verify token with user service or directly if we have the secret
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Add user info to request
      req.user = {
        id: decoded.id,
        email: decoded.email,
        role: decoded.role
      };
      
      next();
    } catch (jwtError) {
      // If JWT verification fails, try to validate with user service
      try {
        const userServiceResponse = await axios.get(
          `${process.env.USER_SERVICE_URL}/api/v1/me`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        
        req.user = userServiceResponse.data.user;
        next();
      } catch (serviceError) {
        return res.status(401).json({ error: 'Invalid or expired token' });
      }
    }
  } catch (error) {
    return res.status(401).json({ error: 'Authentication failed' });
  }
};