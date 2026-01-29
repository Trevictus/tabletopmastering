/**
 * @fileoverview MongoDB connection configuration
 * @description Establishes and manages MongoDB database connection
 * @module config/database
 * @requires mongoose
 */

const mongoose = require('mongoose');
const { createLogger } = require('../utils/logger');

const logger = createLogger('Database');

/**
 * Connect to MongoDB database
 * @async
 * @function connectDB
 * @returns {Promise<void>}
 * @throws {Error} If unable to connect to MongoDB
 */
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
    });

    logger.info(`MongoDB connected: ${conn.connection.host}`);
    logger.info(`Database: ${conn.connection.name}`);
  } catch (error) {
    logger.error(`Failed to connect to MongoDB: ${error.message}`);
    process.exit(1);
  }
};

// Connection events
mongoose.connection.on('disconnected', () => {
  logger.warn('MongoDB disconnected');
});

mongoose.connection.on('error', (err) => {
  logger.error(`MongoDB connection error: ${err}`);
});

module.exports = connectDB;
