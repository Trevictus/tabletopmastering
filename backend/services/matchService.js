/**
 * @fileoverview Match Service
 * @description Business logic for match CRUD and results management
 * @module services/matchService
 * @requires ../models/Match
 * @requires ../models/Group
 * @requires ../models/Game
 * @requires ../models/User
 * @requires ./pointsCalculator
 * @requires ./rankingService
 */

const Match = require('../models/Match');
const Group = require('../models/Group');
const Game = require('../models/Game');
const User = require('../models/User');
const pointsCalculator = require('./pointsCalculator');
const rankingService = require('./rankingService');

/**
 * Optimized populate constants with minimal projections
 * NOTE: We include _id so frontend can make correct comparisons
 */
const MATCH_POPULATE_OPTIONS = [
  { path: 'game', select: 'name image thumbnail', options: { lean: true } },
  { path: 'group', select: 'name', options: { lean: true } },
  { path: 'players.user', select: 'name avatar', options: { lean: true } },
  { path: 'createdBy', select: 'name email avatar', options: { lean: true } },
  { path: 'winner', select: 'name avatar', options: { lean: true } },
];

const MATCH_POPULATE_LIST = [
  { path: 'game', select: 'name image', options: { lean: true } },
  { path: 'group', select: 'name', options: { lean: true } },
  { path: 'players.user', select: 'name avatar', options: { lean: true } },
  { path: 'createdBy', select: 'name', options: { lean: true } },
];

const MATCH_POPULATE_DETAILED = [
  { path: 'game', select: 'name image description minPlayers maxPlayers playingTime', options: { lean: true } },
  { path: 'group', select: 'name avatar', options: { lean: true } },
  { path: 'players.user', select: 'name email avatar stats', options: { lean: true } },
  { path: 'createdBy', select: 'name email avatar', options: { lean: true } },
  { path: 'winner', select: 'name email avatar', options: { lean: true } },
];

/**
 * Projections for Match queries
 */
const MATCH_LIST_PROJECTION = {
  game: 1,
  group: 1,
  scheduledDate: 1,
  status: 1,
  location: 1,
  players: 1,
  winner: 1,
  createdBy: 1,
  createdAt: 1,
};

/**
 * Validate that user is a member of the group (optimized with projection)
 */
exports.validateGroupMembership = async (groupId, userId) => {
  const group = await Group.findById(groupId)
    .select('members')
    .lean();
    
  if (!group) {
    throw { status: 404, message: 'Grupo no encontrado' };
  }

  const isMember = group.members.some(
    member => member.user.toString() === userId.toString()
  );

  if (!isMember) {
    throw { status: 403, message: 'No eres miembro de este grupo' };
  }

  return group;
};

/**
 * Create a match
 */
exports.createMatch = async (gameId, groupId, scheduledDate, userId, playerIds = [], location = '', notes = '') => {
  // Validations
  if (!gameId || !groupId || !scheduledDate) {
    throw new Error('gameId, groupId y scheduledDate son obligatorios');
  }

  // Verify game exists (we only need to know it exists)
  const game = await Game.findById(gameId)
    .select('_id name group')
    .lean();
    
  if (!game) {
    throw { status: 404, message: 'Juego no encontrado' };
  }

  // Verify group exists and user is a member (using projection)
  const group = await Group.findById(groupId)
    .select('members')
    .lean();
    
  if (!group) {
    throw { status: 404, message: 'Grupo no encontrado' };
  }
  
  const memberUserIds = new Set(group.members.map(m => m.user.toString()));
  
  if (!memberUserIds.has(userId.toString())) {
    throw { status: 403, message: 'No eres miembro de este grupo' };
  }

  // Validate date
  if (new Date(scheduledDate) < new Date()) {
    throw new Error('La fecha de la partida no puede ser en el pasado');
  }

  // Prepare players using Set for uniqueness
  const userIdStr = userId.toString();
  const uniquePlayerIds = new Set();
  
  if (playerIds && Array.isArray(playerIds) && playerIds.length > 0) {
    playerIds.forEach(id => uniquePlayerIds.add(id.toString()));
  }
  // Add creator if not in the list
  if (!uniquePlayerIds.has(userIdStr)) {
    uniquePlayerIds.add(userIdStr);
  }
  
  // Validate all players are group members (optimized without additional queries)
  const players = [];
  for (const playerId of uniquePlayerIds) {
    if (!memberUserIds.has(playerId)) {
      // Only query if user is not in the group
      const user = await User.findById(playerId).select('name').lean();
      const userName = user ? user.name : playerId;
      throw { status: 403, message: `El usuario ${userName} no es miembro del grupo` };
    }

    players.push({
      user: playerId,
      confirmed: playerId === userIdStr,
    });
  }

  // Validate minimum 2 players
  if (players.length < 2) {
    throw { status: 400, message: 'Una partida debe tener al menos 2 jugadores' };
  }

  // Create the match
  const match = await Match.create({
    game: gameId,
    group: groupId,
    scheduledDate,
    location,
    players,
    notes,
    createdBy: userId,
  });

  // Populate references
  await match.populate(MATCH_POPULATE_OPTIONS);

  return match;
};

