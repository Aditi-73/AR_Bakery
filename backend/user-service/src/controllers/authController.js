import axios from 'axios';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export async function googleCallback(req, res) {
  try {
    const { code, state } = req.query;
    const { error } = req.query;

    if (error) {
      console.error('OAuth error:', error);
      const frontendURL = process.env.FRONTEND_URL || 'http://localhost:5173';
      return res.redirect(`${frontendURL}/login?error=Authentication+failed`);
    }

    if (!code) {
      const frontendURL = process.env.FRONTEND_URL || 'http://localhost:5173';
      return res.redirect(`${frontendURL}/login?error=Missing+authorization+code`);
    }

    // Extract code_verifier from state parameter
    let codeVerifier;
    try {
      const stateData = JSON.parse(Buffer.from(state, 'base64').toString());
      codeVerifier = stateData.codeVerifier;
    } catch (err) {
      console.error('Failed to parse state:', err);
      const frontendURL = process.env.FRONTEND_URL || 'http://localhost:5173';
      return res.redirect(`${frontendURL}/login?error=Invalid+state+parameter`);
    }

    if (!codeVerifier) {
      const frontendURL = process.env.FRONTEND_URL || 'http://localhost:5173';
      return res.redirect(`${frontendURL}/login?error=Missing+code+verifier`);
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

    // REDIRECT TO FRONTEND WITH TOKENS
    const frontendURL = process.env.FRONTEND_URL || 'http://localhost:5173';
    
    const redirectURL = new URL(`${frontendURL}/oauth/callback`);
    redirectURL.searchParams.set('token', token);
    redirectURL.searchParams.set('refreshToken', refreshToken);
    redirectURL.searchParams.set('success', 'true');

    console.log('🔐 OAuth Success - Redirecting to frontend with tokens');
    res.redirect(redirectURL.toString());
    
  } catch (error) {
    console.error('❌ OAuth error:', error.response?.data || error.message);
    const frontendURL = process.env.FRONTEND_URL || 'http://localhost:5173';
    res.redirect(`${frontendURL}/login?error=Authentication+failed`);
  }
}

// Refresh Token Handler
export async function refreshToken(req, res) {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(401).json({ error: 'Refresh token required' });
    }

    // Verify refresh token
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    
    // Find user
    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Generate new access token
    const newAccessToken = jwt.sign(
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
      accessToken: newAccessToken,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        avatar: user.avatar
      }
    });
  } catch (error) {
    console.error('Refresh token error:', error);
    res.status(401).json({ error: 'Invalid or expired refresh token' });
  }
}

// Get Profile Handler
export async function getProfile(req, res) {
  try {
    const user = await User.findById(req.user.id).select('-providers.google.accessToken -providers.google.refreshToken');
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      id: user._id,
      email: user.email,
      name: user.name,
      avatar: user.avatar,
      role: user.role,
      createdAt: user.createdAt
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
}