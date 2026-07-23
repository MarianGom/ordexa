const db = require("../database/models");
const fs = require("fs/promises");
const path = require("path");

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
          .map((t) =>
            t.tecnico ? `${t.tecnico.nombre} ${t.tecnico.apellido}` : null,
          )
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

  create: async (req, res) => {
    const ID_ROL_RESPONSABLE = 3;

    const responsables = await db.Usuario.findAll({
      where: { id_rol: ID_ROL_RESPONSABLE, activo: 1 },
      attributes: ["id_usuario", "nombre", "apellido", "correo"],
      order: [
        ["apellido", "ASC"],
        ["nombre", "ASC"],
      ],
    });

    return res.render("ordenes/create", {
      error: null,
      values: {},
      title: "Nueva Orden",
      user: req.session.user,
      currentPath: "/ordenes",
      responsables,
    });
  },

  store: async (req, res) => {
    const t = await db.sequelize.transaction();
    try {
      const {
        num_tramite,
        nom_tramite,
        solicitante,
        correo_solicitante,
        prioridad,
        descripcion,
        id_responsable, // 👈 nuevo
      } = req.body;

      // Validación mínima
      if (
        !num_tramite ||
        !nom_tramite ||
        !solicitante ||
        !correo_solicitante ||
        !prioridad ||
        !id_responsable
      ) {
        const ID_ROL_RESPONSABLE = 3;
        const responsables = await db.Usuario.findAll({
          where: { id_rol: ID_ROL_RESPONSABLE, activo: 1 },
          attributes: ["id_usuario", "nombre", "apellido", "correo"],
          order: [
            ["apellido", "ASC"],
            ["nombre", "ASC"],
          ],
        });

        await t.rollback();
        return res.status(400).render("ordenes/create", {
          error: "Faltan campos obligatorios (incluye Responsable).",
          values: req.body,
          title: "Nueva Orden",
          user: req.session.user,
          currentPath: "/ordenes",
          responsables, // 👈 para que NO reviente el select al re-render
        });
      }

      const idUsuario = req.session?.user?.id_usuario;
      if (!idUsuario) {
        await t.rollback();
        return res.status(401).send("Sesión inválida. Volvé a iniciar sesión.");
      }

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
          id_operario_creador: idUsuario,
          id_responsable: Number(id_responsable), // ✅ acá la derivación
          activa: true,
        },
        { transaction: t },
      );
