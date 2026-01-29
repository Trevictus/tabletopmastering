/**
 * @fileoverview User Model
 * @description Defines the user schema with authentication, statistics and groups
 * @module models/User
 * @requires mongoose
 * @requires bcryptjs
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

/**
 * User Schema
 * @typedef {Object} User
 * @property {string} nickname - Unique player name
 * @property {string} name - Full name
 * @property {string} email - Unique email
 * @property {string} password - Hashed password
 * @property {string} avatar - Avatar URL
 * @property {Object} stats - Player statistics
 * @property {ObjectId[]} groups - Groups the user belongs to
 */
const userSchema = new mongoose.Schema(
  {
    nickname: {
      type: String,
      unique: true,
      sparse: true, // Allows null/undefined for existing users
      trim: true,
      lowercase: true,
      minlength: [3, 'El nickname debe tener al menos 3 caracteres'],
      maxlength: [20, 'El nickname no puede exceder 20 caracteres'],
      match: [/^[a-zA-Z0-9_-]+$/, 'El nickname solo puede contener letras, números, guiones y guiones bajos'],
    },
    name: {
      type: String,
      required: [true, 'El nombre es obligatorio'],
      trim: true,
      minlength: [2, 'El nombre debe tener al menos 2 caracteres'],
      maxlength: [50, 'El nombre no puede exceder 50 caracteres'],
      match: [/^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]+$/, 'El nombre solo puede contener letras y espacios'],
    },
    email: {
      type: String,
      required: [true, 'El email es obligatorio'],
      unique: true,
      lowercase: true,
      trim: true,
      validate: {
        validator: function(v) {
          // Only letters, numbers, dots, hyphens and underscores before @
          // Allowed domains and extensions .com or .es
          const emailRegex = /^[a-zA-Z0-9._-]+@(gmail|outlook|hotmail|yahoo|icloud|protonmail|live|msn)\.(com|es)$/i;
          return emailRegex.test(v);
        },
        message: 'Email inválido. Usa un dominio estándar (gmail, outlook, etc.) con .com o .es'
      },
    },
    password: {
      type: String,
      required: [true, 'La contraseña es obligatoria'],
      minlength: [8, 'La contraseña debe tener al menos 8 caracteres'],
      select: false, // Do not return password in queries by default
    },
    avatar: {
      type: String,
      default: 'https://via.placeholder.com/150',
    },
    description: {
      type: String,
      maxlength: [500, 'La descripción no puede exceder 500 caracteres'],
      default: '',
    },
    quote: {
      type: String,
      maxlength: [200, 'La cita no puede exceder 200 caracteres'],
      default: '',
    },
    stats: {
      totalMatches: {
        type: Number,
        default: 0,
      },
      totalWins: {
        type: Number,
        default: 0,
      },
      totalPoints: {
        type: Number,
        default: 0,
      },
    },
    groups: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Group',
      },
    ],
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes to improve ranking and search performance
// Note: email and nickname already have implicit unique index from unique: true in schema
userSchema.index({ 'stats.totalPoints': -1 });  // Global ranking by points
userSchema.index({ groups: 1, 'stats.totalPoints': -1 });  // Ranking by group
userSchema.index({ isActive: 1, 'stats.totalPoints': -1 });  // Active users ranking
userSchema.index({ 'stats.totalWins': -1 });  // Ranking by wins
userSchema.index({ createdAt: -1 });  // Most recent users
userSchema.index({ name: 'text', nickname: 'text' });  // Text search

// Middleware to hash password before saving
userSchema.pre('save', async function (next) {
  // Only hash if password has been modified
  if (!this.isModified('password')) {
    return next();
  }

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare passwords
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Method to hide sensitive information in JSON responses
userSchema.methods.toJSON = function () {
  const user = this.toObject();
  delete user.password;
  delete user.__v;
  return user;
};

module.exports = mongoose.model('User', userSchema);
