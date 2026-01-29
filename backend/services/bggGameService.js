/**
 * @fileoverview BGG Game Service
 * @description BoardGameGeek API integration for game search and import
 * @module services/bggGameService
 * @requires ../models/Game
 * @requires ../models/Group
 * @requires ./bggService
 */

const Game = require('../models/Game');
const Group = require('../models/Group');
const bggService = require('./bggService');

/**
 * Validate and get group access for BGG operations (optimized)
 */
exports.validateGroupAccess = async (groupId, userId) => {
  if (!groupId) {
    return null;
  }

  const group = await Group.findById(groupId)
    .select('admin members.user')
    .lean();
    
  if (!group) {
    throw { status: 404, message: 'Grupo no encontrado' };
  }

  const isAdmin = group.admin.toString() === userId.toString();
  const isMember = group.members.some(
    member => member.user.toString() === userId.toString()
  );

  if (!isAdmin && !isMember) {
    throw { status: 403, message: 'No eres miembro de este grupo' };
  }

  return group;
};

/**
 * Search games in BoardGameGeek (without saving)
 */
exports.searchBGGGames = async (name, exact = false) => {
  if (!name) {
    throw new Error('El parámetro "name" es obligatorio');
  }

  const results = await bggService.searchGames(name, exact);

  return results;
};

/**
 * Get BGG game details by ID
 */
exports.getBGGGameDetails = async (bggId) => {
  if (!bggId || isNaN(bggId)) {
    throw new Error('ID de BGG inválido');
  }

  const gameDetails = await bggService.getGameDetails(parseInt(bggId));

  return gameDetails;
};

/**
 * Add a game from BGG (optimized)
 */
exports.addBGGGame = async (bggId, userId, groupId = null, customNotes = '') => {
  // Validations
  if (!bggId) {
    throw new Error('El ID de BGG es obligatorio');
  }

  // Verify group exists and user is member or admin (if provided)
  if (groupId) {
    const group = await Group.findById(groupId)
      .select('admin members.user')
      .lean();
      
    if (!group) {
      throw { status: 404, message: 'Grupo no encontrado' };
    }

    const isAdmin = group.admin.toString() === userId.toString();
    const isMember = group.members.some(
      member => member.user.toString() === userId.toString()
    );

    if (!isAdmin && !isMember) {
      throw { status: 403, message: 'No eres miembro de este grupo' };
    }

    // Check if game already exists in group (optimized with exists)
    const existingGame = await Game.findOne({ 
      bggId: bggId, 
      group: groupId,
      isActive: true 
    })
      .select('_id name')
      .lean();

    if (existingGame) {
      throw { 
        status: 400, 
        message: 'Este juego ya está en la colección del grupo',
        data: existingGame,
      };
    }
  } else {
    // If no group, check if user already has this game personally
    const existingGame = await Game.findOne({ 
      bggId: bggId, 
      addedBy: userId,
      group: null,
      isActive: true 
    })
      .select('_id name')
      .lean();

    if (existingGame) {
      throw { 
        status: 400, 
        message: 'Ya tienes este juego en tu colección personal',
        data: existingGame,
      };
    }
  }

  // Get game details from BGG
  const bggData = await bggService.getGameDetails(parseInt(bggId));

  // Create game in database
  const game = await Game.create({
    ...bggData,
    group: groupId || null,
    addedBy: userId,
    customNotes: customNotes || '',
    isActive: true,
  });

  // Verify game was saved and return with minimal populate
  const savedGame = await Game.findById(game._id)
    .select('name image thumbnail minPlayers maxPlayers playingTime categories rating source bggId addedBy group createdAt')
    .populate('addedBy', 'name -_id')
    .populate('group', 'name -_id')
    .lean();

  if (!savedGame) {
    throw new Error('Error al guardar el juego en la base de datos');
  }

  return savedGame;
};

/**
 * Sync BGG game (update data) - optimized
 */
exports.syncBGGGame = async (gameId, userId) => {
  const game = await Game.findOne({ _id: gameId, isActive: true })
    .select('source bggId group');

  if (!game) {
    throw { status: 404, message: 'Juego no encontrado' };
  }

  if (game.source !== 'bgg') {
    throw new Error('Este endpoint solo funciona con juegos de BGG');
  }

  // Verify permissions if has group
  if (game.group) {
    const group = await Group.findById(game.group)
      .select('admin members.user')
      .lean();
      
    const isAdmin = group.admin.toString() === userId.toString();
    const isMember = group.members.some(
      m => m.user.toString() === userId.toString()
    );

    if (!isAdmin && !isMember) {
      throw { 
        status: 403, 
        message: 'No tienes permisos para sincronizar este juego' 
      };
    }
  }

  // Get updated data from BGG
  const bggData = await bggService.getGameDetails(game.bggId);

  // Use findByIdAndUpdate for atomic and efficient update
  const updatedGame = await Game.findByIdAndUpdate(
    gameId,
    {
      $set: {
        name: bggData.name,
        description: bggData.description,
        image: bggData.image,
        thumbnail: bggData.thumbnail,
        yearPublished: bggData.yearPublished,
        minPlayers: bggData.minPlayers,
        maxPlayers: bggData.maxPlayers,
        playingTime: bggData.playingTime,
        minPlayTime: bggData.minPlayTime,
        maxPlayTime: bggData.maxPlayTime,
        categories: bggData.categories,
        mechanics: bggData.mechanics,
        designer: bggData.designer,
        publisher: bggData.publisher,
        rating: bggData.rating,
        bggLastSync: new Date(),
      }
    },
    { new: true }
  )
    .populate('addedBy', 'name -_id')
    .populate('group', 'name -_id')
    .lean();

  if (!updatedGame) {
    throw new Error('Error al sincronizar el juego con BGG');
  }

  return updatedGame;
};

/**
 * Get popular BGG games
 */
exports.getHotGames = async (limit = 10) => {
  const hotGames = await bggService.getHotGames(parseInt(limit));

  return hotGames;
};
