// middlewares/otAbiertaPorOrden.js
const db = require("../database/models");

module.exports = async (req, res, next) => {
  try {
    const num_orden = Number(req.params.id);
    const orden = await db.OrdenTrabajo.findByPk(num_orden);
    if (!orden) return res.status(404).send("Orden no encontrada");

    const cerrados = ["Finalizado", "Cancelado"];
    if (cerrados.includes(orden.estado_actual)) {
      return res.status(403).send("La orden está cerrada. No se pueden realizar cambios.");
    }

    req.orden = orden;
    next();
  } catch (e) {
    console.error(e);
    return res.status(500).send("Error validando estado de la orden.");
  }
};
