import express from "express";
import { authMiddleware, adminMiddleware } from "../middleware/auth.js";
import User from "../models/User.js";

const router = express.Router();

// Get all users (admin only)
router.get("/", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const users = await User.find().select('-providers');
    res.json({
      success: true,
      users,
      count: users.length
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch users" });
  }
});

// Get all users - Simple endpoint without admin check (for development)
router.get("/all", async (req, res) => {
  try {
    const users = await User.find()
      .select('email name avatar role createdAt lastLogin active')
      .sort({ createdAt: -1 });
    
    res.json({
      success: true,
      count: users.length,
      users: users.map(user => ({
        id: user._id,
        email: user.email,
        name: user.name,
        avatar: user.avatar,
        role: user.role,
        createdAt: user.createdAt,
        lastLogin: user.lastLogin,
        active: user.active
      }))
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: "Failed to fetch users" });
  }
});

// Get user by ID
router.get("/:id", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-providers');
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    res.json({
      success: true,
      user
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch user" });
  }
});

// Update user profile
router.put("/profile", authMiddleware, async (req, res) => {
  try {
    const { name, avatar } = req.body;
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { name, avatar },
      { new: true, runValidators: true }
    ).select('-providers');

    res.json({
      success: true,
      user
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to update profile" });
  }
});

export default router;