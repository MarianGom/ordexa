const mysql = require("mysql2");
const path = require("path");

require("dotenv").config({
    path: path.resolve(__dirname, "../.env")
});

const requiredEnvVars = [
    "DB_HOST",
    "DB_USER",
    "DB_PASSWORD",
    "DB_NAME"
];

const missingEnvVars = requiredEnvVars.filter(
    (variable) => !process.env[variable]
);

if (missingEnvVars.length > 0) {
    console.error(
        `❌ Faltan variables en el archivo .env: ${missingEnvVars.join(", ")}`
    );

    process.exit(1);
}

const dbConfig = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: Number(process.env.DB_PORT) || 3306,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
};

if (
    process.env.DB_HOST !== "localhost" &&
    process.env.DB_HOST !== "127.0.0.1"
) {
    dbConfig.ssl = {
        rejectUnauthorized: false
    };
}

const pool = mysql.createPool(dbConfig);

pool.getConnection((err, connection) => {
    if (err) {
        console.error("❌ No se pudo conectar con MySQL");
        console.error(`Código: ${err.code || "desconocido"}`);
        console.error(`Detalle: ${err.message}`);
        return;
    }

    console.log(
        `✅ Conexión a MySQL establecida: ${process.env.DB_HOST}:${dbConfig.port}/${process.env.DB_NAME}`
    );

    connection.release();
});

module.exports = pool.promise();