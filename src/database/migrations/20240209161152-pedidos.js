'use strict';
const { DataTypes } = require("sequelize");

module.exports = {
    async up (queryInterface, Sequelize) {

        await queryInterface.createTable('pedidos',{ 
            id: {
                type: DataTypes.INTEGER,
                autoIncrement: true,
                primaryKey: true
            },
            
            tipoPago : {
                type: DataTypes.STRING,
                allowNull: false
            },
                
            fecha: {
                type: DataTypes.DATE
            },
                
            coordenadas: {
                type: DataTypes.STRING,
                allowNull: false
            },
            
            estado: {
                type: DataTypes.INTEGER,
                allowNull: false
            },

            idUser: {
                type: DataTypes.INTEGER,
                references: {
                    model: {
                        tableName: "usuarios",
                    },
                    key: "id",
                },
                allowNull: false,
            }
        })
    },

    async down (queryInterface, Sequelize) {
        await queryInterface.dropTable('pedidos');
      
    }
};
