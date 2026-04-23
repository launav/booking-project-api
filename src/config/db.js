const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// Verificar conexión al arrancar
pool.getConnection()
  .then(conn => {
    console.log('Conectado a MySQL correctamente');
    conn.release();
  })
  .catch(err => {
    console.error('Error al conectar con MySQL:', err.message);
    process.exit(1);
  });

module.exports = pool;
