const ROLE_IDS = { admin: 1, operario: 2, responsable: 3 };

module.exports = (...allowed) => (req, res, next) => {
  const user = req.session?.user;
  if (!user) return res.status(401).send("Sesión inválida");

  const allowedIds = allowed.map(r => ROLE_IDS[r]).filter(Boolean);
  const userRole = Number(user.id_rol ?? user.rol);

  if (!allowedIds.includes(userRole)) {
    return res.status(403).send("No autorizado");
  }

  next();
};

