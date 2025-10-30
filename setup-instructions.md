# Setup Instructions

## Prerequisites
- Node.js (v14 or higher)
- PostgreSQL database

## Database Setup

1. Install PostgreSQL and create a database:
```sql
CREATE DATABASE stories_db;
```

2. Update backend/.env with your database credentials:
```
DB_HOST=localhost
DB_PORT=5432
DB_NAME=stories_db
DB_USER=postgres
DB_PASSWORD=your_password_here
JWT_SECRET=your_jwt_secret_key_here
```

## Backend Setup

1. Navigate to backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Start the backend server:
```bash
npm start
```
Backend will run on http://localhost:5000

## Frontend Setup

1. Navigate to project root:
```bash
cd ..
```

2. Install dependencies:
```bash
npm install
```

3. Start the frontend:
```bash
npm start
```
Frontend will run on http://localhost:3000

## Features Added

### Backend
- User registration and login with JWT authentication
- PostgreSQL database with Users and Stories tables
- Auto-expiry of stories after 24 hours
- Protected API routes for story operations
- Rate limiting and CORS protection

### Frontend
- Authentication modal with login/register
- API integration replacing localStorage
- User context management
- Toast notifications for user feedback
- Stories grouped by user with usernames
- Responsive design maintained

## API Endpoints

- POST /api/auth/register - User registration
- POST /api/auth/login - User login
- GET /api/stories - Fetch all active stories (protected)
- POST /api/stories - Upload new story (protected)
- DELETE /api/stories/cleanup - Clean expired stories

## Usage

1. Register a new account or login
2. Upload stories using the + button
3. View stories from all users
4. Stories automatically expire after 24 hours
5. Swipe navigation and auto-advance preserved