const express = require("express");
const db = require("../database/models");
const authMiddleware = require("../middlewares/authMiddleware");

const router = express.Router();

router.get("/perfil", authMiddleware, async (req, res) => {
  try {
    const usuario = await db.Usuario.findByPk(req.session.user.id_usuario, {
      attributes: { exclude: ["password_hash"] },
      include: [{ model: db.Rol, as: "rol", required: false }],
    });

    if (!usuario || !usuario.activo) {
      return req.session.destroy(() => res.redirect("/login"));
    }

    return res.render("perfil/index", {
      title: "Mi perfil", user: req.session.user, currentPath: "/perfil", usuario,
    });
  } catch (error) {
    console.error("Error cargando perfil:", error);
    return res.status(500).send("Error al cargar el perfil");
  }
});

module.exports = router;
