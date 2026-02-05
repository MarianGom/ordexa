const express = require("express");
const router = express.Router();

const authMiddleware = require("../middlewares/authMiddleware");
const soloRoles = require("../middlewares/soloRoles");
const otAbiertaPorOrden = require("../middlewares/otAbiertaPorOrden");
const otAbiertaPorTarea = require("../middlewares/otAbiertaPorTarea");
const tareasController = require("../controllers/tareasController");

// ===== NUEVA TAREA (id = num_orden) =====
router.get(
  "/ordenes/:id/tareas/nueva",
  authMiddleware,
  soloRoles("responsable", "admin"),
  otAbiertaPorOrden,
  tareasController.newForm
);

// ===== CREAR TAREA (id = num_orden) =====
router.post(
  "/ordenes/:id/tareas",
  authMiddleware,
  soloRoles("responsable", "admin"),
  otAbiertaPorOrden,
  tareasController.create
);

// ===== FORM EDITAR (id = id_tarea) =====
router.get(
  "/tareas/:id/editar",
  authMiddleware,
  soloRoles("responsable", "admin"),
  otAbiertaPorTarea,      // opcional pero recomendable (bloquea si la OT está cerrada)
  tareasController.editForm
);

// ===== GUARDAR EDITAR (id = id_tarea) =====
router.post(
  "/tareas/:id/editar",
  authMiddleware,
  soloRoles("responsable", "admin"),
  otAbiertaPorTarea,
  tareasController.update
);

// ===== ELIMINAR (id = id_tarea) =====
router.post(
  "/tareas/:id/eliminar",
  authMiddleware,
  soloRoles("responsable", "admin"),
  otAbiertaPorTarea,
  tareasController.destroy
);

module.exports = router;