const db = require("../database/models");
const { Op, fn, col, literal } = require("sequelize");

const reportesController = {
  // Vista (después la armamos linda)
  index: (req, res) => {
    return res.render("reportes/index", { user: req.session.user });
  },

  // 1) OT por estado
  porEstado: async (req, res) => {
    const data = await db.OrdenTrabajo.findAll({
      attributes: [
        "estado_actual",
        [fn("COUNT", col("num_orden")), "cantidad"]
      ],
      group: ["estado_actual"],
      order: [[literal("cantidad"), "DESC"]]
    });

    return res.json(data);
  },

  // 2) OT por responsable
  porResponsable: async (req, res) => {
    const data = await db.OrdenTrabajo.findAll({
      attributes: [
        "id_responsable",
        [fn("COUNT", col("num_orden")), "cantidad"]
      ],
      include: [
        {
          model: db.Usuario,
          as: "responsable",
          attributes: ["id_usuario", "nombre", "apellido"]
        }
      ],
      group: ["id_responsable", "responsable.id_usuario"],
      order: [[literal("cantidad"), "DESC"]]
    });

    return res.json(data);
  },

  // 3) OT entre fechas (query ?desde=YYYY-MM-DD&hasta=YYYY-MM-DD)
  porFechas: async (req, res) => {
    const { desde, hasta } = req.query;

    if (!desde || !hasta) {
      return res.status(400).json({ error: "Faltan parámetros desde y hasta" });
    }

    const data = await db.OrdenTrabajo.findAll({
      where: {
        creado_en: {
          [Op.between]: [
            new Date(`${desde}T00:00:00`),
            new Date(`${hasta}T23:59:59`)
          ]
        }
      },
      order: [["creado_en", "DESC"]]
    });

    return res.json(data);
  },

  // 4) OT vencidas (ejemplo: más de 7 días y no finalizada/cancelada)
  vencidas: async (req, res) => {
    const dias = Number(req.query.dias || 7);

    const limite = new Date();
    limite.setDate(limite.getDate() - dias);

    const data = await db.OrdenTrabajo.findAll({
      where: {
        creado_en: { [Op.lt]: limite },
        estado_actual: { [Op.notIn]: ["Finalizado", "Cancelado"] }
      },
      order: [["creado_en", "ASC"]]
    });

    return res.json({ dias, cantidad: data.length, ordenes: data });
  }
};

module.exports = reportesController;
