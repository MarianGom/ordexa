'use strict';

const fs = require('fs');
const path = require('path');
const Sequelize = require('sequelize');
const process = require('process');
const basename = path.basename(__filename);

const db = {};
let sequelize;

// CONFIGURACIÓN CORRECTA Y SEGURA
sequelize = new Sequelize(
    process.env.DB_NAME,      // Base de datos
    process.env.DB_USER,      // Usuario
    process.env.DB_PASSWORD,  // Contraseña
    {
        host: process.env.DB_HOST,
        port: process.env.DB_PORT || 3306,
        dialect: 'mysql',
        logging: false,
        dialectOptions: {
            // Activa SSL solo si estamos en Producción (TiDB)
            ssl: process.env.DB_HOST !== 'localhost' ? {
                rejectUnauthorized: false
            } : undefined
        }
    }
);

fs
  .readdirSync(__dirname)
  .filter(file => {
    return (
      file.indexOf('.') !== 0 &&
      file !== basename &&
      file.slice(-3) === '.js' &&
      file.indexOf('.test.js') === -1
    );
  })
  .forEach(file => {
    const model = require(path.join(__dirname, file))(sequelize, Sequelize.DataTypes);
    db[model.name] = model;
  });

Object.keys(db).forEach(modelName => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;