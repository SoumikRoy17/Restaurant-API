const express = require('express');
const cors = require('cors');
const path = require('path');
const { initializeDatabase } = require('./utils/database');
const { initializeReportService } = require('./services/reportService');
const { downloadAndExtractData } = require('./utils/dataLoader');
const reportRoutes = require('./routes/reportRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static file serving for report downloads
app.use('/reports', express.static(path.join(__dirname, '../reports')));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString()
  });
});

// API routes
app.use('/api', reportRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: true,
    message: 'Resource not found'
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  
  // Handle specific error types
  if (err.name === 'SequelizeValidationError') {
    return res.status(400).json({
      error: true,
      message: 'Validation error',
      details: err.errors.map(e => e.message)
    });
  }
  
  if (err.name === 'SequelizeDatabaseError') {
    return res.status(500).json({
      error: true,
      message: 'Database error',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
  
  // Default error response
  res.status(err.statusCode || 500).json({
    error: true,
    message: err.message || 'An unexpected error occurred',
    details: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

// Initialize application
async function initializeApp() {
  try {
    // Ensure database is ready
    console.log('Initializing database...');
    await initializeDatabase();
    
    // Download and process data files
    console.log('Downloading and extracting data files...');
    await downloadAndExtractData();
    
    // Initialize report service
    console.log('Initializing report service...');
    await initializeReportService();
    
    // Start server
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      console.log(`Health check: http://localhost:${PORT}/health`);
      console.log(`API endpoint: http://localhost:${PORT}/api`);
    });
  } catch (error) {
    console.error('Failed to initialize application:', error);
    process.exit(1);
  }
}

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Start the application
initializeApp();

module.exports = app;