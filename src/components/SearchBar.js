import React, { useState, useEffect } from 'react';
import { api } from '../utils/api';
import toast from 'react-hot-toast';

const SearchBar = ({ onSearchResults, onClearSearch }) => {
  const [query, setQuery] = useState('');
  const [trending, setTrending] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  const loadTrending = async () => {
    try {
      const trendingData = await api.getTrendingHashtags();
      if (!trendingData.error) {
        setTrending(trendingData);
      }
    } catch (error) {
      // Silently fail for trending
    }
  };

  useEffect(() => {
    loadTrending();
  }, []);

  const handleSearch = async (searchQuery) => {
    if (!searchQuery.trim()) {
      onClearSearch();
      return;
    }

    setIsSearching(true);
    try {
      const results = await api.searchPosts(searchQuery.trim());
      if (results.error) {
        toast.error(results.error);
      } else {
        onSearchResults(results, searchQuery.trim());
      }
    } catch (error) {
      toast.error('Search failed');
    } finally {
      setIsSearching(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    handleSearch(query);
  };

  const handleTrendingClick = (tag) => {
    const hashtagQuery = `#${tag}`;
    setQuery(hashtagQuery);
    handleSearch(hashtagQuery);
  };

  const handleClear = () => {
    setQuery('');
    onClearSearch();
  };

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 mb-6">
      {/* Search Input */}
      <form onSubmit={handleSubmit} className="flex space-x-3 mb-4">
        <div className="flex-1 relative">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search posts or hashtags (#trending)..."
            className="w-full px-4 py-2 pl-10 border border-gray-300 dark:border-gray-600 rounded-full focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
          />
          <svg className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        
        <button
          type="submit"
          disabled={isSearching}
          className="px-6 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white font-semibold rounded-full transition-colors"
        >
          {isSearching ? '...' : 'Search'}
        </button>
        
        {query && (
          <button
            type="button"
            onClick={handleClear}
            className="px-4 py-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            Clear
          </button>
        )}
      </form>

      {/* Trending Hashtags */}
      {trending.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
            Trending Hashtags
          </h4>
          <div className="flex flex-wrap gap-2">
            {trending.map((item) => (
              <button
                key={item.tag}
                onClick={() => handleTrendingClick(item.tag)}
                className="px-3 py-1 bg-blue-100 hover:bg-blue-200 dark:bg-blue-900 dark:hover:bg-blue-800 text-blue-700 dark:text-blue-300 rounded-full text-sm transition-colors"
              >
                #{item.tag} ({item.post_count})
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchBar;