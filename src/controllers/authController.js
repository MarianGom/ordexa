const bcrypt = require("bcryptjs");
const db = require("../database/models");

const authController = {
  loginView: (req, res) => {
    if (req.session.user) return res.redirect("/dashboard");
    return res.render("usuarios/login", { error: null });
  },

  loginProcess: async (req, res) => {
    try {
      const { correo, password } = req.body;

      const usuario = await db.Usuario.findOne({ where: { correo } });

      if (!usuario || !usuario.activo) {
        return res.status(401).render("usuarios/login", { error: "Correo o contraseña incorrectos." });
      }

      const ok = bcrypt.compareSync(password, usuario.password_hash);
      if (!ok) {
        return res.status(401).render("usuarios/login", { error: "Correo o contraseña incorrectos." });
      }

      req.session.user = {
        id_usuario: usuario.id_usuario,
        rol: usuario.id_rol,
        nombre: usuario.nombre,
        apellido: usuario.apellido,
        correo: usuario.correo
      };

      return res.redirect("/dashboard");
    } catch (error) {
      console.error("Login error:", error);
      return res.status(500).render("usuarios/login", { error: "Error interno. Probá de nuevo." });
    }
  },

  logout: (req, res) => {
    req.session.destroy(() => res.redirect("usuarios/login"));
  }
};

module.exports = authController;
