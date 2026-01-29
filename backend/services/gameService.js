/**
 * @fileoverview Game Service
 * @description Business logic for game CRUD and BGG synchronization
 * @module services/gameService
 * @requires ../models/Game
 * @requires ../models/Group
 */

const Game = require('../models/Game');
const Group = require('../models/Group');

/**
 * Projections for Game queries
 */
const GAME_LIST_PROJECTION = {
  name: 1,
  image: 1,
  thumbnail: 1,
  minPlayers: 1,
  maxPlayers: 1,
  playingTime: 1,
  categories: 1,
  source: 1,
  bggId: 1,
  'rating.average': 1,
  'stats.timesPlayed': 1,
  addedBy: 1,
  group: 1,
  createdAt: 1,
};

const GAME_DETAIL_PROJECTION = {
  name: 1,
  description: 1,
  image: 1,
  thumbnail: 1,
  minPlayers: 1,
  maxPlayers: 1,
  playingTime: 1,
  minPlayTime: 1,
  maxPlayTime: 1,
  categories: 1,
  mechanics: 1,
  difficulty: 1,
  source: 1,
  bggId: 1,
  yearPublished: 1,
  designer: 1,
  publisher: 1,
  rating: 1,
  stats: 1,
  customNotes: 1,
  addedBy: 1,
  group: 1,
  createdAt: 1,
};

/**
 * Create a custom game
 */
exports.createCustomGame = async (gameData, userId, groupId = null) => {
  const {
    name,
    description,
    image,
    minPlayers,
    maxPlayers,
    playingTime,
    categories,
    mechanics,
    difficulty,
    yearPublished,
    customNotes,
  } = gameData;

  // Validations
  if (!name) {
    throw new Error('El nombre del juego es obligatorio');
  }

  if (!minPlayers || !maxPlayers) {
    throw new Error('El número de jugadores es obligatorio');
  }

  // Check if game already exists in context (group or personal) - optimized with lean
  const duplicateFilter = groupId 
    ? { name: name, group: groupId, isActive: true }
    : { name: name, addedBy: userId, group: null, isActive: true };

  const existingGame = await Game.findOne(duplicateFilter)
    .select('_id name')
    .lean();
    
  if (existingGame) {
    throw { 
      status: 400, 
      message: 'Este juego ya está en la colección',
      data: existingGame 
    };
  }

  // Create custom game
  const game = await Game.create({
    name,
    description: description || '',
    image: image || undefined,
    minPlayers,
    maxPlayers,
    playingTime: playingTime || 0,
    categories: categories || [],
    mechanics: mechanics || [],
    difficulty: difficulty || '',
    yearPublished,
    group: groupId || null,
    addedBy: userId,
    source: 'custom',
    customNotes: customNotes || '',
    isActive: true,
  });

  // Verify game was saved correctly and populate
  const savedGame = await Game.findById(game._id)
    .populate('addedBy', 'name email')
    .populate('group', 'name');

  if (!savedGame) {
    throw new Error('Error al guardar el juego en la base de datos');
  }

  return savedGame;
};

/**
 * Get games (personal or by group without duplicates)
 * When querying by group:
 * - Gets personal games from all group members
 * - Automatically deduplicates by name/bggId
 * Games are NOT assigned directly to groups, only to users
 */
exports.getGames = async (userId, groupId = null, filters = {}) => {
  const { source, search, page = 1, limit = 20 } = filters;

  let filter = { isActive: true };
  let needsDeduplication = false;

  if (groupId) {
    // Get only member IDs from the group (optimized)
    const group = await Group.findById(groupId)
      .select('members.user')
      .lean();
      
    if (!group) {
      throw { status: 404, message: 'Grupo no encontrado' };
    }

    // Get IDs of all group members
    const memberIds = group.members.map(m => m.user);

    // Only personal games from members (group = null)
    filter.addedBy = { $in: memberIds };
    filter.group = null;
    needsDeduplication = true;
  } else {
    // User's personal games (no group)
    filter.addedBy = userId;
    filter.group = null;
  }

  // Apply source filter if provided
  if (source && ['bgg', 'custom'].includes(source)) {
    filter.source = source;
  }

  // Apply search if provided (optimized with text index)
  if (search) {
    // Use $text search if available (more efficient with index)
    const searchFilter = {
      $or: [
        { name: { $regex: search, $options: 'i' } },
        { categories: { $in: [new RegExp(search, 'i')] } },
      ]
    };
    // Combine with existing filters
    filter = { $and: [filter, searchFilter] };
  }

  // Get games with projection and lean
  const allGames = await Game.find(filter)
    .select(GAME_LIST_PROJECTION)
    .populate('addedBy', 'name email -_id')
    .populate('group', 'name -_id')
    .sort({ createdAt: -1 })
    .lean();

  // Deduplicate if necessary (in group) - by normalized name to avoid duplicates
  const games = needsDeduplication
    ? this.deduplicateGamesByName(allGames)
    : allGames;

  // Apply pagination post-deduplication
  const skip = (parseInt(page) - 1) * parseInt(limit);
  const paginatedGames = games.slice(skip, skip + parseInt(limit));
  const total = games.length;

  return {
    games: paginatedGames,
    count: paginatedGames.length,
    total,
    pages: Math.ceil(total / parseInt(limit)),
    currentPage: parseInt(page),
  };
};

