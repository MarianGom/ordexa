const db = require("../database/models");
const bcrypt = require("bcryptjs");

const usuariosController = {

  index: async (req, res) => {
    try {
      const usuarios = await db.Usuario.findAll({
        include: [
          {
            model: db.Rol,
            as: "rol",
            attributes: ["id_rol", "nombre"]
          }
        ],
        order: [
          ["activo", "DESC"],
          ["apellido", "ASC"],
          ["nombre", "ASC"]
        ]
      });

      return res.render("usuarios/index", {
        title: "Gestionar Usuarios",
        user: req.session.user,
        currentPath: "/usuarios",
        usuarios
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

      // CUIL solo números
      if (!/^\d+$/.test(cuil)) {
        const roles = await db.Rol.findAll();
        return res.render("usuarios/create", {
          title: "Nuevo Usuario",
          user: req.session.user,
          currentPath: "/usuarios",
          roles,
          values: req.body,
          error: "El CUIL debe contener solo números."
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

      // validación básica teléfono y cuil
      if (!/^\d+$/.test(req.body.cuil)) {
        return res.status(400).send("CUIL inválido");
      }

      if (req.body.telefono && !/^\d+$/.test(req.body.telefono)) {
        return res.status(400).send("Teléfono inválido");
      }

      usuario.cuil = req.body.cuil;
      usuario.nombre = req.body.nombre;
      usuario.apellido = req.body.apellido;
      usuario.correo = req.body.correo;
      usuario.telefono = req.body.telefono;
      usuario.domicilio = req.body.domicilio;
      usuario.observaciones = req.body.observaciones;

      if (req.session.user.id_rol === 1) {
        usuario.id_rol = req.body.id_rol;
      }

      if (req.body.password && req.body.password.trim() !== "") {
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
