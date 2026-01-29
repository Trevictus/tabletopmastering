/**
 * BGG Service Mock for tests and development
 * This service simulates BoardGameGeek responses without making real API calls
 * 
 * @description Provides static test data for local development when
 * USE_BGG_MOCK=true environment variable is active
 * @version 3.0.0
 * @author TableTopMastering Team
 */

const { createLogger } = require('../utils/logger');
const logger = createLogger('BGGMock');

/**
 * Official game image configuration
 * Stable URLs from public CDNs (BoardGameAtlas S3, Wikimedia, etc.)
 */
const GAME_IMAGES = Object.freeze({
  // Catan - Portada oficial del juego
  13: {
    image: 'https://s3-us-west-1.amazonaws.com/5cc.images/games/uploaded/1629324722072.jpg',
    thumbnail: 'https://s3-us-west-1.amazonaws.com/5cc.images/games/uploaded/1629324722072.jpg',
  },
  // Gloomhaven - Portada oficial
  174430: {
    image: 'https://s3-us-west-1.amazonaws.com/5cc.images/games/uploaded/1559254920151-51ulRXlJ7LL.jpg',
    thumbnail: 'https://s3-us-west-1.amazonaws.com/5cc.images/games/uploaded/1559254920151-51ulRXlJ7LL.jpg',
  },
  // Terraforming Mars - Portada oficial
  167791: {
    image: 'https://s3-us-west-1.amazonaws.com/5cc.images/games/uploaded/1629324032557.jpg',
    thumbnail: 'https://s3-us-west-1.amazonaws.com/5cc.images/games/uploaded/1629324032557.jpg',
  },
  // Wingspan - Portada oficial
  266192: {
    image: 'https://s3-us-west-1.amazonaws.com/5cc.images/games/uploaded/1629325193747.png',
    thumbnail: 'https://s3-us-west-1.amazonaws.com/5cc.images/games/uploaded/1629325193747.png',
  },
  // Scythe - Imagen de gameplay de Wikipedia
  169786: {
    image: 'https://upload.wikimedia.org/wikipedia/en/9/96/Scythe-gameplay.jpg',
    thumbnail: 'https://upload.wikimedia.org/wikipedia/en/9/96/Scythe-gameplay.jpg',
  },
  // 7 Wonders Duel - Portada oficial
  173346: {
    image: 'https://s3-us-west-1.amazonaws.com/5cc.images/games/uploaded/1629323024736.jpg',
    thumbnail: 'https://s3-us-west-1.amazonaws.com/5cc.images/games/uploaded/1629323024736.jpg',
  },
  // Pandemic Legacy Season 1 - Portada oficial
  161936: {
    image: 'https://s3-us-west-1.amazonaws.com/5cc.images/games/uploaded/1559257833516-612BUfjuA7fL.jpg',
    thumbnail: 'https://s3-us-west-1.amazonaws.com/5cc.images/games/uploaded/1559257833516-612BUfjuA7fL.jpg',
  },
  // Twilight Struggle - Imagen de gameplay de Wikipedia
  12333: {
    image: 'https://upload.wikimedia.org/wikipedia/commons/6/6b/Twilight_struggle_example.jpg',
    thumbnail: 'https://upload.wikimedia.org/wikipedia/commons/6/6b/Twilight_struggle_example.jpg',
  },
  // Gaia Project - Placeholder con nombre del juego
  220308: {
    image: 'https://dummyimage.com/400x400/1a237e/ffffff.png&text=Gaia+Project',
    thumbnail: 'https://dummyimage.com/200x200/1a237e/ffffff.png&text=Gaia+Project',
  },
  // The Castles of Burgundy - Portada oficial
  84876: {
    image: 'https://s3-us-west-1.amazonaws.com/5cc.images/games/uploaded/1559254202422-51mP2aJfyxL.jpg',
    thumbnail: 'https://s3-us-west-1.amazonaws.com/5cc.images/games/uploaded/1559254202422-51mP2aJfyxL.jpg',
  },
  // Clank! - Placeholder con nombre del juego
  233078: {
    image: 'https://dummyimage.com/400x400/4a148c/ffffff.png&text=Clank!',
    thumbnail: 'https://dummyimage.com/200x200/4a148c/ffffff.png&text=Clank!',
  },
  // Azul - Portada oficial
  230802: {
    image: 'https://s3-us-west-1.amazonaws.com/5cc.images/games/uploaded/1559254200327-61EFZADvURL.jpg',
    thumbnail: 'https://s3-us-west-1.amazonaws.com/5cc.images/games/uploaded/1559254200327-61EFZADvURL.jpg',
  },
  // Root - Diagrama de tablero de Wikipedia
  237182: {
    image: 'https://upload.wikimedia.org/wikipedia/commons/0/0a/Root_board_game_graph.svg',
    thumbnail: 'https://upload.wikimedia.org/wikipedia/commons/0/0a/Root_board_game_graph.svg',
  },
  // Spirit Island - Portada oficial
  162886: {
    image: 'https://s3-us-west-1.amazonaws.com/5cc.images/games/uploaded/1559254941010-61PJxjjnbfL.jpg',
    thumbnail: 'https://s3-us-west-1.amazonaws.com/5cc.images/games/uploaded/1559254941010-61PJxjjnbfL.jpg',
  },
  // Everdell - Placeholder con nombre del juego
  199792: {
    image: 'https://dummyimage.com/400x400/1b5e20/ffffff.png&text=Everdell',
    thumbnail: 'https://dummyimage.com/200x200/1b5e20/ffffff.png&text=Everdell',
  },
  // Default - Imagen genérica de juego de mesa
  default: {
    image: 'https://s3-us-west-1.amazonaws.com/5cc.images/games/uploaded/1629324722072.jpg',
    thumbnail: 'https://s3-us-west-1.amazonaws.com/5cc.images/games/uploaded/1629324722072.jpg',
  },
});

