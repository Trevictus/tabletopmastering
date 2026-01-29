/**
 * @fileoverview Match Model
 * @description Defines the match schema with players, results and statistics
 * @module models/Match
 * @requires mongoose
 */

const mongoose = require('mongoose');

/**
 * Match Schema
 * @typedef {Object} Match
 * @property {ObjectId} game - Match game
 * @property {ObjectId} group - Group where the match is played
 * @property {Date} scheduledDate - Scheduled date
 * @property {string} status - Status (programada/en_curso/finalizada/cancelada)
 * @property {Array} players - Participating players
 * @property {ObjectId} winner - Match winner
 */
const matchSchema = new mongoose.Schema(
  {
    game: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Game',
      required: [true, 'El juego es obligatorio'],
    },
    group: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Group',
      required: [true, 'El grupo es obligatorio'],
    },
    scheduledDate: {
      type: Date,
      required: [true, 'La fecha programada es obligatoria'],
    },
    actualDate: {
      type: Date,
    },
    status: {
      type: String,
      enum: ['programada', 'en_curso', 'finalizada', 'cancelada'],
      default: 'programada',
    },
    location: {
      type: String,
      trim: true,
      maxlength: [200, 'La ubicación no puede exceder 200 caracteres'],
    },
    players: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
          required: true,
        },
        confirmed: {
          type: Boolean,
          default: false,
        },
        score: {
          type: Number,
          default: 0,
        },
        position: {
          type: Number,
          min: 1,
        },
        pointsEarned: {
          type: Number,
          default: 0,
        },
      },
    ],
    winner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      validate: {
        validator: function(val) {
          // If there's a winner, they must be one of the players
          if (!val) return true; // If no winner, ok
          return this.players.some(p => p.user.toString() === val.toString());
        },
        message: 'El ganador debe ser uno de los jugadores'
      }
    },
    duration: {
      value: {
        type: Number,
        min: [1, 'La duración debe ser al menos 1'],
        max: [1440, 'La duración máxima es 24 horas'],
      },
      unit: {
        type: String,
        enum: ['minutos', 'horas'],
        default: 'minutos',
      },
    },
    notes: {
      type: String,
      maxlength: [1000, 'Las notas no pueden exceder 1000 caracteres'],
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for efficient searches
matchSchema.index({ group: 1, scheduledDate: -1 });  // Matches by group ordered by date
matchSchema.index({ group: 1, status: 1, scheduledDate: -1 });  // Filter by group+status+date
matchSchema.index({ game: 1, status: 1 });  // Statistics by game
matchSchema.index({ 'players.user': 1, status: 1 });  // User matches by status
matchSchema.index({ createdBy: 1, createdAt: -1 });  // Matches created by user
matchSchema.index({ status: 1, scheduledDate: 1 });  // Upcoming scheduled matches
matchSchema.index({ winner: 1 }, { sparse: true });  // Winner queries (sparse for optimization)

// Validation: at least 2 players (only on creation or when players is defined)
matchSchema.pre('save', function (next) {
  // Only validate if players is present (may not be on partial updates)
  if (this.players && this.players.length < 2) {
    next(new Error('Una partida debe tener al menos 2 jugadores'));
  } else {
    next();
  }
});

module.exports = mongoose.model('Match', matchSchema);