/**
 * List matches with filters (optimized with lean and projection)
 */
exports.getMatches = async (groupId, userId, status = null, page = 1, limit = 20) => {
  // Build filter
  const filter = {};
  
  // If groupId is provided, validate membership and filter by group
  if (groupId) {
    await this.validateGroupMembership(groupId, userId);
    filter.group = groupId;
  } else {
    // If no groupId, get all matches where user is a player
    // Optimized: only get group _id
    const userGroups = await Group.find({
      'members.user': userId
    })
      .select('_id')
      .lean();
    
    const groupIds = userGroups.map(g => g._id);
    filter.group = { $in: groupIds };
  }
  
  if (status) {
    filter.status = status;
  }

  // Pagination
  const skip = (parseInt(page) - 1) * parseInt(limit);
  const limitNum = parseInt(limit);

  // Parallel queries for better performance
  const [matches, total] = await Promise.all([
    Match.find(filter)
      .select(MATCH_LIST_PROJECTION)
      .populate(MATCH_POPULATE_LIST)
      .sort({ scheduledDate: -1 })
      .skip(skip)
      .limit(limitNum)
      .lean(),
    Match.countDocuments(filter)
  ]);

  return {
    matches,
    count: matches.length,
    total,
    pages: Math.ceil(total / limitNum),
    currentPage: parseInt(page),
  };
};

/**
 * Get a match by ID with verified access (optimized)
 */
exports.getMatchById = async (matchId, userId) => {
  const match = await Match.findById(matchId)
    .populate(MATCH_POPULATE_DETAILED)
    .lean();

  if (!match) {
    throw { status: 404, message: 'Partida no encontrada' };
  }

  // Verify access permission (using already loaded populate data)
  const groupId = match.group._id || match.group;
  const group = await Group.findById(groupId)
    .select('members')
    .lean();
    
  const isMember = group.members.some(
    member => member.user.toString() === userId.toString()
  );

  if (!isMember) {
    throw { status: 403, message: 'No tienes permiso para ver esta partida' };
  }

  return match;
};

/**
 * Update a match (optimized)
 */
