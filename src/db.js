const mysql = require('mysql2');

// PON AQUÍ TUS DATOS DE TIDB DIRECTAMENTE (entre comillas)
const pool = mysql.createPool({
    host: 'gateway01.us-east-1.prod.aws.tidbcloud.com', // El host largo de TiDB
    user: '3wwDy73L2tkJzyt.root',                                  // Tu usuario de TiDB
    password: 'VCkM5IvLyMvkpoVC',                        // Tu contraseña real
    database: 'ordexa',
    port: 4000,                                          // Puerto 4000
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    ssl: {
        rejectUnauthorized: false
    }
});

console.log("🔌 Conectando DIRECTO a TiDB...");

module.exports = pool.promise();