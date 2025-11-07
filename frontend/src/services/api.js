const API_BASE_URL = 'http://localhost:3000/api/v1';

// Generic API request function
const apiRequest = async (endpoint, options = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const token = localStorage.getItem('accessToken');
  
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    credentials: 'include',
    ...options,
  };

  if (config.body && typeof config.body === 'object') {
    config.body = JSON.stringify(config.body);
  }

  try {
    const response = await fetch(url, config);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || data.message || 'Something went wrong');
    }

    return data;
  } catch (error) {
    console.error('API Request Failed:', error);
    throw error;
  }
};

// Auth API
export const authAPI = {
  // Start Google OAuth flow
  startGoogleLogin: () => apiRequest('/auth/google'),
  
  // Refresh token
  refreshToken: (refreshToken) => apiRequest('/auth/refresh-token', {
    method: 'POST',
    body: { refreshToken }
  }),
  
  // Get user profile
  getProfile: () => apiRequest('/auth/profile'),
  
  // Logout
  logout: () => apiRequest('/auth/logout', { method: 'POST' })
};

// Users API
export const usersAPI = {
  getProfile: () => apiRequest('/users/profile'),
  updateProfile: (profileData) => apiRequest('/users/profile', {
    method: 'PUT',
    body: profileData
  })
};

// Posts API (we'll use this for products)
export const postsAPI = {
  getAll: (page = 1, limit = 10) => apiRequest(`/posts?page=${page}&limit=${limit}`),
  getById: (id) => apiRequest(`/posts/${id}`),
  create: (postData) => apiRequest('/posts', {
    method: 'POST',
    body: postData
  }),
  update: (id, postData) => apiRequest(`/posts/${id}`, {
    method: 'PUT',
    body: postData
  }),
  delete: (id) => apiRequest(`/posts/${id}`, { method: 'DELETE' })
};

// Comments API (we'll use this for reviews)
export const commentsAPI = {
  getByPost: (postId) => apiRequest(`/comments/post/${postId}`),
  create: (commentData) => apiRequest('/comments', {
    method: 'POST',
    body: commentData
  }),
  delete: (id) => apiRequest(`/comments/${id}`, { method: 'DELETE' })
};

// Token management
export const tokenManager = {
  getToken: () => localStorage.getItem('accessToken'),
  setToken: (token) => localStorage.setItem('accessToken', token),
  getRefreshToken: () => localStorage.getItem('refreshToken'),
  setRefreshToken: (token) => localStorage.setItem('refreshToken', token),
  clearTokens: () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
  }
};