/**
 * Script de benchmark para medir rendimiento de consultas MongoDB
 * Ejecutar con: node scripts/benchmark-queries.js
 */

const mongoose = require('mongoose');
require('dotenv').config();

const User = require('../models/User');
const Group = require('../models/Group');
const Game = require('../models/Game');
const Match = require('../models/Match');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/tabletopmastering';

/**
 * Measure execution time of an async function
 */
async function measureTime(name, fn, iterations = 10) {
  const times = [];
  
  for (let i = 0; i < iterations; i++) {
    const start = process.hrtime.bigint();
    await fn();
    const end = process.hrtime.bigint();
    times.push(Number(end - start) / 1_000_000); // Convert to ms
  }
  
  const avg = times.reduce((a, b) => a + b, 0) / times.length;
  const min = Math.min(...times);
  const max = Math.max(...times);
  
  return { name, avg: avg.toFixed(2), min: min.toFixed(2), max: max.toFixed(2) };
}

async function runBenchmarks() {
  try {
    console.log('🔌 Conectando a MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Conectado a MongoDB\n');

    console.log('🚀 BENCHMARK DE CONSULTAS MONGODB\n');
    console.log('='.repeat(70));
    console.log('Cada consulta se ejecuta 10 veces para obtener promedios\n');

    const results = [];

    // Benchmark: Buscar usuario por email
    results.push(await measureTime(
      'User.findOne({ email }).select().lean()',
      async () => {
        await User.findOne({ email: 'test@example.com' })
          .select('name email avatar')
          .lean();
      }
    ));

    // Benchmark: Ranking global
    results.push(await measureTime(
      'User.find({ isActive }).sort().lean()',
      async () => {
        await User.find({ isActive: true })
          .select('name avatar stats')
          .sort({ 'stats.totalPoints': -1 })
          .limit(100)
          .lean();
      }
    ));

    // Benchmark: Grupos de un usuario
    results.push(await measureTime(
      'Group.find({ "members.user" }).lean()',
      async () => {
        const sampleUser = await User.findOne().select('_id').lean();
        if (sampleUser) {
          await Group.find({ 'members.user': sampleUser._id, isActive: true })
            .select('name avatar stats')
            .lean();
        }
      }
    ));

    // Benchmark: Partidas de un grupo
    results.push(await measureTime(
      'Match.find({ group }).populate().lean()',
      async () => {
        const sampleGroup = await Group.findOne().select('_id').lean();
        if (sampleGroup) {
          await Match.find({ group: sampleGroup._id })
            .select('game scheduledDate status players')
            .populate('game', 'name image')
            .sort({ scheduledDate: -1 })
            .limit(20)
            .lean();
        }
      }
    ));

    // Benchmark: Juegos de un grupo
    results.push(await measureTime(
      'Game.find({ group, isActive }).lean()',
      async () => {
        const sampleGroup = await Group.findOne().select('_id').lean();
        if (sampleGroup) {
          await Game.find({ group: sampleGroup._id, isActive: true })
            .select('name image minPlayers maxPlayers source')
            .sort({ createdAt: -1 })
            .limit(20)
            .lean();
        }
      }
    ));

    // Benchmark: Búsqueda de juego por bggId
    results.push(await measureTime(
      'Game.findOne({ bggId }).lean()',
      async () => {
        await Game.findOne({ bggId: 174430, isActive: true })
          .select('name bggId')
          .lean();
      }
    ));

    // Benchmark: Conteo de partidas
    results.push(await measureTime(
      'Match.countDocuments({ status })',
      async () => {
        await Match.countDocuments({ status: 'programada' });
      }
    ));

    // Benchmark: Agregación de estadísticas
    results.push(await measureTime(
      'Game.aggregate($facet)',
      async () => {
        const sampleGroup = await Group.findOne().select('_id').lean();
        if (sampleGroup) {
          await Game.aggregate([
            { $match: { group: sampleGroup._id, isActive: true } },
            {
              $facet: {
                totals: [{ $group: { _id: '$source', count: { $sum: 1 } } }],
                topRated: [
                  { $sort: { 'rating.average': -1 } },
                  { $limit: 5 },
                  { $project: { name: 1, 'rating.average': 1 } }
                ]
              }
            }
          ]);
        }
      }
    ));

    // Imprimir resultados
    console.log('\n📊 RESULTADOS (tiempos en milisegundos)\n');
    console.log('-'.repeat(70));
    console.log('| Query'.padEnd(50) + '| Avg'.padEnd(10) + '| Min'.padEnd(10) + '| Max   |');
    console.log('-'.repeat(70));
    
    results.forEach(r => {
      const query = r.name.length > 47 ? r.name.substring(0, 44) + '...' : r.name;
      console.log(
        `| ${query.padEnd(48)}| ${r.avg.padStart(6)}ms | ${r.min.padStart(6)}ms | ${r.max.padStart(6)}ms |`
      );
    });
    
    console.log('-'.repeat(70));

    console.log('\n💡 RECOMENDACIONES:\n');
    console.log('• Consultas > 50ms: Revisar índices y filtros');
    console.log('• Consultas > 100ms: Considerar caché o paginación');
    console.log('• Usar .lean() cuando no se necesite modificar documentos');
    console.log('• Limitar campos con .select() para reducir transferencia');
    console.log('• Usar Promise.all() para consultas paralelas independientes');

    console.log('\n✅ Benchmark completado\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Desconectado de MongoDB');
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  runBenchmarks();
}

module.exports = runBenchmarks;
