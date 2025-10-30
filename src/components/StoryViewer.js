import React, { useState, useEffect } from 'react';
import { useSwipeable } from 'react-swipeable';
import { api } from '../utils/api';

const StoryViewer = ({ userStories, onClose, onStoryViewed }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [progress, setProgress] = useState(0);

  // Mark current story as viewed when it loads
  useEffect(() => {
    if (userStories[currentIndex] && !userStories[currentIndex].viewed) {
      api.markStoryViewed(userStories[currentIndex].id).then(() => {
        if (onStoryViewed) {
          onStoryViewed(userStories[currentIndex].id);
        }
      });
    }
  }, [currentIndex, userStories, onStoryViewed]);

  useEffect(() => {
    const timer = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          // Move to next story
          if (currentIndex < userStories.length - 1) {
            setCurrentIndex(currentIndex + 1);
            return 0;
          } else {
            onClose();
            return 100;
          }
        }
        return prev + (100 / 30); // 3 seconds = 30 intervals of 100ms
      });
    }, 100);

    return () => clearInterval(timer);
  }, [currentIndex, userStories.length, onClose]);

  const goToNext = () => {
    if (currentIndex < userStories.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setProgress(0);
    } else {
      onClose();
    }
  };

  const goToPrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setProgress(0);
    }
  };

  const handlers = useSwipeable({
    onSwipedLeft: goToNext,
    onSwipedRight: goToPrevious,
    preventDefaultTouchmoveEvent: true,
    trackMouse: true
  });

  const handleBackgroundClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center"
      onClick={handleBackgroundClick}
    >
      <div {...handlers} className="relative w-full h-full max-w-sm max-h-screen mx-auto">
        {/* Progress bars */}
        <div className="absolute top-4 left-4 right-4 z-10 flex space-x-1">
          {userStories.map((_, index) => (
            <div key={index} className="flex-1 h-1 bg-gray-600 rounded-full overflow-hidden">
              <div 
                className="h-full bg-white transition-all duration-100 ease-linear"
                style={{
                  width: index < currentIndex ? '100%' : 
                         index === currentIndex ? `${progress}%` : '0%'
                }}
              />
            </div>
          ))}
        </div>

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full bg-black bg-opacity-50 flex items-center justify-center text-white hover:bg-opacity-70"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Story content */}
        <div className="w-full h-full flex flex-col items-center justify-center px-4 py-16">
          {/* Story image */}
          <div className="flex-1 flex items-center justify-center w-full">
            <img
              src={userStories[currentIndex]?.image_base64}
              alt="Story"
              className="max-w-full max-h-full object-contain rounded-lg"
            />
          </div>
          
          {/* Caption */}
          {userStories[currentIndex]?.caption && (
            <div className="mt-4 w-full max-w-md">
              <div className="bg-black bg-opacity-60 rounded-lg p-4 backdrop-blur-sm">
                <p className="text-white text-center text-sm leading-relaxed">
                  {userStories[currentIndex].caption}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Navigation buttons */}
        <div className="absolute inset-0 flex items-center justify-between px-4 pointer-events-none">
          {/* Previous button */}
          {currentIndex > 0 && (
            <button
              onClick={goToPrevious}
              className="w-10 h-10 rounded-full bg-black bg-opacity-50 flex items-center justify-center text-white hover:bg-opacity-70 transition-all pointer-events-auto"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          )}
          
          {/* Next button */}
          {currentIndex < userStories.length - 1 && (
            <button
              onClick={goToNext}
              className="w-10 h-10 rounded-full bg-black bg-opacity-50 flex items-center justify-center text-white hover:bg-opacity-70 transition-all pointer-events-auto ml-auto"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          )}
        </div>
        
        {/* Invisible navigation areas for tap/click */}
        <div className="absolute inset-0 flex">
          <div className="w-1/2 h-full" onClick={goToPrevious} />
          <div className="w-1/2 h-full" onClick={goToNext} />
        </div>
      </div>
    </div>
  );
};

export default StoryViewer;