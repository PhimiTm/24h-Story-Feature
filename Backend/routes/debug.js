const express = require('express');
const { pool } = require('../models/database');

const router = express.Router();

// Check database tables and data
router.get('/tables', async (req, res) => {
  try {
    // Check if tables exist
    const tablesResult = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);

    // Check users
    const usersResult = await pool.query('SELECT id, username, email, created_at FROM users');
    
    // Check stories with captions
    const storiesResult = await pool.query('SELECT id, user_id, caption, created_at FROM stories');

    res.json({
      tables: tablesResult.rows,
      users: usersResult.rows,
      stories: storiesResult.rows
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;