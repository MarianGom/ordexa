const db = require("../database/models");
const { Op } = db.Sequelize;

const consultaController = {
  index: async (req, res) => {
    const q = String(req.query.q || "").trim();
    let orden = null;
    let notFound = false;

    if (q) {
      try {
        const numero = Number(q);
        const condiciones = [{ num_tramite: q }];

        if (Number.isInteger(numero) && numero > 0) {
          condiciones.unshift({ num_orden: numero });
        }

        orden = await db.OrdenTrabajo.findOne({
          where: { activa: true, [Op.or]: condiciones },
          attributes: [
            "num_orden", "num_tramite", "nom_tramite", "estado_actual",
            "prioridad", "fecha_carga", "descripcion",
          ],
        });

        notFound = !orden;
      } catch (error) {
        console.error("Error en consulta pública:", error);
        notFound = true;
      }
    }

    return res.render("consulta/index", { q, orden, notFound });
  },
};

module.exports = consultaController;
