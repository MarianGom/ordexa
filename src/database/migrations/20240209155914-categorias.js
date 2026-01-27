'use strict';
const { DataTypes } = require("sequelize");

module.exports = {
    async up (queryInterface, Sequelize) {
        await queryInterface.createTable('categorias',{ 
            id: {
                type: DataTypes.INTEGER,
                autoIncrement: true,
                primaryKey: true
            },
                
            nombre: {
                type: DataTypes.STRING,
                allowNull: false
            }

        })
    },

    async down (queryInterface, Sequelize) {
        await queryInterface.dropTable('categorias');
        
    }
};
