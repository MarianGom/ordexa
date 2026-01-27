const express = require("express");
const router = express.Router();

const authMiddleware = require("../middlewares/authMiddleware");
const soloRoles = require("../middlewares/soloRoles");
const otAbierta = require("../middlewares/otAbierta");

const tareasController = require("../controllers/tareasController");

// Crear tarea (Responsable + Admin) + OT no cerrada
router.post(
  "/ordenes/:id/tareas",
  authMiddleware,
  soloRoles("responsable", "admin"),
  otAbierta,
  tareasController.create
);

// Editar tarea (asignar técnico) (Responsable + Admin) + OT no cerrada
router.post(
  "/tareas/:id/editar",
  authMiddleware,
  soloRoles("responsable", "admin"),
  otAbierta,
  tareasController.update
);

// Eliminar tarea (Responsable + Admin) + OT no cerrada
router.post(
  "/tareas/:id/eliminar",
  authMiddleware,
  soloRoles("responsable", "admin"),
  otAbierta,
  tareasController.destroy
);

module.exports = router;