exports.updateMatch = async (matchId, updates, userId) => {
  // Get full document to avoid issues with Mongoose validations
  const match = await Match.findById(matchId);
    
  if (!match) {
    throw { status: 404, message: 'Partida no encontrada' };
  }

  // Only creator or group admin can edit
  const isCreator = match.createdBy.toString() === userId.toString();
  
  // Only query group if not the creator
  let isGroupAdmin = false;
  if (!isCreator) {
    const group = await Group.findById(match.group)
      .select('admin')
      .lean();
    isGroupAdmin = group.admin.toString() === userId.toString();
  }

  if (!isCreator && !isGroupAdmin) {
    throw { status: 403, message: 'No tienes permiso para editar esta partida' };
  }

  // Cannot update during match in progress
  if (match.status === 'en_curso') {
    throw new Error('No puedes editar una partida en curso');
  }

  // Validate date if provided
  const { scheduledDate, location, notes } = updates;
  if (scheduledDate && new Date(scheduledDate) < new Date()) {
    throw new Error('La fecha de la partida no puede ser en el pasado');
  }

  // If date changes, reset other players' confirmations (except creator)
  const oldScheduledDate = match.scheduledDate;
  const newScheduledDate = scheduledDate ? new Date(scheduledDate) : null;
  const dateChanged = newScheduledDate && oldScheduledDate.getTime() !== newScheduledDate.getTime();

  if (dateChanged) {
    match.players.forEach(player => {
      // Keep creator's confirmation, reset others
      if (player.user.toString() !== userId.toString()) {
        player.confirmed = false;
      }
    });
  }

  // Update allowed fields
  if (scheduledDate) match.scheduledDate = scheduledDate;
  if (location !== undefined) match.location = location;
  if (notes !== undefined) match.notes = notes;

  await match.save();
  await match.populate(MATCH_POPULATE_OPTIONS);

  return match;
};

/**
 * Finish a match and register results (optimized)
 */
exports.finishMatch = async (matchId, userId, winnerId = null, results = [], duration = null, notes = null) => {
  const match = await Match.findById(matchId);
  if (!match) {
    throw { status: 404, message: 'Partida no encontrada' };
  }

  // Only creator or group admin can finish
  const isCreator = match.createdBy.toString() === userId.toString();
  
  // Only query group if not the creator
  let isGroupAdmin = false;
  if (!isCreator) {
    const group = await Group.findById(match.group)
      .select('admin')
      .lean();
    isGroupAdmin = group.admin.toString() === userId.toString();
  }

  if (!isCreator && !isGroupAdmin) {
    throw { status: 403, message: 'No tienes permiso para terminar esta partida' };
  }

  // Validate match is not already finished
  if (match.status === 'finalizada') {
    throw new Error('Esta partida ya ha sido finalizada');
  }

  // Validate winner if provided
  if (winnerId) {
    const winnerExists = match.players.some(p => p.user.toString() === winnerId);
    if (!winnerExists) {
      throw new Error('El ganador debe ser uno de los jugadores de la partida');
    }
    match.winner = winnerId;
  }

  // Update results if provided
  if (results && Array.isArray(results)) {
    for (const result of results) {
      const playerIndex = match.players.findIndex(
        p => p.user.toString() === result.userId
      );

      if (playerIndex !== -1) {
        if (result.score !== undefined) {
          match.players[playerIndex].score = result.score;
        }
        if (result.position !== undefined) {
          match.players[playerIndex].position = result.position;
        }
      }
    }
  }

  // Validate positions if they exist
  const positionsToValidate = match.players.filter(p => p.position !== undefined && p.position !== null);
  if (positionsToValidate.length > 0) {
    if (!pointsCalculator.validatePositions(match.players)) {
      throw new Error('No puede haber posiciones duplicadas');
    }

    // Calculate points automatically based on positions
    const pointsData = pointsCalculator.calculatePointsForAllPlayers(match.players);
    pointsData.forEach(data => {
      const playerIndex = match.players.findIndex(
        p => p.user.toString() === data.userId.toString()
      );
      if (playerIndex !== -1) {
        match.players[playerIndex].pointsEarned = data.points;
      }
    });
  }

  // Update duration and status
  if (duration) {
    match.duration = duration;
  }

  // Update notes if provided
  if (notes !== null && notes !== undefined) {
    match.notes = notes;
  }

  match.status = 'finalizada';
  match.actualDate = new Date();

  await match.save();

  // Update ranking automatically
  const rankingReport = await rankingService.updateMatchStatistics(match);

  // Update group statistics
  if (match.group) {
    await Group.findByIdAndUpdate(
      match.group,
      { $inc: { 'stats.totalMatches': 1 } }
    );
  }

  await match.populate(MATCH_POPULATE_OPTIONS);

  return { match, rankingReport };
};

