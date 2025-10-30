const API_BASE = '/api';

const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const api = {
  // Auth
  register: async (userData) => {
    const response = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData)
    });
    return response.json();
  },

  login: async (credentials) => {
    const response = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials)
    });
    return response.json();
  },

  // Stories
  getStories: async () => {
    const response = await fetch(`${API_BASE}/stories`, {
      headers: getAuthHeaders()
    });
    return response.json();
  },

  uploadStory: async (imageBase64, caption) => {
    const response = await fetch(`${API_BASE}/stories`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders()
      },
      body: JSON.stringify({ imageBase64, caption })
    });
    return response.json();
  },

  markStoryViewed: async (storyId) => {
    const response = await fetch(`${API_BASE}/stories/${storyId}/view`, {
      method: 'POST',
      headers: getAuthHeaders()
    });
    return response.json();
  },

  // Posts
  getPosts: async () => {
    const response = await fetch(`${API_BASE}/posts`, {
      headers: getAuthHeaders()
    });
    return response.json();
  },

  createPost: async (content, imageBase64 = null) => {
    const response = await fetch(`${API_BASE}/posts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders()
      },
      body: JSON.stringify({ content, imageBase64 })
    });
    return response.json();
  },

  toggleLike: async (postId) => {
    const response = await fetch(`${API_BASE}/posts/${postId}/like`, {
      method: 'POST',
      headers: getAuthHeaders()
    });
    return response.json();
  },

  getComments: async (postId) => {
    const response = await fetch(`${API_BASE}/posts/${postId}/comments`, {
      headers: getAuthHeaders()
    });
    return response.json();
  },

  addComment: async (postId, content) => {
    const response = await fetch(`${API_BASE}/posts/${postId}/comments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders()
      },
      body: JSON.stringify({ content })
    });
    return response.json();
  },

  searchPosts: async (query) => {
    const response = await fetch(`${API_BASE}/posts/search?q=${encodeURIComponent(query)}`, {
      headers: getAuthHeaders()
    });
    return response.json();
  },

  getTrendingHashtags: async () => {
    const response = await fetch(`${API_BASE}/posts/trending`, {
      headers: getAuthHeaders()
    });
    return response.json();
  },

  repostPost: async (postId, comment = null) => {
    const response = await fetch(`${API_BASE}/posts/${postId}/repost`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders()
      },
      body: JSON.stringify({ comment })
    });
    return response.json();
  }
};