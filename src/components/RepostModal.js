import React, { useState } from 'react';
import { highlightText } from '../utils/textUtils';
import toast from 'react-hot-toast';

const RepostModal = ({ post, user, onRepost, onClose }) => {
  const [comment, setComment] = useState('');
  const [isReposting, setIsReposting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (comment.length > 280) {
      toast.error('Comment must be 280 characters or less');
      return;
    }

    setIsReposting(true);
    try {
      await onRepost(post.id, comment.trim() || null);
      toast.success('Post reposted successfully!');
      onClose();
    } catch (error) {
      toast.error('Failed to repost');
    } finally {
      setIsReposting(false);
    }
  };

  const formatTimeAgo = (timestamp) => {
    const now = new Date();
    const postTime = new Date(timestamp);
    const diffInSeconds = Math.floor((now - postTime) / 1000);
    
    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return `${Math.floor(diffInSeconds / 86400)}d ago`;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-md mx-4 max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-600">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Repost
          </h3>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center justify-center"
          >
            <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Comment Input */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-600">
          <div className="flex space-x-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-purple-500 via-pink-500 to-orange-500 flex items-center justify-center text-white font-semibold text-sm">
              {user?.username?.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1">
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Add a comment... (optional)"
                className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                rows={3}
                maxLength={280}
              />
              <div className="text-xs text-gray-500 mt-1 text-right">
                {280 - comment.length} characters left
              </div>
            </div>
          </div>
        </div>

        {/* Original Post Preview */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="border border-gray-200 dark:border-gray-600 rounded-lg p-4">
            {/* Original Post Header */}
            <div className="flex items-center space-x-3 mb-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-purple-500 via-pink-500 to-orange-500 flex items-center justify-center text-white font-semibold text-xs">
                {post.username?.charAt(0).toUpperCase()}
              </div>
              <div>
                <div className="font-semibold text-gray-900 dark:text-white text-sm">
                  {post.username}
                </div>
                <div className="text-xs text-gray-500">
                  {formatTimeAgo(post.created_at)}
                </div>
              </div>
            </div>
            
            {/* Original Post Content */}
            {post.content && (
              <div className="text-gray-900 dark:text-white mb-3 text-sm leading-relaxed">
                {highlightText(post.content)}
              </div>
            )}
            
            {/* Original Post Image */}
            {post.image_base64 && (
              <div className="mb-3">
                <img 
                  src={post.image_base64} 
                  alt="Post content" 
                  className="w-full rounded-lg max-h-48 object-cover"
                />
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-600">
          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={isReposting}
              className="flex-1 px-4 py-2 bg-green-500 hover:bg-green-600 disabled:bg-green-300 text-white rounded-lg transition-colors"
            >
              {isReposting ? 'Reposting...' : 'Repost'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RepostModal;