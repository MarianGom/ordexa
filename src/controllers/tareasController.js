const db = require("../database/models");

const tareasController = {
   newForm: async (req, res) => {
  const numOrden = Number(req.params.id);

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

      if (!descripcion || descripcion.trim().length < 3) {
        return res.status(400).send("Descripción obligatoria (mín 3 caracteres).");
      }

      await db.Tarea.create({
        num_orden,
        descripcion: descripcion.trim(),
        materiales: materiales?.trim() || null,
        tiempo_necesario: tiempo_necesario ? Number(tiempo_necesario) : null,
        id_tecnico: id_tecnico ? Number(id_tecnico) : null,
      });

      return res.redirect(`/ordenes/${num_orden}`);
    } catch (error) {
      console.error("Error creando tarea:", error);
      return res.status(500).send(error.message);
    }
  },
  update: async (req, res) => {
    try {
      const id_tarea = Number(req.params.id);
      const { descripcion, materiales, tiempo_necesario, id_tecnico, num_orden } = req.body;
      const tarea = await db.Tarea.findByPk(id_tarea);
      if (!tarea) return res.status(404).send("Tarea no encontrada");

     await tarea.update({
  descripcion: descripcion?.trim() ?? tarea.descripcion,
  materiales: materiales?.trim() ?? tarea.materiales,
  tiempo_necesario: tiempo_necesario ? Number(tiempo_necesario) : null,
  id_tecnico: id_tecnico ? Number(id_tecnico) : null
});

      return res.redirect(`/ordenes/${num_orden || tarea.num_orden}`);
    } catch (error) {
      console.error("Error actualizando tarea:", error);
      return res.status(500).send(error.message);
    }
  },

  destroy: async (req, res) => {
    try {
      const id_tarea = Number(req.params.id);
      const { num_orden } = req.body;

      const tarea = await db.Tarea.findByPk(id_tarea);
      if (!tarea) return res.status(404).send("Tarea no encontrada");

      await tarea.destroy();
      return res.redirect(`/ordenes/${num_orden || tarea.num_orden}`);
    } catch (error) {
      console.error("Error eliminando tarea:", error);
      return res.status(500).send(error.message);
    }
  }
};

module.exports = tareasController;
