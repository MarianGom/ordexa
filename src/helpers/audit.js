const db = require("../database/models");

module.exports = async ({
  idUsuario,
  evento,
  tablaAfectada,
  idRegistro,
  detalle = null,
  transaction,
}) => db.AuditoriaLog.create({
  id_usuario: idUsuario,
  evento,
  tabla_afectada: tablaAfectada,
  id_registro: String(idRegistro),
  detalle,
  creado_en: new Date(),
}, { transaction });
