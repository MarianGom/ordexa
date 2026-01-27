const db = require("../database/models");

const dashboardController = {
  index: async (req, res) => {
    try {
      // Conteo por estado_actual
      const conteoPorEstadoRaw = await db.OrdenTrabajo.findAll({
        attributes: [
          "estado_actual",
          [db.Sequelize.fn("COUNT", db.Sequelize.col("estado_actual")), "cantidad"],
        ],
        group: ["estado_actual"],
        raw: true,
      });

      // Pasamos a objeto { estado: cantidad }
      const conteoPorEstado = {};
      for (const row of conteoPorEstadoRaw) {
        conteoPorEstado[row.estado_actual] = Number(row.cantidad || 0);
      }

      const finalizadas = conteoPorEstado["Finalizado"] || 0;
      const canceladas = conteoPorEstado["Cancelado"] || 0;

      // Pendientes = todas las activas que no estén finalizadas/canceladas
      // (si preferís contar por estado, te lo adapto)
      const pendientes = await db.OrdenTrabajo.count({
        where: {
          activa: 1,
          estado_actual: { [db.Sequelize.Op.notIn]: ["Finalizado", "Cancelado"] },
        },
      });

      const enEjecucion = conteoPorEstado["En ejecución"] || 0;

      // Técnicos activos (si querés solo los que tengan alguna OT asignada, te lo cambio)
      const tecnicosActivos = await db.Tecnico.count();

      // Últimas órdenes (solo activas)
      const recientes = await db.OrdenTrabajo.findAll({
        where: { activa: 1 },
        order: [["creado_en", "DESC"]],
        limit: 5,
        raw: true,
      });

      return res.render("dashboard/index", {
        title: "Dashboard",
        user: req.session.user,
        currentPath: "/dashboard",
        stats: { pendientes, enEjecucion, finalizadas, tecnicosActivos },
        recientes,
      });
    } catch (error) {
      console.error("Dashboard error:", error);
      return res.status(500).send("Error cargando dashboard");
    }
  },
};

module.exports = dashboardController;
