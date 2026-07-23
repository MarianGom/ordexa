const db = require("../database/models");
const { Op } = db.Sequelize;

const normalizar = (body) => ({
  nombre: String(body.nombre || "").trim(),
  apellido: String(body.apellido || "").trim(),
  correo: String(body.correo || "").trim().toLowerCase(),
  telefono: String(body.telefono || "").trim(),
});

const validar = ({ nombre, apellido, correo, telefono }) => {
  if (!nombre || !apellido || !correo) return "Completá nombre, apellido y correo.";
  if (!/^\S+@\S+\.\S+$/.test(correo)) return "Ingresá un correo electrónico válido.";
  if (telefono && !/^[0-9+\-()\s]+$/.test(telefono)) return "Ingresá un teléfono válido.";
  return null;
};

const tecnicosController = {
  index: async (req, res) => {
    try {
      const tecnicos = await db.Tecnico.findAll({
        order: [["activo", "DESC"], ["apellido", "ASC"], ["nombre", "ASC"]],
      });
      return res.render("tecnicos/index", {
        title: "Gestionar Técnicos",
        user: req.session.user,
        currentPath: "/tecnicos",
        tecnicos,
      });
    } catch (error) {
      console.error("Error listando técnicos:", error);
      return res.status(500).send("No se pudieron cargar los técnicos.");
    }
  },

  create: (req, res) => res.render("tecnicos/create", {
    title: "Nuevo Técnico",
    user: req.session.user,
    currentPath: "/tecnicos",
    values: {},
    error: null,
  }),

  store: async (req, res) => {
    const values = normalizar(req.body);
    const errorValidacion = validar(values);
    if (errorValidacion) {
      return res.status(400).render("tecnicos/create", {
        title: "Nuevo Técnico", user: req.session.user, currentPath: "/tecnicos",
        values, error: errorValidacion,
      });
    }

    try {
      const existente = await db.Tecnico.findOne({ where: { correo: values.correo } });
      if (existente) {
        return res.status(409).render("tecnicos/create", {
          title: "Nuevo Técnico", user: req.session.user, currentPath: "/tecnicos",
          values, error: "Ya existe un técnico con ese correo.",
        });
      }
      await db.Tecnico.create({ ...values, telefono: values.telefono || null, activo: 1 });
      req.session.flash = { type: "success", message: "Técnico creado correctamente." };
      return res.redirect("/tecnicos");
    } catch (error) {
      console.error("Error creando técnico:", error);
      return res.status(500).render("tecnicos/create", {
        title: "Nuevo Técnico", user: req.session.user, currentPath: "/tecnicos",
        values, error: "No se pudo crear el técnico.",
      });
    }
  },

  edit: async (req, res) => {
    const tecnico = await db.Tecnico.findByPk(Number(req.params.id));
    if (!tecnico) return res.status(404).send("Técnico no encontrado.");
    return res.render("tecnicos/edit", {
      title: "Editar Técnico",
      user: req.session.user,
      currentPath: "/tecnicos",
      tecnico,
      values: tecnico.toJSON(),
      error: null,
    });
  },

  update: async (req, res) => {
    const tecnico = await db.Tecnico.findByPk(Number(req.params.id));
    if (!tecnico) return res.status(404).send("Técnico no encontrado.");

    const values = normalizar(req.body);
    const errorValidacion = validar(values);
    if (errorValidacion) {
      return res.status(400).render("tecnicos/edit", {
        title: "Editar Técnico", user: req.session.user, currentPath: "/tecnicos",
        tecnico, values, error: errorValidacion,
      });
    }

    const duplicado = await db.Tecnico.findOne({
      where: { correo: values.correo, id_tecnico: { [Op.ne]: tecnico.id_tecnico } },
    });
    if (duplicado) {
      return res.status(409).render("tecnicos/edit", {
        title: "Editar Técnico", user: req.session.user, currentPath: "/tecnicos",
        tecnico, values, error: "Ya existe otro técnico con ese correo.",
      });
    }

    await tecnico.update({ ...values, telefono: values.telefono || null });
    req.session.flash = { type: "success", message: "Técnico actualizado correctamente." };
    return res.redirect("/tecnicos");
  },

  toggle: async (req, res) => {
    const tecnico = await db.Tecnico.findByPk(Number(req.params.id));
    if (!tecnico) return res.status(404).send("Técnico no encontrado.");
    tecnico.activo = tecnico.activo ? 0 : 1;
    await tecnico.save();
    req.session.flash = {
      type: "success",
      message: tecnico.activo ? "Técnico reactivado correctamente." : "Técnico desactivado correctamente.",
    };
    return res.redirect("/tecnicos");
  },
};

module.exports = tecnicosController;
