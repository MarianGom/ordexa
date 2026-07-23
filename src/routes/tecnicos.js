const express = require("express");
const authMiddleware = require("../middlewares/authMiddleware");
const soloRoles = require("../middlewares/soloRoles");
const tecnicosController = require("../controllers/tecnicosController");

const router = express.Router();
const acceso = [authMiddleware, soloRoles("admin", "responsable")];

router.get("/tecnicos", ...acceso, tecnicosController.index);
router.get("/tecnicos/nuevo", ...acceso, tecnicosController.create);
router.post("/tecnicos", ...acceso, tecnicosController.store);
router.get("/tecnicos/:id/editar", ...acceso, tecnicosController.edit);
router.post("/tecnicos/:id/editar", ...acceso, tecnicosController.update);
router.post("/tecnicos/:id/estado", ...acceso, tecnicosController.toggle);

module.exports = router;
