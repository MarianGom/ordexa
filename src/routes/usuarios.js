const express = require("express");
const router = express.Router();

const usuariosController = require("../controllers/usuariosController");
const soloRoles = require("../middlewares/soloRoles");

router.get(
  "/usuarios",
  soloRoles("admin"),
  usuariosController.index
);

router.get(
  "/usuarios/create",
  soloRoles("admin"),
  usuariosController.create
);

router.post(
  "/usuarios",
  soloRoles("admin"),
  usuariosController.store
);

router.get(
  "/usuarios/:id",
  soloRoles("admin"),
  usuariosController.show
);

router.get(
  "/usuarios/:id/edit",
  soloRoles("admin"),
  usuariosController.edit
);

router.post(
  "/usuarios/:id",
  soloRoles("admin"),
  usuariosController.update
);

router.post(
  "/usuarios/:id/delete",
  soloRoles("admin"),
  usuariosController.destroy
);

module.exports = router;