const express = require("express");
const router = express.Router();

const authMiddleware = require("../middlewares/authMiddleware");
const soloRoles = require("../middlewares/soloRoles");
const reportesController = require("../controllers/reportesController");

// vista principal de reportes
router.get("/reportes", authMiddleware, soloRoles("admin", "operario", "responsable"), reportesController.index);

// reportes JSON (para que después lo uses con gráficos si querés)
router.get("/api/reportes/por-estado",authMiddleware,soloRoles("admin", "responsable"), reportesController.porEstado);

router.get("/api/reportes/por-responsable",authMiddleware,soloRoles("admin", "responsable"),reportesController.porResponsable);

router.get("/api/reportes/por-fechas",authMiddleware, soloRoles("admin", "responsable"),reportesController.porFechas);

router.get("/api/reportes/vencidas",authMiddleware,soloRoles("admin", "responsable"),reportesController.vencidas);

module.exports = router;
