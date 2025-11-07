import jwt from 'jsonwebtoken';
import axios from 'axios';

export const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Access token required' });
    }

    const token = authHeader.split(' ')[1];
    
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      req.user = {
        id: decoded.id,
        email: decoded.email,
        role: decoded.role,
        name: decoded.name,
        avatar: decoded.avatar
      };
      
      next();
    } catch (jwtError) {
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