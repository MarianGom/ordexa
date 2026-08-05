"use strict";

const ESTADOS_ANTERIORES =
  "ENUM('En espera','En evaluación','En ejecución','Espera de materiales','Retrasado','Pausado','Finalizado','Cancelado','Fuera de término')";
const ESTADOS_VIGENTES =
  "ENUM('En espera','En evaluación','En ejecución','Pausado','Finalizado','Cancelado')";

module.exports = {
  async up(queryInterface) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      for (const tabla of ["orden_trabajo", "estado_historial"]) {
        await queryInterface.sequelize.query(
          `UPDATE ${tabla} SET estado_actual = CASE
            WHEN estado_actual = 'Espera de materiales' THEN 'Pausado'
            WHEN estado_actual IN ('Retrasado', 'Fuera de término') THEN 'En ejecución'
            ELSE estado_actual END`,
          { transaction },
        );
        await queryInterface.sequelize.query(
          `ALTER TABLE ${tabla} MODIFY estado_actual ${ESTADOS_VIGENTES} NOT NULL${tabla === "orden_trabajo" ? " DEFAULT 'En espera'" : ""}`,
          { transaction },
        );
      }
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },

  async down(queryInterface) {
    for (const tabla of ["orden_trabajo", "estado_historial"]) {
      await queryInterface.sequelize.query(
        `ALTER TABLE ${tabla} MODIFY estado_actual ${ESTADOS_ANTERIORES} NOT NULL${tabla === "orden_trabajo" ? " DEFAULT 'En espera'" : ""}`,
      );
    }
  },
};
