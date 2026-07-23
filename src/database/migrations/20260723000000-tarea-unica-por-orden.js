"use strict";

module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.query(`
      INSERT INTO tarea (num_orden)
      SELECT ot.num_orden
      FROM orden_trabajo ot
      LEFT JOIN tarea t ON t.num_orden = ot.num_orden
      WHERE t.id_tarea IS NULL
    `);

    const [indexes] = await queryInterface.sequelize.query(
      "SHOW INDEX FROM tarea WHERE Key_name = 'uq_tarea_num_orden'",
    );
    if (!indexes.length) {
      await queryInterface.addConstraint("tarea", {
        fields: ["num_orden"],
        type: "unique",
        name: "uq_tarea_num_orden",
      });
    }
  },

  async down(queryInterface) {
    const [indexes] = await queryInterface.sequelize.query(
      "SHOW INDEX FROM tarea WHERE Key_name = 'uq_tarea_num_orden'",
    );
    if (indexes.length) {
      await queryInterface.removeConstraint("tarea", "uq_tarea_num_orden");
    }
  },
};