/**
 * Confirm match attendance (optimized)
 */
exports.confirmAttendance = async (matchId, userId) => {
  // Don't use select() to get all fields and return them complete
  const match = await Match.findById(matchId);
    
  if (!match) {
    throw { status: 404, message: 'Partida no encontrada' };
  }

  // The user must be one of the players
  const playerIndex = match.players.findIndex(
    p => p.user.toString() === userId.toString()
  );

  if (playerIndex === -1) {
    throw { status: 403, message: 'No estás invitado a esta partida' };
  }

  // Cannot confirm if match already finished
  if (match.status === 'finalizada' || match.status === 'cancelada') {
    throw new Error(`No puedes confirmar una partida ${match.status}`);
  }

  // Confirm attendance
  match.players[playerIndex].confirmed = true;

  await match.save();
  await match.populate(MATCH_POPULATE_DETAILED);

  return match;
};

/**
 * Cancel match attendance (leave match)
 * If user is not creator, they are removed from the match
 * If only 1 player remains, the match is deleted
 */
exports.cancelAttendance = async (matchId, userId) => {
  const match = await Match.findById(matchId);
    
  if (!match) {
    throw { status: 404, message: 'Partida no encontrada' };
  }

  // User must be one of the players
  const playerIndex = match.players.findIndex(
    p => p.user.toString() === userId.toString()
  );

  if (playerIndex === -1) {
    throw { status: 403, message: 'No estás invitado a esta partida' };
  }

  // Cannot cancel if match already finished or cancelled
  if (match.status === 'finalizada' || match.status === 'cancelada') {
    throw new Error(`No puedes cancelar asistencia a una partida ${match.status}`);
  }

  const isCreator = match.createdBy.toString() === userId.toString();

  if (isCreator) {
    // Creator only cancels their confirmation, cannot leave
    match.players[playerIndex].confirmed = false;
  } else {
    // Other players leave the match (are removed)
    match.players.splice(playerIndex, 1);
    
    // If only 1 player remains (the creator), delete the match
    if (match.players.length < 2) {
      await Match.findByIdAndDelete(matchId);
      return { deleted: true, message: 'Partida eliminada por falta de jugadores' };
    }
  }

  await match.save();
  await match.populate(MATCH_POPULATE_DETAILED);

  return match;
};

/**
 * Delete a match (optimized)
 */
exports.deleteMatch = async (matchId, userId) => {
  const match = await Match.findById(matchId)
    .select('createdBy group status');
    
  if (!match) {
    throw { status: 404, message: 'Partida no encontrada' };
  }

  // Only creator or group admin can delete
  const isCreator = match.createdBy.toString() === userId.toString();
  
  // Only query group if not the creator
  let isGroupAdmin = false;
  if (!isCreator) {
    const group = await Group.findById(match.group)
      .select('admin')
      .lean();
    isGroupAdmin = group.admin.toString() === userId.toString();
  }

  if (!isCreator && !isGroupAdmin) {
    throw { status: 403, message: 'No tienes permiso para eliminar esta partida' };
  }

  // Cannot delete finished matches
  if (match.status === 'finalizada') {
    throw new Error('No puedes eliminar una partida finalizada');
  }

  await Match.findByIdAndDelete(matchId);

  return match;
};

/**
 * Get global ranking
 */
exports.getGlobalRanking = async () => {
  return await rankingService.getGlobalRanking();
};

/**
 * Get group ranking (optimized)
 */
exports.getGroupRanking = async (groupId, userId) => {
  // Verify group exists and user is a member in a single query
  const group = await Group.findById(groupId)
    .select('members')
    .lean();
    
  if (!group) {
    throw { status: 404, message: 'Grupo no encontrado' };
  }

  // Verify user is a member of the group
  const isMember = group.members.some(
    member => member.user.toString() === userId.toString()
  );

  if (!isMember) {
    throw { status: 403, message: 'No eres miembro de este grupo' };
  }

  return await rankingService.getGroupRanking(groupId);
};
