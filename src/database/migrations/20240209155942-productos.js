'use strict';
const { DataTypes } = require("sequelize");

module.exports = {
    async up (queryInterface, Sequelize) {
    
        await queryInterface.createTable('productos',{ 
            id: {
                type: DataTypes.INTEGER,
                primaryKey: true,
                autoIncrement: true,
            },

            idCat: {
                type: DataTypes.INTEGER,
                references: {
                    model: {
                        tableName: "categorias",
                    },
                    key: "id",
                },
                allowNull: false,
            },

            idInfo: {
                type: DataTypes.INTEGER,
                references: {
                    model: {
                        tableName: "infos",
                    },
                    key: "id",
                },
                allowNull: true,
            },

            nombre:  {
                type: DataTypes.STRING,
                allowNull: false,
            },

            sabor:  {
                type: DataTypes.STRING,
                allowNull: false,
            },

            descripcion:  {
                type: DataTypes.STRING,
                allowNull: false,
            },

            precio: {
                type: DataTypes.INTEGER,
                allowNull: false,
            },

            stock: {
                type: DataTypes.INTEGER,
                allowNull: false,
            },

            fotoProd: {
                type: DataTypes.STRING,
                allowNull: true
            },

            estado: {
                type: DataTypes.INTEGER,
                allowNull: false,
                defaultValue: 1
            }
        });
      
    },
  
    async down (queryInterface, Sequelize) {   
        await queryInterface.dropTable('productos');     
    }
};