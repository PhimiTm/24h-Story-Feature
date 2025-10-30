import React from 'react';

// Highlight hashtags and mentions in text
export const highlightText = (text) => {
  if (!text) return text;
  
  const parts = text.split(/(\s+)/);
  
  return parts.map((part, index) => {
    // Hashtag highlighting
    if (part.match(/^#[a-zA-Z0-9_]+$/)) {
      return (
        <span key={index} className="text-blue-500 hover:text-blue-600 cursor-pointer font-medium">
          {part}
        </span>
      );
    }
    
    // Mention highlighting
    if (part.match(/^@[a-zA-Z0-9_]+$/)) {
      return (
        <span key={index} className="text-purple-500 hover:text-purple-600 cursor-pointer font-medium">
          {part}
        </span>
      );
    }
    
    return part;
  });
};