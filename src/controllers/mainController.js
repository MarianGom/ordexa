const path = require("path");

const db = require("../database/models");

const mainController = {
  index: (req, res) => {
    res.send("Home ORDEXA");
  }
};

module.exports = mainController;