/**
 * Servicio Mock de BoardGameGeek
 */
class MockBGGService {
  #mockGames;
  #hotList;

  constructor() {
    this.#initializeMockGames();
    this.#initializeHotList();
  }

  #initializeMockGames() {
    this.#mockGames = new Map([
      [13, {
        bggId: 13,
        name: 'Catan',
        description: 'In Catan, players try to be the dominant force on the island of Catan by building settlements, cities, and roads.',
        ...GAME_IMAGES[13],
        yearPublished: 1995,
        minPlayers: 3,
        maxPlayers: 4,
        playingTime: 120,
        minPlayTime: 60,
        maxPlayTime: 120,
        minAge: 10,
        categories: ['Negotiation', 'Economic', 'Dice'],
        mechanics: ['Dice Rolling', 'Hand Management', 'Hexagon Grid', 'Network and Route Building', 'Trading'],
        designer: ['Klaus Teuber'],
        publisher: ['KOSMOS', 'Catan Studio'],
        rating: { average: 7.2, usersRated: 115000, bayesAverage: 7.1 },
        weight: 2.3,
        source: 'bgg',
        bggLastSync: new Date(),
      }],
      [174430, {
        bggId: 174430,
        name: 'Gloomhaven',
        description: 'Gloomhaven is a game of Euro-inspired tactical combat in a persistent world of shifting motives.',
        ...GAME_IMAGES[174430],
        yearPublished: 2017,
        minPlayers: 1,
        maxPlayers: 4,
        playingTime: 120,
        minPlayTime: 60,
        maxPlayTime: 150,
        minAge: 14,
        categories: ['Adventure', 'Exploration', 'Fantasy', 'Fighting', 'Miniatures'],
        mechanics: ['Campaign / Battle Card Driven', 'Cooperative Game', 'Grid Movement', 'Hand Management'],
        designer: ['Isaac Childres'],
        publisher: ['Cephalofair Games'],
        rating: { average: 8.6, usersRated: 85000, bayesAverage: 8.4 },
        weight: 3.9,
        source: 'bgg',
        bggLastSync: new Date(),
      }],
      [167791, {
        bggId: 167791,
        name: 'Terraforming Mars',
        description: 'In the 2400s, mankind begins to terraform the planet Mars with giant corporations.',
        ...GAME_IMAGES[167791],
        yearPublished: 2016,
        minPlayers: 1,
        maxPlayers: 5,
        playingTime: 120,
        minPlayTime: 90,
        maxPlayTime: 150,
        minAge: 12,
        categories: ['Economic', 'Science Fiction', 'Territory Building'],
        mechanics: ['Card Drafting', 'Hand Management', 'Tile Placement', 'Variable Player Powers'],
        designer: ['Jacob Fryxelius'],
        publisher: ['FryxGames', 'Stronghold Games'],
        rating: { average: 8.4, usersRated: 95000, bayesAverage: 8.2 },
        weight: 3.2,
        source: 'bgg',
        bggLastSync: new Date(),
      }],
      [266192, {
        bggId: 266192,
        name: 'Wingspan',
        description: 'Wingspan is a competitive, medium-weight, card-driven, engine-building board game about birds.',
        ...GAME_IMAGES[266192],
        yearPublished: 2019,
        minPlayers: 1,
        maxPlayers: 5,
        playingTime: 70,
        minPlayTime: 40,
        maxPlayTime: 70,
        minAge: 10,
        categories: ['Animals', 'Card Game', 'Educational'],
        mechanics: ['Card Drafting', 'Dice Rolling', 'Engine Building', 'Hand Management'],
        designer: ['Elizabeth Hargrave'],
        publisher: ['Stonemaier Games'],
        rating: { average: 8.1, usersRated: 110000, bayesAverage: 7.9 },
        weight: 2.4,
        source: 'bgg',
        bggLastSync: new Date(),
      }],
      [169786, {
        bggId: 169786,
        name: 'Scythe',
        description: 'It is a time of unrest in 1920s Europa. Lead your faction to victory with mechs and workers.',
        ...GAME_IMAGES[169786],
        yearPublished: 2016,
        minPlayers: 1,
        maxPlayers: 5,
        playingTime: 115,
        minPlayTime: 90,
        maxPlayTime: 140,
        minAge: 14,
        categories: ['Economic', 'Fighting', 'Science Fiction', 'Territory Building'],
        mechanics: ['Area Control', 'Grid Movement', 'Engine Building', 'Variable Player Powers'],
        designer: ['Jamey Stegmaier'],
        publisher: ['Stonemaier Games'],
        rating: { average: 8.2, usersRated: 98000, bayesAverage: 8.0 },
        weight: 3.4,
        source: 'bgg',
        bggLastSync: new Date(),
      }],
      [173346, {
        bggId: 173346,
        name: '7 Wonders Duel',
        description: 'Create the greatest civilization the Ancient World has ever known in this 2-player version of 7 Wonders.',
        ...GAME_IMAGES[173346],
        yearPublished: 2015,
        minPlayers: 2,
        maxPlayers: 2,
        playingTime: 30,
        minPlayTime: 30,
        maxPlayTime: 45,
        minAge: 10,
        categories: ['Ancient', 'Card Game', 'City Building', 'Civilization'],
        mechanics: ['Card Drafting', 'Set Collection', 'Tug of War'],
        designer: ['Antoine Bauza', 'Bruno Cathala'],
        publisher: ['Repos Production', 'Asmodee'],
        rating: { average: 8.1, usersRated: 82000, bayesAverage: 7.9 },
        weight: 2.2,
        source: 'bgg',
        bggLastSync: new Date(),
      }],
      [161936, {
        bggId: 161936,
        name: 'Pandemic Legacy: Season 1',
        description: 'Pandemic Legacy is a co-operative campaign game with an overarching story-arc played through 12-24 sessions.',
        ...GAME_IMAGES[161936],
        yearPublished: 2015,
        minPlayers: 2,
        maxPlayers: 4,
        playingTime: 60,
        minPlayTime: 60,
        maxPlayTime: 75,
        minAge: 13,
        categories: ['Environmental', 'Medical'],
        mechanics: ['Action Points', 'Campaign / Battle Card Driven', 'Cooperative Game', 'Hand Management'],
        designer: ['Rob Daviau', 'Matt Leacock'],
        publisher: ['Z-Man Games', 'Asmodee'],
        rating: { average: 8.5, usersRated: 72000, bayesAverage: 8.3 },
        weight: 2.8,
        source: 'bgg',
        bggLastSync: new Date(),
      }],
      [12333, {
        bggId: 12333,
        name: 'Twilight Struggle',
        description: 'Twilight Struggle simulates the Cold War era from 1945-1989 between the Soviet Union and the United States.',
        ...GAME_IMAGES[12333],
        yearPublished: 2005,
        minPlayers: 2,
        maxPlayers: 2,
        playingTime: 180,
        minPlayTime: 120,
        maxPlayTime: 180,
        minAge: 13,
        categories: ['Political', 'Wargame', 'Modern Warfare'],
        mechanics: ['Area Control', 'Campaign / Battle Card Driven', 'Hand Management'],
        designer: ['Ananda Gupta', 'Jason Matthews'],
        publisher: ['GMT Games'],
        rating: { average: 8.2, usersRated: 52000, bayesAverage: 8.0 },
        weight: 3.6,
        source: 'bgg',
        bggLastSync: new Date(),
      }],
      [220308, {
        bggId: 220308,
        name: 'Gaia Project',
        description: 'Gaia Project is Terra Mystica in space. Control one of 14 unique factions as they spread across the galaxy.',
        ...GAME_IMAGES[220308],
        yearPublished: 2017,
        minPlayers: 1,
        maxPlayers: 4,
        playingTime: 150,
        minPlayTime: 60,
        maxPlayTime: 150,
        minAge: 14,
        categories: ['Economic', 'Science Fiction', 'Space Exploration'],
        mechanics: ['Income', 'Modular Board', 'Network Building', 'Variable Player Powers'],
        designer: ['Jens Drögemüller', 'Helge Ostertag'],
        publisher: ['Z-Man Games', 'Feuerland Spiele'],
        rating: { average: 8.5, usersRated: 42000, bayesAverage: 8.2 },
        weight: 4.3,
        source: 'bgg',
        bggLastSync: new Date(),
      }],
      [84876, {
        bggId: 84876,
        name: 'The Castles of Burgundy',
        description: 'Set in the Burgundy region of High Medieval France, players build settlements and powerful castles.',
        ...GAME_IMAGES[84876],
        yearPublished: 2011,
        minPlayers: 2,
        maxPlayers: 4,
        playingTime: 90,
        minPlayTime: 30,
        maxPlayTime: 90,
        minAge: 12,
        categories: ['Dice', 'Medieval', 'Territory Building'],
        mechanics: ['Dice Rolling', 'Hexagon Grid', 'Set Collection', 'Tile Placement'],
        designer: ['Stefan Feld'],
        publisher: ['alea', 'Ravensburger'],
        rating: { average: 8.1, usersRated: 65000, bayesAverage: 7.9 },
        weight: 3.0,
        source: 'bgg',
        bggLastSync: new Date(),
      }],
      [233078, {
        bggId: 233078,
        name: 'Clank!: A Deck-Building Adventure',
        description: 'Burgle your way to adventure! Sneak into an angry dragon\'s mountain lair to steal precious artifacts.',
        ...GAME_IMAGES[233078],
        yearPublished: 2016,
        minPlayers: 2,
        maxPlayers: 4,
        playingTime: 60,
        minPlayTime: 30,
        maxPlayTime: 60,
        minAge: 12,
        categories: ['Adventure', 'Fantasy', 'Fighting'],
        mechanics: ['Deck Building', 'Point to Point Movement', 'Push Your Luck'],
        designer: ['Paul Dennen'],
        publisher: ['Renegade Game Studios', 'Dire Wolf'],
        rating: { average: 7.8, usersRated: 48000, bayesAverage: 7.6 },
        weight: 2.2,
        source: 'bgg',
        bggLastSync: new Date(),
      }],
      [230802, {
        bggId: 230802,
        name: 'Azul',
        description: 'Draft colored tiles to decorate the walls of the Royal Palace of Evora.',
        ...GAME_IMAGES[230802],
        yearPublished: 2017,
        minPlayers: 2,
        maxPlayers: 4,
        playingTime: 45,
        minPlayTime: 30,
        maxPlayTime: 45,
        minAge: 8,
        categories: ['Abstract Strategy', 'Puzzle', 'Renaissance'],
        mechanics: ['Open Drafting', 'Pattern Building', 'Set Collection', 'Tile Placement'],
        designer: ['Michael Kiesling'],
        publisher: ['Plan B Games', 'Next Move Games'],
        rating: { average: 7.8, usersRated: 95000, bayesAverage: 7.7 },
        weight: 1.8,
        source: 'bgg',
        bggLastSync: new Date(),
      }],
      [237182, {
        bggId: 237182,
        name: 'Root',
        description: 'Root is a game of adventure and war where 2 to 4 players battle for control of a vast wilderness.',
        ...GAME_IMAGES[237182],
        yearPublished: 2018,
        minPlayers: 2,
        maxPlayers: 4,
        playingTime: 90,
        minPlayTime: 60,
        maxPlayTime: 90,
        minAge: 10,
        categories: ['Animals', 'Fantasy', 'Wargame'],
        mechanics: ['Area Control', 'Dice Rolling', 'Hand Management', 'Variable Player Powers'],
        designer: ['Cole Wehrle'],
        publisher: ['Leder Games'],
        rating: { average: 8.1, usersRated: 52000, bayesAverage: 7.9 },
        weight: 3.7,
        source: 'bgg',
        bggLastSync: new Date(),
      }],
      [162886, {
        bggId: 162886,
        name: 'Spirit Island',
        description: 'In Spirit Island, players are different spirits of the land defending their island from colonizing Invaders.',
        ...GAME_IMAGES[162886],
        yearPublished: 2017,
        minPlayers: 1,
        maxPlayers: 4,
        playingTime: 120,
        minPlayTime: 90,
        maxPlayTime: 120,
        minAge: 13,
        categories: ['Fantasy', 'Fighting', 'Mythology', 'Territory Building'],
        mechanics: ['Area Control', 'Cooperative Game', 'Hand Management', 'Variable Player Powers'],
        designer: ['R. Eric Reuss'],
        publisher: ['Greater Than Games'],
        rating: { average: 8.3, usersRated: 52000, bayesAverage: 8.1 },
        weight: 4.0,
        source: 'bgg',
        bggLastSync: new Date(),
      }],
      [199792, {
        bggId: 199792,
        name: 'Everdell',
        description: 'Within the charming valley of Everdell, a civilization of forest critters is thriving and expanding.',
        ...GAME_IMAGES[199792],
        yearPublished: 2018,
        minPlayers: 1,
        maxPlayers: 4,
        playingTime: 80,
        minPlayTime: 40,
        maxPlayTime: 80,
        minAge: 13,
        categories: ['Animals', 'Card Game', 'City Building', 'Fantasy'],
        mechanics: ['Card Drafting', 'Hand Management', 'Set Collection', 'Worker Placement'],
        designer: ['James A. Wilson'],
        publisher: ['Starling Games'],
        rating: { average: 7.9, usersRated: 55000, bayesAverage: 7.7 },
        weight: 2.8,
        source: 'bgg',
        bggLastSync: new Date(),
      }],
      ['default', {
        bggId: 0,
        name: 'Mock Board Game',
        description: 'This is a mock board game for testing purposes.',
        ...GAME_IMAGES.default,
        yearPublished: 2024,
        minPlayers: 2,
        maxPlayers: 4,
        playingTime: 60,
        minPlayTime: 30,
        maxPlayTime: 90,
        minAge: 10,
        categories: ['Strategy', 'Family'],
        mechanics: ['Hand Management', 'Set Collection'],
        designer: ['Mock Designer'],
        publisher: ['Mock Publisher'],
        rating: { average: 7.0, usersRated: 1000, bayesAverage: 6.8 },
        weight: 2.5,
        source: 'bgg',
        bggLastSync: new Date(),
      }],
    ]);
  }

  #initializeHotList() {
    this.#hotList = Object.freeze([
      { bggId: 174430, rank: 1, name: 'Gloomhaven', yearPublished: 2017, thumbnail: GAME_IMAGES[174430].thumbnail },
      { bggId: 161936, rank: 2, name: 'Pandemic Legacy: Season 1', yearPublished: 2015, thumbnail: GAME_IMAGES[161936].thumbnail },
      { bggId: 167791, rank: 3, name: 'Terraforming Mars', yearPublished: 2016, thumbnail: GAME_IMAGES[167791].thumbnail },
      { bggId: 169786, rank: 4, name: 'Scythe', yearPublished: 2016, thumbnail: GAME_IMAGES[169786].thumbnail },
      { bggId: 220308, rank: 5, name: 'Gaia Project', yearPublished: 2017, thumbnail: GAME_IMAGES[220308].thumbnail },
      { bggId: 12333, rank: 6, name: 'Twilight Struggle', yearPublished: 2005, thumbnail: GAME_IMAGES[12333].thumbnail },
      { bggId: 162886, rank: 7, name: 'Spirit Island', yearPublished: 2017, thumbnail: GAME_IMAGES[162886].thumbnail },
      { bggId: 266192, rank: 8, name: 'Wingspan', yearPublished: 2019, thumbnail: GAME_IMAGES[266192].thumbnail },
      { bggId: 173346, rank: 9, name: '7 Wonders Duel', yearPublished: 2015, thumbnail: GAME_IMAGES[173346].thumbnail },
      { bggId: 84876, rank: 10, name: 'The Castles of Burgundy', yearPublished: 2011, thumbnail: GAME_IMAGES[84876].thumbnail },
      { bggId: 237182, rank: 11, name: 'Root', yearPublished: 2018, thumbnail: GAME_IMAGES[237182].thumbnail },
      { bggId: 230802, rank: 12, name: 'Azul', yearPublished: 2017, thumbnail: GAME_IMAGES[230802].thumbnail },
      { bggId: 199792, rank: 13, name: 'Everdell', yearPublished: 2018, thumbnail: GAME_IMAGES[199792].thumbnail },
      { bggId: 233078, rank: 14, name: 'Clank!', yearPublished: 2016, thumbnail: GAME_IMAGES[233078].thumbnail },
      { bggId: 13, rank: 15, name: 'Catan', yearPublished: 1995, thumbnail: GAME_IMAGES[13].thumbnail },
    ]);
  }

  #getGame(bggId) {
    return this.#mockGames.get(Number(bggId)) ?? this.#mockGames.get(bggId);
  }

  async searchGames(query, exact = false) {
    logger.debug(`Searching for: "${query}", exact: ${exact}`);
    await this.#sleep(150);

    const searchTerm = query.toLowerCase();
    const results = [];

    for (const [id, game] of this.#mockGames) {
      if (id === 'default') continue;
      
      const gameName = game.name.toLowerCase();
      const isMatch = exact ? gameName === searchTerm : gameName.includes(searchTerm);
      
      if (isMatch) {
        results.push({
          bggId: game.bggId,
          name: game.name,
          yearPublished: game.yearPublished,
          image: game.image,
          thumbnail: game.thumbnail,
        });
      }
    }

    if (results.length === 0 && !exact) {
      const defaultGame = this.#mockGames.get('default');
      results.push({
        bggId: 999999,
        name: `${query} (Mock Result)`,
        yearPublished: 2024,
        image: defaultGame.image,
        thumbnail: defaultGame.thumbnail,
      });
    }

    logger.debug(`Found ${results.length} result(s)`);
    return results;
  }

  async getGameDetails(bggId) {
    logger.debug(`Getting details for bggId: ${bggId}`);
    await this.#sleep(100);

    const game = this.#getGame(bggId);
    if (game) return { ...game };

    if (bggId > 500000) throw new Error('Juego no encontrado en BGG');

    const defaultGame = this.#mockGames.get('default');
    return { ...defaultGame, bggId: Number(bggId), name: `Mock Game ${bggId}` };
  }

  async getHotGames(limit = 10) {
    logger.debug(`Getting hot games, limit: ${limit}`);
    await this.#sleep(100);
    return this.#hotList.slice(0, Math.min(limit, this.#hotList.length));
  }

  async validateBGGId(bggId) {
    try {
      await this.getGameDetails(bggId);
      return true;
    } catch {
      return false;
    }
  }

  async getCacheStats() {
    const BGGCache = require('../models/BGGCache');
    return BGGCache.getCacheStats();
  }

  async invalidateCache(bggId) {
    const BGGCache = require('../models/BGGCache');
    return BGGCache.invalidateCache(bggId);
  }

  async clearCache() {
    const BGGCache = require('../models/BGGCache');
    return BGGCache.clearCache();
  }

  #sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

module.exports = new MockBGGService();
