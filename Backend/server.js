require('dotenv').config();
const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const { initDB } = require('./models/database');

const app = express();
const PORT = process.env.PORT || 5001;

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' })); // Increased for base64 images
app.use(limiter);

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/stories', require('./routes/stories'));
app.use('/api/posts', require('./routes/posts'));
app.use('/api/debug', require('./routes/debug'));

// Health check with database info
app.get('/api/health', async (req, res) => {
  try {
    const { pool } = require('./models/database');
    
    // Test basic connection first
    await pool.query('SELECT 1');
    
    // Check if tables exist
    const tablesResult = await pool.query(`
      SELECT table_name FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name IN ('users', 'stories', 'story_views')
    `);
    
    let dbInfo = {
      connected: true,
      tables: tablesResult.rows.map(r => r.table_name)
    };
    
    // Only check counts if tables exist
    if (tablesResult.rows.length > 0) {
      try {
        const usersResult = await pool.query('SELECT COUNT(*) as count FROM users');
        const storiesResult = await pool.query('SELECT COUNT(*) as count FROM stories');
        const viewsResult = await pool.query('SELECT COUNT(*) as count FROM story_views');
        const recentStories = await pool.query('SELECT id, caption, created_at FROM stories ORDER BY created_at DESC LIMIT 3');
        const recentViews = await pool.query('SELECT user_id, story_id, viewed_at FROM story_views ORDER BY viewed_at DESC LIMIT 5');
        
        dbInfo.users = usersResult.rows[0].count;
        dbInfo.stories = storiesResult.rows[0].count;
        dbInfo.views = viewsResult.rows[0].count;
        dbInfo.recentStories = recentStories.rows;
        dbInfo.recentViews = recentViews.rows;
      } catch (tableError) {
        dbInfo.tableError = tableError.message;
      }
    }
    
    res.json({ 
      status: 'OK', 
      timestamp: new Date().toISOString(),
      database: dbInfo
    });
  } catch (error) {
    res.json({ 
      status: 'ERROR', 
      timestamp: new Date().toISOString(),
      database: { 
        connected: false,
        error: error.message 
      }
    });
  }
});

// Initialize database and start server
const startServer = async () => {
  try {
    await initDB();
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();