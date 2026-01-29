/**
 * @fileoverview BGG Cache Model
 * @description Cache for BoardGameGeek data to reduce external API calls
 * @module models/BGGCache
 * @requires mongoose
 */

const mongoose = require('mongoose');

/**
 * BGG Cache Schema
 * @typedef {Object} BGGCache
 * @property {number} bggId - Unique game ID in BGG
 * @property {Object} data - Cached game data
 * @property {Date} lastSync - Last synchronization date
 */
const bggCacheSchema = new mongoose.Schema(
  {
    bggId: {
      type: Number,
      required: true,
      unique: true,
      index: true,
    },
    data: {
      type: Object,
      required: true,
    },
    lastSync: {
      type: Date,
      required: true,
      default: Date.now,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// TTL index for automatic deletion of expired documents
// MongoDB will automatically delete documents when expiresAt < now
bggCacheSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Static method to get valid cache data
bggCacheSchema.statics.getValidCache = async function(bggId) {
  const cached = await this.findOne({
    bggId: bggId,
    expiresAt: { $gt: new Date() },
  });
  
  return cached ? cached.data : null;
};

// Static method to save to cache with 30-day expiration
bggCacheSchema.statics.saveToCache = async function(bggId, data, expirationDays = 30) {
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + expirationDays);
  
  await this.findOneAndUpdate(
    { bggId: bggId },
    {
      bggId: bggId,
      data: data,
      lastSync: new Date(),
      expiresAt: expiresAt,
    },
    {
      upsert: true,
      new: true,
    }
  );
};

// Static method to invalidate cache for a specific game
bggCacheSchema.statics.invalidateCache = async function(bggId) {
  await this.deleteOne({ bggId: bggId });
};

// Static method to clear all cache (useful for maintenance)
bggCacheSchema.statics.clearAllCache = async function() {
  await this.deleteMany({});
};

// Static method to get cache statistics
bggCacheSchema.statics.getCacheStats = async function() {
  const total = await this.countDocuments();
  const expired = await this.countDocuments({
    expiresAt: { $lt: new Date() },
  });
  const valid = total - expired;
  
  return {
    total,
    valid,
    expired,
    hitRate: total > 0 ? (valid / total * 100).toFixed(2) + '%' : '0%',
  };
};

module.exports = mongoose.model('BGGCache', bggCacheSchema);
