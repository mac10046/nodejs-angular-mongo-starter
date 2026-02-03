/**
 * Product Name API Server
 * Entry point for the application
 */

// Load environment variables first
require('dotenv').config();

const createApp = require('./src/app');
const { connectDatabase } = require('./src/config');

// Create Express app
const app = createApp();

// Get port from environment
const PORT = process.env.PORT || 5000;

// Start server
const startServer = async () => {
  try {
    // Connect to MongoDB
    await connectDatabase();

    // Start listening
    const server = app.listen(PORT, () => {
      console.log(`
╔════════════════════════════════════════════════╗
║                                                ║
║   🚀 PRODUCT NAME - API Server                      ║
║                                                ║
║   Environment: ${process.env.NODE_ENV || 'development'.padEnd(28)}║
║   Port: ${PORT.toString().padEnd(37)}║
║   URL: http://localhost:${PORT}${' '.repeat(22 - PORT.toString().length)}║
║                                                ║
╚════════════════════════════════════════════════╝
      `);
    });

    // Handle graceful shutdown
    const gracefulShutdown = (signal) => {
      console.log(`\n${signal} received. Shutting down gracefully...`);
      server.close(() => {
        console.log('HTTP server closed.');
        process.exit(0);
      });
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (err) => {
      console.error('UNHANDLED REJECTION! 💥 Shutting down...');
      console.error(err.name, err.message);
      server.close(() => {
        process.exit(1);
      });
    });

    // Handle uncaught exceptions
    process.on('uncaughtException', (err) => {
      console.error('UNCAUGHT EXCEPTION! 💥 Shutting down...');
      console.error(err.name, err.message);
      process.exit(1);
    });
  } catch (error) {
    console.error('Failed to start server:', error.message);
    process.exit(1);
  }
};

// Start the server
startServer();
