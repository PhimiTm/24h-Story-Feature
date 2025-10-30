import React, { useState, useRef } from 'react';
import toast from 'react-hot-toast';
import { resizeImage } from '../utils/imageUtils';

const PostComposer = ({ onPostCreated, user }) => {
  const [content, setContent] = useState('');
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [isPosting, setIsPosting] = useState(false);
  const fileInputRef = useRef(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!content.trim() && !selectedImage) {
      toast.error('Please write something or add an image');
      return;
    }

    if (content.length > 280) {
      toast.error('Post must be 280 characters or less');
      return;
    }

    setIsPosting(true);
    try {
      let imageBase64 = null;
      if (selectedImage) {
        imageBase64 = await resizeImage(selectedImage, 800, 600); // Smaller for posts
      }
      
      await onPostCreated(content.trim(), imageBase64);
      setContent('');
      setSelectedImage(null);
      setImagePreview(null);
      toast.success('Post created successfully!');
    } catch (error) {
      toast.error('Failed to create post');
    } finally {
      setIsPosting(false);
    }
  };

  const handleImageSelect = async (e) => {
    const file = e.target.files[0];
    if (file && (file.type === 'image/jpeg' || file.type === 'image/png')) {
      setSelectedImage(file);
      const preview = await resizeImage(file, 800, 600);
      setImagePreview(preview);
    } else {
      toast.error('Please select a JPEG or PNG image');
    }
    e.target.value = ''; // Reset input
  };

  const removeImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
  };

  const remainingChars = 280 - content.length;

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 mb-6">
      <div className="flex space-x-3">
        {/* User Avatar */}
        <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-purple-500 via-pink-500 to-orange-500 flex items-center justify-center text-white font-semibold text-sm">
          {user?.username?.charAt(0).toUpperCase()}
        </div>
        
        {/* Composer */}
        <div className="flex-1">
          <form onSubmit={handleSubmit}>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="What's on your mind?"
              className="w-full p-3 border-0 resize-none focus:ring-0 focus:outline-none bg-transparent text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
              rows={imagePreview ? 2 : 3}
              maxLength={280}
            />
            
            {/* Image Preview */}
            {imagePreview && (
              <div className="relative mt-3">
                <img 
                  src={imagePreview} 
                  alt="Preview" 
                  className="w-full max-h-64 object-cover rounded-lg"
                />
                <button
                  type="button"
                  onClick={removeImage}
                  className="absolute top-2 right-2 w-6 h-6 bg-black bg-opacity-50 rounded-full flex items-center justify-center text-white hover:bg-opacity-70"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            )}
            
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
              <div className="flex items-center space-x-4">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center space-x-1 text-blue-500 hover:text-blue-600 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span className="text-sm">Photo</span>
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png"
                  onChange={handleImageSelect}
                  className="hidden"
                />
                <span className={`text-sm ${remainingChars < 20 ? 'text-red-500' : 'text-gray-500 dark:text-gray-400'}`}>
                  {remainingChars} characters left
                </span>
              </div>
              
              <button
                type="submit"
                disabled={(!content.trim() && !selectedImage) || isPosting || remainingChars < 0}
                className="px-6 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white font-semibold rounded-full transition-colors"
              >
                {isPosting ? 'Posting...' : 'Post'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default PostComposer;