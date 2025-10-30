const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

// Initialize database tables
const initDB = async () => {
  try {
    // Users table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Stories table with auto-expiry
    await pool.query(`
      CREATE TABLE IF NOT EXISTS stories (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        image_base64 TEXT NOT NULL,
        caption TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Add caption column if it doesn't exist (for existing databases)
    await pool.query(`
      ALTER TABLE stories 
      ADD COLUMN IF NOT EXISTS caption TEXT
    `);

    // Story views table to track seen stories
    await pool.query(`
      CREATE TABLE IF NOT EXISTS story_views (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        story_id INTEGER REFERENCES stories(id) ON DELETE CASCADE,
        viewed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, story_id)
      )
    `);

    // Index for auto-cleanup of expired stories
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_stories_created_at ON stories(created_at)
    `);
    
    // Index for story views
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_story_views_user_story ON story_views(user_id, story_id)
    `);

    // Posts table for blog-style posts
    await pool.query(`
      CREATE TABLE IF NOT EXISTS posts (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        content TEXT NOT NULL,
        image_base64 TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Add image_base64 column if it doesn't exist (for existing databases)
    await pool.query(`
      ALTER TABLE posts 
      ADD COLUMN IF NOT EXISTS image_base64 TEXT
    `);

    // Add repost fields
    await pool.query(`
      ALTER TABLE posts 
      ADD COLUMN IF NOT EXISTS repost_of INTEGER REFERENCES posts(id) ON DELETE CASCADE,
      ADD COLUMN IF NOT EXISTS repost_comment TEXT
    `);

    // Index for reposts
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_posts_repost_of ON posts(repost_of)
    `);

    // Index for posts by user and date
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_posts_user_date ON posts(user_id, created_at DESC)
    `);

    // Likes table for post reactions
    await pool.query(`
      CREATE TABLE IF NOT EXISTS likes (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        post_id INTEGER REFERENCES posts(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, post_id)
      )
    `);

    // Index for likes
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_likes_post ON likes(post_id)
    `);

    // Comments table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS comments (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        post_id INTEGER REFERENCES posts(id) ON DELETE CASCADE,
        content TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Index for comments by post
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_comments_post ON comments(post_id, created_at)
    `);

    // Hashtags table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS hashtags (
        id SERIAL PRIMARY KEY,
        tag VARCHAR(100) UNIQUE NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Post hashtags junction table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS post_hashtags (
        id SERIAL PRIMARY KEY,
        post_id INTEGER REFERENCES posts(id) ON DELETE CASCADE,
        hashtag_id INTEGER REFERENCES hashtags(id) ON DELETE CASCADE,
        UNIQUE(post_id, hashtag_id)
      )
    `);

    // Indexes for hashtags
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_hashtags_tag ON hashtags(tag)
    `);
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_post_hashtags_post ON post_hashtags(post_id)
    `);

    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Database initialization error:', error);
  }
};

module.exports = { pool, initDB };