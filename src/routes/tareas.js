const express = require("express");
const router = express.Router();

const authMiddleware = require("../middlewares/authMiddleware");
const soloRoles = require("../middlewares/soloRoles");
const otAbiertaPorOrden = require("../middlewares/otAbiertaPorOrden");
const otAbiertaPorTarea = require("../middlewares/otAbiertaPorTarea");
const soloResponsableDeOT = require("../middlewares/soloResponsableDeOT");
const tareasController = require("../controllers/tareasController");

// ===== NUEVA TAREA (id = num_orden) =====
router.get(
  "/ordenes/:id/tareas/nueva",
  authMiddleware,
  soloRoles("responsable", "admin"),
  otAbiertaPorOrden,
  soloResponsableDeOT,
  tareasController.newForm
);

// ===== CREAR TAREA (id = num_orden) =====
router.post(
  "/ordenes/:id/tareas",
  authMiddleware,
  soloRoles("responsable", "admin"),
  otAbiertaPorOrden,
  soloResponsableDeOT,
  tareasController.create
);

// ===== FORM EDITAR (id = id_tarea) =====
router.get(
  "/tareas/:id/editar",
  authMiddleware,
  soloRoles("responsable", "admin"),
  otAbiertaPorTarea,      // opcional pero recomendable (bloquea si la OT está cerrada)
  soloResponsableDeOT,
  tareasController.editForm
);

// ===== GUARDAR EDITAR (id = id_tarea) =====
router.post(
  "/tareas/:id/editar",
  authMiddleware,
  soloRoles("responsable", "admin"),
  otAbiertaPorTarea,
  soloResponsableDeOT,
  tareasController.update
);

// ===== ELIMINAR (id = id_tarea) =====
router.post(
  "/tareas/:id/eliminar",
  authMiddleware,
  soloRoles("responsable", "admin"),
  otAbiertaPorTarea,
  soloResponsableDeOT,
  tareasController.destroy
);

module.exports = router;
