const express = require("express");
const router = express.Router();

const authMiddleware = require("../middlewares/authMiddleware");
const soloRoles = require("../middlewares/soloRoles");
const otAbierta = require("../middlewares/otAbierta");
const ordenesController = require("../controllers/ordenesController");
const uploadOT = require("../middlewares/uploadOT");

// Crear OT (Operario + Admin)
router.get("/ordenes/nueva", authMiddleware, soloRoles("operario", "admin"), ordenesController.create);
router.post("/ordenes", authMiddleware, soloRoles("operario", "admin"),uploadOT.array("archivos", 5), ordenesController.store);

// Ver listado y detalle (cualquiera logueado)
router.get("/ordenes", authMiddleware, ordenesController.index);
router.get("/ordenes/:id", authMiddleware, ordenesController.show);

// Cambiar estado (Responsable + Admin) + OT no cerrada
router.post( "/ordenes/:id/estado",authMiddleware,  soloRoles("responsable", "admin"),  otAbierta,ordenesController.updateEstado);
router.get("/ordenes/:id/editar",
  authMiddleware,
  soloRoles("responsable", "admin"),
  otAbierta,
  ordenesController.edit
);

router.post("/ordenes/:id/editar",
  authMiddleware,
  soloRoles("responsable", "admin"),
  otAbierta,
  ordenesController.update
);
module.exports = router;
