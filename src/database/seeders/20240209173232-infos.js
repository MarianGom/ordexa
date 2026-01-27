'use strict';
const { faker } = require("@faker-js/faker");

module.exports = {
    async up(queryInterface, Sequelize) {
        const infos = [];
            Array(20)
                .fill(0)
                .forEach((_, i) => {        
                    const randomInfo = {
                        id: i + 1,
                        valorEnerg: faker.number.int({ min: 1, max: 1000 }),
                        porcion: "20 g",
                        proteina: faker.number.int({ min: 1, max: 1000 }),
                        sodio: faker.number.int({ min: 1, max: 1000 }),
                        grasaTotal: faker.number.int({ min: 1, max: 1000 }),
                        grasaSaturada: faker.number.int({ min: 1, max: 1000 }),
                        grasaTrans: faker.number.int({ min: 1, max: 1000 }),
                        fibraAlim: faker.number.int({ min: 1, max: 1000 }),
                        otros: faker.commerce.productDescription()
                    };
                    infos.push(randomInfo);
                })
        await queryInterface.bulkInsert("infos", infos);
    },

    async down (queryInterface, Sequelize) {
        await queryInterface.bulkDelete('infos', null, {});
    }
};
