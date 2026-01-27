'use strict';
const { DataTypes } = require("sequelize");

module.exports = {
    async up (queryInterface, Sequelize) {
        
        await queryInterface.createTable('usuarios', {
            id: {
                type: DataTypes.INTEGER,
                primaryKey: true,
                autoIncrement: true,
            },
            cuil: {
                type: DataTypes.INTEGER,
                allowNull: false
            },
            nombre: {
                type: DataTypes.STRING,
                allowNull: false
            },
            apellido: {
                type: DataTypes.STRING,
                allowNull: false
            },
            domicilio: {
                type: DataTypes.STRING,
                allowNull: true
            },
            email: {
                type: DataTypes.STRING,
                allowNull: false
            },
                
            telefono: {
                type: DataTypes.STRING
            },
            rol: {
            type: DataTypes.STRING,
            allowNull: false
            },

            observaciones: {
                type: DataTypes.INTEGER,
                allowNull: true
            },
            
            password: {
                type: DataTypes.TEXT,
                allowNull: false
            },
            estado: {
                type: DataTypes.INTEGER,
                allowNull: false
            },
        
           
          }
        );
    },

    async down (queryInterface, Sequelize) {
        
        await queryInterface.dropTable('usuarios');
      
    }
};
