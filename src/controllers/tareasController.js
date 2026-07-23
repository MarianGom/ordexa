const db = require("../database/models");
const logAudit = require("../helpers/audit");

const tareasController = {
   newForm: async (req, res) => {
  const numOrden = Number(req.params.id);
  const tareaExistente = await db.Tarea.findOne({ where: { num_orden: numOrden } });
  if (tareaExistente) return res.redirect(`/tareas/${tareaExistente.id_tarea}/editar`);

  const tecnicos = await db.Tecnico.findAll({
    where: { activo: 1 },
    attributes: ["id_tecnico", "nombre", "apellido"],
    order: [["apellido", "ASC"], ["nombre", "ASC"]],
  });

  return res.render("tareas/_form", {
    mode: "create",
    numOrden,
    tarea: null,
    tecnicos,
    action: `/ordenes/${numOrden}/tareas`,
    closeAttr: "data-close-tarea",
  });
},
editForm: async (req, res) => {
  try {
    const id_tarea = Number(req.params.id);

    const tarea = await db.Tarea.findByPk(id_tarea);
    if (!tarea) return res.status(404).send("Tarea no encontrada");

    const tecnicos = await db.Tecnico.findAll({
      where: { activo: 1 }, // si tu tabla tiene activo
      attributes: ["id_tecnico", "nombre", "apellido"],
      order: [["apellido", "ASC"], ["nombre", "ASC"]],
    });

    return res.render("tareas/_edit-form", {
      tarea,
      tecnicos, // ✅ ESTA ES LA CLAVE
    });
  } catch (error) {
    console.error("Error editForm tarea:", error);
    return res.status(500).send("Error cargando formulario de edición");
  }
},
  create: async (req, res) => {
    try {
      const num_orden = Number(req.params.id);
      const { descripcion, materiales, tiempo_necesario, id_tecnico } = req.body;
      const tareaExistente = await db.Tarea.findOne({ where: { num_orden } });
      if (tareaExistente) {
        return res.status(409).send("Esta orden ya tiene su única tarea asociada.");
      }

      if (!descripcion || descripcion.trim().length < 3) {
        return res.status(400).send("Descripción obligatoria (mín 3 caracteres).");
      }

      const transaction = await db.sequelize.transaction();
      try {
        const tarea = await db.Tarea.create({
          num_orden,
          descripcion: descripcion.trim(),
          materiales: materiales?.trim() || null,
          tiempo_necesario: tiempo_necesario ? Number(tiempo_necesario) : null,
          id_tecnico: id_tecnico ? Number(id_tecnico) : null,
        }, { transaction });

        if (tarea.id_tecnico) {
          await logAudit({
            idUsuario: req.session.user.id_usuario,
            evento: "ASIGNACION_TECNICO",
            tablaAfectada: "tarea",
            idRegistro: tarea.id_tarea,
            detalle: `Técnico ${tarea.id_tecnico} asignado a la tarea ${tarea.id_tarea}`,
            transaction,
          });
        }

        await transaction.commit();
      } catch (error) {
        await transaction.rollback();
        throw error;
      }
      req.session.flash = { type: "success", message: "Tarea creada correctamente." };
      return res.redirect(`/ordenes/${num_orden}`);
    } catch (error) {
      console.error("Error creando tarea:", error);
      return res.status(500).send(error.message);
    }
  },
  update: async (req, res) => {
    try {
      const id_tarea = Number(req.params.id);
      const { descripcion, materiales, tiempo_necesario, id_tecnico} = req.body;
      const tarea = await db.Tarea.findByPk(id_tarea);
      if (!tarea) return res.status(404).send("Tarea no encontrada");

      const tecnicoAnterior = tarea.id_tecnico;
      const tecnicoNuevo = id_tecnico ? Number(id_tecnico) : null;
      const transaction = await db.sequelize.transaction();

      try {
        await tarea.update({
          descripcion: descripcion?.trim() ?? tarea.descripcion,
          materiales: materiales?.trim() ?? tarea.materiales,
          tiempo_necesario: tiempo_necesario ? Number(tiempo_necesario) : null,
          id_tecnico: tecnicoNuevo,
        }, { transaction });

        if (Number(tecnicoAnterior || 0) !== Number(tecnicoNuevo || 0)) {
          await logAudit({
            idUsuario: req.session.user.id_usuario,
            evento: "ASIGNACION_TECNICO",
            tablaAfectada: "tarea",
            idRegistro: id_tarea,
            detalle: `Técnico cambiado de ${tecnicoAnterior || "sin asignar"} a ${tecnicoNuevo || "sin asignar"}`,
            transaction,
          });
        }

        await transaction.commit();
      } catch (error) {
        await transaction.rollback();
        throw error;
      }
      req.session.flash = { type: "success", message: "Tarea actualizada correctamente." };
      return res.redirect(`/ordenes/${tarea.num_orden}`);
    } catch (error) {
      console.error("Error actualizando tarea:", error);
      return res.status(500).send(error.message);
    }
  },

  destroy: async (req, res) => {
    const tarea = await db.Tarea.findByPk(Number(req.params.id));
    if (!tarea) return res.status(404).send("Tarea no encontrada");
    req.session.flash = {
      type: "warning",
      message: "La tarea no puede eliminarse porque toda OT debe conservar una única tarea.",
    };
    return res.redirect(`/ordenes/${tarea.num_orden}`);
  }
};

module.exports = tareasController;
