const multer = require("multer");
const path = require("path");
const fs = require("fs");

const dir = path.join(__dirname, "..", "public", "uploads", "ot");
fs.mkdirSync(dir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, dir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const safeName = Date.now() + "-" + Math.round(Math.random() * 1e9) + ext;
    cb(null, safeName);
  },
});

module.exports = multer({
  storage,
  limits: { fileSize: 8 * 1024 * 1024 }, // 8MB c/u
});
