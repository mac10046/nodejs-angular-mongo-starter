const express = require('express');
const router = express.Router();

const authRoutes = require('./authRoutes');
const passwordRoutes = require('./passwordRoutes');
const userRoutes = require('./userRoutes');
const adminRoutes = require('./adminRoutes');

/**
 * API Routes
 * Base path: /api
 */

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'API is running',
    timestamp: new Date().toISOString(),
  });
});

// Mount routes
router.use('/auth', authRoutes);
router.use('/password', passwordRoutes);
router.use('/users', userRoutes);
router.use('/admin', adminRoutes);

module.exports = router;
