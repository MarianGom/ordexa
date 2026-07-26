require("dotenv").config();

const { sequelize } = require("../src/database/models");

async function resetDatabase() {
    try {
        console.log("=================================");
        console.log(" ORDEXA - Reset Base de Datos");
        console.log("=================================\n");

        await sequelize.query("SET FOREIGN_KEY_CHECKS = 0");

        const tablas = [
            "auditoria_log",
            "estado_historial",
            "orden_archivo",
            "tarea",
            "orden_trabajo"
        ];

        for (const tabla of tablas) {
            console.log(`Limpiando ${tabla}...`);
            await sequelize.query(`TRUNCATE TABLE ${tabla}`);
        }

        await sequelize.query("SET FOREIGN_KEY_CHECKS = 1");

        console.log("\nBase de datos limpiada correctamente.");
        console.log("Usuarios, roles y técnicos fueron conservados.");

        process.exit(0);

    } catch (error) {

        console.error("\nError limpiando la base:");
        console.error(error);

        process.exit(1);
    }
}

resetDatabase();