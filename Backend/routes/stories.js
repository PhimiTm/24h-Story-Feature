const express = require('express');
const { pool } = require('../models/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Get all active stories with view status
router.get('/', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        s.id, s.image_base64, s.caption, s.created_at, 
        u.username, u.id as user_id,
        CASE WHEN sv.user_id IS NOT NULL THEN true ELSE false END as viewed
      FROM stories s
      JOIN users u ON s.user_id = u.id
      LEFT JOIN story_views sv ON s.id = sv.story_id AND sv.user_id = $1
      WHERE s.created_at > NOW() - INTERVAL '24 hours'
      ORDER BY s.created_at DESC
    `, [req.user.userId]);

    console.log('Stories fetched:', result.rows.map(r => ({ id: r.id, caption: r.caption, viewed: r.viewed })));
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch stories' });
  }
});

// Upload new story
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { imageBase64, caption } = req.body;

    console.log('=== STORY UPLOAD DEBUG ===');
    console.log('Request body keys:', Object.keys(req.body));
    console.log('Caption received:', caption);
    console.log('Caption type:', typeof caption);
    console.log('Caption length:', caption ? caption.length : 'null/undefined');

    if (!imageBase64) {
      return res.status(400).json({ error: 'Image required' });
    }

    const result = await pool.query(
      'INSERT INTO stories (user_id, image_base64, caption) VALUES ($1, $2, $3) RETURNING id, created_at',
      [req.user.userId, imageBase64, caption || null]
    );

    console.log('Story created with caption:', caption);
    
    const response = {
      id: result.rows[0].id,
      user_id: req.user.userId,
      username: req.user.username,
      image_base64: imageBase64,
      caption: caption,
      created_at: result.rows[0].created_at
    };
    
    console.log('Response being sent:', { ...response, image_base64: '[IMAGE_DATA]' });
    res.status(201).json(response);
  } catch (error) {
    res.status(500).json({ error: 'Failed to upload story' });
  }
});

// Clean expired stories (can be called manually or via cron)
router.delete('/cleanup', async (req, res) => {
  try {
    const result = await pool.query(
      "DELETE FROM stories WHERE created_at < NOW() - INTERVAL '24 hours'"
    );
    res.json({ deleted: result.rowCount });
  } catch (error) {
    res.status(500).json({ error: 'Cleanup failed' });
  }
});

// Mark story as viewed
router.post('/:storyId/view', authenticateToken, async (req, res) => {
  try {
    const { storyId } = req.params;
    
    console.log(`=== MARKING STORY AS VIEWED ===`);
    console.log(`User ID: ${req.user.userId}, Story ID: ${storyId}`);
    
    const result = await pool.query(
      'INSERT INTO story_views (user_id, story_id) VALUES ($1, $2) ON CONFLICT (user_id, story_id) DO NOTHING RETURNING *',
      [req.user.userId, storyId]
    );
    
    console.log('Insert result:', result.rows);
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error marking story as viewed:', error);
    res.status(500).json({ error: 'Failed to mark story as viewed' });
  }
});

module.exports = router;