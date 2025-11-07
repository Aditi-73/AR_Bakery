import React, { createContext, useState, useEffect } from 'react';
import { authAPI, tokenManager } from '../services/api';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check for existing session on app load
  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const token = tokenManager.getToken();
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const response = await authAPI.getProfile();
      setUser(response); // The response itself contains user data
    } catch (error) {
      console.error('Auth check failed:', error);
      tokenManager.clearTokens();
    } finally {
      setLoading(false);
    }
  };

  // Google OAuth login
  const loginWithGoogle = async () => {
    try {
      // Start Google OAuth flow
      const response = await authAPI.startGoogleLogin();
      
      // Redirect to Google OAuth
      window.location.href = response.authUrl;
    } catch (error) {
      console.error('Google login failed:', error);
      throw error;
    }
  };

  // Handle Google OAuth callback
  const handleGoogleCallback = async (code) => {
    try {
      await checkAuth();
    } catch (error) {
      console.error('Google callback failed:', error);
      throw error;
    }
  };

  // Set tokens manually (for OAuth callback)
  const setAuthTokens = (token, refreshToken) => {
    tokenManager.setToken(token);
    tokenManager.setRefreshToken(refreshToken);
    return checkAuth();
  };

  // Email/password login (if you add it later)
  const login = async (email, password) => {
    throw new Error('Email/password login not implemented yet');
  };

  // Register (if you add it later)
  const register = async (email, password) => {
    throw new Error('Registration not implemented yet');
  };

  const logout = async () => {
    try {
      await authAPI.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
      tokenManager.clearTokens();
    }
  };

  const updateProfile = async (profileData) => {
    try {
      const updatedUser = { ...user, ...profileData };
      setUser(updatedUser);
      return updatedUser;
    } catch (error) {
      console.error('Profile update failed:', error);
      throw error;
    }
  };

  // CORRECTED: Proper key-value pairs
  const value = {
    user: user,
    login: login,
    loginWithGoogle: loginWithGoogle,
    handleGoogleCallback: handleGoogleCallback,
    setAuthTokens: setAuthTokens,
    register: register,
    logout: logout,
    updateProfile: updateProfile,
    loading: loading
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};