const bcrypt = require("bcryptjs");
const db = require("../database/models");
const { enviarRecuperacionPassword } = require("../services/notificaciones");
const {
  createPasswordResetToken,
  verifyPasswordResetToken,
  getUserIdFromToken,
} = require("../utils/passwordResetToken");

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

  forgotPasswordView: (req, res) => res.render("usuarios/recuperar-password", {
    error: null, message: null,
  }),

  forgotPasswordProcess: async (req, res) => {
    const message = "Si el correo corresponde a una cuenta activa, recibirás un enlace para restablecer la contraseña.";
    try {
      const correo = String(req.body.correo || "").trim().toLowerCase();
      const usuario = await db.Usuario.findOne({ where: { correo, activo: true } });
      if (usuario) {
        try {
          const resultado = await enviarRecuperacionPassword(
            usuario,
            createPasswordResetToken(usuario),
          );
          if (!resultado.enviada) console.warn("Recuperación no enviada:", resultado.motivo);
        } catch (errorCorreo) {
          // No se revela al visitante si el correo existe ni el estado del SMTP.
          console.error("SMTP recuperación:", errorCorreo.code || errorCorreo.message);
        }
      }
      return res.render("usuarios/recuperar-password", { error: null, message });
    } catch (error) {
      console.error("Error solicitando recuperación:", error);
      return res.status(500).render("usuarios/recuperar-password", {
        error: "No pudimos procesar la solicitud. Intentá nuevamente más tarde.",
        message: null,
      });
    }
  },

  resetPasswordView: async (req, res) => {
    const token = req.params.token;
    const usuario = await db.Usuario.findByPk(getUserIdFromToken(token));
    const valid = Boolean(usuario?.activo && verifyPasswordResetToken(token, usuario));
    return res.status(valid ? 200 : 400).render("usuarios/restablecer-password", {
      token, valid, success: false,
      error: valid ? null : "El enlace es inválido, ya fue utilizado o venció.",
    });
  },

  resetPasswordProcess: async (req, res) => {
    const token = req.params.token;
    try {
      const usuario = await db.Usuario.findByPk(getUserIdFromToken(token));
      if (!usuario?.activo || !verifyPasswordResetToken(token, usuario)) {
        return res.status(400).render("usuarios/restablecer-password", {
          token, valid: false, success: false,
          error: "El enlace es inválido, ya fue utilizado o venció.",
        });
      }
      const password = String(req.body.password || "");
      const confirmation = String(req.body.password_confirmation || "");
      const error = password.length < 8
        ? "La contraseña debe tener al menos 8 caracteres."
        : password !== confirmation ? "Las contraseñas no coinciden." : null;
      if (error) {
        return res.status(400).render("usuarios/restablecer-password", {
          token, valid: true, success: false, error,
        });
      }
      usuario.password_hash = await bcrypt.hash(password, 10);
      await usuario.save();
      return res.render("usuarios/restablecer-password", {
        token: null, valid: false, success: true, error: null,
      });
    } catch (error) {
      console.error("Error restableciendo contraseña:", error);
      return res.status(500).render("usuarios/restablecer-password", {
        token, valid: true, success: false,
        error: "No pudimos cambiar la contraseña. Intentá nuevamente.",
      });
    }
  },

  logout: (req, res) => {
    req.session.destroy(() => res.redirect("usuarios/login"));
  }
};

module.exports = authController;
