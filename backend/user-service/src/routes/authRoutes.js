import express from "express";
import { googleCallback, refreshToken, getProfile } from "../controllers/authController.js";
import { generateCodeVerifier, generateCodeChallenge } from '../utils/pkce.js';
import { authMiddleware } from "../middleware/auth.js";

const router = express.Router();

// Start Google Login
router.get("/google", (req, res) => {
  const client_id = process.env.GOOGLE_CLIENT_ID;
  const redirect_uri = process.env.GOOGLE_REDIRECT_URI;
  const scope = encodeURIComponent("profile email");
  
  // Generate PKCE Challenge
  const codeVerifier = generateCodeVerifier();
  const codeChallenge = generateCodeChallenge(codeVerifier);
  
  // Store code_verifier in state parameter instead of session
  const stateData = {
    codeVerifier: codeVerifier,
    timestamp: Date.now()
  };
  
  const state = Buffer.from(JSON.stringify(stateData)).toString('base64');

  const authUrl =
    `https://accounts.google.com/o/oauth2/v2/auth?` +
    `client_id=${client_id}` +
    `&redirect_uri=${redirect_uri}` +
    `&response_type=code` +
    `&scope=${scope}` +
    `&access_type=offline` +
    `&code_challenge=${codeChallenge}` +
    `&code_challenge_method=S256` +
    `&state=${state}`; // Include state parameter

  res.json({ authUrl });
});

// Google Callback
router.get("/google/callback", googleCallback);

// Refresh token endpoint
router.post("/refresh-token", refreshToken);

// Get user profile
router.get("/profile", authMiddleware, getProfile);

// Logout endpoint
router.post("/logout", (req, res) => {
  res.json({ message: "Logged out successfully" });
});

export default router;