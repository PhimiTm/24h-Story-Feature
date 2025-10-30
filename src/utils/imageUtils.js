// Resize image to max 1080x1920 and convert to base64
export const resizeImage = (file, maxWidth = 1080, maxHeight = 1920) => {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
      let { width, height } = img;
      
      // Calculate new dimensions maintaining aspect ratio
      if (width > maxWidth || height > maxHeight) {
        const ratio = Math.min(maxWidth / width, maxHeight / height);
        width *= ratio;
        height *= ratio;
      }
      
      canvas.width = width;
      canvas.height = height;
      
      ctx.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL('image/jpeg', 0.8));
    };
    
    img.src = URL.createObjectURL(file);
  });
};

// Group stories by user with view status
export const groupStoriesByUser = (stories) => {
  const grouped = {};
  stories.forEach(story => {
    if (!grouped[story.user_id]) {
      grouped[story.user_id] = {
        username: story.username,
        stories: [],
        hasUnseen: false
      };
    }
    grouped[story.user_id].stories.push(story);
    // If any story is not viewed, mark group as having unseen stories
    if (!story.viewed) {
      grouped[story.user_id].hasUnseen = true;
    }
  });
  return grouped;
};