const express = require('express');
const { pool } = require('../models/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Get all posts (feed)
router.get('/', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        p.id, p.content, p.image_base64, p.created_at, p.repost_of, p.repost_comment,
        u.username, u.id as user_id,
        COUNT(DISTINCT l.id) as like_count,
        COUNT(DISTINCT c.id) as comment_count,
        COUNT(DISTINCT r.id) as repost_count,
        CASE WHEN ul.user_id IS NOT NULL THEN true ELSE false END as user_liked,
        -- Original post data for reposts
        op.id as original_id, op.content as original_content, op.image_base64 as original_image,
        op.created_at as original_created_at, ou.username as original_username, ou.id as original_user_id
      FROM posts p
      JOIN users u ON p.user_id = u.id
      LEFT JOIN posts op ON p.repost_of = op.id
      LEFT JOIN users ou ON op.user_id = ou.id
      LEFT JOIN likes l ON p.id = l.post_id
      LEFT JOIN comments c ON p.id = c.post_id
      LEFT JOIN posts r ON r.repost_of = p.id
      LEFT JOIN likes ul ON p.id = ul.post_id AND ul.user_id = $1
      GROUP BY p.id, u.username, u.id, ul.user_id, op.id, op.content, op.image_base64, op.created_at, ou.username, ou.id
      ORDER BY p.created_at DESC
      LIMIT 50
    `, [req.user.userId]);

    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch posts' });
  }
});

// Extract hashtags from content
const extractHashtags = (content) => {
  if (!content) return [];
  const hashtagRegex = /#([a-zA-Z0-9_]+)/g;
  const hashtags = [];
  let match;
  while ((match = hashtagRegex.exec(content)) !== null) {
    hashtags.push(match[1].toLowerCase());
  }
  return [...new Set(hashtags)]; // Remove duplicates
};

// Create new post
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { content, imageBase64 } = req.body;

    if ((!content || content.trim().length === 0) && !imageBase64) {
      return res.status(400).json({ error: 'Post must have content or image' });
    }

    if (content && content.length > 280) {
      return res.status(400).json({ error: 'Post content must be 280 characters or less' });
    }

    const trimmedContent = content ? content.trim() : '';
    
    // Create post
    const result = await pool.query(
      'INSERT INTO posts (user_id, content, image_base64) VALUES ($1, $2, $3) RETURNING id, created_at',
      [req.user.userId, trimmedContent, imageBase64 || null]
    );

    const postId = result.rows[0].id;
    
    // Process hashtags
    const hashtags = extractHashtags(trimmedContent);
    for (const tag of hashtags) {
      // Insert hashtag if it doesn't exist
      await pool.query(
        'INSERT INTO hashtags (tag) VALUES ($1) ON CONFLICT (tag) DO NOTHING',
        [tag]
      );
      
      // Link post to hashtag
      const hashtagResult = await pool.query(
        'SELECT id FROM hashtags WHERE tag = $1',
        [tag]
      );
      
      if (hashtagResult.rows.length > 0) {
        await pool.query(
          'INSERT INTO post_hashtags (post_id, hashtag_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
          [postId, hashtagResult.rows[0].id]
        );
      }
    }

    res.status(201).json({
      id: postId,
      user_id: req.user.userId,
      username: req.user.username,
      content: trimmedContent,
      image_base64: imageBase64 || null,
      created_at: result.rows[0].created_at
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create post' });
  }
});

// Toggle like on post
router.post('/:postId/like', authenticateToken, async (req, res) => {
  try {
    const { postId } = req.params;
    
    // Check if user already liked this post
    const existingLike = await pool.query(
      'SELECT id FROM likes WHERE user_id = $1 AND post_id = $2',
      [req.user.userId, postId]
    );
    
    if (existingLike.rows.length > 0) {
      // Unlike - remove the like
      await pool.query(
        'DELETE FROM likes WHERE user_id = $1 AND post_id = $2',
        [req.user.userId, postId]
      );
      res.json({ liked: false });
    } else {
      // Like - add the like
      await pool.query(
        'INSERT INTO likes (user_id, post_id) VALUES ($1, $2)',
        [req.user.userId, postId]
      );
      res.json({ liked: true });
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to toggle like' });
  }
});

// Get comments for a post
router.get('/:postId/comments', authenticateToken, async (req, res) => {
  try {
    const { postId } = req.params;
    
    const result = await pool.query(`
      SELECT 
        c.id, c.content, c.created_at,
        u.username, u.id as user_id
      FROM comments c
      JOIN users u ON c.user_id = u.id
      WHERE c.post_id = $1
      ORDER BY c.created_at ASC
    `, [postId]);
    
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch comments' });
  }
});

// Add comment to post
router.post('/:postId/comments', authenticateToken, async (req, res) => {
  try {
    const { postId } = req.params;
    const { content } = req.body;
    
    if (!content || content.trim().length === 0) {
      return res.status(400).json({ error: 'Comment content is required' });
    }
    
    if (content.length > 500) {
      return res.status(400).json({ error: 'Comment must be 500 characters or less' });
    }
    
    const result = await pool.query(
      'INSERT INTO comments (user_id, post_id, content) VALUES ($1, $2, $3) RETURNING id, created_at',
      [req.user.userId, postId, content.trim()]
    );
    
    res.status(201).json({
      id: result.rows[0].id,
      user_id: req.user.userId,
      username: req.user.username,
      post_id: postId,
      content: content.trim(),
      created_at: result.rows[0].created_at
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to add comment' });
  }
});

// Search posts by hashtag or content
router.get('/search', authenticateToken, async (req, res) => {
  try {
    const { q } = req.query;
    
    if (!q || q.trim().length === 0) {
      return res.status(400).json({ error: 'Search query is required' });
    }
    
    const searchTerm = q.trim();
    let result;
    
    if (searchTerm.startsWith('#')) {
      // Hashtag search
      const hashtag = searchTerm.substring(1).toLowerCase();
      result = await pool.query(`
        SELECT DISTINCT
          p.id, p.content, p.image_base64, p.created_at,
          u.username, u.id as user_id,
          COUNT(DISTINCT l.id) as like_count,
          COUNT(DISTINCT c.id) as comment_count,
          CASE WHEN ul.user_id IS NOT NULL THEN true ELSE false END as user_liked
        FROM posts p
        JOIN users u ON p.user_id = u.id
        JOIN post_hashtags ph ON p.id = ph.post_id
        JOIN hashtags h ON ph.hashtag_id = h.id
        LEFT JOIN likes l ON p.id = l.post_id
        LEFT JOIN comments c ON p.id = c.post_id
        LEFT JOIN likes ul ON p.id = ul.post_id AND ul.user_id = $1
        WHERE h.tag = $2
        GROUP BY p.id, u.username, u.id, ul.user_id
        ORDER BY p.created_at DESC
        LIMIT 50
      `, [req.user.userId, hashtag]);
    } else {
      // Content search
      result = await pool.query(`
        SELECT 
          p.id, p.content, p.image_base64, p.created_at,
          u.username, u.id as user_id,
          COUNT(DISTINCT l.id) as like_count,
          COUNT(DISTINCT c.id) as comment_count,
          CASE WHEN ul.user_id IS NOT NULL THEN true ELSE false END as user_liked
        FROM posts p
        JOIN users u ON p.user_id = u.id
        LEFT JOIN likes l ON p.id = l.post_id
        LEFT JOIN comments c ON p.id = c.post_id
        LEFT JOIN likes ul ON p.id = ul.post_id AND ul.user_id = $1
        WHERE p.content ILIKE $2
        GROUP BY p.id, u.username, u.id, ul.user_id
        ORDER BY p.created_at DESC
        LIMIT 50
      `, [req.user.userId, `%${searchTerm}%`]);
    }
    
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Search failed' });
  }
});

// Get trending hashtags
router.get('/trending', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        h.tag,
        COUNT(ph.post_id) as post_count
      FROM hashtags h
      JOIN post_hashtags ph ON h.id = ph.hashtag_id
      JOIN posts p ON ph.post_id = p.id
      WHERE p.created_at > NOW() - INTERVAL '7 days'
      GROUP BY h.id, h.tag
      ORDER BY post_count DESC, h.tag ASC
      LIMIT 10
    `);
    
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch trending hashtags' });
  }
});

// Repost a post
router.post('/:postId/repost', authenticateToken, async (req, res) => {
  try {
    const { postId } = req.params;
    const { comment } = req.body;
    
    // Check if original post exists
    const originalPost = await pool.query(
      'SELECT id FROM posts WHERE id = $1',
      [postId]
    );
    
    if (originalPost.rows.length === 0) {
      return res.status(404).json({ error: 'Post not found' });
    }
    
    // Check if user already reposted this
    const existingRepost = await pool.query(
      'SELECT id FROM posts WHERE user_id = $1 AND repost_of = $2',
      [req.user.userId, postId]
    );
    
    if (existingRepost.rows.length > 0) {
      return res.status(400).json({ error: 'You have already reposted this' });
    }
    
    // Create repost
    const result = await pool.query(
      'INSERT INTO posts (user_id, content, repost_of, repost_comment) VALUES ($1, $2, $3, $4) RETURNING id, created_at',
      [req.user.userId, '', postId, comment || null]
    );
    
    res.status(201).json({
      id: result.rows[0].id,
      user_id: req.user.userId,
      username: req.user.username,
      repost_of: postId,
      repost_comment: comment || null,
      created_at: result.rows[0].created_at
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to repost' });
  }
});

module.exports = router;