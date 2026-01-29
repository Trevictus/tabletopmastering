require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const mongoose = require('mongoose');

const testConnection = async () => {
  console.log('🔍 Iniciando prueba de conexión a la base de datos...\n');
  console.log('📋 Configuración:');
  console.log(`   URI: ${process.env.MONGODB_URI}`);
  console.log(`   Timeout: 5 segundos\n`);

  try {
    console.log('⏳ Intentando conectar a MongoDB...');
    
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
    });

    console.log('\n✅ ¡CONEXIÓN EXITOSA!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`🖥️  Host: ${conn.connection.host}`);
    console.log(`📊 Base de datos: ${conn.connection.name}`);
    console.log(`🔌 Puerto: ${conn.connection.port}`);
    console.log(`📡 Estado: ${conn.connection.readyState === 1 ? 'Conectado' : 'Desconocido'}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // Verify existing collections
    console.log('📚 Colecciones en la base de datos:');
    const collections = await conn.connection.db.listCollections().toArray();
    
    if (collections.length === 0) {
      console.log('   ⚠️  No hay colecciones creadas todavía');
    } else {
      collections.forEach((col, index) => {
        console.log(`   ${index + 1}. ${col.name}`);
      });
    }

    // Get database statistics
    console.log('\n📊 Estadísticas de la base de datos:');
    const stats = await conn.connection.db.stats();
    console.log(`   📦 Tamaño de datos: ${(stats.dataSize / 1024).toFixed(2)} KB`);
    console.log(`   🗄️  Tamaño de almacenamiento: ${(stats.storageSize / 1024).toFixed(2)} KB`);
    console.log(`   📄 Número de documentos: ${stats.objects}`);
    console.log(`   📚 Número de colecciones: ${stats.collections}`);

    console.log('\n✅ La base de datos está funcionando correctamente\n');

    // Close the connection
    await mongoose.connection.close();
    console.log('👋 Conexión cerrada correctamente');
    process.exit(0);

  } catch (error) {
    console.error('\n❌ ERROR AL CONECTAR A LA BASE DE DATOS');
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.error(`Tipo de error: ${error.name}`);
    console.error(`Mensaje: ${error.message}`);
    
    if (error.name === 'MongooseServerSelectionError') {
      console.error('\n💡 Posibles soluciones:');
      console.error('   1. Verifica que MongoDB esté corriendo');
      console.error('   2. Comprueba que la URI sea correcta');
      console.error('   3. Verifica que el puerto 27017 esté accesible');
      console.error('   4. Si usas Docker, verifica que el contenedor esté activo');
    }
    
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    process.exit(1);
  }
};

testConnection();
