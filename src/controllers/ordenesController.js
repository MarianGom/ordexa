const db = require("../database/models");

const ITEMS_PER_PAGE = 10; // ajustá si querés 5 como v0
const { Op } = db.Sequelize;

const ordenesController = {
index: async (req, res) => {
  try {
    // 1) Normalizar filtros
    const filters = {
      q: (req.query.q || "").trim(),
      estado: (req.query.estado || "all").trim(),
      prioridad: (req.query.prioridad || "all").trim(),
      desde: (req.query.desde || "").trim(),
      hasta: (req.query.hasta || "").trim(),
      page: req.query.page || "1",
    };

    const page = Math.max(parseInt(filters.page, 10) || 1, 1);
    const offset = (page - 1) * ITEMS_PER_PAGE;

    // 2) WHERE dinámico
    const where = { activa: 1 };

    if (filters.q) {
      const q = filters.q;
      const maybeNumber = Number(q);
      const or = [];

      if (!Number.isNaN(maybeNumber) && q !== "") {
        or.push({ num_orden: maybeNumber });
      }

      or.push({ num_tramite: { [Op.like]: `%${q}%` } });
      or.push({ solicitante: { [Op.like]: `%${q}%` } });

      where[Op.or] = or;
    }

    if (filters.estado !== "all") where.estado_actual = filters.estado;
    if (filters.prioridad !== "all") where.prioridad = filters.prioridad;

    // fecha_carga es DATEONLY: compará con strings YYYY-MM-DD (más estable que Date con TZ)
    if (filters.desde || filters.hasta) {
      where.fecha_carga = {};
      if (filters.desde) where.fecha_carga[Op.gte] = filters.desde;
      if (filters.hasta) where.fecha_carga[Op.lte] = filters.hasta;
    }

    // 3) Query principal
    const { rows, count } = await db.OrdenTrabajo.findAndCountAll({
      where,

      include: [
        // Operario (creador)
        {
          model: db.Usuario,
          as: "operario",
          required: false,
          attributes: ["id_usuario", "nombre", "apellido"],
        },

        // Responsable
        {
          model: db.Usuario,
          as: "responsable",
          required: false,
          attributes: ["id_usuario", "nombre", "apellido"],
        },

        // Tareas + técnico (para mostrar "técnico asignado" real)
        {
          model: db.Tarea,
          as: "tareas",
          required: false,
          attributes: ["id_tarea", "id_tecnico"],
          include: [
            {
              model: db.Tecnico,
              as: "tecnico",
              required: false,
              attributes: ["id_tecnico", "nombre", "apellido"],
            },
          ],
        },
      ],

      order: [["num_orden", "DESC"]],
      limit: ITEMS_PER_PAGE,
      offset,
      distinct: true, // clave cuando hay hasMany (tareas) para que count no se infle
    });

    const totalPages = Math.max(Math.ceil(count / ITEMS_PER_PAGE), 1);
    const pagination = {
      page,
      total: count,
      totalPages,
      from: count ? offset + 1 : 0,
      to: Math.min(offset + ITEMS_PER_PAGE, count),
    };

    // (opcional) helper: dejar un "tecnicosResumen" por OT para el EJS
    // así no tenés que hacer lógica compleja en la vista
    const ordenes = rows.map((ot) => {
      const tecnicos = (ot.tareas || [])
        .map((t) => t.tecnico ? `${t.tecnico.nombre} ${t.tecnico.apellido}` : null)
        .filter(Boolean);

      const unicos = [...new Set(tecnicos)];
      return {
        ...ot.toJSON(),
        tecnicosResumen: unicos.length ? unicos.join(", ") : null,
      };
    });

    return res.render("ordenes/index", {
      title: "Gestionar Órdenes de Trabajo",
      user: req.session.user,
      currentPath: "/ordenes",
      ordenes,
      filters,
      pagination,
    });
  } catch (error) {
    console.error("Error listando órdenes:", error);
    return res.status(500).send("Error al listar órdenes");
  }
},


  create: (req, res) => {
    res.render("ordenes/create", { error: null, values: {} });
  },

   store: async (req, res) => {
    const t = await db.sequelize.transaction();
    console.log("SESSION USER:", req.session.user);
    try {
      const {
        num_tramite,
        nom_tramite,
        solicitante,
        correo_solicitante,
        prioridad,
        descripcion,
      } = req.body;

      // Validación mínima
      if (!num_tramite || !nom_tramite || !solicitante || !correo_solicitante || !prioridad) {
        await t.rollback();
        return res.status(400).render("ordenes/create", {
          error: "Faltan campos obligatorios.",
          values: req.body,
          title: "Nueva Orden",
          user: req.session.user,
          currentPath: "/ordenes",
        });
      }

      // OJO con el id de sesión
      const idUsuario = req.session?.user?.id_usuario; // <-- ajustado
      if (!idUsuario) {
        await t.rollback();
        return res.status(401).send("Sesión inválida. Volvé a iniciar sesión.");
      }

      // 1) Crear OT
      const nuevaOT = await db.OrdenTrabajo.create(
        {
          num_tramite,
          nom_tramite,
          solicitante,
          correo_solicitante,
          prioridad,
          descripcion: descripcion || null,
          fecha_carga: new Date(),
          estado_actual: "En espera",
          id_operario_creador: idUsuario, // <-- si tu campo se llama distinto, lo cambiamos
          activa: true,
        },
        { transaction: t }
      );

      // 2) (Opcional) Crear una tarea inicial “placeholder”
      // Si no querés tarea inicial, borrá este bloque.
      await db.Tarea.create(
        {
          num_orden: nuevaOT.num_orden,
          descripcion: "Tarea inicial",
          materiales: null,
          tiempo_necesario: null,
          id_tecnico: null,
        },
        { transaction: t }
      );

      await t.commit();
      return res.redirect(`/ordenes/${nuevaOT.num_orden}`);
    } catch (error) {
      await t.rollback();
      console.error("Error creando OT:", error);

      return res.status(500).render("ordenes/create", {
        error: "No se pudo crear la OT. Revisá consola.",
        values: req.body,
        title: "Nueva Orden",
        user: req.session.user,
        currentPath: "/ordenes",
      });
    }
  },

  show: async (req, res) => {
  try {
    const numOrden = Number(req.params.id);
    if (!numOrden) return res.status(400).send("ID inválido");

    const orden = await db.OrdenTrabajo.findOne({
      where: { num_orden: numOrden },
      include: [
        {
          model: db.Tarea,
          as: "tareas", // IMPORTANTE: que el alias coincida con tu asociación
          required: false,
          include: [
            { model: db.Tecnico, as: "tecnico", required: false }
          ],
          order: [["id_tarea", "ASC"]],
        },
        {
          model: db.EstadoHistorial,
          as: "historial", // alias igual al del model
          required: false,
          order: [["fecha_cambio", "DESC"]],
        },
      ],
    });

    if (!orden) return res.status(404).send("Orden no encontrada");

    return res.render("ordenes/show", {
      title: `OT #${orden.num_orden}`,
      user: req.session.user,
      currentPath: "/ordenes",
      orden,
      tareas: orden.tareas || [],
      historial: orden.historial || [],
    });
  } catch (error) {
    console.error("SHOW OT ERROR:", error);
    return res.status(500).send("Error al obtener la orden");
  }
},
updateEstado: async (req, res) => {
  const t = await db.sequelize.transaction();
  try {
    const numOrden = Number(req.params.id);
    const { estado, comentario } = req.body;

    if (!numOrden) {
      await t.rollback();
      return res.status(400).send("ID inválido");
    }

    const orden = await db.OrdenTrabajo.findOne({
      where: { num_orden: numOrden },
      transaction: t,
    });

    if (!orden) {
      await t.rollback();
      return res.status(404).send("Orden no encontrada");
    }

    await orden.update({ estado_actual: estado }, { transaction: t });

    // si tu historial lo manejás por trigger, podés borrar este create
    await db.EstadoHistorial.create(
      {
        num_orden: numOrden,
        estado_actual: estado,
        fecha_cambio: new Date(),
        id_usuario_cambio: req.session.user.id_usuario,
        nota: comentario || null,
      },
      { transaction: t }
    );

    await t.commit();
    return res.redirect(`/ordenes/${numOrden}`);
  } catch (error) {
    await t.rollback();
    console.error("Error cambiando estado:", error);
    return res.status(500).send("Error al cambiar estado");
  }
},

  updateTecnico: async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { id_tecnico } = req.body;

    const orden = await db.OrdenTrabajo.findOne({ where: { num_orden: id } });
    if (!orden) return res.status(404).send("Orden no encontrada");

    await orden.update({
      id_tecnico: id_tecnico || null
    });

    return res.redirect(`/ordenes/${id}`);
  } catch (error) {
    console.error("Error asignando técnico:", error);
    return res.status(500).send(error.message);
  }
  }


};

module.exports = ordenesController;
