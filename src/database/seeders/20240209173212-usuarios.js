'use strict';
const { faker } = require("@faker-js/faker");

module.exports = {
    async up(queryInterface, Sequelize) {
        const users = [];
        Array(50)
            .fill(0)
            .forEach((_, i) => {        
                const randomUser = {
                    id: i + 1,
                    cuil: faker.number.int({ min: 20000000000, max: 27999999999 }),
                    nombre: faker.person.firstName(),
                    apellido: faker.person.lastName(), 
                    domicilio: faker.location.streetAddress(),        
                    email: faker.internet.email(),
                    telefono: faker.phone.number('+54 9 11 #### ####'),
                    rol: faker.helpers.arrayElement(['admin', 'tecnico', 'cliente']),
                    observaciones: faker.lorem.sentence(),
                    password: faker.person.zodiacSign(),
                    estado: 1,
                };
                users.push(randomUser);
            })
        await queryInterface.bulkInsert("usuarios", users);
    },

    async down(queryInterface, Sequelize) {
        
        await queryInterface.bulkDelete('usuarios', null, {});

    }
};