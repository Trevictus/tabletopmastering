/**
 * @fileoverview Game Model
 * @description Defines the board game schema (custom or from BGG)
 * @module models/Game
 * @requires mongoose
 */

const mongoose = require('mongoose');

/**
 * Game Schema
 * @typedef {Object} Game
 * @property {string} name - Game name
 * @property {string} description - Description
 * @property {number} minPlayers - Minimum players
 * @property {number} maxPlayers - Maximum players
 * @property {string} source - Source (bgg/custom)
 * @property {number} bggId - BoardGameGeek ID
 */
const gameSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'El nombre del juego es obligatorio'],
      trim: true,
      minlength: [2, 'El nombre debe tener al menos 2 caracteres'],
      maxlength: [150, 'El nombre no puede exceder 150 caracteres'],
    },
    description: {
      type: String,
      maxlength: [2000, 'La descripción no puede exceder 2000 caracteres'],
      default: '',
    },
    image: {
      type: String,
      default: 'https://via.placeholder.com/300x400?text=Board+Game',
    },
    thumbnail: {
      type: String,
      default: '',
    },
    minPlayers: {
      type: Number,
      required: [true, 'El número mínimo de jugadores es obligatorio'],
      min: [1, 'Debe haber al menos 1 jugador'],
    },
    maxPlayers: {
      type: Number,
      required: [true, 'El número máximo de jugadores es obligatorio'],
      min: [1, 'Debe haber al menos 1 jugador'],
      validate: {
        validator: function (value) {
          return value >= this.minPlayers;
        },
        message: 'El número máximo de jugadores debe ser mayor o igual al mínimo',
      },
    },
    playingTime: {
      type: Number,
      default: 0,
      min: [0, 'El tiempo de juego no puede ser negativo'],
    },
    minPlayTime: {
      type: Number,
      default: 0,
    },
    maxPlayTime: {
      type: Number,
      default: 0,
    },
    categories: [
      {
        type: String,
        trim: true,
      },
    ],
    mechanics: [
      {
        type: String,
        trim: true,
      },
    ],
    difficulty: {
      type: String,
      enum: ['easy', 'medium', 'hard', 'expert', ''],
      default: '',
    },
    // BGG-specific fields
    source: {
      type: String,
      enum: ['bgg', 'custom'],
      required: [true, 'El origen del juego es obligatorio'],
      default: 'custom',
    },
    bggId: {
      type: Number,
    },
    yearPublished: {
      type: Number,
      min: [1800, 'El año debe ser mayor a 1800'],
      max: [new Date().getFullYear() + 5, 'El año no puede ser muy lejano en el futuro'],
    },
    designer: [
      {
        type: String,
        trim: true,
      },
    ],
    publisher: [
      {
        type: String,
        trim: true,
      },
    ],
    rating: {
      average: {
        type: Number,
        min: 0,
        max: 10,
        default: 0,
      },
      usersRated: {
        type: Number,
        default: 0,
      },
      bayesAverage: {
        type: Number,
        min: 0,
        max: 10,
        default: 0,
      },
    },
    // Optional group field (only for games in groups)
    group: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Group',
      default: null,
    },
    addedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    stats: {
      timesPlayed: {
        type: Number,
        default: 0,
      },
      lastPlayed: {
        type: Date,
      },
    },
    // BGG synchronization metadata
    bggLastSync: {
      type: Date,
    },
    // User customizable fields
    customNotes: {
      type: String,
      maxlength: [500, 'Las notas no pueden exceder 500 caracteres'],
      default: '',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for more efficient searches
gameSchema.index({ name: 'text', description: 'text' });  // Full text search
gameSchema.index({ group: 1, name: 1 });  // Games by group ordered by name
gameSchema.index({ group: 1, isActive: 1, createdAt: -1 });  // Active group games by date
gameSchema.index({ bggId: 1 }, { sparse: true });  // Search by BGG ID (sparse for nulls)
gameSchema.index({ source: 1, isActive: 1 });  // Filter by source
gameSchema.index({ 'rating.average': -1, isActive: 1 });  // Top rated active games
gameSchema.index({ addedBy: 1, group: 1, isActive: 1 });  // Personal vs group games
gameSchema.index({ 'stats.timesPlayed': -1, isActive: 1 });  // Most played games
gameSchema.index({ categories: 1 });  // Filter by category
gameSchema.index({ minPlayers: 1, maxPlayers: 1 });  // Filter by player count

// Method to check if BGG update is needed (30 days)
gameSchema.methods.needsBGGUpdate = function() {
  if (this.source !== 'bgg') return false;
  if (!this.bggLastSync) return true;
  
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  return this.bggLastSync < thirtyDaysAgo;
};

// Virtual to get formatted playing time
gameSchema.virtual('playingTimeFormatted').get(function() {
  if (this.minPlayTime && this.maxPlayTime) {
    return `${this.minPlayTime}-${this.maxPlayTime} minutes`;
  }
  if (this.playingTime) {
    return `${this.playingTime} minutes`;
  }
  return 'Not specified';
});

// Ensure virtuals are included in JSON
gameSchema.set('toJSON', { virtuals: true });
gameSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Game', gameSchema);
