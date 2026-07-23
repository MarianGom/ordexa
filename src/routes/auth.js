const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");

router.get("/login", authController.loginView);
router.post("/login", authController.loginProcess);
router.get("/recuperar-password", authController.forgotPasswordView);
router.post("/recuperar-password", authController.forgotPasswordProcess);
router.get("/restablecer-password/:token", authController.resetPasswordView);
router.post("/restablecer-password/:token", authController.resetPasswordProcess);
router.get("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error("Error cerrando sesión:", err);
      return res.redirect("/dashboard");
    }

    res.clearCookie("connect.sid"); // cookie default de express-session
    return res.redirect("/login");
  });
});

module.exports = router;
