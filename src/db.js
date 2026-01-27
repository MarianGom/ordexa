const mysql = require('mysql2');
require('dotenv').config(); // Carga las variables del archivo .env

// Creamos un "pool" de conexiones, que es más eficiente para servidores web
const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Exportamos la promesa para poder usar async/await
module.exports = pool.promise();