/**
 * Get a game by ID (optimized)
 */
exports.getGameById = async (gameId, userId = null) => {
  const game = await Game.findOne({ _id: gameId, isActive: true })
    .select(GAME_DETAIL_PROJECTION)
    .populate('addedBy', 'name email avatar')
    .populate('group', 'name description avatar')
    .lean();

  if (!game) {
    throw { status: 404, message: 'Juego no encontrado' };
  }

  // Verify access if it has a group
  if (game.group && userId) {
    const groupId = game.group._id || game.group;
    const group = await Group.findById(groupId)
      .select('admin members.user')
      .lean();
      
    const isAdmin = group.admin.toString() === userId.toString();
    const isMember = group.members.some(
      member => member.user.toString() === userId.toString()
    );

    if (!isAdmin && !isMember) {
      throw { status: 403, message: 'No tienes acceso a este juego' };
    }
  }

  return game;
};

/**
 * Update a game (optimized)
 */
exports.updateGame = async (gameId, updates, userId) => {
  let game = await Game.findOne({ _id: gameId, isActive: true })
    .select('source group addedBy');

  if (!game) {
    throw { status: 404, message: 'Juego no encontrado' };
  }

  // Verify permissions (only if it has a group)
  if (game.group) {
    const group = await Group.findById(game.group)
      .select('members')
      .lean();
      
    const member = group.members.find(
      m => m.user.toString() === userId.toString()
    );

    if (!member) {
      throw { 
        status: 403, 
        message: 'No tienes permisos para editar este juego' 
      };
    }

    // Only admin can edit, or the user who added it
    if (member.role !== 'admin' && game.addedBy.toString() !== userId.toString()) {
      throw { 
        status: 403, 
        message: 'Solo el administrador o quien añadió el juego puede editarlo' 
      };
    }
  }

  // Allowed fields to edit based on source
  let allowedFields;
  
  if (game.source === 'bgg') {
    // For BGG games, only allow editing custom fields
    allowedFields = ['customNotes', 'difficulty', 'image'];
  } else {
    // For custom games, allow editing everything except source and bggId
    allowedFields = [
      'name', 'description', 'image', 'minPlayers', 'maxPlayers',
      'playingTime', 'minPlayTime', 'maxPlayTime', 'categories', 'mechanics',
      'difficulty', 'yearPublished', 'customNotes'
    ];
  }

  // Filter allowed fields
  const filteredUpdates = {};
  allowedFields.forEach(field => {
    if (updates[field] !== undefined) {
      filteredUpdates[field] = updates[field];
    }
  });

  game = await Game.findByIdAndUpdate(
    gameId,
    filteredUpdates,
    { new: true, runValidators: true }
  )
    .populate('addedBy', 'name email')
    .populate('group', 'name');

  // Verify update was successful
  if (!game) {
    throw new Error('Error al actualizar el juego en la base de datos');
  }

  return game;
};

/**
 * Delete a game (soft delete) - optimized
 */
exports.deleteGame = async (gameId, userId) => {
  const game = await Game.findOne({ _id: gameId, isActive: true })
    .select('group addedBy');

  if (!game) {
    throw { status: 404, message: 'Juego no encontrado' };
  }

  // Verify permissions
  if (game.group) {
    const group = await Group.findById(game.group)
      .select('members')
      .lean();
      
    const member = group.members.find(
      m => m.user.toString() === userId.toString()
    );

    if (!member) {
      throw { 
        status: 403, 
        message: 'No tienes permisos para eliminar este juego' 
      };
    }

    // Only admin can delete, or the user who added it
    if (member.role !== 'admin' && game.addedBy.toString() !== userId.toString()) {
      throw { 
        status: 403, 
        message: 'Solo el administrador o quien añadió el juego puede eliminarlo' 
      };
    }
  }

  // Soft delete using updateOne (more efficient)
  await Game.updateOne({ _id: gameId }, { isActive: false });

  return game;
};

/**
 * Get game statistics for a group (optimized with aggregation)
 */
