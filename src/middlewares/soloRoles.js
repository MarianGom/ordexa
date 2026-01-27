// src/middlewares/soloRoles.js
const ROLE_IDS = {
  admin: 1,
  operario: 2,
  responsable: 3,
};

module.exports = (...allowed) => {
  return (req, res, next) => {
    const user = req.session?.user;
    if (!user) return res.status(401).send("Sesión inválida");

    // user.rol viene como número (id_rol)
    const allowedIds = allowed.map((r) => ROLE_IDS[r]).filter(Boolean);

    if (!allowedIds.includes(user.rol)) {
      return res.status(403).send("No autorizado");
    }

    next();
  };
};
