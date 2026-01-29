/**
 * BGG Service - Uses mock to avoid external API dependency
 */
const { createLogger } = require('../utils/logger');
const logger = createLogger('BGGService');

logger.info('Using BGG mock service');
module.exports = require('./bggService.mock');

