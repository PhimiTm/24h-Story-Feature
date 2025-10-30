import React, { useState, useEffect } from 'react';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import StoriesBar from './components/StoriesBar';
import StoryViewer from './components/StoryViewer';
import AuthModal from './components/AuthModal';
import PostComposer from './components/PostComposer';
import PostsFeed from './components/PostsFeed';
import SearchBar from './components/SearchBar';
import { resizeImage, groupStoriesByUser } from './utils/imageUtils';
import { api } from './utils/api';
import toast from 'react-hot-toast';

function AppContent() {
  const [stories, setStories] = useState([]);
  const [posts, setPosts] = useState([]);
  const [searchResults, setSearchResults] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewerOpen, setViewerOpen] = useState(false);
  const [selectedUserStories, setSelectedUserStories] = useState([]);
  const { isAuthenticated, user, logout } = useAuth();

  // Load stories from API
  const loadStories = async () => {
    try {
      const storiesData = await api.getStories();
      if (storiesData.error) {
        toast.error(storiesData.error);
      } else {
        setStories(storiesData);
      }
    } catch (error) {
      toast.error('Failed to load stories');
    }
  };

  // Load posts from API
  const loadPosts = async () => {
    try {
      const postsData = await api.getPosts();
      if (postsData.error) {
        toast.error(postsData.error);
      } else {
        setPosts(postsData);
      }
    } catch (error) {
      toast.error('Failed to load posts');
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      loadStories();
      loadPosts();
    }
  }, [isAuthenticated]);

  const handleAddStory = async (file, caption) => {
    try {
      const resizedImage = await resizeImage(file);
      const result = await api.uploadStory(resizedImage, caption);
      
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success('Story uploaded successfully!');
        loadStories(); // Refresh stories
      }
    } catch (error) {
      toast.error('Failed to upload story');
    }
  };

  const handleStoryClick = (userId) => {
    const groupedStories = groupStoriesByUser(stories);
    setSelectedUserStories(groupedStories[userId].stories);
    setViewerOpen(true);
  };

  const handleStoryViewed = () => {
    // Refresh stories to update view status
    loadStories();
  };

  const handlePostCreated = async (content, imageBase64 = null) => {
    const result = await api.createPost(content, imageBase64);
    if (result.error) {
      throw new Error(result.error);
    }
    loadPosts(); // Refresh posts
    // Clear search if active
    if (searchResults) {
      setSearchResults(null);
      setSearchQuery('');
    }
  };

  const handleSearchResults = (results, query) => {
    setSearchResults(results);
    setSearchQuery(query);
  };

  const handleClearSearch = () => {
    setSearchResults(null);
    setSearchQuery('');
  };

  const displayPosts = searchResults || posts;
  const feedTitle = searchResults 
    ? `Search results for "${searchQuery}" (${searchResults.length})`
    : null;

  const handleCloseViewer = () => {
    setViewerOpen(false);
  };

  if (!isAuthenticated) {
    return <AuthModal />;
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700">
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">
          Stories
        </h1>
        <div className="flex items-center space-x-4">
          <span className="text-sm text-gray-600 dark:text-gray-400">
            Welcome, {user?.username}
          </span>
          <button
            onClick={logout}
            className="px-3 py-1 text-sm text-white bg-red-500 hover:bg-red-600 font-medium rounded-md border border-red-500 hover:border-red-600 transition-all duration-200"
          >
            Logout
          </button>
        </div>
      </div>

      <StoriesBar 
        stories={stories}
        onAddStory={handleAddStory}
        onStoryClick={handleStoryClick}
      />
      
      <div className="max-w-2xl mx-auto px-4 py-8">
        <SearchBar 
          onSearchResults={handleSearchResults}
          onClearSearch={handleClearSearch}
        />
        <PostComposer onPostCreated={handlePostCreated} user={user} />
        
        {feedTitle && (
          <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900 rounded-lg">
            <p className="text-blue-700 dark:text-blue-300 font-medium">{feedTitle}</p>
          </div>
        )}
        
        <PostsFeed posts={displayPosts} onPostsUpdate={loadPosts} user={user} />
      </div>

      {viewerOpen && (
        <StoryViewer
          userStories={selectedUserStories}
          onClose={handleCloseViewer}
          onStoryViewed={handleStoryViewed}
        />
      )}
      
      <Toaster position="top-right" />
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;