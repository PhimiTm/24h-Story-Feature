import React, { useState } from 'react';
import { api } from '../utils/api';
import { highlightText } from '../utils/textUtils';
import toast from 'react-hot-toast';
import Comments from './Comments';
import RepostModal from './RepostModal';

const PostsFeed = ({ posts, onPostsUpdate, user }) => {
  const [commentsOpen, setCommentsOpen] = useState(null);
  const [repostModalOpen, setRepostModalOpen] = useState(null);
  const formatTimeAgo = (timestamp) => {
    const now = new Date();
    const postTime = new Date(timestamp);
    const diffInSeconds = Math.floor((now - postTime) / 1000);
    
    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return `${Math.floor(diffInSeconds / 86400)}d ago`;
  };

  const handleLike = async (postId) => {
    try {
      await api.toggleLike(postId);
      onPostsUpdate(); // Refresh posts to update like counts
    } catch (error) {
      toast.error('Failed to update like');
    }
  };

  const handleCommentClick = (postId) => {
    setCommentsOpen(postId);
  };

  const handleCommentsClose = () => {
    setCommentsOpen(null);
    onPostsUpdate(); // Refresh posts to update comment counts
  };

  const handleRepostClick = (post) => {
    setRepostModalOpen(post);
  };

  const handleRepost = async (postId, comment) => {
    const result = await api.repostPost(postId, comment);
    if (result.error) {
      throw new Error(result.error);
    }
    onPostsUpdate(); // Refresh posts
  };

  const handleRepostClose = () => {
    setRepostModalOpen(null);
  };

  if (posts.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-500 dark:text-gray-400 text-lg mb-2">No posts yet</div>
        <div className="text-gray-400 dark:text-gray-500 text-sm">Be the first to share something!</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {posts.map((post) => {
        const isRepost = post.repost_of !== null && post.repost_of !== undefined;
        
        return (
          <div key={post.id} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
            {/* Repost Header */}
            {isRepost && (
              <div className="flex items-center space-x-2 mb-3 text-sm text-gray-600 dark:text-gray-400">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
                </svg>
                <span>{post.username} reposted</span>
                <span>•</span>
                <span>{formatTimeAgo(post.created_at)}</span>
              </div>
            )}
            
            {/* Repost Comment */}
            {isRepost && post.repost_comment && (
              <div className="mb-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-purple-500 via-pink-500 to-orange-500 flex items-center justify-center text-white font-semibold text-xs">
                    {post.username?.charAt(0).toUpperCase()}
                  </div>
                  <span className="font-semibold text-sm text-gray-900 dark:text-white">{post.username}</span>
                </div>
                <div className="text-gray-900 dark:text-white text-sm">
                  {highlightText(post.repost_comment)}
                </div>
              </div>
            )}
            
            {/* Original Post Container */}
            <div className={isRepost ? 'border border-gray-200 dark:border-gray-600 rounded-lg p-3' : ''}>
              {/* Post Header */}
              <div className="flex items-center space-x-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-purple-500 via-pink-500 to-orange-500 flex items-center justify-center text-white font-semibold text-sm">
                  {isRepost ? post.original_username?.charAt(0).toUpperCase() : post.username?.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="font-semibold text-gray-900 dark:text-white">
                    {isRepost ? post.original_username : post.username}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    {formatTimeAgo(isRepost ? post.original_created_at : post.created_at)}
                  </div>
                </div>
              </div>
          
              {/* Post Content */}
              {(isRepost ? post.original_content : post.content) && (
                <div className="text-gray-900 dark:text-white mb-3 leading-relaxed">
                  {highlightText(isRepost ? post.original_content : post.content)}
                </div>
              )}
              
              {/* Post Image */}
              {(isRepost ? post.original_image : post.image_base64) && (
                <div className="mb-3">
                  <img 
                    src={isRepost ? post.original_image : post.image_base64} 
                    alt="Post content" 
                    className="w-full rounded-lg max-h-96 object-cover cursor-pointer hover:opacity-95 transition-opacity"
                    onClick={() => window.open(isRepost ? post.original_image : post.image_base64, '_blank')}
                  />
                </div>
              )}
            </div>
          
          {/* Post Actions */}
          <div className="flex items-center space-x-6 pt-3 border-t border-gray-200 dark:border-gray-600">
            <button 
              onClick={() => handleLike(post.id)}
              className={`flex items-center space-x-2 transition-colors ${
                post.user_liked 
                  ? 'text-red-500 hover:text-red-600' 
                  : 'text-gray-500 hover:text-red-500'
              }`}
            >
              <svg 
                className="w-5 h-5" 
                fill={post.user_liked ? 'currentColor' : 'none'} 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
              <span className="text-sm">
                {post.like_count > 0 ? `${post.like_count} ${post.like_count === 1 ? 'Like' : 'Likes'}` : 'Like'}
              </span>
            </button>
            
            <button 
              onClick={() => handleCommentClick(post.id)}
              className="flex items-center space-x-2 text-gray-500 hover:text-blue-500 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <span className="text-sm">
                {post.comment_count > 0 ? `${post.comment_count} ${post.comment_count === 1 ? 'Comment' : 'Comments'}` : 'Comment'}
              </span>
            </button>
            
            <button 
              onClick={() => handleRepostClick(isRepost ? {
                id: post.original_id,
                content: post.original_content,
                image_base64: post.original_image,
                username: post.original_username,
                created_at: post.original_created_at,
                user_id: post.original_user_id
              } : post)}
              className="flex items-center space-x-2 text-gray-500 hover:text-green-500 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
              </svg>
              <span className="text-sm">
                {post.repost_count > 0 ? `${post.repost_count} ${post.repost_count === 1 ? 'Repost' : 'Reposts'}` : 'Repost'}
              </span>
            </button>
          </div>
          </div>
        );
      })}
      
      {/* Comments Modal */}
      {commentsOpen && (
        <Comments
          postId={commentsOpen}
          isOpen={true}
          onClose={handleCommentsClose}
        />
      )}
      
      {/* Repost Modal */}
      {repostModalOpen && (
        <RepostModal
          post={repostModalOpen}
          user={user}
          onRepost={handleRepost}
          onClose={handleRepostClose}
        />
      )}
    </div>
  );
};

export default PostsFeed;