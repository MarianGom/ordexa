const mysql = require('mysql2');
require('dotenv').config();

// Creamos el pool con la configuración extra para la nube
const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    // --- ESTO ES LO QUE TE FALTABA PARA TIDB ---
    ssl: {
        rejectUnauthorized: false
    }
    // -------------------------------------------
});

// Un pequeño chivato para ver en los logs si está leyendo las variables
console.log("🔌 Intentando conectar a la BD en:", process.env.DB_HOST || "LOCALHOST (Error: variable vacía)");

module.exports = pool.promise();