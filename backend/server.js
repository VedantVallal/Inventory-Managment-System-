const app = require('./src/app');
const { testConnection } = require('./src/config/database');
const logger = require('./src/utils/logger');
require('dotenv').config();

const PORT = process.env.PORT || 5000;

// Start server
const startServer = async () => {
  try {
    // Test database connection
    logger.info('Testing Supabase connection...');
    const isConnected = await testConnection();
    
    if (!isConnected) {
      logger.error('Failed to connect to Supabase. Please check your credentials.');
      process.exit(1);
    }

    // Start Express server
    app.listen(PORT, () => {
      logger.success(`🚀 Server is running on port ${PORT}`);
      logger.info(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
      logger.info(`🌐 Health check: http://localhost:${PORT}/health`);
      logger.info(`🔗 API base: http://localhost:${PORT}/api/v1`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  logger.error('Unhandled Promise Rejection:', err);
  process.exit(1);
});

// Start the server
startServer();