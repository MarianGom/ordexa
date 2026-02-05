const db = require("../database/models");

module.exports = async (req, res, next) => {
  try {
    const id_tarea = Number(req.params.id);
    if (!id_tarea) return res.status(400).send("ID tarea inválido");

    const tarea = await db.Tarea.findByPk(id_tarea);
    if (!tarea) return res.status(404).send("Tarea no encontrada");

    const orden = await db.OrdenTrabajo.findByPk(tarea.num_orden);
    if (!orden) return res.status(404).send("Orden no encontrada");

    const cerrados = ["Finalizado", "Cancelado"];
    if (cerrados.includes(orden.estado_actual)) {
      return res.status(403).send("La orden está cerrada. No se pueden realizar cambios.");
    }

    req.orden = orden;
    req.tarea = tarea;
    next();
  } catch (e) {
    console.error(e);
    return res.status(500).send("Error validando estado de la orden.");
  }
};