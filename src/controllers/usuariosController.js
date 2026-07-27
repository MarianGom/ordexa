const db = require("../database/models");
const bcrypt = require("bcryptjs");
const { Op } = db.Sequelize;

const CUIL_REGEX = /^\d{11}$/;

const usuariosController = {

  verificarCuil: async (req, res) => {
    try {
      const cuil = String(req.query.cuil || "").trim();
      const excluirId = Number.parseInt(req.query.excluir_id, 10);

      if (!CUIL_REGEX.test(cuil)) {
        return res.status(400).json({
          existe: false,
          error: "El CUIL debe contener exactamente 11 números."
        });
      }

      const where = { cuil };
      if (Number.isInteger(excluirId) && excluirId > 0) {
        where.id_usuario = { [db.Sequelize.Op.ne]: excluirId };
      }

      const usuario = await db.Usuario.findOne({
        where,
        attributes: ["id_usuario"]
      });

      return res.json({ existe: Boolean(usuario) });
    } catch (error) {
      console.error("Error verificando CUIL:", error);
      return res.status(500).json({
        existe: false,
        error: "No se pudo verificar el CUIL."
      });
    }
  },

  verificarCorreo: async (req, res) => {
    try {
      const correo = String(req.query.correo || "").trim().toLowerCase();
      const excluirId = Number.parseInt(req.query.excluir_id, 10);

      if (!/^\S+@\S+\.\S+$/.test(correo)) {
        return res.status(400).json({
          existe: false,
          error: "Ingresá un correo electrónico válido."
        });
      }

      const where = { correo };
      if (Number.isInteger(excluirId) && excluirId > 0) {
        where.id_usuario = { [db.Sequelize.Op.ne]: excluirId };
      }

      const usuario = await db.Usuario.findOne({
        where,
        attributes: ["id_usuario"]
      });

      return res.json({ existe: Boolean(usuario) });
    } catch (error) {
      console.error("Error verificando correo:", error);
      return res.status(500).json({
        existe: false,
        error: "No se pudo verificar el correo."
      });
    }
  },

  index: async (req, res) => {
    try {
      const q = String(req.query.q || "").trim().slice(0, 100);
      const terminos = q.split(/\s+/).filter(Boolean);
      const where = terminos.length
        ? {
            [Op.and]: terminos.map(termino => ({
              [Op.or]: [
                { cuil: { [Op.like]: `%${termino}%` } },
                { nombre: { [Op.like]: `%${termino}%` } },
                { apellido: { [Op.like]: `%${termino}%` } }
              ]
            }))
          }
        : undefined;

      const usuarios = await db.Usuario.findAll({
        where,
        include: [
          {
            model: db.Rol,
            as: "rol",
            attributes: ["id_rol", "nombre"]
          }
        ],
        order: [
          ["apellido", "ASC"],
          ["nombre", "ASC"],
          ["id_usuario", "ASC"]
        ]
      });

      return res.render("usuarios/index", {
        title: "Gestionar Usuarios",
        user: req.session.user,
        currentPath: "/usuarios",
        usuarios,
        q
      });

    } catch (error) {
      console.error("Error listando usuarios:", error);
      return res.status(500).send("Error al listar usuarios");
    }
  },

  create: async (req, res) => {
    try {
      const roles = await db.Rol.findAll({
        order: [["nombre", "ASC"]]
      });

      return res.render("usuarios/create", {
        title: "Nuevo Usuario",
        user: req.session.user,
        currentPath: "/usuarios",
        roles,
        error: null,
        values: {}
      });

    } catch (error) {
      console.error(error);
      return res.status(500).send(error.message);
    }
  },

  store: async (req, res) => {
    try {
      let {
        cuil,
        nombre,
        apellido,
        correo,
        telefono,
        domicilio,
        observaciones,
        password,
        id_rol
      } = req.body;

      cuil = String(cuil || "").trim();
      nombre = String(nombre || "").trim();
      apellido = String(apellido || "").trim();
      correo = String(correo || "").trim().toLowerCase();
      telefono = String(telefono || "").trim();

      // =========================
      // VALIDACIONES BÁSICAS
      // =========================

      if (!cuil || !nombre || !apellido || !correo || !password || !id_rol) {
        const roles = await db.Rol.findAll();
        return res.render("usuarios/create", {
          title: "Nuevo Usuario",
          user: req.session.user,
          currentPath: "/usuarios",
          roles,
          values: req.body,
          error: "Complete todos los campos obligatorios."
        });
      }

      // El CUIL argentino debe contener exactamente 11 dígitos.
      if (!CUIL_REGEX.test(cuil)) {
        const roles = await db.Rol.findAll();
        return res.status(400).render("usuarios/create", {
          title: "Nuevo Usuario",
          user: req.session.user,
          currentPath: "/usuarios",
          roles,
          values: { ...req.body, cuil, nombre, apellido, correo, telefono },
          error: "El CUIL debe contener exactamente 11 números."
        });
      }

      // Teléfono solo números (si existe)
      if (telefono && !/^\d+$/.test(telefono)) {
        const roles = await db.Rol.findAll();
        return res.render("usuarios/create", {
          title: "Nuevo Usuario",
          user: req.session.user,
          currentPath: "/usuarios",
          roles,
          values: req.body,
          error: "El teléfono debe contener solo números."
        });
      }

      // Email básico
      if (!/^\S+@\S+\.\S+$/.test(correo)) {
        const roles = await db.Rol.findAll();
        return res.render("usuarios/create", {
          title: "Nuevo Usuario",
          user: req.session.user,
          currentPath: "/usuarios",
          roles,
          values: req.body,
          error: "Correo inválido."
        });
      }

      // =========================
      // DUPLICADOS
      // =========================
      const existeCuil = await db.Usuario.findOne({ where: { cuil } });
      if (existeCuil) {
        const roles = await db.Rol.findAll();
        return res.render("usuarios/create", {
          title: "Nuevo Usuario",
          user: req.session.user,
          currentPath: "/usuarios",
          roles,
          values: req.body,
          error: "Ya existe un usuario con ese CUIL."
        });
      }

      const existeCorreo = await db.Usuario.findOne({ where: { correo } });
      if (existeCorreo) {
        const roles = await db.Rol.findAll();
        return res.render("usuarios/create", {
          title: "Nuevo Usuario",
          user: req.session.user,
          currentPath: "/usuarios",
          roles,
          values: req.body,
          error: "Ese correo ya está registrado."
        });
      }

      // =========================
      // ROL (IMPORTANTE)
      // =========================
      // let rol = 2; // operario por defecto

      // if (req.session.user.id_rol === 1) {
      //  rol = parseInt(id_rol) || 2;
     // }
      const esAdmin = Number(req.session.user.id_rol ?? req.session.user.rol) === 1;
      if (!esAdmin) return res.status(403).send("No autorizado para asignar roles.");

      const rol = Number.parseInt(id_rol, 10);
      const rolSeleccionado = await db.Rol.findByPk(rol);
      if (!rolSeleccionado) {
        const roles = await db.Rol.findAll({ order: [["nombre", "ASC"]] });
        return res.status(400).render("usuarios/create", {
          title: "Nuevo Usuario", user: req.session.user, currentPath: "/usuarios",
          roles, values: req.body, error: "Seleccioná un rol válido.",
        });
      }

      if (password.length < 8) {
        const roles = await db.Rol.findAll({ order: [["nombre", "ASC"]] });
        return res.status(400).render("usuarios/create", {
          title: "Nuevo Usuario",
          user: req.session.user,
          currentPath: "/usuarios",
          roles,
          values: req.body,
          error: "La contraseña debe tener al menos 8 caracteres."
        });
      }

      // =========================
      // PASSWORD
      // =========================
      const password_hash = await bcrypt.hash(password, 10);

      await db.Usuario.create({
        cuil,
        nombre,
        apellido,
        correo,
        telefono: telefono || null,
        domicilio: domicilio || null,
        observaciones: observaciones || null,
        id_rol: rol,
        password_hash,
        activo: true
      });
      req.session.flash = { type: "success", message: "Usuario creado correctamente." };
      return res.redirect("/usuarios");

    } catch (error) {
      console.error(error);
      return res.status(500).send(error.message);
    }
  },

  show: async (req, res) => {
    try {
      const usuario = await db.Usuario.findByPk(req.params.id, {
        include: [{ model: db.Rol, as: "rol" }]
      });

      if (!usuario) return res.status(404).send("Usuario no encontrado");

      return res.render("usuarios/show", {
        title: "Detalle Usuario",
        user: req.session.user,
        currentPath: "/usuarios",
        usuario
      });

    } catch (error) {
      console.error(error);
      return res.status(500).send(error.message);
    }
  },

  edit: async (req, res) => {
    try {
      const usuario = await db.Usuario.findByPk(req.params.id);
      if (!usuario) return res.status(404).send("Usuario no encontrado");

      const roles = await db.Rol.findAll({
        order: [["nombre", "ASC"]]
      });

      return res.render("usuarios/edit", {
        title: "Editar Usuario",
        user: req.session.user,
        currentPath: "/usuarios",
        usuario,
        roles,
        error: null
      });

    } catch (error) {
      console.error(error);
      return res.status(500).send(error.message);
    }
  },

  update: async (req, res) => {
    try {
      const usuario = await db.Usuario.findByPk(req.params.id);
      if (!usuario) return res.status(404).send("Usuario no encontrado");

      const cuil = String(req.body.cuil || "").trim();

      // validación básica teléfono y cuil
      if (!CUIL_REGEX.test(cuil)) {
        const roles = await db.Rol.findAll({ order: [["nombre", "ASC"]] });
        return res.status(400).render("usuarios/edit", {
          title: "Editar Usuario",
          user: req.session.user,
          currentPath: "/usuarios",
          usuario,
          roles,
          error: "El CUIL debe contener exactamente 11 números."
        });
      }

      if (req.body.telefono && !/^\d+$/.test(req.body.telefono)) {
        return res.status(400).send("Teléfono inválido");
      }

      const usuarioConMismoCuil = await db.Usuario.findOne({
        where: {
          cuil,
          id_usuario: { [db.Sequelize.Op.ne]: usuario.id_usuario }
        }
      });
      if (usuarioConMismoCuil) {
        const roles = await db.Rol.findAll({ order: [["nombre", "ASC"]] });
        return res.status(409).render("usuarios/edit", {
          title: "Editar Usuario",
          user: req.session.user,
          currentPath: "/usuarios",
          usuario,
          roles,
          error: "Ya existe otro usuario con ese CUIL."
        });
      }

      const correo = String(req.body.correo || "").trim().toLowerCase();
      if (!/^\S+@\S+\.\S+$/.test(correo)) {
        const roles = await db.Rol.findAll({ order: [["nombre", "ASC"]] });
        return res.status(400).render("usuarios/edit", {
          title: "Editar Usuario", user: req.session.user, currentPath: "/usuarios",
          usuario, roles, error: "Ingresá un correo electrónico válido."
        });
      }

      const usuarioConMismoCorreo = await db.Usuario.findOne({
        where: {
          correo,
          id_usuario: { [db.Sequelize.Op.ne]: usuario.id_usuario }
        }
      });
      if (usuarioConMismoCorreo) {
        const roles = await db.Rol.findAll({ order: [["nombre", "ASC"]] });
        return res.status(409).render("usuarios/edit", {
          title: "Editar Usuario", user: req.session.user, currentPath: "/usuarios",
          usuario, roles, error: "Ese correo ya está registrado por otro usuario."
        });
      }

      usuario.cuil = cuil;
      usuario.nombre = req.body.nombre;
      usuario.apellido = req.body.apellido;
      usuario.correo = correo;
      usuario.telefono = req.body.telefono;
      usuario.domicilio = req.body.domicilio;
      usuario.observaciones = req.body.observaciones;

      if (Number(req.session.user.id_rol ?? req.session.user.rol) === 1) {
        const rolSeleccionado = await db.Rol.findByPk(Number(req.body.id_rol));
        if (!rolSeleccionado) return res.status(400).send("Rol inválido");
        usuario.id_rol = rolSeleccionado.id_rol;
      }

      if (req.body.password && req.body.password.trim() !== "") {
        if (req.body.password.length < 8) {
          return res.status(400).send("La contraseña debe tener al menos 8 caracteres");
        }
        usuario.password_hash = await bcrypt.hash(req.body.password, 10);
      }

      await usuario.save();
      req.session.flash = { type: "success", message: "Usuario actualizado correctamente." };
      return res.redirect("/usuarios");

    } catch (error) {
      console.error(error);
      return res.status(500).send(error.message);
    }
  },

  destroy: async (req, res) => {
  try {
    const usuario = await db.Usuario.findByPk(req.params.id);

    if (!usuario) {
      return res.status(404).send("Usuario no encontrado");
    }

    usuario.activo = !usuario.activo; // Invierte el estado
    await usuario.save();
    req.session.flash = {
      type: "success",
      message: usuario.activo ? "Usuario reactivado correctamente." : "Usuario dado de baja correctamente.",
    };
    return res.redirect("/usuarios");

  } catch (error) {
    console.error(error);
    return res.status(500).send(error.message);
  }
}
};

module.exports = usuariosController;
