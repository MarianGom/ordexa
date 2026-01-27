const express = require('express');
const session = require('express-session');
const path = require("path");
const app = express();
const db = require('./db'); // Importamos el archivo que creamos arriba
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.urlencoded({ extended: true })); // leer formulario HTML
app.use(express.json()); // leer JSON (API/JS)

app.use(session({
    secret: 'ordexa_secret', 
    resave: false,
    saveUninitialized: false
}));

const userToLocals = require("./middlewares/userToLocals");
app.use(userToLocals);

app.use(express.static(path.join(__dirname, "public")));

const authRouter = require("./routes/auth");
const ordenesRouter = require("./routes/ordenes");
const tareasRouter = require("./routes/tareas");
const reportesRouter = require("./routes/reportes");
const dashboardRouter = require("./routes/dashboard");

app.use(dashboardRouter);
app.use(authRouter);
app.use(ordenesRouter);
app.use(tareasRouter);
app.use(reportesRouter);

app.get("/", (req, res) => res.redirect("/login"));

/* SERVER */
/*const PORT = 3000;
const linkcito = 'http://127.0.0.1:' + PORT;
app.listen(PORT, () =>
    console.log('¡Up!\nListo para usar en ', linkcito)
);*/

module.exports = app;