// Guardar archivos adjuntos
if (req.files && req.files.length) {
  const archivos = req.files.map((archivo) => ({
    num_orden: nuevaOT.num_orden,
    nombre: archivo.originalname,
    ruta: `/uploads/ot/${archivo.filename}`,
    mime_type: archivo.mimetype || null,
    subido_en: new Date(),
  }));

  await db.OrdenArchivo.bulkCreate(archivos, {
    transaction: t,
  });
}
      await t.commit();
      return res.redirect(`/ordenes/${nuevaOT.num_orden}`);
    } catch (error) {
      await t.rollback();
      console.error("Error creando OT:", error);

      // volver a cargar responsables también acá
      const ID_ROL_RESPONSABLE = 3;
      const responsables = await db.Usuario.findAll({
        where: { id_rol: ID_ROL_RESPONSABLE, activo: 1 },
        attributes: ["id_usuario", "nombre", "apellido", "correo"],
        order: [
          ["apellido", "ASC"],
          ["nombre", "ASC"],
        ],
      });
     
      return res.status(500).render("ordenes/create", {
        error: "No se pudo crear la OT. Revisá consola.",
        values: req.body,
        title: "Nueva Orden",
        user: req.session.user,
        currentPath: "/ordenes",
        responsables,
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
            include: [{ model: db.Tecnico, as: "tecnico", required: false }],
            order: [["id_tarea", "ASC"]],
          },
          {
            model: db.EstadoHistorial,
            as: "historial", // alias igual al del model
            required: false,
            order: [["fecha_cambio", "DESC"]],
          },
          {
            model: db.OrdenArchivo,
            as: "archivos",
            required: false
          }

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
        { transaction: t },
      );

      await t.commit();
      return res.redirect(`/ordenes/${numOrden}`);
    } catch (error) {
      await t.rollback();
      console.error("Error cambiando estado:", error);
      return res.status(500).send("Error al cambiar estado");
    }
  },
    edit: async (req, res) => {
    try {
      const numOrden = Number(req.params.id);
      if (!numOrden) return res.status(400).send("ID inválido");

      const orden = await db.OrdenTrabajo.findByPk(numOrden, {
  include: [
    {
      model: db.OrdenArchivo,
      as: "archivos",
      required: false,
    },
  ],
});
      if (!orden) return res.status(404).send("Orden no encontrada");

      // mismos responsables que usás en create (por si querés cambiar responsable)
      const ID_ROL_RESPONSABLE = 3;
      const responsables = await db.Usuario.findAll({
        where: { id_rol: ID_ROL_RESPONSABLE, activo: 1 },
        attributes: ["id_usuario", "nombre", "apellido", "correo"],
        order: [["apellido", "ASC"], ["nombre", "ASC"]],
      });

      return res.render("ordenes/edit", {
        title: `Editar OT #${orden.num_orden}`,
        user: req.session.user,
        currentPath: "/ordenes",
        error: null,
        orden,
        responsables,
        values: orden.toJSON(),
      });
    } catch (error) {
      console.error("EDIT OT ERROR:", error);
      return res.status(500).send("Error al cargar edición");
    }
  },

  update: async (req, res) => {
  const t = await db.sequelize.transaction();

  try {
    const numOrden = Number(req.params.id);

    if (!numOrden) {
      await t.rollback();
      return res.status(400).send("ID inválido");
    }

    const orden = await db.OrdenTrabajo.findByPk(numOrden, {
      transaction: t,
    });


    if (!orden) {
      await t.rollback();
      return res.status(404).send("Orden no encontrada");
    }

    const {
      num_tramite,
      nom_tramite,
      solicitante,
      correo_solicitante,
      prioridad,
      estado_actual,
      descripcion,
      id_responsable,
    } = req.body;

    const estadoAnterior = orden.estado_actual;
    const cambioEstado = estadoAnterior !== estado_actual;

    await orden.update(
      {
        num_tramite,
        nom_tramite,
        solicitante,
        correo_solicitante,
        prioridad,
        estado_actual,
        descripcion: descripcion || null,
        id_responsable: id_responsable
          ? Number(id_responsable)
          : null,
      },
      {
        transaction: t,
      },
    );

    if (req.files && req.files.length) {
  const archivosNuevos = req.files.map((archivo) => ({
    num_orden: numOrden,
    nombre: archivo.originalname,
    ruta: `/uploads/ot/${archivo.filename}`,
    mime_type: archivo.mimetype || null,
    subido_en: new Date(),
  }));

  await db.OrdenArchivo.bulkCreate(archivosNuevos, {
    transaction: t,
  });
}

    if (cambioEstado) {
      await db.EstadoHistorial.create(
        {
          num_orden: numOrden,
          estado_actual,
          fecha_cambio: new Date(),
          id_usuario_cambio: req.session.user.id_usuario,
          nota: `Estado cambiado de "${estadoAnterior}" a "${estado_actual}" desde la edición de la orden.`,
        },
        {
          transaction: t,
        },
      );
    }

    await t.commit();

    return res.redirect(`/ordenes/${numOrden}`);
  } catch (error) {
    await t.rollback();

    console.error("UPDATE OT ERROR:", error);

    return res.status(500).send("Error al actualizar OT");
  }
},
destroy: async (req, res) => {
  try {
    const numOrden = Number(req.params.id);

    if (!numOrden) {
      return res.status(400).send("ID inválido");
    }

    const orden = await db.OrdenTrabajo.findByPk(numOrden);

    if (!orden) {
      return res.status(404).send("Orden no encontrada");
    }

    await orden.update({
      activa: false,
    });

    return res.redirect("/ordenes");

  } catch (error) {
    console.error("ERROR DESACTIVANDO OT:", error);
    return res.status(500).send("No se pudo eliminar la orden.");
  }
},
destroyArchivo: async (req, res) => {
  const t = await db.sequelize.transaction();

  try {
    const idArchivo = Number(req.params.idArchivo);

    if (!idArchivo) {
      await t.rollback();
      return res.status(400).send("ID de archivo inválido");
    }

    const archivo = await db.OrdenArchivo.findByPk(idArchivo, {
      transaction: t,
    });

    if (!archivo) {
      await t.rollback();
      return res.status(404).send("Archivo no encontrado");
    }

    const numOrden = archivo.num_orden;

    // La ruta guardada suele ser: /uploads/ot/nombre-archivo.pdf
    // Quitamos la barra inicial para poder unirla con la carpeta public.
    const rutaRelativa = archivo.ruta.replace(/^\/+/, "");

    const rutaFisica = path.join(
      __dirname,
      "../../public",
      rutaRelativa,
    );

    // Primero eliminamos el registro de la base
    await archivo.destroy({
      transaction: t,
    });

    await t.commit();

    // Luego intentamos eliminar el archivo físico.
    // Si no existe, no interrumpimos la operación.
    try {
      await fs.unlink(rutaFisica);
    } catch (fileError) {
      if (fileError.code !== "ENOENT") {
        console.error(
          "No se pudo eliminar el archivo físico:",
          fileError,
        );
      }
    }

    return res.redirect(`/ordenes/${numOrden}`);
  } catch (error) {
    await t.rollback();

    console.error("ERROR ELIMINANDO ARCHIVO:", error);

    return res.status(500).send(
      "No se pudo eliminar el archivo adjunto",
    );
  }
},
};

module.exports = ordenesController;
