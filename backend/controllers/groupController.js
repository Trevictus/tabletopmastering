/**
 * @fileoverview Group Controller
 * @description Handles group CRUD, members, invitations and permissions
 * @module controllers/groupController
 * @requires ../models/Group
 * @requires ../models/User
 * @requires ../models/Match
 * @requires ../utils/groupHelpers
 */

const Group = require('../models/Group');
const User = require('../models/User');
const Match = require('../models/Match');
const {
  generateUniqueInviteCode,
  addGroupToUser,
  removeGroupFromUser,
  removeGroupFromAllMembers,
  addMemberToGroup,
  removeMemberFromGroup,
  groupPopulateOptions,
  groupPopulateOptionsSimple,
} = require('../utils/groupHelpers');

// Maximum number of groups per user
const MAX_GROUPS_PER_USER = 7;

/**
 * @desc    Create a new group
 * @route   POST /api/groups
 * @access  Private
 */
const createGroup = async (req, res, next) => {
  try {
    const { name, description, avatar, settings } = req.body;

    // Check user group limit
    const userGroupCount = await Group.countDocuments({
      'members.user': req.user._id,
      isActive: true
    });

    if (userGroupCount >= MAX_GROUPS_PER_USER) {
      return res.status(400).json({
        success: false,
        message: `Has alcanzado el límite máximo de ${MAX_GROUPS_PER_USER} grupos`,
      });
    }

    // Generate unique invitation code
    const inviteCode = await generateUniqueInviteCode();

    // Create the group (pre-save middleware automatically adds admin as member)
    const group = await Group.create({
      name,
      description,
      avatar,
      inviteCode,
      admin: req.user._id,
      settings,
    });

    // Add the group to the user's groups array
    await addGroupToUser(req.user._id, group._id);

    // Populate to return complete data
    await group.populate(groupPopulateOptions);

    res.status(201).json({
      success: true,
      message: 'Grupo creado exitosamente',
      data: group,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all user's groups
 * @route   GET /api/groups
 * @access  Private
 */
const getMyGroups = async (req, res, next) => {
  try {
    const groups = await Group.find({
      'members.user': req.user._id,
      isActive: true,
    })
      .populate(groupPopulateOptionsSimple)
      .sort('-createdAt');

    res.status(200).json({
      success: true,
      count: groups.length,
      data: groups,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get a group by ID
 * @route   GET /api/groups/:id
 * @access  Private
 */
const getGroup = async (req, res, next) => {
  try {
    // Group already comes from isGroupMember middleware
    const group = req.group || await Group.findById(req.params.id)
      .populate(groupPopulateOptions);

    res.status(200).json({
      success: true,
      data: group,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Join a group via invitation code
 * @route   POST /api/groups/join
 * @access  Private
 */
const joinGroup = async (req, res, next) => {
  try {
    const { inviteCode } = req.body;

    const group = await Group.findOne({ inviteCode: inviteCode.toUpperCase(), isActive: true });

    if (!group) {
      return res.status(404).json({
        success: false,
        message: 'Código de invitación inválido',
      });
    }

    // Verify if already a member
    if (group.isMember(req.user._id)) {
      return res.status(400).json({
        success: false,
        message: 'Ya eres miembro de este grupo',
      });
    }

    // Verify user's group limit
    const userGroupCount = await Group.countDocuments({
      'members.user': req.user._id,
      isActive: true
    });

    if (userGroupCount >= MAX_GROUPS_PER_USER) {
      return res.status(400).json({
        success: false,
        message: `Has alcanzado el límite máximo de ${MAX_GROUPS_PER_USER} grupos`,
      });
    }

    // Verify member limit
    if (!group.canAcceptMoreMembers()) {
      return res.status(400).json({
        success: false,
        message: 'El grupo ha alcanzado el límite de miembros',
      });
    }

    // Add user to group
    await addMemberToGroup(group, req.user._id);

    // Populate to return complete data
    await group.populate(groupPopulateOptions);

    res.status(200).json({
      success: true,
      message: 'Te has unido al grupo exitosamente',
      data: group,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update group information
 * @route   PUT /api/groups/:id
 * @access  Private (Group Admin)
 */
const updateGroup = async (req, res, next) => {
  try {
    const { name, description, avatar, settings } = req.body;

    // Group already comes from isGroupAdmin middleware
    const group = req.group || await Group.findById(req.params.id);

    // Update fields
    if (name) group.name = name;
    if (description !== undefined) group.description = description;
    if (avatar !== undefined) group.avatar = avatar;
    if (settings) {
      if (settings.isPrivate !== undefined) group.settings.isPrivate = settings.isPrivate;
      if (settings.maxMembers !== undefined) {
        // Validate that the new limit is not less than the current member count
        if (settings.maxMembers < group.memberCount) {
          return res.status(400).json({
            success: false,
            message: `No puedes establecer un límite menor al número actual de miembros (${group.memberCount})`,
          });
        }
        group.settings.maxMembers = settings.maxMembers;
      }
      if (settings.requireApproval !== undefined) {
        group.settings.requireApproval = settings.requireApproval;
      }
    }

    await group.save();
    await group.populate(groupPopulateOptions);

    res.status(200).json({
      success: true,
      message: 'Grupo actualizado exitosamente',
      data: group,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Regenerate invitation code
 * @route   PUT /api/groups/:id/invite-code
 * @access  Private (Group Admin)
 */
const regenerateInviteCode = async (req, res, next) => {
  try {
    // Group already comes from isGroupAdmin middleware
    const group = req.group || await Group.findById(req.params.id);

    // Generate new unique code
    group.inviteCode = await generateUniqueInviteCode();
    await group.save();

    res.status(200).json({
      success: true,
      message: 'Código de invitación regenerado exitosamente',
      data: {
        inviteCode: group.inviteCode,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get group members
 * @route   GET /api/groups/:id/members
 * @access  Private (Group Member)
 */
const getMembers = async (req, res, next) => {
  try {
    // Group already comes from isGroupMember middleware
    let group = req.group;
    
    if (!group) {
      group = await Group.findById(req.params.id)
        .populate('members.user', 'name email avatar stats createdAt');
    } else if (!group.members[0].user.name) {
      // If group doesn't have populated members, populate them
      await group.populate('members.user', 'name email avatar stats createdAt');
    }

    res.status(200).json({
      success: true,
      count: group.memberCount,
      data: group.members,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Remove member from group
 * @route   DELETE /api/groups/:id/members/:userId
 * @access  Private (Group Admin)
 */
const removeMember = async (req, res, next) => {
  try {
    const { userId } = req.params;

    // Group already comes from isGroupAdmin middleware
    const group = req.group || await Group.findById(req.params.id);

    try {
      await removeMemberFromGroup(group, userId);

      res.status(200).json({
        success: true,
        message: 'Miembro expulsado exitosamente',
      });
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Leave the group
 * @route   DELETE /api/groups/:id/leave
 * @access  Private (Group Member)
 */
const leaveGroup = async (req, res, next) => {
  try {
    const group = await Group.findById(req.params.id).populate('members.user', 'name');

    if (!group || !group.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Grupo no encontrado',
      });
    }

    // Verify that the user is a member
    if (!group.isMember(req.user._id)) {
      return res.status(404).json({
        success: false,
        message: 'No eres miembro de este grupo',
      });
    }

    // If admin and there are more members, transfer admin to the oldest member
    if (group.isAdmin(req.user._id)) {
      const otherMembers = group.members.filter(
        m => m.user._id.toString() !== req.user._id.toString()
      );
      
      if (otherMembers.length > 0) {
        // Sort by join date and assign to the oldest
        otherMembers.sort((a, b) => new Date(a.joinedAt) - new Date(b.joinedAt));
        const newAdmin = otherMembers[0];
        
        group.admin = newAdmin.user._id;
        newAdmin.role = 'admin';
        await group.save();
      }
      // If no other members, group will be left without admin (or could be deleted)
    }

    // Remove member
    await removeMemberFromGroup(group, req.user._id);

    res.status(200).json({
      success: true,
      message: 'Has salido del grupo exitosamente',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete group
 * @route   DELETE /api/groups/:id
 * @access  Private (Group Admin)
 */
const deleteGroup = async (req, res, next) => {
  try {
    // Group already comes from isGroupAdmin middleware
    const group = req.group || await Group.findById(req.params.id);

    // Mark as inactive instead of deleting (soft delete)
    group.isActive = false;
    await group.save();

    // Remove the group from all users' groups array
    const memberIds = group.members.map((member) => member.user);
    await removeGroupFromAllMembers(memberIds, group._id);

    res.status(200).json({
      success: true,
      message: 'Grupo eliminado exitosamente',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Invite user to a group by email
 * @route   POST /api/groups/:id/invite
 * @access  Private (Group Admin)
 */
const inviteUserToGroup = async (req, res, next) => {
  try {
    const { email } = req.body;

    // Validate that email is present
    if (!email || !email.trim()) {
      return res.status(400).json({
        success: false,
        message: 'El email es obligatorio',
      });
    }

    // Group already comes from isGroupAdmin middleware
    const group = req.group || await Group.findById(req.params.id);

    if (!group || !group.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Grupo no encontrado',
      });
    }

    // Find user by email
    const userToInvite = await User.findOne({ email: email.toLowerCase() });

    if (!userToInvite) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado con ese email',
      });
    }

    // Verify if already a member
    if (group.isMember(userToInvite._id)) {
      return res.status(400).json({
        success: false,
        message: 'Este usuario ya es miembro del grupo',
      });
    }

    // Verify member limit
    if (!group.canAcceptMoreMembers()) {
      return res.status(400).json({
        success: false,
        message: 'El grupo ha alcanzado el límite de miembros',
      });
    }

    // Add user to group
    await addMemberToGroup(group, userToInvite._id);

    // Populate to return complete data
    await group.populate(groupPopulateOptions);

    res.status(200).json({
      success: true,
      message: `Usuario ${userToInvite.name} invitado al grupo exitosamente`,
      data: group,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get public group information by ID (without requiring membership)
 * @route   GET /api/groups/public/:id
 * @access  Public
 */
const getGroupPublic = async (req, res, next) => {
  try {
    const group = await Group.findById(req.params.id)
      .populate(groupPopulateOptions);

    if (!group || !group.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Grupo no encontrado',
      });
    }

    res.status(200).json({
      success: true,
      data: group,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createGroup,
  getMyGroups,
  getGroup,
  getGroupPublic,
  joinGroup,
  updateGroup,
  regenerateInviteCode,
  getMembers,
  removeMember,
  leaveGroup,
  deleteGroup,
  inviteUserToGroup,
};
