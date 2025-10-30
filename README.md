# 24-Hour Stories Feature

A React application with Tailwind CSS that implements an Instagram/WhatsApp-style Stories feature. Stories are ephemeral images that disappear after 24 hours, stored locally using localStorage.

## Features

- **Circular Story Icons**: Horizontal row of circular avatars at the top
- **Add Story Button**: Grayed-out circular button with plus icon
- **Story Viewer**: Full-screen overlay with progress bars and auto-advance
- **Swipe Navigation**: Left/right swipe to navigate between stories
- **Auto-Expiry**: Stories automatically disappear after 24 hours
- **Responsive Design**: Works on mobile and desktop
- **Dark Mode Support**: Built-in dark mode with Tailwind CSS

## Installation

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm start
```

3. Open [http://localhost:3000](http://localhost:3000) in your browser

## Usage

1. Click the "+" button to upload a new story (JPEG/PNG only)
2. Images are automatically resized to max 1080x1920 pixels
3. Click any story circle to view stories in full-screen mode
4. Stories auto-advance every 3 seconds
5. Swipe left/right or click sides to navigate
6. Stories expire automatically after 24 hours

## Technical Details

- **Client-side only**: No backend required
- **localStorage**: All data persisted locally
- **Image Processing**: Canvas API for resizing
- **Responsive**: Tailwind CSS for mobile-first design
- **Swipe Gestures**: react-swipeable library

## Components

- `App.js`: Main application component
- `StoriesBar.js`: Horizontal row of story circles
- `StoryViewer.js`: Full-screen story viewer modal
- `imageUtils.js`: Image processing and storage utilities