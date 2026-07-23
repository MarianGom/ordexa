const db = require("../database/models");
const { Op } = db.Sequelize;

const ESTADOS = [
  "En espera", "En evaluación", "En ejecución", "Espera de materiales",
  "Retrasado", "Pausado", "Finalizado", "Cancelado", "Fuera de término",
];

const PERMISOS = {
  1: ["estado", "fechas", "responsable", "prioridad", "tecnico"],
  2: ["responsable"],
  3: ["prioridad", "tecnico"],
};

const includeResponsable = {
  model: db.Usuario,
  as: "responsable",
  required: false,
  attributes: ["id_usuario", "nombre", "apellido"],
};

const includeTarea = {
  model: db.Tarea,
  as: "tarea",
  required: false,
  attributes: ["id_tarea", "descripcion", "materiales", "tiempo_necesario", "id_tecnico"],
  include: [{
    model: db.Tecnico,
    as: "tecnico",
    required: false,
    attributes: ["id_tecnico", "nombre", "apellido"],
  }],
};

const reportesController = {
  index: async (req, res) => {
    try {
      const rol = Number(req.session.user.id_rol ?? req.session.user.rol);
      const tabsPermitidos = PERMISOS[rol] || [];
      const tab = String(req.query.tab || tabsPermitidos[0] || "");

      if (!tabsPermitidos.includes(tab)) {
        return res.status(403).send("No autorizado para consultar este reporte");
      }

      const filtros = {
        estado: String(req.query.estado || "all"),
        desde: String(req.query.desde || ""),
        hasta: String(req.query.hasta || ""),
        id_responsable: String(req.query.id_responsable || "all"),
        prioridad: String(req.query.prioridad || "all"),
        id_tecnico: String(req.query.id_tecnico || "all"),
      };

      const where = { activa: true };
      let include = [includeResponsable];
      let order = [["num_orden", "ASC"]];

      if (tab === "estado" && filtros.estado !== "all") {
        where.estado_actual = filtros.estado;
      }

      if (tab === "fechas") {
        if (filtros.desde || filtros.hasta) {
          where.fecha_carga = {};
          if (filtros.desde) where.fecha_carga[Op.gte] = filtros.desde;
          if (filtros.hasta) where.fecha_carga[Op.lte] = filtros.hasta;
        }
        order = [["fecha_carga", "ASC"], ["num_orden", "ASC"]];
      }

      if (tab === "responsable") {
        if (filtros.id_responsable !== "all") {
          where.id_responsable = Number(filtros.id_responsable);
        }
        order = [["id_responsable", "ASC"], ["num_orden", "ASC"]];
      }

      if (tab === "prioridad") {
        if (filtros.prioridad !== "all") where.prioridad = filtros.prioridad;
        include = [includeResponsable, includeTarea];
        order = [
          [db.Sequelize.literal("CASE prioridad WHEN 'Alta' THEN 1 WHEN 'Media' THEN 2 WHEN 'Baja' THEN 3 ELSE 4 END"), "ASC"],
          ["num_orden", "ASC"],
        ];
      }

      if (tab === "tecnico") {
        include = [includeResponsable, {
          ...includeTarea,
          required: filtros.id_tecnico !== "all",
          where: filtros.id_tecnico === "all" ? undefined : { id_tecnico: Number(filtros.id_tecnico) },
        }];
      }

      const [ordenes, responsables, tecnicos] = await Promise.all([
        db.OrdenTrabajo.findAll({ where, include, order, distinct: true }),
        db.Usuario.findAll({
          where: { id_rol: 3, activo: true },
          attributes: ["id_usuario", "nombre", "apellido"],
          order: [["apellido", "ASC"], ["nombre", "ASC"]],
        }),
        db.Tecnico.findAll({
          where: { activo: 1 },
          attributes: ["id_tecnico", "nombre", "apellido"],
          order: [["apellido", "ASC"], ["nombre", "ASC"]],
        }),
      ]);

      return res.render("reportes/index", {
        title: "Reportes", user: req.session.user, currentPath: "/reportes",
        tab, tabsPermitidos, filtros, ordenes, responsables, tecnicos, estados: ESTADOS,
      });
    } catch (error) {
      console.error("Error generando reporte:", error);
      return res.status(500).send("Error al generar el reporte");
    }
  },

  porEstado: async (req, res) => {
    const data = await db.OrdenTrabajo.findAll({
      attributes: ["estado_actual", [db.Sequelize.fn("COUNT", db.Sequelize.col("num_orden")), "cantidad"]],
      where: { activa: true }, group: ["estado_actual"], raw: true,
    });
    return res.json(data);
  },

  porResponsable: async (req, res) => {
    const data = await db.OrdenTrabajo.findAll({
      attributes: ["id_responsable", [db.Sequelize.fn("COUNT", db.Sequelize.col("num_orden")), "cantidad"]],
      where: { activa: true }, include: [includeResponsable],
      group: ["id_responsable", "responsable.id_usuario"], raw: true,
    });
    return res.json(data);
  },

  porFechas: async (req, res) => {
    const { desde, hasta } = req.query;
    if (!desde || !hasta) return res.status(400).json({ error: "Faltan desde y hasta" });
    const data = await db.OrdenTrabajo.findAll({
      where: { activa: true, fecha_carga: { [Op.between]: [desde, hasta] } },
      order: [["fecha_carga", "ASC"]],
    });
    return res.json(data);
  },

  vencidas: async (req, res) => {
    const dias = Math.max(Number(req.query.dias || 7), 1);
    const limite = new Date();
    limite.setDate(limite.getDate() - dias);
    const ordenes = await db.OrdenTrabajo.findAll({
      where: { activa: true, creado_en: { [Op.lt]: limite }, estado_actual: { [Op.notIn]: ["Finalizado", "Cancelado"] } },
      order: [["creado_en", "ASC"]],
    });
    return res.json({ dias, cantidad: ordenes.length, ordenes });
  },
};

module.exports = reportesController;
