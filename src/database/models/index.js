'use strict';

const fs = require('fs');
const path = require('path');
const Sequelize = require('sequelize');
const process = require('process');
const basename = path.basename(__filename);
const db = {};

let sequelize;

// --- AQUÍ ESTÁ EL CAMBIO MÁGICO ---
// En lugar de leer configs extrañas, nos conectamos directo a TiDB
console.log("🚀 Intentando conectar Sequelize a TiDB Cloud...");

sequelize = new Sequelize('ordexa', '3wwDy73L2tkJzyt.root', 'VCkM5IvLyMvkpoVC', {
    host: 'gateway01.us-east-1.prod.aws.tidbcloud.com',
    dialect: 'mysql',
    port: 4000, 
    logging: false,
    dialectOptions: {
        ssl: {
            rejectUnauthorized: false // ¡ESTO ES LO QUE FALTABA!
        }
    }
});
// ----------------------------------

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