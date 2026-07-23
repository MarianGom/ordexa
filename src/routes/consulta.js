const express = require("express");
const consultaController = require("../controllers/consultaController");

const router = express.Router();
router.get("/consulta", consultaController.index);

module.exports = router;
