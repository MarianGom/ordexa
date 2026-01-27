'use strict';
const { DataTypes } = require("sequelize");

module.exports = {
    async up (queryInterface, Sequelize) {
        await queryInterface.createTable('items', {
            id:{
                type: DataTypes.INTEGER,
                autoIncrement: true,
                primaryKey: true
            },
    
            idProd: {
                type: DataTypes.INTEGER,
                references: {
                    model: {
                        tableName: "productos",
                    },
                    key: "id",
                },
                allowNull: false,
            },
            
            idPedido: {
                type: DataTypes.INTEGER,
                references: {
                    model: {
                        tableName: "pedidos",
                    },
                    key: "id",
                },
                allowNull: false,
            },
                
            cantidad: {
                type: DataTypes.INTEGER
            },
    
            estado: {
                type: DataTypes.INTEGER,
                allowNull: false
            }
        }
        )
    },

    async down (queryInterface, Sequelize) {
        await queryInterface.dropTable('items');
        
    }
};
