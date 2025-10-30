import React, { useRef, useState } from 'react';
import { groupStoriesByUser, resizeImage } from '../utils/imageUtils';
import CaptionModal from './CaptionModal';

const StoriesBar = ({ stories, onAddStory, onStoryClick }) => {
  const fileInputRef = useRef(null);
  const [showCaptionModal, setShowCaptionModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  const handleAddClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (file && (file.type === 'image/jpeg' || file.type === 'image/png')) {
      const preview = await resizeImage(file);
      setSelectedFile(file);
      setImagePreview(preview);
      setShowCaptionModal(true);
      e.target.value = ''; // Reset input
    }
  };

  const handleCaptionSubmit = async (caption) => {
    await onAddStory(selectedFile, caption);
    setShowCaptionModal(false);
    setSelectedFile(null);
    setImagePreview(null);
  };

  const handleCaptionCancel = () => {
    setShowCaptionModal(false);
    setSelectedFile(null);
    setImagePreview(null);
  };

  return (
    <div className="w-full bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
      <div className="max-w-4xl mx-auto px-4 py-4">
        <div className="flex items-start space-x-4 overflow-x-auto scrollbar-hide py-2 px-2 -mx-2">
          {/* Add Story Button */}
          <div className="flex-shrink-0 text-center">
            <button
              onClick={handleAddClick}
              className="w-16 h-16 rounded-full border-2 border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-800 flex items-center justify-center hover:bg-gray-200 dark:hover:bg-gray-700 transition-all duration-300 animate-pulse hover:animate-none transform hover:scale-110 mb-1"
            >
              <svg className="w-6 h-6 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </button>
            <p className="text-xs text-gray-600 dark:text-gray-400 truncate w-16 mt-1">
              Your Story
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>

          {/* Story Circles */}
          {Object.entries(groupStoriesByUser(stories)).map(([userId, userData], index) => (
            <div key={userId} className="flex-shrink-0 text-center">
              <button
                onClick={() => onStoryClick(userId)}
                className={`w-16 h-16 rounded-full p-0.5 mb-1 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 ${
                  userData.hasUnseen 
                    ? 'bg-gradient-to-tr from-purple-500 via-pink-500 to-orange-500 hover:from-purple-600 hover:via-pink-600 hover:to-orange-600'
                    : 'bg-gray-400 hover:bg-gray-500'
                }`}
              >
                <div className="w-full h-full rounded-full overflow-hidden bg-white dark:bg-gray-800 p-0.5">
                  <img
                    src={userData.stories[0].image_base64}
                    alt="Story"
                    className="w-full h-full object-cover rounded-full"
                  />
                </div>
              </button>
              <p className="text-xs text-gray-600 dark:text-gray-400 truncate w-16 mt-1">
                {userData.username}
              </p>
            </div>
          ))}
        </div>
      </div>
      
      {showCaptionModal && (
        <CaptionModal
          imagePreview={imagePreview}
          onSubmit={handleCaptionSubmit}
          onCancel={handleCaptionCancel}
        />
      )}
    </div>
  );
};

export default StoriesBar;