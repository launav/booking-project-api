const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

// Verificar conexión
pool.connect()
  .then(client => {
    console.log('Conectado a PostgreSQL correctamente');
    client.release();
  })
  .catch(err => {
    console.error('Error al conectar con PostgreSQL:', err.message);
    process.exit(1);
  });

module.exports = pool;