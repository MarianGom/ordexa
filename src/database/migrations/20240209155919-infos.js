'use strict';
const { DataTypes } = require("sequelize");

module.exports = {
    async up (queryInterface, Sequelize) {
        await queryInterface.createTable('infos', {
            id: {
                type: DataTypes.INTEGER,
                autoIncrement: true,
                primaryKey: true
            },
                
            valorEnerg: {
                type: DataTypes.INTEGER,
                allowNull: false
            },
                
            porcion: {
                type: DataTypes.STRING,
                allowNull: false
            },
                
            proteina: {
                type: DataTypes.INTEGER
            },
                
            sodio: {
                type: DataTypes.INTEGER
            },
                
            grasaTotal: {
                type: DataTypes.INTEGER,
            },
                
            grasaSaturada: {
                type: DataTypes.INTEGER,
            },
                
            grasaTrans : {
                type: DataTypes.INTEGER,
            },
                
            fibraAlim: {
                type: DataTypes.INTEGER,
            },
                
            otros: {
                type: DataTypes.STRING,
            }  
        })
    },

    async down (queryInterface, Sequelize) {
        await queryInterface.dropTable('infos');
        
    }
};
