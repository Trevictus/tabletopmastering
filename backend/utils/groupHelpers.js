/**
 * @fileoverview Group Utilities
 * @description Helper functions for group and member management
 * @module utils/groupHelpers
 * @requires ../models/Group
 * @requires ../models/User
 */

const Group = require('../models/Group');
const User = require('../models/User');

/**
 * Generates a unique invitation code (optimized with exists)
 * @returns {Promise<string>} Unique invitation code
 */
const generateUniqueInviteCode = async () => {
  let inviteCode;
  let isUnique = false;
  let attempts = 0;
  const maxAttempts = 10;

  while (!isUnique && attempts < maxAttempts) {
    inviteCode = Group.generateInviteCode();
    // Use exists instead of findOne (more efficient)
    const exists = await Group.exists({ inviteCode });
    if (!exists) {
      isUnique = true;
    }
    attempts++;
  }

  if (!isUnique) {
    throw new Error('No se pudo generar un código de invitación único');
  }

  return inviteCode;
};

/**
 * Adds a group to the user's groups array (already optimized with $addToSet)
 * @param {ObjectId} userId - User ID
 * @param {ObjectId} groupId - Group ID
 */
const addGroupToUser = async (userId, groupId) => {
  await User.updateOne(
    { _id: userId },
    { $addToSet: { groups: groupId } }
  );
};

/**
 * Removes a group from the user's groups array
 * @param {ObjectId} userId - User ID
 * @param {ObjectId} groupId - Group ID
 */
const removeGroupFromUser = async (userId, groupId) => {
  await User.updateOne(
    { _id: userId },
    { $pull: { groups: groupId } }
  );
};

/**
 * Removes a group from the groups array of all members
 * @param {Array} memberIds - Array of user IDs
 * @param {ObjectId} groupId - Group ID
 */
const removeGroupFromAllMembers = async (memberIds, groupId) => {
  await User.updateMany(
    { _id: { $in: memberIds } },
    { $pull: { groups: groupId } }
  );
};

/**
 * Adds a member to the group
 * @param {Object} group - Group instance
 * @param {ObjectId} userId - ID of the user to add
 * @param {string} role - User role (optional, defaults to 'member')
 */
const addMemberToGroup = async (group, userId, role = 'member') => {
  if (group.isMember(userId)) {
    throw new Error('El usuario ya es miembro del grupo');
  }

  if (!group.canAcceptMoreMembers()) {
    throw new Error('El grupo ha alcanzado el límite de miembros');
  }

  group.members.push({
    user: userId,
    role,
  });

  await group.save();
  await addGroupToUser(userId, group._id);

  return group;
};

/**
 * Removes a member from the group
 * @param {Object} group - Group instance
 * @param {ObjectId} userId - ID of the user to remove
 */
const removeMemberFromGroup = async (group, userId) => {
  if (group.isAdmin(userId)) {
    throw new Error('No se puede expulsar al administrador del grupo');
  }

  const memberIndex = group.members.findIndex((member) => member.user.equals(userId));

  if (memberIndex === -1) {
    throw new Error('El usuario no es miembro del grupo');
  }

  group.members.splice(memberIndex, 1);
  await group.save();
  await removeGroupFromUser(userId, group._id);

  return group;
};

/**
 * Standard populate options for groups (includes complete member data)
 */
const groupPopulateOptions = [
  { path: 'admin', select: '_id name email avatar stats' },
  { path: 'members.user', select: '_id name email avatar stats' },
];

/**
 * Simplified populate options for listings (includes _id for comparisons)
 */
const groupPopulateOptionsSimple = [
  { path: 'admin', select: '_id name avatar' },
  { path: 'members.user', select: '_id name avatar' },
];

/**
 * Populate options for listings (minimum required)
 */
const groupPopulateOptionsList = [
  { path: 'admin', select: '_id name' },
];

module.exports = {
  generateUniqueInviteCode,
  addGroupToUser,
  removeGroupFromUser,
  removeGroupFromAllMembers,
  addMemberToGroup,
  removeMemberFromGroup,
  groupPopulateOptions,
  groupPopulateOptionsSimple,
  groupPopulateOptionsList,
};