exports.getGroupStats = async (groupId) => {
  // Use aggregation to get multiple statistics in a single query
  const statsAggregation = await Game.aggregate([
    { $match: { group: groupId, isActive: true } },
    {
      $facet: {
        // Conteo total y por fuente
        totals: [
          {
            $group: {
              _id: '$source',
              count: { $sum: 1 }
            }
          }
        ],
        // Top rated
        topRated: [
          { $sort: { 'rating.average': -1 } },
          { $limit: 5 },
          { $project: { name: 1, 'rating.average': 1, image: 1 } }
        ],
        // Most played
        mostPlayed: [
          { $sort: { 'stats.timesPlayed': -1 } },
          { $limit: 5 },
          { $project: { name: 1, 'stats.timesPlayed': 1, image: 1 } }
        ],
        // Categories stats
        categories: [
          { $unwind: '$categories' },
          { $group: { _id: '$categories', count: { $sum: 1 } } },
          { $sort: { count: -1 } },
          { $limit: 10 }
        ]
      }
    }
  ]);

  const stats = statsAggregation[0];
  
  // Process counts by source
  const sourceCounts = { bgg: 0, custom: 0 };
  let totalGames = 0;
  
  stats.totals.forEach(item => {
    if (item._id === 'bgg') sourceCounts.bgg = item.count;
    else if (item._id === 'custom') sourceCounts.custom = item.count;
    totalGames += item.count;
  });

  return {
    totalGames,
    total: totalGames, // Mantener retrocompatibilidad
    bySource: sourceCounts,
    topRated: stats.topRated,
    mostPlayed: stats.mostPlayed,
    topCategories: stats.categories.map(c => ({ name: c._id, count: c.count })),
  };
};

/**
 * Helper: Generate unique identifier for a game
 * - For BGG games: uses bggId (more precise)
 * - For custom games: uses normalized name
 */
exports.getGameIdentifier = (game) => {
  if (game.source === 'bgg' && game.bggId) {
    return `bgg_${game.bggId}`;
  }
  // For custom games, use normalized name
  return `custom_${game.name.toLowerCase().trim()}`;
};

/**
 * Helper: Deduplicate games and collect all owners
 * - Uses bggId for BGG games (more precise)
 * - Uses normalized name for custom games
 * - Prioritizes BGG games over custom (more complete data)
 * - Collects all owners of duplicate games
 */
exports.deduplicateGamesWithOwners = (games) => {
  // Map to group games by identifier
  // Structure: { identifier: { bestGame, owners: Set } }
  const gameGroups = new Map();

  for (const game of games) {
    const identifier = this.getGameIdentifier(game);
    const ownerInfo = game.addedBy ? {
      _id: game.addedBy._id?.toString() || game.addedBy.toString(),
      name: game.addedBy.name || 'Usuario',
      email: game.addedBy.email || ''
    } : null;

    if (gameGroups.has(identifier)) {
      const group = gameGroups.get(identifier);
      
      // Add owner if not already in the list
      if (ownerInfo && !group.ownerIds.has(ownerInfo._id)) {
        group.ownerIds.add(ownerInfo._id);
        group.owners.push(ownerInfo);
      }

      // Determine if this game is "better" than the current one
      const currentBest = group.bestGame;
      const shouldReplace = this.shouldReplaceGame(currentBest, game);
      
      if (shouldReplace) {
        group.bestGame = game;
      }
    } else {
      // First game with this identifier
      const ownerIds = new Set();
      const owners = [];
      
      if (ownerInfo) {
        ownerIds.add(ownerInfo._id);
        owners.push(ownerInfo);
      }

      gameGroups.set(identifier, {
        bestGame: game,
        owners,
        ownerIds
      });
    }
  }

  // Build final result with owners included
  const result = [];
  
  for (const [, group] of gameGroups) {
    // Convert game to plain object to add owners
    const gameObj = group.bestGame.toObject ? group.bestGame.toObject() : { ...group.bestGame };
    
    // Add owners array to the game
    gameObj.owners = group.owners;
    
    result.push(gameObj);
  }

  // Sort by creation date (most recent first)
  return result.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
};

/**
 * Helper: Determine if a game should replace another as "best" version
 * Priority: BGG with group > BGG without group > Custom with group > Custom without group
 */
exports.shouldReplaceGame = (current, candidate) => {
  // If candidate is from BGG and current is not, replace
  if (candidate.source === 'bgg' && current.source !== 'bgg') {
    return true;
  }
  
  // If both are from the same source, prefer the one with a group
  if (candidate.source === current.source) {
    if (candidate.group && !current.group) {
      return true;
    }
  }
  
  // If candidate is BGG with group and current is BGG without group
  if (candidate.source === 'bgg' && current.source === 'bgg') {
    if (candidate.group && !current.group) {
      return true;
    }
  }
  
  return false;
};

/**
 * Helper: Remove duplicates by normalized name (legacy - maintain compatibility)
 * @deprecated Use deduplicateGamesWithOwners instead
 */
exports.deduplicateGamesByName = (games) => {
  return this.deduplicateGamesWithOwners(games);
};
