/**
 * @fileoverview Group Model
 * @description Defines the group schema with members, roles and invitations
 * @module models/Group
 * @requires mongoose
 * @requires crypto
 */

const mongoose = require('mongoose');
const crypto = require('crypto');

/**
 * Group Schema
 * @typedef {Object} Group
 * @property {string} name - Group name
 * @property {string} inviteCode - Unique invitation code
 * @property {ObjectId} admin - Group administrator
 * @property {Array} members - List of members with roles
 */
const groupSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'El nombre del grupo es obligatorio'],
      trim: true,
      minlength: [3, 'El nombre debe tener al menos 3 caracteres'],
      maxlength: [50, 'El nombre no puede exceder 50 caracteres'],
    },
    description: {
      type: String,
      maxlength: [500, 'La descripción no puede exceder 500 caracteres'],
      default: '',
    },
    avatar: {
      type: String,
      default: 'https://via.placeholder.com/200',
    },
    inviteCode: {
      type: String,
      required: true,
      uppercase: true,
    },
    admin: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'El grupo debe tener un administrador'],
    },
    members: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
          required: true,
        },
        role: {
          type: String,
          enum: ['admin', 'moderator', 'member'],
          default: 'member',
        },
        joinedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    settings: {
      isPrivate: {
        type: Boolean,
        default: true,
      },
      maxMembers: {
        type: Number,
        default: 50,
        min: [2, 'El grupo debe permitir al menos 2 miembros'],
      },
      requireApproval: {
        type: Boolean,
        default: false,
      },
    },
    stats: {
      totalMatches: {
        type: Number,
        default: 0,
      },
      totalGames: {
        type: Number,
        default: 0,
      },
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

// Virtual to count active members
groupSchema.virtual('memberCount').get(function () {
  return this.members ? this.members.length : 0;
});

// Static method to generate unique and secure invitation code
groupSchema.statics.generateInviteCode = function () {
  // Generate random bytes and convert to alphanumeric string
  const buffer = crypto.randomBytes(6);
  let code = '';
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  
  for (let i = 0; i < 8; i++) {
    code += chars[buffer[i % 6] % chars.length];
  }
  
  return code;
};

// Instance method: check if a user is a member
groupSchema.methods.isMember = function (userId) {
  return this.members.some((member) => member.user.equals(userId));
};

// Instance method: check if a user is admin
groupSchema.methods.isAdmin = function (userId) {
  return this.admin.equals(userId);
};

// Instance method: check if a user is admin or moderator
groupSchema.methods.isAdminOrModerator = function (userId) {
  if (this.admin.equals(userId)) return true;
  const member = this.members.find((m) => m.user.equals(userId));
  return member && (member.role === 'admin' || member.role === 'moderator');
};

// Instance method: get user role
groupSchema.methods.getMemberRole = function (userId) {
  const member = this.members.find((m) => m.user.equals(userId));
  return member ? member.role : null;
};

// Instance method: check if can accept more members
groupSchema.methods.canAcceptMoreMembers = function () {
  return this.members.length < this.settings.maxMembers;
};

// Middleware: add admin as member when creating the group
groupSchema.pre('save', function (next) {
  if (this.isNew && !this.members.some((m) => m.user.equals(this.admin))) {
    this.members.push({
      user: this.admin,
      role: 'admin',
    });
  }
  next();
});

// Configure virtuals in JSON and Object
groupSchema.set('toJSON', { virtuals: true });
groupSchema.set('toObject', { virtuals: true });

// Indexes to optimize searches
groupSchema.index({ inviteCode: 1 }, { unique: true });  // Search by invitation code
groupSchema.index({ admin: 1 });  // Groups by administrator
groupSchema.index({ 'members.user': 1 });  // Search groups by member
groupSchema.index({ isActive: 1, createdAt: -1 });  // List active groups ordered
groupSchema.index({ 'members.user': 1, isActive: 1 });  // Compound index for user's active groups
groupSchema.index({ name: 'text', description: 'text' });  // Text search in name and description
groupSchema.index({ 'stats.totalMatches': -1 });  // Most active groups

module.exports = mongoose.model('Group', groupSchema);
