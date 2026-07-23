const express = require("express");
const router = express.Router();

const authMiddleware = require("../middlewares/authMiddleware");
const soloRoles = require("../middlewares/soloRoles");
const reportesController = require("../controllers/reportesController");

// vista principal de reportes
router.get("/reportes", authMiddleware, soloRoles("admin", "operario", "responsable"), reportesController.index);

// reportes JSON (para que después lo uses con gráficos si querés)
router.get("/api/reportes/por-estado", authMiddleware, soloRoles("admin"), reportesController.porEstado);

router.get("/api/reportes/por-responsable", authMiddleware, soloRoles("admin", "operario"), reportesController.porResponsable);

router.get("/api/reportes/por-fechas", authMiddleware, soloRoles("admin"), reportesController.porFechas);

router.get("/api/reportes/vencidas", authMiddleware, soloRoles("admin"), reportesController.vencidas);

module.exports = router;
