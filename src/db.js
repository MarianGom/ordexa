const mysql = require('mysql2');
require('dotenv').config();

// Detectamos si estamos en la nube (TiDB) o en local
const dbConfig = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT || 3306,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
};

// Solo agregamos SSL si NO estamos en localhost (para que TiDB funcione)
if (process.env.DB_HOST !== 'localhost') {
    dbConfig.ssl = {
        rejectUnauthorized: false
    };
}

const pool = mysql.createPool(dbConfig);

console.log(`🔌 Conectando a la base de datos en: ${process.env.DB_HOST}`);

module.exports = pool.promise();