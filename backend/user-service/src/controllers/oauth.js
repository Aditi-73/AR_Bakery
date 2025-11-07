import axios from 'axios';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export async function googleCallback(req, res) {
  try {
    const { code } = req.query;
    const { error } = req.query;

    if (error) {
      console.error('OAuth error:', error);
      return res.status(400).json({
        error: 'OAuth failed',
        message: error
      });
    }

    if (!code) {
      return res.status(400).json({
        error: 'Missing authorization code'
      });
    }

    // Get code verifier from session
    const codeVerifier = req.session?.codeVerifier;
    if (!codeVerifier) {
      return res.status(400).json({
        error: 'Missing code verifier'
      });
    }

    // Exchange code for tokens
    const tokenRes = await axios.post("https://oauth2.googleapis.com/token", {
      code,
      client_id: process.env.GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_CLIENT_SECRET,
      redirect_uri: process.env.GOOGLE_REDIRECT_URI,
      grant_type: "authorization_code",
      code_verifier: codeVerifier
    });

    // Clear code verifier from session
    delete req.session.codeVerifier;

    // Get user info from Google
    const userInfo = await axios.get('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${tokenRes.data.access_token}` }
    });

    // Find or create user
    let user = await User.findOne({ 
      $or: [
        { email: userInfo.data.email },
        { 'providers.google.id': userInfo.data.id }
      ]
    });

    if (!user) {
      user = await User.create({
        email: userInfo.data.email,
        name: userInfo.data.name,
        avatar: userInfo.data.picture,
        providers: {
          google: {
            id: userInfo.data.id,
            accessToken: tokenRes.data.access_token,
            refreshToken: tokenRes.data.refresh_token
          }
        }
      });
    } else {
      // Update existing user
      user.providers = user.providers || {};
      user.providers.google = {
        id: userInfo.data.id,
        accessToken: tokenRes.data.access_token,
        refreshToken: tokenRes.data.refresh_token || user.providers.google?.refreshToken
      };
      await user.save();
    }

    // Generate JWT token
    const token = jwt.sign(
      { 
        id: user._id, 
        email: user.email,
        role: user.role,
        service: 'user-service'
      },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    // Generate refresh token
    const refreshToken = jwt.sign(
      { id: user._id },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      success: true,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        avatar: user.avatar,
        role: user.role
      },
      token,
      refreshToken
    });
  } catch (error) {
    console.error('OAuth error:', error.response?.data || error.message);
    res.status(500).json({
      error: 'Authentication failed',
      message: error.message
    });
  }
}

export async function refreshToken(req, res) {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(401).json({ error: "Refresh token required" });
    }

    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    const user = await User.findById(decoded.id);
    
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Generate new access token
    const newToken = jwt.sign(
      { 
        id: user._id, 
        email: user.email,
        role: user.role,
        service: 'user-service'
      },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.json({
      success: true,
      token: newToken
    });
  } catch (error) {
    res.status(401).json({ error: "Invalid refresh token" });
  }
}

export async function getProfile(req, res) {
  try {
    const user = await User.findById(req.user.id).select('-providers');
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({
      success: true,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        avatar: user.avatar,
        role: user.role,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch profile" });
  }
}